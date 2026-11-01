import { createAuth } from "./auth.js";
import { createPreferences } from "./user-p.js";
import { loadQuestions, searchQuestions } from "./search.js";

const introScreen = document.getElementById("intro-screen");
const appShell = document.getElementById("app-shell");
const storyKicker = document.getElementById("story-kicker");
const storyTitle = document.getElementById("story-title");
const storyBody = document.getElementById("story-body");
const storyNext = document.getElementById("story-next");
const storyProgress = [...document.querySelectorAll(".progress-dot")];
const introIndex = document.querySelector(".intro-index");

const stories = [
  { kicker: "01 — THE FIRST STEP", title: "Every great idea begins with a question.", body: "Some questions look simple. Others ask you to think in a new way. Every one of them is an invitation to explore." },
  { kicker: "02 — A BETTER WAY TO PRACTISE", title: "Understanding grows one problem at a time.", body: "Attention brings mathematics questions into one place, so you can discover a topic, focus on what matters, and build understanding at your own pace." },
  { kicker: "03 — YOUR SPACE TO THINK", title: "Give your curiosity a place to go.", body: "From geometry to calculus, your next challenge is waiting to be found. Choose what interests you, search with purpose, and make each question count." }
];

let storyIndex = 0;
let typingToken = 0;
let preferences;
let auth;
let allQuestions = [];
let activeTopic = "all";
let isIndexReady = false;
let currentQuestion = null;

function sleep(milliseconds) { return new Promise(resolve => window.setTimeout(resolve, milliseconds)); }

async function typeInto(element, text, token, speed = 19) {
  element.textContent = "";
  const characters = Array.from(text);
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) { element.textContent = text; return token === typingToken; }
  for (const character of characters) {
    if (token !== typingToken) return false;
    element.textContent += character;
    await sleep(speed);
  }
  return token === typingToken;
}

async function renderStory(index) {
  storyIndex = index;
  const story = stories[index];
  const token = ++typingToken;
  storyNext.hidden = true;
  storyNext.disabled = true;
  storyNext.textContent = index === stories.length - 1 ? "Enter Tangxun Math  →" : "Continue  →";
  storyKicker.textContent = story.kicker;
  storyTitle.textContent = "";
  storyBody.textContent = "";
  storyProgress.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
  introIndex.innerHTML = `${String(index + 1).padStart(2, "0")} <span>/</span> 03`;
  if (!await typeInto(storyTitle, story.title, token, 26)) return;
  if (!await typeInto(storyBody, story.body, token, 16)) return;
  storyNext.hidden = false;
  storyNext.disabled = false;
}

function enterMainSite() {
  typingToken += 1;
  introScreen.hidden = true;
  appShell.hidden = false;
  window.scrollTo({ top: 0, behavior: "instant" });
}

document.getElementById("intro-skip").addEventListener("click", enterMainSite);
storyNext.addEventListener("click", () => storyIndex < stories.length - 1 ? renderStory(storyIndex + 1) : enterMainSite());

function renderAuthState(user) {
  const guestPanel = document.getElementById("sidebar-guest");
  const userPanel = document.getElementById("sidebar-user");
  guestPanel.hidden = Boolean(user);
  userPanel.hidden = !user;
  if (user) {
    document.getElementById("account-name").textContent = user.username;
    const membership = String(user.membership || "reg").toUpperCase();
    document.getElementById("account-role").textContent = user.role === "developer" ? "Developer · VIP access" : `${membership} account`;
  }
  renderAnswerPanel();
  renderSolutionPanel();
}

auth = createAuth({ onAuthChange: renderAuthState, onRegistered: () => preferences.open() });
preferences = createPreferences({ getCurrentUser: auth.getCurrentUser, updatePreferences: auth.updatePreferences, onSaved: () => {} });

