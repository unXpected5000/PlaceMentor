function createMessagePresenter(element, baseClass = "") {
  return function showMessage(message, type = "success") {
    if (!element) {
      return;
    }

    element.className =
      `${baseClass} rounded-2xl px-4 py-3 text-sm `.trim() +
      " " +
      (type === "error"
        ? "bg-red-500/15 text-red-200"
        : "bg-emerald-500/15 text-emerald-200");
    element.textContent = message;
    element.classList.remove("hidden");
  };
}

export { createMessagePresenter };
