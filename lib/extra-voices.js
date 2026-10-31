import { HttpError, sanitizeLog } from './errors.js';
import { estimateSpokenWords } from './local-voice.js';

const PROVIDERS = new Set(['aivoov', 'freetts', 'narakeet']);

export function isHttpVoiceProvider(id) {
  return PROVIDERS.has(String(id || '').trim().toLowerCase());
}

const VOICES = {
  aivoov: { my: 'AIVOOV_VOICE_MY', en: 'AIVOOV_VOICE_EN', myDefault: 'my-MM-NilarNeural', enDefault: 'en-US-AriaNeural' },
  freetts: { my: 'FREETTS_VOICE_MY', en: 'FREETTS_VOICE_EN', myDefault: 'my-MM-NilarNeural', enDefault: 'en-US-JennyNeural' },
  narakeet: { my: 'NARAKEET_VOICE_MY', en: 'NARAKEET_VOICE_EN', myDefault: 'sanda', enDefault: 'linda' }
};

const KEYS = { aivoov: 'AIVOOV_API_KEY', freetts: 'FREETTS_API_KEY', narakeet: 'NARAKEET_API_KEY' };
const NAMES = {
  aivoov: 'AiVOOV',
  freetts: 'FreeTTS',
  narakeet: 'Narakeet'
};

function keyFor(provider) {
  const name = KEYS[provider];
  const key = (process.env[name] || '').trim();
  if (!key || key.startsWith('your_')) {
    throw new HttpError(503, 'local_tts', `Add ${name} to the server .env file and restart.`);
  }
  return key;
}

function voiceFor(provider, language) {
  const row = VOICES[provider];
  const envName = language === 'my' ? row.my : row.en;
  const configured = (process.env[envName] || '').trim();
  return configured || (language === 'my' ? row.myDefault : row.enDefault);
}

function clipError(message) {
  const text = sanitizeLog(message).replace(/\s+/g, ' ').trim();
  return (text || 'The voice service returned an error.').slice(0, 400);
}

async function readAudio(res, label) {
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new HttpError(res.status === 401 || res.status === 403 ? 401 : 502, 'local_tts', clipError(`${label} ${res.status}: ${detail}`));
  }
  const type = res.headers.get('content-type') || '';
  if (type.includes('audio') || type.includes('octet-stream') || type.includes('mpeg')) {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 80) throw new HttpError(502, 'local_tts', `${label} returned empty audio.`);
    const mime = type.includes('wav') ? 'audio/wav' : type.includes('ogg') ? 'audio/ogg' : 'audio/mpeg';
    return { buf, mime };
  }
  const data = await res.json().catch(() => ({}));
  const url = data.audio_url || data.url || data.file_url || data.path || '';
  if (url) return { url: String(url) };
  if (data.file_id) return { fileId: String(data.file_id) };
  const b64 = data.audioBase64 || data.audio_base64 || data.transcribe_data || data.audio || '';
  if (typeof b64 === 'string' && b64.length > 80) {
    return { buf: Buffer.from(b64, 'base64'), mime: 'audio/mpeg' };
  }
  throw new HttpError(502, 'local_tts', clipError(data.error || data.message || `${label} did not return audio.`));
}

function pieces(text, limit) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean ? [clean] : [];
  const bits = clean.split(/(?<=[။.!?])\s+/);
  const out = [];
  let cur = '';
  for (const bit of bits) {
    if (bit.length > limit) {
      if (cur) out.push(cur);
      for (let i = 0; i < bit.length; i += limit) out.push(bit.slice(i, i + limit));
      cur = '';
      continue;
    }
    if (cur && cur.length + 1 + bit.length > limit) {
      out.push(cur);
      cur = bit;
    } else cur = cur ? `${cur} ${bit}` : bit;
  }
  if (cur) out.push(cur);
  return out;
}

async function aivoov(text, language, signal, http) {
  const form = new FormData();
  form.append('voice_id', voiceFor('aivoov', language));
  form.append('transcribe_text[]', text);
  form.append('engine', 'neural');
  const res = await http('https://aivoov.com/api/v1/transcribe', {
    method: 'POST',
    headers: { 'X-API-KEY': keyFor('aivoov'), Accept: 'application/json, audio/mpeg' },
    body: form,
    signal
  });
  const audio = await readAudio(res, 'AiVOOV');
  if (audio.buf) return audio;
  const file = await http(audio.url, { signal });
  return readAudio(file, 'AiVOOV');
}

async function freetts(text, language, signal, http) {
  const key = keyFor('freetts');
  const chunks = [];
  let mime = 'audio/mpeg';
  for (const part of pieces(text, 900)) {
    const res = await http('https://freetts.org/api/v1/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, Accept: 'application/json' },
      body: JSON.stringify({ text: part, voice: voiceFor('freetts', language), output_format: 'mp3' }),
      signal
    });
    const created = await readAudio(res, 'FreeTTS');
    const fileId = created.fileId;
    if (!fileId) throw new HttpError(502, 'local_tts', 'FreeTTS did not return a file id.');
    const audio = await http(`https://freetts.org/api/audio/${encodeURIComponent(fileId)}`, { signal });
    const got = await readAudio(audio, 'FreeTTS');
    chunks.push(got.buf);
    mime = got.mime || mime;
  }
  return { buf: Buffer.concat(chunks), mime };
}

async function narakeet(text, language, signal, http) {
  const voice = voiceFor('narakeet', language);
  const res = await http(`https://api.narakeet.com/text-to-speech/mp3?voice=${encodeURIComponent(voice)}`, {
    method: 'POST',
    headers: {
      'x-api-key': keyFor('narakeet'),
      'Content-Type': 'text/plain; charset=utf-8',
      Accept: 'application/octet-stream'
    },
    body: text,
    signal
  });
  return readAudio(res, 'Narakeet');
}

export async function generateHttpNarration({ text, language, provider, signal, fetchImpl }) {
  const id = String(provider || '').trim().toLowerCase();
  if (!isHttpVoiceProvider(id)) throw new HttpError(400, 'model', 'That voice service is not available.');
  const spoken = String(text || '').trim();
  if (!spoken) throw new HttpError(400, 'empty', 'There is nothing to narrate in this section.');
  const lang = language === 'my' ? 'my' : 'en';
  const http = fetchImpl || fetch;
  const speak = id === 'aivoov' ? aivoov : id === 'freetts' ? freetts : narakeet;
  const audio = await speak(spoken, lang, signal, http);
  const buf = audio.buf;
  if (!buf || buf.length < 80) throw new HttpError(502, 'local_tts', `${NAMES[id]} returned empty audio.`);
  const duration = Math.max(0.8, spoken.split(/\s+/).length * 0.32);
  return {
    provider: id,
    model: NAMES[id],
    voice: voiceFor(id, lang),
    language: lang,
    mimeType: audio.mime || 'audio/mpeg',
    audioBase64: buf.toString('base64'),
    bytes: buf.length,
    duration: Number(duration.toFixed(3)),
    text: spoken,
    words: estimateSpokenWords(spoken, duration),
    cached: false
  };
}