document.getElementById("open-dashboard").addEventListener("click", () => {
  document.getElementById("dashboard-modal").hidden = false;
  document.body.classList.add("modal-open");
});
function closeDashboard() {
  document.getElementById("dashboard-modal").hidden = true;
  if (document.getElementById("question-modal").hidden && document.getElementById("auth-modal").hidden && document.getElementById("preferences-modal").hidden) {
    document.body.classList.remove("modal-open");
  }
}
document.getElementById("dashboard-close").addEventListener("click", closeDashboard);
document.getElementById("dashboard-done").addEventListener("click", closeDashboard);
document.getElementById("dashboard-modal").addEventListener("click", event => { if (event.target === event.currentTarget) closeDashboard(); });

// The provided logo is bundled locally; no manual upload is required.
const LOGO_STORAGE_KEY = "attention_logo_data_url_v3";
const logoFileInput = document.getElementById("logo-file-input");
const brandLogo = document.getElementById("brand-logo");
const logoFallback = document.getElementById("logo-fallback");
document.getElementById("logo-upload-trigger").addEventListener("click", () => logoFileInput.click());
function showLogo(dataUrl) { brandLogo.src = dataUrl; brandLogo.hidden = false; logoFallback.hidden = true; }
brandLogo.addEventListener("error", () => { brandLogo.hidden = true; logoFallback.hidden = false; });
brandLogo.addEventListener("load", () => { brandLogo.hidden = false; logoFallback.hidden = true; });
brandLogo.src = "assets/logo.png";
try {
  const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
  if (savedLogo && savedLogo.startsWith("data:image/")) showLogo(savedLogo);
} catch { /* The bundled logo remains available if storage cannot be read. */ }
logoFileInput.addEventListener("change", () => {
  const file = logoFileInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { window.alert("Please choose an image file."); logoFileInput.value = ""; return; }
  if (file.size > 2_000_000) { window.alert("Please choose a logo image smaller than 2 MB."); logoFileInput.value = ""; return; }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result || "");
    if (!dataUrl.startsWith("data:image/")) { window.alert("That image could not be read. Please try another file."); return; }
    try { localStorage.setItem(LOGO_STORAGE_KEY, dataUrl); showLogo(dataUrl); }
    catch { showLogo(dataUrl); window.alert("The logo is shown for this session, but could not be saved for next time."); }
  };
  reader.onerror = () => window.alert("That image could not be read. Please try another file.");
  reader.readAsDataURL(file);
  logoFileInput.value = "";
});

// Question index, topic filters, full-screen question workspace, and one-choice answers.
const questionGrid = document.getElementById("question-grid");
const emptyLibrary = document.getElementById("empty-library");
const emptyTitle = document.getElementById("empty-title");
const emptyDescription = document.getElementById("empty-description");
const libraryCount = document.getElementById("library-count");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchFeedback = document.getElementById("search-feedback");
const accessFilter = document.getElementById("access-filter");
const difficultyFilter = document.getElementById("difficulty-filter");
const topicFilters = document.getElementById("topic-filters");
const ATTEMPTS_KEY = "attention_question_attempts_v3";

