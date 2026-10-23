export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.expose = true;
  }
}

const SAFE = {
  config: 'The tutor is not configured yet. Add GEMINI_API_KEY to the server .env file and restart.',
  auth: 'The tutor could not authenticate with Gemini. Check the API key on the server.',
  model: 'The configured Gemini model is not available for this API key. Set GEMINI_MODEL to a supported model and restart.',
  rate_limit: 'The tutor has hit its usage limit. Wait a moment, then try again.',
  timeout: 'The tutor took too long to respond. Try again.',
  network: 'The tutor could not be reached. Check the connection and try again.',
  invalid_response: 'The tutor returned a lesson that could not be read. Try again.',
  validation: 'Check the topic and files, then try again.',
  empty: 'Add a topic or a supported file before creating a lesson.',
  file_type: 'That file type is not supported. Use PDF, PNG, JPG, WEBP, TXT, DOCX, or PPTX.',
  file_size: 'Each file must be 8 MB or smaller.',
  file_count: 'You can upload up to 4 files for one lesson.',
  file_read: 'One of the files could not be read. Try a different file.',
  upstream: 'The tutor could not complete that request. Try again.',
  language: 'The tutor replied in English instead of Burmese. Try again.',
  pdf: 'The PDF could not be created. Chrome or Edge needs to be installed, then try again.',
  audio: 'The narration could not be created. Try again.',
  unsupported_voice: 'That narration voice is not available. Choose another voice.'
};

export function safeMessage(code) {
  return SAFE[code] || SAFE.upstream;
}

export function sanitizeLog(value) {
  return String(value || '')
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[redacted]')
    .replace(/[A-Za-z0-9+/]{80,}={0,2}/g, '[redacted]')
    .slice(0, 400);
}

export function publicError(err) {
  if (err instanceof HttpError && err.expose) {
    return { status: err.status, code: err.code, error: err.message || safeMessage(err.code) };
  }
  const status = Number(err && err.status) || 500;
  const code = (err && err.code) || 'upstream';
  return { status: status >= 400 && status < 600 ? status : 500, code: SAFE[code] ? code : 'upstream', error: safeMessage(SAFE[code] ? code : 'upstream') };
}
