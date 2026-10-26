import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import JSZip from 'jszip';
import { createApp } from '../lib/app.js';
import { extractPptx } from '../lib/files.js';
import { lessonUsesBurmese, normalizeLesson, parseModelJson } from '../lib/lesson.js';
import { alignWordTimings, charsToWords, prepareNarrationText, speakableMath } from '../lib/narration.js';
import { renderNotesHtml } from '../lib/notes.js';
import { findBrowser } from '../lib/printpdf.js';

async function listen(app) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  return { server, base: `http://127.0.0.1:${port}` };
}

function sampleLesson(extra = {}) {
  return {
    title: 'Linear equations',
    topic: '2x + 10 = 25',
    language: 'en',
    summary: 'Undo the operations that are attached to x.',
    learningObjectives: ['Isolate the variable'],
    sections: [{
      heading: 'Undo the constant',
      explanation: 'Subtract 10 from both sides.',
      bulletPoints: ['The equation stays balanced'],
      examples: ['2x = 15'],
      codeExample: '',
      codeLanguage: '',
      mathExpressions: ['2x = 15'],
      diagramDescription: '',
      visualType: 'none',
      mermaid: '',
      tableLines: []
    }],
    keyTakeaways: ['Check by substituting'],
    questions: [{
      question: 'What is x?',
      type: 'multiple-choice',
      options: ['5', '7.5', '15'],
      correctAnswer: 'B) 7.5',
      explanation: '2x = 15, so x = 7.5.',
      difficulty: 'easy',
      relatedSection: 'Undo the constant'
    }],
    conclusion: 'x = 7.5.',
    ...extra
  };
}

test('normalizeLesson accepts equivalent answer labels and drops invented fields', () => {
  const lesson = normalizeLesson(sampleLesson({ apiKey: 'should-not-pass', materialNotes: 'quoted fiction' }), 'en');
  assert.equal(lesson.questions[0].correctAnswer, '7.5');
  assert.equal(lesson.apiKey, undefined);
  assert.equal(lesson.materialNotes, undefined);
  assert.equal(lesson.sections.length, 1);
});

test('a Burmese request stays in Burmese', () => {
  const lesson = normalizeLesson(sampleLesson({ language: 'en', title: 'မျဉ်းညီမျှခြင်း' }), 'my');
  assert.equal(lesson.language, 'my');
  assert.equal(lessonUsesBurmese(sampleLesson()), false);
  assert.equal(lessonUsesBurmese({
    title: 'ထောင့်မှန်တြိဂံ',
    summary: 'ထောင့်မှန်နှင့် မျက်နှာချင်းဆိုင်သော အနားကို hypotenuse ဟု ခေါ်သည်။',
    sections: [],
    questions: []
  }), true);
});

test('notes html escapes markup and keeps the Solvely footer', () => {
  const html = renderNotesHtml({
    title: '<script>alert(1)</script>',
    language: 'my',
    blocks: [{ t: 'p', text: 'ထောင့်မှန်တြိဂံ' }, { t: 'diagram', svg: '<svg><script>bad()</script><rect /></svg>', caption: 'ပုံ' }]
  });
  assert.match(html, /&lt;script&gt;alert/);
  assert.doesNotMatch(html, /<script>bad/);
  assert.match(html, /Solvely\.ai/);
  assert.match(html, /Whiteboard Study|ဘုတ်ပြား/);
  assert.match(html, /lang="my"/);
  assert.match(html, /radial-gradient/);
});

