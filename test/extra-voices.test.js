import assert from 'node:assert/strict';
import test from 'node:test';
import { generateHttpNarration } from '../lib/extra-voices.js';

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body)
  };
}

function audioResponse(bytes) {
  const copy = Uint8Array.from(bytes);
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'audio/mpeg' },
    arrayBuffer: async () => copy.buffer
  };
}

test('hosted voices ask for a key before calling the service', async () => {
  const previous = process.env.NARAKEET_API_KEY;
  delete process.env.NARAKEET_API_KEY;
  await assert.rejects(
    () => generateHttpNarration({ text: 'Hello', language: 'en', provider: 'narakeet', fetchImpl: async () => { throw new Error('called'); } }),
    /NARAKEET_API_KEY/
  );
  if (previous == null) delete process.env.NARAKEET_API_KEY;
  else process.env.NARAKEET_API_KEY = previous;
});

test('AiVOOV reads the transcribe_data audio', async () => {
  const previous = { key: process.env.AIVOOV_API_KEY, voice: process.env.AIVOOV_VOICE_MY };
  process.env.AIVOOV_API_KEY = 'test-key';
  process.env.AIVOOV_VOICE_MY = 'my-MM-NilarNeural';
  const mp3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(120, 1)]);
  try {
    const result = await generateHttpNarration({
      text: 'မင်္ဂလာပါ',
      language: 'my',
      provider: 'aivoov',
      fetchImpl: async () => jsonResponse({ status: true, message: 'Audio successfully generated', transcribe_data: mp3.toString('base64') })
    });
    assert.equal(result.provider, 'aivoov');
    assert.equal(result.voice, 'my-MM-NilarNeural');
    assert.equal(Buffer.from(result.audioBase64, 'base64').length, mp3.length);
  } finally {
    if (previous.key == null) delete process.env.AIVOOV_API_KEY; else process.env.AIVOOV_API_KEY = previous.key;
    if (previous.voice == null) delete process.env.AIVOOV_VOICE_MY; else process.env.AIVOOV_VOICE_MY = previous.voice;
  }
});

test('FreeTTS follows audio_url when the reply also has a file id', async () => {
  const previous = process.env.FREETTS_API_KEY;
  process.env.FREETTS_API_KEY = 'test-key';
  const mp3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(120, 1)]);
  const seen = [];
  try {
    const result = await generateHttpNarration({
      text: 'Hello class',
      language: 'en',
      provider: 'freetts',
      fetchImpl: async url => {
        seen.push(String(url));
        return String(url).includes('/audio/') ? audioResponse(mp3) : jsonResponse({ file_id: 'abc', audio_url: 'https://freetts.org/api/audio/abc', chars_used: 11 });
      }
    });
    assert.equal(seen[1], 'https://freetts.org/api/audio/abc');
    assert.equal(Buffer.from(result.audioBase64, 'base64').length, mp3.length);
  } finally {
    if (previous == null) delete process.env.FREETTS_API_KEY;
    else process.env.FREETTS_API_KEY = previous;
  }
});

test('FreeTTS keeps audio when the reply is already an MP3', async () => {
  const previous = process.env.FREETTS_API_KEY;
  process.env.FREETTS_API_KEY = 'test-key';
  const mp3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(120, 1)]);
  let calls = 0;
  try {
    const result = await generateHttpNarration({
      text: 'Hello class',
      language: 'en',
      provider: 'freetts',
      fetchImpl: async () => {
        calls += 1;
        return audioResponse(mp3);
      }
    });
    assert.equal(calls, 1);
    assert.equal(Buffer.from(result.audioBase64, 'base64').length, mp3.length);
  } finally {
    if (previous == null) delete process.env.FREETTS_API_KEY;
    else process.env.FREETTS_API_KEY = previous;
  }
});

test('FreeTTS downloads the file returned for a section', async () => {
  const previous = process.env.FREETTS_API_KEY;
  process.env.FREETTS_API_KEY = 'test-key';
  const mp3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(120, 1)]);
  try {
    const result = await generateHttpNarration({
      text: 'Hello class',
      language: 'en',
      provider: 'freetts',
      fetchImpl: async url => String(url).includes('/audio/') ? audioResponse(mp3) : jsonResponse({ file_id: 'abc' })
    });
    assert.equal(result.provider, 'freetts');
    assert.equal(result.voice, 'en-US-JennyNeural');
    assert.equal(result.words.length, 2);
    assert.equal(Buffer.from(result.audioBase64, 'base64').length, mp3.length);
  } finally {
    if (previous == null) delete process.env.FREETTS_API_KEY;
    else process.env.FREETTS_API_KEY = previous;
  }
});
