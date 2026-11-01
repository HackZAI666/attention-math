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
let appReady = false;
let answerRevealed = false;
let explanationRevealed = false;

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
  if (user && appReady) claimGuestPumpkinTrophy(user);
  if (appReady) {
    renderPumpkinTrophyState();
    renderDashboardPanel();
  }
}

auth = createAuth({ onAuthChange: renderAuthState, onRegistered: () => preferences.open() });
preferences = createPreferences({ getCurrentUser: auth.getCurrentUser, updatePreferences: auth.updatePreferences, onSaved: () => {} });

document.getElementById("open-dashboard").addEventListener("click", () => openDashboard("problems"));
function openDashboard(view = "problems") {
  if (!auth.getCurrentUser()) { auth.open("login"); return; }
  document.getElementById("dashboard-modal").hidden = false;
  document.body.classList.add("modal-open");
  setDashboardView(view);
  renderDashboardPanel();
  renderPumpkinTrophyState();
}
function closeDashboard() {
  document.getElementById("dashboard-modal").hidden = true;
  if (document.getElementById("question-modal").hidden && document.getElementById("auth-modal").hidden && document.getElementById("preferences-modal").hidden && document.getElementById("pumpkin-modal").hidden) {
    document.body.classList.remove("modal-open");
  }
}
document.getElementById("dashboard-close").addEventListener("click", closeDashboard);
document.getElementById("dashboard-done").addEventListener("click", closeDashboard);
document.querySelectorAll("[data-dashboard-view]").forEach(button => button.addEventListener("click", () => setDashboardView(button.dataset.dashboardView)));
document.querySelectorAll("[data-equip-title]").forEach(button => button.addEventListener("click", () => equipPlayerTitle(button.dataset.equipTitle)));
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
const moreTopicsToggle = document.getElementById("more-topics-toggle");
let topicFiltersExpanded = false;
const ATTEMPTS_KEY = "attention_question_attempts_v3";
const PUMPKIN_TROPHY_KEY = "attention_pumpkin_trophy_v1";
const EQUIPPED_TITLE_KEY = "attention_equipped_title_v1";
const RANK_STARS_KEY = "attention_rank_stars_v1";

const PLAYER_TITLES = Object.freeze({
  halloween: { label: "HALLOWEEN", image: "assets/title_halloween.png", description: "Unlocked by earning the Pumpkin Learner trophy." },
  expert: { label: "高手", image: "assets/title_expert.png", description: "Unlocked at 30 ranked stars. Ranked play is not open yet." },
  "strongest-brain": { label: "最强大脑", image: "assets/title_strongest_brain.png", description: "50 ranked stars · Under development and not obtainable yet." }
});

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