function tierLabel(tier) {
  return ({ public: "Public", reg: "REG account", vip: "VIP" })[tier] || "Public";
}
function answerAccessRequirement(question) {
  if (question.difficulty <= 2) return "public";
  if (question.difficulty <= 5) return "reg";
  return "vip";
}
function explanationAccessRequirement(question) {
  if (question.difficulty <= 2) return "public";
  if (question.difficulty <= 4) return "reg";
  return "vip";
}
function membershipLevel(user) {
  if (!user) return "guest";
  if (user.role === "developer") return "vip";
  const membership = String(user.membership || "reg").toLowerCase();
  return membership === "vip" ? "vip" : "reg";
}
function hasMembershipAccess(required, user = auth.getCurrentUser()) {
  if (required === "public") return true;
  if (!user) return false;
  if (membershipLevel(user) === "vip") return true;
  return required === "reg";
}
function canSubmitAnswer(question) {
  return question.difficulty <= 2 || Boolean(auth.getCurrentUser());
}
function canViewAnswer(question) {
  return hasMembershipAccess(answerAccessRequirement(question));
}
function canViewExplanation(question) {
  return hasMembershipAccess(explanationAccessRequirement(question));
}
function attemptLimit(question) {
  if (question.difficulty === 7) return 1;
  if (question.difficulty >= 4) return 2;
  return Infinity;
}
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderQuestionCard(question) {
  const card = makeElement("button", "question-card");
  card.type = "button";
  card.dataset.questionId = question.id;
  card.setAttribute("aria-label", `${question.code}: ${question.title}. Difficulty ${question.difficulty} out of 7. Normal REG question.`);
  const head = makeElement("div", "question-card-head");
  const stars = makeElement("span", "question-stars");
  stars.setAttribute("aria-label", `Difficulty ${question.difficulty} out of 7`);
  stars.append(document.createTextNode("★".repeat(question.difficulty)), document.createTextNode("☆".repeat(7 - question.difficulty)));
  stars.append(makeElement("small", "", `${question.difficulty}/7`));
  head.append(stars, makeElement("span", "access-badge normal", "Normal · REG"));
  const code = makeElement("p", "question-card-code", question.code);
  const tags = makeElement("div", "question-card-tags");
  question.topics.slice(0, 4).forEach(topic => tags.append(makeElement("span", "question-card-tag", topic)));
  const title = makeElement("h3", "", question.title);
  const description = makeElement("p", "question-card-description", question.description);
  const footer = makeElement("div", "question-card-source");
  footer.append(makeElement("span", "", `Source: ${question.source}`), makeElement("span", "question-card-open", "Open question ↗"));
  card.append(head, code, tags, title, description, footer);
  card.addEventListener("click", () => openQuestion(question));
  return card;
}

