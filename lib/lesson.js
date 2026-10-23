import { HttpError } from './errors.js';

const LANGS = new Set(['en', 'my']);
const VISUALS = new Set(['flowchart', 'concept-map', 'table', 'none']);
const QTYPES = new Set(['multiple-choice', 'short-answer']);
const LEVELS = new Set(['easy', 'medium', 'hard']);

export function clip(value, max) {
  const s = typeof value === 'string' ? value.replace(/\u0000/g, '').trim() : '';
  return s.length > max ? s.slice(0, max) : s;
}

export function asStringList(value, maxItems, maxLen) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => typeof item === 'string')
    .map(item => clip(item, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

const MYANMAR_RE = /[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FF]/g;

export function languageOf(value) {
  return value === 'my' ? 'my' : 'en';
}

export function lessonLanguage(requested, topic) {
  if (languageOf(requested) === 'my') return 'my';
  return MYANMAR_RE.test(String(topic || '')) ? 'my' : 'en';
}

export function proseUsesBurmese(text) {
  const marks = String(text || '').match(MYANMAR_RE);
  return (marks ? marks.length : 0) >= 12;
}

export function lessonUsesBurmese(lesson) {
  if (!lesson) return false;
  const parts = [
    lesson.title, lesson.summary, lesson.conclusion,
    ...(lesson.learningObjectives || []),
    ...(lesson.keyTakeaways || [])
  ];
  (lesson.sections || []).forEach(section => {
    parts.push(section.heading, section.explanation, section.diagramDescription, ...(section.bulletPoints || []), ...(section.examples || []));
  });
  (lesson.questions || []).forEach(question => {
    parts.push(question.question, question.explanation, question.correctAnswer, ...(question.options || []));
  });
  return proseUsesBurmese(parts.filter(Boolean).join('\n'));
}

export function parseModelJson(text) {
  const raw = String(text || '').trim();
  if (!raw) throw new HttpError(502, 'invalid_response', 'The tutor returned an empty response.');
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1].trim() : raw;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) throw new HttpError(502, 'invalid_response', 'The tutor response was not valid JSON.');
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    throw new HttpError(502, 'invalid_response', 'The tutor response was not valid JSON.');
  }
}

function norm(s) {
  return clip(s, 500).toLowerCase().replace(/\s+/g, ' ');
}

function resolveChoice(options, correct) {
  const wanted = norm(correct);
  if (!wanted) return '';
  const exact = options.find(option => norm(option) === wanted);
  if (exact) return exact;
  const letter = wanted.match(/^([a-d])(?:[).:\s]|$)/i);
  if (letter) {
    const index = letter[1].toLowerCase().charCodeAt(0) - 97;
    if (options[index]) return options[index];
  }
  const asNumber = wanted.match(/^([1-4])(?:[).:\s]|$)/);
  if (asNumber) {
    const index = Number(asNumber[1]) - 1;
    if (options[index]) return options[index];
  }
  if (wanted.length > 3) {
    const partial = options.find(option => {
      const text = norm(option);
      return text.includes(wanted) || wanted.includes(text);
    });
    if (partial) return partial;
  }
  return '';
}

function parseTable(lines) {
  const rows = asStringList(lines, 8, 500)
    .map(line => line.split('|').map(cell => clip(cell, 120)).slice(0, 6))
    .filter(row => row.some(Boolean));
  if (rows.length < 2) return null;
  const width = rows[0].length;
  if (width < 2) return null;
  return {
    headers: rows[0],
    rows: rows.slice(1).map(row => {
      const copy = row.slice(0, width);
      while (copy.length < width) copy.push('');
      return copy;
    })
  };
}

export function normalizeLesson(input, requestedLanguage) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(502, 'invalid_response', 'The tutor response was missing a lesson.');
  }
  const language = languageOf(requestedLanguage) === 'my'
    ? 'my'
    : (LANGS.has(input.language) ? input.language : 'en');
  const sections = (Array.isArray(input.sections) ? input.sections : []).slice(0, 6).map(section => {
    if (!section || typeof section !== 'object') return null;
    const visualType = VISUALS.has(section.visualType) ? section.visualType : 'none';
    const table = visualType === 'table' ? parseTable(section.tableLines) : null;
    return {
      heading: clip(section.heading, 180),
      explanation: clip(section.explanation, 2200),
      bulletPoints: asStringList(section.bulletPoints, 6, 400),
      examples: asStringList(section.examples, 3, 600),
      codeExample: clip(section.codeExample, 2500),
      codeLanguage: clip(section.codeLanguage, 40),
      mathExpressions: asStringList(section.mathExpressions, 4, 400),
      diagramDescription: clip(section.diagramDescription, 800),
      visualType: table ? 'table' : visualType,
      mermaid: visualType === 'flowchart' || visualType === 'concept-map' ? clip(section.mermaid, 2000) : '',
      table
    };
  }).filter(section => section && (section.heading || section.explanation));

  const questions = (Array.isArray(input.questions) ? input.questions : []).slice(0, 6).map(question => {
    if (!question || typeof question !== 'object') return null;
    const type = QTYPES.has(question.type) ? question.type : 'multiple-choice';
    const options = type === 'multiple-choice' ? asStringList(question.options, 4, 300) : [];
    const correctAnswer = type === 'multiple-choice'
      ? resolveChoice(options, question.correctAnswer)
      : clip(question.correctAnswer, 600);
    if (!clip(question.question, 500) || !correctAnswer) return null;
    if (type === 'multiple-choice' && options.length < 2) return null;
    return {
      question: clip(question.question, 500),
      type,
      options,
      correctAnswer,
      explanation: clip(question.explanation, 900),
      difficulty: LEVELS.has(question.difficulty) ? question.difficulty : 'medium',
      relatedSection: clip(question.relatedSection, 180)
    };
  }).filter(Boolean);

  const lesson = {
    title: clip(input.title, 180),
    topic: clip(input.topic, 400),
    language,
    summary: clip(input.summary, 800),
    learningObjectives: asStringList(input.learningObjectives, 6, 300),
    sections,
    keyTakeaways: asStringList(input.keyTakeaways, 6, 300),
    questions,
    conclusion: clip(input.conclusion, 800)
  };
  if (!lesson.title || !lesson.sections.length || !lesson.questions.length) {
    throw new HttpError(502, 'invalid_response', 'The tutor response was missing lesson content.');
  }
  return lesson;
}

