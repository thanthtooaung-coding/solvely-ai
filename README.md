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
GEMINI_TTS_MODEL=gemini-3.8-flash-lite-tts
PORT=3000
GEMINI_TIMEOUT_MS=120000
```

Put the key only in `.env`. Do not paste it into HTML, CSS, JavaScript, or this README. `.env` is listed in `.gitignore`.

`GEMINI_MODEL` must be a model id your key can use for lesson text. Current Gemini docs use ids such as `gemini-3.5-flash` and `gemini-3.8-flash`. If lesson creation says the model is unavailable, change `GEMINI_MODEL` and restart the server.

`GEMINI_TTS_MODEL` is a separate Gemini text-to-speech model used only for whiteboard narration (default `gemini-3.8-flash-lite-tts`). `GEMINI_TRANSCRIBE_MODEL` (default `gemini-3.5-transcribe`) is used after TTS to recover word timings for karaoke-style highlighting. The lesson text model does not produce audio. The same `GEMINI_API_KEY` is used for all three. If narration fails with a model error, set the matching env var to a model your key supports and restart.

### ElevenLabs voice (optional)

Add `ELEVENLABS_API_KEY` to `.env` to narrate the whiteboard with ElevenLabs instead of Gemini TTS. ElevenLabs returns character timings with the audio, so word sync and typing need no separate Transcribe call.

- `ELEVENLABS_VOICE_ID`: voice to use. If empty, the first voice in your ElevenLabs account is used. The voice menu on the whiteboard lists your account's voices.
- `ELEVENLABS_MODEL` (default `eleven_multilingual_v2`) for English lessons, `ELEVENLABS_MODEL_MY` (default `eleven_v4`) for Burmese lessons. Burmese requests send `language_code: my`. `eleven_v3`, `eleven_multilingual_v2` and `eleven_flash_v2_5` do not support Burmese: without the code they read Myanmar script as English-sounding speech, and with it they fail, so the server falls back to Gemini TTS.
- `ELEVENLABS_LANGUAGES` (default `en,my`): set to `en` to keep Burmese lessons on Gemini TTS.

If an ElevenLabs request fails, the server falls back to Gemini TTS when `GEMINI_API_KEY` is set. ElevenLabs bills by characters.

**Live streaming.** For lesson languages listed in `ELEVENLABS_STREAM_LANGUAGES` (default `en,my`), voices are not preloaded. The whiteboard opens as soon as the lesson text is ready. Each section streams from ElevenLabs (`POST /api/whiteboard/narration/stream`, PCM audio plus word timings) and starts playing in about a second. The next section downloads while the current one plays. Tutor chat replies are spoken while Gemini is still writing them, and lesson narration pauses during the spoken reply. `ELEVENLABS_STREAM_MODEL` (default `eleven_flash_v2_5`) is the English streaming model. `ELEVENLABS_STREAM_MODEL_MY` (default `eleven_v4`) is the Burmese one. `eleven_v4` does not accept the ElevenLabs input-streaming WebSocket, so Burmese chat replies are spoken one finished sentence at a time over the HTTP stream instead. Streamed speech supports speeds from 0.7× to 1.2×. Languages not in the list keep the preload behaviour. If a stream fails before audio starts, that section falls back to the non-streaming route.

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

Flashcards: on the Home page, choose **Flashcards**, enter a topic such as `I want to know about microservices`, optionally set card count / difficulty / style, and press **Create cards**. Gemini generates a study set; progress (Need Review / Mastered) is saved in this browser only under `localStorage` key `solvely.flashcards.v1`. There is no flashcard database or login. Open `#/flashcards/sets` to return to saved sets after a refresh.

Download: the download button on the whiteboard saves a two-column PDF of the lesson notes. It needs Chrome or Edge on the same computer as the server.

Tutor chat: after the lesson opens, type a follow-up such as `Explain this part more simply` and send it. The reply streams onto the board.

Audio narration: on the whiteboard, use the narration controls next to the tutor avatar. Press Play to generate speech for the current lesson section with Gemini TTS. Pause, stop, replay, previous/next section, mute, voice, and speed (0.75x–2.0x) are supported. Auto-continue moves to the next section when enabled. Narration pauses when a question card opens. English and Burmese lessons are narrated in the lesson language.

Word sync: after TTS, the server runs Gemini Transcribe (`GEMINI_TRANSCRIBE_MODEL`, default `gemini-3.5-transcribe`) with word timestamps, aligns them to the script, and the UI highlights each word through the last word as audio plays. If alignment fails, timings are estimated evenly. If Gemini TTS is unavailable, the browser speech synthesizer is used as a fallback for that section (without cloud word marks).

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