function renderTopicFilters() {
  const topics = [...new Set(allQuestions.flatMap(question => question.topics))]
    .sort((a, b) => a.localeCompare(b));
  const buttons = [makeElement("button", "topic-chip is-active", "All topics")];
  buttons[0].type = "button";
  buttons[0].dataset.topic = "all";
  buttons[0].setAttribute("aria-pressed", "true");
  for (const topic of topics) {
    const button = makeElement("button", "topic-chip", topic);
    button.type = "button";
    button.dataset.topic = topic;
    button.setAttribute("aria-pressed", "false");
    buttons.push(button);
  }
  topicFilters.replaceChildren(...buttons);
}
function updateTopicButtonState() {
  topicFilters.querySelectorAll("button[data-topic]").forEach(button => {
    const active = button.dataset.topic === activeTopic;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
function refreshQuestionList() {
  if (!isIndexReady) return;
  const matches = searchQuestions(allQuestions, {
    query: searchInput.value,
    topic: activeTopic,
    difficulty: difficultyFilter.value,
    access: accessFilter.value
  });
  questionGrid.replaceChildren(...matches.map(renderQuestionCard));
  libraryCount.textContent = `${matches.length} ${matches.length === 1 ? "QUESTION" : "QUESTIONS"}`;
  emptyLibrary.hidden = matches.length !== 0;
  questionGrid.hidden = matches.length === 0;
  if (!matches.length) {
    const hasFilters = Boolean(searchInput.value.trim() || activeTopic !== "all" || difficultyFilter.value !== "all" || accessFilter.value !== "all");
    emptyTitle.textContent = hasFilters ? "No questions match these filters." : "No questions have been added yet.";
    emptyDescription.textContent = hasFilters ? "Try another topic or clear the filters." : "Add question records to the question folder.";
  }
}

function readAttemptRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}
function answerOwnerKey() {
  const user = auth.getCurrentUser();
  return user ? `user:${user.id}` : "guest";
}
function answerStorageKey(question = currentQuestion) {
  return `${answerOwnerKey()}:${question.id}`;
}
function getAttemptRecord(question = currentQuestion) {
  if (!question) return { count: 0, correct: false, selected: null };
  const record = readAttemptRecords()[answerStorageKey(question)];
  if (!record || typeof record !== "object") return { count: 0, correct: false, selected: null };
  return {
    count: Number.isInteger(record.count) && record.count >= 0 ? record.count : 0,
    correct: record.correct === true,
    selected: Number.isInteger(record.selected) && record.selected >= 0 && record.selected <= 4 ? record.selected : null,
    lastCorrect: record.lastCorrect === true
  };
}
function writeAttemptRecord(question, record) {
  const records = readAttemptRecords();
  records[answerStorageKey(question)] = record;
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(records));
}
function renderAnswerPanel() {
  if (!currentQuestion) return;
  const guestState = document.getElementById("answer-guest-state");
  const answerForm = document.getElementById("answer-form");
  const answerMessage = document.getElementById("answer-gate-message");
  const feedback = document.getElementById("answer-feedback");
  const status = document.getElementById("answer-attempt-status");
  const optionList = document.getElementById("answer-option-list");
  const allowed = canSubmitAnswer(currentQuestion);
  const user = auth.getCurrentUser();
  guestState.hidden = allowed;
  answerForm.hidden = true;
  optionList.replaceChildren();

  if (!allowed) {
    answerMessage.textContent = "Sign in or create a free account to answer questions rated 3 stars or higher.";
    document.getElementById("question-login-button").hidden = false;
    status.textContent = "Your selected answer and attempt history will be saved to this browser account.";
    return;
  }

  const record = getAttemptRecord(currentQuestion);
  const limit = attemptLimit(currentQuestion);
  const limited = Number.isFinite(limit);
  const exhausted = limited && (record.correct || record.count >= limit);
  guestState.hidden = true;
  status.textContent = currentQuestion.difficulty >= 6 && membershipLevel(user) !== "vip"
    ? "This level provides correctness feedback only. The reference answer and worked explanation are VIP content."
    : limited
      ? `Attempts used: ${record.count} / ${limit}. ${record.correct ? "Question completed." : `${Math.max(0, limit - record.count)} attempt(s) remaining.`}`
      : "No attempt limit for this question.";

  if (exhausted) {
    status.textContent = record.correct
      ? `Correct — well done. You used ${record.count} of ${limit} permitted attempt(s).`
      : `No attempts remaining (${record.count}/${limit}). You can still review any answer or explanation your membership unlocks.`;
    return;
  }

  currentQuestion.choices.forEach((choice, index) => {
    const label = makeElement("label", "answer-choice");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "selected-answer";
    radio.value = String(index);
    radio.id = `answer-choice-${index}`;
    const marker = makeElement("span", "answer-choice-letter", String.fromCharCode(65 + index));
    const content = makeElement("span", "answer-choice-value", choice);
    label.htmlFor = radio.id;
    label.append(radio, marker, content);
    optionList.append(label);
  });
  feedback.textContent = record.count > 0 && record.lastCorrect === false
    ? `Your previous selection was incorrect. ${limited ? `${limit - record.count} attempt(s) remain.` : "You may try again."}`
    : "Select exactly one option.";
  feedback.classList.remove("is-error");
  answerForm.hidden = false;
}
function renderSolutionPanel() {
  if (!currentQuestion) return;
  const locked = document.getElementById("solution-locked");
  const content = document.getElementById("solution-unlocked");
  const explanation = document.getElementById("solution-explanation");
  const detailLocked = document.getElementById("solution-detail-locked");
  const user = auth.getCurrentUser();
  const canAnswerKey = canViewAnswer(currentQuestion);
  const canExplain = canViewExplanation(currentQuestion);

  if (!canAnswerKey) {
    locked.hidden = false;
    content.hidden = true;
    if (!user) {
      locked.textContent = "Sign in with a free REG account to unlock the answer access assigned to this difficulty level.";
    } else {
      locked.textContent = "REG accounts can submit answers here and receive correctness feedback, but the reference answer and worked explanation are reserved for VIP members.";
    }
    return;
  }

  locked.hidden = true;
  content.hidden = false;
  const index = currentQuestion.correctIndex;
  document.getElementById("solution-correct-label").textContent = `Reference answer: ${String.fromCharCode(65 + index)} — ${currentQuestion.choices[index]}`;
  explanation.hidden = !canExplain;
  detailLocked.hidden = canExplain;
  if (canExplain) {
    explanation.textContent = currentQuestion.explanation;
  } else {
    detailLocked.textContent = "The answer option is available to REG accounts. The worked explanation is reserved for VIP members.";
  }
}

function renderRectangleDiagram() {
  const container = document.getElementById("question-diagram");
  container.hidden = false;
  container.innerHTML = `
    <svg class="rectangle-diagram-svg" viewBox="0 0 800 430" role="img" aria-label="Rectangle ABCD with P on BC, line AP, and perpendicular segment DQ meeting AP at Q">
      <rect x="100" y="55" width="600" height="300" class="diagram-rectangle" />
      <line x1="100" y1="55" x2="270" y2="355" class="diagram-main-line" />
      <line x1="700" y1="55" x2="246" y2="313" class="diagram-perpendicular" />
      <path d="M239 301 L251 294 L258 306" class="diagram-right-angle" />
      <circle cx="246" cy="313" r="5" class="diagram-point" />
      <circle cx="270" cy="355" r="5" class="diagram-point" />
      <text x="78" y="42" class="diagram-label">A</text><text x="78" y="383" class="diagram-label">B</text>
      <text x="710" y="383" class="diagram-label">C</text><text x="710" y="42" class="diagram-label">D</text>
      <text x="280" y="383" class="diagram-label">P</text><text x="217" y="306" class="diagram-label">Q</text>
      <text x="52" y="213" class="diagram-measure">AB = 3</text><text x="365" y="397" class="diagram-measure">BC = 6</text>
    </svg><p class="diagram-caption">Illustrative diagram (not drawn to scale).</p>`;
}

function openQuestion(question) {
  currentQuestion = question;
  document.getElementById("question-detail-code").textContent = question.code;
  document.getElementById("question-detail-title").textContent = question.title;
  document.getElementById("question-detail-description").textContent = question.description;
  document.getElementById("question-detail-source").textContent = question.source;
  document.getElementById("question-answer-tier").textContent = tierLabel(answerAccessRequirement(question));
  const meta = document.getElementById("detail-meta");
  meta.replaceChildren();
  meta.append(
    makeElement("span", "question-stars", `${"★".repeat(question.difficulty)}${"☆".repeat(7 - question.difficulty)} ${question.difficulty}/7`),
    makeElement("span", "access-badge normal", "Normal · REG")
  );
  const topics = document.getElementById("detail-topics");
  topics.replaceChildren(...question.topics.map(topic => makeElement("span", "detail-topic", topic)));
  const statement = document.getElementById("question-statement");
  statement.replaceChildren();
  question.prompt.split(/\n\s*\n/).filter(Boolean).forEach(paragraph => statement.append(makeElement("p", "", paragraph)));
  const diagram = document.getElementById("question-diagram");
  diagram.hidden = true;
  diagram.replaceChildren();
  if (question.diagram === "rectangle-moving-point") renderRectangleDiagram();
  document.getElementById("question-choices").hidden = true;
  document.getElementById("question-modal").hidden = false;
  document.body.classList.add("modal-open");
  renderAnswerPanel();
  renderSolutionPanel();
  const card = document.querySelector(".question-detail-card");
  card.scrollTop = 0;
  document.getElementById("question-close").focus();
}
function closeQuestion() {
  document.getElementById("question-modal").hidden = true;
  currentQuestion = null;
  if (document.getElementById("auth-modal").hidden && document.getElementById("preferences-modal").hidden) {
    document.body.classList.remove("modal-open");
  }
}

document.getElementById("question-close").addEventListener("click", closeQuestion);
document.getElementById("question-detail-done").addEventListener("click", closeQuestion);
document.getElementById("question-modal").addEventListener("click", event => { if (event.target === event.currentTarget) closeQuestion(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !document.getElementById("question-modal").hidden) closeQuestion(); });
document.getElementById("question-login-button").addEventListener("click", () => auth.open("login"));
document.querySelector(".question-content-section").addEventListener("contextmenu", event => event.preventDefault());

document.getElementById("answer-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!currentQuestion || !canSubmitAnswer(currentQuestion)) { renderAnswerPanel(); return; }
  const selected = document.querySelector('input[name="selected-answer"]:checked');
  const feedback = document.getElementById("answer-feedback");
  if (!selected) {
    feedback.textContent = "Please choose one of the five options before submitting.";
    feedback.classList.add("is-error");
    return;
  }
  const previous = getAttemptRecord(currentQuestion);
  const limit = attemptLimit(currentQuestion);
  if (Number.isFinite(limit) && (previous.correct || previous.count >= limit)) {
    renderAnswerPanel();
    return;
  }
  const selectedIndex = Number(selected.value);
  const isCorrect = selectedIndex === currentQuestion.correctIndex;
  const nextRecord = {
    count: previous.count + 1,
    selected: selectedIndex,
    correct: isCorrect,
    lastCorrect: isCorrect,
    updatedAt: new Date().toISOString()
  };
  try {
    writeAttemptRecord(currentQuestion, nextRecord);
    renderAnswerPanel();
    renderSolutionPanel();
    const status = document.getElementById("answer-attempt-status");
    const remaining = Number.isFinite(limit) ? Math.max(0, limit - nextRecord.count) : null;
    status.textContent = isCorrect
      ? `Correct — well done. ${Number.isFinite(limit) ? `You used ${nextRecord.count} of ${limit} permitted attempt(s).` : "You may continue practising."}`
      : `Not correct. ${Number.isFinite(limit) ? (remaining > 0 ? `${remaining} attempt(s) remaining.` : "No attempts remaining for this question.") : "You may try again."}`;
  } catch {
    feedback.textContent = "Your browser could not save this attempt. Check available site storage.";
    feedback.classList.add("is-error");
  }
});

