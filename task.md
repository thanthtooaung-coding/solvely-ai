# Cursor Prompt: Integrate Gemini AI into My Existing Whiteboard Tutor

## Project context

I have an existing Solvely.ai-inspired frontend built with vanilla HTML, CSS, and JavaScript. I want to connect Google Gemini API to the existing **Whiteboard Tutor** so it generates real lessons and behaves like an AI tutor instead of displaying mock data.

My current files are:
- `index.html`
- `styles.css`
- `app.js` (or the equivalent current JavaScript filename)
- `solvely-preview.html`

Inspect the actual files in the workspace before editing. The filenames above describe the intended roles; use the existing filenames and references found in the project.

I already have a Gemini API key. Do not ask me to paste it into the source code or commit it to Git.

## 1. Main objective

Connect Gemini AI to the complete Whiteboard Tutor workflow:

**Enter a topic or upload learning materials → Generate lesson → Show lesson preparation progress → Render the interactive whiteboard → Ask questions → Receive AI explanations → Continue learning → End lesson.**

Use my existing UI and the Solvely.ai screenshots I supplied as the design reference.

The result must be a working integration, not just a visual mockup.

## 2. Inspect the existing code first

Before making changes:

1. Read the existing HTML, CSS, and JavaScript.
2. Find the current Whiteboard Tutor tab, lesson creation screen, loading state, whiteboard workspace, question card, source-material panel, and tutor input.
3. Find existing routes, state variables, event listeners, file-upload handlers, localization, and dark-mode logic.
4. Identify all mock lesson data, fake AI responses, hardcoded question cards, and simulated progress that need to be replaced or connected to real API responses.
5. Preserve existing behavior outside the Whiteboard Tutor.

Do not rebuild the application from scratch or migrate it to React, Vue, or another framework.

## 3. Use a secure backend for Gemini

The frontend currently uses vanilla HTML, CSS, and JavaScript. Add a small Node.js backend using Express unless the project already has a suitable backend.

Use Google's official JavaScript SDK, `@google/genai`, and follow the current official Gemini API documentation.

Official references:
- API documentation: https://ai.google.dev/gemini-api/docs
- API key security: https://ai.google.dev/gemini-api/docs/api-key
- JavaScript SDK: https://github.com/googleapis/js-genai

Before choosing the model or API methods, verify the current official documentation and use a model that is actually available to my Gemini API key. Make the model configurable through an environment variable.

### Required security rules

- Store the API key in a backend environment variable named `GEMINI_API_KEY`.
- Never hardcode the key in HTML, CSS, frontend JavaScript, a public configuration file, or a Git repository.
- Never send the API key to the browser.
- Never log the API key or full sensitive document contents.
- Add `.env` to `.gitignore`.
- Create `.env.example` containing placeholders only.
- Validate and limit request sizes.
- Add reasonable rate limiting and request timeouts.
- Restrict CORS appropriately, preferably serving the frontend and API from the same origin.
- Return safe, user-friendly error messages without exposing secrets or internal stack traces.
- Validate incoming data and restrict the permitted request fields.
- Handle missing API keys gracefully with a clear backend configuration error.

Use environment variables such as:

`GEMINI_API_KEY=your_key_here`

`GEMINI_MODEL=your_supported_model_id`

`PORT=3000`

Do not put actual credentials in `.env.example`.

## 4. Backend API endpoints

Implement a clean API design. Use endpoints equivalent to the following, adapting names if the existing architecture requires it.

### A. Generate a lesson

`POST /api/whiteboard/lesson`

Input:
- Topic or lesson prompt.
- Optional extracted source text.
- Optional supported file attachments.
- Preferred language: English or Myanmar.
- Learner level, if supplied.
- Desired lesson length, if supplied.

The backend should call Gemini and return structured lesson data.

### B. Ask the tutor

`POST /api/whiteboard/chat`

Input:
- Current lesson ID or lesson context.
- User's question or response.
- Relevant lesson content.
- Recent conversation history.
- Preferred language.

Gemini should answer in the context of the current lesson. The user should be able to ask follow-up questions without regenerating the entire lesson.

### C. Generate the next question

`POST /api/whiteboard/question`

Input:
- Current lesson context.
- Previously asked questions.
- Learner's recent answers.
- Current section.

Generate a relevant question with answer choices, the correct answer, an explanation, and an appropriate difficulty.

Avoid repeating questions unnecessarily.

### D. Health check

`GET /api/health`

Return a simple service status without exposing secrets or environment variables.

Implement appropriate HTTP status codes and JSON error responses. Do not return successful mock data when Gemini fails.

## 5. Gemini lesson-generation requirements

The lesson-generation request must instruct Gemini to behave as an expert tutor who explains concepts clearly and interactively.

