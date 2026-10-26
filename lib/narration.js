import { createHash } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import {
  elevenLabsConfigured,
  elevenLabsLanguages,
  elevenLabsModel,
  elevenLabsVoiceId,
  geminiConfigured,
  geminiTranscribeModel,
  geminiTtsModel,
  requestTimeoutMs
} from './env.js';
import { HttpError, sanitizeLog } from './errors.js';
import { clip, languageOf } from './lesson.js';

const MAX_TEXT = 2200;
const CACHE_MAX = 48;
const CACHE_VERSION = 'words-v1';
const cache = new Map();

export const NARRATION_VOICES = [
  { id: 'Kore', label: 'Kore · firm tutor', gender: 'female', style: 'clear tutoring voice' },
  { id: 'Puck', label: 'Puck · upbeat tutor', gender: 'male', style: 'friendly tutoring voice' },
  { id: 'Charon', label: 'Charon · informative', gender: 'male', style: 'calm informative teaching voice' },
  { id: 'Aoede', label: 'Aoede · breezy', gender: 'female', style: 'warm breezy tutoring voice' },
  { id: 'Sulafat', label: 'Sulafat · warm', gender: 'female', style: 'warm patient tutoring voice' },
  { id: 'Rasalgethi', label: 'Rasalgethi · clear', gender: 'male', style: 'clear knowledgeable tutoring voice' }
];

const VOICE_IDS = new Set(NARRATION_VOICES.map(v => v.id));

function geminiTtsReady() {
  return geminiConfigured() && Boolean(geminiTtsModel());
}

export function narrationConfigured() {
  return elevenLabsConfigured() || geminiTtsReady();
}

const ELEVEN_API = 'https://api.elevenlabs.io/v1';
const ELEVEN_FALLBACK_VOICE = '21m00Tcm4TlvDq8ikWAM';
const ELEVEN_VOICE_TTL = 10 * 60 * 1000;
let elevenVoiceCache = { at: 0, voices: [] };

export function elevenId(value) {
  const v = String(value || '').trim();
  return /^[A-Za-z0-9]{15,40}$/.test(v) ? v : '';
}