// ---------- Dashboard activity and Halloween trophy ----------
function readTrophyRecords() {
  try {
    const value = JSON.parse(localStorage.getItem(PUMPKIN_TROPHY_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
function writeTrophyRecords(records) {
  localStorage.setItem(PUMPKIN_TROPHY_KEY, JSON.stringify(records));
}
function trophyOwnerKey(user = auth.getCurrentUser()) {
  return user ? `user:${user.id}` : "guest";
}
function hasPumpkinTrophy(user = auth.getCurrentUser()) {
  return readTrophyRecords()[trophyOwnerKey(user)]?.earned === true;
}
function claimGuestPumpkinTrophy(user) {
  if (!user) return;
  const records = readTrophyRecords();
  const guestAward = records.guest;
  const accountKey = `user:${user.id}`;
  if (guestAward?.earned === true && records[accountKey]?.earned !== true) {
    records[accountKey] = { ...guestAward, claimedFromGuest: true, claimedAt: new Date().toISOString() };
    writeTrophyRecords(records);
  }
}
function awardPumpkinTrophy() {
  const records = readTrophyRecords();
  const key = trophyOwnerKey();
  records[key] = { earned: true, trophyId: "pumpkin-learner", earnedAt: new Date().toISOString() };
  writeTrophyRecords(records);
  renderPumpkinTrophyState();
  renderDashboardPanel();
}
function setTrophyImageState(imageId, fallbackId) {
  const image = document.getElementById(imageId);
  const fallback = document.getElementById(fallbackId);
  if (!image || !fallback) return;
  if (image.dataset.fallbackBound !== "true") {
    image.addEventListener("load", () => { image.hidden = false; fallback.hidden = true; });
    image.addEventListener("error", () => { image.hidden = true; fallback.hidden = false; });
    image.dataset.fallbackBound = "true";
  }
  if (image.complete && image.naturalWidth > 0) { image.hidden = false; fallback.hidden = true; }
  else { image.hidden = true; fallback.hidden = false; }
}
function readEquippedTitles() {
  try {
    const value = JSON.parse(localStorage.getItem(EQUIPPED_TITLE_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
function writeEquippedTitles(value) {
  localStorage.setItem(EQUIPPED_TITLE_KEY, JSON.stringify(value));
}
function currentUserStorageKey(user = auth.getCurrentUser()) {
  return user ? `user:${user.id}` : "guest";
}
function getRankStars(user = auth.getCurrentUser()) {
  if (!user) return 0;
  try {
    const value = JSON.parse(localStorage.getItem(RANK_STARS_KEY) || "{}");
    const stars = value?.[currentUserStorageKey(user)];
    return Number.isFinite(stars) && stars >= 0 ? Math.floor(stars) : 0;
  } catch { return 0; }
}
function isTitleUnlocked(titleId, user = auth.getCurrentUser()) {
  if (!user) return false;
  if (titleId === "halloween") return hasPumpkinTrophy(user);
  if (titleId === "expert") return getRankStars(user) >= 30;
  // Strongest Brain is intentionally unavailable while this rank is under development.
  return false;
}
function getEquippedTitleId(user = auth.getCurrentUser()) {
  if (!user) return null;
  const titleId = readEquippedTitles()[currentUserStorageKey(user)];
  return titleId && PLAYER_TITLES[titleId] && isTitleUnlocked(titleId, user) ? titleId : null;
}
function bindTitleImage(imageId, fallbackId, src, fallbackText) {
  const image = document.getElementById(imageId);
  const fallback = document.getElementById(fallbackId);
  if (!image || !fallback) return;
  fallback.textContent = fallbackText;
  if (image.dataset.fallbackBound !== "true") {
    image.addEventListener("load", () => { image.hidden = false; fallback.hidden = true; });
    image.addEventListener("error", () => { image.hidden = true; fallback.hidden = false; });
    image.dataset.fallbackBound = "true";
  }
  if (image.getAttribute("src") !== src) image.setAttribute("src", src);
  if (image.complete && image.naturalWidth > 0) { image.hidden = false; fallback.hidden = true; }
  else { image.hidden = true; fallback.hidden = false; }
}
function renderEquippedTitleBadge() {
  const wrapper = document.getElementById("sidebar-equipped-title");
  const user = auth.getCurrentUser();
  const titleId = getEquippedTitleId(user);
  if (!wrapper || !user || !titleId) {
    if (wrapper) wrapper.hidden = true;
    return;
  }
  const title = PLAYER_TITLES[titleId];
  wrapper.hidden = false;
  bindTitleImage("sidebar-equipped-title-image", "sidebar-equipped-title-fallback", title.image, title.label);
}
function renderTitlesPanel() {
  const user = auth.getCurrentUser();
  const equippedId = getEquippedTitleId(user);
  for (const [titleId, title] of Object.entries(PLAYER_TITLES)) {
    const card = document.getElementById(`title-card-${titleId}`);
    if (!card) continue;
    const unlocked = isTitleUnlocked(titleId, user);
    const equipped = unlocked && equippedId === titleId;
    card.classList.toggle("is-locked", !unlocked);
    card.classList.toggle("is-equipped", equipped);
    const description = document.getElementById(`title-description-${titleId}`);
    const status = document.getElementById(`title-status-${titleId}`);
    const lock = document.getElementById(`title-lock-${titleId}`);
    const button = document.getElementById(`title-equip-${titleId}`);
    if (description) description.textContent = title.description;
    if (status) status.textContent = titleId === "strongest-brain" ? "IN DEVELOPMENT" : equipped ? "EQUIPPED" : unlocked ? "UNLOCKED" : "LOCKED";
    if (lock) lock.hidden = unlocked;
    if (button) {
      button.disabled = !unlocked || equipped;
      button.textContent = equipped ? "Equipped" : unlocked ? "Equip title" : "Locked";
    }
    bindTitleImage(`title-image-${titleId}`, `title-fallback-${titleId}`, title.image, title.label);
  }
  renderEquippedTitleBadge();
}
function equipPlayerTitle(titleId) {
  const user = auth.getCurrentUser();
  if (!user || !PLAYER_TITLES[titleId] || !isTitleUnlocked(titleId, user)) return;
  const equipped = readEquippedTitles();
  equipped[currentUserStorageKey(user)] = titleId;
  try {
    writeEquippedTitles(equipped);
    renderTitlesPanel();
  } catch {
    window.alert("Your browser could not save the equipped title. Check available site storage.");
  }
}

function renderPumpkinTrophyState() {
  const earned = hasPumpkinTrophy();
  const card = document.getElementById("pumpkin-trophy-card");
  if (card) card.classList.toggle("is-earned", earned);
  const honorsStatus = document.getElementById("honors-pumpkin-status");
  if (honorsStatus) honorsStatus.textContent = earned ? "UNLOCKED" : "LOCKED";
  const honorsDescription = document.getElementById("honors-pumpkin-description");
  if (honorsDescription) honorsDescription.textContent = earned
    ? "Awarded for solving the four-star Halloween number theory challenge."
    : "Solve the hidden Halloween challenge to unlock this commemorative trophy.";
  const count = document.getElementById("trophy-count");
  if (count) count.textContent = earned ? "1 UNLOCKED" : "0 UNLOCKED";
  [
    ["honors-pumpkin-trophy", "honors-pumpkin-trophy-fallback"],
    ["challenge-pumpkin-trophy", "challenge-pumpkin-trophy-fallback"]
  ].forEach(([imageId, fallbackId]) => setTrophyImageState(imageId, fallbackId));
  setTrophyImageState("strongest-brain-rank-image", "strongest-brain-rank-fallback");
  const awardPanel = document.getElementById("pumpkin-challenge-award");
  if (awardPanel) awardPanel.hidden = !earned;
  renderTitlesPanel();
}
function setDashboardView(view) {
  const selected = ["problems", "honors", "titles", "ranks"].includes(view) ? view : "problems";
  document.getElementById("dashboard-view-problems").hidden = selected !== "problems";
  document.getElementById("dashboard-view-honors").hidden = selected !== "honors";
  document.getElementById("dashboard-view-titles").hidden = selected !== "titles";
  document.getElementById("dashboard-view-ranks").hidden = selected !== "ranks";
  document.getElementById("dashboard-heading").textContent = ({ problems: "My Problems", honors: "Honors", titles: "Titles", ranks: "Rank Rules" })[selected];
  if (selected === "titles") renderTitlesPanel();
  document.querySelectorAll("[data-dashboard-view]").forEach(button => {
    const active = button.dataset.dashboardView === selected;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  setTrophyImageState("strongest-brain-rank-image", "strongest-brain-rank-fallback");
}
function renderDashboardPanel() {
  const list = document.getElementById("dashboard-problems-list");
  const empty = document.getElementById("dashboard-problems-empty");
  if (!list || !empty || !auth.getCurrentUser()) return;
  const user = auth.getCurrentUser();
  const prefix = `user:${user.id}:`;
  const records = readAttemptRecords();
  const attempted = Object.entries(records)
    .filter(([key, record]) => key.startsWith(prefix) && record && Number.isInteger(record.count) && record.count > 0)
    .map(([key, record]) => ({ question: allQuestions.find(item => item.id === key.slice(prefix.length)), record }))
    .filter(item => item.question)
    .sort((a, b) => String(b.record.updatedAt || "").localeCompare(String(a.record.updatedAt || "")));
  list.replaceChildren();
  attempted.forEach(({ question, record }) => {
    const row = makeElement("article", "dashboard-problem-row");
    const info = makeElement("div", "dashboard-problem-info");
    info.append(makeElement("span", "dashboard-problem-code", question.code), makeElement("strong", "", question.title), makeElement("small", "", `${question.difficulty}/7 stars · ${question.source}`));
    const result = makeElement("span", `dashboard-result ${record.correct ? "is-correct" : "is-incorrect"}`, record.correct ? "Correct" : "Attempted");
    const attempts = makeElement("small", "dashboard-problem-attempts", `${record.count} attempt${record.count === 1 ? "" : "s"}`);
    row.append(info, result, attempts);
    row.addEventListener("click", () => { closeDashboard(); openQuestion(question); });
    list.append(row);
  });
  empty.hidden = attempted.length > 0;
  list.hidden = attempted.length === 0;
  renderPumpkinTrophyState();
}

// ---------- Clickable Halloween pumpkin challenge ----------
const PUMPKIN_CHALLENGE_ANSWER = 144;
function openPumpkinChallenge() {
  const modal = document.getElementById("pumpkin-modal");
  const feedback = document.getElementById("pumpkin-challenge-feedback");
  const input = document.getElementById("pumpkin-numeric-answer");
  const earned = hasPumpkinTrophy();
  feedback.textContent = earned
    ? "You have already earned the Pumpkin Learner trophy. Thank you for taking the challenge!"
    : "Solve it correctly to earn the Pumpkin Learner trophy. You may reveal one small hint below.";
  input.value = "";
  const hint = document.querySelector(".challenge-hint-details");
  if (hint) hint.open = false;
  document.getElementById("pumpkin-answer-form").hidden = earned;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  renderPumpkinTrophyState();
  if (!earned) input.focus();
}
function closePumpkinChallenge() {
  document.getElementById("pumpkin-modal").hidden = true;
  if (document.getElementById("dashboard-modal").hidden && document.getElementById("question-modal").hidden && document.getElementById("auth-modal").hidden && document.getElementById("preferences-modal").hidden) {
    document.body.classList.remove("modal-open");
  }
}
document.getElementById("pumpkin-challenge-button").addEventListener("click", openPumpkinChallenge);
document.getElementById("pumpkin-challenge-close").addEventListener("click", closePumpkinChallenge);
document.getElementById("pumpkin-modal").addEventListener("click", event => { if (event.target === event.currentTarget) closePumpkinChallenge(); });
document.getElementById("pumpkin-answer-form").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.getElementById("pumpkin-numeric-answer");
  const feedback = document.getElementById("pumpkin-challenge-feedback");
  const answer = String(input.value || "").trim();
  if (!/^\d{1,4}$/.test(answer)) {
    feedback.textContent = "Enter a whole number containing one to four digits.";
    feedback.classList.add("is-error");
    return;
  }
  feedback.classList.remove("is-error");
  if (Number(answer) === PUMPKIN_CHALLENGE_ANSWER) {
    awardPumpkinTrophy();
    feedback.textContent = "Correct! Your Pumpkin Learner trophy has been awarded and added to Honors.";
    document.getElementById("pumpkin-answer-form").hidden = true;
    document.getElementById("pumpkin-challenge-award").hidden = false;
  } else {
    feedback.textContent = "Not quite — try thinking about the prime factorization and the divisor-count formula.";
  }
});
document.getElementById("pumpkin-view-honors").addEventListener("click", () => {
  closePumpkinChallenge();
  if (auth.getCurrentUser()) openDashboard("honors");
  else auth.open("login");
});
document.getElementById("more-topics-toggle").addEventListener("click", () => {
  topicFiltersExpanded = !topicFiltersExpanded;
  updateMoreTopicsButton();
});

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
  const topics = [...new Set(allQuestions.flatMap(question => question.topics))];
  const priority = ["Algebra", "Geometry", "Calculus", "Functions", "Trigonometry", "Probability"];
  const coreTopics = priority.filter(topic => topics.includes(topic));
  const remainingTopics = topics.filter(topic => !coreTopics.includes(topic)).sort((a, b) => a.localeCompare(b));
  const orderedTopics = [...coreTopics, ...remainingTopics];
  const buttons = [makeElement("button", "topic-chip is-active", "All topics")];
  buttons[0].type = "button";
  buttons[0].dataset.topic = "all";
  buttons[0].setAttribute("aria-pressed", "true");
  orderedTopics.forEach((topic, index) => {
    const button = makeElement("button", `topic-chip${index >= coreTopics.length ? " is-extra-topic" : ""}`, topic);
    button.type = "button";
    button.dataset.topic = topic;
    button.setAttribute("aria-pressed", "false");
    if (index >= coreTopics.length && !topicFiltersExpanded && topic !== activeTopic) button.hidden = true;
    buttons.push(button);
  });
  topicFilters.replaceChildren(...buttons);
  moreTopicsToggle.hidden = remainingTopics.length === 0;
  updateMoreTopicsButton();
}
function updateMoreTopicsButton() {
  moreTopicsToggle.setAttribute("aria-expanded", String(topicFiltersExpanded));
  moreTopicsToggle.innerHTML = topicFiltersExpanded ? 'Fewer topics <span aria-hidden="true">⌃</span>' : 'More topics <span aria-hidden="true">⌄</span>';
  topicFilters.querySelectorAll(".is-extra-topic").forEach(button => {
    button.hidden = !topicFiltersExpanded && button.dataset.topic !== activeTopic;
  });
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
    answerText: Array.isArray(record.answerText) ? record.answerText.map(value => String(value ?? "")) : null,
    lastCorrect: typeof record.lastCorrect === "boolean" ? record.lastCorrect : record.correct === true
  };
}
function writeAttemptRecord(question, record) {
  const records = readAttemptRecords();
  records[answerStorageKey(question)] = record;
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(records));
}
function normalizeShortAnswer(value) {
  return String(value ?? "").normalize("NFKC").toLowerCase()
    .replace(/π/g, "pi").replace(/[−–]/g, "-").replace(/\s+/g, "")
    .replace(/×/g, "*").replace(/\*/g, "");
}
function checkShortAnswer(question, values) {
  return Array.isArray(question.answerFields) && values.length === question.answerFields.length &&
    question.answerFields.every((field, index) => field.accepted.some(answer => normalizeShortAnswer(answer) === normalizeShortAnswer(values[index])));
}
function formatShortAnswerKey(question) {
  return question.answerFields.map(field => `${field.label}: ${field.display}`).join(" · ");
}

function renderAnswerPanel() {
  if (!currentQuestion) return;
  const guestState = document.getElementById("answer-guest-state");
  const answerForm = document.getElementById("answer-form");
  const answerMessage = document.getElementById("answer-gate-message");
  const feedback = document.getElementById("answer-feedback");
  const status = document.getElementById("answer-attempt-status");
  const optionList = document.getElementById("answer-option-list");
  const choiceFieldset = document.getElementById("answer-choices-fieldset");
  const shortFields = document.getElementById("answer-short-fields");
  const submitButton = document.getElementById("submit-answer-button");
  const isShort = currentQuestion.answerMode === "short";
  const allowed = canSubmitAnswer(currentQuestion);
  const user = auth.getCurrentUser();
  guestState.hidden = allowed;
  answerForm.hidden = true;
  optionList.replaceChildren();
  shortFields.replaceChildren();
  choiceFieldset.hidden = isShort;
  shortFields.hidden = !isShort;
  feedback.classList.remove("is-error");

  if (!allowed) {
    answerMessage.textContent = "Sign in with a free REG account to answer questions rated 3 stars or higher.";
    document.getElementById("question-login-button").hidden = false;
    status.textContent = "All question statements remain open to visitors. Sign in to submit an answer at this difficulty.";
    submitButton.hidden = false;
    return;
  }

  const record = getAttemptRecord(currentQuestion);
  const limit = attemptLimit(currentQuestion);
  const limited = Number.isFinite(limit);
  const exhausted = limited && (record.correct || record.count >= limit);
  const submitted = record.count > 0;
  const canRevealKey = canViewAnswer(currentQuestion);
  guestState.hidden = true;
  status.textContent = currentQuestion.difficulty >= 6 && membershipLevel(user) !== "vip"
    ? "This level gives REG accounts correctness feedback only. The answer and worked explanation are VIP content."
    : limited
      ? `Attempts used: ${record.count} / ${limit}. ${record.correct ? "Question completed." : `${Math.max(0, limit - record.count)} attempt(s) remaining.`}`
      : "No attempt limit for this question.";

  submitButton.hidden = exhausted;
  submitButton.disabled = exhausted;

  if (isShort) {
    currentQuestion.answerFields.forEach((field, index) => {
      const wrapper = makeElement("label", "short-answer-field");
      wrapper.append(makeElement("span", "short-answer-label", field.label));
      const input = document.createElement("input");
      input.type = "text";
      input.name = `short-answer-${index}`;
      input.dataset.fieldIndex = String(index);
      input.autocomplete = "off";
      input.spellcheck = false;
      input.placeholder = field.placeholder || "Enter your answer";
      input.required = !exhausted;
      input.disabled = exhausted;
      if (record.answerText && record.answerText[index] !== undefined) input.value = record.answerText[index];
      if (submitted) wrapper.classList.add(record.lastCorrect ? "is-correct" : "is-incorrect");
      wrapper.append(input);
      shortFields.append(wrapper);
    });
    feedback.textContent = submitted
      ? (record.lastCorrect
          ? "Correct — your response is right."
          : canRevealKey
            ? "Not correct — your response is marked red. Reveal the reference answer when ready."
            : "Not correct — your response is marked red. Your membership provides correctness feedback only.")
      : "Enter your response in every field.";
    answerForm.hidden = false;
    return;
  }

  currentQuestion.choices.forEach((choice, index) => {
    const label = makeElement("label", "answer-choice");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "selected-answer";
    radio.value = String(index);
    radio.id = `answer-choice-${index}`;
    radio.disabled = exhausted;
    const marker = makeElement("span", "answer-choice-letter", String.fromCharCode(65 + index));
    const content = makeElement("span", "answer-choice-value", choice);
    label.htmlFor = radio.id;
    if (submitted && record.selected === index) {
      radio.checked = true;
      label.classList.add(record.lastCorrect ? "is-correct" : "is-incorrect");
    }
    if (answerRevealed && canRevealKey && index === currentQuestion.correctIndex) {
      label.classList.add("is-correct-answer");
    }
    label.append(radio, marker, content);
    optionList.append(label);
  });

  feedback.textContent = submitted
    ? (record.lastCorrect
        ? "Correct — your selected option is marked green."
        : canRevealKey
          ? "Not correct — your selected option is marked red. Reveal the answer to see the correct option."
          : "Not correct — your selected option is marked red. The correct option is not available at this access level.")
    : "Select exactly one option.";
  answerForm.hidden = false;
}

function renderSolutionPanel() {
  if (!currentQuestion) return;
  const locked = document.getElementById("solution-locked");
  const content = document.getElementById("solution-unlocked");
  const answerBlock = document.getElementById("solution-answer-wrap");
  const explanationBlock = document.getElementById("solution-explanation-wrap");
  const explanation = document.getElementById("solution-explanation");
  const detailLocked = document.getElementById("solution-detail-locked");
  const answerButton = document.getElementById("reveal-answer-button");
  const explanationButton = document.getElementById("reveal-explanation-button");
  const canAnswerKey = canViewAnswer(currentQuestion);
  const canExplain = canViewExplanation(currentQuestion);
  const user = auth.getCurrentUser();

  answerButton.hidden = !canAnswerKey;
  explanationButton.hidden = !canExplain;
  answerButton.textContent = answerRevealed ? "Hide answer" : "Show answer";
  explanationButton.textContent = explanationRevealed ? "Hide explanation" : "Show explanation";
  answerButton.setAttribute("aria-expanded", String(answerRevealed && canAnswerKey));
  explanationButton.setAttribute("aria-expanded", String(explanationRevealed && canExplain));

  if (!canAnswerKey && !canExplain) {
    locked.hidden = false;
    if (!user) {
      locked.textContent = "Sign in with a free REG account to answer questions rated 3 stars or higher. The answer and explanation will follow the access rules for this difficulty.";
    } else {
      locked.textContent = "Your submission is graded for correctness only at this level. The reference answer and worked explanation are reserved for VIP members.";
    }
  } else if (canAnswerKey && !canExplain) {
    locked.hidden = false;
    locked.textContent = "REG accounts may reveal the reference answer at this level. The worked explanation is reserved for VIP members.";
  } else {
    locked.hidden = true;
    locked.textContent = "";
  }

  content.hidden = !((answerRevealed && canAnswerKey) || (explanationRevealed && canExplain));
  answerBlock.hidden = !(answerRevealed && canAnswerKey);
  explanationBlock.hidden = !(explanationRevealed && canExplain);
  detailLocked.hidden = true;
  if (answerRevealed && canAnswerKey) {
    if (currentQuestion.answerMode === "short") {
      document.getElementById("solution-correct-label").textContent = `Reference answer: ${formatShortAnswerKey(currentQuestion)}`;
    } else {
      const index = currentQuestion.correctIndex;
      document.getElementById("solution-correct-label").textContent = `Reference answer: ${String.fromCharCode(65 + index)} — ${currentQuestion.choices[index]}`;
    }
  } else {
    document.getElementById("solution-correct-label").textContent = "";
  }
  if (explanationRevealed && canExplain) {
    explanation.textContent = currentQuestion.explanation;
  } else {
    explanation.textContent = "";
  }
  if (detailLocked) detailLocked.textContent = "";
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
  answerRevealed = false;
  explanationRevealed = false;
  document.getElementById("question-detail-code").textContent = question.code;
  document.getElementById("question-detail-title").textContent = question.title;
  document.getElementById("question-detail-description").textContent = question.description;
  document.getElementById("question-detail-source").textContent = question.source;
  document.getElementById("question-answer-tier").textContent = tierLabel(answerAccessRequirement(question));
  document.getElementById("answer-heading").textContent = question.answerMode === "short" ? "Enter your answer" : "Choose one option";
  document.querySelector(".answer-private-label").textContent = question.answerMode === "short" ? "Written response" : "A–E · One answer only";
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
  const choiceArea = document.getElementById("question-choices");
  choiceArea.hidden = true;
  choiceArea.replaceChildren();
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
document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (!document.getElementById("pumpkin-modal").hidden) closePumpkinChallenge();
  else if (!document.getElementById("question-modal").hidden) closeQuestion();
  else if (!document.getElementById("dashboard-modal").hidden) closeDashboard();
});
document.getElementById("question-login-button").addEventListener("click", () => auth.open("login"));
document.getElementById("reveal-answer-button").addEventListener("click", () => {
  if (!currentQuestion || !canViewAnswer(currentQuestion)) return;
  answerRevealed = !answerRevealed;
  renderSolutionPanel();
  renderAnswerPanel();
});
document.getElementById("reveal-explanation-button").addEventListener("click", () => {
  if (!currentQuestion || !canViewExplanation(currentQuestion)) return;
  explanationRevealed = !explanationRevealed;
  renderSolutionPanel();
});
document.querySelector(".question-content-section").addEventListener("contextmenu", event => event.preventDefault());

document.getElementById("answer-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!currentQuestion || !canSubmitAnswer(currentQuestion)) { renderAnswerPanel(); return; }
  const feedback = document.getElementById("answer-feedback");
  const previous = getAttemptRecord(currentQuestion);
  const limit = attemptLimit(currentQuestion);
  if (Number.isFinite(limit) && (previous.correct || previous.count >= limit)) {
    renderAnswerPanel();
    return;
  }

  let isCorrect = false;
  let selectedIndex = null;
  let answerText = null;
  if (currentQuestion.answerMode === "short") {
    const inputs = [...document.querySelectorAll("#answer-short-fields input[data-field-index]")];
    answerText = inputs.map(input => input.value.trim());
    if (answerText.some(value => !value)) {
      feedback.textContent = "Please complete every answer field.";
      feedback.classList.add("is-error");
      return;
    }
    isCorrect = checkShortAnswer(currentQuestion, answerText);
  } else {
    const selected = document.querySelector('input[name="selected-answer"]:checked');
    if (!selected) {
      feedback.textContent = "Please choose one of the five options before submitting.";
      feedback.classList.add("is-error");
      return;
    }
    selectedIndex = Number(selected.value);
    isCorrect = selectedIndex === currentQuestion.correctIndex;
  }

  const nextRecord = {
    count: previous.count + 1,
    selected: selectedIndex,
    answerText,
    correct: isCorrect,
    lastCorrect: isCorrect,
    updatedAt: new Date().toISOString()
  };
  try {
    writeAttemptRecord(currentQuestion, nextRecord);
    renderAnswerPanel();
    renderSolutionPanel();
    renderDashboardPanel();
    const status = document.getElementById("answer-attempt-status");
    const remaining = Number.isFinite(limit) ? Math.max(0, limit - nextRecord.count) : null;
    status.textContent = isCorrect
      ? `Correct — well done. ${Number.isFinite(limit) ? `You used ${nextRecord.count} of ${limit} permitted attempt(s).` : "You may continue practising."}`
      : `Not correct. ${Number.isFinite(limit) ? (remaining > 0 ? `${remaining} attempt(s) remaining.` : "No attempts remaining for this question.") : "You may try again."}`;
    feedback.textContent = isCorrect
      ? "Correct — your selected option is marked green."
      : canViewAnswer(currentQuestion)
        ? "Not correct — your selected option is marked red. Reveal the answer to see the correct option."
        : "Not correct — your selected option is marked red. The correct option is not available at this access level.";
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
    renderDashboardPanel();
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
appReady = true;
if (auth.getCurrentUser()) claimGuestPumpkinTrophy(auth.getCurrentUser());
renderPumpkinTrophyState();
renderDashboardPanel();
renderTitlesPanel();
