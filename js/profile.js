const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function initialsForName(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "PL";
}

export function validateProfileImage(file) {
  if (!file) {
    throw new Error("Choose an image file to upload.");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Use PNG, JPG, or WEBP for the profile photo.");
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    throw new Error("Profile photo must be 1 MB or smaller.");
  }
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.onload = () => {
      const result = String(reader.result || "");
      const [, base64 = ""] = result.split(",");
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

export function avatarMarkup(name, imageUrl, className = "") {
  const classes = ["avatar", className].filter(Boolean).join(" ");
  const initials = initialsForName(name);
  return imageUrl
    ? `<span class="${classes} has-image"><img src="${imageUrl}" alt="${name} profile photo" /></span>`
    : `<span class="${classes}">${initials}</span>`;
}

export function applyAvatar(element, name, imageUrl) {
  if (!element) return;
  element.classList.add("avatar");
  if (imageUrl) {
    element.classList.add("has-image");
    element.innerHTML = `<img src="${imageUrl}" alt="${name} profile photo" />`;
    return;
  }
  element.classList.remove("has-image");
  element.textContent = initialsForName(name);
}