async function elevenVoices() {
  if (!elevenLabsConfigured()) return [];
  if (elevenVoiceCache.voices.length && Date.now() - elevenVoiceCache.at < ELEVEN_VOICE_TTL) return elevenVoiceCache.voices;
  try {
    const res = await fetch(`${ELEVEN_API}/voices`, {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY.trim(), Accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw Object.assign(new Error(`voices ${res.status}`), { status: res.status });
    const data = await res.json();
    const voices = (Array.isArray(data && data.voices) ? data.voices : [])
      .filter(v => elevenId(v && v.voice_id))
      .slice(0, 40)
      .map(v => ({
        id: v.voice_id,
        label: clip(String(v.name || v.voice_id), 60) + (v.labels && v.labels.gender ? ` · ${clip(String(v.labels.gender), 12)}` : ''),
        gender: (v.labels && v.labels.gender) || ''
      }));
    elevenVoiceCache = { at: Date.now(), voices };
    return voices;
  } catch (err) {
    console.error(JSON.stringify({ at: new Date().toISOString(), code: 'eleven_voices', message: sanitizeLog(err && err.message) }));
    return elevenVoiceCache.voices;
  }
}

export async function elevenDefaultVoice() {
  const configured = elevenId(elevenLabsVoiceId());
  if (configured) return configured;
  const list = await elevenVoices();
  return (list[0] && list[0].id) || ELEVEN_FALLBACK_VOICE;
}

function useElevenFor(lang) {
  return elevenLabsConfigured() && elevenLabsLanguages().has(lang);
}

/** Groups ElevenLabs character timings into space-separated words. */
export function charsToWords(alignment) {
  const chars = (alignment && alignment.characters) || [];
  const starts = (alignment && alignment.character_start_times_seconds) || [];
  const ends = (alignment && alignment.character_end_times_seconds) || [];
  const out = [];
  let cur = null;
  for (let i = 0; i < chars.length; i++) {
    const ch = String(chars[i] || '');
    if (/^\s*$/.test(ch)) {
      if (cur) { out.push(cur); cur = null; }
      continue;
    }
    const s = Number(starts[i]) || 0;
    const e = Number(ends[i]) || s;
    if (!cur) cur = { text: ch, start: s, end: e };
    else { cur.text += ch; cur.end = Math.max(cur.end, e); }
  }
  if (cur) out.push(cur);
  return out
    .filter(w => /[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FFA-Za-z0-9]/.test(w.text))
    .map(w => ({ text: w.text, start: Number(w.start.toFixed(3)), end: Number(Math.max(w.end, w.start + 0.05).toFixed(3)) }))
    .slice(0, 400);
}

export function mapElevenError(status, detail) {
  const message = sanitizeLog(detail);
  if (status === 401 || status === 403 || /api key/i.test(message)) {
    return new HttpError(401, 'auth', 'ElevenLabs rejected the API key. Check ELEVENLABS_API_KEY on the server.');
  }
  if (status === 429) {
    return new HttpError(429, 'rate_limit', 'ElevenLabs has hit its usage limit. Wait a moment, then try again.');
  }
  if (status === 400 || status === 404 || status === 422) {
    return new HttpError(400, 'model', `ElevenLabs could not use this voice or model (${message || status}). Check ELEVENLABS_VOICE_ID and ELEVENLABS_MODEL.`);
  }
  return new HttpError(502, 'audio', 'ElevenLabs could not create the narration. Try again.');
}

async function generateEleven({ spoken, lang, voice, signal }) {
  const voiceId = elevenId(voice) || await elevenDefaultVoice();
  const model = elevenLabsModel(lang);
  const res = await fetch(`${ELEVEN_API}/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY.trim(),
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      text: spoken,
      model_id: model,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    }),
    signal
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body && body.detail ? (body.detail.message || body.detail.status || JSON.stringify(body.detail)) : res.statusText;
    throw mapElevenError(res.status, detail);
  }
  const data = await res.json();
  if (!data || !data.audio_base64) throw new HttpError(502, 'audio', 'ElevenLabs returned no audio.');
  const words = charsToWords(data.alignment || data.normalized_alignment);
  const last = words[words.length - 1];
  const bytes = Math.floor(data.audio_base64.length * 3 / 4);
  const duration = last ? last.end + 0.15 : Math.max(1, spoken.split(/\s+/).length * 0.32);
  return {
    provider: 'elevenlabs',
    model,
    voice: voiceId,
    language: lang,
    mimeType: 'audio/mpeg',
    audioBase64: data.audio_base64,
    bytes,
    duration: Number(duration.toFixed(3)),
    text: spoken,
    words: words.length ? words : estimateWordTimings(tokenizeScript(spoken), duration)
  };
}

export function listNarrationVoices() {
  return NARRATION_VOICES.map(({ id, label, gender }) => ({ id, label, gender }));
}

export function resolveVoice(voice) {
  const id = String(voice || '').trim();
  if (VOICE_IDS.has(id)) return id;
  return 'Kore';
}

function voiceMeta(id) {
  return NARRATION_VOICES.find(v => v.id === id) || NARRATION_VOICES[0];
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function sayNumberEn(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n);
  if (num < 0) return 'minus ' + sayNumberEn(-num);
  if (num % 1 !== 0) {
    const [a, b] = String(n).split('.');
    return sayNumberEn(a) + ' point ' + [...b].map(d => ONES[Number(d)] || d).join(' ');
  }
  let x = Math.trunc(num);
  if (x < 20) return ONES[x];
  if (x < 100) return TENS[Math.floor(x / 10)] + (x % 10 ? '-' + ONES[x % 10] : '');
  if (x < 1000) return sayNumberEn(Math.floor(x / 100)) + ' hundred' + (x % 100 ? ' ' + sayNumberEn(x % 100) : '');
  return String(n);
}

function speakMathToken(token, lang) {
  const t = token.trim();
  if (!t) return '';
  if (/^\d+(\.\d+)?$/.test(t)) return lang === 'my' ? t : sayNumberEn(t);
  const mapEn = {
    '+': 'plus', '-': 'minus', '*': 'times', '×': 'times', '/': 'divided by', '÷': 'divided by',
    '=': 'equals', '≠': 'is not equal to', '<': 'is less than', '>': 'is greater than',
    '≤': 'is less than or equal to', '≥': 'is greater than or equal to', '^': 'to the power of',
    '√': 'square root of', 'π': 'pi', '∞': 'infinity', '(': 'open parenthesis', ')': 'close parenthesis'
  };
  const mapMy = {
    '+': 'ပေါင်း', '-': 'နှုတ်', '*': 'မြှောက်', '×': 'မြှောက်', '/': 'စား', '÷': 'စား',
    '=': 'ညီမျှသည်', '≠': 'မညီမျှ', '<': 'ငယ်သည်', '>': 'ကြီးသည်',
    '≤': 'ငယ်သည် သို့မဟုတ် ညီမျှသည်', '≥': 'ကြီးသည် သို့မဟုတ် ညီမျှသည်', '^': 'ထပ်ကိန်း',
    '√': 'နှစ်ထပ်ကိန်းရင်း', 'π': 'ပိုင်', '∞': 'အဆုံးမရှိ', '(': 'ကွင်းဖွင့်', ')': 'ကွင်းပိတ်'
  };
  const map = lang === 'my' ? mapMy : mapEn;
  if (map[t]) return map[t];
  if (/^[a-zA-Z]$/.test(t)) return t.toLowerCase();
  if (/^[a-zA-Z]+\d*$/.test(t)) return t.split('').join(' ');
  return t;
}

export function speakableMath(expr, language) {
  const lang = languageOf(language);
  const raw = String(expr || '').replace(/\$+/g, '').replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)').replace(/\\times/g, '×').replace(/\\div/g, '÷')
    .replace(/\\leq/g, '≤').replace(/\\geq/g, '≥').replace(/\\neq/g, '≠').replace(/\\pi/g, 'π')
    .replace(/\\infty/g, '∞').replace(/[{}]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  const parts = raw.match(/\d+\.\d+|\d+[a-zA-Z]|[a-zA-Z]\d*|\d+|[a-zA-Z]+|[+\-*/×÷=≠<>≤≥^√π∞()]/g) || [raw];
  return parts.map(p => {
    if (/^\d+[a-zA-Z]$/.test(p)) {
      return (lang === 'my' ? p.slice(0, -1) : sayNumberEn(p.slice(0, -1))) + ' ' + p.slice(-1).toLowerCase();
    }
    return speakMathToken(p, lang);
  }).filter(Boolean).join(' ');
}

export function prepareNarrationText(input, language) {
  const lang = languageOf(language);
  let text = String(input || '')
    .replace(/```[\s\S]*?```/g, m => {
      const body = m.replace(/```(?:\w+)?/g, '').trim().slice(0, 280);
      return lang === 'my'
        ? ` ကုဒ် နမူနာ။ ${body.replace(/[{};]/g, ' ')} `
        : ` Code example. ${body.replace(/[{};]/g, ' ')} `;
    })
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/_\{([^}]+)\}/g, '$1')
    .replace(/\^\{([^}]+)\}/g, ' to the power $1 ')
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => ' ' + speakableMath(m, lang) + ' ')
    .replace(/\$([^$]+)\$/g, (_, m) => ' ' + speakableMath(m, lang) + ' ');

  text = text.replace(/\b((?:\d+(?:\.\d+)?[a-zA-Z]?|[a-zA-Z]\d*)(?:\s*[+\-*/×÷=^]\s*(?:\d+(?:\.\d+)?[a-zA-Z]?|[a-zA-Z]\d*)){1,})\b/g, (expr) => {
    if (!/[+\-*/×÷=^]/.test(expr)) return expr;
    return speakableMath(expr, lang);
  });

  text = text.replace(/\s+/g, ' ').trim();
  return clip(text, MAX_TEXT);
}

