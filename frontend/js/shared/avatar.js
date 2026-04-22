const AVATAR_STORAGE_KEY_PREFIX = "placement-mentor-avatar";

function getInitials(name = "", email = "") {
  const source = String(name || "").trim() || String(email || "").trim();
  const parts = source.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase() || "--";
}

function getAvatarStorageKey(uid) {
  return `${AVATAR_STORAGE_KEY_PREFIX}-${uid}`;
}

function getAvatarData(uid) {
  if (!uid) {
    return "";
  }

  return localStorage.getItem(getAvatarStorageKey(uid)) || "";
}

function setAvatarData(uid, dataUrl) {
  if (!uid) {
    return;
  }

  localStorage.setItem(getAvatarStorageKey(uid), dataUrl);
}

function removeAvatarData(uid) {
  if (!uid) {
    return;
  }

  localStorage.removeItem(getAvatarStorageKey(uid));
}

function renderAvatar(profile, imageElement, initialsElement) {
  if (!imageElement || !initialsElement) {
    return;
  }

  if (!profile) {
    initialsElement.textContent = "--";
    imageElement.classList.add("hidden");
    initialsElement.classList.remove("hidden");
    imageElement.removeAttribute("src");
    return;
  }

  const avatarData = getAvatarData(profile.uid);
  if (avatarData) {
    imageElement.src = avatarData;
    imageElement.classList.remove("hidden");
    initialsElement.classList.add("hidden");
    return;
  }

  initialsElement.textContent = getInitials(profile.name, profile.email);
  initialsElement.classList.remove("hidden");
  imageElement.classList.add("hidden");
  imageElement.removeAttribute("src");
}

function validateAvatarFile(file) {
  if (!file) {
    return "Choose an image file first.";
  }

  if (!file.type.startsWith("image/")) {
    return "Please choose an image file.";
  }

  if (file.size > 2 * 1024 * 1024) {
    return "Profile photo size limit is 2 MB.";
  }

  return "";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

async function storeAvatarFromFile(profile, file) {
  const validationMessage = validateAvatarFile(file);
  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const dataUrl = await fileToDataUrl(file);
  setAvatarData(profile.uid, dataUrl);
  return dataUrl;
}

export {
  AVATAR_STORAGE_KEY_PREFIX,
  getInitials,
  getAvatarStorageKey,
  getAvatarData,
  setAvatarData,
  removeAvatarData,
  renderAvatar,
  validateAvatarFile,
  storeAvatarFromFile,
};
