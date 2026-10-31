import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError, sanitizeLog } from './errors.js';

const PROVIDERS = new Set(['mms', 'f5kokoro', 'sherpa']);
const DEFAULT_TIMEOUT_MS = 600000;

export function isLocalVoiceProvider(id) {
  return PROVIDERS.has(String(id || '').trim().toLowerCase());
}

/** Even word timings for a finished local recording, so the board can still type along. */
export function estimateSpokenWords(text, durationSec) {
  const parts = String(text || '').split(/\s+/).filter(w => /[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FFA-Za-z0-9]/.test(w));
  if (!parts.length) return [];
  const dur = Math.max(0.4, Number(durationSec) || parts.length * 0.32);
  const each = dur / parts.length;
  return parts.slice(0, 400).map((word, i) => ({
    text: word,
    start: Number((i * each).toFixed(3)),
    end: Number(((i + 1) * each).toFixed(3))
  }));
}

export function wavDurationSeconds(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF') return 0;
  const channels = buf.readUInt16LE(22) || 1;
  const rate = buf.readUInt32LE(24) || 1;
  const bits = buf.readUInt16LE(34) || 16;
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === 'data') {
      const bytesPerSec = rate * channels * (bits / 8);
      return bytesPerSec > 0 ? size / bytesPerSec : 0;
    }
    if (size < 0 || offset + 8 + size > buf.length + 1) break;
    offset += 8 + size + (size % 2);
  }
  return 0;
}

const MODEL_NAMES = {
  mms: 'facebook/mms-tts-mya + facebook/mms-tts-eng',
  f5kokoro: 'freococo/F5-Myanmar-TTS + Kokoro',
  sherpa: 'sherpa-onnx MMS'
};

let child = null;
let stdoutBuf = '';
let current = null;
const queue = [];
let seq = 0;

