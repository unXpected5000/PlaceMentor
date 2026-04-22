const DASHBOARD_THEMES = {
  dark: {
    backdrop:
      "fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.14),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_58%,_#020617_100%)]",
    body: "min-h-screen bg-slate-950 text-slate-100",
    panel:
      "rounded-[2rem] border border-white/10 bg-slate-900/55 p-4 shadow-2xl shadow-black/25 backdrop-blur lg:p-6",
    top:
      "sticky top-4 z-10 mb-4 rounded-[1.8rem] border border-white/10 bg-slate-900/92 px-5 py-4 shadow-lg shadow-black/20 backdrop-blur",
  },
  light: {
    backdrop:
      "fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)]",
    body: "min-h-screen bg-slate-100 text-slate-900",
    panel:
      "rounded-[2rem] border border-slate-200 bg-white/80 p-4 shadow-2xl shadow-slate-300/30 backdrop-blur lg:p-6",
    top:
      "sticky top-4 z-10 mb-4 rounded-[1.8rem] border border-slate-200 bg-white/92 px-5 py-4 shadow-lg shadow-slate-300/20 backdrop-blur",
  },
  gray: {
    backdrop:
      "fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.2),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.08),_transparent_30%),linear-gradient(180deg,_#111827_0%,_#1f2937_55%,_#374151_100%)]",
    body: "min-h-screen bg-slate-900 text-slate-100",
    panel:
      "rounded-[2rem] border border-slate-500/25 bg-slate-800/70 p-4 shadow-2xl shadow-black/25 backdrop-blur lg:p-6",
    top:
      "sticky top-4 z-10 mb-4 rounded-[1.8rem] border border-slate-500/25 bg-slate-800/92 px-5 py-4 shadow-lg shadow-black/20 backdrop-blur",
  },
};

const SETTINGS_THEMES = {
  dark: {
    body: "min-h-screen bg-slate-950 text-slate-100",
    backdrop:
      "fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.14),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_58%,_#020617_100%)]",
  },
  light: {
    body: "min-h-screen bg-slate-100 text-slate-900",
    backdrop:
      "fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.1),_transparent_28%),linear-gradient(180deg,_#eff6ff_0%,_#e2e8f0_100%)]",
  },
  gray: {
    body: "min-h-screen bg-slate-900 text-slate-100",
    backdrop:
      "fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,_#111827_0%,_#1f2937_100%)]",
  },
};

function applyDashboardTheme(theme, elements) {
  const selected = DASHBOARD_THEMES[theme] || DASHBOARD_THEMES.dark;
  elements.backdrop.className = selected.backdrop;
  elements.body.className = selected.body;
  elements.body.dataset.theme = theme;
  elements.mainPanel.className = selected.panel;
  elements.topBar.className = selected.top;
}

function applySettingsTheme(theme, elements) {
  const selected = SETTINGS_THEMES[theme] || SETTINGS_THEMES.dark;
  elements.body.className = selected.body;
  elements.body.dataset.theme = theme;
  elements.backdrop.className = selected.backdrop;

  elements.themeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === theme);
  });
}

export { DASHBOARD_THEMES, SETTINGS_THEMES, applyDashboardTheme, applySettingsTheme };
