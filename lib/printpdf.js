import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HttpError } from './errors.js';

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

export function findBrowser() {
  return CANDIDATES.find(path => existsSync(path)) || '';
}

export async function htmlToPdf(html) {
  const browser = findBrowser();
  if (!browser) throw new HttpError(503, 'pdf', 'PDF download needs Chrome or Edge on this computer.');
  const dir = await mkdtemp(join(tmpdir(), 'solvely-pdf-'));
  const htmlPath = join(dir, 'notes.html');
  const pdfPath = join(dir, 'notes.pdf');
  try {
    await writeFile(htmlPath, html, 'utf8');
    await new Promise((resolve, reject) => {
      const child = spawn(browser, [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--no-pdf-header-footer',
        '--virtual-time-budget=10000',
        '--run-all-compositor-stages-before-draw',
        `--user-data-dir=${join(dir, 'profile')}`,
        `--print-to-pdf=${pdfPath}`,
        pathToFileURL(htmlPath).href
      ], { stdio: 'ignore', windowsHide: true });
      const timer = setTimeout(() => {
        child.kill();
        reject(new HttpError(504, 'timeout', 'The PDF took too long to create. Try again.'));
      }, 30000);
      child.on('error', err => {
        clearTimeout(timer);
        reject(err);
      });
      child.on('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
    const info = await stat(pdfPath);
    if (!info.isFile() || info.size < 500) throw new HttpError(502, 'pdf', 'The PDF could not be created. Try again.');
    return await readFile(pdfPath);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, 'pdf', 'The PDF could not be created. Try again.');
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