function projectRoot(root) {
  return root || resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

function pythonCommand() {
  const fromEnv = (process.env.LOCAL_TTS_PYTHON || '').trim();
  if (fromEnv) return fromEnv;
  return process.platform === 'win32' ? 'python' : 'python3';
}

function failCurrent(err) {
  const job = current;
  current = null;
  if (job) job.reject(err);
  stdoutBuf = '';
  pump();
}

function stopChild() {
  const proc = child;
  child = null;
  if (proc && proc.exitCode == null) {
    try { proc.kill(); } catch { /* already gone */ }
  }
}

function ensureChild(root) {
  if (child && child.exitCode == null && !child.killed) return;
  const cmd = pythonCommand();
  const script = resolve(projectRoot(root), 'tts', 'worker.py');
  let proc;
  try {
    proc = spawn(cmd, ['-X', 'utf8', script], {
      cwd: projectRoot(root),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });
  } catch (err) {
    throw new HttpError(503, 'local_tts', installMessage(err));
  }
  child = proc;
  stdoutBuf = '';
  proc.stdout.on('data', chunk => {
    stdoutBuf += chunk.toString('utf8');
    let nl;
    while ((nl = stdoutBuf.indexOf('\n')) >= 0) {
      const line = stdoutBuf.slice(0, nl).trim();
      stdoutBuf = stdoutBuf.slice(nl + 1);
      if (!line || !current) continue;
      let msg;
      try { msg = JSON.parse(line); } catch { continue; }
      if (msg.id != null && msg.id !== current.id) continue;
      const job = current;
      current = null;
      if (msg.ok && msg.audioBase64) job.resolve(Buffer.from(msg.audioBase64, 'base64'));
      else job.reject(new HttpError(502, 'local_tts', clipError(msg.error)));
      pump();
    }
  });
  proc.on('error', err => {
    stopChild();
    failCurrent(new HttpError(503, 'local_tts', installMessage(err)));
  });
  proc.on('exit', () => {
    if (child === proc) child = null;
    failCurrent(new HttpError(502, 'local_tts', 'The local voice process stopped before it finished the audio.'));
  });
}

function installMessage(err) {
  const missing = err && (err.code === 'ENOENT' || /ENOENT/.test(err.message || ''));
  if (missing) {
    return 'Python was not found. Install Python 3.10+ and run: pip install -r tts/requirements.txt. Set LOCAL_TTS_PYTHON if python is not on PATH.';
  }
  return 'The local voice could not start. Install the packages in tts/requirements.txt and try again.';
}

function clipError(message) {
  const text = sanitizeLog(message).replace(/\s+/g, ' ').trim();
  if (!text) return 'The local voice model failed. Check tts/requirements.txt and that the model can download from Hugging Face.';
  return text.slice(0, 400);
}

function pump() {
  if (current || !queue.length) return;
  const job = queue.shift();
  if (job.signal && job.signal.aborted) {
    job.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    pump();
    return;
  }
  current = job;
  try {
    ensureChild(job.root);
  } catch (err) {
    current = null;
    job.reject(err);
    pump();
    return;
  }
  if (current !== job || !child) return;
  const timer = setTimeout(() => {
    if (current !== job) return;
    current = null;
    stopChild();
    job.reject(new HttpError(504, 'local_tts', 'The local voice took too long. The first run downloads the model and can take several minutes.'));
  }, job.timeoutMs);
  const finish = () => clearTimeout(timer);
  const resolve = job.resolve;
  const reject = job.reject;
  job.resolve = buf => { finish(); resolve(buf); };
  job.reject = err => { finish(); reject(err); };
  const onAbort = () => {
    if (current === job) {
      current = null;
      stopChild();
      job.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    }
  };
  if (job.signal) job.signal.addEventListener('abort', onAbort, { once: true });
  try {
    child.stdin.write(JSON.stringify({ id: job.id, provider: job.provider, language: job.language, text: job.text }) + '\n');
  } catch (err) {
    if (job.signal) job.signal.removeEventListener('abort', onAbort);
    current = null;
    stopChild();
    job.reject(new HttpError(502, 'local_tts', clipError(err && err.message)));
    pump();
  }
}

function askWorker({ provider, language, text, signal, root }) {
  const timeoutMs = Math.min(Math.max(Number(process.env.LOCAL_TTS_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS, 30000), 3600000);
  return new Promise((resolve, reject) => {
    queue.push({
      id: ++seq,
      provider,
      language,
      text,
      signal,
      root: projectRoot(root),
      timeoutMs,
      resolve,
      reject
    });
    pump();
  });
}

export async function generateLocalNarration({ text, language, provider, signal, root, run }) {
  const id = String(provider || '').trim().toLowerCase();
  if (!isLocalVoiceProvider(id)) {
    throw new HttpError(400, 'model', 'That local voice model is not available.');
  }
  const spoken = String(text || '').trim();
  if (!spoken) throw new HttpError(400, 'empty', 'There is nothing to narrate in this section.');
  const lang = language === 'my' ? 'my' : 'en';
  const invoke = run || askWorker;
  const audio = await invoke({ provider: id, language: lang, text: spoken, signal, root });
  const buf = Buffer.isBuffer(audio) ? audio : Buffer.from(audio || '');
  if (buf.length < 44) throw new HttpError(502, 'local_tts', 'The local voice returned empty audio.');
  const duration = wavDurationSeconds(buf) || Math.max(0.8, spoken.split(/\s+/).length * 0.32);
  return {
    provider: id,
    model: MODEL_NAMES[id],
    voice: id,
    language: lang,
    mimeType: 'audio/wav',
    audioBase64: buf.toString('base64'),
    bytes: buf.length,
    duration: Number(duration.toFixed(3)),
    text: spoken,
    words: estimateSpokenWords(spoken, duration),
    cached: false
  };
}

/** Test helper. Production code never needs to drop the worker. */
export function resetLocalVoice() {
  queue.splice(0, queue.length);
  current = null;
  stopChild();
  stdoutBuf = '';
}