topicFilters.addEventListener("click", event => {
  const chip = event.target.closest("button[data-topic]");
  if (!chip) return;
  activeTopic = chip.dataset.topic || "all";
  updateTopicButtonState();
  refreshQuestionList();
});
document.getElementById("clear-filters").addEventListener("click", () => {
  activeTopic = "all";
  searchInput.value = "";
  accessFilter.value = "all";
  difficultyFilter.value = "all";
  updateTopicButtonState();
  searchFeedback.textContent = "Filters cleared.";
  refreshQuestionList();
});
searchForm.addEventListener("submit", event => { event.preventDefault(); refreshQuestionList(); });
searchInput.addEventListener("input", refreshQuestionList);
accessFilter.addEventListener("change", refreshQuestionList);
difficultyFilter.addEventListener("change", refreshQuestionList);

async function initializeQuestionLibrary() {
  try {
    allQuestions = await loadQuestions();
    isIndexReady = true;
    renderTopicFilters();
    refreshQuestionList();
  } catch (error) {
    libraryCount.textContent = "LIBRARY ERROR";
    emptyLibrary.hidden = false;
    questionGrid.hidden = true;
    emptyTitle.textContent = "The question library could not be loaded.";
    emptyDescription.textContent = "Check question/questions.json and start the website through localhost or HTTPS.";
    searchFeedback.textContent = error.message || "Question library unavailable.";
  }
}

renderStory(0);
initializeQuestionLibrary();
