import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { geminiConfigured } from './env.js';
import { HttpError, publicError, safeMessage, sanitizeLog } from './errors.js';
import { excerptFor, prepareMaterials, MAX_FILE_BYTES, MAX_FILES } from './files.js';
import { generateLesson, generateQuestion, gradeAnswer, tutorChat } from './gemini.js';
import { generateFlashcards, generateStudyGuide, generateReviewGuide, flashcardChat } from './flashcards.js';
import { cleanHistory, cleanLessonContext, cleanProgress, cleanStringList, clip, languageOf } from './lesson.js';
import { generateNarration, narrationStatus, prepareNarrationText } from './narration.js';
import { renderNotesHtml } from './notes.js';
import { htmlToPdf } from './printpdf.js';

const PUBLIC_FILES = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/styles.css', 'styles.css'],
  ['/app.js', 'app.js'],
  ['/solvely-preview.html', 'solvely-preview.html']
]);

function uploadParser() {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES, fields: 8, fieldSize: 256 * 1024, parts: 16 }
  });
  return (req, res, next) => {
    const type = req.headers['content-type'] || '';
    if (req.path === '/api/whiteboard/pdf') {
      return express.json({ limit: '3mb' })(req, res, err => {
        if (!err) return next();
        next(new HttpError(400, 'validation', 'The notes were too large to download.'));
      });
    }
    if (type.includes('multipart/form-data')) {
      return upload.array('files', MAX_FILES)(req, res, err => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_PART_COUNT' || err.code === 'LIMIT_FIELD_VALUE') {
          return next(new HttpError(413, err.code === 'LIMIT_FILE_COUNT' ? 'file_count' : 'file_size', safeMessage(err.code === 'LIMIT_FILE_COUNT' ? 'file_count' : 'file_size')));
        }
        return next(new HttpError(400, 'file_read', safeMessage('file_read')));
      });
    }
    return express.json({ limit: '256kb' })(req, res, err => {
      if (!err) return next();
      next(new HttpError(400, 'validation', 'The request was too large or was not valid JSON.'));
    });
  };
}

function readJson(body, key) {
  if (!body || typeof body !== 'object') return undefined;
  const value = body[key];
  if (value == null || value === '') return undefined;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') throw new HttpError(400, 'validation', 'Part of the request could not be read.');
  try {
    return JSON.parse(value);
  } catch {
    throw new HttpError(400, 'validation', 'Part of the request was not valid JSON.');
  }
}

function textField(body, key, max) {
  if (!body || typeof body !== 'object') return '';
  const value = body[key];
  return typeof value === 'string' ? clip(value, max) : '';
}

function bindAbort(req, res) {
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });
  return controller;
}

function logRequest(route, started, status, files) {
  console.log(JSON.stringify({
    at: new Date().toISOString(),
    route,
    status,
    ms: Date.now() - started,
    files: (files || []).map(file => ({ name: String(file.originalname || '').slice(0, 80), bytes: file.size || 0 }))
  }));
}

