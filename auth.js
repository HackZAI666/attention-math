/*
 * Attention account module.
 * Static-site prototype only: data is stored in this browser's localStorage.
 * A real public service needs a server-side authentication system and database.
 */

const USERS_KEY = "attention_users_v1";
const SESSION_KEY = "attention_session_v1";
const HASH_ITERATIONS = 210_000;
const encoder = new TextEncoder();

// Developer access requested for this prototype. This is NOT a server-side secret.
// Anyone who can read the deployed JavaScript can inspect or bypass client-side auth.
const DEVELOPER = Object.freeze({
  username: "142857",
  salt: "617474656e74696f6e2d6465762d7631",
  hash: "b24508cf444d03cd3d7458cec594b55eca17795a4bdd99f647372f8fc0c3b217",
  iterations: HASH_ITERATIONS
});

function bytesToHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  if (typeof hex !== "string" || hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
    throw new Error("Invalid stored security data.");
  }
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < result.length; i += 1) {
    result[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
}

async function hashPassword(password, saltHex, iterations = HASH_ITERATIONS) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure password hashing is unavailable. Open this site through localhost or a secure HTTPS connection.");
  }
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

function hashesMatch(expected, actual) {
  if (typeof expected !== "string" || typeof actual !== "string" || expected.length !== actual.length) return false;
  let difference = 0;
  for (let i = 0; i < expected.length; i += 1) {
    difference |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  }
  return difference === 0;
}

function safeReadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(user => user &&
      typeof user.id === "string" &&
      typeof user.username === "string" &&
      typeof user.email === "string" &&
      user.password &&
      typeof user.password.salt === "string" &&
      /^[0-9a-f]{32}$/i.test(user.password.salt) &&
      typeof user.password.hash === "string" &&
      /^[0-9a-f]{64}$/i.test(user.password.hash) &&
      Number.isInteger(user.password.iterations) &&
      user.password.iterations >= 100_000 && user.password.iterations <= 500_000 &&
      Array.isArray(user.preferences)
    );
  } catch {
    return [];
  }
}

function writeUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    throw new Error("Your browser could not save this account. Check your available site storage.");
  }
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || typeof session !== "object") return null;
    return session;
  } catch {
    return null;
  }
}

function writeSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    throw new Error("Your browser could not save the sign-in session.");
  }
}

function makePublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email || "",
    role: user.role || "member",
    membership: user.membership || "reg",
    preferences: Array.isArray(user.preferences) ? [...user.preferences] : []
  };
}

