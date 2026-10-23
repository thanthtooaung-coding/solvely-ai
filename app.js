/* Solvely-style Home + AI Study.
   Whiteboard Tutor calls Gemini through the local server.
   Solver, flashcards, quizzes, and the other study tools on this page are still local demos. */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- Icons (line, 24x24) ---------------- */
const ICONS = {
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
  bookplus: '<path d="M3 6.5h7.5v13H3zM10.5 8.5H16v11h-5.5"/><path d="M19 2.5v6M16 5.5h6"/>',
  wand: '<path d="m3 21 11-11"/><path d="m12.5 8.5 3 3"/><path d="M17 3l.7 1.8 1.8.7-1.8.7L17 8l-.7-1.8-1.8-.7 1.8-.7z"/><path d="M20 11v2M19 12h2M8 3v2M7 4h2"/>',
  examA: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8.5 16 3.5-8 3.5 8M9.8 13h4.4"/>',
  panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M16 10l-2 2 2 2"/>',
  panelOpen: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M14 10l2 2-2 2"/>',
  history: '<path d="M3 12a9 9 0 1 0 2.64-6.36L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  board: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="m10 8.5 4.5 2.5-4.5 2.5z"/><path d="M12 17v3M8 21h8"/>',
  cards: '<rect x="3" y="7" width="13" height="14" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v12"/><path d="m9.5 11.5 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3z"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  book: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M6.5 9h2.5M15 9h2.5"/>',
  clip: '<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  imgplus: '<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="M16 5h6M19 2v6"/><circle cx="9" cy="10" r="1"/><path d="M8 15.5c1.8 1.8 4.7 1.8 6.5 0M14 10h.01"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  flip: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  msg: '<path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>',
  note: '<path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4M8 9h8M8 13h5"/>',
  play: '<path d="M7.5 4.8v14.4L19 12z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.9" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none"/>',
  volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  micoff: '<path d="M9 9V6a3 3 0 0 1 5.6-1.5M15 11.5v.5a3 3 0 0 1-4.6 2.5"/><path d="M5.5 11a6.5 6.5 0 0 0 10.6 5M18.5 11a6.5 6.5 0 0 1-.5 2.4M12 17.5V21M3 3l18 18"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
  pen: '<path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/><path d="m13.5 6.5 3 3"/>',
  send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  captions: '<path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M19 9h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v3l-4-3h-3"/>',
  upload: '<path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>'
};
function icon(name, size = 18, sw = 1.8) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}
function hydrate(root = document) {
  $$('[data-icon]', root).forEach(el => {
    if (el.dataset.hyd) return;
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon, +(el.dataset.size || 18)));
    el.dataset.hyd = '1';
  });
}
function setIcon(el, name) {
  const svg = el.querySelector('svg'); if (svg) svg.remove();
  el.dataset.icon = name; el.insertAdjacentHTML('afterbegin', icon(name, +(el.dataset.size || 18)));
}

/* ---------------- Localization ---------------- */
const I18N = {
  en: {
    'nav.home': 'Home', 'nav.study': 'AI Study',
    upgrade: 'Upgrade', chrome: 'Get the Chrome Extension', history: 'History',
    'home.title': 'Solvely: Your AI Study Companion',
    'mode.study': 'Study', 'mode.exam': 'Exam Prep', 'mode.writing': 'Writing',
    'tab.solver': 'Solver', 'tab.whiteboard': 'Whiteboard Tutor', 'tab.flashcards': 'Flashcards', 'tab.quiz': 'Quiz', 'tab.guide': 'Study Guide',
    'ph.solver': 'Enter a problem, or upload a document or image for a step-by-step solution',
    'ph.whiteboard': 'Enter a topic or paste a problem, or upload materials to start an interactive whiteboard lesson',
    'ph.flashcards': 'Enter a topic, or upload notes to generate flashcards',
    'ph.quiz': 'Enter a topic, or upload notes to generate a practice quiz',
    'ph.guide': 'Paste notes, or upload a document to create a study guide',
    solve: 'Solve', 'ex.title': 'Solver examples', 'ex.badge': 'Cross-check across AI models for highest accuracy',
    'ex.1': 'Step-by-step solution', 'ex.2': 'Interactive graph', 'ex.3': 'Structure visualization', 'ex.4': 'Financial analysis',
    'cat.geo': 'geometry', 'cat.alg': 'algebra', 'cat.chem': 'chemistry', 'cat.acc': 'accounting',
    'banner.title': 'Ace your exams in less time', 'banner.sub': 'Turn your study materials into an exam prep bundle',
    create: 'Create new', quick: 'Quick tools',
    'tool.flashcard': 'Flashcard', 'tool.flashcard.sub': 'Flip to memorize',
    'tool.quiz': 'Quiz', 'tool.quiz.sub': 'Practice makes perfect',
    'tool.solver': 'AI Solver', 'tool.solver.sub': 'Step-by-step explanation',
    'tool.guide': 'Study guide', 'tool.guide.sub': 'Summarize with clarity',
    'tool.predictor': 'Exam predictor', 'tool.predictor.sub': 'Study what matters',
    'tool.cheatsheet': 'Cheat sheet', 'tool.cheatsheet.sub': 'Crack the exam',
    recent: 'Recent study sets', viewall: 'View all', newset: 'New study set', flashcards: 'flashcards',
    back: 'Back', cancel: 'Cancel', createBtn: 'Create', allSets: 'All study sets',
    demo: 'Demo response', demoNote: 'Mock output for this prototype — no AI model is connected.',
    'step.write': 'Write the equation', 'step.sub': 'Subtract {b} from both sides', 'step.add': 'Add {b} to both sides',
    'step.div': 'Divide both sides by {a}', 'step.check': 'Check the answer', finalAnswer: 'Final answer',
    createLesson: 'Create lesson', 'wb.try': 'Try:', retry: 'Try again',
    'prep.title': 'Creating your lesson…', 'prep.left': 'About {n} sec left', 'prep.ready': 'Ready — opening your lesson',
    'prep.s1': 'Understanding “{topic}”…', 'prep.s2': 'Planning your lesson flow…', 'prep.s3': 'Sketching visual explanations…',
    'prep.s4': 'Preparing guided practice…', 'prep.s5': 'Starting your interactive lesson…',
    'prep.err': 'We couldn’t prepare this lesson',
    'prep.errEmpty': 'Add a topic or upload a PDF, Word, PowerPoint, text, or image file.',
    'prep.note': 'Gemini is writing this lesson. A step is marked done only after it actually finishes. With မြန်မာ selected, the whole lesson stays in Burmese.',
    'prep.working': 'Still working on this step',
    'prep.cancel': 'Cancel',
    'prep.readyToast': 'Your lesson “{topic}” is ready — open it from History.',
    'prep.fileBig': '“{name}” is larger than 8 MB. Upload a smaller file.',
    'prep.fileType': '“{name}” isn’t supported. Use PDF, PNG, JPG, WEBP, TXT, DOCX, or PPTX.',
    'prep.fileCount': 'You can upload up to 4 files for one lesson.',
    'err.config': 'The tutor isn’t configured yet. Add the Gemini API key on the server and restart.',
    'err.auth': 'The tutor could not sign in to Gemini. Check the API key on the server.',
    'err.model': 'The selected Gemini model isn’t available. Update GEMINI_MODEL and restart the server.',
    'err.rate_limit': 'The tutor has hit its usage limit. Wait a moment, then try again.',
    'err.timeout': 'The tutor took too long to respond. Try again.',
    'err.network': 'You appear to be offline. Check your connection and try again.',
    'err.invalid_response': 'The tutor sent something that couldn’t be read. Try again.',
    'err.validation': 'Check the topic and files, then try again.',
    'err.empty': 'Add a topic or a supported file before creating a lesson.',
    'err.file_type': 'That file type isn’t supported. Use PDF, PNG, JPG, WEBP, TXT, DOCX, or PPTX.',
    'err.file_size': 'Each file must be 8 MB or smaller.',
    'err.file_count': 'You can upload up to 4 files for one lesson.',
    'err.file_read': 'One of the files couldn’t be read. Try a different file.',
    'err.upstream': 'The tutor couldn’t complete that request. Try again.',
    'err.language': 'The tutor replied in English instead of Burmese. Try again.',
    'err.pdf': 'The PDF could not be created. Try the download again.',
    'prep.missing': 'This lesson is no longer available', 'prep.missingSub': 'Lessons are kept only while this page is open. Start a new one from Home.',
    'prep.sample': 'Open a sample lesson',
    'slide1.t': 'Visual Explanations', 'slide1.s': 'Circle anything to see it explained',
    'slide2.t': 'Guided Practice', 'slide2.s': 'Quick checks keep you on track',
    'slide3.t': 'Ask Anytime', 'slide3.s': 'Type a question whenever you get stuck',
    'tw.source': 'Course source', 'tw.materials': 'Original materials', 'tw.materialsBtn': 'Materials', 'tw.instructions': 'Instructions',
    'tw.sample': 'Sample query (example material)', 'tw.files': 'Uploaded files', 'tw.noFile': 'No uploaded file',
    'tw.uploadHint': 'Upload an image, PDF, PowerPoint, Word, or text file to view and use it in the lesson.',
    'tw.upload': 'Upload files', 'tw.uploadMore': 'Upload more files',
    'tw.preparing': 'Tutor is preparing the board', 'tw.preparingSub': 'The explanation and visuals will appear here in real time.',
    'tw.speed': 'Speed', 'tw.end': 'End lesson', 'tw.ask': 'Type your question or response', 'tw.follow': 'Follow tutor',
    'tw.skip': 'Skip', 'tw.continue': 'Continue', 'tw.correct': 'Correct!', 'tw.wrong': 'Not quite.', 'tw.you': 'You', 'tw.tutor': 'Tutor',
    'tw.clearInk': 'Clear ink', 'tw.qcap': 'Quick check — pick an answer, or skip to keep going.', 'tw.qof': 'Question {n} of {total}',
    'tw.thinking': 'Tutor is thinking…', 'tw.reveal': 'Reveal answer', 'tw.submit': 'Submit', 'tw.sa': 'Type your answer',
    'tw.expected': 'Expected answer', 'tw.another': 'Another question', 'tw.partial': 'Only part of a file was used.',
    'tw.checking': 'Checking your answer…', 'tw.doneTitle': 'Lesson complete', 'tw.endedTitle': 'Lesson ended',
    'tw.leave': 'Leave this lesson?', 'tw.endAsk': 'End this lesson?', 'tw.keep': 'Keep learning', 'tw.review': 'Review board',
    'tw.notes': 'Download PDF', 'tw.saving': 'Creating the PDF…', 'tw.saved': 'PDF downloaded.',
    'tw.stopped': 'Stopped.', 'tw.qcapShort': 'Type your answer, or skip to keep going.',
    'tw.finishQ': 'Answer or skip the question on the card first.',
    'tw.miss': 'Circle a line of text or part of a diagram.',
    'tw.summary': 'You covered {shown} of {total} board steps and answered {correct} of {qs} questions correctly.',
    'tw.summaryAsk': 'You covered {shown} of {total} board steps and answered {answered} of {qs} questions ({correct} correct).',
    'tw.asked': 'You also asked {n}.', 'tw.added': 'Added {n}. The tutor will use them with your next question.',
    'src.queued': 'Ready to send', 'src.used': 'Used in this lesson', 'src.partial': 'Only part of this file was used',
    'src.preview': 'Image attached', 'src.unsupported': 'This file type isn’t supported', 'src.error': 'Could not process this file',
    'src.read': 'Text extracted', 'src.pending': 'Reading…'
  },
  my: {
    'nav.home': 'ပင်မ', 'nav.study': 'AI လေ့လာရေး',
    upgrade: 'အဆင့်မြှင့်ရန်', chrome: 'Chrome Extension ရယူရန်', history: 'မှတ်တမ်း',
    'home.title': 'Solvely: သင်၏ AI လေ့လာရေးအဖော်',
    'mode.study': 'လေ့လာ', 'mode.exam': 'စာမေးပွဲ', 'mode.writing': 'စာရေး',
    'tab.solver': 'ဖြေရှင်းရန်', 'tab.whiteboard': 'ဘုတ်ပြားဆရာ', 'tab.flashcards': 'ကတ်ပြားများ', 'tab.quiz': 'စာမေးပွဲငယ်', 'tab.guide': 'လေ့လာရေးလမ်းညွှန်',
    'ph.solver': 'ပုစ္ဆာတစ်ခု ရိုက်ထည့်ပါ၊ သို့မဟုတ် စာရွက်စာတမ်း/ပုံ တင်ပြီး အဆင့်ဆင့်ဖြေရှင်းချက် ရယူပါ',
    'ph.whiteboard': 'ခေါင်းစဉ် သို့မဟုတ် ပုစ္ဆာ ရိုက်ထည့်ပါ၊ သို့မဟုတ် စာရွက်စာတမ်းတင်ပြီး အပြန်အလှန် သင်ခန်းစာ စတင်ပါ',
    'ph.flashcards': 'ကတ်ပြားများ ဖန်တီးရန် ခေါင်းစဉ် ရိုက်ထည့်ပါ သို့မဟုတ် မှတ်စုတင်ပါ',
    'ph.quiz': 'လေ့ကျင့်ခန်းမေးခွန်းများအတွက် ခေါင်းစဉ် ရိုက်ထည့်ပါ',
    'ph.guide': 'လေ့လာရေးလမ်းညွှန် ဖန်တီးရန် မှတ်စုထည့်ပါ သို့မဟုတ် စာရွက်စာတမ်းတင်ပါ',
    solve: 'ဖြေရှင်းရန်', 'ex.title': 'ဖြေရှင်းနည်း နမူနာများ', 'ex.badge': 'AI မော်ဒယ်များဖြင့် တိုက်စစ်၍ တိကျမှုအမြင့်ဆုံး',
    'ex.1': 'အဆင့်ဆင့် ဖြေရှင်းချက်', 'ex.2': 'အပြန်အလှန် ဂရပ်', 'ex.3': 'ဖွဲ့စည်းပုံ မြင်ကွင်း', 'ex.4': 'ဘဏ္ဍာရေး ခွဲခြမ်းစိတ်ဖြာမှု',
    'cat.geo': 'ဂျီဩမေတြီ', 'cat.alg': 'အက္ခရာသင်္ချာ', 'cat.chem': 'ဓာတုဗေဒ', 'cat.acc': 'စာရင်းကိုင်',
    'banner.title': 'အချိန်နည်းနည်းနဲ့ စာမေးပွဲ အောင်မြင်ပါစေ', 'banner.sub': 'သင့်လေ့လာရေးပစ္စည်းများကို စာမေးပွဲပြင်ဆင်ရေး အစုံအလင်အဖြစ် ပြောင်းပါ',
    create: 'အသစ်ဖန်တီးရန်', quick: 'အမြန်ကိရိယာများ',
    'tool.flashcard': 'ကတ်ပြား', 'tool.flashcard.sub': 'လှန်ပြီး မှတ်သားပါ',
    'tool.quiz': 'စာမေးပွဲငယ်', 'tool.quiz.sub': 'လေ့ကျင့်လေ ကျွမ်းကျင်လေ',
    'tool.solver': 'AI ဖြေရှင်းသူ', 'tool.solver.sub': 'အဆင့်ဆင့် ရှင်းလင်းချက်',
    'tool.guide': 'လေ့လာရေးလမ်းညွှန်', 'tool.guide.sub': 'ရှင်းရှင်းလင်းလင်း အနှစ်ချုပ်',
    'tool.predictor': 'စာမေးပွဲ ခန့်မှန်းချက်', 'tool.predictor.sub': 'အရေးကြီးတာကို လေ့လာပါ',
    'tool.cheatsheet': 'အကျဉ်းချုပ်စာရွက်', 'tool.cheatsheet.sub': 'စာမေးပွဲကို ကျော်လွှားပါ',
    recent: 'မကြာသေးမီက လေ့လာရေးအစုများ', viewall: 'အားလုံးကြည့်ရန်', newset: 'လေ့လာရေးအစု အသစ်', flashcards: 'ကတ်ပြား',
    back: 'နောက်သို့', cancel: 'မလုပ်တော့ပါ', createBtn: 'ဖန်တီးရန်', allSets: 'လေ့လာရေးအစု အားလုံး',
    demo: 'နမူနာအဖြေ', demoNote: 'ဤရှေ့ပြေးပုံစံအတွက် နမူနာသာ ဖြစ်သည် — AI မော်ဒယ် ချိတ်ဆက်ထားခြင်း မရှိပါ။',
    'step.write': 'ညီမျှခြင်းကို ရေးပါ', 'step.sub': 'နှစ်ဖက်စလုံးမှ {b} ကို နုတ်ပါ', 'step.add': 'နှစ်ဖက်စလုံးသို့ {b} ကို ပေါင်းပါ',
    'step.div': 'နှစ်ဖက်စလုံးကို {a} ဖြင့် စားပါ', 'step.check': 'အဖြေကို စစ်ဆေးပါ', finalAnswer: 'အဖြေ',
    createLesson: 'သင်ခန်းစာ ဖန်တီးရန်', 'wb.try': 'စမ်းကြည့်ရန်:', retry: 'ထပ်စမ်းရန်',
    'prep.title': 'သင်ခန်းစာ ဖန်တီးနေသည်…', 'prep.left': 'ခန့်မှန်း {n} စက္ကန့် ကျန်', 'prep.ready': 'အဆင်သင့် — သင်ခန်းစာ ဖွင့်နေသည်',
    'prep.s1': '“{topic}” ကို နားလည်အောင် ဖတ်နေသည်…', 'prep.s2': 'သင်ခန်းစာ အစီအစဉ် ရေးဆွဲနေသည်…', 'prep.s3': 'ပုံဖြင့် ရှင်းလင်းချက်များ ဆွဲနေသည်…',
    'prep.s4': 'လေ့ကျင့်ခန်းများ ပြင်ဆင်နေသည်…', 'prep.s5': 'အပြန်အလှန် သင်ခန်းစာ စတင်နေသည်…',
    'prep.err': 'ဤသင်ခန်းစာကို ပြင်ဆင်၍ မရပါ',
    'prep.errEmpty': 'ခေါင်းစဉ် ထည့်ပါ၊ သို့မဟုတ် PDF၊ Word၊ PowerPoint၊ စာသား သို့မဟုတ် ပုံ ဖိုင် တင်ပါ။',
    'prep.note': 'Gemini က ဤသင်ခန်းစာကို ရေးနေသည်။ အဆင့်တစ်ခု ပြီးမှသာ ပြီးကြောင်း ပြပါမည်။ မြန်မာ ကို ရွေးထားလျှင် သင်ခန်းစာ တစ်ခုလုံး မြန်မာဘာသာဖြင့် ရေးပါမည်။',
    'prep.working': 'ဤအဆင့်ကို လုပ်နေဆဲဖြစ်သည်',
    'prep.cancel': 'မလုပ်တော့ပါ',
    'prep.readyToast': 'သင်ခန်းစာ “{topic}” အဆင်သင့်ဖြစ်ပါပြီ — မှတ်တမ်းမှ ဖွင့်ပါ။',
    'prep.fileBig': '“{name}” သည် 8 MB ထက်ကြီးသည်။ ပိုသေးသော ဖိုင် တင်ပါ။',
    'prep.fileType': '“{name}” ကို မပံ့ပိုးပါ။ PDF၊ PNG၊ JPG၊ WEBP၊ TXT၊ DOCX သို့မဟုတ် PPTX သုံးပါ။',
    'prep.fileCount': 'သင်ခန်းစာတစ်ခုအတွက် ဖိုင် 4 ဖိုင်အထိ တင်နိုင်သည်။',
    'err.config': 'ဆရာကို မချိန်ညှိရသေးပါ။ ဆာဗာတွင် Gemini API သော့ ထည့်ပြီး ပြန်ဖွင့်ပါ။',
    'err.auth': 'Gemini သို့ ဝင်၍ မရပါ။ ဆာဗာရှိ API သော့ကို စစ်ပါ။',
    'err.model': 'ရွေးထားသော Gemini မော်ဒယ်ကို သုံး၍ မရပါ။ GEMINI_MODEL ကို ပြင်ပြီး ဆာဗာကို ပြန်ဖွင့်ပါ။',
    'err.rate_limit': 'အသုံးပြုမှု ကန့်သတ်ချက် ပြည့်သွားပါပြီ။ ခဏစောင့်ပြီး ထပ်စမ်းပါ။',
    'err.timeout': 'ဆရာက အချိန်ကြာလွန်းသည်။ ထပ်စမ်းပါ။',
    'err.network': 'အင်တာနက် ချိတ်ဆက်မှု မရှိသလို ဖြစ်နေသည်။ စစ်ဆေးပြီး ထပ်စမ်းပါ။',
    'err.invalid_response': 'ဆရာ၏ အဖြေကို ဖတ်၍ မရပါ။ ထပ်စမ်းပါ။',
    'err.validation': 'ခေါင်းစဉ်နှင့် ဖိုင်များကို စစ်ပြီး ထပ်စမ်းပါ။',
    'err.empty': 'သင်ခန်းစာ မဖန်တီးမီ ခေါင်းစဉ် သို့မဟုတ် ပံ့ပိုးသော ဖိုင် ထည့်ပါ။',
    'err.file_type': 'ဤဖိုင်အမျိုးအစားကို မပံ့ပိုးပါ။ PDF၊ PNG၊ JPG၊ WEBP၊ TXT၊ DOCX သို့မဟုတ် PPTX သုံးပါ။',
    'err.file_size': 'ဖိုင်တစ်ဖိုင်လျှင် 8 MB သို့မဟုတ် ပိုသေးရပါမည်။',
    'err.file_count': 'သင်ခန်းစာတစ်ခုအတွက် ဖိုင် 4 ဖိုင်အထိ တင်နိုင်သည်။',
    'err.file_read': 'ဖိုင်တစ်ဖိုင်ကို ဖတ်၍ မရပါ။ အခြားဖိုင် စမ်းပါ။',
    'err.upstream': 'ဆရာက ဤတောင်းဆိုမှုကို မပြီးမြောက်နိုင်ပါ။ ထပ်စမ်းပါ။',
    'err.language': 'ဆရာက မြန်မာဘာသာအစား အင်္ဂလိပ်လို ပြန်ခဲ့သည်။ ထပ်စမ်းပါ။',
    'err.pdf': 'PDF မဖန်တီးနိုင်ပါ။ ဒေါင်းလုဒ်ကို ထပ်စမ်းပါ။',
    'prep.missing': 'ဤသင်ခန်းစာ မရှိတော့ပါ', 'prep.missingSub': 'သင်ခန်းစာများကို ဤစာမျက်နှာ ဖွင့်ထားစဉ်သာ သိမ်းထားပါသည်။ ပင်မမှ အသစ်စတင်ပါ။',
    'prep.sample': 'နမူနာ သင်ခန်းစာ ဖွင့်ရန်',
    'slide1.t': 'ပုံဖြင့် ရှင်းလင်းချက်', 'slide1.s': 'မည်သည့်အရာကိုမဆို ဝိုင်းပြီး ရှင်းလင်းချက် ကြည့်ပါ',
    'slide2.t': 'လမ်းညွှန် လေ့ကျင့်ခန်း', 'slide2.s': 'အမြန်စစ်ဆေးချက်များဖြင့် လမ်းကြောင်းမှန်ပေါ်ရှိပါ',
    'slide3.t': 'အချိန်မရွေး မေးပါ', 'slide3.s': 'နားမလည်သည့်အခါ မေးခွန်း ရိုက်ထည့်ပါ',
    'tw.source': 'သင်ခန်းစာ ရင်းမြစ်', 'tw.materials': 'မူရင်း စာရွက်စာတမ်းများ', 'tw.materialsBtn': 'စာရွက်စာတမ်း', 'tw.instructions': 'ညွှန်ကြားချက်',
    'tw.sample': 'နမူနာ query (ဥပမာ)', 'tw.files': 'တင်ထားသော ဖိုင်များ', 'tw.noFile': 'တင်ထားသော ဖိုင် မရှိပါ',
    'tw.uploadHint': 'ပုံ၊ PDF၊ PowerPoint၊ Word သို့မဟုတ် စာသားဖိုင် တင်ပြီး သင်ခန်းစာတွင် အသုံးပြုပါ။',
    'tw.upload': 'ဖိုင်တင်ရန်', 'tw.uploadMore': 'ဖိုင် ထပ်တင်ရန်',
    'tw.preparing': 'ဆရာက ဘုတ်ပြားကို ပြင်ဆင်နေသည်', 'tw.preparingSub': 'ရှင်းလင်းချက်နှင့် ပုံများ ဤနေရာတွင် ပေါ်လာပါမည်။',
    'tw.speed': 'အမြန်နှုန်း', 'tw.end': 'သင်ခန်းစာ ပြီးဆုံးရန်', 'tw.ask': 'မေးခွန်း သို့မဟုတ် အဖြေ ရိုက်ထည့်ပါ', 'tw.follow': 'ဆရာနှင့်အတူ လိုက်ကြည့်ရန်',
    'tw.skip': 'ကျော်ရန်', 'tw.continue': 'ဆက်ရန်', 'tw.correct': 'မှန်ပါသည်!', 'tw.wrong': 'မမှန်သေးပါ။', 'tw.you': 'သင်', 'tw.tutor': 'ဆရာ',
    'tw.clearInk': 'မင်ရေး ဖျက်ရန်', 'tw.qcap': 'အမြန်စစ်ဆေးချက် — အဖြေရွေးပါ သို့မဟုတ် ကျော်ပါ။', 'tw.qof': 'မေးခွန်း {n} / {total}',
    'tw.thinking': 'ဆရာ စဉ်းစားနေသည်…', 'tw.reveal': 'အဖြေ ပြရန်', 'tw.submit': 'တင်သွင်းရန်', 'tw.sa': 'အဖြေ ရိုက်ထည့်ပါ',
    'tw.expected': 'မျှော်မှန်းထားသော အဖြေ', 'tw.another': 'နောက်ထပ် မေးခွန်း', 'tw.partial': 'ဖိုင်၏ တစ်စိတ်တစ်ပိုင်းကိုသာ သုံးထားသည်။',
    'tw.checking': 'အဖြေကို စစ်ဆေးနေသည်…', 'tw.doneTitle': 'သင်ခန်းစာ ပြီးပါပြီ', 'tw.endedTitle': 'သင်ခန်းစာ ရပ်လိုက်ပါပြီ',
    'tw.leave': 'ဤသင်ခန်းစာမှ ထွက်မလား?', 'tw.endAsk': 'ဤသင်ခန်းစာကို အဆုံးသတ်မလား?', 'tw.keep': 'ဆက်လေ့လာမည်', 'tw.review': 'ဘုတ်ပြား ပြန်ကြည့်ရန်',
    'tw.notes': 'PDF ဒေါင်းလုဒ်', 'tw.saving': 'PDF ဖန်တီးနေသည်…', 'tw.saved': 'PDF ဒေါင်းလုဒ် လုပ်ပြီးပါပြီ။',
    'tw.stopped': 'ရပ်လိုက်ပါပြီ။', 'tw.qcapShort': 'အဖြေ ရိုက်ပါ၊ သို့မဟုတ် ကျော်ပါ။',
    'tw.finishQ': 'ကတ်ပေါ်က မေးခွန်းကို အရင် ဖြေပါ သို့မဟုတ် ကျော်ပါ။',
    'tw.miss': 'စာသား သို့မဟုတ် ပုံ၏ အပိုင်းကို ဝိုင်းပါ။',
    'tw.summary': 'ဘုတ်ပြား အဆင့် {shown}/{total} ကို လေ့လာပြီး မေးခွန်း {qs} ခုတွင် {correct} ခု မှန်သည်။',
    'tw.summaryAsk': 'ဘုတ်ပြား အဆင့် {shown}/{total} ကို လေ့လာပြီး မေးခွန်း {qs} ခုတွင် {answered} ခု ဖြေထားသည် ({correct} ခု မှန်)။',
    'tw.asked': 'မေးခွန်း {n} ခုလည်း မေးထားသည်။', 'tw.added': '{n} ထည့်ပြီးပါပြီ။ နောက်မေးခွန်းနှင့်အတူ ဆရာက သုံးပါမည်။',
    'src.queued': 'ပို့ရန် အသင့်', 'src.used': 'ဤသင်ခန်းစာတွင် သုံးထားသည်', 'src.partial': 'ဖိုင်၏ တစ်စိတ်တစ်ပိုင်းကိုသာ သုံးထားသည်',
    'src.preview': 'ပုံ ပူးတွဲထားသည်', 'src.unsupported': 'ဤဖိုင်အမျိုးအစားကို မပံ့ပိုးပါ', 'src.error': 'ဤဖိုင်ကို မလုပ်ဆောင်နိုင်ပါ',
    'src.read': 'စာသား ထုတ်ယူပြီး', 'src.pending': 'ဖတ်နေသည်…'
  }
};