export function tokenizeScript(text) {
  return String(text || '').match(/[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FF]+|[A-Za-z0-9]+(?:'[A-Za-z]+)?|[^\sA-Za-z0-9\u1000-\u109F]/g) || [];
}

export function parseTimeOffset(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  const m = String(value || '').match(/(-?[\d.]+)/);
  return m ? Math.max(0, Number(m[1])) : 0;
}

export function estimateWordTimings(tokens, durationSec) {
  const list = (tokens || []).map(t => String(t || '').trim()).filter(Boolean).slice(0, 400);
  if (!list.length) return [];
  const dur = Math.max(0.8, Number(durationSec) || list.length * 0.32);
  const each = dur / list.length;
  return list.map((text, i) => ({
    text,
    start: Number((i * each).toFixed(3)),
    end: Number(((i + 1) * each).toFixed(3))
  }));
}

export function alignWordTimings(script, asrWords, durationSec) {
  const tokens = tokenizeScript(script).filter(t => /[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FFA-Za-z0-9]/.test(t));
  const asr = (asrWords || []).map(item => ({
    text: String(item.word || item.text || '').replace(/^[^\w\u1000-\u109F]+|[^\w\u1000-\u109F]+$/g, '').trim() || String(item.word || item.text || '').trim(),
    start: parseTimeOffset(item.startOffset || item.start_offset || item.start),
    end: parseTimeOffset(item.endOffset || item.end_offset || item.end)
  })).filter(item => item.text);
  asr.forEach(item => {
    if (item.end <= item.start) item.end = item.start + 0.12;
  });

  if (!asr.length) return estimateWordTimings(tokens.length ? tokens : tokenizeScript(script), durationSec);

  const close = tokens.length && Math.abs(tokens.length - asr.length) <= Math.max(2, Math.floor(Math.max(tokens.length, asr.length) * 0.3));
  if (close) {
    const n = Math.min(tokens.length, asr.length);
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({ text: tokens[i], start: asr[i].start, end: asr[i].end });
    }
    for (let i = n; i < tokens.length; i++) {
      const prev = out[out.length - 1];
      const start = prev ? prev.end : 0;
      out.push({ text: tokens[i], start, end: start + 0.18 });
    }
    return out.slice(0, 400);
  }

  return asr.map(item => ({ text: item.text, start: item.start, end: item.end })).slice(0, 400);
}

function wavDurationSeconds(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 44) return 0;
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') return 0;
  let offset = 12;
  let sampleRate = 24000;
  let channels = 1;
  let bits = 16;
  let dataSize = 0;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === 'fmt ' && start + 16 <= buf.length) {
      channels = buf.readUInt16LE(start + 2) || 1;
      sampleRate = buf.readUInt32LE(start + 4) || 24000;
      bits = buf.readUInt16LE(start + 14) || 16;
    } else if (id === 'data') {
      dataSize = size;
      break;
    }
    offset = start + size + (size % 2);
  }
  const bytesPerSec = sampleRate * channels * (bits / 8);
  return bytesPerSec > 0 && dataSize > 0 ? dataSize / bytesPerSec : 0;
}

