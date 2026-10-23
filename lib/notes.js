import { clip } from './lesson.js';

function esc(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function rich(value) {
  return esc(clip(value, 2500))
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<mark>$1</mark>')
    .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
    .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
}

function unsafe(html) {
  return /<script|javascript:|<iframe|<object|<embed|<foreignObject|<link|<meta/i.test(html);
}

function cleanMath(html) {
  const source = String(html || '').slice(0, 40000);
  if (!source || unsafe(source)) return '';
  return source.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function cleanSvg(html) {
  let source = String(html || '').slice(0, 150000);
  if (!source.includes('<svg')) return '';
  source = source
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
  if (unsafe(source) || !source.includes('<svg')) return '';
  return source;
}

function renderBlock(block, language) {
  if (!block || typeof block !== 'object') return '';
  if (block.t === 'title') return `<h1>${rich(block.text)}</h1>`;
  if (block.t === 'h') return `<h2>${rich(block.text)}</h2>`;
  if (block.t === 'p') return `<p>${rich(block.text)}</p>`;
  if (block.t === 'callout') return `<p class="callout">${rich(block.text)}</p>`;
  if (block.t === 'ul') {
    const items = Array.isArray(block.items) ? block.items.slice(0, 12) : [];
    return `<ul>${items.map(item => `<li>${rich(item)}</li>`).join('')}</ul>`;
  }
  if (block.t === 'code') {
    return `<pre>${block.lang ? `<span class="lang">${esc(clip(block.lang, 40))}</span>` : ''}${esc(clip(block.text, 2500))}</pre>`;
  }
  if (block.t === 'math') {
    const html = cleanMath(block.html);
    return html ? `<div class="math">${html}</div>` : (block.text ? `<p class="math-src">${esc(clip(block.text, 400))}</p>` : '');
  }
  if (block.t === 'table') {
    const headers = Array.isArray(block.headers) ? block.headers.slice(0, 6) : [];
    const rows = Array.isArray(block.rows) ? block.rows.slice(0, 8) : [];
    if (!headers.length) return '';
    return `<table><thead><tr>${headers.map(cell => `<th>${esc(clip(cell, 120))}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${(Array.isArray(row) ? row.slice(0, headers.length) : []).map(cell => `<td>${esc(clip(cell, 120))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  if (block.t === 'diagram') {
    const svg = cleanSvg(block.svg);
    const caption = rich(block.caption);
    if (!svg && !caption) return '';
    return `<figure class="diagram">${svg}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
  }
  if (block.t === 'q') {
    const options = Array.isArray(block.options) ? block.options.slice(0, 6) : [];
    const answerLabel = language === 'my' ? 'အဖြေ' : 'Answer';
    return `<div class="q"><p><b>${rich(block.question)}</b></p>${options.length ? `<ul>${options.map(option => `<li>${rich(option)}</li>`).join('')}</ul>` : ''}${block.correctAnswer ? `<p class="ans">${answerLabel}: ${rich(block.correctAnswer)}</p>` : ''}</div>`;
  }
  return '';
}

export function renderNotesHtml(input) {
  const language = input && input.language === 'my' ? 'my' : 'en';
  const blocks = Array.isArray(input && input.blocks) ? input.blocks.slice(0, 80) : [];
  const title = clip(input && input.title, 180) || (language === 'my' ? 'သင်ခန်းစာ' : 'Lesson');
  const tagline = language === 'my' ? 'ဘုတ်ပြား လေ့လာရေး' : 'Whiteboard Study';
  const body = blocks.map(block => renderBlock(block, language)).join('') || `<h1>${esc(title)}</h1>`;
  return `<!doctype html>
<html lang="${language === 'my' ? 'my' : 'en'}">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Patrick+Hand&family=Noto+Sans+Myanmar:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
<style>
  @page { size: A4; margin: 10mm 11mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; color: #2b2723; }
  body {
    min-height: 100vh;
    font-family: 'Patrick Hand', 'Noto Sans Myanmar', 'Myanmar Text', 'Segoe Print', cursive;
    font-size: 16.5px;
    line-height: 1.42;
    background-color: #fffdf8;
    background-image: radial-gradient(#d8d2c6 1.1px, transparent 1.1px);
    background-size: 16px 16px;
  }
  html[lang="my"] body {
    font-family: 'Noto Sans Myanmar', 'Myanmar Text', 'Padauk', sans-serif;
    font-size: 14.5px;
    line-height: 1.55;
  }
  .notes { columns: 2; column-gap: 26px; padding: 4px 2px 28px; }
  h1, h2, p, ul, pre, table, figure, .q, .math, .callout { break-inside: avoid; }
  h1 {
    margin: 0 0 10px;
    font-family: 'Caveat', 'Noto Sans Myanmar', 'Myanmar Text', cursive;
    font-weight: 700;
    font-size: 36px;
    line-height: 1.05;
    color: #1f9d55;
  }
  html[lang="my"] h1 {
    font-family: 'Noto Sans Myanmar', 'Myanmar Text', sans-serif;
    font-size: 26px;
    letter-spacing: 0;
  }
  h2 {
    margin: 14px 0 3px;
    font-size: 19px;
    font-style: italic;
    font-weight: 400;
    color: #1f9d55;
  }
  html[lang="my"] h2 { font-style: normal; font-weight: 700; font-size: 16px; }
  p { margin: 3px 0 8px; }
  ul { margin: 2px 0 8px; padding-left: 18px; }
  li { margin: 1px 0; }
  mark { background: #ffc9dc; color: inherit; padding: 0 3px; border-radius: 2px; font-style: inherit; }
  code, pre, .lang { font-family: Consolas, 'Courier New', monospace; font-style: normal; }
  code { font-size: .86em; background: rgba(120,110,90,.12); padding: 0 4px; border-radius: 3px; }
  pre { margin: 6px 0 10px; padding: 8px 10px; background: rgba(255,255,255,.88); border: 1px solid #ece7dc; border-radius: 8px; white-space: pre-wrap; font-size: 12px; }
  .lang { display: block; font-size: 10px; letter-spacing: .04em; opacity: .7; margin-bottom: 4px; }
  .callout { border-left: 3px solid #1f9d55; padding: 2px 8px; background: rgba(31,157,85,.08); }
  .math { margin: 6px 0 10px; overflow: hidden; }
  .math-src { font-family: Cambria, 'Times New Roman', serif; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-family: 'Noto Sans Myanmar', 'Segoe UI', sans-serif; font-size: 12px; font-style: normal; background: rgba(255,255,255,.9); }
  th, td { border: 1px solid #e4e0d8; padding: 4px 6px; text-align: left; vertical-align: top; }
  figure.diagram { margin: 8px 0 12px; padding: 8px; background: rgba(255,255,255,.92); border: 1px solid #ece7dc; border-radius: 10px; }
  figure svg { max-width: 100%; height: auto; display: block; }
  figcaption { margin-top: 4px; font-size: 13px; font-style: italic; color: #7b7466; }
  .q { margin: 10px 0; padding: 6px 8px; background: rgba(255,255,255,.85); border-radius: 8px; }
  .ans { color: #1f7a45; }
  footer {
    position: fixed; left: 11mm; bottom: 5mm;
    display: flex; align-items: center; gap: 8px;
    font-family: 'Segoe UI', 'Noto Sans Myanmar', sans-serif;
    font-size: 11px; color: #6b7280; font-style: normal;
  }
  footer b { color: #4c1d95; font-size: 12px; }
  footer small { display: block; }
</style>
</head>
<body>
<main class="notes">${body}</main>
<footer>
  <svg viewBox="0 0 26 26" width="18" height="18" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a63ff"/><stop offset="1" stop-color="#6b35f2"/></linearGradient></defs><rect width="26" height="26" rx="7" fill="url(#lg)"/><path d="M8.2 7.4c1.6 0 2.5 1 3.4 2.6l2.8 5.4c.9 1.7 1.7 2.9 3.4 2.9M17.8 7.6c-2.3.3-3.6 3-4.6 5M12 14.8c-.9 1.9-2.1 3.6-3.9 3.6" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/></svg>
  <span><b>Solvely.ai</b><small>${esc(tagline)}</small></span>
</footer>
</body>
</html>`;
}
