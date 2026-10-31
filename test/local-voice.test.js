import assert from 'node:assert/strict';
import test from 'node:test';
import { estimateSpokenWords, generateLocalNarration, wavDurationSeconds } from '../lib/local-voice.js';

function tinyWav() {
  const samples = 8000;
  const data = Buffer.alloc(samples * 2);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(8000, 24);
  header.writeUInt32LE(16000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

test('local wav duration and word timings', () => {
  assert.equal(wavDurationSeconds(tinyWav()), 1);
  const words = estimateSpokenWords('Hello မင်္ဂလာပါ world', 1);
  assert.equal(words.length, 3);
  assert.equal(words[0].text, 'Hello');
  assert.equal(words[2].text, 'world');
  assert.ok(words[2].end > words[0].start);
});

test('local narration uses the selected model and a finished wav', async () => {
  const wav = tinyWav();
  const result = await generateLocalNarration({
    text: 'Hello class',
    language: 'en',
    provider: 'mms',
    run: async req => {
      assert.equal(req.provider, 'mms');
      assert.equal(req.language, 'en');
      assert.equal(req.text, 'Hello class');
      return wav;
    }
  });
  assert.equal(result.provider, 'mms');
  assert.match(result.model, /mms-tts-eng/);
  assert.equal(result.duration, 1);
  assert.equal(result.words.length, 2);
  assert.equal(Buffer.from(result.audioBase64, 'base64').length, wav.length);
});