export function createAuth({ onAuthChange = () => {}, onRegistered = () => {} } = {}) {
  const modal = document.getElementById("auth-modal");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const message = document.getElementById("auth-message");
  const loginTab = document.getElementById("auth-tab-login");
  const registerTab = document.getElementById("auth-tab-register");

  function setMessage(text = "", isError = false) {
    message.textContent = text;
    message.classList.toggle("is-error", isError);
  }

  function setMode(mode) {
    const isLogin = mode === "login";
    loginForm.hidden = !isLogin;
    registerForm.hidden = isLogin;
    loginTab.classList.toggle("is-active", isLogin);
    registerTab.classList.toggle("is-active", !isLogin);
    loginTab.setAttribute("aria-selected", String(isLogin));
    registerTab.setAttribute("aria-selected", String(!isLogin));
    setMessage();
  }

  function open(mode = "login") {
    setMode(mode);
    modal.hidden = false;
    document.body.classList.add("modal-open");
    const firstField = mode === "login"
      ? document.getElementById("login-identifier")
      : document.getElementById("register-username");
    firstField.focus();
  }

  function close() {
    modal.hidden = true;
    const questionModal = document.getElementById("question-modal");
    const preferencesModal = document.getElementById("preferences-modal");
    if ((!questionModal || questionModal.hidden) && (!preferencesModal || preferencesModal.hidden)) {
      document.body.classList.remove("modal-open");
    }
    setMessage();
  }

  function getCurrentUser() {
    const session = readSession();
    if (!session) return null;
    if (session.role === "developer" && session.userId === "attention-developer") {
      return {
        id: "attention-developer",
        username: DEVELOPER.username,
        email: "",
        role: "developer",
        membership: "vip",
        preferences: []
      };
    }
    if (typeof session.userId !== "string") return null;
    const user = safeReadUsers().find(entry => entry.id === session.userId);
    return makePublicUser(user);
  }

  function notifyChange() {
    onAuthChange(getCurrentUser());
  }

  async function login(identifier, password) {
    const cleanIdentifier = String(identifier || "").trim();
    if (!cleanIdentifier || !password) throw new Error("Enter your username/email and password.");

    if (cleanIdentifier.toLowerCase() === DEVELOPER.username.toLowerCase()) {
      const candidate = await hashPassword(password, DEVELOPER.salt, DEVELOPER.iterations);
      if (!hashesMatch(candidate, DEVELOPER.hash)) throw new Error("That username/email or password is incorrect.");
      writeSession({ userId: "attention-developer", role: "developer" });
      notifyChange();
      close();
      return getCurrentUser();
    }

    const normalized = cleanIdentifier.toLowerCase();
    const user = safeReadUsers().find(entry =>
      entry.username.toLowerCase() === normalized ||
      (entry.email && entry.email.toLowerCase() === normalized)
    );
    if (!user) throw new Error("That username/email or password is incorrect.");

    const candidate = await hashPassword(password, user.password.salt, user.password.iterations);
    if (!hashesMatch(candidate, user.password.hash)) throw new Error("That username/email or password is incorrect.");

    writeSession({ userId: user.id, role: "member" });
    notifyChange();
    close();
    return getCurrentUser();
  }

  async function register(username, password, email = "") {
    const cleanUsername = String(username || "").trim();
    const cleanEmail = String(email || "").trim();

    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(cleanUsername)) {
      throw new Error("Username must be 3–24 characters and use only letters, numbers, _ or -.");
    }
    if (cleanUsername.toLowerCase() === DEVELOPER.username.toLowerCase()) {
      throw new Error("That username is reserved.");
    }
    if (typeof password !== "string" || password.length === 0) {
      throw new Error("Please enter a password.");
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("Please enter a valid email address, or leave the email field empty.");
    }

    const users = safeReadUsers();
    const duplicateUsername = users.some(user => user.username.toLowerCase() === cleanUsername.toLowerCase());
    const duplicateEmail = cleanEmail && users.some(user => user.email && user.email.toLowerCase() === cleanEmail.toLowerCase());
    if (duplicateUsername) throw new Error("That username is already in use.");
    if (duplicateEmail) throw new Error("That email is already linked to an account.");

    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = bytesToHex(saltBytes);
    const hash = await hashPassword(password, salt);
    const user = {
      id: crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      username: cleanUsername,
      email: cleanEmail,
      password: { salt, hash, iterations: HASH_ITERATIONS },
      preferences: [],
      membership: "reg",
      createdAt: new Date().toISOString()
    };

    users.push(user);
    writeUsers(users);
    writeSession({ userId: user.id, role: "member" });
    notifyChange();
    close();
    onRegistered(getCurrentUser());
    return getCurrentUser();
  }

  function updatePreferences(preferences) {
    const session = readSession();
    if (!session || session.role === "developer" || typeof session.userId !== "string") return false;
    const normalized = [...new Set((Array.isArray(preferences) ? preferences : [])
      .filter(value => typeof value === "string")
      .map(value => value.trim())
      .filter(Boolean))];
    const users = safeReadUsers();
    const index = users.findIndex(user => user.id === session.userId);
    if (index < 0) return false;
    users[index].preferences = normalized;
    writeUsers(users);
    notifyChange();
    return true;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    notifyChange();
  }

  document.getElementById("open-auth").addEventListener("click", () => open("login"));
  document.getElementById("auth-close").addEventListener("click", close);
  loginTab.addEventListener("click", () => setMode("login"));
  registerTab.addEventListener("click", () => setMode("register"));
  modal.addEventListener("click", event => { if (event.target === modal) close(); });

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const submit = loginForm.querySelector("button[type='submit']");
    submit.disabled = true;
    setMessage("Checking your account...");
    try {
      await login(document.getElementById("login-identifier").value, document.getElementById("login-password").value);
      loginForm.reset();
    } catch (error) {
      setMessage(error.message || "Unable to log in. Please try again.", true);
    } finally {
      submit.disabled = false;
    }
  });

  registerForm.addEventListener("submit", async event => {
    event.preventDefault();
    const submit = registerForm.querySelector("button[type='submit']");
    submit.disabled = true;
    setMessage("Creating your account...");
    try {
      await register(
        document.getElementById("register-username").value,
        document.getElementById("register-password").value,
        document.getElementById("register-email").value
      );
      registerForm.reset();
    } catch (error) {
      setMessage(error.message || "Unable to create your account. Please try again.", true);
    } finally {
      submit.disabled = false;
    }
  });

  document.getElementById("logout-button").addEventListener("click", logout);
  notifyChange();

  return { open, close, login, register, logout, getCurrentUser, updatePreferences };
}
