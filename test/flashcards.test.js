import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../lib/app.js';
import {
  flashcardSetUsesBurmese,
  normalizeFlashcardSet,
  normalizeReviewGuide
} from '../lib/flashcards.js';

async function listen(app) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  return { server, base: `http://127.0.0.1:${port}` };
}

function sampleSet(extra = {}) {
  return {
    title: 'Microservices',
    language: 'en',
    summary: 'Independent deployable services.',
    topics: [
      { id: 'basics', title: 'Basics', overview: 'What microservices are.' },
      { id: 'data', title: 'Data', overview: 'How services store data.' }
    ],
    cards: [
      { topicId: 'basics', topic: 'Basics', front: 'What is a microservice?', back: 'A small independently deployable service.', explanation: 'Focuses on one business capability.', example: 'User service', difficulty: 'easy', tags: ['arch'] },
      { topicId: 'basics', topic: 'Basics', front: 'Why use microservices?', back: 'Independent scaling and deployment.', explanation: '', example: '', difficulty: 'medium', tags: [] },
      { topicId: 'data', topic: 'Data', front: 'What is database per service?', back: 'Each service owns its data store.', explanation: 'Avoids shared DB coupling.', example: '', difficulty: 'medium', tags: ['data'] },
      { topicId: 'data', topic: 'Data', front: 'What is eventual consistency?', back: 'Replicas become consistent over time.', explanation: '', example: '', difficulty: 'hard', tags: [] }
    ],
    studyGuide: {
      overview: 'Microservices split a system into focused services.',
      keyConcepts: ['Independent deploy', 'Bounded context'],
      definitions: ['Service: a deployable unit'],
      examples: ['Orders and payments services'],
      relationships: ['APIs connect services']
    },
    ...extra
  };
}

test('normalizeFlashcardSet assigns ids and drops junk fields', () => {
  const set = normalizeFlashcardSet({ ...sampleSet(), apiKey: 'nope', secret: 1 }, 'en');
  assert.equal(set.language, 'en');
  assert.equal(set.apiKey, undefined);
  assert.ok(set.cards.length >= 3);
  assert.ok(set.cards.every(c => c.id && c.front && c.back));
  assert.equal(set.topics.length, 2);
});

test('Burmese flashcard sets are detected', () => {
  const my = normalizeFlashcardSet(sampleSet({
    language: 'my',
    title: 'မိုက်ခရိုဆားဗစ်',
    summary: 'သီးခြား တပ်ဆင်နိုင်သော ဝန်ဆောင်မှုငယ်များ အကြောင်း ရှင်းပြထားသည်။',
    topics: [{ id: 't1', title: 'အခြေခံများ', overview: 'မိုက်ခရိုဆားဗစ် ဆိုသည်မှာ အဘယ်နည်း။' }],
    cards: [
      { topicId: 't1', topic: 'အခြေခံများ', front: 'မိုက်ခရိုဆားဗစ် ဆိုသည်မှာ အဘယ်နည်း။', back: 'သီးခြား တပ်ဆင်နိုင်သော ဝန်ဆောင်မှုငယ် ဖြစ်သည်။', explanation: 'လုပ်ငန်းတစ်ခုကို အာရုံစိုက်သည်။', example: '', difficulty: 'easy', tags: [] },
      { topicId: 't1', topic: 'အခြေခံများ', front: 'အကျိုးကျေးဇူးက အဘယ်နည်း။', back: 'သီးခြား ချဲ့ထွင်နိုင်သည်။', explanation: '', example: '', difficulty: 'medium', tags: [] },
      { topicId: 't1', topic: 'အခြေခံများ', front: 'ဒေတာကို မည်သို့ သိမ်းသနည်း။', back: 'ဝန်ဆောင်မှု တစ်ခုစီက ကိုယ်ပိုင် ဒေတာဘေ့စ် ပိုင်သည်။', explanation: '', example: '', difficulty: 'medium', tags: [] }
    ]
  }), 'my');
  assert.equal(my.language, 'my');
  assert.equal(flashcardSetUsesBurmese(my), true);
  assert.equal(flashcardSetUsesBurmese(sampleSet()), false);
});

test('normalizeReviewGuide keeps suggestions only', () => {
  const guide = normalizeReviewGuide({
    summary: 'Focus on review cards first.',
    suggestions: ['Restudy Need Review cards', 'Revisit Data topic'],
    focusTopics: ['Data'],
    masteryPct: 99
  });
  assert.equal(guide.summary.includes('Focus'), true);
  assert.equal(guide.suggestions.length, 2);
  assert.equal(guide.masteryPct, undefined);
});

test('flashcards endpoints reject bad input without calling Gemini', async () => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const { server, base } = await listen(createApp());
  try {
    const empty = await fetch(`${base}/api/flashcards/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: '  ', language: 'en' })
    });
    const emptyBody = await empty.json();
    assert.equal(empty.status, 400);
    assert.equal(emptyBody.code, 'empty');

    const missingKey = await fetch(`${base}/api/flashcards/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Microservices', language: 'en', count: 12 })
    });
    const keyBody = await missingKey.json();
    assert.equal(missingKey.status, 503);
    assert.equal(keyBody.code, 'config');

    const guide = await fetch(`${base}/api/flashcards/study-guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studySet: { title: 'x', cards: [] } })
    });
    assert.equal(guide.status, 400);

    const chat = await fetch(`${base}/api/flashcards/chat`, {
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

test('too few cards is rejected by normalizeFlashcardSet', () => {
  assert.throws(() => normalizeFlashcardSet({
    title: 'Tiny',
    language: 'en',
    summary: 'x',
    topics: [{ id: 't', title: 'T', overview: '' }],
    cards: [
      { topicId: 't', topic: 'T', front: 'A?', back: 'B', explanation: '', example: '', difficulty: 'easy', tags: [] },
      { topicId: 't', topic: 'T', front: 'C?', back: 'D', explanation: '', example: '', difficulty: 'easy', tags: [] }
    ]
  }, 'en'));
});
