import {
  auth,
  hasFirebaseConfig,
  onAuthStateChanged,
  signOut,
  updatePassword,
  updateProfile,
} from "./firebase.js";
import { apiRequest } from "./api.js";
import { readSettings, updateSettings } from "./shared/preferences.js";
import {
  renderAvatar,
  storeAvatarFromFile,
  removeAvatarData,
} from "./shared/avatar.js";
import { createMessagePresenter } from "./shared/messages.js";
import { applySettingsTheme } from "./shared/themes.js";

const settingsBackdrop = document.getElementById("settingsBackdrop");
const settingsMessage = document.getElementById("settingsMessage");
const settingsLogoutButton = document.getElementById("settingsLogoutButton");
const settingsRoleBadge = document.getElementById("settingsRoleBadge");
const settingsDisplayName = document.getElementById("settingsDisplayName");
const settingsEmailText = document.getElementById("settingsEmailText");
const settingsNameInput = document.getElementById("settingsNameInput");
const settingsDepartmentInput = document.getElementById("settingsDepartmentInput");
const settingsPasswordInput = document.getElementById("settingsPasswordInput");
const saveProfileSettingsButton = document.getElementById("saveProfileSettingsButton");
const changePasswordButton = document.getElementById("changePasswordButton");
const settingsAvatarInput = document.getElementById("settingsAvatarInput");
const settingsAvatarImage = document.getElementById("settingsAvatarImage");
const settingsAvatarInitials = document.getElementById("settingsAvatarInitials");
const removeAvatarButton = document.getElementById("removeAvatarButton");
const themeButtons = document.querySelectorAll(".settings-theme");

let currentProfile = null;
const showMessage = createMessagePresenter(settingsMessage, "mt-4");

function applyTheme(theme) {
  applySettingsTheme(theme, {
    body: document.body,
    backdrop: settingsBackdrop,
    themeButtons: Array.from(themeButtons),
  });
}

function applyStoredTheme() {
  const settings = {
    theme: "dark",
    ...readSettings(),
  };

  applyTheme(settings.theme);
}

async function updateProfileSettings() {
  const name = settingsNameInput.value.trim();
  const department = settingsDepartmentInput.value.trim();

  const response = await apiRequest("/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ name, department }),
  });

  if (auth?.currentUser) {
    await updateProfile(auth.currentUser, { displayName: name });
  }

  currentProfile = response.profile;
  settingsDisplayName.textContent = currentProfile.name || "Unnamed User";
  settingsEmailText.textContent = currentProfile.email || "";
  settingsRoleBadge.textContent = currentProfile.role?.toUpperCase() || "USER";
  renderAvatar(currentProfile, settingsAvatarImage, settingsAvatarInitials);
  showMessage("Profile updated successfully.");
}

async function updatePasswordSetting() {
  const password = settingsPasswordInput.value.trim();
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (!auth?.currentUser) {
    throw new Error("No logged-in user found.");
  }

  await updatePassword(auth.currentUser, password);
  settingsPasswordInput.value = "";
  showMessage("Password updated successfully.");
}

async function handleAvatarUpload(file) {
  if (!file || !currentProfile) {
    return;
  }

  try {
    await storeAvatarFromFile(currentProfile, file);
    renderAvatar(currentProfile, settingsAvatarImage, settingsAvatarInitials);
    showMessage("Profile photo updated.");
  } catch (error) {
    showMessage(error.message, "error");
  }
}

function removeAvatar() {
  if (!currentProfile) {
    return;
  }

  removeAvatarData(currentProfile.uid);
  renderAvatar(currentProfile, settingsAvatarImage, settingsAvatarInitials);
  showMessage("Profile photo removed.");
}

settingsLogoutButton?.addEventListener("click", async () => {
  if (auth) {
    await signOut(auth);
  }
  window.location.href = "/login";
});

saveProfileSettingsButton?.addEventListener("click", async () => {
  try {
    await updateProfileSettings();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

changePasswordButton?.addEventListener("click", async () => {
  try {
    await updatePasswordSetting();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

settingsAvatarInput?.addEventListener("change", async (event) => {
  await handleAvatarUpload(event.target.files?.[0]);
});

removeAvatarButton?.addEventListener("click", removeAvatar);

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const settings = updateSettings({ theme: button.dataset.theme });
    applyTheme(settings.theme);
    showMessage(`Theme switched to ${button.dataset.theme}.`);
  });
});

if (!hasFirebaseConfig()) {
  showMessage(
    "Firebase web config is missing. Update frontend/js/config.js before using settings.",
    "error"
  );
}

if (!auth) {
  showMessage("Firebase auth is not initialized. Please configure the frontend first.", "error");
} else {
  applyStoredTheme();
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await apiRequest("/auth/me");
      currentProfile = response.profile;
      settingsDisplayName.textContent = currentProfile.name || "Unnamed User";
      settingsEmailText.textContent = currentProfile.email || "";
      settingsRoleBadge.textContent = currentProfile.role?.toUpperCase() || "USER";
      settingsNameInput.value = currentProfile.name || "";
      settingsDepartmentInput.value = currentProfile.department || "";
      renderAvatar(currentProfile, settingsAvatarImage, settingsAvatarInitials);
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}