export function normalizeQuestion(input) {
  const lesson = normalizeLesson({
    title: 'Question',
    topic: 'Question',
    language: input && input.language,
    summary: 'Question',
    learningObjectives: [],
    sections: [{ heading: 'Practice', explanation: 'Practice', bulletPoints: [], examples: [], codeExample: '', codeLanguage: '', mathExpressions: [], diagramDescription: '', visualType: 'none', mermaid: '', tableLines: [] }],
    keyTakeaways: [],
    questions: [input],
    conclusion: 'Practice'
  }, input && input.language);
  return lesson.questions[0];
}

export function cleanLessonContext(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const sections = Array.isArray(input.sections) ? input.sections.slice(0, 8).map(section => {
    if (!section || typeof section !== 'object') return null;
    return {
      heading: clip(section.heading, 180),
      explanation: clip(section.explanation, 900),
      bulletPoints: asStringList(section.bulletPoints, 6, 240)
    };
  }).filter(section => section && (section.heading || section.explanation)) : [];
  const lesson = {
    language: input.language === 'my' ? 'my' : 'en',
    title: clip(input.title, 180),
    topic: clip(input.topic, 400),
    summary: clip(input.summary, 800),
    learningObjectives: asStringList(input.learningObjectives, 6, 240),
    sections,
    keyTakeaways: asStringList(input.keyTakeaways, 6, 240),
    conclusion: clip(input.conclusion, 600)
  };
  if (!lesson.title && !lesson.topic && !sections.length) return null;
  return lesson;
}

export function cleanHistory(input) {
  if (!Array.isArray(input)) return [];
  return input.slice(-8).map(turn => {
    if (!turn || typeof turn !== 'object') return null;
    const q = clip(turn.q, 1500);
    const a = clip(turn.a, 2000);
    if (!q || !a) return null;
    return { q, a };
  }).filter(Boolean);
}

export function cleanProgress(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { currentSection: '', recentAnswers: [] };
  }
  const recentAnswers = Array.isArray(input.recentAnswers) ? input.recentAnswers.slice(-8).map(item => {
    if (!item || typeof item !== 'object') return null;
    const result = ['correct', 'incorrect', 'skipped', 'revealed'].includes(item.result) ? item.result : '';
    const question = clip(item.question, 300);
    if (!question || !result) return null;
    return { question, result };
  }).filter(Boolean) : [];
  return { currentSection: clip(input.currentSection, 180), recentAnswers };
}

export function cleanStringList(input, maxItems, maxLen) {
  return asStringList(input, maxItems, maxLen);
}

export const LESSON_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    topic: { type: 'string' },
    language: { type: 'string', enum: ['en', 'my'] },
    summary: { type: 'string' },
    learningObjectives: { type: 'array', items: { type: 'string' } },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          explanation: { type: 'string' },
          bulletPoints: { type: 'array', items: { type: 'string' } },
          examples: { type: 'array', items: { type: 'string' } },
          codeExample: { type: 'string' },
          codeLanguage: { type: 'string' },
          mathExpressions: { type: 'array', items: { type: 'string' } },
          diagramDescription: { type: 'string' },
          visualType: { type: 'string', enum: ['flowchart', 'concept-map', 'table', 'none'] },
          mermaid: { type: 'string' },
          tableLines: { type: 'array', items: { type: 'string' } }
        },
        required: ['heading', 'explanation', 'bulletPoints', 'examples', 'codeExample', 'codeLanguage', 'mathExpressions', 'diagramDescription', 'visualType', 'mermaid', 'tableLines']
      }
    },
    keyTakeaways: { type: 'array', items: { type: 'string' } },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          type: { type: 'string', enum: ['multiple-choice', 'short-answer'] },
          options: { type: 'array', items: { type: 'string' } },
          correctAnswer: { type: 'string' },
          explanation: { type: 'string' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          relatedSection: { type: 'string' }
        },
        required: ['question', 'type', 'options', 'correctAnswer', 'explanation', 'difficulty', 'relatedSection']
      }
    },
    conclusion: { type: 'string' }
  },
  required: ['title', 'topic', 'language', 'summary', 'learningObjectives', 'sections', 'keyTakeaways', 'questions', 'conclusion']
};

export const QUESTION_SCHEMA = {
  type: 'object',
  properties: LESSON_SCHEMA.properties.questions.items.properties,
  required: LESSON_SCHEMA.properties.questions.items.required
};

export const GRADE_SCHEMA = {
  type: 'object',
  properties: {
    correct: { type: 'boolean' },
    feedback: { type: 'string' }
  },
  required: ['correct', 'feedback']
};
