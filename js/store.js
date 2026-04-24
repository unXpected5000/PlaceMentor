const STORAGE_KEY = "placementor.zeroCostDemo";

function defaultState() {
  return {
    users: [],
    students: [],
    companies: [],
    applications: [],
    resumes: [],
    currentUserId: null,
    activity: [
      "Cloudflare D1 data source ready",
      "Import your real CSV/JSON dataset to begin",
    ],
    theme: "light",
  };
}

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const state = defaultState();
    saveState(state);
    return state;
  }

  try {
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch (error) {
    const state = defaultState();
    saveState(state);
    return state;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  const state = defaultState();
  saveState(state);
  return state;
}

export function addActivity(state, message) {
  state.activity = [message, ...(state.activity || [])].slice(0, 8);
  saveState(state);
}