function cacheKey(text, language, voice, model) {
  return createHash('sha256').update([CACHE_VERSION, model, language, voice, text].join('\n')).digest('hex');
}

function remember(key, value) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
}

function mapTtsError(err) {
  if (err instanceof HttpError) return err;
  const status = Number(err && (err.status || err.code)) || 0;
  const message = sanitizeLog(err && (err.message || err.statusText));
  if (status === 401 || status === 403 || /api key|permission denied|unauth/i.test(message)) {
    return new HttpError(401, 'auth', 'The narration service could not authenticate with Gemini. Check the API key on the server.');
  }
  if (status === 429 || /resource_exhausted|quota|rate limit/i.test(message)) {
    return new HttpError(429, 'rate_limit', 'Narration has hit its usage limit. Wait a moment, then try again.');
  }
  if (status === 404 || /not found|unknown model|is not supported|invalid model/i.test(message)) {
    return new HttpError(400, 'model', 'The configured Gemini TTS model is not available for this API key. Set GEMINI_TTS_MODEL to a supported TTS model and restart.');
  }
  if (err && (err.name === 'TimeoutError' || err.name === 'AbortError') || /timeout|aborted/i.test(message)) {
    return new HttpError(504, 'timeout', 'Narration took too long to generate. Try again.');
  }
  console.error(JSON.stringify({ at: new Date().toISOString(), code: 'audio', status, message }));
  return new HttpError(502, 'audio', 'The narration could not be created. Try again.');
}

function extractAudio(response) {
  const parts = response && response.candidates && response.candidates[0] && response.candidates[0].content
    ? response.candidates[0].content.parts || []
    : [];
  for (const part of parts) {
    const inline = part && (part.inlineData || part.inline_data);
    if (inline && inline.data) {
      return {
        mimeType: inline.mimeType || inline.mime_type || 'audio/wav',
        data: inline.data
      };
    }
  }
  if (response && response.output_audio && response.output_audio.data) {
    return { mimeType: response.output_audio.mime_type || 'audio/wav', data: response.output_audio.data };
  }
  return null;
}

function extractTranscriptionWords(response) {
  const parts = response && response.candidates && response.candidates[0] && response.candidates[0].content
    ? response.candidates[0].content.parts || []
    : [];
  for (const part of parts) {
    const block = part && (part.audioTranscription || part.audio_transcription);
    if (block && Array.isArray(block.words) && block.words.length) return block.words;
  }
  return [];
}

async function alignAudioWords(ai, { mimeType, data }, script, durationSec, lang, signal) {
  const model = geminiTranscribeModel();
  if (!model) return estimateWordTimings(tokenizeScript(script), durationSec);
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [{ inlineData: { mimeType: mimeType || 'audio/wav', data } }]
      }],
      config: {
        audioTranscriptionConfig: {
          wordTimestamp: true,
          languageCodes: lang === 'my' ? ['my-MM', 'en-US'] : ['en-US']
        }
      }
    }, { signal });
    const words = extractTranscriptionWords(response);
    return alignWordTimings(script, words, durationSec);
  } catch (err) {
    console.error(JSON.stringify({
      at: new Date().toISOString(),
      code: 'align',
      message: sanitizeLog(err && err.message)
    }));
    return estimateWordTimings(tokenizeScript(script), durationSec);
  }
}