Ask Gemini to produce a lesson with the following structure:

- `title`: lesson title.
- `topic`: original topic.
- `language`: output language.
- `summary`: short introduction.
- `learningObjectives`: array of objectives.
- `sections`: array of lesson sections.
- `keyTakeaways`: array of important points.
- `questions`: array of interactive questions.
- `conclusion`: concise lesson summary.

Each section should contain:
- `heading`
- `explanation`
- `bulletPoints`
- `examples`
- `codeExample`, if relevant.
- `mathExpressions`, if relevant.
- `diagramDescription`, if relevant.
- `visualType`, such as `flowchart`, `concept-map`, `table`, or `none`.

Each question should contain:
- `question`
- `type`, such as `multiple-choice` or `short-answer`.
- `options`, where applicable.
- `correctAnswer`
- `explanation`
- `difficulty`
- `relatedSection`

Adapt the generated structure to the topic. For example, SQL lessons should include useful SQL examples and query-analysis explanations, while biology lessons should use appropriate biological concepts and diagrams.

Use Gemini's supported structured-output or JSON response features where appropriate. Validate the returned data on the backend before sending it to the frontend.

Do not rely on brittle parsing that assumes every response will be perfectly formatted JSON. Handle malformed or incomplete responses gracefully and provide a retry option.

## 6. Real lesson preparation progress

Replace the mock lesson-generation flow with a real API request.

When the user clicks **Create Lesson**:

1. Validate the topic or source materials.
2. Show the existing lesson-preparation screen.
3. Display preparation steps such as understanding the topic, planning the lesson, preparing explanations, and building practice questions.
4. Send the request to the backend.
5. Update the interface as real stages complete.
6. Open the whiteboard when the validated lesson data is ready.

Important: Do not invent an exact Gemini processing percentage or claim that a generation stage has completed when it has not.

If the API does not provide progress events, show an indeterminate progress indicator and clearly labeled preparation steps. Switch to the completed state only when the response is ready.

Handle cancellation, slow responses, API errors, rate limits, and retries without leaving the UI stuck in a loading state.

## 7. Render actual Gemini-generated content on the whiteboard

Connect the returned lesson data to the existing whiteboard.

Display:
- A lesson title.
- Learning objectives.
- Structured lesson sections.
- Explanations and bullet points.
- Code blocks.
- Mathematical expressions.
- Tables and diagrams where appropriate.
- Practice questions and answer feedback.
- Key takeaways and conclusion.

Preserve the current warm off-white canvas, subtle dotted background, handwritten-style headings, blue accents, and responsive layout.

Create reusable rendering functions for lesson sections and question cards instead of hardcoding individual lesson screens.

Render AI-generated text safely. Do not inject untrusted model output directly into `innerHTML` without proper sanitization. Prefer DOM APIs and safe text rendering; if Markdown or math rendering is needed, use a maintained library and sanitize generated HTML.

Use MathJax or KaTeX if appropriate for mathematical notation. Use Mermaid or a comparable safe diagram renderer if appropriate, and validate diagram syntax before rendering.

If a diagram cannot be rendered, show its textual description instead of breaking the lesson.

## 8. Interactive AI tutor conversation

Connect the existing bottom input, send button, and question/response controls to Gemini.

The learner should be able to ask questions such as:
- “Explain this part more simply.”
- “Give me another example.”
- “Why does this SQL query have that time complexity?”
- “Explain this in Burmese.”
- “Ask me a harder question.”
- “Summarize the current section.”

Gemini must use the current lesson and relevant conversation history to provide contextual answers.

Display:
- The user's message.
- The tutor's response.
- A loading indicator while the response is being generated.
- A retry action if the request fails.
- Clear feedback when the user has no connection or the API quota has been exceeded.

Keep the UI responsive. Disable duplicate submissions while a request is in progress, but do not permanently disable the input after an error.

Limit conversation history sent to the backend so requests do not grow indefinitely.

If practical, use streaming responses for tutor messages. Only implement streaming if it is supported reliably by the chosen Gemini API method and can be integrated without breaking the existing UI.

## 9. Interactive questions and learning feedback

Use Gemini-generated questions in the floating question card.

Implement the complete interaction:
1. Display a question and its answer choices.
2. Let the learner select an answer.
3. Compare the answer against the expected answer.
4. Show correct/incorrect feedback.
5. Display the explanation returned by Gemini.
6. Offer a Next Question action.
7. Track the learner's progress within the current session.
8. Request more questions from Gemini when necessary.

For short-answer questions, use Gemini to evaluate the response against the expected answer and explanation. Accept reasonable equivalent wording and explain misunderstandings constructively.