/* ---------------- State ---------------- */
const ACE_CARDS = [
  ['Spaced repetition', 'Reviewing material at increasing intervals to move it into long-term memory.'],
  ['Active recall', 'Testing yourself instead of re-reading — retrieving information strengthens memory.'],
  ['Day 1 goal', 'List every syllabus topic and rate your confidence from 1 to 5.'],
  ['Day 2 goal', 'Tackle your weakest topics first, while your energy is highest.'],
  ['Pomodoro technique', '25 minutes of focused study followed by a 5-minute break.'],
  ['Interleaving', 'Mixing different problem types in one session to improve transfer.'],
  ['Feynman technique', 'Explain a concept in simple words, as if teaching a beginner.'],
  ['Day 3 goal', 'Turn your notes into flashcards and a one-page cheat sheet.'],
  ['Past papers', 'Practise under timed conditions to learn the exam’s format.'],
  ['Day 4 goal', 'Complete one full past paper and mark it honestly.'],
  ['Error log', 'Record every mistake, why it happened and the correct method.'],
  ['Day 5 goal', 'Re-attempt every question in your error log.'],
  ['Elaboration', 'Ask “why” and “how” to connect new facts to what you already know.'],
  ['Sleep', 'Memory consolidates during sleep — aim for 7–9 hours.'],
  ['Day 6 goal', 'Light review of cheat sheets and flashcards only.'],
  ['Dual coding', 'Combining words with diagrams to create two memory paths.'],
  ['Mind map', 'A diagram linking a central topic to related ideas.'],
  ['Day 7 goal', 'Rest, do a short morning recap and prepare your exam-day kit.'],
  ['Reading the paper', 'Read all questions first and start with the ones you are sure of.'],
  ['Time per mark', 'Divide total minutes by total marks to pace each question.']
].map(([q, a]) => ({ q, a }));

const FLASH_DECK = [
  ['Mitochondria', 'The organelle that releases energy (ATP) for the cell through respiration.'],
  ['Photosynthesis', 'Plants use light, water and CO₂ to make glucose and release oxygen.'],
  ['ဆဲလ် (Cell)', 'သက်ရှိအားလုံး၏ အခြေခံ ဖွဲ့စည်းတည်ဆောက်မှု ယူနစ်ဖြစ်သည်။'],
  ['Osmosis', 'Movement of water across a partially permeable membrane toward the more concentrated solution.'],
  ['DNA', 'A double-helix molecule carrying genetic instructions.'],
  ['Enzyme', 'A protein that speeds up a chemical reaction without being used up.'],
  ['Ribosome', 'The site of protein synthesis in the cell.'],
  ['Diffusion', 'Net movement of particles from high to low concentration.'],
  ['Chlorophyll', 'The green pigment that absorbs light for photosynthesis.']
].map(([q, a]) => ({ q, a }));

const QUIZ = [
  { q: 'What is 15% of 200?', o: ['20', '25', '30', '35'], a: 2, why: '0.15 × 200 = 30.' },
  { q: 'Which gas do plants absorb during photosynthesis?', o: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], a: 1, why: 'Plants take in CO₂ and release O₂.' },
  { q: 'Solve: 2x + 10 = 25', o: ['5', '7.5', '10', '17.5'], a: 1, why: '2x = 15, so x = 7.5.' },
  { q: 'What is the capital of Myanmar?', o: ['Yangon', 'Mandalay', 'Naypyidaw', 'Bago'], a: 2, why: 'Naypyidaw has been the capital since 2005–2006.' },
  { q: '၃ × ၄ = ?', o: ['၇', '၁၂', '၁၀', '၁၄'], a: 1, why: '၃ × ၄ = ၁၂ (3 × 4 = 12).' }
];

const DOCS = [
  { id: 'bio', name: 'Biology – Cell Structure.pdf', meta: '12 pages · uploaded sample',
    overview: 'Cells are the basic unit of life. This chapter compares plant and animal cells, explains the job of each organelle and shows how substances move in and out of cells.',
    points: ['Animal and plant cells share a nucleus, cytoplasm, cell membrane, mitochondria and ribosomes.', 'Plant cells also have a cell wall, chloroplasts and a permanent vacuole.', 'Substances move by diffusion, osmosis and active transport.', 'Specialised cells (nerve, root-hair, red blood cells) are adapted to their function.'],
    terms: [['Nucleus', 'Controls the cell and contains genetic material'], ['Cell wall', 'Cellulose layer that supports plant cells'], ['Chloroplast', 'Site of photosynthesis'], ['Active transport', 'Movement against a gradient, using energy']],
    qs: ['Compare a plant cell with an animal cell.', 'Explain why root-hair cells need many mitochondria.'] },
  { id: 'phy', name: 'Grade 10 Physics – Motion notes.docx', meta: '6 pages · uploaded sample',
    overview: 'Motion is described using distance, displacement, speed, velocity and acceleration. The notes cover graphs of motion and the equations of uniformly accelerated motion.',
    points: ['Speed = distance ÷ time; velocity also includes direction.', 'Acceleration = change in velocity ÷ time.', 'The gradient of a distance–time graph is speed; the area under a velocity–time graph is distance.', 'v = u + at and s = ut + ½at² apply when acceleration is constant.'],
    terms: [['Displacement', 'Distance in a stated direction'], ['Velocity', 'Speed in a stated direction'], ['Acceleration', 'Rate of change of velocity'], ['Uniform motion', 'Constant velocity, zero acceleration']],
    qs: ['A car accelerates from 0 to 20 m/s in 5 s. Find its acceleration.', 'Sketch a velocity–time graph for a car braking to a stop.'] },
  { id: 'his', name: 'Myanmar History – Konbaung Era.pdf', meta: '9 pages · uploaded sample',
    overview: 'The Konbaung dynasty (1752–1885) was the last ruling dynasty of Myanmar. The notes outline its founding, expansion, the Anglo-Burmese wars and the end of the monarchy.',
    points: ['Founded by King Alaungpaya in 1752.', 'Capitals moved between Shwebo, Ava (Inwa), Amarapura and Mandalay.', 'Three Anglo-Burmese wars (1824–26, 1852, 1885) led to British annexation.', 'King Thibaw was the last king, exiled in 1885.'],
    terms: [['Alaungpaya', 'Founder of the Konbaung dynasty'], ['Mandalay', 'Royal capital founded by King Mindon'], ['Yandabo Treaty', 'Ended the First Anglo-Burmese War (1826)'], ['Thibaw', 'Last Konbaung king']],
    qs: ['Describe the causes of the First Anglo-Burmese War.', 'Why did the capital move several times during the Konbaung era?'] }
];

