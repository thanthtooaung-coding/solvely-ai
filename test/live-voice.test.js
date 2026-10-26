import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../lib/app.js';
import { SpeechBuffer, WordAssembler, clampVoiceSpeed, countSpokenWords } from '../lib/live-voice.js';

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

test('word assembler shifts chunk-relative timings', () => {
  const asm = new WordAssembler();
  asm.push(['A', ' '], [0, 0.1], [0.1, 0.2]);
  const shifted = asm.push(['B', ' '], [0, 0.1], [0.1, 0.2], 2);
  assert.equal(shifted[0].start, 2);
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
