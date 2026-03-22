import {
  auth,
  hasFirebaseConfig,
  onAuthStateChanged,
  signOut,
  updatePassword,
  updateProfile,
} from "./firebase.js";
import { apiRequest } from "./api.js";

const globalMessage = document.getElementById("globalMessage");
const roleBadge = document.getElementById("roleBadge");
const logoutButton = document.getElementById("logoutButton");
const topBarName = document.getElementById("topBarName");
const topBarEmail = document.getElementById("topBarEmail");
const settingsButton = document.getElementById("settingsButton");
const closeSettingsButton = document.getElementById("closeSettingsButton");
const settingsPanel = document.getElementById("settingsPanel");
const compactModeToggle = document.getElementById("compactModeToggle");
const themeOptions = document.querySelectorAll(".theme-option");
const dashboardBackdrop = document.getElementById("dashboardBackdrop");
const dashboardBody = document.getElementById("dashboardBody");
const topBar = document.getElementById("topBar");
const sidebar = document.getElementById("sidebar");
const mainPanel = document.getElementById("mainPanel");
const avatarInput = document.getElementById("avatarInput");
const avatarImage = document.getElementById("avatarImage");
const avatarInitials = document.getElementById("avatarInitials");
const settingsNameInput = document.getElementById("settingsNameInput");
const settingsDepartmentInput = document.getElementById("settingsDepartmentInput");
const saveProfileSettingsButton = document.getElementById("saveProfileSettingsButton");
const settingsPasswordInput = document.getElementById("settingsPasswordInput");
const changePasswordButton = document.getElementById("changePasswordButton");

const studentSection = document.getElementById("studentSection");
const facultySection = document.getElementById("facultySection");
const tnpSection = document.getElementById("tnpSection");

const studentProfileForm = document.getElementById("studentProfileForm");
const resumeUploadForm = document.getElementById("resumeUploadForm");
const resumeFileInput = document.getElementById("resumeFile");
const predictionButton = document.getElementById("predictButton");
const predictionResult = document.getElementById("predictionResult");
const resumeAnalysisResult = document.getElementById("resumeAnalysisResult");
const studentCompanyMatches = document.getElementById("studentCompanyMatches");
const studentReadinessChart = document.getElementById("studentReadinessChart");
const studentTimeline = document.getElementById("studentTimeline");
const heroPlacementProbability = document.getElementById("heroPlacementProbability");
const heroBestMatch = document.getElementById("heroBestMatch");
const heroResumeScore = document.getElementById("heroResumeScore");
const studentMetricProbability = document.getElementById("studentMetricProbability");
const studentMetricResume = document.getElementById("studentMetricResume");
const studentMetricSalary = document.getElementById("studentMetricSalary");
const studentMetricRole = document.getElementById("studentMetricRole");

const facultyStudentTable = document.getElementById("facultyStudentTable");
const facultyEditForm = document.getElementById("facultyEditForm");
const facultySelectedStudent = document.getElementById("facultySelectedStudent");
const refreshFacultyData = document.getElementById("refreshFacultyData");
const facultyMetricStudents = document.getElementById("facultyMetricStudents");
const facultyMetricAverage = document.getElementById("facultyMetricAverage");
const facultyMetricAttention = document.getElementById("facultyMetricAttention");
const facultySearchInput = document.getElementById("facultySearchInput");
const facultyStatusFilter = document.getElementById("facultyStatusFilter");
const facultySortSelect = document.getElementById("facultySortSelect");
const facultyExportButton = document.getElementById("facultyExportButton");
const tnpFunnel = document.getElementById("tnpFunnel");
const companyForm = document.getElementById("companyForm");
const tnpExportStudentsButton = document.getElementById("tnpExportStudentsButton");
const tnpGroupingBoard = document.getElementById("tnpGroupingBoard");
const tnpCompanyList = document.getElementById("tnpCompanyList");

let selectedStudentId = "";
let currentProfile = null;
let facultyStudentsCache = [];
let tnpStudentsCache = [];
let tnpCompaniesCache = [];
const SETTINGS_STORAGE_KEY = "placement-mentor-settings";
const AVATAR_STORAGE_KEY_PREFIX = "placement-mentor-avatar";

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