const PREDICT = {
  Mathematics: [['Quadratic equations', 92], ['Trigonometry', 84], ['Geometry – circles', 71], ['Probability', 63], ['Matrices', 48], ['Sets & functions', 35]],
  Physics: [['Motion & forces', 90], ['Electricity', 82], ['Waves & sound', 66], ['Heat', 55], ['Light', 47], ['Magnetism', 32]],
  Chemistry: [['Chemical bonding', 88], ['Acids, bases & salts', 80], ['Stoichiometry', 69], ['Periodic table', 58], ['Organic chemistry', 44], ['Electrolysis', 36]]
};

const state = {
  lang: 'en', dark: false, mode: 'study', tab: 'solver', model: 'Solvely AI',
  files: [], history: [],
  sets: [{ id: 'ace7', title: 'How to Ace Your Exam in 7 Days', subject: 'Study skills', emoji: '🍪', creator: 'Solvi', cards: ACE_CARDS, created: 0 }]
};
const MODELS = [
  { name: 'Solvely AI', desc: 'Balanced default (mock)' },
  { name: 'Solvely AI Pro', desc: 'Longer reasoning (mock)' },
  { name: 'Cross-check', desc: 'Compare several models (mock)' }
];
const t = (k, vars) => {
  let s = (I18N[state.lang] && I18N[state.lang][k]) ?? I18N.en[k] ?? k;
  if (vars) Object.keys(vars).forEach(v => { s = s.replace(`{${v}}`, vars[v]); });
  return s;
};

/* ---------------- Toast ---------------- */
let toastTimer;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------------- Routing ----------------
   Two main pages: #/home and #/study. AI Study sub-views live under #/study/…
   Any other route redirects to #/home. */

function route() {
  const parts = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
  const top = parts[0];
  const isLesson = top === 'tutor' && parts[2] === 'lesson';
  const prepId = top === 'tutor' && parts[1] && !isLesson ? parts[1] : null;
  abortOtherLessons(prepId);
  if (!isLesson && T.id) tutorTeardown();
  if (!(top === 'tutor' && !isLesson)) stopPrepSlides();
  document.body.classList.toggle('tutor-mode', isLesson);
  $$('.view').forEach(v => { v.hidden = true; });
  $('#app').classList.remove('sb-open');
  const navTop = top === 'tutor' ? 'home' : top;   // the tutor belongs to Home
  $$('.nav-item').forEach(a => {
    const on = a.dataset.route === navTop;
    a.classList.toggle('active', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  const main = $('#main');
  main.classList.toggle('gray', top === 'study');

  if (top === 'home') { $('#view-home').hidden = false; }
  else if (top === 'tutor' && parts[1]) {
    if (isLesson) { tutorView(parts[1]); return; }
    $('#view-prep').hidden = false; renderPrep(parts[1]);
  }
  else if (top === 'study') {
    if (!parts[1]) { $('#view-study').hidden = false; renderRecent(); }
    else {
      const sub = $('#view-sub'); sub.hidden = false;
      if (parts[1] === 'tool') renderTool(parts[2]);
      else if (parts[1] === 'sets') renderSets();
      else if (parts[1] === 'set') renderSet(parts[2]);
      else { location.replace('#/study'); return; }
    }
  } else { location.replace('#/home'); return; }
  window.scrollTo(0, 0);
}

/* ---------------- Sidebar ---------------- */
function initSidebar() {
  const btn = $('#sbCollapse');
  btn.addEventListener('click', () => {
    const app = $('#app');
    if (window.matchMedia('(max-width: 860px)').matches) { app.classList.remove('sb-open'); return; }
    const c = app.classList.toggle('sb-collapsed');
    btn.setAttribute('aria-label', c ? 'Expand sidebar' : 'Collapse sidebar');
    setIcon(btn, c ? 'panelOpen' : 'panel');
  });
  $('#mobMenu').addEventListener('click', () => $('#app').classList.add('sb-open'));
  $('#sbOverlay').addEventListener('click', () => $('#app').classList.remove('sb-open'));
  $('#themeBtn').addEventListener('click', () => {
    state.dark = !state.dark;
    document.documentElement.classList.toggle('dark', state.dark);
    setIcon($('#themeBtn'), state.dark ? 'sun' : 'moon');
  });
  $('#langBtn').addEventListener('click', () => { state.lang = state.lang === 'en' ? 'my' : 'en'; applyI18n(); });
  $('#upgradeBtn').addEventListener('click', () => openPlans(false));
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-toast]');
    if (el) { e.preventDefault(); toast(el.dataset.toast); }
    const c = e.target.closest('[data-action="create-set"]');
    if (c) { e.preventDefault(); openCreateSet(); }
  });
}

function applyI18n() {
  const root = document.documentElement;
  root.lang = state.lang === 'my' ? 'my' : 'en';
  root.classList.toggle('lang-my', state.lang === 'my');
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $('#langBtn').textContent = state.lang === 'my' ? 'မြန်မာ' : 'EN';
  const ask = $('#twAskInput'); if (ask) ask.placeholder = t('tw.ask');
  updatePill();
  route();
}

/* ---------------- Home: solver ---------------- */
function updatePill() {
  const pill = $('#inputPill'), q = $('#question');
  pill.textContent = t('tab.' + state.tab);
  q.placeholder = t('ph.' + state.tab);
  requestAnimationFrame(() => { q.style.textIndent = (pill.offsetWidth + 8) + 'px'; });
  $('#solveBtn span').textContent = state.tab === 'whiteboard' ? t('createLesson') : t('solve');
  $('#wbHint').hidden = state.tab !== 'whiteboard';
}
function updateSolve() {
  $('#solveBtn').disabled = !($('#question').value.trim() || state.files.length);
}
function renderChips() {
  const box = $('#fileChips');
  box.innerHTML = state.files.map((f, i) => `<span class="chip">${f.url ? `<img src="${f.url}" alt="">` : icon('file', 15)}<span title="${esc(f.name)}">${esc(f.name)}</span><button aria-label="Remove ${esc(f.name)}" data-rm="${i}">${icon('x', 14)}</button></span>`).join('');
  updateSolve();
}
function addFiles(list, isImg) {
  [...list].forEach(f => state.files.push({ name: f.name, url: isImg ? URL.createObjectURL(f) : null, file: f }));
  renderChips();
}

const BURMESE = /[\u1000-\u109F]/;
function toAscii(s) { return s.replace(/[\u1040-\u1049]/g, d => String(d.charCodeAt(0) - 0x1040)); }
const fmt = n => Number.isInteger(n) ? String(n) : String(+n.toFixed(4));
function parseLinear(s) {
  const n = toAscii(s).replace(/[−–]/g, '-').replace(/×/g, '*').replace(/\s+/g, '');
  const m = n.match(/(-?\d*\.?\d*)\*?x([+-]\d+\.?\d*)?=(-?\d+\.?\d*)/i);
  if (!m) return null;
  const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : parseFloat(m[1]);
  const b = m[2] ? parseFloat(m[2]) : 0, c = parseFloat(m[3]);
  if (!a || isNaN(a) || isNaN(c)) return null;
  return { a, b, c, x: (c - b) / a };
}
function solverHTML(q) {
  const my = BURMESE.test(q) || state.lang === 'my';
  const L = k => my ? I18N.my[k] : I18N.en[k];
  const eq = parseLinear(q);
  if (eq) {
    const { a, b, c, x } = eq;
    const lhs = `${a === 1 ? '' : a === -1 ? '−' : fmt(a)}x${b ? (b > 0 ? ' + ' : ' − ') + fmt(Math.abs(b)) : ''}`;
    const steps = [`<li><b>${L('step.write')}</b><div class="math">${lhs} = ${fmt(c)}</div></li>`];
    if (b) steps.push(`<li><b>${(b > 0 ? L('step.sub') : L('step.add')).replace('{b}', fmt(Math.abs(b)))}</b><div class="math">${a === 1 ? '' : fmt(a)}x = ${fmt(c)} ${b > 0 ? '−' : '+'} ${fmt(Math.abs(b))} = ${fmt(c - b)}</div></li>`);
    if (a !== 1) steps.push(`<li><b>${L('step.div').replace('{a}', fmt(a))}</b><div class="math">x = ${fmt(c - b)} ÷ ${fmt(a)} = ${fmt(x)}</div></li>`);
    steps.push(`<li><b>${L('step.check')}</b><div class="math">${a === 1 ? '' : fmt(a)}(${fmt(x)})${b ? (b > 0 ? ' + ' : ' − ') + fmt(Math.abs(b)) : ''} = ${fmt(c)} ✓</div></li>`);
    return `<ol class="steps">${steps.join('')}</ol><div class="final-ans">${icon('check', 16, 2.4)} ${L('finalAnswer')}: x = ${fmt(x)}</div>`;
  }
  return `<ol class="steps">
    <li><b>Understand the question</b><div>Identify what is given and what you need to find.</div></li>
    <li><b>Choose a method</b><div>Pick the formula or concept that links the given information to the unknown.</div></li>
    <li><b>Work it through</b><div>A connected AI model would show the full worked solution here.</div></li>
  </ol><div class="mock-note">${icon('info', 14)} Tip: try a linear equation such as <b>&nbsp;2x + 10 = 25&nbsp;</b> to see a complete worked example.</div>`;
}
function homeMockHTML(tab, q) {
  const topic = q || 'your uploaded file';
  if (tab === 'flashcards') {
    return `<ol class="steps"><li><b>${esc(topic)} — key term</b><div>Definition generated from your input would appear here.</div></li><li><b>Example card 2</b><div>Front / back pairs are created for review.</div></li><li><b>Example card 3</b><div>Open AI Study → Flashcard to try the interactive viewer.</div></li></ol>`;
  }
  if (tab === 'quiz') {
    return `<ol class="steps"><li><b>Sample question about “${esc(topic)}”</b><div>A) Option one &nbsp; B) Option two &nbsp; C) Option three &nbsp; D) Option four</div></li><li><b>Next step</b><div>Open AI Study → Quiz to answer and get feedback.</div></li></ol>`;
  }
  if (tab === 'guide') {
    return `<ol class="steps"><li><b>Overview</b><div>A short summary of “${esc(topic)}”.</div></li><li><b>Key concepts</b><div>The main ideas, listed for revision.</div></li><li><b>Practice questions</b><div>Open AI Study → Study guide for a full sample.</div></li></ol>`;
  }
  return solverHTML(q);
}
function renderAnswer(entry) {
  const box = $('#answer');
  box.hidden = false;
  box.innerHTML = `<div class="answer-card">
    <div class="ans-head"><span class="ans-badge">${esc(t('demo'))}</span><span class="ans-meta">${esc(t('tab.' + entry.tab))} · ${esc(entry.model)}</span><button class="icon-btn" id="ansClose" aria-label="Close response">${icon('x', 16)}</button></div>
    ${entry.q ? `<div class="ans-q">${esc(entry.q)}</div>` : ''}
    ${entry.files.length ? `<div class="ans-files">${icon('clip', 13).replace('<svg', '<svg style="display:inline;vertical-align:-2px"')} ${entry.files.map(esc).join(', ')}</div>` : ''}
    ${homeMockHTML(entry.tab, entry.q)}
    <div class="mock-note">${icon('info', 14)} ${esc(t('demoNote'))}</div>
  </div>`;
  $('#ansClose').onclick = () => { box.hidden = true; };
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function doSolve() {
  const q = $('#question').value.trim();
  if (!q && !state.files.length) return;
  if (state.tab === 'whiteboard') {                // Whiteboard Tutor → Gemini lesson
    if (state.creatingLesson) return;
    state.creatingLesson = true;
    try {
      const lessonId = createLesson(q, state.files.map(f => f.file).filter(Boolean));
      if (lessonId) { state.history.unshift({ q, tab: 'whiteboard', model: state.model, files: state.files.map(f => f.name), time: new Date(), lessonId }); renderHistory(); }
    } finally {
      setTimeout(() => { state.creatingLesson = false; }, 800);
    }
    return;
  }
  const entry = { q, tab: state.tab, model: state.model, files: state.files.map(f => f.name), time: new Date() };
  state.history.unshift(entry);
  renderAnswer(entry);
  renderHistory();
}

function renderHistory() {
  const list = $('#historyList');
  if (!state.history.length) { list.innerHTML = `<div class="empty">${icon('history', 28)}<p>No questions yet. Solved problems from this session appear here.</p></div>`; return; }
  list.innerHTML = state.history.map((h, i) => `<button class="hist-item" data-h="${i}"><b>${esc(h.q || h.files.join(', '))}</b><small>${esc(t('tab.' + h.tab))} · ${h.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></button>`).join('');
}
function openDrawer(open) {
  const d = $('#historyDrawer');
  d.classList.toggle('open', open); d.setAttribute('aria-hidden', String(!open));
  $('#drawerBackdrop').hidden = !open;
  if (open) { renderHistory(); $('#drawerClose').focus(); }
}

const EXAMPLES = [
  { tab: 'solver', q: 'In the figure, angle O = 2t + 10 and angle P = 3t − 15 are equal. Find t, then the measure of angle O.' },
  { tab: 'solver', q: 'Graph y = −x² + 6 and y = x + 6. Where do they intersect?' },
  { tab: 'solver', q: 'Draw and explain the structure of ethyl 2-(dimethylamino)benzoate.' },
  { tab: 'solver', q: 'Compare the cost structure of Company V and Company C using common-size analysis.' }
];

function initHome() {
  $$('.seg').forEach(b => b.addEventListener('click', () => {
    $$('.seg').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', String(x === b)); });
    state.mode = b.dataset.mode;
  }));
  $$('.ttab').forEach(b => b.addEventListener('click', () => {
    $$('.ttab').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', String(x === b)); });
    state.tab = b.dataset.tab; updatePill(); $('#question').focus();
  }));
  const q = $('#question');
  q.addEventListener('input', updateSolve);
  q.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) doSolve(); });
  $('#docInput').addEventListener('change', e => { addFiles(e.target.files, false); e.target.value = ''; });
  $('#imgInput').addEventListener('change', e => { addFiles(e.target.files, true); e.target.value = ''; });
  $('#fileChips').addEventListener('click', e => {
    const b = e.target.closest('[data-rm]'); if (!b) return;
    const f = state.files.splice(+b.dataset.rm, 1)[0]; if (f && f.url) URL.revokeObjectURL(f.url);
    renderChips();
  });
  $('#solveBtn').addEventListener('click', doSolve);
  $('#wbHint').addEventListener('click', e => {
    const b = e.target.closest('[data-wb]'); if (!b) return;
    q.value = b.dataset.wb; updateSolve(); q.focus();
  });

  // model dropdown
  const mb = $('#modelBtn'), menu = $('#modelMenu');
  const drawMenu = () => {
    menu.innerHTML = MODELS.map(m => `<li><button role="option" aria-selected="${m.name === state.model}" data-model="${esc(m.name)}"><span class="mini-logo"></span><span><b>${esc(m.name)}</b><small>${esc(m.desc)}</small></span></button></li>`).join('');
  };
  const closeMenu = () => { menu.hidden = true; mb.setAttribute('aria-expanded', 'false'); };
  mb.addEventListener('click', e => { e.stopPropagation(); drawMenu(); menu.hidden = !menu.hidden; mb.setAttribute('aria-expanded', String(!menu.hidden)); });
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-model]'); if (!b) return;
    state.model = b.dataset.model; $('#modelName').textContent = state.model; closeMenu(); mb.focus();
  });
  document.addEventListener('click', e => { if (!e.target.closest('.model-wrap')) closeMenu(); });

  // examples
  $$('.ex-card').forEach(c => c.addEventListener('click', () => {
    const ex = EXAMPLES[+c.dataset.example];
    $$('.ttab').forEach(x => { const on = x.dataset.tab === ex.tab; x.classList.toggle('active', on); x.setAttribute('aria-selected', String(on)); });
    state.tab = ex.tab; updatePill();
    q.value = ex.q; updateSolve(); doSolve();
  }));

  // history
  $('#historyBtn').addEventListener('click', () => openDrawer(true));
  $('#drawerClose').addEventListener('click', () => openDrawer(false));
  $('#drawerBackdrop').addEventListener('click', () => openDrawer(false));
  $('#historyList').addEventListener('click', e => {
    const b = e.target.closest('[data-h]'); if (!b) return;
    const h = state.history[+b.dataset.h];
    if (h.lessonId) { openDrawer(false); location.hash = `#/tutor/${h.lessonId}/` + (lessons[h.lessonId] && lessons[h.lessonId].status === 'ready' ? 'lesson' : 'prep'); return; }
    openDrawer(false); location.hash = '#/home';
    q.value = h.q; updateSolve(); renderAnswer(h);
  });
}

