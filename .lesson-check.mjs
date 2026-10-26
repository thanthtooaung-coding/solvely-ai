import { loadEnv, geminiModel } from './lib/env.js';
loadEnv(process.cwd());
const { GoogleGenAI } = await import('@google/genai');
const { LESSON_SCHEMA } = await import('./lib/lesson.js');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const t0 = Date.now();
const rules = 'Required output language: Myanmar (Burmese), code "my". Write EVERY learner-facing string in Burmese script. Set language to "my".';
const r = await ai.interactions.create({
  model: geminiModel(), store: false,
  system_instruction: 'You are an expert tutor writing for an interactive whiteboard.\n' + rules,
  input: [{ type: 'text', text: rules + '\nCreate one interactive whiteboard lesson as JSON matching the schema. Write 3 to 5 sections and 3 questions.\nTopic: ???????????? ???????' }],
  response_format: { type: 'text', mime_type: 'application/json', schema: LESSON_SCHEMA },
  generation_config: { max_output_tokens: 8192, thinking_level: 'medium' }
});
const text = r.output_text || (r.steps || []).flatMap(s => (s.content || []).filter(p => p.type === 'text').map(p => p.text)).join('');
let ok = true; try { JSON.parse(text); } catch { ok = false; }
console.log(JSON.stringify({ ms: Date.now() - t0, status: r.status, usage: r.usage, chars: text.length, validJson: ok, tail: text.slice(-160) }, null, 1));