test('pdf route returns a pdf document', { timeout: 40000 }, async () => {
  if (!findBrowser()) return;
  const { server, base } = await listen(createApp());
  try {
    const res = await fetch(`${base}/api/whiteboard/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'ထောင့်မှန်တြိဂံ',
        language: 'my',
        blocks: [
          { t: 'title', text: 'ထောင့်မှန်တြိဂံ' },
          { t: 'p', text: 'ထောင့်မှန်နှင့် မျက်နှာချင်းဆိုင်သော အနားသည် hypotenuse ဖြစ်သည်။' },
          { t: 'h', text: 'အဓိပ္ပာယ်' },
          { t: 'ul', items: ['a² + b² = c²'] }
        ]
      })
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /pdf/);
    const buf = Buffer.from(await res.arrayBuffer());
    assert.equal(buf.subarray(0, 5).toString(), '%PDF-');
  } finally {
    server.close();
  }
});

test('narration text speaks equations naturally', () => {
  assert.match(speakableMath('2x + 10 = 25', 'en'), /two x plus ten equals twenty-five/i);
  assert.match(prepareNarrationText('Solve 2x + 10 = 25 carefully.', 'en'), /two x plus ten equals/i);
  assert.equal(prepareNarrationText('   ', 'en'), '');
});

test('word timings align through the last word', () => {
  const words = alignWordTimings('The hypotenuse is opposite', [
    { word: 'The', startOffset: '0s', endOffset: '0.2s' },
    { word: 'hypotenuse', startOffset: '0.2s', endOffset: '0.9s' },
    { word: 'is', startOffset: '0.9s', endOffset: '1.1s' },
    { word: 'opposite', startOffset: '1.1s', endOffset: '1.8s' }
  ], 1.8);
  assert.equal(words.length, 4);
  assert.equal(words[0].text.toLowerCase(), 'the');
  assert.equal(words[words.length - 1].text.toLowerCase(), 'opposite');
  assert.ok(words[words.length - 1].end >= words[words.length - 1].start);
});

test('ElevenLabs character timings become word timings', () => {
  const text = 'Hi there.';
  const words = charsToWords({
    characters: [...text],
    character_start_times_seconds: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
    character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
  });
  assert.deepEqual(words.map(w => w.text), ['Hi', 'there.']);
  assert.equal(words[0].start, 0);
  assert.equal(words[1].start, 0.3);
  assert.equal(words[1].end, 0.9);
  assert.deepEqual(charsToWords(null), []);
});

test('narration meta and empty text validation', async () => {
  const { server, base } = await listen(createApp());
  try {
    const meta = await fetch(`${base}/api/whiteboard/narration`);
    assert.equal(meta.status, 200);
    const body = await meta.json();
    assert.equal(body.provider, 'gemini-tts');
    assert.ok(Array.isArray(body.voices) && body.voices.length >= 2);
    const empty = await fetch(`${base}/api/whiteboard/narration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '  ', language: 'en', voice: 'Kore' })
    });
    assert.equal(empty.status, 400);
    const err = await empty.json();
    assert.equal(err.code, 'empty');
  } finally {
    server.close();
  }
});

test('parseModelJson reads fenced JSON and rejects prose', () => {
  const parsed = parseModelJson('```json\n{"title":"A"}\n```');
  assert.equal(parsed.title, 'A');
  assert.throws(() => parseModelJson('not json'), /not valid JSON/);
});

test('pptx text extraction reads slide text only', async () => {
  const zip = new JSZip();
  zip.file('ppt/slides/slide1.xml', '<p:sld><a:t>Join cost</a:t><a:t>grows with rows</a:t></p:sld>');
  zip.file('ppt/slides/slide2.xml', '<p:sld><a:t>Index the foreign key</a:t></p:sld>');
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const text = await extractPptx(buffer);
  assert.match(text, /Join cost/);
  assert.match(text, /Index the foreign key/);
});

test('health, static files, and secret paths', async () => {
  const { server, base } = await listen(createApp());
  try {
    const health = await fetch(`${base}/api/health`);
    const body = await health.json();
    assert.equal(health.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.service, 'whiteboard-tutor');
    assert.equal(typeof body.configured, 'boolean');
    assert.equal(JSON.stringify(body).includes('GEMINI_API_KEY'), false);
    assert.equal(JSON.stringify(body).includes('AIza'), false);

    const home = await fetch(`${base}/`);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /Solvely Study/);

    const hidden = await fetch(`${base}/.env`);
    assert.equal(hidden.status, 404);
    const source = await fetch(`${base}/server.js`);
    assert.equal(source.status, 404);
    const task = await fetch(`${base}/task.md`);
    assert.equal(task.status, 404);
  } finally {
    server.close();
  }
});

test('lesson and chat reject bad input without calling Gemini', async () => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const { server, base } = await listen(createApp());
  try {
    const empty = await fetch(`${base}/api/whiteboard/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: '   ', language: 'en', apiKey: 'nope' })
    });
    const emptyBody = await empty.json();
    assert.equal(empty.status, 400);
    assert.equal(emptyBody.code, 'empty');

    const fd = new FormData();
    fd.append('topic', 'Photosynthesis');
    fd.append('language', 'en');
    fd.append('files', new Blob(['not an image'], { type: 'image/gif' }), 'plant.gif');
    const badFile = await fetch(`${base}/api/whiteboard/lesson`, { method: 'POST', body: fd });
    const badBody = await badFile.json();
    assert.equal(badFile.status, 400);
    assert.equal(badBody.code, 'file_type');

    const missingKey = await fetch(`${base}/api/whiteboard/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Photosynthesis', language: 'my' })
    });
    const keyBody = await missingKey.json();
    assert.equal(missingKey.status, 503);
    assert.equal(keyBody.code, 'config');
    assert.equal(JSON.stringify(keyBody).includes('AIza'), false);

    const chat = await fetch(`${base}/api/whiteboard/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '', language: 'en' })
    });
    assert.equal(chat.status, 400);
  } finally {
    if (previous == null) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
    server.close();
  }
});
