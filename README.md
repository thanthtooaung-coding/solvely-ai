# Whiteboard Tutor

The Home page, AI Study tools, and study sets in this project stay as they are. The Whiteboard Tutor calls Google Gemini through a small Node.js server so the API key never reaches the browser.

Node.js 20 or newer is required.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file and add your own key:

```bash
copy .env.example .env
```

On macOS or Linux, use `cp .env.example .env`.

3. Edit `.env`:

```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.5-flash
PORT=3000
GEMINI_TIMEOUT_MS=120000
```

Put the key only in `.env`. Do not paste it into HTML, CSS, JavaScript, or this README. `.env` is listed in `.gitignore`.

`GEMINI_MODEL` must be a model id your key can use. Current Gemini docs use ids such as `gemini-3.5-flash` and `gemini-3.8-flash`. If lesson creation says the model is unavailable, change `GEMINI_MODEL` and restart the server.

## Run

From this folder:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). The page needs this server. Opening `index.html` directly with `file://` cannot reach the tutor.

## Check that it is working

Health check:

```bash
curl http://localhost:3000/api/health
```

A healthy server responds with `ok: true` and `configured: true` after the key is set. The response does not include the key or other environment values.

Lesson generation: on the Home page, choose **Whiteboard Tutor**, enter a topic such as `Photosynthesis`, and press **Create lesson**. Switch the language button to **မြန်မာ** before creating a lesson when the whole lesson should be in Burmese. Code, SQL, and formulas stay in their usual notation. The preparation screen stays on the current step until Gemini returns a lesson, then the whiteboard opens.

Download: the download button on the whiteboard saves a two-column PDF of the lesson notes. It needs Chrome or Edge on the same computer as the server.

Tutor chat: after the lesson opens, type a follow-up such as `Explain this part more simply` and send it. The reply streams onto the board.

Another check, from the shell:

```bash
curl -X POST http://localhost:3000/api/whiteboard/lesson -H "Content-Type: application/json" -d "{\"topic\":\"Photosynthesis\",\"language\":\"en\"}"
```

An empty topic and no file returns a validation error. A missing key returns a configuration error. A Gemini failure returns an error and does not substitute a sample lesson.

Syntax and local tests:

```bash
npm run check
npm test
```
