import { elevenLabsConfigured, elevenLabsStreamLanguages, elevenLabsStreamModel } from './env.js';
import { HttpError, sanitizeLog } from './errors.js';
import { languageOf } from './lesson.js';
import { elevenDefaultVoice, elevenId, mapElevenError, prepareNarrationText } from './narration.js';

export const STREAM_SAMPLE_RATE = 24000;
const BYTES_PER_SEC = STREAM_SAMPLE_RATE * 2;
const ELEVEN_API = 'https://api.elevenlabs.io/v1';
const ELEVEN_WS = 'wss://api.elevenlabs.io/v1';
const WORD_RE = /[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FFA-Za-z0-9]/;

export function liveVoiceAvailable(language) {
  return elevenLabsConfigured() && elevenLabsStreamLanguages().has(languageOf(language));
}

export function liveVoiceStatus() {
  const on = elevenLabsConfigured();
  return {
    enabled: on && elevenLabsStreamLanguages().size > 0,
    languages: on ? [...elevenLabsStreamLanguages()] : [],
    model: on ? elevenLabsStreamModel() : '',
    sampleRate: STREAM_SAMPLE_RATE,
    chat: on && typeof WebSocket === 'function'
  };
}

export function countSpokenWords(text) {
  return String(text || '').split(/\s+/).filter(w => WORD_RE.test(w)).length;
}

/** ElevenLabs accepts voice speeds from 0.7 to 1.2. */
export function clampVoiceSpeed(speed) {
  const n = Number(speed);
  if (!Number.isFinite(n)) return 1;
  return Math.min(1.2, Math.max(0.7, n));
}

/** Builds words from streamed character timings, carrying a partial word across chunks. */
export class WordAssembler {
  constructor() { this.cur = null; }

  push(chars, starts, ends, shift = 0) {
    const out = [];
    for (let i = 0; i < (chars || []).length; i++) {
      const ch = String(chars[i] ?? '');
      if (!ch.trim()) {
        if (this.cur) out.push(this.cur);
        this.cur = null;
        continue;
      }
      const s = (Number(starts && starts[i]) || 0) + shift;
      const e = Math.max(s, (Number(ends && ends[i]) || 0) + shift);
      if (!this.cur) this.cur = { text: ch, start: s, end: e };
      else { this.cur.text += ch; this.cur.end = Math.max(this.cur.end, e); }
    }
    return clean(out);
  }

  flush() {
    const out = this.cur ? [this.cur] : [];
    this.cur = null;
    return clean(out);
  }
}

function clean(words) {
  return words
    .filter(w => WORD_RE.test(w.text))
    .map(w => ({ text: w.text, start: Number(w.start.toFixed(3)), end: Number(Math.max(w.end, w.start + 0.05).toFixed(3)) }));
}

/** Keeps PCM16 chunks sample-aligned when a frame splits a sample. */
class PcmCarry {
  constructor() { this.rest = null; }
  take(b64) {
    let pcm = Buffer.from(b64, 'base64');
    if (this.rest) { pcm = Buffer.concat([this.rest, pcm]); this.rest = null; }
    if (pcm.length % 2) { this.rest = pcm.subarray(pcm.length - 1); pcm = pcm.subarray(0, pcm.length - 1); }
    return pcm;
  }
}

/** Splits streamed chat text into speakable sentences and skips fenced code. */
export class SpeechBuffer {
  constructor(language) {
    this.lang = languageOf(language);
    this.buf = '';
    this.inCode = false;
  }

