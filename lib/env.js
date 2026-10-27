import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Load .env without overriding variables that are already set. Values are never logged. */
export function loadEnv(root) {
  const path = resolve(root, '.env');
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key] != null && process.env[key] !== '') continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

export function geminiConfigured() {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  return Boolean(key) && key !== 'your_key_here';
}

export function geminiModel() {
  const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim();
  if (!/^[A-Za-z0-9._-]{1,80}$/.test(model)) return '';
  return model;
}

/** Separate TTS model — text models do not produce audio. */
export function geminiTtsModel() {
  const model = (process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts').trim();
  if (!/^[A-Za-z0-9._-]{1,80}$/.test(model)) return '';
  return model;
}

/** Used after TTS to recover word start/end times for karaoke sync. */
export function geminiTranscribeModel() {
  const model = (process.env.GEMINI_TRANSCRIBE_MODEL || 'gemini-3.5-transcribe').trim();
  if (!/^[A-Za-z0-9._-]{1,80}$/.test(model)) return '';
  return model;
}

export function elevenLabsConfigured() {
  const key = (process.env.ELEVENLABS_API_KEY || '').trim();
  return Boolean(key) && key !== 'your_elevenlabs_key_here';
}

function idOr(value, fallback) {
  const v = String(value || '').trim();
  return /^[A-Za-z0-9._-]{1,80}$/.test(v) ? v : fallback;
}

/** Model per lesson language; Burmese needs a model that supports Myanmar. */
export function elevenLabsModel(lang) {
  const base = idOr(process.env.ELEVENLABS_MODEL, 'eleven_multilingual_v2');
  if (lang === 'my') return idOr(process.env.ELEVENLABS_MODEL_MY, 'eleven_v4');
  return base;
}

/** eleven_v3 and older models cannot speak Burmese; the code makes them fail instead of reading it as English. */
export function elevenLanguageCode(lang) {
  return lang === 'my' ? 'my' : undefined;
}

export function elevenLabsVoiceId() {
  return idOr(process.env.ELEVENLABS_VOICE_ID, '');
}

/** Lesson languages narrated by ElevenLabs; others stay on Gemini TTS. */
export function elevenLabsLanguages() {
  const raw = (process.env.ELEVENLABS_LANGUAGES || 'en,my').toLowerCase();
  return new Set(raw.split(/[\s,]+/).filter(x => x === 'en' || x === 'my'));
}

/** Model for live streaming; Burmese needs a model that speaks Myanmar. */
export function elevenLabsStreamModel(lang) {
  if (lang === 'my') return idOr(process.env.ELEVENLABS_STREAM_MODEL_MY, 'eleven_v4');
  return idOr(process.env.ELEVENLABS_STREAM_MODEL, 'eleven_flash_v2_5');
}

/** Lesson languages that stream live; others are preloaded on the prep screen. */
export function elevenLabsStreamLanguages() {
  const raw = (process.env.ELEVENLABS_STREAM_LANGUAGES || 'en,my').toLowerCase();
  return new Set(raw.split(/[\s,]+/).filter(x => x === 'en' || x === 'my'));
}

export function requestTimeoutMs() {
  const n = Number(process.env.GEMINI_TIMEOUT_MS);
  if (!Number.isFinite(n)) return 120000;
  return Math.min(180000, Math.max(10000, Math.round(n)));
}

export function portNumber() {
  const n = Number(process.env.PORT || 3000);
  if (!Number.isInteger(n) || n < 1 || n > 65535) return 3000;
  return n;
}