function applyTheme(theme) {
  const themes = {
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

  const selected = themes[theme] || themes.dark;
  dashboardBackdrop.className = selected.backdrop;
  dashboardBody.className = selected.body;
  mainPanel.className = selected.panel;
  topBar.className = selected.top;

  themeOptions.forEach((option) => {
    const isActive = option.dataset.theme === theme;
    option.classList.toggle("ring-2", isActive);
    option.classList.toggle("ring-white", isActive);
  });
}

function applyCompactMode(enabled) {
  const grid = mainPanel.parentElement;
  sidebar.classList.toggle("xl:hidden", enabled);
  grid.classList.toggle("xl:grid-cols-[270px_1fr]", !enabled);
  grid.classList.toggle("xl:grid-cols-1", enabled);
}

function applyStoredSettings() {
  const settings = {
    theme: "dark",
    compactMode: false,
    ...readSettings(),
  };

  applyTheme(settings.theme);
  applyCompactMode(Boolean(settings.compactMode));
  compactModeToggle.checked = Boolean(settings.compactMode);
}

function openSettingsPanel() {
  settingsPanel.classList.remove("pointer-events-none", "translate-x-[110%]", "opacity-0");
  settingsPanel.classList.add("translate-x-0", "opacity-100");
}

function closeSettingsPanel() {
  settingsPanel.classList.add("pointer-events-none", "translate-x-[110%]", "opacity-0");
  settingsPanel.classList.remove("translate-x-0", "opacity-100");
}

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

function renderAvatar(profile) {
  if (!profile) {
    avatarInitials.textContent = "--";
    avatarImage.classList.add("hidden");
    avatarInitials.classList.remove("hidden");
    avatarImage.removeAttribute("src");
    return;
  }

  const avatarData = localStorage.getItem(getAvatarStorageKey(profile.uid));
  if (avatarData) {
    avatarImage.src = avatarData;
    avatarImage.classList.remove("hidden");
    avatarInitials.classList.add("hidden");
  } else {
    avatarInitials.textContent = getInitials(profile.name, profile.email);
    avatarInitials.classList.remove("hidden");
    avatarImage.classList.add("hidden");
    avatarImage.removeAttribute("src");
  }
}

function showMessage(message, type = "success") {
  globalMessage.className =
    "mb-6 rounded-2xl px-4 py-3 text-sm " +
    (type === "error"
      ? "bg-red-500/15 text-red-200"
      : "bg-emerald-500/15 text-emerald-200");
  globalMessage.textContent = message;
  globalMessage.classList.remove("hidden");
}

function hideAllSections() {
  studentSection.classList.add("hidden");
  facultySection.classList.add("hidden");
  tnpSection.classList.add("hidden");
}

function fillForm(form, data = {}) {
  Array.from(form.elements).forEach((element) => {
    if (!element.name) {
      return;
    }

    const value = data[element.name];
    if (Array.isArray(value)) {
      element.value = value.join(", ");
    } else if (value != null) {
      element.value = value;
    }
  });
}

function formatPercentage(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "--";
  }

  return `${Math.round(Number(value))}%`;
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function filterAndSortStudents(students) {
  const query = (facultySearchInput?.value || "").trim().toLowerCase();
  const status = facultyStatusFilter?.value || "all";
  const sort = facultySortSelect?.value || "probability-desc";

  const filtered = students.filter((student) => {
    const matchesQuery =
      !query ||
      (student.name || "").toLowerCase().includes(query) ||
      (student.email || "").toLowerCase().includes(query);
    const matchesStatus =
      status === "all" || (student.profile?.applicationStatus || "Not Applied") === status;
    return matchesQuery && matchesStatus;
  });

  filtered.sort((a, b) => {
    if (sort === "cgpa-desc") {
      return Number(b.profile?.cgpa || 0) - Number(a.profile?.cgpa || 0);
    }
    if (sort === "name-asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    return (
      Number(b.prediction?.placementProbability || 0) -
      Number(a.prediction?.placementProbability || 0)
    );
  });

  return filtered;
}

function buildBarCard(label, value, helper, accentClass) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));
  return `
    <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-white">${label}</p>
        <span class="text-sm text-slate-300">${safeValue}%</span>
      </div>
      <div class="mt-3 h-2 rounded-full bg-slate-800">
        <div class="h-2 rounded-full ${accentClass}" style="width:${safeValue}%"></div>
      </div>
      <p class="mt-3 text-xs leading-5 text-slate-400">${helper}</p>
    </div>
  `;
}