/* ---------------- Study: recent sets ---------------- */
const avatarSVG = `<svg width="9" height="9" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="10" r="5"/><path d="M3 22a9 9 0 0 1 18 0z"/></svg>`;
const decoSVG = `<svg width="34" height="30" viewBox="0 0 34 30" aria-hidden="true"><rect x="2" y="4" width="20" height="24" rx="4" transform="rotate(-8 12 16)" fill="#dbe8fb"/><rect x="11" y="2" width="20" height="26" rx="4" fill="#e7f0fd"/></svg>`;
function setCardHTML(s) {
  return `<a class="set-card" href="#/study/set/${s.id}">
    <div class="set-title"><span class="set-emoji" aria-hidden="true">${s.emoji}</span><span>${esc(s.title)}</span></div>
    <div class="set-creator"><span class="c-av">${avatarSVG}</span>${esc(s.creator)}</div>
    <div class="set-foot"><span>${s.cards.length} ${esc(t('flashcards'))}</span></div>
    <span class="set-deco">${decoSVG}</span>
  </a>`;
}
const newSetHTML = () => `<button class="new-set" data-action="create-set"><span class="ns-ico">${icon('plus', 22, 2)}</span><span>${esc(t('newset'))}</span></button>`;
function sortedSets() { return [...state.sets].sort((a, b) => b.created - a.created); }
function renderRecent() {
  $('#recentGrid').innerHTML = newSetHTML() + sortedSets().slice(0, 3).map(setCardHTML).join('');
}

/* ---------------- Modal ---------------- */
let lastFocus = null;
function openModal(html, onMount, cls) {
  if ($('#modal').hidden) lastFocus = document.activeElement;
  const m = $('#modal'), box = $('#modalBox');
  box.className = 'modal' + (cls ? ' ' + cls : ''); box.removeAttribute('aria-labelledby');
  box.innerHTML = html; m.hidden = false; hydrate(box);
  if (onMount) onMount(box);
  const f = box.querySelector('input, select, button'); if (f) f.focus();
}
function closeModal() { $('#modal').hidden = true; if (lastFocus) lastFocus.focus(); }
function openCreateSet() {
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Myanmar', 'History', 'Other'];
  openModal(`<form id="setForm">
    <h2 id="mTitle">${esc(t('newset'))}</h2>
    <p class="sub">Create a study set to hold flashcards and notes.</p>
    <label class="field"><span>Study set title</span><input class="input" name="title" required maxlength="80" placeholder="e.g. Grade 11 Chemistry – Bonding"></label>
    <label class="field"><span>Subject</span><select class="select" name="subject">${subjects.map(s => `<option>${s}</option>`).join('')}</select></label>
    <div class="modal-actions"><button type="button" class="btn-ghost" data-close>${esc(t('cancel'))}</button><button type="submit" class="btn-primary">${esc(t('createBtn'))}</button></div>
  </form>`, box => {
    box.setAttribute('aria-labelledby', 'mTitle');
    box.querySelector('[data-close]').onclick = closeModal;
    box.querySelector('#setForm').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const title = String(fd.get('title')).trim(); if (!title) return;
      const subject = String(fd.get('subject'));
      const emoji = { Mathematics: '📐', Physics: '⚡', Chemistry: '🧪', Biology: '🧬', English: '📖', Myanmar: '📜', History: '🏛️' }[subject] || '📘';
      const s = { id: 's' + Date.now(), title, subject, emoji, creator: 'thant htoo', cards: [], created: Date.now() };
      state.sets.push(s);
      closeModal(); toast(`“${title}” created`);
      if (location.hash === '#/study') renderRecent(); else location.hash = '#/study';
    };
  });
}

/* ---------------- Study sub-pages ---------------- */
const TOOLS = {
  flashcard: { key: 'tool.flashcard', color: '#6098f8', icon: 'cards' },
  quiz: { key: 'tool.quiz', color: '#c078f0', icon: 'list' },
  solver: { key: 'tool.solver', color: '#4db1eb', icon: 'scan' },
  guide: { key: 'tool.guide', color: '#ffa33f', icon: 'book' },
  predictor: { key: 'tool.predictor', color: '#ff7979', icon: 'trend' },
  cheatsheet: { key: 'tool.cheatsheet', color: '#7b80ff', icon: 'note' }
};
function subHead(title, subtitle, color, ic, backHref = '#/study') {
  return `<div class="sub-head"><a class="back" href="${backHref}">${icon('back', 16)} ${esc(t('back'))}</a>
    <div class="sub-title">${ic ? `<span class="sub-ico" style="background:${color}">${icon(ic, 22, 2)}</span>` : ''}<div><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div></div></div>`;
}
function renderTool(id) {
  const tool = TOOLS[id];
  if (!tool) { location.hash = '#/study'; return; }
  const v = $('#view-sub');
  v.innerHTML = `<div class="study-wrap" style="padding-top:48px">${subHead(t(tool.key), t(tool.key + '.sub'), tool.color, tool.icon)}<div id="toolBody"></div></div>`;
  const body = $('#toolBody');
  ({ flashcard: toolFlash, quiz: toolQuiz, solver: toolSolver, guide: toolGuide, predictor: toolPredict, cheatsheet: toolCheat })[id](body);
}

function mountFlashcards(el, cards) {
  let i = 0, flipped = false;
  const draw = () => {
    const c = cards[i];
    el.innerHTML = `<div class="fc-wrap">
      <div class="fc ${flipped ? 'flipped' : ''}" tabindex="0" role="button" aria-label="Flashcard ${i + 1} of ${cards.length}. Press Enter to flip.">
        <div class="fc-inner">
          <div class="fc-face fc-front"><span class="fc-tag">Term</span><p>${esc(c.q)}</p><small>${icon('flip', 13)} Click or press Space to flip</small></div>
          <div class="fc-face fc-back"><span class="fc-tag">Definition</span><p>${esc(c.a)}</p></div>
        </div>
      </div>
      <div class="fc-progress"><span style="width:${((i + 1) / cards.length) * 100}%"></span></div>
      <div class="fc-ctrl">
        <button class="btn-o" data-a="prev" ${i === 0 ? 'disabled' : ''}>${icon('chevL', 16)} Previous</button>
        <span class="fc-count">${i + 1} / ${cards.length}</span>
        <button class="btn-o" data-a="next" ${i === cards.length - 1 ? 'disabled' : ''}>Next ${icon('chevR', 16)}</button>
      </div></div>`;
    const card = el.querySelector('.fc');
    const flip = () => { flipped = !flipped; card.classList.toggle('flipped', flipped); };
    card.onclick = flip;
    card.onkeydown = e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      if (e.key === 'ArrowRight' && i < cards.length - 1) { i++; flipped = false; draw(); el.querySelector('.fc').focus(); }
      if (e.key === 'ArrowLeft' && i > 0) { i--; flipped = false; draw(); el.querySelector('.fc').focus(); }
    };
    el.querySelector('[data-a="prev"]').onclick = () => { if (i > 0) { i--; flipped = false; draw(); } };
    el.querySelector('[data-a="next"]').onclick = () => { if (i < cards.length - 1) { i++; flipped = false; draw(); } };
  };
  draw();
}
function toolFlash(el) {
  el.innerHTML = `<div class="panel-card"><div class="demo-flag">${icon('info', 14)} Sample deck: Biology basics (${FLASH_DECK.length} cards)</div><div id="fcMount"></div></div>`;
  mountFlashcards($('#fcMount'), FLASH_DECK);
}

function toolQuiz(el) {
  const answers = {}; let submitted = false;
  el.innerHTML = `<div class="panel-card" id="quizBox"></div>`;
  const box = $('#quizBox');
  const draw = () => {
    const done = Object.keys(answers).length;
    const score = QUIZ.reduce((s, q, i) => s + (answers[i] === q.a ? 1 : 0), 0);
    box.innerHTML = QUIZ.map((q, i) => `<fieldset class="q"><legend><span class="qn">${i + 1}</span><span>${esc(q.q)}</span></legend>
      <div class="opts">${q.o.map((o, j) => {
        let cls = answers[i] === j ? 'sel' : '';
        if (submitted) cls = j === q.a ? 'correct' : (answers[i] === j ? 'wrong' : '');
        return `<label class="opt ${cls}"><input type="radio" name="q${i}" value="${j}" ${answers[i] === j ? 'checked' : ''} ${submitted ? 'disabled' : ''}><span>${esc(o)}</span></label>`;
      }).join('')}</div>
      ${submitted ? `<p class="fb ${answers[i] === q.a ? 'ok' : 'no'}">${answers[i] === q.a ? 'Correct! ' : 'Not quite. '}${esc(q.why)}</p>` : ''}
    </fieldset>`).join('') +
      `<div class="quiz-foot">${submitted
        ? `<span class="score">Score: ${score} / ${QUIZ.length}</span><button class="btn-primary" data-a="retry">${icon('flip', 15)} Try again</button>`
        : `<span class="muted">${done} / ${QUIZ.length} answered</span><button class="btn-primary" data-a="submit" ${done < QUIZ.length ? 'disabled' : ''}>Submit answers</button>`}</div>`;
    $$('input[type=radio]', box).forEach(r => r.onchange = () => { answers[+r.name.slice(1)] = +r.value; draw(); box.querySelector(`input[name="${r.name}"]:checked`).focus(); });
    const s = box.querySelector('[data-a="submit"]'); if (s) s.onclick = () => { submitted = true; draw(); box.querySelector('.quiz-foot').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
    const r = box.querySelector('[data-a="retry"]'); if (r) r.onclick = () => { Object.keys(answers).forEach(k => delete answers[k]); submitted = false; draw(); };
  };
  draw();
}

function toolSolver(el) {
  const samples = ['အောက်ပါ သင်္ချာပုစ္ဆာကို အဆင့်ဆင့် ရှင်းပြပေးပါ။ 2x + 10 = 25', 'Solve 3x − 7 = 11', 'Solve 5x + 4 = 29'];
  el.innerHTML = `<div class="panel-card">
    <label for="tsInput" class="field" style="margin:0"><span>Your question</span></label>
    <textarea id="tsInput" class="solver-input" placeholder="Type a problem, e.g. 2x + 10 = 25">${esc(samples[0])}</textarea>
    <div class="sample-row"><span class="muted" style="font-size:13px">Try:</span>${samples.map((s, i) => `<button class="sample ${BURMESE.test(s) ? 'my' : ''}" data-s="${i}">${esc(s)}</button>`).join('')}</div>
    <div class="row-end"><button class="btn-primary" id="tsSolve">${icon('sparkle', 16)} Solve step by step</button></div>
  </div><div id="tsOut"></div>`;
  const inp = $('#tsInput');
  $$('.sample', el).forEach(b => b.onclick = () => { inp.value = samples[+b.dataset.s]; inp.focus(); });
  inp.addEventListener('input', () => { $('#tsSolve').disabled = !inp.value.trim(); });
  $('#tsSolve').onclick = () => {
    const q = inp.value.trim(); if (!q) return;
    $('#tsOut').innerHTML = `<div class="panel-card"><div class="demo-flag">${icon('info', 14)} ${esc(t('demoNote'))}</div><div class="ans-q" style="${BURMESE.test(q) ? 'font-family:var(--font-my);line-height:1.8' : ''}">${esc(q)}</div>${solverHTML(q)}</div>`;
  };
}

function toolGuide(el) {
  let sel = DOCS[0].id;
  el.innerHTML = `<div class="panel-card">
    <h3 class="sec-title" style="font-size:16px;margin-bottom:12px">Choose a document</h3>
    <div class="doc-list" role="radiogroup" aria-label="Documents">${DOCS.map(d => `<label class="doc-opt ${d.id === sel ? 'sel' : ''}"><input type="radio" name="doc" value="${d.id}" ${d.id === sel ? 'checked' : ''}><span class="doc-ico">${icon('file', 18)}</span><span><b>${esc(d.name)}</b><small>${esc(d.meta)}</small></span></label>`).join('')}</div>
    <div class="row-end"><label class="btn-o" style="cursor:pointer">${icon('clip', 15)} Upload your own<input type="file" class="vh" id="guideUp" accept=".pdf,.doc,.docx,.txt"></label><button class="btn-primary" id="genGuide">${icon('sparkle', 16)} Generate guide</button></div>
  </div><div id="guideOut"></div>`;
  $$('input[name=doc]', el).forEach(r => r.onchange = () => { sel = r.value; $$('.doc-opt', el).forEach(l => l.classList.toggle('sel', l.querySelector('input').checked)); });
  $('#guideUp').onchange = e => { if (e.target.files[0]) toast(`“${e.target.files[0].name}” selected — file processing isn’t connected, showing a sample guide`); };
  $('#genGuide').onclick = () => {
    const d = DOCS.find(x => x.id === sel);
    $('#guideOut').innerHTML = `<div class="panel-card guide"><div class="demo-flag">${icon('info', 14)} Sample summary — no document processing is connected.</div>
      <h3>Overview</h3><p>${esc(d.overview)}</p>
      <h3>Key points</h3><ul>${d.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
      <h3>Key terms</h3><div class="terms">${d.terms.map(([a, b]) => `<div class="term"><b>${esc(a)}</b>${esc(b)}</div>`).join('')}</div>
      <h3>Practice questions</h3><ul>${d.qs.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>`;
  };
}

function toolPredict(el) {
  el.innerHTML = `<div class="panel-card">
    <div class="demo-flag">${icon('info', 14)} Illustrative only — these priorities are sample data, not a real prediction or analysis of past exams.</div>
    <div class="pred-top"><label for="predSub" class="muted">Subject</label><select id="predSub" class="select">${Object.keys(PREDICT).map(s => `<option>${s}</option>`).join('')}</select></div>
    <div class="bars" id="bars"></div></div>`;
  const draw = () => {
    const rows = PREDICT[$('#predSub').value];
    $('#bars').innerHTML = rows.map(([n, v]) => {
      const p = v >= 75 ? ['high', 'High'] : v >= 50 ? ['med', 'Medium'] : ['low', 'Low'];
      return `<div class="bar-row"><span>${esc(n)}</span><div class="bar" role="img" aria-label="${esc(n)}: ${v}% illustrative priority"><span style="width:0" data-w="${v}"></span></div><span class="prio ${p[0]}">${p[1]} · ${v}%</span></div>`;
    }).join('');
    requestAnimationFrame(() => $$('#bars .bar span').forEach(s => { s.style.width = s.dataset.w + '%'; }));
  };
  $('#predSub').onchange = draw; draw();
}

function toolCheat(el) {
  const notes = [
    ['Linear equations', 'Isolate x: move constants, then divide.<br><span class="f">ax + b = c ⇒ x = (c − b) / a</span>'],
    ['Quadratic formula', '<span class="f">x = (−b ± √(b² − 4ac)) / 2a</span><br>Discriminant <mark>b² − 4ac</mark> tells the number of roots.'],
    ['Pythagoras', 'Right triangles only: <span class="f">a² + b² = c²</span>, where <mark>c is the hypotenuse</mark>.'],
    ['Circle', 'Area <span class="f">πr²</span> · Circumference <span class="f">2πr</span><br>Angle at centre = <mark>2 × angle at circumference</mark>.'],
    ['Percent change', '<span class="f">(new − old) / old × 100%</span><br>Use the <mark>original</mark> value as the base.'],
    ['Index laws', '<span class="f">aᵐ·aⁿ = aᵐ⁺ⁿ</span> · <span class="f">(aᵐ)ⁿ = aᵐⁿ</span> · <span class="f">a⁰ = 1</span>'],
    ['Trig ratios', '<mark>SOH CAH TOA</mark> — sin = opp/hyp, cos = adj/hyp, tan = opp/adj.'],
    ['Probability', '<span class="f">P(A) = favourable / total</span><br>P(not A) = <mark>1 − P(A)</mark>.'],
    ['မှတ်ရန် (Remember)', 'ယူနစ်များကို <mark>အမြဲ ရေးပါ</mark> — units always earn marks.']
  ];
  el.innerHTML = `<div class="panel-card"><div class="demo-flag">${icon('info', 14)} Example revision notes: Grade 10 Mathematics</div>
    <div class="cheat-grid">${notes.map(([h, p]) => `<div class="cheat"><h4>${h}</h4><p>${p}</p></div>`).join('')}</div>
    <div class="row-end"><button class="btn-o" id="printCheat">${icon('file', 15)} Print</button></div></div>`;
  $('#printCheat').onclick = () => window.print();
}

function renderSets() {
  const v = $('#view-sub');
  v.innerHTML = `<div class="study-wrap" style="padding-top:48px">${subHead(t('allSets'), `${state.sets.length} set${state.sets.length === 1 ? '' : 's'}`, '#2479f2', 'cards')}
    <div class="sets-grid">${newSetHTML()}${sortedSets().map(setCardHTML).join('')}</div></div>`;
}

function renderSet(id) {
  const s = state.sets.find(x => x.id === id);
  const v = $('#view-sub');
  if (!s) { v.innerHTML = `<div class="study-wrap" style="padding-top:48px">${subHead('Study set not found', '', '', null)}<p class="muted">This set only existed in a previous session.</p></div>`; return; }
  v.innerHTML = `<div class="study-wrap" style="padding-top:48px">
    ${subHead(s.title, '', '', null)}
    <div class="panel-card">
      <div class="set-meta"><span style="font-size:22px">${s.emoji}</span><span>${esc(s.subject)}</span><span>·</span><span class="set-creator" style="margin:0"><span class="c-av">${avatarSVG}</span>${esc(s.creator)}</span><span>·</span><span id="cardCount">${s.cards.length} ${esc(t('flashcards'))}</span>
        <span style="flex:1"></span><button class="btn-primary" id="studyBtn" ${s.cards.length ? '' : 'disabled'}>${icon('cards', 16)} Study flashcards</button></div>
    </div>
    <div class="panel-card" id="studyArea" hidden></div>
    <div class="panel-card">
      <h3 class="sec-title" style="font-size:16px;margin-bottom:12px">Cards</h3>
      <div class="card-list" id="cardList"></div>
      <form class="add-card" id="addCard"><input class="input" name="q" placeholder="Term" required aria-label="Term"><input class="input" name="a" placeholder="Definition" required aria-label="Definition"><button class="btn-o" type="submit">${icon('plus', 15)} Add card</button></form>
    </div></div>`;
  const drawList = () => {
    $('#cardList').innerHTML = s.cards.length
      ? s.cards.map((c, i) => `<div class="card-row"><span class="n">${i + 1}</span><b>${esc(c.q)}</b><span>${esc(c.a)}</span></div>`).join('')
      : `<div class="empty">No flashcards yet — add your first card below.</div>`;
    $('#cardCount').textContent = `${s.cards.length} ${t('flashcards')}`;
    $('#studyBtn').disabled = !s.cards.length;
  };
  drawList();
  $('#studyBtn').onclick = () => {
    const area = $('#studyArea'); area.hidden = false;
    mountFlashcards(area, s.cards); area.scrollIntoView({ behavior: 'smooth', block: 'center' });
    area.querySelector('.fc').focus({ preventScroll: true });
  };
  $('#addCard').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    s.cards = s.cards === ACE_CARDS ? [...ACE_CARDS] : s.cards;
    s.cards.push({ q: String(fd.get('q')).trim(), a: String(fd.get('a')).trim() });
    e.target.reset(); e.target.q.focus(); drawList();
    $('#studyArea').hidden = true;
  };
}

