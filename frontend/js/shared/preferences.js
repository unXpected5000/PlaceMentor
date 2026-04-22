const SETTINGS_STORAGE_KEY = "placement-mentor-settings";

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function updateSettings(partialSettings) {
  const nextSettings = {
    ...readSettings(),
    ...(partialSettings || {}),
  };
  saveSettings(nextSettings);
  return nextSettings;
}

export {
  SETTINGS_STORAGE_KEY,
  readSettings,
  saveSettings,
  updateSettings,
};