function renderStudentInsights(studentProfile = {}, prediction = null, resumeAnalysis = null, matches = []) {
  const readiness = [
    {
      label: "Academic Strength",
      value: (Number(studentProfile.cgpa || 0) / 10) * 100,
      helper: "Derived from CGPA and academic consistency.",
      accentClass: "bg-cyan-400",
    },
    {
      label: "Aptitude Readiness",
      value: Number(studentProfile.aptitudeScore || 0),
      helper: "Measures test readiness for screening rounds.",
      accentClass: "bg-emerald-400",
    },
    {
      label: "Soft Skills",
      value: Number(studentProfile.softSkillsScore || 0),
      helper: "Reflects communication and interview confidence.",
      accentClass: "bg-fuchsia-400",
    },
    {
      label: "Resume Quality",
      value: Number((resumeAnalysis && resumeAnalysis.atsScore) || studentProfile.resumeScore || 0),
      helper: "ATS and profile storytelling strength.",
      accentClass: "bg-orange-400",
    },
  ];

  if (studentReadinessChart) {
    studentReadinessChart.innerHTML = readiness
      .map((item) => buildBarCard(item.label, item.value, item.helper, item.accentClass))
      .join("");
  }

  const topMatch = matches[0];
  const timelineItems = [
    {
      title: "Profile saved",
      description: studentProfile.updatedAt
        ? `Latest student profile synced successfully.`
        : "Fill and save profile data to unlock recommendations.",
      tone: "border-cyan-400/25 bg-cyan-500/10",
    },
    {
      title: "Prediction status",
      description: prediction
        ? `${prediction.predictedRole} at ${prediction.placementProbability}% placement likelihood.`
        : "Run the prediction engine to generate a role and salary forecast.",
      tone: "border-violet-400/25 bg-violet-500/10",
    },
    {
      title: "Top company alignment",
      description: topMatch
        ? `${topMatch.name} leads with a ${topMatch.matchScore} match score.`
        : "Save your profile to calculate company eligibility and skill overlap.",
      tone: "border-emerald-400/25 bg-emerald-500/10",
    },
  ];

  if (studentTimeline) {
    studentTimeline.innerHTML = timelineItems
      .map(
        (item) => `
          <div class="rounded-2xl border ${item.tone} p-4">
            <p class="text-sm font-semibold text-white">${item.title}</p>
            <p class="mt-2 text-sm leading-6 text-slate-300">${item.description}</p>
          </div>
        `
      )
      .join("");
  }

  heroPlacementProbability.textContent = prediction ? formatPercentage(prediction.placementProbability) : "--";
  heroBestMatch.textContent = topMatch ? topMatch.name : "--";
  heroResumeScore.textContent = resumeAnalysis ? `${resumeAnalysis.atsScore}/100` : studentProfile.resumeScore ? `${studentProfile.resumeScore}/100` : "--";

  studentMetricProbability.textContent = prediction ? formatPercentage(prediction.placementProbability) : "--";
  studentMetricResume.textContent = resumeAnalysis ? `${resumeAnalysis.atsScore}` : studentProfile.resumeScore || "--";
  studentMetricSalary.textContent = prediction ? `${prediction.expectedSalaryLpa}L` : "--";
  studentMetricRole.textContent = prediction ? prediction.predictedRole : "--";
}

function renderPrediction(prediction) {
  if (!prediction) {
    predictionResult.innerHTML = "Prediction results will appear here.";
    return;
  }

  predictionResult.innerHTML = `
    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Placement Probability</p>
        <p class="mt-2 text-3xl font-black text-white">${prediction.placementProbability}%</p>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Predicted Role</p>
        <p class="mt-2 text-xl font-bold text-white">${prediction.predictedRole}</p>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Expected Salary</p>
        <p class="mt-2 text-xl font-bold text-white">INR ${prediction.expectedSalaryLpa} LPA</p>
      </div>
    </div>
    <div class="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p class="font-semibold text-white">Improvement Suggestions</p>
      <ul class="mt-3 space-y-2 text-slate-300">
        ${prediction.improvementSuggestions.map((item) => `<li>- ${item}</li>`).join("")}
      </ul>
    </div>
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Hiring Signal</p>
        <div class="mt-3 h-2 rounded-full bg-slate-800">
          <div class="h-2 rounded-full bg-cyan-400" style="width:${Math.min(100, prediction.placementProbability)}%"></div>
        </div>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Role Confidence</p>
        <p class="mt-3 text-sm leading-6 text-slate-300">The current profile aligns most strongly with ${prediction.predictedRole} opportunities.</p>
      </div>
    </div>
  `;
}