/* ================================================================
   Whiteboard Tutor — Gemini lesson, board, questions, and chat.
   Audio narration and speech recognition are not connected.
   ================================================================ */
function abortOtherLessons(keepId) {
  Object.keys(lessons).forEach(id => {
    const L = lessons[id];
    if (!L || id === keepId || !L.abort || L.status !== 'preparing') return;
    L.abort.abort();
    L.abort = null;
    L.running = false;
    L.waiting = false;
  });
}
const TUTOR_DAILY_LIMIT = null; // e.g. 3 → the plan modal appears after 3 lessons in a session. null = no limit.
const lessons = {};             // id → lesson (kept only while the page is open)
let lessonsCreated = 0;
const SPEEDS = [0.75, 1, 1.25, 1.5];
const fmtSpeed = s => (Number.isInteger(s * 10) ? s.toFixed(1) : String(s)) + 'x';
const SRC_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.docx,.pptx,.txt,.md,.csv,.sql,.json';
const FILE_MAX_BYTES = 8 * 1024 * 1024;
const T = { id: null, L: null, playing: true, speed: 1, timer: null, startTimer: null, capTimer: null, q: null, follow: true, captions: true, pen: false, strokes: [], ro: null, slideTimer: null, chatAbort: null, chatBusy: false, qBusy: false };

