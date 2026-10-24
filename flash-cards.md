# Cursor Prompt: Implement Full-Stack AI Flashcards Without a Database or Authentication

## Project

Continue developing my existing repository:

https://github.com/thanthtooaung-coding/solvely-ai

My Whiteboard Tutor is already working with Gemini AI through the existing Node.js + Express.js backend.

Now implement the Flashcards feature based on the Solvely.ai reference screenshots.

## 1. Critical Architecture Requirements

Follow the exact lightweight architecture used by my existing Whiteboard Tutor.

- Frontend: Existing HTML, CSS, and JavaScript.
- Backend: Existing Node.js + Express.js server.
- AI: Existing Gemini integration using `@google/genai`.
- Persistence: Browser `localStorage` for study sets and progress.
- Database: None.
- Authentication: None.

**Do not introduce a database, ORM, authentication system, new backend framework, or separate server.**

Reuse the existing `server.js`, `lib/app.js`, Gemini services, environment configuration, and frontend files.

Inspect the actual repository before coding. Extend existing files where appropriate and create small additional modules only when necessary.

Do not modify or break the completed Whiteboard Tutor, including lesson generation, narration, audio playback, chat, questions, grading, file uploads, and PDF downloads.

## 2. Home Page Flashcards Tab

Complete the Flashcards tab in the existing Home page.

The input panel should include:

- Flashcards tab.
- Topic or learning-request input.
- File attachment button using existing upload capabilities where practical.
- Create Cards button.
- Clickable example topics.
- Optional generation settings.

Example request:

`I want to know about microservices.`

Allow users to configure the number of cards, difficulty, language, and card style if practical.

Reuse the existing UI style and responsive layout.

## 3. Gemini Flashcard Generation

When the user clicks Create Cards:

1. Validate the input.
2. Send the request to the existing backend.
3. Call Gemini using the existing Gemini service and API key configuration.
4. Generate structured flashcards.
5. Validate Gemini's response.
6. Return the cards to the frontend.
7. Create a study set and save it in browser `localStorage`.
8. Navigate to the study-set detail page.

Each card should contain:

- Unique card ID.
- Topic.
- Question/front.
- Answer/back.
- Explanation.
- Optional example.
- Difficulty.
- Tags.
- Ordering.

Generate useful active-recall questions, avoid duplicate cards, and keep answers concise and accurate.

Support English and Myanmar where possible.

Use valid structured JSON output when supported by the configured Gemini model. Validate the resulting data before returning it.

Do not use hardcoded sample cards as the actual result. If Gemini fails, display a useful error and allow the user to retry.

## 4. Loading and Generation Page

After clicking Create Cards, show a preparation page similar to the reference screenshots.

Display:

- Original learning request.
- Loading animation.
- "Preparing your study set..." message.
- Back to Study Sets button.

Use the real request state. Do not show fake progress percentages.

When Gemini succeeds, open the generated study set. If generation fails, show an error and a Retry button.

## 5. Study Set Detail Page

Implement the study-set detail layout shown in the screenshots.

### Left sidebar

Include:

- Back button.
- Study-set title.
- Topics and Sources tabs.
- All filter.
- Need Review filter.
- Mastered filter.
- Incomplete filter.
- Overview.
- Topic list with progress indicators.

All counts must be calculated from the actual saved flashcards and progress.

### Center area

Include:

- Selected topic title.
- Mastery indicator.
- Study Guide tab.
- Review Guide tab.
- Flashcards count.
- Quiz count if a working quiz exists.
- Topic overview.
- Practice cards.

Generate the study guide from the actual Gemini-generated study set. The review guide should reflect the student's real saved progress.

Do not display fake quiz availability or fake mastery statistics.

### Right-side AI tutor chat

Provide a contextual chat panel similar to the screenshots.

Reuse the existing Gemini chat service where practical. Add a Flashcards-specific prompt or service wrapper rather than duplicating the entire Gemini client.

Pass the current study set and relevant conversation history as context.

Users should be able to ask follow-up questions about their flashcards.

Do not store chat history on a server or in a database. Save it in `localStorage` if persistence is desired.

## 6. Interactive Flashcard Study Page

Implement a dedicated study interface inspired by the reference screenshots.

### Header

Display:

- Breadcrumb: Study Set > Flashcards.
- Current topic.
- Current card number and total.
- Progress bar.
- Need Review count.
- Mastered count.

### Card

Create a large centered card with:

- Front: question or concept.
- Back: answer and explanation.
- Click-to-flip interaction.
- Flip animation.
- Optional edit action.
- Optional source reference.
- Optional Ask Follow-Up action.

Include a hint such as "Press Space or click to flip and see the answer."

Support keyboard interaction and touch-friendly controls.

### Assessment buttons

Provide:

- Need Review.
- Mastered.

When clicked:

1. Update the card's status.
2. Save the change to `localStorage`.
3. Recalculate the progress counts.
4. Update the progress bar.
5. Move to the next card where appropriate.

Do not mark cards as mastered just because they were opened or flipped.

Provide Previous and Next controls. Handle the final card with a completion summary or an option to finish the session.

