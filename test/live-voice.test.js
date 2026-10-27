import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../lib/app.js';
import { SpeechBuffer, WordAssembler, clampVoiceSpeed, countSpokenWords, supportsWebSocket } from '../lib/live-voice.js';
import { elevenLabsModel, elevenLabsStreamModel, elevenLanguageCode } from '../lib/env.js';
import { elevenAvailable, mapElevenError, resetElevenPause } from '../lib/narration.js';
import { liveVoiceAvailable } from '../lib/live-voice.js';

function withElevenKey(fn) {
  return async () => {
    const saved = { key: process.env.ELEVENLABS_API_KEY, voice: process.env.ELEVENLABS_VOICE_ID };
    process.env.ELEVENLABS_API_KEY = 'sk_test_key';
    process.env.ELEVENLABS_VOICE_ID = 'abcdefghijklmnopqrst';
    resetElevenPause();
    try { await fn(); } finally {
      resetElevenPause();
      if (saved.key == null) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY = saved.key;
      if (saved.voice == null) delete process.env.ELEVENLABS_VOICE_ID; else process.env.ELEVENLABS_VOICE_ID = saved.voice;
    }
  };
}

test('used-up ElevenLabs credits are reported as quota and pause ElevenLabs', withElevenKey(() => {
  assert.equal(elevenAvailable(), true);
  const err = mapElevenError(401, 'This request exceeds your quota of 10000. You have 9 credits remaining, while 40 credits are required.');
  assert.equal(err.code, 'quota');
  assert.equal(err.status, 402);
  assert.equal(elevenAvailable(), false);
  assert.equal(liveVoiceAvailable('en'), false);
  assert.equal(mapElevenError(401, 'Invalid API key').code, 'auth');
}));

test('a cancelled stream is logged as a client cancel, not a server error', withElevenKey(async () => {
  const realFetch = globalThis.fetch;
  const logs = [];
  const errors = [];
  const realLog = console.log;
  const realError = console.error;
  globalThis.fetch = (url, opts) => {
    if (String(url).startsWith('https://api.elevenlabs.io')) {
      return new Promise((_, reject) => {
        opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('This operation was aborted'), { name: 'AbortError' })));
      });
    }
    return realFetch(url, opts);
  };
  const { server, base } = await listen(createApp());
  console.log = line => logs.push(String(line));
  console.error = line => errors.push(String(line));
  try {
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 100);
    await realFetch(`${base}/api/whiteboard/narration/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello there.', language: 'en' }),
      signal: ac.signal
    }).catch(() => {});
    await new Promise(r => setTimeout(r, 200));
    assert.ok(logs.some(l => /"route":"narration.stream","status":499/.test(l)), logs.join('\n'));
    assert.equal(errors.length, 0, errors.join('\n'));
  } finally {
    console.log = realLog;
    console.error = realError;
    globalThis.fetch = realFetch;
    server.close();
  }
}));

test('Burmese uses eleven_v4 with a language code and no WebSocket', () => {
  const saved = { a: process.env.ELEVENLABS_MODEL_MY, b: process.env.ELEVENLABS_STREAM_MODEL_MY };
  delete process.env.ELEVENLABS_MODEL_MY;
  delete process.env.ELEVENLABS_STREAM_MODEL_MY;
  try {
    assert.equal(elevenLabsModel('my'), 'eleven_v4');
    assert.equal(elevenLabsStreamModel('my'), 'eleven_v4');
    assert.equal(elevenLanguageCode('my'), 'my');
    assert.equal(elevenLanguageCode('en'), undefined);
    assert.equal(supportsWebSocket('eleven_v4'), false);
    assert.equal(supportsWebSocket('eleven_flash_v2_5'), true);
  } finally {
    if (saved.a != null) process.env.ELEVENLABS_MODEL_MY = saved.a;
    if (saved.b != null) process.env.ELEVENLABS_STREAM_MODEL_MY = saved.b;
  }
});

async function listen(app) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  return { server, base: `http://127.0.0.1:${port}` };
}

test('speech buffer speaks whole sentences and skips fenced code', () => {
  const buf = new SpeechBuffer('en');
  assert.deepEqual(buf.push('The hypotenuse is '), []);
  const first = buf.push('the longest side. Next');
  assert.equal(first.length, 1);
  assert.match(first[0], /longest side\./);
  const code = buf.push(' look:\n```sql\nSELECT * FROM t;\n```\nDone. ');
  assert.ok(code.every(s => !/SELECT/.test(s)));
  const tail = buf.end();
  assert.ok([...code, ...tail].some(s => /Done/.test(s)));
});

test('decimals do not split a sentence', () => {
  const buf = new SpeechBuffer('en');
  assert.deepEqual(buf.push('x equals 7.5 here'), []);
  assert.equal(buf.end().length, 1);
});

test('word assembler joins words split across chunks', () => {
  const asm = new WordAssembler();
  const a = asm.push(['H', 'e', 'l'], [0, 0.1, 0.2], [0.1, 0.2, 0.3]);
  assert.deepEqual(a, []);
  const b = asm.push(['l', 'o', ' ', 'y'], [0.3, 0.4, 0.5, 0.6], [0.4, 0.5, 0.6, 0.7]);
  assert.deepEqual(b.map(w => w.text), ['Hello']);
  assert.equal(b[0].start, 0);
  assert.equal(b[0].end, 0.5);
  assert.deepEqual(asm.flush().map(w => w.text), ['y']);
});

test('word assembler keeps Burmese words split mid-syllable across chunks', () => {
  const asm = new WordAssembler();
  const a = asm.push([...'နှစ်ဖက'], [0, 0.1, 0.2, 0.3, 0.4, 0.5], [0.1, 0.2, 0.3, 0.4, 0.5, 1.52]);
  assert.deepEqual(a, []);
  const b = asm.push([...'် ဆယ်'], [1.52, 1.6, 1.7, 1.8, 1.9], [1.6, 1.7, 1.8, 1.9, 2.0]);
  assert.deepEqual(b.map(w => w.text), ['နှစ်ဖက်']);
  assert.equal(b[0].end, 1.6);
  assert.deepEqual(asm.flush().map(w => w.text), ['ဆယ်']);
});

test('speed is clamped to the ElevenLabs range and words are counted', () => {
  assert.equal(clampVoiceSpeed(2), 1.2);
  assert.equal(clampVoiceSpeed(0.5), 0.7);
  assert.equal(clampVoiceSpeed('x'), 1);
  assert.equal(countSpokenWords('two x plus ten , equals'), 5);
});

test('stream route refuses when live voice is not configured', async () => {
  const previous = process.env.ELEVENLABS_API_KEY;
  delete process.env.ELEVENLABS_API_KEY;
  const { server, base } = await listen(createApp());
  try {
    const meta = await (await fetch(`${base}/api/whiteboard/narration`)).json();
    assert.equal(meta.stream.enabled, false);
    const res = await fetch(`${base}/api/whiteboard/narration/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello there.', language: 'en' })
    });
    assert.equal(res.status, 409);
    assert.equal((await res.json()).code, 'stream_unavailable');
  } finally {
    if (previous == null) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = previous;
    server.close();
  }
});