const fmtSize = n => n < 1024 ? n + ' B' : n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'lesson';
/* inline markup used in lesson data: `code`, **bold**, _{sub}, ^{sup} */
function inl(s) {
  return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>').replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
}
const plain = s => String(s).replace(/_\{([^}]+)\}/g, '_$1').replace(/\^\{([^}]+)\}/g, '^$1').replace(/\*\*/g, '');
function blockText(b) {
  const raw = b.t === 'ul' ? (b.items || []).join(' · ') : b.t === 'q' ? b.question : b.t === 'table' ? (b.headers || []).join(' ') : (b.text || b.caption || '');
  return plain(raw).replace(/`/g, '');
}
const lessonTitle = L => (L.blocks.find(b => b.t === 'title') || {}).text || L.topic || 'Lesson';

/* ---------- source files ---------- */
function classifyFile(f) {
  const n = (f.name || '').toLowerCase();
  if (/\.(png|jpe?g|webp)$/.test(n)) return 'image';
  if (/\.(txt|md|csv|sql|json)$/.test(n)) return 'text';
  if (/\.pdf$/.test(n)) return 'pdf';
  if (/\.docx$/.test(n)) return 'word';
  if (/\.pptx$/.test(n)) return 'slides';
  return 'other';
}
function makeSource(file) {
  const kind = classifyFile(file);
  return { name: file.name, size: file.size, kind, file, text: '', url: kind === 'image' ? URL.createObjectURL(file) : null,
    status: kind === 'other' ? 'unsupported' : kind === 'text' ? 'pending' : kind === 'image' ? 'preview' : 'queued', sent: false };
}
function readSource(src) {
  if (src.status !== 'pending' || !src.file) return Promise.resolve(src);
  return new Promise(res => {
    const r = new FileReader();
    r.onload = () => { src.text = String(r.result).slice(0, 20000); src.status = 'read'; res(src); };
    r.onerror = () => { src.status = 'error'; res(src); };
    r.readAsText(src.file);
  });
}
const srcStatus = s => t(({
  pending: 'src.pending', read: 'src.read', preview: 'src.preview', queued: 'src.queued',
  used: 'src.used', partial: 'src.partial', unsupported: 'src.unsupported', error: 'src.error'
})[s.status] || 'src.error');

/* ---------- create ---------- */
function wantsBurmese(topic) {
  return state.lang === 'my' || /[\u1000-\u109F]/.test(topic || '');
}
function lessonLang(L) {
  if (L && (L.language === 'my' || (L.apiLesson && L.apiLesson.language === 'my'))) return 'my';
  return state.lang === 'my' ? 'my' : 'en';
}
function createLesson(topic, files) {
  if (TUTOR_DAILY_LIMIT != null && lessonsCreated >= TUTOR_DAILY_LIMIT) { openPlans(true); return null; }
  const id = 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const text = (topic || '').trim();
  lessons[id] = { id, topic: text, language: wantsBurmese(text) ? 'my' : 'en', sources: files.map(makeSource), status: 'preparing', step: 0,
    blocks: [], idx: 0, answers: {}, qa: [], strokes: [], created: Date.now() };
  lessonsCreated++;
  location.hash = `#/tutor/${id}/prep`;
  return id;
}

/* ---------- Gemini lesson mapping ---------- */
function clipText(s, n) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) : t;
}
function sayOf(s) { return clipText(plain(s), 280); }
function normAnswer(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
function localError(key, vars) { const err = new Error(t(key, vars)); err.local = true; return err; }
function apiErr(res, data) {
  const err = new Error((data && data.error) || '');
  err.code = (data && data.code) || (res.status === 429 ? 'rate_limit' : 'upstream');
  err.status = res.status;
  return err;
}
function friendlyError(err) {
  if (err && err.local) return err.message;
  if (err && err.name === 'AbortError') return t('err.timeout');
  if (err && err.code && I18N.en['err.' + err.code]) return t('err.' + err.code);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return t('err.network');
  if (err && /Failed to fetch|NetworkError|Load failed/i.test(err.message || '')) return t('err.network');
  return t('err.upstream');
}
function questionToBlock(q) {
  const mc = q.type !== 'short-answer';
  const options = mc ? (q.options || []) : [];
  const answer = mc ? options.findIndex(o => normAnswer(o) === normAnswer(q.correctAnswer)) : -1;
  return { t: 'q', qtype: mc ? 'multiple-choice' : 'short-answer', question: q.question, options, answer, correctAnswer: q.correctAnswer || '', explain: q.explanation || '', difficulty: q.difficulty || 'medium', relatedSection: q.relatedSection || '', say: q.question };
}
function lessonToBlocks(lesson, note) {
  const my = lesson.language === 'my';
  const blocks = [];
  const side = i => (i % 2 === 0 ? 'L' : 'R');
  blocks.push({ t: 'title', side: 'L', text: lesson.title, say: sayOf(lesson.summary || lesson.title) });
  if (note) blocks.push({ t: 'callout', side: 'L', text: note, say: sayOf(note) });
  if (lesson.summary) blocks.push({ t: 'p', side: 'L', text: lesson.summary, say: sayOf(lesson.summary) });
  if (lesson.learningObjectives && lesson.learningObjectives.length) {
    blocks.push({ t: 'h', side: 'L', text: my ? 'သင်ယူရမည့် ရည်မှန်းချက်များ' : 'Learning objectives', say: sayOf(lesson.learningObjectives[0]) });
    blocks.push({ t: 'ul', side: 'L', items: lesson.learningObjectives, say: sayOf(lesson.learningObjectives.join('. ')) });
  }
  const questions = (lesson.questions || []).map(questionToBlock);
  const used = new Set();
  (lesson.sections || []).forEach((sec, i) => {
    const sd = side(i);
    if (sec.heading) blocks.push({ t: 'h', side: sd, text: sec.heading, say: sayOf(sec.explanation || sec.heading) });
    if (sec.explanation) blocks.push({ t: 'p', side: sd, text: sec.explanation, say: sayOf(sec.explanation) });
    if (sec.bulletPoints && sec.bulletPoints.length) blocks.push({ t: 'ul', side: sd, items: sec.bulletPoints, say: sayOf(sec.bulletPoints[0]) });
    (sec.examples || []).forEach(ex => { if (ex) blocks.push({ t: 'p', side: sd, text: ex, say: sayOf(ex) }); });
    if (sec.codeExample) blocks.push({ t: 'code', side: sd, lang: sec.codeLanguage || '', text: sec.codeExample, say: sayOf(sec.heading || sec.codeExample) });
    (sec.mathExpressions || []).forEach(m => { if (m) blocks.push({ t: 'math', side: sd, text: m, say: sayOf(m) }); });
    if (sec.table && sec.table.headers && sec.table.headers.length) blocks.push({ t: 'table', side: sd, headers: sec.table.headers, rows: sec.table.rows || [], say: sayOf(sec.diagramDescription || sec.heading) });
    if (sec.visualType && sec.visualType !== 'none' && sec.visualType !== 'table' && (sec.mermaid || sec.diagramDescription)) {
      blocks.push({ t: 'diagram', side: sd, mermaid: sec.mermaid || '', caption: sec.diagramDescription || sec.heading || '', fallback: sec.diagramDescription || '', say: sayOf(sec.diagramDescription || sec.heading) });
    } else if (sec.diagramDescription && sec.visualType !== 'table') {
      blocks.push({ t: 'callout', side: sd, text: sec.diagramDescription, say: sayOf(sec.diagramDescription) });
    }
    const related = questions.findIndex((q, idx) => !used.has(idx) && q.relatedSection && sec.heading && normAnswer(q.relatedSection) === normAnswer(sec.heading));
    const pick = related >= 0 ? related : (i < questions.length ? questions.findIndex((_, idx) => !used.has(idx)) : -1);
    if (pick >= 0) { used.add(pick); blocks.push(questions[pick]); }
  });
  questions.forEach((q, idx) => { if (!used.has(idx)) blocks.push(q); });
  if (lesson.keyTakeaways && lesson.keyTakeaways.length) {
    blocks.push({ t: 'h', side: 'R', text: my ? 'အဓိက အချက်များ' : 'Key takeaways', say: sayOf(lesson.keyTakeaways[0]) });
    blocks.push({ t: 'ul', side: 'R', items: lesson.keyTakeaways, say: sayOf(lesson.keyTakeaways.join('. ')) });
  }
  if (lesson.conclusion) blocks.push({ t: 'callout', side: 'R', text: lesson.conclusion, say: sayOf(lesson.conclusion) });
  return blocks;
}
function compactLesson(lesson) {
  return {
    language: lesson.language === 'my' ? 'my' : 'en',
    title: clipText(lesson.title, 180),
    topic: clipText(lesson.topic, 400),
    summary: clipText(lesson.summary, 800),
    learningObjectives: (lesson.learningObjectives || []).slice(0, 6),
    sections: (lesson.sections || []).slice(0, 8).map(s => ({ heading: clipText(s.heading, 180), explanation: clipText(s.explanation, 900), bulletPoints: (s.bulletPoints || []).slice(0, 6) })),
    keyTakeaways: (lesson.keyTakeaways || []).slice(0, 6),
    conclusion: clipText(lesson.conclusion, 600)
  };
}
function progressPayload(L) {
  let current = '';
  L.blocks.forEach((b, i) => { if (i < L.idx && (b.t === 'h' || b.t === 'title')) current = plain(b.text || ''); });
  const recentAnswers = [];
  L.blocks.forEach((b, i) => {
    const a = L.answers[i];
    if (!a || b.t !== 'q' || a.pending) return;
    recentAnswers.push({ question: clipText(b.question, 300), result: a.revealed ? 'revealed' : a.skipped ? 'skipped' : a.ok ? 'correct' : 'incorrect' });
  });
  return { currentSection: current, recentAnswers: recentAnswers.slice(-8) };
}
function validateLessonInput(L) {
  if (L.sources.length > 4) throw localError('prep.fileCount');
  for (const s of L.sources) {
    if (s.kind === 'other' || s.status === 'unsupported') throw localError('prep.fileType', { name: s.name });
    if (s.size > FILE_MAX_BYTES) throw localError('prep.fileBig', { name: s.name });
  }
  if (!L.topic && !L.sources.length) throw localError('prep.errEmpty');
}
async function postJson(path, body, signal) {
  let res;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body), signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw Object.assign(new Error(''), { code: 'network' });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw apiErr(res, data);
  return data;
}
async function readSSE(res, onEvent) {
  if (!res.body) throw Object.assign(new Error(''), { code: 'upstream' });
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split(/\n\n/);
    buf = parts.pop();
    for (const part of parts) {
      const data = part.split(/\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n');
      if (!data) continue;
      let ev; try { ev = JSON.parse(data); } catch { continue; }
      onEvent(ev);
    }
  }
}
function applyMaterials(L, materials) {
  (materials || []).forEach(m => {
    const src = L.sources.find(s => s.name === m.name);
    if (!src) return;
    src.status = m.status === 'partial' ? 'partial' : m.status === 'error' ? 'error' : 'used';
    src.sent = true;
  });
}
async function requestLesson(L, signal) {
  const fd = new FormData();
  fd.append('topic', L.topic || '');
  fd.append('language', lessonLang(L));
  L.sources.forEach(s => { if (s.file) fd.append('files', s.file, s.file.name); });
  let res;
  try { res = await fetch('/api/whiteboard/lesson', { method: 'POST', body: fd, signal }); }
  catch (err) { if (err.name === 'AbortError') throw err; throw Object.assign(new Error(''), { code: 'network' }); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw apiErr(res, data);
  return data;
}
/* ---------- preparation screen ---------- */
const PREP_STEPS = ['prep.s1', 'prep.s2', 'prep.s3', 'prep.s4', 'prep.s5'];
const PREP_SLIDES = [
  { t: 'slide1.t', s: 'slide1.s', art: `<div class="pa-card"><p class="pa-hand">Which side is the hypotenuse?</p><svg viewBox="0 0 160 80" width="160" height="80"><path d="M30 12v56h104z" fill="none" stroke="#2b2f36" stroke-width="1.6"/><path d="M30 60h8v8" fill="none" stroke="#2b2f36"/><ellipse cx="88" cy="38" rx="30" ry="13" transform="rotate(24 88 38)" fill="none" stroke="#2479f2" stroke-width="1.6"/><text x="20" y="44" font-size="9">a</text><text x="92" y="36" font-size="9" fill="#2479f2">c</text></svg><div class="pa-row"><span class="pa-btn on">+ Explain</span><span class="pa-btn">+ Add to question</span></div><p class="pa-sub">c is opposite the right angle.</p></div>` },
  { t: 'slide2.t', s: 'slide2.s', art: `<div class="pa-card"><p class="pa-hand">Solve 2x + 10 = 25</p><div class="pa-opt">x = 5</div><div class="pa-opt ok">x = 7.5 ✓</div><div class="pa-opt">x = 17.5</div><p class="pa-sub">Subtract 10, then divide by 2.</p></div>` },
  { t: 'slide3.t', s: 'slide3.s', art: `<div class="pa-card"><div class="pa-chat you">Why does a LEFT JOIN keep the row?</div><div class="pa-chat">It keeps every left-side row and fills missing matches with NULL.</div><p class="pa-sub">Ask in your own words.</p></div>` }
];
const prepTopic = L => { const s = L.topic || (L.sources[0] && L.sources[0].name) || 'your topic'; return s.length > 42 ? s.slice(0, 40) + '…' : s; };
function stopPrepSlides() { clearInterval(T.slideTimer); T.slideTimer = null; }
function startPrepSlides() {
  stopPrepSlides(); let i = 0;
  T.slideTimer = setInterval(() => {
    const sl = $$('.prep-slide'); if (!sl.length) return stopPrepSlides();
    sl[i].classList.remove('on'); i = (i + 1) % sl.length; sl[i].classList.add('on');
  }, 2800);
}
function renderPrep(id) {
  const v = $('#view-prep'), L = lessons[id];
  if (!L) {
    v.innerHTML = `<div class="prep-missing"><span class="ph-alert">${icon('alert', 26)}</span><h2>${esc(t('prep.missing'))}</h2><p>${esc(t('prep.missingSub'))}</p>
      <div class="row-end" style="justify-content:center"><a class="btn-o" href="#/home">${icon('back', 16)} ${esc(t('nav.home'))}</a><button class="btn-primary" id="prepSample">${icon('sparkle', 16)} ${esc(t('prep.sample'))}</button></div></div>`;
    $('#prepSample').onclick = () => createLesson('SQL query Big-O complexity analysis', []);
    return;
  }
  if (L.status === 'ready') { location.replace(`#/tutor/${id}/lesson`); return; }
  v.innerHTML = `<a class="prep-back" href="#/home">${icon('chevL', 18)}<span data-i18n="back">${esc(t('back'))}</span></a>
    <div class="prep-card">
      <div class="prep-left" aria-hidden="true"><span class="peek peek-l"></span><span class="peek peek-r"></span>
        ${PREP_SLIDES.map((s, i) => `<div class="prep-slide${i === 0 ? ' on' : ''}">${s.art}<h3 data-i18n="${s.t}">${esc(t(s.t))}</h3><p data-i18n="${s.s}">${esc(t(s.s))}</p></div>`).join('')}
      </div>
      <div class="prep-right" id="prepBox" data-id="${id}" aria-live="polite"></div>
    </div>`;
  L.shownPct = 0; drawPrep(L); startPrepSlides();
  if (L.status === 'preparing' && !L.running) runPrep(L);
}
function drawPrep(L) {
  const box = $('#prepBox'); if (!box || box.dataset.id !== L.id) return;
  if (L.status === 'error') {
    box.innerHTML = `<div class="prep-head"><h2>${esc(t('prep.err'))}</h2></div><div class="prep-err">${icon('alert', 18)}<span>${esc(L.error)}</span></div>
      <div class="row-end" style="justify-content:flex-start;margin-top:18px"><button class="btn-primary" id="prepRetry">${icon('flip', 15)} ${esc(t('retry'))}</button><a class="btn-o" href="#/home">${esc(t('back'))}</a></div>`;
    $('#prepRetry').onclick = () => { L.status = 'preparing'; L.running = false; runPrep(L); };
    return;
  }
  const n = PREP_STEPS.length, done = L.step, waiting = !!L.waiting;
  box.innerHTML = `<div class="prep-head"><h2>${esc(t('prep.title'))}</h2><span class="prep-pct">${waiting ? '…' : ''}</span></div>
    <div class="prep-bar${waiting ? ' indeterminate' : ''}" role="progressbar" aria-label="Lesson preparation" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${done}"><span style="width:${waiting ? '35%' : Math.round(done / n * 100) + '%'}"></span></div>
    <div class="prep-time">${icon('clock', 16)} ${esc(done >= n ? t('prep.ready') : t('prep.working'))}</div>
    <ol class="prep-steps">${PREP_STEPS.map((k, i) => `<li class="${i < done ? 'done' : i === done ? 'cur' : ''}"><span class="ps-ico">${i < done ? icon('check', 12, 3) : ''}</span><span>${esc(t(k, { topic: prepTopic(L) }))}</span></li>`).join('')}</ol>
    <p class="prep-note">${icon('info', 13)} ${esc(t('prep.note'))}</p>
    <div class="prep-actions"><button class="btn-o" id="prepCancel" type="button">${esc(t('prep.cancel'))}</button></div>`;
  $('#prepCancel').onclick = () => {
    if (L.abort) L.abort.abort();
    L.running = false; L.waiting = false;
    location.hash = '#/home';
  };
}
async function runPrep(L) {
  if (L.running) return;
  if (L.abort) L.abort.abort();
  const ac = new AbortController();
  L.abort = ac;
  L.running = true; L.status = 'preparing'; L.step = 0; L.waiting = false; L.error = null;
  L.blocks = []; L.apiLesson = null; L.idx = 0; L.answers = {}; L.qa = [];
  drawPrep(L);
  try {
    validateLessonInput(L);
    await Promise.all(L.sources.map(readSource));
    if (ac.signal.aborted) return;
    L.step = 1; drawPrep(L);
    L.waiting = true; drawPrep(L);
    const data = await requestLesson(L, ac.signal);
    if (ac.signal.aborted) return;
    L.waiting = false;
    const lesson = data && data.lesson;
    if (!lesson || !Array.isArray(lesson.sections) || !lesson.sections.length || !Array.isArray(lesson.questions) || !lesson.questions.length) {
      throw Object.assign(new Error(''), { code: 'invalid_response' });
    }
    L.step = 2; drawPrep(L);
    applyMaterials(L, data.materials);
    const partial = (data.materials || []).filter(m => m.status === 'partial' || m.status === 'error').map(m => m.name);
    L.language = lesson.language === 'my' ? 'my' : 'en';
    L.apiLesson = lesson;
    L.blocks = lessonToBlocks(lesson, partial.length ? t('tw.partial') + ' ' + partial.join(', ') : '');
    if (!L.blocks.length || !L.blocks.some(b => b.t === 'q')) throw Object.assign(new Error(''), { code: 'invalid_response' });
    L.sources.forEach(s => { s.sent = true; });
    L.step = 3; drawPrep(L);
    L.step = 4; drawPrep(L);
    L.step = 5; drawPrep(L);
    L.status = 'ready'; L.running = false; L.abort = null;
    if (location.hash === `#/tutor/${L.id}/prep`) location.replace(`#/tutor/${L.id}/lesson`);
    else toast(t('prep.readyToast', { topic: prepTopic(L) }));
  } catch (err) {
    if (err.name === 'AbortError' || ac.signal.aborted) {
      L.running = false; L.waiting = false;
      if (L.abort === ac) L.abort = null;
      return;
    }
    L.status = 'error'; L.error = friendlyError(err); L.running = false; L.waiting = false; L.abort = null;
    drawPrep(L);
  }
}

/* ---------- lesson workspace ---------- */
const AVATAR = `<svg viewBox="0 0 64 64" width="60" height="60" aria-hidden="true"><defs><linearGradient id="twAvRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset=".5" stop-color="#ff5fa2"/><stop offset="1" stop-color="#4f8cff"/></linearGradient><clipPath id="twAvClip"><circle cx="32" cy="32" r="27.5"/></clipPath></defs><circle cx="32" cy="32" r="30.5" fill="#fff" stroke="url(#twAvRing)" stroke-width="2.5"/><g clip-path="url(#twAvClip)"><rect width="64" height="64" fill="#fbeee4"/><path d="M13 42c-2-17 6-28 19-28s21 11 19 28c-2 9-6 15-6 15H19s-4-6-6-15z" fill="#7a4a2b"/><ellipse cx="32" cy="35" rx="12" ry="13.5" fill="#f6cfb2"/><path d="M19 31c2-9 8-13 14-13 7 0 12 5 13 12-5-1-11-4-14-8-3 5-8 8-13 9z" fill="#8a5432"/><circle cx="27.5" cy="35.5" r="1.8" fill="#2b1a10"/><circle cx="36.5" cy="35.5" r="1.8" fill="#2b1a10"/><path d="M28.5 41.5c2 1.8 5 1.8 7 0" stroke="#c2563f" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="24.5" cy="39.5" r="2" fill="#f5a9a0" opacity=".6"/><circle cx="39.5" cy="39.5" r="2" fill="#f5a9a0" opacity=".6"/><path d="M16 64c2-9 8-13 16-13s14 4 16 13z" fill="#5f8fe0"/></g></svg>`;

function blockHTML(b) {
  switch (b.t) {
    case 'title': return `<h1 class="wb-title">${inl(b.text)}</h1>`;
    case 'h': return `<h2 class="wb-h">${inl(b.text)}</h2>`;
    case 'ul': return `<ul class="wb-ul">${(b.items || []).map(x => `<li>${inl(x)}</li>`).join('')}</ul>`;
    case 'p': return `<p class="wb-p">${inl(b.text)}</p>`;
    case 'math': return `<div class="wb-math"></div>`;
    case 'code': return `<pre class="wb-code">${b.lang ? `<span class="wb-code-lang">${esc(b.lang)}</span>` : ''}<code>${esc(b.text || '')}</code></pre>`;
    case 'callout': return `<div class="wb-callout">${inl(b.text)}</div>`;
    case 'table': return `<div class="wb-table-wrap"><table class="wb-table"><thead><tr>${(b.headers || []).map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${(b.rows || []).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'diagram': return `<figure class="wb-fig"><div class="wb-diagram"></div>${b.caption ? `<figcaption>${inl(b.caption)}</figcaption>` : ''}<p class="wb-diagram-note">${inl(b.fallback || b.caption || '')}</p></figure>`;
    default: return '';
  }
}
function paintRich(el, b) {
  if (!el || !b) return;
  if (b.t === 'math') {
    const box = el.querySelector('.wb-math');
    if (!box) return;
    if (window.katex) {
      try { window.katex.render(String(b.text || ''), box, { throwOnError: false, trust: false, displayMode: true }); return; } catch { /* show the source */ }
    }
    box.textContent = b.text || '';
  }
  if (b.t === 'diagram') renderDiagram(el, b);
}
function cleanMermaid(src) {
  let s = String(src || '').trim().replace(/^```(?:mermaid)?\s*/i, '').replace(/```$/, '').trim();
  if (!s || /<[^>]+>/.test(s) || /javascript:/i.test(s) || /\bclick\b/i.test(s)) return '';
  if (!/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|mindmap|timeline|pie|gantt|journey)\b/.test(s)) return '';
  return s;
}
function safeSvg(svg) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (doc.querySelector('parsererror, script, foreignObject, iframe, object, embed')) return null;
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== 'svg') return null;
  root.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attr => {
      if (/^on/i.test(attr.name) || /javascript:/i.test(attr.value)) node.removeAttribute(attr.name);
    });
  });
  return root;
}
async function ensureMermaid() {
  if (window.mermaid) return window.mermaid;
  const mod = await import('https://cdn.jsdelivr.net/npm/mermaid@11.12.2/dist/mermaid.esm.min.mjs');
  const mermaid = mod.default || mod;
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', htmlLabels: false, suppressErrorRendering: true });
  window.mermaid = mermaid;
  return mermaid;
}
async function renderDiagram(el, b) {
  const host = el.querySelector('.wb-diagram');
  const note = el.querySelector('.wb-diagram-note');
  const src = cleanMermaid(b.mermaid);
  if (!host || !src) return;
  try {
    const mermaid = await ensureMermaid();
    if (mermaid.parse) await mermaid.parse(src);
    const id = 'mmd' + Math.random().toString(36).slice(2, 9);
    const out = await mermaid.render(id, src);
    const svg = safeSvg(out.svg);
    if (!svg) throw new Error('diagram');
    host.replaceChildren(svg);
    if (note) note.hidden = true;
  } catch { /* keep the written description */ }
}
function twShellHTML() {
  return `<div class="tw" id="tw">
  <div class="tw-strip"></div>
  <div class="tw-body">
    <aside class="tw-src" id="twSrc" aria-label="${esc(t('tw.materials'))}">
      <div class="tw-src-head"><div><small data-i18n="tw.source">${esc(t('tw.source'))}</small><h2 data-i18n="tw.materials">${esc(t('tw.materials'))}</h2></div>
        <button class="tw-x" id="twSrcClose" aria-label="Close materials panel" title="Close materials panel">${icon('x', 16, 2)}</button></div>
      <div class="tw-src-scroll" id="twSrcScroll"></div>
      <div id="twUploadWrap"></div>
    </aside>
    <div class="tw-grip" id="twGrip" role="separator" aria-orientation="vertical" aria-label="Resize materials panel" tabindex="0"><span></span></div>
    <section class="tw-main" aria-label="Whiteboard">
      <div class="tw-topl">
        <a class="tw-chip tw-chip-ico" href="#/home" aria-label="Back to Home" title="Back to Home">${icon('back', 16)}</a>
        <button class="tw-chip" id="twSrcOpen">${icon('book', 15)}<span data-i18n="tw.materialsBtn">${esc(t('tw.materialsBtn'))}</span></button>
        <button class="tw-chip" id="twInkClear" hidden>${icon('x', 14)}<span data-i18n="tw.clearInk">${esc(t('tw.clearInk'))}</span></button>
      </div>
      <div class="tw-topr">
        <div class="tw-pill">
          <div class="tw-speed">
            <button class="tw-speed-btn" id="twSpeedBtn" aria-haspopup="listbox" aria-expanded="false"><span id="twSpeedVal">${fmtSpeed(T.speed)}</span> <span data-i18n="tw.speed">${esc(t('tw.speed'))}</span>${icon('chev', 13)}</button>
            <ul class="tw-speed-menu" id="twSpeedMenu" role="listbox" aria-label="Playback speed" hidden>${SPEEDS.map(s => `<li><button role="option" data-speed="${s}" aria-selected="${s === T.speed}">${fmtSpeed(s)}</button></li>`).join('')}</ul>
          </div>
          <span class="tw-sep"></span>
          <button class="tw-ibtn" id="twDownload" aria-label="${esc(t('tw.notes'))}" title="${esc(t('tw.notes'))}">${icon('download', 18)}</button>
        </div>
        <button class="tw-end" id="twEnd"><span class="stop" aria-hidden="true"></span><span data-i18n="tw.end">${esc(t('tw.end'))}</span></button>
      </div>
      <div class="tw-scroll" id="twScroll" tabindex="0" aria-label="Lesson board">
        <div class="tw-board" id="twBoard"><div class="tw-col" id="twColL"></div><div class="tw-col" id="twColR"></div></div>
        <div class="tw-qa" id="twQA" aria-live="polite"></div>
        <div id="twEndBox"></div>
        <canvas id="twInk" aria-hidden="true"></canvas>
      </div>
      <div class="tw-loading" id="twLoading"><span class="tw-spin"></span><h3 data-i18n="tw.preparing">${esc(t('tw.preparing'))}</h3><p data-i18n="tw.preparingSub">${esc(t('tw.preparingSub'))}</p></div>
      <div class="tw-qcard" id="twQ" role="group" aria-labelledby="twQText" hidden></div>
      <button class="tw-follow" id="twFollow" hidden>${icon('expand', 15)}<span data-i18n="tw.follow">${esc(t('tw.follow'))}</span></button>
      <div class="tw-bar">
        <div class="tw-bar-l">
          <span class="tw-avatar" title="Tutor">${AVATAR}</span>
          <button class="tw-round" id="twCapBtn" aria-pressed="true" aria-label="Captions" title="Show or hide captions">${icon('captions', 18)}</button>
          <button class="tw-round" id="twPlay" aria-label="Pause lesson" title="Pause lesson">${icon('pause', 18)}</button>
          <button class="tw-round is-off" id="twVol" aria-disabled="true" aria-label="Audio narration isn't available in this prototype" title="Audio narration isn't available in this prototype">${icon('volume', 18)}</button>
          <p class="tw-cap" id="twCap" aria-live="polite"></p>
        </div>
        <div class="tw-bar-r">
          <button class="tw-round" id="twPen" aria-pressed="false" aria-label="Pen: circle something to get it explained" title="Pen: circle something on the board to get it explained">${icon('pen', 18)}</button>
          <form class="tw-ask" id="twAsk" autocomplete="off">
            <label class="tw-plus" title="Add materials">${icon('plus', 20)}<input type="file" class="vh" id="twFile2" multiple accept="${SRC_ACCEPT}" aria-label="Add materials"></label>
            <input id="twAskInput" placeholder="${esc(t('tw.ask'))}" aria-label="${esc(t('tw.ask'))}">
            <button class="tw-send" id="twSend" type="submit" aria-label="Send" disabled>${icon('send', 17, 2.2)}</button>
          </form>
          <button class="tw-mic" id="twMic" aria-disabled="true" aria-label="Voice input isn't available in this prototype" title="Voice input isn't available in this prototype">${icon('micoff', 22)}</button>
        </div>
      </div>
    </section>
  </div></div>`;
}
function twRenderSource() {
  const L = T.L, scroll = $('#twSrcScroll'); if (!L || !scroll) return;
  let h = '';
  if (L.topic) h += `<p class="src-label" data-i18n="tw.instructions">${esc(t('tw.instructions'))}</p><div class="src-text">${esc(L.topic)}</div>`;
  if (L.sampleSource) h += `<p class="src-label">${esc(t('tw.sample'))}</p><pre class="src-text src-code">${esc(L.sampleSource)}</pre>`;
  if (L.sources.length) {
    h += `<p class="src-label">${esc(t('tw.files'))}</p><ul class="src-files">${L.sources.map(s => `<li><span class="sf-ico">${s.url ? `<img src="${s.url}" alt="">` : icon('file', 16)}</span><span class="sf-main"><b title="${esc(s.name)}">${esc(s.name)}</b><small class="${s.status === 'unsupported' || s.status === 'error' ? 'warn' : ''}">${fmtSize(s.size)} · ${esc(srcStatus(s))}</small></span></li>`).join('')}</ul>`;
    L.sources.filter(s => s.text).forEach(s => { h += `<p class="src-label">${esc(s.name)}</p><pre class="src-text src-code">${esc(s.text.slice(0, 4000))}${s.text.length > 4000 ? '\n…' : ''}</pre>`; });
  }
  scroll.innerHTML = h || `<p class="src-empty">No instructions yet.</p>`;
  $('#twUploadWrap').innerHTML = L.sources.length
    ? `<div class="tw-upload compact"><label class="tw-upload-btn">${icon('upload', 14)}<span data-i18n="tw.uploadMore">${esc(t('tw.uploadMore'))}</span><input type="file" class="vh" id="twFile" multiple accept="${SRC_ACCEPT}"></label></div>`
    : `<div class="tw-upload"><span class="up-box">${icon('upload', 22)}</span><b data-i18n="tw.noFile">${esc(t('tw.noFile'))}</b><p data-i18n="tw.uploadHint">${esc(t('tw.uploadHint'))}</p><label class="tw-upload-btn"><span data-i18n="tw.upload">${esc(t('tw.upload'))}</span><input type="file" class="vh" id="twFile" multiple accept="${SRC_ACCEPT}"></label></div>`;
  $('#twFile').onchange = e => { twAddFiles(e.target.files); e.target.value = ''; };
}
async function twAddFiles(list) {
  const L = T.L; if (!L || !list || !list.length) return;
  const room = 4 - L.sources.length;
  if (room <= 0) { toast(t('prep.fileCount')); return; }
  const added = [];
  [...list].slice(0, room).forEach(file => {
    const src = makeSource(file);
    if (src.kind === 'other') { toast(t('prep.fileType', { name: file.name })); return; }
    if (src.size > FILE_MAX_BYTES) { toast(t('prep.fileBig', { name: file.name })); return; }
    added.push(src);
  });
  if (!added.length) return;
  L.sources.push(...added); twRenderSource();
  $('#tw').classList.remove('src-closed');
  await Promise.all(added.map(readSource));
  if (T.L === L) twRenderSource();
  toast(t('tw.added', { n: added.length }));
}

function tutorTeardown() {
  if (T.chatAbort) { T.chatAbort.abort(); T.chatAbort = null; }
  clearTimeout(T.timer); clearTimeout(T.startTimer); clearInterval(T.capTimer);
  if (T.ro) T.ro.disconnect();
  Object.assign(T, { id: null, L: null, q: null, ro: null, timer: null, startTimer: null, capTimer: null, pen: false, chatBusy: false, qBusy: false });
  const v = $('#view-tutor'); if (v) v.innerHTML = '';
}
function tutorView(id) {
  const v = $('#view-tutor'), L = lessons[id];
  if (!L || L.status !== 'ready') { location.replace(`#/tutor/${id}/prep`); return; }
  v.hidden = false;
  if (T.id === id && $('#tw')) return;               // already mounted (e.g. language switch)
  tutorTeardown();
  Object.assign(T, { id, L, q: null, follow: true, playing: !(L.finished || L.ended), pen: false, strokes: L.strokes });
  T.captions = true;
  v.innerHTML = twShellHTML();
  twBind(); twRenderSource();
  if (window.matchMedia('(max-width: 860px)').matches) $('#tw').classList.add('src-closed');
  L.blocks.forEach((b, i) => { if (i < L.idx && b.t !== 'q') twRenderBlock(i, false); });
  twRenderQA(); twUpdatePlay(); twInkSize();
  if (L.finished || L.ended) { $('#twLoading').hidden = true; twFinish(true); }
  else if (L.idx > 0) { $('#twLoading').hidden = true; twCaption('Welcome back — picking up where you left off.'); twSchedule(700); }
  else T.startTimer = setTimeout(() => { $('#twLoading').hidden = true; twTick(); }, 1100);
}
function twBind() {
  const tw = $('#tw'), sc = $('#twScroll');
  $('#twSrcClose').onclick = () => { tw.classList.add('src-closed'); $('#twSrcOpen').focus(); };
  $('#twSrcOpen').onclick = () => tw.classList.remove('src-closed');
  // resizable materials panel
  const grip = $('#twGrip');
  const setW = w => tw.style.setProperty('--src-w', Math.max(240, Math.min(560, w)) + 'px');
  grip.onpointerdown = e => {
    grip.setPointerCapture(e.pointerId); const left = $('#twSrc').getBoundingClientRect().left;
    grip.onpointermove = ev => setW(ev.clientX - left);
    grip.onpointerup = () => { grip.onpointermove = null; grip.onpointerup = null; };
  };
  grip.onkeydown = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); setW($('#twSrc').offsetWidth + (e.key === 'ArrowRight' ? 16 : -16)); } };
  // speed
  const sb = $('#twSpeedBtn'), sm = $('#twSpeedMenu');
  sb.onclick = e => { e.stopPropagation(); sm.hidden = !sm.hidden; sb.setAttribute('aria-expanded', String(!sm.hidden)); if (!sm.hidden) sm.querySelector('[aria-selected="true"]').focus(); };
  sm.onclick = e => {
    const b = e.target.closest('[data-speed]'); if (!b) return;
    T.speed = +b.dataset.speed; $('#twSpeedVal').textContent = fmtSpeed(T.speed);
    $$('[data-speed]', sm).forEach(x => x.setAttribute('aria-selected', String(x === b)));
    sm.hidden = true; sb.setAttribute('aria-expanded', 'false'); sb.focus();
    if (T.playing && !T.q && T.timer) twSchedule(400);
    toast(`Lesson speed set to ${fmtSpeed(T.speed)}`);
  };
  $('#twDownload').onclick = () => exportLesson(T.L);
  $('#twEnd').onclick = twEndConfirm;
  // follow tutor
  const userScroll = () => { if (T.follow && T.L && !T.L.finished) { T.follow = false; $('#twFollow').hidden = false; } };
  sc.addEventListener('wheel', userScroll, { passive: true });
  sc.addEventListener('touchmove', userScroll, { passive: true });
  sc.addEventListener('keydown', e => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) userScroll(); });
  $('#twFollow').onclick = () => {
    T.follow = true; $('#twFollow').hidden = true;
    const all = $$('.wb-block', $('#twBoard')); const last = all.sort((a, b) => +b.dataset.b - +a.dataset.b)[0];
    if (last) twScrollTo(last);
  };
  // tutor controls
  $('#twCapBtn').onclick = () => { T.captions = !T.captions; tw.classList.toggle('no-cap', !T.captions); $('#twCapBtn').setAttribute('aria-pressed', String(T.captions)); };
  $('#twPlay').onclick = () => {
    if (T.L.finished || T.L.ended) return;
    T.playing = !T.playing; twUpdatePlay();
    if (T.playing) { if (!T.q) twSchedule(300); } else clearTimeout(T.timer);
  };
  $('#twVol').onclick = () => toast('Audio narration isn’t connected in this prototype — captions show what the tutor says.');
  $('#twMic').onclick = () => toast('Voice input isn’t connected in this prototype — type your question instead.');
  // pen / circle-to-explain
  $('#twPen').onclick = () => {
    T.pen = !T.pen; tw.classList.toggle('pen', T.pen);
    $('#twPen').classList.toggle('on', T.pen); $('#twPen').setAttribute('aria-pressed', String(T.pen));
    if (T.pen) toast('Pen on — circle something on the board to get it explained.');
  };
  $('#twInkClear').onclick = () => { T.strokes.length = 0; twInkDraw(); $('#twInkClear').hidden = true; };
  $('#twInkClear').hidden = !T.strokes.length;
  const cv = $('#twInk'); let cur = null;
  cv.onpointerdown = e => { if (!T.pen) return; e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = [[e.offsetX, e.offsetY]]; T.strokes.push(cur); };
  cv.onpointermove = e => { if (!cur) return; cur.push([e.offsetX, e.offsetY]); twInkDraw(); };
  cv.onpointerup = () => {
    if (!cur) return; const st = cur; cur = null;
    if (st.length < 4) { T.strokes.pop(); twInkDraw(); return; }
    $('#twInkClear').hidden = false; twExplainStroke(st);
  };
  // ask
  const inp = $('#twAskInput');
  inp.oninput = twSyncAsk;
  $('#twAsk').onsubmit = e => {
    e.preventDefault(); const q = inp.value.trim(); if (!q || T.chatBusy) return;
    inp.value = ''; twSyncAsk();
    const intent = questionIntent(q);
    if (intent) twFetchQuestion(intent);
    else twAsk(q);
  };
  $('#twQA').onclick = e => {
    const b = e.target.closest('[data-retry]');
    if (!b || T.chatBusy || !T.L) return;
    const item = T.L.qa[+b.dataset.retry];
    if (item) twAsk(item.q, item);
  };
  $('#twFile2').onchange = e => { twAddFiles(e.target.files); e.target.value = ''; };
  // keep the ink layer the size of the board
  T.ro = new ResizeObserver(twInkSize);
  [sc, $('#twBoard'), $('#twQA'), $('#twEndBox')].forEach(el => T.ro.observe(el));
}