## 7. Browser Persistence — No Database

Use browser `localStorage` for study sets, flashcards, card progress, and study-session state.

Create a small storage helper module if useful, for example:

`lib/flashcard-storage.js`

However, browser storage must be accessed only by frontend code. The Node.js backend must not attempt to access browser `localStorage`.

Use a versioned storage key, such as:

`solvely.flashcards.v1`

Store data in a structured format containing:

- Study-set metadata.
- Original user request.
- Generated topics.
- Flashcards.
- Card mastery statuses.
- Study-guide content if generated.
- Relevant chat history if desired.
- Current card index.
- Creation and update timestamps.

Requirements:

- Save a study set after successful generation.
- Restore study sets when the page is refreshed.
- Allow users to return to previously generated study sets.
- Save progress after every assessment action.
- Restore the current study session after refreshing.
- Allow renaming and deleting study sets.
- Handle invalid or corrupted stored JSON gracefully.
- Handle browser storage quota errors.
- Avoid overwriting unrelated application data.
- Use stable IDs for study sets and cards.

Do not claim that `localStorage` synchronizes between browsers or devices. This implementation is local to the current browser profile.

Do not store the Gemini API key or other secrets in `localStorage`.

## 8. Backend API

Extend the existing Express application with appropriate Flashcards endpoints, following the current API conventions.

Suggested endpoints:

- `POST /api/flashcards/generate` — generate flashcards with Gemini.
- `POST /api/flashcards/study-guide` — generate a study guide.
- `POST /api/flashcards/review-guide` — generate review recommendations.
- `POST /api/flashcards/chat` — answer contextual follow-up questions.

Adjust these routes to match the existing implementation if equivalent functionality already exists.

The backend should return generated content but should not persist study sets in a database.

Use the existing Gemini API key and model configuration. Keep credentials on the server.

Validate input, limit request sizes, reuse existing error handling and rate limiting, and return clear JSON errors.

Do not add unnecessary endpoints for CRUD operations that can be handled safely in the browser.

If chat or study-guide features can be implemented through reusable existing services, reuse them instead of creating duplicate implementations.

## 9. Study Guide and Review Guide

The Study Guide should contain:

- Topic overview.
- Key concepts.
- Definitions.
- Examples.
- Important relationships.
- Relevant source references when available.

The Review Guide should contain:

- Mastery percentage.
- Cards marked Need Review.
- Mastered cards.
- Unreviewed cards.
- Suggested next actions.

Calculate progress counts and mastery percentages in JavaScript using the actual saved card statuses.

For example:

`Mastery = mastered cards / total cards × 100`

Handle an empty study set without dividing by zero.

Use Gemini for explanations and recommendations, not for inventing progress statistics.

## 10. File Uploads

Reuse the existing Whiteboard Tutor upload and document-processing functionality where practical.

Support only file formats that can actually be processed.

When source material is supplied, generate flashcards grounded in that material.

Avoid duplicating the file-processing implementation. Extract shared logic only if necessary and ensure existing Whiteboard Tutor behavior remains unchanged.

Do not store uploaded file contents permanently unless required. If uploaded source files are no longer available after generation, clearly distinguish stored extracted text or source metadata from the original file.

## 11. Visual Design and Responsive Behavior

Follow the supplied Solvely.ai screenshots and the existing application's design system.

Desktop:
- Left navigation.
- Center study area.
- Optional right tutor chat panel.

Mobile:
- Collapsible navigation.
- Single-column layout.
- Touch-friendly flashcard controls.
- No horizontal overflow.

Include loading, error, empty, and completion states. Add accessible button labels, keyboard focus styles, and reduced-motion support.

Do not replace the existing application design or introduce an unnecessary component library.

## 12. Testing

Add tests using the existing test framework.

Verify:

1. Gemini generates valid flashcards.
2. Invalid Gemini responses are handled.
3. The Create Cards workflow works.
4. The study set opens correctly.
5. Flashcards flip.
6. Mastered and Need Review actions work.
7. Progress counts are accurate.
8. Study sets persist after refreshing.
9. The current study session resumes after refreshing.
10. The Study Guide and Review Guide use real generated content and saved progress.
11. Contextual chat uses the current study set.
12. Storage errors are handled gracefully.
13. No database or authentication dependencies are introduced.
14. Existing Whiteboard Tutor features continue to work.

Use mocked Gemini responses for automated tests so tests do not require a real API key or incur API costs.

Run the existing checks and tests. Do not report tests as passed unless they were actually executed.

## 13. Final Deliverables

After implementation, provide:

- Summary of completed functionality.
- New and modified files.
- New API endpoints.
- Any new environment variables.
- Installation and startup commands.
- Test results.
- Any remaining limitations.

### Final instruction

Implement this feature directly in my existing repository.

**Keep the same lightweight architecture as Whiteboard Tutor: Node.js + Express.js + Gemini API, with `localStorage` for browser-side persistence. No database, no authentication, no new backend framework, and no breaking changes to existing functionality.**

Do not stop at a UI mockup. Ensure Gemini generates real flashcards and the user can study them and retain progress after refreshing the browser.