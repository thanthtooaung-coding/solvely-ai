"""Long-lived local TTS worker. One JSON object per line on stdin, one on stdout.

Library logs are sent to stderr so they never break the protocol.
Models stay in memory after the first request for that provider.
"""
import base64
import io
import json
import os
import re
import sys
import traceback

os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")

_STDOUT = sys.stdout
sys.stdout = sys.stderr

_MODELS = {}


def send(obj):
    _STDOUT.write(json.dumps(obj, ensure_ascii=False) + "\n")
    _STDOUT.flush()


def cached(key, factory):
    if key not in _MODELS:
        _MODELS[key] = factory()
    return _MODELS[key]


def pieces(text, limit=420):
    text = re.sub(r"\s+", " ", str(text or "")).strip()
    if len(text) <= limit:
        return [text] if text else []
    bits = re.split(r"(?<=[။.!?])\s+", text)
    out, cur = [], ""
    for bit in bits:
        bit = bit.strip()
        if not bit:
            continue
        while len(bit) > limit:
            out.append(bit[:limit])
            bit = bit[limit:]
        if cur and len(cur) + 1 + len(bit) > limit:
            out.append(cur)
            cur = bit
        else:
            cur = (cur + " " + bit).strip()
    if cur:
        out.append(cur)
    return out


def wav_bytes(audio, rate):
    import numpy as np
    import soundfile as sf
    data = np.asarray(audio, dtype=np.float32).reshape(-1)
    if data.size == 0:
        raise RuntimeError("The voice model returned silence.")
    buf = io.BytesIO()
    sf.write(buf, data, int(rate), format="WAV")
    return buf.getvalue()


def join_audio(chunks):
    import numpy as np
    return np.concatenate([np.asarray(c, dtype=np.float32).reshape(-1) for c in chunks if len(c)])


def speak_mms(text, language):
    import numpy as np
    import torch
    from transformers import AutoTokenizer, VitsModel

    model_id = "facebook/mms-tts-eng" if language == "en" else "facebook/mms-tts-mya"
    pair = cached(model_id, lambda: (
        VitsModel.from_pretrained(model_id),
        AutoTokenizer.from_pretrained(model_id)
    ))
    model, tokenizer = pair
    model.eval()
    chunks = []
    for part in pieces(text, 300):
        inputs = tokenizer(part, return_tensors="pt")
        with torch.no_grad():
            wave = model(**inputs).waveform
        chunks.append(wave.squeeze().cpu().numpy())
        chunks.append(np.zeros(int(model.config.sampling_rate * 0.12), dtype=np.float32))
    return wav_bytes(join_audio(chunks), model.config.sampling_rate)


def speak_vox(text, _language):
    import numpy as np
    from voxcpm import VoxCPM

    model = cached("voxcpm2", lambda: VoxCPM.from_pretrained("openbmb/VoxCPM2", load_denoiser=False))
    rate = int(getattr(getattr(model, "tts_model", None), "sample_rate", 48000) or 48000)
    chunks = []
    for part in pieces(text, 500):
        wav = model.generate(text=part, cfg_value=2.0, inference_timesteps=10)
        chunks.append(np.asarray(wav, dtype=np.float32).reshape(-1))
        chunks.append(np.zeros(int(rate * 0.12), dtype=np.float32))
    return wav_bytes(join_audio(chunks), rate)


def speak_f5(text):
    import soundfile as sf
    import tempfile

    def load():
        from f5_myanmar_tts import MyanmarTTS
        return MyanmarTTS()

    tts = cached("f5-myanmar", load)
    chunks = []
    rate = 24000
    for part in pieces(text, 400):
        handle = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        handle.close()
        try:
            tts.speak(part, output_file=handle.name)
            audio, file_rate = sf.read(handle.name, dtype="float32")
            rate = int(file_rate or rate)
            chunks.append(audio)
        finally:
            try:
                os.remove(handle.name)
            except OSError:
                pass
    if not chunks:
        raise RuntimeError("F5 Myanmar returned no audio.")
    return wav_bytes(join_audio(chunks), rate)


def speak_kokoro(text):
    import numpy as np

    def load():
        try:
            from kokoro import KPipeline
        except ImportError:
            sys.stderr.write(
                "Kokoro does not install on Python 3.13 or newer. Speaking English with facebook/mms-tts-eng.\n"
            )
            return None
        return KPipeline(lang_code="a")

    pipe = cached("kokoro", load)
    if pipe is None:
        return speak_mms(text, "en")
    chunks = []
    for _gs, _ps, audio in pipe(text, voice="af_heart"):
        chunks.append(np.asarray(audio, dtype=np.float32).reshape(-1))
    if not chunks:
        raise RuntimeError("Kokoro returned no audio.")
    return wav_bytes(join_audio(chunks), 24000)


def speak(provider, language, text):
    if provider == "mms":
        return speak_mms(text, language)
    if provider == "voxcpm2":
        return speak_vox(text, language)
    if provider == "f5kokoro":
        if language == "my":
            return speak_f5(text)
        return speak_kokoro(text)
    raise RuntimeError("Unknown local voice model: " + provider)


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            provider = str(req.get("provider") or "")
            language = "my" if req.get("language") == "my" else "en"
            text = str(req.get("text") or "").strip()
            if not text:
                raise RuntimeError("There is nothing to speak.")
            audio = speak(provider, language, text[:4000])
            send({
                "ok": True,
                "id": req.get("id"),
                "audioBase64": base64.b64encode(audio).decode("ascii")
            })
        except Exception as err:
            traceback.print_exc(file=sys.stderr)
            message = str(err).strip() or err.__class__.__name__
            send({"ok": False, "id": req.get("id") if "req" in locals() else None, "error": message[:500]})


if __name__ == "__main__":
    main()