function renderResumeAnalysis(analysis) {
  if (!analysis) {
    resumeAnalysisResult.innerHTML = "Resume feedback will appear here.";
    return;
  }

  resumeAnalysisResult.innerHTML = `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">ATS Score</p>
        <p class="mt-2 text-3xl font-black text-white">${analysis.atsScore}</p>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Missing Elements</p>
        <div class="mt-2 text-sm text-slate-300">${analysis.missingElements.join(", ") || "None"}</div>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p class="font-semibold text-white">Skills</p>
        <p class="mt-2 text-sm text-slate-300">${analysis.skills.join(", ") || "No skills detected"}</p>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p class="font-semibold text-white">Projects</p>
        <p class="mt-2 text-sm text-slate-300">${analysis.projects.join(", ") || "No projects detected"}</p>
      </div>
    </div>
    <div class="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p class="font-semibold text-white">Certifications</p>
      <p class="mt-2 text-sm text-slate-300">${analysis.certifications.join(", ") || "No certifications detected"}</p>
      <p class="mt-4 font-semibold text-white">Suggestions</p>
      <ul class="mt-2 space-y-2 text-sm text-slate-300">
        ${analysis.suggestions.map((item) => `<li>- ${item}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderCompanyMatches(matches) {
  if (!matches || matches.length === 0) {
    studentCompanyMatches.innerHTML = "No company matches available yet.";
    return;
  }

  studentCompanyMatches.innerHTML = `
    <div class="space-y-3">
      ${matches
        .map(
          (match) => `
            <article class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p class="text-lg font-semibold text-white">${match.name}</p>
                  <p class="mt-1 text-sm text-slate-400">${match.role}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="rounded-full ${match.eligible ? "bg-emerald-500/15 text-emerald-200" : "bg-orange-500/15 text-orange-200"} px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
                    ${match.eligible ? "Eligible" : "Gap"}
                  </span>
                  <span class="text-2xl font-black text-white">${match.matchScore}</span>
                </div>
              </div>
              <div class="mt-4 h-2 rounded-full bg-slate-800">
                <div class="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400" style="width:${Math.min(100, match.matchScore)}%"></div>
              </div>
              <p class="mt-3 text-sm leading-6 text-slate-300">${match.eligibilityReasons.join(", ")}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderFacultyTable(students) {
  if (!students.length) {
    facultyStudentTable.innerHTML = "No student records found.";
    return;
  }

  facultyStudentTable.innerHTML = `
    <table class="min-w-full overflow-hidden rounded-2xl border border-slate-800">
      <thead class="bg-slate-900">
        <tr>
          <th class="px-4 py-3 text-left">Name</th>
          <th class="px-4 py-3 text-left">Email</th>
          <th class="px-4 py-3 text-left">CGPA</th>
          <th class="px-4 py-3 text-left">Probability</th>
          <th class="px-4 py-3 text-left">Action</th>
        </tr>
      </thead>
      <tbody>
        ${students
          .map(
            (student) => `
              <tr class="border-t border-slate-800">
                <td class="px-4 py-3">${student.name || "-"}</td>
                <td class="px-4 py-3">${student.email || "-"}</td>
                <td class="px-4 py-3">${student.profile?.cgpa || "-"}</td>
                <td class="px-4 py-3">${student.prediction?.placementProbability || 0}%</td>
                <td class="px-4 py-3">
                  <button
                    class="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                    data-student='${encodeURIComponent(JSON.stringify(student))}'
                  >
                    Edit
                  </button>
                </td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;

  facultyStudentTable.querySelectorAll("button[data-student]").forEach((button) => {
    button.addEventListener("click", () => {
      const student = JSON.parse(decodeURIComponent(button.dataset.student));
      selectedStudentId = student.uid;
      facultyEditForm.elements.studentId.value = student.uid;
      fillForm(facultyEditForm, student.profile || {});
      facultySelectedStudent.textContent = `Editing ${student.name} (${student.email})`;
    });
  });

  const average = students.length
    ? Math.round(
        students.reduce(
          (sum, student) => sum + Number(student.prediction?.placementProbability || 0),
          0
        ) / students.length
      )
    : 0;
  const attentionCount = students.filter(
    (student) => Number(student.prediction?.placementProbability || 0) < 60
  ).length;

  facultyMetricStudents.textContent = students.length;
  facultyMetricAverage.textContent = `${average}%`;
  facultyMetricAttention.textContent = attentionCount;
}

function renderGroupingBoard(students) {
  const grouped = students.reduce((accumulator, student) => {
    const role = student.prediction?.predictedRole || "Unassigned";
    accumulator[role] = accumulator[role] || [];
    accumulator[role].push(student);
    return accumulator;
  }, {});

  tnpGroupingBoard.innerHTML = Object.entries(grouped)
    .map(
      ([role, group]) => `
        <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div class="flex items-center justify-between">
            <p class="font-semibold text-white">${role}</p>
            <span class="text-sm text-slate-300">${group.length}</span>
          </div>
          <p class="mt-3 text-sm text-slate-400">${group
            .slice(0, 4)
            .map((student) => student.name)
            .join(", ") || "No students yet."}</p>
        </div>
      `
    )
    .join("");
}

function renderCompanyList(companies) {
  tnpCompanyList.innerHTML = companies
    .map(
      (company) => `
        <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="font-semibold text-white">${company.name}</p>
              <p class="mt-1 text-sm text-slate-400">${company.role} • ${company.packageLpa} LPA</p>
            </div>
            <div class="flex gap-2">
              <button class="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10" data-company-edit='${encodeURIComponent(JSON.stringify(company))}'>Edit</button>
              <button class="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20" data-company-delete="${company.id}">Delete</button>
            </div>
          </div>
          <p class="mt-3 text-sm text-slate-300">Skills: ${(company.requiredSkills || []).join(", ")}</p>
        </div>
      `
    )
    .join("");

  tnpCompanyList.querySelectorAll("[data-company-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const company = JSON.parse(decodeURIComponent(button.dataset.companyEdit));
      fillForm(companyForm, company);
      companyForm.elements.companyId.value = company.id;
    });
  });

  tnpCompanyList.querySelectorAll("[data-company-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await apiRequest(`/companies/${button.dataset.companyDelete}`, { method: "DELETE", body: JSON.stringify({}) });
        showMessage("Company deleted.");
        await loadTnpData();
      } catch (error) {
        showMessage(error.message, "error");
      }
    });
  });
}

