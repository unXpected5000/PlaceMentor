import { applyAvatar } from "./profile.js";
import { roleLabel } from "./roles.js";

export function showToast(element, message) {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("hidden");
  window.setTimeout(() => element.classList.add("hidden"), 2600);
}

export function setLoading(element, isLoading) {
  element?.classList.toggle("loading", isLoading);
  if (element && "disabled" in element) {
    element.disabled = isLoading;
  }
}

export function applyTheme(theme, button) {
  document.body.classList.toggle("dark-mode", theme === "dark");
  if (button) {
    button.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
  }
}

export function setIdentity(elements, user, profile) {
  if (!user) {
    applyAvatar(elements.userAvatar, "Guest", "");
    elements.userName.textContent = "Guest";
    elements.userRoleLabel.textContent = "No active session";
    return;
  }

  applyAvatar(elements.userAvatar, user.name, profile?.imageUrl);
  elements.userName.textContent = user.name;
  elements.userRoleLabel.textContent = `${roleLabel(user.role)} | ${user.email}`;
}

export function setDrawerOpen(sidebar, overlay, isOpen) {
  sidebar?.classList.toggle("drawer-open", isOpen);
  overlay?.classList.toggle("hidden", !isOpen);
  document.body.classList.toggle("no-scroll", isOpen);
}
