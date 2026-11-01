/* Question metadata and client-side filtering for Attention. */
const INDEX_URL = new URL("./question/questions.json", import.meta.url);

function isValidQuestion(item) {
  return Boolean(item &&
    typeof item.id === "string" &&
    typeof item.code === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.prompt === "string" &&
    Array.isArray(item.topics) && item.topics.every(topic => typeof topic === "string") &&
    ["normal", "acc", "vip"].includes(item.accessTier) &&
    Number.isInteger(item.difficulty) && item.difficulty >= 1 && item.difficulty <= 7 &&
    typeof item.source === "string" &&
    Array.isArray(item.choices) && item.choices.length === 5 && item.choices.every(choice => typeof choice === "string") &&
    Number.isInteger(item.correctIndex) && item.correctIndex >= 0 && item.correctIndex < 5 &&
    typeof item.explanation === "string" && item.explanation.length > 0);
}

export async function loadQuestions() {
  const response = await fetch(INDEX_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Question index could not be loaded (${response.status}).`);
  const data = await response.json();
  if (!data || !Array.isArray(data.questions)) throw new Error("Question index has an invalid format.");
  const valid = data.questions.filter(isValidQuestion);
  if (valid.length !== data.questions.length) {
    console.warn("Some invalid question records were skipped.");
  }
  return valid;
}

export function searchQuestions(questions, { query = "", topic = "all", difficulty = "all", access = "all" } = {}) {
  const words = String(query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return questions.filter(question => {
    if (topic !== "all" && !question.topics.some(tag => tag.toLocaleLowerCase() === topic.toLocaleLowerCase())) return false;
    if (difficulty !== "all" && question.difficulty !== Number(difficulty)) return false;
    if (access !== "all" && question.accessTier !== access) return false;
    if (!words.length) return true;
    const searchable = [question.code, question.title, question.description, question.prompt, question.source, ...(question.choices || []), ...question.topics]
      .join(" ").toLocaleLowerCase();
    return words.every(word => searchable.includes(word));
  });
}