function renderAnalytics(overview) {
  document.getElementById("metricTotalStudents").textContent = overview.totalStudents;
  document.getElementById("metricReadyStudents").textContent = overview.readyForPlacement;
  document.getElementById("metricAveragePlacement").textContent = `${overview.averagePlacementProbability}%`;
  document.getElementById("metricTotalCompanies").textContent = overview.totalCompanies;

  const distribution = Object.entries(overview.roleDistribution || {});
  document.getElementById("roleDistribution").innerHTML =
    distribution.length > 0
      ? distribution
          .map(
            ([role, count]) => `
              <div class="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <span>${role}</span>
                <span class="font-bold text-white">${count}</span>
              </div>
            `
          )
          .join("")
      : "Role distribution will appear here.";

  const total = Number(overview.totalStudents || 0);
  const ready = Number(overview.readyForPlacement || 0);
  const warm = Math.max(total - ready, 0);
  const warmLeads = Math.round(warm * 0.6);
  const needsWork = Math.max(total - ready - warmLeads, 0);

  if (tnpFunnel) {
    const funnelRows = [
      {
        label: "Placement Ready",
        value: ready,
        width: total ? (ready / total) * 100 : 0,
        color: "from-emerald-400 to-emerald-500",
      },
      {
        label: "Warm Pipeline",
        value: warmLeads,
        width: total ? (warmLeads / total) * 100 : 0,
        color: "from-cyan-400 to-sky-500",
      },
      {
        label: "Needs Improvement",
        value: needsWork,
        width: total ? (needsWork / total) * 100 : 0,
        color: "from-orange-400 to-orange-500",
      },
    ];

    tnpFunnel.innerHTML = funnelRows
      .map(
        (row) => `
          <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-white">${row.label}</p>
              <span class="text-sm text-slate-300">${row.value}</span>
            </div>
            <div class="mt-3 h-3 rounded-full bg-slate-800">
              <div class="h-3 rounded-full bg-gradient-to-r ${row.color}" style="width:${Math.max(row.width, 8)}%"></div>
            </div>
          </div>
        `
      )
      .join("");
  }
}