export async function generateNarration({ text, language, voice, signal }) {
  if (!narrationConfigured()) {
    throw new HttpError(503, 'config', 'Narration is not configured. Add ELEVENLABS_API_KEY or GEMINI_API_KEY with GEMINI_TTS_MODEL, then restart.');
  }
  const lang = languageOf(language);
  const spoken = prepareNarrationText(text, lang);
  if (!spoken) throw new HttpError(400, 'empty', 'There is nothing to narrate in this section.');

  const timeout = Math.min(Math.max(requestTimeoutMs(), 90000), 180000);
  const timeoutSignal = AbortSignal.timeout(timeout);
  const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  if (useElevenFor(lang)) {
    const elevenKey = cacheKey(spoken, lang, elevenId(voice) || 'default', 'elevenlabs:' + elevenLabsModel(lang));
    const elevenHit = cache.get(elevenKey);
    if (elevenHit) {
      remember(elevenKey, elevenHit);
      return { ...elevenHit, cached: true };
    }
    try {
      const result = await generateEleven({ spoken, lang, voice, signal: combined });
      remember(elevenKey, { ...result, cached: undefined });
      return { ...result, cached: false };
    } catch (err) {
      if (signal && signal.aborted) throw err;
      const mapped = err instanceof HttpError ? err : mapElevenError(0, err && err.message);
      console.error(JSON.stringify({ at: new Date().toISOString(), code: 'eleven_tts', status: mapped.status, message: sanitizeLog(mapped.message) }));
      if (!geminiTtsReady()) throw mapped;
    }
  }

  const chosen = resolveVoice(voice);
  const model = geminiTtsModel();
  const key = cacheKey(spoken, lang, chosen, model);
  const hit = cache.get(key);
  if (hit) {
    remember(key, hit);
    return { ...hit, cached: true };
  }

  const meta = voiceMeta(chosen);
  const style = lang === 'my'
    ? `${meta.style}, natural Myanmar (Burmese) pronunciation, clear teaching pace`
    : `${meta.style}, clear English teaching pace`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [{ text: spoken, speechMetadata: { style } }]
      }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { voice: chosen } }
      }
    }, { signal: combined });

    const audio = extractAudio(response);
    if (!audio || !audio.data) throw new HttpError(502, 'audio', 'The narration service returned no audio.');
    const buf = Buffer.from(audio.data, 'base64');
    if (buf.length < 200) throw new HttpError(502, 'audio', 'The narration service returned empty audio.');
    const durationSec = wavDurationSeconds(buf) || Math.max(1, spoken.split(/\s+/).length * 0.32);
    const words = await alignAudioWords(ai, audio, spoken, durationSec, lang, combined);
    const result = {
      provider: 'gemini-tts',
      model,
      voice: chosen,
      language: lang,
      mimeType: (audio.mimeType || '').includes('wav') ? 'audio/wav' : (audio.mimeType || 'audio/wav'),
      audioBase64: audio.data,
      bytes: buf.length,
      duration: Number(durationSec.toFixed(3)),
      text: spoken,
      words,
      cached: false
    };
    remember(key, { ...result, cached: undefined });
    return result;
  } catch (err) {
    throw mapTtsError(err);
  }
}

export function narrationStatus() {
  const eleven = elevenLabsConfigured();
  return {
    configured: narrationConfigured(),
    provider: eleven ? 'elevenlabs' : 'gemini-tts',
    model: eleven ? elevenLabsModel('en') : (geminiTtsModel() || ''),
    elevenLanguages: eleven ? [...elevenLabsLanguages()] : [],
    transcribeModel: geminiTranscribeModel() || '',
    wordSync: true,
    voices: listNarrationVoices(),
    defaultVoice: 'Kore',
    speeds: [0.75, 1, 1.25, 1.5, 1.75, 2],
    languages: ['en', 'my'],
    fallback: geminiTtsReady() && eleven ? 'gemini-tts' : 'browser'
  };
}

/** Status plus the account's ElevenLabs voices when that provider is active. */
export async function narrationMeta() {
  const status = narrationStatus();
  if (status.provider !== 'elevenlabs') return status;
  const voices = await elevenVoices();
  const defaultVoice = await elevenDefaultVoice();
  const list = voices.length ? voices : [{ id: defaultVoice, label: 'ElevenLabs voice', gender: '' }];
  if (!list.some(v => v.id === defaultVoice)) list.unshift({ id: defaultVoice, label: 'Default voice', gender: '' });
  return { ...status, voices: list, defaultVoice };
}