export function createApp(options = {}) {
  const root = options.root || resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  app.get('/api/health', (_req, res) => {
    const narr = narrationStatus();
    res.json({ ok: true, service: 'whiteboard-tutor', configured: geminiConfigured(), narration: narr.configured });
  });

  app.get('/api/whiteboard/narration', (_req, res) => {
    res.json(narrationStatus());
  });

  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: safeMessage('rate_limit'), code: 'rate_limit' });
    }
  });
  const parseBody = uploadParser();
  app.use('/api/whiteboard', limiter, parseBody);
  app.use('/api/flashcards', limiter, parseBody);

  app.post('/api/whiteboard/narration', async (req, res, next) => {
    const started = Date.now();
    try {
      const text = prepareNarrationText(textField(req.body, 'text', 4000), textField(req.body, 'language', 8));
      if (!text) throw new HttpError(400, 'empty', 'There is nothing to narrate in this section.');
      const controller = bindAbort(req, res);
      const result = await generateNarration({
        text,
        language: languageOf(textField(req.body, 'language', 8)),
        voice: textField(req.body, 'voice', 40),
        signal: controller.signal
      });
      logRequest('narration', started, 200);
      res.json({
        provider: result.provider,
        model: result.model,
        voice: result.voice,
        language: result.language,
        mimeType: result.mimeType,
        audioBase64: result.audioBase64,
        bytes: result.bytes,
        duration: result.duration || 0,
        cached: !!result.cached,
        text: result.text,
        words: Array.isArray(result.words) ? result.words.slice(0, 400) : []
      });
    } catch (err) {
      logRequest('narration', started, err.status || 500);
      next(err);
    }
  });

  app.post('/api/whiteboard/pdf', async (req, res, next) => {
    const started = Date.now();
    try {
      const html = renderNotesHtml(req.body || {});
      const pdf = await htmlToPdf(html);
      const title = clip(req.body && req.body.title, 80).replace(/[\\/:*?"<>|\u0000]/g, ' ').replace(/\s+/g, ' ').trim() || 'lesson';
      logRequest('pdf', started, 200);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="lesson.pdf"; filename*=UTF-8''${encodeURIComponent(title + '.pdf')}`);
      res.send(pdf);
    } catch (err) {
      logRequest('pdf', started, err.status || 500);
      next(err);
    }
  });

  app.post('/api/whiteboard/lesson', async (req, res, next) => {
    const started = Date.now();
    try {
      const topic = textField(req.body, 'topic', 4000);
      const language = languageOf(textField(req.body, 'language', 8));
      const level = textField(req.body, 'level', 80);
      const length = textField(req.body, 'length', 40);
      const prepared = await prepareMaterials(req.files || []);
      if (!topic && !prepared.parts.length) throw new HttpError(400, 'empty', safeMessage('empty'));
      const controller = bindAbort(req, res);
      const lesson = await generateLesson({ topic, language, level, length, parts: prepared.parts, signal: controller.signal });
      const materials = excerptFor(prepared.materials);
      logRequest('lesson', started, 200, req.files);
      res.json({ lesson, materials });
    } catch (err) {
      logRequest('lesson', started, err.status || 500, req.files);
      next(err);
    }
  });

  app.post('/api/whiteboard/chat', async (req, res, next) => {
    const started = Date.now();
    try {
      const message = textField(req.body, 'message', 4000);
      if (!message) throw new HttpError(400, 'validation', 'Type a question before sending.');
      const language = languageOf(textField(req.body, 'language', 8));
      const lesson = cleanLessonContext(readJson(req.body, 'lesson'));
      if (!lesson) throw new HttpError(400, 'validation', 'Start a lesson before asking the tutor.');
      const history = cleanHistory(readJson(req.body, 'history') || []);
      const progress = cleanProgress(readJson(req.body, 'progress') || {});
      const prepared = await prepareMaterials(req.files || []);
      const controller = bindAbort(req, res);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      const send = obj => {
        if (!res.writableEnded) res.write(`data: ${JSON.stringify(obj)}\n\n`);
      };
      if (prepared.materials.length) send({ materials: excerptFor(prepared.materials) });
      let sent = 0;
      await tutorChat({
        message,
        language,
        lesson,
        history,
        progress,
        parts: prepared.parts,
        signal: controller.signal,
        onDelta: text => {
          if (!text || sent >= 12000) return;
          const slice = text.slice(0, 12000 - sent);
          sent += slice.length;
          send({ delta: slice });
        }
      });
      send({ done: true });
      res.end();
      logRequest('chat', started, 200, req.files);
    } catch (err) {
      logRequest('chat', started, err.status || 500, req.files);
      const pub = publicError(err);
      if (res.headersSent) {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: pub.error, code: pub.code })}\n\n`);
          res.end();
        }
        return;
      }
      next(err);
    }
  });

  app.post('/api/whiteboard/question', async (req, res, next) => {
    const started = Date.now();
    try {
      const lesson = cleanLessonContext(readJson(req.body, 'lesson'));
      if (!lesson) throw new HttpError(400, 'validation', 'Start a lesson before asking for another question.');
      const controller = bindAbort(req, res);
      const question = await generateQuestion({
        language: languageOf(textField(req.body, 'language', 8)),
        lesson,
        previousQuestions: cleanStringList(readJson(req.body, 'previousQuestions') || [], 20, 300),
        recentAnswers: cleanProgress({ recentAnswers: readJson(req.body, 'recentAnswers') || [] }).recentAnswers,
        section: textField(req.body, 'section', 180),
        difficulty: textField(req.body, 'difficulty', 16),
        signal: controller.signal
      });
      logRequest('question', started, 200);
      res.json({ question });
    } catch (err) {
      logRequest('question', started, err.status || 500);
      next(err);
    }
  });

  app.post('/api/whiteboard/grade', async (req, res, next) => {
    const started = Date.now();
    try {
      const controller = bindAbort(req, res);
      const result = await gradeAnswer({
        language: languageOf(textField(req.body, 'language', 8)),
        question: textField(req.body, 'question', 500),
        expectedAnswer: textField(req.body, 'expectedAnswer', 600),
        explanation: textField(req.body, 'explanation', 900),
        learnerAnswer: textField(req.body, 'learnerAnswer', 2000),
        signal: controller.signal
      });
      logRequest('grade', started, 200);
      res.json(result);
    } catch (err) {
      logRequest('grade', started, err.status || 500);
      next(err);
    }
  });

  app.post('/api/flashcards/generate', async (req, res, next) => {
    const started = Date.now();
    try {
      const topic = textField(req.body, 'topic', 4000);
      const language = languageOf(textField(req.body, 'language', 8));
      const count = textField(req.body, 'count', 8) || req.body.count;
      const difficulty = textField(req.body, 'difficulty', 16);
      const style = textField(req.body, 'style', 24);
      const prepared = await prepareMaterials(req.files || []);
      if (!topic && !prepared.parts.length) throw new HttpError(400, 'empty', safeMessage('empty'));
      const controller = bindAbort(req, res);
      const studySet = await generateFlashcards({
        topic,
        language,
        count,
        difficulty,
        style,
        parts: prepared.parts,
        signal: controller.signal
      });
      const materials = excerptFor(prepared.materials);
      logRequest('flashcards.generate', started, 200, req.files);
      res.json({ studySet, materials });
    } catch (err) {
      logRequest('flashcards.generate', started, err.status || 500, req.files);
      next(err);
    }
  });

  app.post('/api/flashcards/study-guide', async (req, res, next) => {
    const started = Date.now();
    try {
      const studySet = readJson(req.body, 'studySet');
      if (!studySet || !Array.isArray(studySet.cards) || !studySet.cards.length) {
        throw new HttpError(400, 'validation', 'A study set with cards is required.');
      }
      const controller = bindAbort(req, res);
      const guide = await generateStudyGuide({
        language: languageOf(textField(req.body, 'language', 8)),
        studySet,
        topicId: textField(req.body, 'topicId', 40),
        signal: controller.signal
      });
      logRequest('flashcards.study-guide', started, 200);
      res.json({ guide });
    } catch (err) {
      logRequest('flashcards.study-guide', started, err.status || 500);
      next(err);
    }
  });

  app.post('/api/flashcards/review-guide', async (req, res, next) => {
    const started = Date.now();
    try {
      const studySet = readJson(req.body, 'studySet');
      if (!studySet || !Array.isArray(studySet.cards) || !studySet.cards.length) {
        throw new HttpError(400, 'validation', 'A study set with cards is required.');
      }
      const progress = readJson(req.body, 'progress') || {};
      const controller = bindAbort(req, res);
      const guide = await generateReviewGuide({
        language: languageOf(textField(req.body, 'language', 8)),
        studySet,
        progress,
        signal: controller.signal
      });
      logRequest('flashcards.review-guide', started, 200);
      res.json({ guide });
    } catch (err) {
      logRequest('flashcards.review-guide', started, err.status || 500);
      next(err);
    }
  });

  app.post('/api/flashcards/chat', async (req, res, next) => {
    const started = Date.now();
    try {
      const message = textField(req.body, 'message', 4000);
      if (!message) throw new HttpError(400, 'validation', 'Type a question before sending.');
      const studySet = readJson(req.body, 'studySet');
      if (!studySet || !Array.isArray(studySet.cards)) {
        throw new HttpError(400, 'validation', 'Open a study set before asking the tutor.');
      }
      const history = cleanHistory(readJson(req.body, 'history') || []);
      const controller = bindAbort(req, res);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      const send = obj => {
        if (!res.writableEnded) res.write(`data: ${JSON.stringify(obj)}\n\n`);
      };
      let sent = 0;
      await flashcardChat({
        message,
        language: languageOf(textField(req.body, 'language', 8)),
        studySet,
        history,
        signal: controller.signal,
        onDelta: text => {
          if (!text || sent >= 12000) return;
          const slice = text.slice(0, 12000 - sent);
          sent += slice.length;
          send({ delta: slice });
        }
      });
      send({ done: true });
      res.end();
      logRequest('flashcards.chat', started, 200);
    } catch (err) {
      logRequest('flashcards.chat', started, err.status || 500);
      const pub = publicError(err);
      if (res.headersSent) {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: pub.error, code: pub.code })}\n\n`);
          res.end();
        }
        return;
      }
      next(err);
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'That request is not available.', code: 'validation' });
  });

  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const file = PUBLIC_FILES.get(req.path);
    if (!file) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(resolve(root, file), error => {
      if (error && !res.headersSent) res.status(404).end();
    });
  });

  app.use((_req, res) => {
    res.status(404).type('text/plain').send('Not found');
  });

  app.use((err, _req, res, _next) => {
    const pub = publicError(err);
    if (!(err instanceof HttpError)) {
      console.error(JSON.stringify({ at: new Date().toISOString(), code: pub.code, status: pub.status, message: sanitizeLog(err && err.message) }));
    }
    if (res.headersSent) return;
    res.status(pub.status).json({ error: pub.error, code: pub.code });
  });

  return app;
}