function renderCompanyBoard(board) {
  const container = document.getElementById("companyMatchBoard");
  if (!board.length) {
    container.innerHTML = "No company match board data available.";
    return;
  }

  container.innerHTML = `
    <table class="min-w-full overflow-hidden rounded-2xl border border-slate-800">
      <thead class="bg-slate-900">
        <tr>
          <th class="px-4 py-3 text-left">Student</th>
          <th class="px-4 py-3 text-left">Prediction</th>
          <th class="px-4 py-3 text-left">Top Matches</th>
        </tr>
      </thead>
      <tbody>
        ${board
          .map(
            (item) => `
              <tr class="border-t border-slate-800">
                <td class="px-4 py-3">${item.name}<div class="text-xs text-slate-400">${item.email}</div></td>
                <td class="px-4 py-3">${item.prediction?.placementProbability || 0}%</td>
                <td class="px-4 py-3">${(item.topMatches || []).map((match) => `${match.name} (${match.matchScore})`).join(", ")}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
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
  topBarName.textContent = currentProfile.name;
  topBarEmail.textContent = currentProfile.email;
  settingsNameInput.value = currentProfile.name || "";
  settingsDepartmentInput.value = currentProfile.department || "";
  renderAvatar(currentProfile);
  showMessage("Profile settings updated.");
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

function handleAvatarUpload(file) {
  if (!file || !currentProfile) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    showMessage("Please choose an image file.", "error");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showMessage("Profile photo size limit is 2 MB.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem(getAvatarStorageKey(currentProfile.uid), reader.result);
    renderAvatar(currentProfile);
    showMessage("Profile photo updated.");
  };
  reader.readAsDataURL(file);
}

async function loadStudentData() {
  const [dashboard, matches] = await Promise.all([
    apiRequest("/students/me"),
    apiRequest("/companies/matches"),
  ]);

  fillForm(studentProfileForm, dashboard.data.studentProfile || {});
  renderPrediction(dashboard.data.prediction);
  renderResumeAnalysis(dashboard.data.resumeAnalysis);
  renderCompanyMatches(matches.matches);
  renderStudentInsights(
    dashboard.data.studentProfile || {},
    dashboard.data.prediction,
    dashboard.data.resumeAnalysis,
    matches.matches
  );
}

async function loadFacultyData() {
  const response = await apiRequest("/students");
  facultyStudentsCache = response.students;
  renderFacultyTable(filterAndSortStudents(response.students));
}

async function loadTnpData() {
  const [overview, board, students, companies] = await Promise.all([
    apiRequest("/analytics/overview"),
    apiRequest("/companies/board"),
    apiRequest("/students"),
    apiRequest("/companies"),
  ]);
  tnpStudentsCache = students.students;
  tnpCompaniesCache = companies.companies;
  renderAnalytics(overview.overview);
  renderCompanyBoard(board.board);
  renderGroupingBoard(tnpStudentsCache);
  renderCompanyList(tnpCompaniesCache);
}

studentProfileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = Object.fromEntries(new FormData(studentProfileForm).entries());
    await apiRequest("/students/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    showMessage("Student profile saved.");
    await loadStudentData();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

resumeUploadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (!resumeFileInput.files.length) {
      throw new Error("Choose a PDF or DOCX resume first.");
    }

    const formData = new FormData();
    formData.append("resume", resumeFileInput.files[0]);

    const response = await apiRequest("/resume", {
      method: "POST",
      body: formData,
    });

    renderResumeAnalysis(response.analysis);
    showMessage("Resume analyzed successfully.");
    await loadStudentData();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

predictionButton?.addEventListener("click", async () => {
  try {
    const response = await apiRequest("/predictions", {
      method: "POST",
      body: JSON.stringify({}),
    });
    renderPrediction(response.prediction);
    showMessage("Prediction generated successfully.");
    await loadStudentData();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

facultyEditForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = Object.fromEntries(new FormData(facultyEditForm).entries());
    const studentId = payload.studentId || selectedStudentId;
    if (!studentId) {
      throw new Error("Select a student first.");
    }

    delete payload.studentId;
    await apiRequest(`/students/${studentId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    showMessage("Student record updated.");
    await loadFacultyData();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

refreshFacultyData?.addEventListener("click", async () => {
  try {
    await loadFacultyData();
    showMessage("Faculty dashboard refreshed.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

facultySearchInput?.addEventListener("input", () => {
  renderFacultyTable(filterAndSortStudents(facultyStudentsCache));
});

facultyStatusFilter?.addEventListener("change", () => {
  renderFacultyTable(filterAndSortStudents(facultyStudentsCache));
});

facultySortSelect?.addEventListener("change", () => {
  renderFacultyTable(filterAndSortStudents(facultyStudentsCache));
});

facultyExportButton?.addEventListener("click", () => {
  const rows = [
    ["Name", "Email", "CGPA", "Probability", "Application Status", "Interview Status", "Pipeline Stage"],
    ...filterAndSortStudents(facultyStudentsCache).map((student) => [
      student.name,
      student.email,
      student.profile?.cgpa || "",
      student.prediction?.placementProbability || "",
      student.profile?.applicationStatus || "Not Applied",
      student.profile?.interviewStatus || "Not Scheduled",
      student.profile?.pipelineStage || "Shortlist",
    ]),
  ];
  downloadCsv("faculty-students.csv", rows);
});

companyForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = Object.fromEntries(new FormData(companyForm).entries());
    const companyId = payload.companyId;
    delete payload.companyId;
    const method = companyId ? "PATCH" : "POST";
    const path = companyId ? `/companies/${companyId}` : "/companies";
    await apiRequest(path, {
      method,
      body: JSON.stringify(payload),
    });
    companyForm.reset();
    companyForm.elements.companyId.value = "";
    showMessage("Company saved successfully.");
    await loadTnpData();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

tnpExportStudentsButton?.addEventListener("click", () => {
  const rows = [
    ["Name", "Email", "Department", "CGPA", "Predicted Role", "Probability", "Application Status", "Interview Status", "Pipeline Stage"],
    ...tnpStudentsCache.map((student) => [
      student.name,
      student.email,
      student.department || student.profile?.department || "",
      student.profile?.cgpa || "",
      student.prediction?.predictedRole || "",
      student.prediction?.placementProbability || "",
      student.profile?.applicationStatus || "Not Applied",
      student.profile?.interviewStatus || "Not Scheduled",
      student.profile?.pipelineStage || "Shortlist",
    ]),
  ];
  downloadCsv("tnp-students.csv", rows);
});

logoutButton.addEventListener("click", async () => {
  if (auth) {
    await signOut(auth);
  }
  window.location.href = "/login";
});

settingsButton?.addEventListener("click", openSettingsPanel);
closeSettingsButton?.addEventListener("click", closeSettingsPanel);

themeOptions.forEach((button) => {
  button.addEventListener("click", () => {
    const settings = {
      theme: button.dataset.theme,
      compactMode: compactModeToggle.checked,
    };
    saveSettings(settings);
    applyTheme(settings.theme);
  });
});

compactModeToggle?.addEventListener("change", () => {
  const settings = {
    theme: readSettings().theme || "dark",
    compactMode: compactModeToggle.checked,
  };
  saveSettings(settings);
  applyCompactMode(settings.compactMode);
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

avatarInput?.addEventListener("change", (event) => {
  handleAvatarUpload(event.target.files?.[0]);
});

if (!hasFirebaseConfig()) {
  showMessage(
    "Firebase web config is missing. Update frontend/js/config.js before using the dashboard.",
    "error"
  );
}

if (!auth) {
  showMessage("Firebase auth is not initialized. Please configure the frontend first.", "error");
} else {
  applyStoredSettings();
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await apiRequest("/auth/me");
      const profile = response.profile;
      currentProfile = profile;
      topBarName.textContent = profile.name;
      topBarEmail.textContent = profile.email;
      roleBadge.textContent = profile.role.toUpperCase();
      settingsNameInput.value = profile.name || "";
      settingsDepartmentInput.value = profile.department || "";
      renderAvatar(profile);

      hideAllSections();

      if (profile.role === "student") {
        studentSection.classList.remove("hidden");
        await loadStudentData();
      } else if (profile.role === "faculty") {
        facultySection.classList.remove("hidden");
        await loadFacultyData();
      } else if (profile.role === "tnp") {
        tnpSection.classList.remove("hidden");
        await loadTnpData();
      } else {
        showMessage("Unsupported role. Update your Firestore user role.", "error");
      }
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}
