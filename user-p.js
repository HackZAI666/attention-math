/* Interest selection for newly registered members. */

const INTERESTS = [
  { id: "algebra", title: "Algebra", description: "Patterns, equations, and functions." },
  { id: "geometry", title: "Geometry", description: "Shapes, space, and proofs." },
  { id: "calculus", title: "Calculus", description: "Limits, derivatives, and integrals." },
  { id: "trigonometry", title: "Trigonometry", description: "Angles, triangles, and periodic ideas." },
  { id: "statistics-probability", title: "Statistics & Probability", description: "Data, uncertainty, and chance." },
  { id: "number-theory", title: "Number Theory", description: "Integers, primes, and divisibility." },
  { id: "discrete-math", title: "Discrete Mathematics", description: "Logic, counting, and structures." },
  { id: "linear-algebra", title: "Linear Algebra", description: "Vectors, matrices, and transformations." },
  { id: "mathematical-logic", title: "Mathematical Logic", description: "Reasoning, statements, and proof." }
];

export function createPreferences({ getCurrentUser, updatePreferences, onSaved = () => {} }) {
  const modal = document.getElementById("preferences-modal");
  const grid = document.getElementById("interest-grid");
  const message = document.getElementById("preferences-message");
  const selected = new Set();

  function renderCards() {
    grid.replaceChildren();
    INTERESTS.forEach((interest, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "interest-card";
      card.dataset.interest = interest.id;
      card.setAttribute("aria-pressed", String(selected.has(interest.id)));

      const number = document.createElement("span");
      number.className = "interest-number";
      number.textContent = String(index + 1).padStart(2, "0");
      const check = document.createElement("span");
      check.className = "interest-check";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "✓";
      const title = document.createElement("strong");
      title.textContent = interest.title;
      const description = document.createElement("small");
      description.textContent = interest.description;

      card.append(number, check, title, description);
      card.addEventListener("click", () => {
        if (selected.has(interest.id)) selected.delete(interest.id);
        else selected.add(interest.id);
        card.classList.toggle("is-selected", selected.has(interest.id));
        card.setAttribute("aria-pressed", String(selected.has(interest.id)));
        message.textContent = `${selected.size} ${selected.size === 1 ? "interest" : "interests"} selected.`;
        message.classList.remove("is-error");
      });
      card.classList.toggle("is-selected", selected.has(interest.id));
      grid.append(card);
    });
  }

  function open() {
    const user = getCurrentUser();
    selected.clear();
    (user?.preferences || []).forEach(value => selected.add(value));
    message.textContent = "Select one or more topics, or skip for now.";
    message.classList.remove("is-error");
    renderCards();
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function close() {
    modal.hidden = true;
    const questionModal = document.getElementById("question-modal");
    const authModal = document.getElementById("auth-modal");
    if ((!questionModal || questionModal.hidden) && (!authModal || authModal.hidden)) {
      document.body.classList.remove("modal-open");
    }
  }

  function save() {
    if (selected.size === 0) {
      message.textContent = "Choose at least one interest, or select “Do this later”.";
      message.classList.add("is-error");
      return;
    }
    const success = updatePreferences([...selected]);
    if (!success) {
      message.textContent = "Your interests could not be saved. Please sign in again.";
      message.classList.add("is-error");
      return;
    }
    close();
    onSaved([...selected]);
  }

  document.getElementById("preferences-close").addEventListener("click", close);
  document.getElementById("preferences-skip").addEventListener("click", close);
  document.getElementById("preferences-save").addEventListener("click", save);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });

  return { open, close };
}
