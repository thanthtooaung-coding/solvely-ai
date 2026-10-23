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