function twUpdatePlay() {
  const b = $('#twPlay'); if (!b || !T.L) return;
  const over = !!(T.L.finished || T.L.ended);
  b.querySelector('svg').outerHTML = icon(T.playing && !over ? 'pause' : 'play', 18);
  b.setAttribute('aria-label', over ? 'Lesson finished' : T.playing ? 'Pause lesson' : 'Resume lesson');
  b.title = b.getAttribute('aria-label');
  b.classList.toggle('is-off', over); b.setAttribute('aria-disabled', String(over));
}
function twSchedule(ms) { clearTimeout(T.timer); T.timer = setTimeout(twTick, ms); }
const twDur = b => Math.min(9000, 1300 + (b.say || blockText(b)).length * 32) / T.speed;
function twTick() {
  const L = T.L; T.timer = null;
  if (!L || !T.playing || T.q != null || L.ended || L.finished) return;
  if (L.idx >= L.blocks.length) { twFinish(false); return; }
  const b = L.blocks[L.idx];
  if (b.t === 'q') { twShowQ(L.idx); return; }
  twRenderBlock(L.idx, true); L.idx++;
  twCaption(b.say || blockText(b));
  twSchedule(twDur(b));
}
function twRenderBlock(i, animate) {
  const b = T.L.blocks[i], col = b.side === 'R' ? $('#twColR') : $('#twColL');
  const el = document.createElement('div');
  el.className = 'wb-block' + (animate ? ' wb-in' : ''); el.dataset.b = i;
  if (animate) el.style.setProperty('--wbd', (Math.min(1.6, 0.5 + blockText(b).length / 220) / T.speed).toFixed(2) + 's');
  el.innerHTML = blockHTML(b); col.appendChild(el); paintRich(el, b);
  if (animate && T.follow) twScrollTo(el);
}
function twScrollTo(el) {
  const sc = $('#twScroll'); if (!sc || !el) return;
  const top = el.offsetTop, bottom = top + el.offsetHeight, vTop = sc.scrollTop, vBottom = vTop + sc.clientHeight - 150;
  if (bottom > vBottom) sc.scrollTo({ top: Math.max(0, Math.min(top - 70, bottom - sc.clientHeight + 170)), behavior: 'smooth' });
  else if (top < vTop + 60) sc.scrollTo({ top: Math.max(0, top - 70), behavior: 'smooth' });
}
function twCaption(text) {
  clearInterval(T.capTimer); const el = $('#twCap'); if (!el) return;
  el.title = text; let pos = 0;
  T.capTimer = setInterval(() => {
    if (!T.playing && T.q == null && !T.chatBusy) return;
    pos += 2; el.textContent = text.slice(0, pos);
    if (pos >= text.length) clearInterval(T.capTimer);
  }, 26 / T.speed);
}

/* questions and tutor chat */
function choiceIndex(b) {
  if (typeof b.answer === 'number' && b.answer >= 0) return b.answer;
  return (b.options || []).findIndex(o => normAnswer(o) === normAnswer(b.correctAnswer));
}
function questionIntent(q) {
  const s = String(q || '').toLowerCase();
  const ask = /\b(ask me|give me|another question|next question|harder question|quiz me)\b/.test(s)
    || (/မေးခွန်း/.test(q) && /ပိုခက်|ထပ်|အသစ်/.test(q));
  if (!ask) return null;
  return /hard|ပိုခက်/.test(s) || /ပိုခက်/.test(q) ? 'hard' : 'medium';
}
function twSyncAsk() {
  const inp = $('#twAskInput'); if (!inp) return;
  const on = !!inp.value.trim() && !T.chatBusy;
  const send = $('#twSend');
  if (send) { send.disabled = !on; send.classList.toggle('on', on); }
  inp.disabled = !!T.chatBusy;
}
function twShowQ(i, opts) {
  const L = T.L, b = L.blocks[i], card = $('#twQ');
  if (!card || !b) return;
  const extra = !!(opts && opts.extra);
  const qs = L.blocks.filter(x => x.t === 'q');
  const qn = Math.max(1, qs.indexOf(b) + 1);
  T.q = i; card.hidden = false; card.dataset.extra = extra ? '1' : '';
  const short = b.qtype === 'short-answer';
  const choices = short
    ? `<form id="twShortForm"><input class="tw-short" id="twShort" autocomplete="off" placeholder="${esc(t('tw.sa'))}" aria-label="${esc(t('tw.sa'))}"></form>`
    : `<div class="tw-opts">${(b.options || []).map((o, j) => `<button class="tw-opt" type="button" data-o="${j}">${inl(o)}</button>`).join('')}</div>`;
  card.innerHTML = `${b.difficulty ? `<span class="tw-diff">${esc(b.difficulty)}</span>` : ''}<p class="tw-qtext" id="twQText">${inl(b.question)}</p>${choices}
    <div class="tw-fb" id="twFb" hidden></div>
    <div class="tw-qfoot"><span class="tw-qcount">${esc(t('tw.qof', { n: qn, total: Math.max(qs.length, qn) }))}</span>
      <button class="tw-skip" type="button" id="twReveal">${esc(t('tw.reveal'))}</button>
      <button class="tw-skip" type="button" id="twSkip">${esc(t('tw.skip'))}</button>
      ${short ? `<button class="btn-primary" type="button" id="twGrade">${esc(t('tw.submit'))}</button>` : ''}
      <button class="btn-primary" type="button" id="twCont" hidden>${esc(t('tw.continue'))} ${icon('chevR', 16)}</button></div>`;
  twCaption(short ? t('tw.qcapShort') : t('tw.qcap'));
  if (!short) $$('.tw-opt', card).forEach(btn => btn.onclick = () => twAnswer(i, +btn.dataset.o));
  else {
    $('#twGrade').onclick = () => twGradeShort(i);
    $('#twShortForm').onsubmit = e => { e.preventDefault(); twGradeShort(i); };
    $('#twShort').focus({ preventScroll: true });
  }
  $('#twSkip').onclick = () => { if (L.answers[i] && L.answers[i].pending) return; L.answers[i] = { skipped: true }; twCloseQ(i, extra); };
  $('#twReveal').onclick = () => twReveal(i);
  $('#twCont').onclick = () => twCloseQ(i, extra);
  const first = card.querySelector('.tw-opt'); if (first) first.focus({ preventScroll: true });
}
function twAnswer(i, j) {
  const L = T.L, b = L.blocks[i]; if (!b || L.answers[i]) return;
  const correct = choiceIndex(b);
  const ok = correct >= 0 && j === correct; L.answers[i] = { choice: j, ok };
  $$('.tw-opt', $('#twQ')).forEach((btn, k) => {
    btn.disabled = true;
    btn.classList.toggle('correct', correct >= 0 && k === correct);
    btn.classList.toggle('wrong', k === j && !ok);
    btn.classList.toggle('dim', k !== correct && k !== j);
  });
  const fb = $('#twFb'); fb.hidden = false; fb.className = 'tw-fb ' + (ok ? 'ok' : 'no');
  fb.innerHTML = `<b>${esc(ok ? t('tw.correct') : t('tw.wrong'))}</b> ${inl(b.explain || '')}`;
  $('#twSkip').hidden = true; $('#twReveal').hidden = true;
  const c = $('#twCont'); c.hidden = false; c.focus({ preventScroll: true });
  twCaption((ok ? t('tw.correct') : t('tw.wrong')) + ' ' + plain(b.explain || ''));
}
function twReveal(i) {
  const L = T.L, b = L.blocks[i];
  if (!b || (L.answers[i] && !L.answers[i].pending)) return;
  L.answers[i] = { revealed: true, skipped: true };
  $$('.tw-opt', $('#twQ')).forEach(btn => { btn.disabled = true; });
  const short = $('#twShort'); if (short) short.disabled = true;
  const fb = $('#twFb'); fb.hidden = false; fb.className = 'tw-fb';
  fb.innerHTML = `<b>${esc(t('tw.expected'))}</b> ${inl(b.correctAnswer || '')}${b.explain ? `<div>${inl(b.explain)}</div>` : ''}`;
  $('#twSkip').hidden = true; $('#twReveal').hidden = true;
  const grade = $('#twGrade'); if (grade) grade.hidden = true;
  const c = $('#twCont'); c.hidden = false; c.focus({ preventScroll: true });
}
async function twGradeShort(i) {
  const L = T.L, b = L.blocks[i], input = $('#twShort');
  const value = input ? input.value.trim() : '';
  if (!b || !value || (L.answers[i] && (L.answers[i].pending || L.answers[i].text))) return;
  L.answers[i] = { pending: true, text: value };
  if (input) input.disabled = true;
  const grade = $('#twGrade'); if (grade) grade.disabled = true;
  const fb = $('#twFb'); fb.hidden = false; fb.className = 'tw-fb'; fb.textContent = t('tw.checking');
  try {
    const data = await postJson('/api/whiteboard/grade', {
      language: lessonLang(L),
      question: b.question,
      expectedAnswer: b.correctAnswer || '',
      explanation: b.explain || '',
      learnerAnswer: value
    });
    if (!T.L || T.q !== i) return;
    L.answers[i] = { text: value, ok: !!data.correct };
    fb.className = 'tw-fb ' + (data.correct ? 'ok' : 'no');
    fb.innerHTML = `<b>${esc(data.correct ? t('tw.correct') : t('tw.wrong'))}</b> ${inl(data.feedback || b.explain || '')}`;
    if (!data.correct && b.correctAnswer) fb.insertAdjacentHTML('beforeend', `<div><b>${esc(t('tw.expected'))}</b> ${inl(b.correctAnswer)}</div>`);
    $('#twReveal').hidden = true; $('#twSkip').hidden = true; if (grade) grade.hidden = true;
    const c = $('#twCont'); c.hidden = false; c.focus({ preventScroll: true });
    twCaption((data.correct ? t('tw.correct') : t('tw.wrong')) + ' ' + (data.feedback || ''));
  } catch (err) {
    if (T.L === L) delete L.answers[i];
    if (input) input.disabled = false;
    if (grade) grade.disabled = false;
    fb.className = 'tw-fb no';
    fb.innerHTML = `${esc(friendlyError(err))} <button type="button" class="qa-retry" id="twGradeRetry">${esc(t('retry'))}</button>`;
    const retry = $('#twGradeRetry'); if (retry) retry.onclick = () => twGradeShort(i);
  }
}
function twCloseQ(i, extra) {
  const card = $('#twQ'); if (card) card.hidden = true;
  T.q = null;
  const L = T.L; if (!L) return;
  if (extra) {
    if (L.finished || L.ended) twFinish(true);
    else if (T.playing) twSchedule(450);
    return;
  }
  L.idx = i + 1;
  if (T.playing) twSchedule(450);
}
async function streamChat(L, message, signal, onDelta) {
  const payload = {
    message,
    language: lessonLang(L),
    lesson: L.apiLesson ? compactLesson(L.apiLesson) : { title: lessonTitle(L), topic: L.topic || '', language: lessonLang(L) },
    history: L.qa.filter(x => x.a && !x.error && !x.pending).slice(-8).map(x => ({ q: clipText(x.q, 1500), a: clipText(x.a, 2000) })),
    progress: progressPayload(L)
  };
  const fresh = L.sources.filter(s => s.file && !s.sent);
  let res;
  try {
    if (fresh.length) {
      const fd = new FormData();
      fd.append('message', payload.message);
      fd.append('language', payload.language);
      fd.append('lesson', JSON.stringify(payload.lesson));
      fd.append('history', JSON.stringify(payload.history));
      fd.append('progress', JSON.stringify(payload.progress));
      fresh.forEach(s => fd.append('files', s.file, s.file.name));
      res = await fetch('/api/whiteboard/chat', { method: 'POST', body: fd, headers: { Accept: 'text/event-stream' }, signal });
    } else {
      res = await fetch('/api/whiteboard/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify(payload), signal });
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw Object.assign(new Error(''), { code: 'network' });
  }
  const type = res.headers.get('content-type') || '';
  if (!res.ok || type.includes('application/json')) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw apiErr(res, data);
  }
  await readSSE(res, ev => {
    if (ev.materials) applyMaterials(L, ev.materials);
    if (ev.error) throw Object.assign(new Error(ev.error), { code: ev.code || 'upstream' });
    if (ev.delta) onDelta(ev.delta);
  });
  fresh.forEach(s => { s.sent = true; });
}
async function twAsk(text, entry) {
  const L = T.L;
  if (!L || T.chatBusy) return;
  T.chatBusy = true; twSyncAsk();
  const item = entry || { q: text, a: '', error: '', pending: true };
  item.a = ''; item.error = ''; item.pending = true;
  if (!entry) L.qa.push(item);
  twRenderQA();
  const ac = new AbortController(); T.chatAbort = ac;
  try {
    await streamChat(L, text, ac.signal, delta => { item.a += delta; twPatchQA(item); if ($('#twCap')) twCaption(item.a); });
    if (!item.a.trim()) throw Object.assign(new Error(''), { code: 'invalid_response' });
    item.pending = false;
  } catch (err) {
    item.pending = false;
    if (err.name === 'AbortError') { if (!item.a) item.a = t('tw.stopped'); }
    else item.error = friendlyError(err);
  } finally {
    T.chatBusy = false;
    if (T.chatAbort === ac) T.chatAbort = null;
    twRenderQA(); twSyncAsk();
  }
}
function twPatchQA(item) {
  if (!T.L) return;
  const node = $$('.qa-item')[T.L.qa.indexOf(item)];
  const body = node && node.querySelector('.qa-body');
  if (body) body.textContent = item.a || t('tw.thinking');
  else twRenderQA();
}
async function twFetchQuestion(difficulty) {
  const L = T.L; if (!L || T.qBusy) return;
  if (T.q != null) { toast(t('tw.finishQ')); return; }
  clearTimeout(T.timer);
  T.qBusy = true; twCaption(t('tw.thinking'));
  try {
    const prog = progressPayload(L);
    const data = await postJson('/api/whiteboard/question', {
      language: lessonLang(L),
      lesson: L.apiLesson ? compactLesson(L.apiLesson) : { title: lessonTitle(L), topic: L.topic || '', language: lessonLang(L) },
      previousQuestions: L.blocks.filter(b => b.t === 'q').map(b => b.question).slice(-20),
      recentAnswers: prog.recentAnswers,
      section: prog.currentSection,
      difficulty: difficulty || 'medium'
    });
    if (!data.question) throw Object.assign(new Error(''), { code: 'invalid_response' });
    const i = L.blocks.length;
    L.blocks.push(questionToBlock(data.question));
    twShowQ(i, { extra: true });
  } catch (err) {
    toast(friendlyError(err));
    if (T.playing && T.q == null) twSchedule(450);
  } finally { T.qBusy = false; }
}
function twRenderQA() {
  const box = $('#twQA'); if (!box || !T.L) return;
  box.innerHTML = T.L.qa.map((x, i) => `<div class="qa-item${x.pending ? ' pending' : ''}"><p class="qa-q"><b>${esc(x.circled ? '✎' : t('tw.you'))}</b><span>${esc(x.q)}</span></p><p class="qa-a"><b>${esc(t('tw.tutor'))}</b><span class="qa-body">${esc(x.a || (x.pending ? t('tw.thinking') : ''))}</span></p>${x.error ? `<p class="qa-err">${esc(x.error)} <button type="button" class="qa-retry" data-retry="${i}">${esc(t('retry'))}</button></p>` : ''}</div>`).join('');
  const items = $$('.qa-item', box); if (items.length) twScrollTo(items[items.length - 1]);
}
function twInkSize() {
  const sc = $('#twScroll'), cv = $('#twInk'); if (!sc || !cv) return;
  const w = sc.scrollWidth, h = sc.scrollHeight, dpr = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; twInkDraw();
  }
}
function twInkDraw() {
  const cv = $('#twInk'); if (!cv) return;
  const ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.strokeStyle = '#e5484d'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  T.strokes.forEach(s => { ctx.beginPath(); s.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); });
}
function twExplainStroke(st) {
  const xs = st.map(p => p[0]), ys = st.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const cv = $('#twInk'), r = cv.getBoundingClientRect();
  cv.style.pointerEvents = 'none';
  const hit = document.elementFromPoint(r.left + cx, r.top + cy);
  cv.style.pointerEvents = '';
  const el = hit && hit.closest('[data-b]');
  if (!el) { twCaption(t('tw.miss')); return; }
  el.classList.remove('wb-flash'); void el.offsetWidth; el.classList.add('wb-flash');
  const b = T.L.blocks[+el.dataset.b];
  const label = blockText(b);
  const clipped = label.length > 500 ? label.slice(0, 500) : label;
  twAsk((state.lang === 'my' ? 'ဤအပိုင်းကို ပိုရိုးရှင်းစွာ ရှင်းပြပါ: ' : 'Explain this part more simply: ') + clipped);
}

