export type LocalAuthSession = {
  email: string;
  createdAt: string;
};

type StoredUser = {
  email: string;
  passwordHash: string;
  createdAt: string;
};

const USERS_KEY = 'apexstores-local-auth-users-v1';
const SESSION_KEY = 'apexstores-local-auth-session-v1';

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readJson<T>(key: string): T | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashPassword(password: string) {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    // Browser environment
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const digest = await window.crypto.subtle.digest('SHA-256', data);

    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Fallback for environments without crypto.subtle
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  // Use a simple hash implementation for fallback
  let hash = 0;
  const view = new Uint8Array(data);
  for (let i = 0; i < view.length; i++) {
    hash = ((hash << 5) - hash) + view[i];
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

function getUsers() {
  return readJson<Record<string, StoredUser>>(USERS_KEY) ?? {};
}

function setUsers(users: Record<string, StoredUser>) {
  writeJson(USERS_KEY, users);
}

export function getLocalSession() {
  return readJson<LocalAuthSession>(SESSION_KEY);
}

export function setLocalSession(email: string) {
  writeJson(SESSION_KEY, {
    email,
    createdAt: new Date().toISOString(),
  });
}

export function clearLocalSession() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(SESSION_KEY);
}

export async function signUpLocal(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || password.length < 6) {
    throw new Error('Please enter a valid email and a password with at least 6 characters.');
  }

  const users = getUsers();

  if (users[normalizedEmail]) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(password);
  users[normalizedEmail] = {
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  setUsers(users);
  setLocalSession(email);

  return {
    email,
  };
}

export async function signInLocal(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const users = getUsers();
  const user = users[normalizedEmail];

  if (!user) {
    throw new Error('No account found for this email. Create an account first.');
  }

  const passwordHash = await hashPassword(password);

  if (passwordHash !== user.passwordHash) {
    throw new Error('Incorrect password.');
  }

  setLocalSession(email);

  return {
    email: user.email,
  };
}