  push(delta) {
    this.buf += String(delta || '');
    const out = [];
    for (;;) {
      if (this.inCode) {
        const close = this.buf.indexOf('```');
        if (close < 0) { this.buf = this.buf.slice(-2); break; }
        this.buf = this.buf.slice(close + 3);
        this.inCode = false;
        continue;
      }
      const fence = this.buf.indexOf('```');
      const m = /[.!?။]+["')\]]?(\s|$)|\n/.exec(this.buf);
      const boundary = m && m.index + m[0].length < this.buf.length ? m.index + m[0].length : -1;
      if (fence >= 0 && (boundary < 0 || fence < boundary)) {
        this.emit(out, this.buf.slice(0, fence));
        this.buf = this.buf.slice(fence + 3);
        this.inCode = true;
        continue;
      }
      if (boundary > 0) {
        this.emit(out, this.buf.slice(0, boundary));
        this.buf = this.buf.slice(boundary);
        continue;
      }
      if (this.buf.length > 240) {
        const cut = this.buf.lastIndexOf(' ', 200);
        if (cut > 40) {
          this.emit(out, this.buf.slice(0, cut));
          this.buf = this.buf.slice(cut);
          continue;
        }
      }
      break;
    }
    return out;
  }

  end() {
    const out = [];
    if (!this.inCode) this.emit(out, this.buf.replace(/`+$/, ''));
    this.buf = '';
    return out;
  }

  emit(out, text) {
    const spoken = prepareNarrationText(text, this.lang);
    if (spoken) out.push(spoken + ' ');
  }
}

/**
 * Streams one lesson section from ElevenLabs over HTTP.
 * onStart runs once before any audio; onChunk receives { audio (PCM16 base64), words }.
 */
export async function streamNarration({ text, language, voice, speed, signal, onStart, onChunk }) {
  const lang = languageOf(language);
  if (!liveVoiceAvailable(lang)) {
    throw new HttpError(409, 'stream_unavailable', 'Live voice streaming is not enabled for this lesson language.');
  }
  const spoken = prepareNarrationText(text, lang);
  if (!spoken) throw new HttpError(400, 'empty', 'There is nothing to narrate in this section.');
  const voiceId = elevenId(voice) || await elevenDefaultVoice();
  const model = elevenLabsStreamModel();
  const res = await fetch(`${ELEVEN_API}/text-to-speech/${encodeURIComponent(voiceId)}/stream/with-timestamps?output_format=pcm_${STREAM_SAMPLE_RATE}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY.trim(),
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      text: spoken,
      model_id: model,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: clampVoiceSpeed(speed) }
    }),
    signal
  });
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    const detail = body && body.detail ? (body.detail.message || body.detail.status || JSON.stringify(body.detail)) : res.statusText;
    throw mapElevenError(res.status, detail);
  }

  onStart({ text: spoken, totalWords: countSpokenWords(spoken), sampleRate: STREAM_SAMPLE_RATE, voice: voiceId, model, provider: 'elevenlabs' });

  const words = new WordAssembler();
  const carry = new PcmCarry();
  const decoder = new TextDecoder();
  let pending = '';
  let bytes = 0;

  const handle = line => {
    if (!line.trim()) return;
    let obj;
    try { obj = JSON.parse(line); } catch { return; }
    const offset = bytes / BYTES_PER_SEC;
    let audio = '';
    if (obj.audio_base64) {
      const pcm = carry.take(obj.audio_base64);
      bytes += pcm.length;
      audio = pcm.toString('base64');
    }
    const al = obj.alignment || obj.normalized_alignment;
    let found = [];
    if (al && Array.isArray(al.characters) && al.characters.length) {
      const starts = al.character_start_times_seconds || [];
      const ends = al.character_end_times_seconds || [];
      const first = Number(starts[0]) || 0;
      // Some responses time each chunk from zero; shift those onto the section timeline.
      const shift = offset > 0.25 && first + 0.25 < offset ? offset : 0;
      found = words.push(al.characters, starts, ends, shift);
    }
    if (audio || found.length) onChunk({ audio, words: found });
  };

  for await (const part of res.body) {
    pending += decoder.decode(part, { stream: true });
    let nl;
    while ((nl = pending.indexOf('\n')) >= 0) {
      handle(pending.slice(0, nl));
      pending = pending.slice(nl + 1);
    }
  }
  pending += decoder.decode();
  if (pending) handle(pending);
  const tail = words.flush();
  if (tail.length) onChunk({ audio: '', words: tail });
  return { duration: Number((bytes / BYTES_PER_SEC).toFixed(3)) };
}

/**
 * Opens an ElevenLabs input-streaming WebSocket and speaks text as it is pushed.
 * Returns null when live chat voice is unavailable.
 */
export function openLiveSpeech({ language, voice, speed, onAudio }) {
  const lang = languageOf(language);
  if (!liveVoiceAvailable(lang) || typeof WebSocket !== 'function') return null;
  const speech = new SpeechBuffer(lang);
  const carry = new PcmCarry();
  const queue = [];
  let ws = null;
  let open = false;
  let finished = false;
  let resolveDone;
  const done = new Promise(r => { resolveDone = r; });
  const finish = () => {
    if (finished) return;
    finished = true;
    try { if (ws && ws.readyState <= 1) ws.close(); } catch { /* ignore */ }
    resolveDone();
  };
  const send = obj => {
    if (finished) return;
    if (open && ws.readyState === 1) ws.send(JSON.stringify(obj));
    else queue.push(obj);
  };

  (async () => {
    const voiceId = elevenId(voice) || await elevenDefaultVoice();
    const model = elevenLabsStreamModel();
    if (finished) return;
    ws = new WebSocket(`${ELEVEN_WS}/text-to-speech/${encodeURIComponent(voiceId)}/stream-input?model_id=${encodeURIComponent(model)}&output_format=pcm_${STREAM_SAMPLE_RATE}&inactivity_timeout=60`);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        text: ' ',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: clampVoiceSpeed(speed) },
        generation_config: { chunk_length_schedule: [50, 90, 140, 200] },
        xi_api_key: process.env.ELEVENLABS_API_KEY.trim()
      }));
      open = true;
      while (queue.length) ws.send(JSON.stringify(queue.shift()));
    };
    ws.onmessage = ev => {
      let obj;
      try { obj = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString('utf8')); } catch { return; }
      if (obj.audio) {
        const pcm = carry.take(obj.audio);
        if (pcm.length) onAudio(pcm.toString('base64'));
      }
      if (obj.error || (obj.message && !obj.audio && !obj.isFinal)) {
        console.error(JSON.stringify({ at: new Date().toISOString(), code: 'eleven_ws', message: sanitizeLog(obj.message || obj.error) }));
      }
      if (obj.isFinal) finish();
    };
    ws.onerror = () => {
      console.error(JSON.stringify({ at: new Date().toISOString(), code: 'eleven_ws', message: 'websocket error' }));
      finish();
    };
    ws.onclose = () => finish();
  })().catch(err => {
    console.error(JSON.stringify({ at: new Date().toISOString(), code: 'eleven_ws', message: sanitizeLog(err && err.message) }));
    finish();
  });

  return {
    sampleRate: STREAM_SAMPLE_RATE,
    push(delta) {
      for (const text of speech.push(delta)) send({ text });
    },
    async end(timeoutMs = 25000) {
      for (const text of speech.end()) send({ text });
      send({ text: '' });
      let timer;
      await Promise.race([done, new Promise(r => { timer = setTimeout(r, timeoutMs); })]);
      clearTimeout(timer);
      finish();
    },
    cancel: finish
  };
}