/* finish, end, export */
function twStats(L) {
  const qs = L.blocks.filter(b => b.t === 'q').length, a = Object.values(L.answers);
  return { qs, answered: a.filter(x => !x.skipped).length, correct: a.filter(x => x.ok).length,
    shown: L.blocks.filter((b, i) => i < L.idx && b.t !== 'q').length, total: L.blocks.filter(b => b.t !== 'q').length };
}
function twFinish(restore) {
  const L = T.L; if (!L) return;
  if (!L.ended) L.finished = true;
  clearTimeout(T.timer); const q = $('#twQ'); if (q) q.hidden = true; T.q = null; const follow = $('#twFollow'); if (follow) follow.hidden = true;
  const s = twStats(L);
  const asked = L.qa.length ? ' ' + t('tw.asked', { n: L.qa.length }) : '';
  $('#twEndBox').innerHTML = `<div class="wb-done"><h3>${esc(L.ended ? t('tw.endedTitle') : t('tw.doneTitle'))}</h3>
    <p>${esc(t('tw.summary', { shown: s.shown, total: s.total, correct: s.correct, qs: s.qs }))}${esc(asked)}</p>
    <div class="wb-done-actions"><button class="btn-o" type="button" id="twAnother">${esc(t('tw.another'))}</button><button class="btn-o" type="button" id="twDoneDl">${icon('download', 15)} ${esc(t('tw.notes'))}</button><a class="btn-o" href="#/study">${icon('bookplus', 15)} ${esc(t('nav.study'))}</a><a class="btn-primary" href="#/home">${icon('home', 15)} ${esc(t('nav.home'))}</a></div></div>`;
  $('#twDoneDl').onclick = () => exportLesson(L);
  $('#twAnother').onclick = () => twFetchQuestion('medium');
  twUpdatePlay();
  if (!restore) { twCaption(t('tw.doneTitle')); twScrollTo($('#twEndBox')); }
}
function twEndConfirm() {
  const L = T.L, s = twStats(L);
  openModal(`<h2 id="mTitle">${esc(L.finished ? t('tw.leave') : t('tw.endAsk'))}</h2>
    <p class="sub">${esc(t('tw.summaryAsk', s))}</p>
    <div class="modal-actions"><button class="btn-ghost" data-close>${esc(t('tw.keep'))}</button><button class="btn-danger" id="twEndYes">${esc(t('tw.end'))}</button></div>`, box => {
    box.setAttribute('aria-labelledby', 'mTitle');
    box.querySelector('[data-close]').onclick = closeModal;
    $('#twEndYes').onclick = () => {
      if (T.chatAbort) { T.chatAbort.abort(); T.chatAbort = null; }
      if (!L.finished) L.ended = true;
      T.playing = false; clearTimeout(T.timer); clearInterval(T.capTimer);
      twFinish(true); twCaption(t('tw.endedTitle'));
      openModal(`<h2 id="mTitle">${esc(L.ended ? t('tw.endedTitle') : t('tw.doneTitle'))}</h2>
        <p class="sub">${esc(lessonTitle(L))}: ${esc(t('tw.summary', s))}</p>
        <div class="end-actions"><button class="btn-o" id="twEndDl">${icon('download', 15)} ${esc(t('tw.notes'))}</button><button class="btn-ghost" data-close>${esc(t('tw.review'))}</button><a class="btn-o" href="#/study">${esc(t('nav.study'))}</a><a class="btn-primary" href="#/home">${esc(t('nav.home'))}</a></div>`, b2 => {
        b2.setAttribute('aria-labelledby', 'mTitle');
        b2.querySelector('[data-close]').onclick = closeModal;
        $('#twEndDl').onclick = () => exportLesson(L);
        $$('a[href]', b2).forEach(a => a.addEventListener('click', () => { $('#modal').hidden = true; }));
      });
    };
  });
}
function mathHtml(src) {
  if (!window.katex) return '';
  try { return window.katex.renderToString(String(src || ''), { throwOnError: false, trust: false, displayMode: true }); }
  catch { return ''; }
}
async function diagramSvgFor(b, i) {
  const live = document.querySelector(`.wb-block[data-b="${i}"] .wb-diagram svg`);
  if (live) return live.outerHTML;
  const src = cleanMermaid(b.mermaid);
  if (!src) return '';
  try {
    const mermaid = await ensureMermaid();
    if (mermaid.parse) await mermaid.parse(src);
    const out = await mermaid.render('pdf' + Math.random().toString(36).slice(2, 9), src);
    const svg = safeSvg(out.svg);
    return svg ? svg.outerHTML : '';
  } catch { return ''; }
}
async function notesPayload(L) {
  const blocks = [];
  for (let i = 0; i < L.blocks.length; i++) {
    const b = L.blocks[i];
    if (b.t === 'ul') blocks.push({ t: 'ul', items: b.items || [] });
    else if (b.t === 'code') blocks.push({ t: 'code', lang: b.lang || '', text: b.text || '' });
    else if (b.t === 'math') blocks.push({ t: 'math', text: b.text || '', html: mathHtml(b.text) });
    else if (b.t === 'table') blocks.push({ t: 'table', headers: b.headers || [], rows: b.rows || [] });
    else if (b.t === 'diagram') blocks.push({ t: 'diagram', caption: b.caption || b.fallback || '', svg: await diagramSvgFor(b, i) });
    else if (b.t === 'q') blocks.push({ t: 'q', question: b.question || '', options: b.options || [], correctAnswer: b.correctAnswer || '' });
    else if (b.text) blocks.push({ t: b.t, text: b.text });
  }
  return { title: plain(lessonTitle(L)), language: lessonLang(L), blocks };
}
function pdfName(title) {
  const name = String(title || 'lesson').replace(/[\\/:*?"<>|\u0000]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  return (name || 'lesson') + '.pdf';
}
async function exportLesson(L) {
  if (!L || L.exporting) return;
  L.exporting = true;
  toast(t('tw.saving'));
  try {
    const res = await fetch('/api/whiteboard/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/pdf' },
      body: JSON.stringify(await notesPayload(L))
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw apiErr(res, data);
    }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfName(plain(lessonTitle(L)));
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(t('tw.saved'));
  } catch (err) {
    toast(friendlyError(err));
  } finally {
    L.exporting = false;
  }
}

/* ---------- plan modal (design demonstration) ---------- */
const PLANS = [
  { id: 'week', name: 'Weekly', price: '$2.00', per: '/ wk', note: 'Sample price', badge: 'Popular' },
  { id: 'month', name: 'Monthly', price: '$6.00', per: '/ mo', note: 'Sample price' },
  { id: 'year', name: 'Yearly', price: '$4.00', per: '/ mo', note: 'Billed yearly · sample price' }
];
function openPlans(limitReached) {
  let sel = 'week';
  const ok = icon('check', 16, 2.6), no = '<span class="pm-dash">—</span>';
  const rows = [['Whiteboard tutor lessons', '3 / day', 'Unlimited'], ['Flashcards & quizzes', 'Basic', ok], ['Exam predictor', no, ok], ['Upload PDFs & slides', no, ok], ['Download lesson notes', ok, ok]];
  openModal(`<div class="pm-left">
      <button class="pm-back" data-close aria-label="Close">${icon('back', 18)}</button>
      <h3>Study smarter with <em>Plus</em></h3>
      <svg class="pm-chart" viewBox="0 0 300 120" aria-hidden="true"><path d="M30 100H290M30 100V12" stroke="#d6dbe4"/><defs><linearGradient id="pmG" x1="0" x2="1"><stop offset="0" stop-color="#7aa7ff"/><stop offset="1" stop-color="#ff7a59"/></linearGradient></defs><path d="M40 92C90 90 120 84 160 70S240 36 272 20" fill="none" stroke="url(#pmG)" stroke-width="3" stroke-linecap="round"/><circle cx="80" cy="90" r="4.5" fill="#5b8bff"/><circle cx="160" cy="70" r="4.5" fill="#e06cd0"/><circle cx="272" cy="20" r="6" fill="#ff7a59"/><text x="272" y="11" text-anchor="middle" font-size="10" font-weight="700" fill="#ff5a3c">GOAL</text><text x="8" y="16" font-size="9" fill="#6b7280">Confidence</text><text x="250" y="114" font-size="9" fill="#6b7280">Practice</text></svg>
      <table class="pm-table"><thead><tr><th>Features</th><th>Free</th><th>Plus</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td class="pm-free">${r[1]}</td><td class="pm-plus">${r[2]}</td></tr>`).join('')}</tbody></table>
      <p class="pm-cap">Sample comparison for this design.</p>
    </div>
    <div class="pm-right">
      <span class="pm-tag">Prototype · sample plans</span>
      <h2 id="mTitle">${limitReached ? 'You’ve used this session’s free lessons' : 'Upgrade to Plus'}</h2>
      <p class="pm-sub">${limitReached ? 'A usage limit is enabled in this prototype’s settings.' : 'Pick a plan to preview the checkout step.'} No payment is processed here.</p>
      <div class="pm-plans" role="radiogroup" aria-label="Plans">${PLANS.map(p => `<label class="pm-plan${p.id === sel ? ' sel' : ''}"><input type="radio" name="pmPlan" value="${p.id}" ${p.id === sel ? 'checked' : ''}><span class="pm-pl"><span class="pm-name">${p.name}</span><span><b>${p.price}</b> <small>${p.per}</small></span><small class="pm-note">${p.note}</small></span>${p.badge ? `<span class="pm-badge">${p.badge}</span>` : ''}</label>`).join('')}</div>
      <button class="pm-cta" id="pmCta">Continue with Weekly</button>
      <ul class="pm-fine"><li>Plans and prices are sample data for this UI design.</li><li>Real pricing, renewal terms and payment would come from your billing provider.</li></ul>
    </div>`, box => {
    box.setAttribute('aria-labelledby', 'mTitle');
    $$('[data-close]', box).forEach(b => b.onclick = closeModal);
    $$('input[name=pmPlan]', box).forEach(r => r.onchange = () => {
      sel = r.value; $$('.pm-plan', box).forEach(l => l.classList.toggle('sel', l.querySelector('input').checked));
      $('#pmCta').textContent = `Continue with ${PLANS.find(p => p.id === sel).name}`;
    });
    $('#pmCta').onclick = () => toast('Checkout isn’t connected in this prototype — no payment was taken.');
  }, 'plan-modal');
}

/* ---------------- Global keys ---------------- */
document.addEventListener('click', e => {
  const m = $('#twSpeedMenu');
  if (m && !m.hidden && !e.target.closest('.tw-speed')) { m.hidden = true; $('#twSpeedBtn').setAttribute('aria-expanded', 'false'); }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const sm = $('#twSpeedMenu');
  if (sm && !sm.hidden) { sm.hidden = true; $('#twSpeedBtn').setAttribute('aria-expanded', 'false'); $('#twSpeedBtn').focus(); return; }
  if (!$('#modal').hidden) closeModal();
  else if ($('#historyDrawer').classList.contains('open')) openDrawer(false);
  else $('#app').classList.remove('sb-open');
});
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

/* ---------------- Boot ---------------- */
hydrate();
initSidebar();
initHome();
renderHistory();
window.addEventListener('hashchange', route);
updatePill();
route();
if (document.fonts) document.fonts.ready.then(updatePill);
})();
