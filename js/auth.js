const SESSION_KEY = "placementor.erp.session";
const THEME_KEY = "placementor.theme";

export function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}