Never reveal the correct answer before the learner submits a response unless they choose to reveal it or skip the question.

Keep the question card's Skip action functional.

Do not treat a question as completed until the learner submits an answer or explicitly skips it.

## 10. File uploads and original materials

Connect the existing source-material panel and upload controls to the lesson-generation workflow.

Support these file types where practical:
- PDF.
- Images such as PNG, JPG, and JPEG.
- Plain text.
- DOCX.
- PPTX.

Requirements:
- Validate file type and file size on both the frontend and backend.
- Display uploaded filenames and useful processing states.
- Extract text from supported document formats when appropriate.
- Use Gemini's documented multimodal or file-input features for supported PDFs and images where useful.
- Pass relevant extracted text or file content to the lesson-generation endpoint.
- Never assume that a file was successfully processed simply because it was selected.
- Show a clear error if extraction or upload fails.

For formats that Gemini cannot accept directly, extract the text on the backend with suitable maintained libraries, or explain the unsupported format.

Do not blindly send huge documents. Apply sensible size limits, truncate or summarize long extracted content safely, and inform the learner if only part of the material is used.

Treat uploaded content as untrusted data, not as instructions to change system behavior or reveal secrets.

The lesson should prioritize the learner's uploaded materials when provided and should not invent quotations or claim that content came from a document unless it actually did.

## 11. Follow-up questions and lesson continuity

Maintain the active lesson context during the session.

When the learner asks a follow-up question, Gemini should:
- Refer to the current topic and section.
- Explain terminology used earlier.
- Avoid unnecessarily repeating the entire lesson.
- Remember the learner's recent answers within reasonable context limits.
- Adjust the explanation based on the learner's level and requested language.

Keep lesson state separate from unrelated Home and AI Study features.

If you implement persistence, use an appropriate storage mechanism and do not store sensitive uploaded materials or conversations unnecessarily. Clearly handle browser refreshes and ending a lesson.

## 12. Language support

Preserve the existing English/Myanmar language toggle.

Send the selected language to Gemini and request responses in that language. Keep code, SQL syntax, mathematical notation, and technical identifiers correct when generating Burmese explanations.

Do not remove or break existing localization labels. Add translations for any new interface text where the project already uses its localization dictionary.

## 13. End lesson and error handling

When the learner clicks End Lesson:
- Stop any active tutor playback or streaming request where possible.
- Show a confirmation or lesson-completion screen.
- Display a short summary of completed sections and answered questions if available.
- Provide actions to return to Home or AI Study.
- Ensure the user can start a new lesson afterward.

Handle common errors:
- Missing or invalid API key.
- Unsupported model.
- Rate limit or quota exceeded.
- Network failure.
- Request timeout.
- Invalid Gemini response.
- Unsupported or oversized file.
- Empty topic and empty source material.

Use friendly error messages and a Retry action where appropriate. Never silently fall back to fake AI answers.

## 14. Configuration and running locally

Create or update the necessary backend files, including:
- `package.json`
- Backend entry point, such as `server.js`
- `.env.example`
- `.gitignore`

Reuse existing project configuration if present rather than duplicating it.

Document:
1. The required Node.js version.
2. How to install dependencies.
3. Where to put my Gemini API key.
4. How to select a supported Gemini model.
5. How to start the backend and frontend.
6. How to test the health endpoint.
7. How to test lesson generation and tutor chat.

Serve the frontend through the local server or a development server configured to proxy `/api` to the backend. Do not rely on opening the HTML file directly through `file://` if the API requires a running server.

Keep API base URLs configurable for development and deployment.

## 15. Testing and acceptance criteria

After implementing the integration, verify the following:

- The application starts successfully.
- The backend health endpoint works.
- The API key remains server-side.
- Creating a lesson sends a real request to Gemini.
- Different topics produce different lesson content.
- The lesson is rendered dynamically from the API response.
- Follow-up questions receive contextual Gemini responses.
- The question card displays generated questions and evaluates answers.
- Supported uploaded materials are processed and used in the lesson.
- Invalid input and API failures produce clear error states.
- Retry works.
- End Lesson and navigation work.
- Home, AI Study, study sets, existing study tools, dark mode, language switching, and sidebar collapse still work.
- The interface remains responsive on desktop and mobile.
- No fake success messages or mock AI responses remain in the Whiteboard Tutor's live API workflow.

Run the relevant syntax checks and tests. If browser testing is available, exercise the entire workflow in the browser.

At the end, give me:
1. A summary of modified and created files.
2. The commands to install and run the project.
3. The `.env` variables I must configure.
4. The features that are fully connected to Gemini.
5. Any remaining limitations or features requiring additional APIs.

**Implement the changes directly in my existing project. Do not stop after giving me instructions or code snippets.**