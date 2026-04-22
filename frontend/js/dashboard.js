import {
  auth,
  hasFirebaseConfig,
  onAuthStateChanged,
  signOut,
} from "./firebase.js";
import { apiRequest } from "./api.js";
import { readSettings } from "./shared/preferences.js";
import { renderAvatar, storeAvatarFromFile } from "./shared/avatar.js";
import { createMessagePresenter } from "./shared/messages.js";
import { fillForm, formatPercentage, downloadCsv } from "./shared/forms.js";
import { applyDashboardTheme } from "./shared/themes.js";

const globalMessage = document.getElementById("globalMessage");
const roleBadge = document.getElementById("roleBadge");
const logoutButton = document.getElementById("logoutButton");
const topBarName = document.getElementById("topBarName");
const topBarEmail = document.getElementById("topBarEmail");
const settingsButton = document.getElementById("settingsButton");
const breadcrumbRole = document.getElementById("breadcrumbRole");
const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");
const dashboardBackdrop = document.getElementById("dashboardBackdrop");
const dashboardBody = document.getElementById("dashboardBody");
const topBar = document.getElementById("topBar");
const sidebar = document.getElementById("sidebar");
const mainPanel = document.getElementById("mainPanel");
const avatarInput = document.getElementById("avatarInput");
const avatarImage = document.getElementById("avatarImage");
const avatarInitials = document.getElementById("avatarInitials");

const studentSection = document.getElementById("studentSection");
const facultySection = document.getElementById("facultySection");
const tnpSection = document.getElementById("tnpSection");

const studentProfileForm = document.getElementById("studentProfileForm");
const resumeUploadForm = document.getElementById("resumeUploadForm");
const resumeFileInput = document.getElementById("resumeFile");
const resumeDropzone = document.getElementById("resumeDropzone");
const resumeFileName = document.getElementById("resumeFileName");
const resumeUploadProgress = document.getElementById("resumeUploadProgress");
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
const workspaceNav = document.getElementById("workspaceNav");
const tnpYearFilter = document.getElementById("tnpYearFilter");
const tnpDepartmentFilter = document.getElementById("tnpDepartmentFilter");
const placementTrendChart = document.getElementById("placementTrendChart");
const branchWiseChart = document.getElementById("branchWiseChart");
const sectorDistributionChart = document.getElementById("sectorDistributionChart");
const tnpOutcomeTable = document.getElementById("tnpOutcomeTable");
const tnpOutcomeForm = document.getElementById("tnpOutcomeForm");
const tnpSelectedStudent = document.getElementById("tnpSelectedStudent");
const tnpExportTrainingButton = document.getElementById("tnpExportTrainingButton");
const tnpRetrainButton = document.getElementById("tnpRetrainButton");
const tnpTrainingStatus = document.getElementById("tnpTrainingStatus");
const tnpOutcomeSummary = document.getElementById("tnpOutcomeSummary");
const tnpModelPerformance = document.getElementById("tnpModelPerformance");
const tnpRetrainHistory = document.getElementById("tnpRetrainHistory");
const tnpPredictionActualTable = document.getElementById("tnpPredictionActualTable");
const metricAveragePackage = document.getElementById("metricAveragePackage");

let selectedStudentId = "";
let selectedTnpStudentId = "";
let currentProfile = null;
let facultyStudentsCache = [];
let tnpStudentsCache = [];
let tnpCompaniesCache = [];
const showMessage = createMessagePresenter(globalMessage, "mb-6");

function applyTheme(theme) {
  applyDashboardTheme(theme, {
    backdrop: dashboardBackdrop,
    body: dashboardBody,
    mainPanel,
    topBar,
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
    ...readSettings(),
  };

  applyTheme(settings.theme);
  applyCompactMode(Boolean(settings.compactMode));
}

function hideAllSections() {
  studentSection.classList.add("hidden");
  facultySection.classList.add("hidden");
  tnpSection.classList.add("hidden");
}

function setButtonLoading(button, loadingText) {
  if (!button) {
    return () => {};
  }

  const originalHtml = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span class="inline-flex items-center gap-2"><span class="loading-spinner"></span><span>${loadingText}</span></span>`;

  return () => {
    button.disabled = false;
    button.innerHTML = originalHtml;
  };
}

function setContainerLoading(element, message = "Loading...") {
  if (!element) {
    return;
  }

  element.innerHTML = `
    <div class="loading-pulse rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-5">
      <div class="flex items-center gap-3">
        <span class="loading-spinner"></span>
        <span>${message}</span>
      </div>
    </div>
  `;
}

function buildEmptyState(title, description) {
  return `
    <div class="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-5">
      <p class="font-semibold text-white">${title}</p>
      <p class="mt-2 text-sm leading-6 text-slate-300">${description}</p>
    </div>
  `;
}

function average(values) {
  const numericValues = values.map(Number).filter((value) => Number.isFinite(value));
  if (!numericValues.length) {
    return 0;
  }
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function getStudentDepartment(student) {
  return student.profile?.department || student.department || "Unassigned";
}

function getStudentYear(student) {
  return String(student.profile?.graduationYear || "Unassigned");
}

function classifyCompanySector(company) {
  const text = `${company.role || ""} ${company.name || ""}`.toLowerCase();
  if (/(data|analyst|analytics|machine|ai|ml)/.test(text)) {
    return "Data / AI";
  }
  if (/(software|developer|web|frontend|backend|full stack)/.test(text)) {
    return "Software";
  }
  if (/(cloud|devops|security|network|infra)/.test(text)) {
    return "Cloud / Infra";
  }
  if (/(sales|business|consult|product|marketing)/.test(text)) {
    return "Business";
  }
  return "Other";
}

function validateScoreInputs(form) {
  const ranges = [
    ["aptitudeScore", "Aptitude Score", 0, 100],
    ["softSkillsScore", "Soft Skills Score", 0, 100],
    ["resumeScore", "Resume Score", 0, 100],
  ];

  for (const [name, label, min, max] of ranges) {
    const element = form?.elements?.[name];
    if (!element || element.value === "") {
      continue;
    }

    const value = Number(element.value);
    if (Number.isNaN(value) || value < min || value > max) {
      throw new Error(`${label} must be between ${min} and ${max}.`);
    }
  }
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
    predictionResult.innerHTML = buildEmptyState(
      "Prediction pending",
      "Save profile scores and run the prediction engine to see placement probability, confidence, and role fit."
    );
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
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Confidence Score</p>
        <p class="mt-2 text-2xl font-black text-white">${prediction.confidenceScore || 0}%</p>
        <p class="mt-2 text-sm text-slate-300">Strength of the model's current placement call.</p>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Role Confidence</p>
        <p class="mt-2 text-2xl font-black text-white">${prediction.roleConfidence || 0}%</p>
        <p class="mt-2 text-sm text-slate-300">Classifier confidence for the predicted role.</p>
      </div>
    </div>
    <div class="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p class="font-semibold text-white">Improvement Suggestions</p>
      <ul class="mt-3 space-y-2 text-slate-300">
        ${prediction.improvementSuggestions.map((item) => `<li>- ${item}</li>`).join("")}
      </ul>
    </div>
    <div class="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p class="font-semibold text-white">Explain Why</p>
      <ul class="mt-3 space-y-2 text-slate-300">
        ${(prediction.explainWhy || []).map((item) => `<li>- ${item}</li>`).join("") || "<li>- Add more academic and project signals for a richer explanation.</li>"}
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
    resumeAnalysisResult.innerHTML = buildEmptyState(
      "Resume feedback pending",
      "Upload and analyze a resume to see ATS score, extracted content, and improvement suggestions."
    );
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
    studentCompanyMatches.innerHTML = buildEmptyState(
      "No company matches yet",
      "Save your profile and generate a prediction first so the recommendation engine can score skill fit and eligibility."
    );
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
              <p class="mt-2 text-sm leading-6 text-slate-400">${match.recommendationReason || "Recommendation is based on current profile fit and eligibility."}</p>
              ${
                Number(match.historicalPlacements || 0) > 0
                  ? `<p class="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">${match.historicalPlacements} prior placements from your institution</p>`
                  : ""
              }
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderFacultyTable(students) {
  if (!students.length) {
    facultyStudentTable.innerHTML = buildEmptyState(
      "No students found",
      "Student records will appear here once learners register and save their profile data."
    );
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

  if (!Object.keys(grouped).length) {
    tnpGroupingBoard.innerHTML = buildEmptyState(
      "No role groups yet",
      "Predicted-role grouping will appear here after students generate predictions."
    );
    return;
  }

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
  if (!companies.length) {
    tnpCompanyList.innerHTML = buildEmptyState(
      "No companies added",
      "Add a company here to start matching students against eligibility rules."
    );
    return;
  }

  tnpCompanyList.innerHTML = companies
    .map(
      (company) => `
        <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="font-semibold text-white">${company.name}</p>
              <p class="mt-1 text-sm text-slate-400">${company.role} - ${company.packageLpa} LPA</p>
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

function buildWorkspaceItems(role) {
  if (role === "student") {
    return [
      { label: "Dashboard", targetId: "studentOverviewPanel" },
      { label: "Resume Analyzer", targetId: "resumeUploadForm" },
      { label: "Applications", targetId: "studentCompanyPanel" },
      { label: "Analytics", targetId: "studentPredictionPanel" },
      { label: "Profile", targetId: "studentProfileForm" },
    ];
  }

  if (role === "faculty") {
    return [
      { label: "Dashboard", targetId: "facultyOverviewPanel" },
      { label: "Applications", targetId: "facultyStudentTable" },
      { label: "Analytics", targetId: "facultyOverviewPanel" },
      { label: "Profile", targetId: "facultyEditForm" },
    ];
  }

  if (role === "tnp") {
    return [
      { label: "Dashboard", targetId: "tnpOverviewPanel" },
      { label: "Applications", targetId: "tnpOutcomePanel" },
      { label: "Analytics", targetId: "tnpAnalyticsPanel" },
      { label: "Resume Analyzer", targetId: "tnpTrainingPanel" },
      { label: "Profile", targetId: "tnpCompanyFormPanel" },
    ];
  }

  return [];
}

function renderWorkspaceNav(role) {
  if (!workspaceNav) {
    return;
  }

  const items = buildWorkspaceItems(role);
  if (breadcrumbRole) {
    breadcrumbRole.textContent = role.toUpperCase();
  }
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = items[0]?.label || "Dashboard";
  }
  workspaceNav.innerHTML = items
    .map(
      (item, index) => `
        <button
          type="button"
          class="workspace-nav-item w-full rounded-2xl px-4 py-3 text-left transition ${
            index === 0 ? "bg-cyan-400/10 text-cyan-200" : "bg-white/5 text-slate-300 hover:bg-white/10"
          }"
          data-target-id="${item.targetId}"
        >
          ${item.label}
        </button>
      `
    )
    .join("");

  workspaceNav.querySelectorAll(".workspace-nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.targetId);
      if (!target) {
        return;
      }

      workspaceNav.querySelectorAll(".workspace-nav-item").forEach((item) => {
        item.classList.remove("bg-cyan-400/10", "text-cyan-200");
        item.classList.add("bg-white/5", "text-slate-300");
      });
      button.classList.remove("bg-white/5", "text-slate-300");
      button.classList.add("bg-cyan-400/10", "text-cyan-200");
      if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = button.textContent.trim();
      }

      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderOutcomeSummary(students) {
  if (!tnpOutcomeSummary) {
    return;
  }

  const labeledStudents = students.filter(
    (student) => typeof student.profile?.placed === "boolean"
  );
  const placedStudents = labeledStudents.filter((student) => student.profile?.placed).length;
  const notPlacedStudents = labeledStudents.filter(
    (student) => student.profile?.placed === false
  ).length;
  const unlabeledStudents = Math.max(students.length - labeledStudents.length, 0);

  tnpOutcomeSummary.innerHTML = `
    <div class="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-white">Labeled Outcomes</p>
        <span class="text-sm text-slate-300">${labeledStudents.length}/${students.length}</span>
      </div>
      <p class="mt-2 text-sm text-slate-300">These students are ready to be exported into the local training CSV.</p>
    </div>
    <div class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Placed</p>
        <p class="mt-2 text-2xl font-black text-white">${placedStudents}</p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Not Placed</p>
        <p class="mt-2 text-2xl font-black text-white">${notPlacedStudents}</p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4">
        <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Need Label</p>
        <p class="mt-2 text-2xl font-black text-white">${unlabeledStudents}</p>
      </div>
    </div>
  `;
}

function renderOutcomeTable(students) {
  if (!tnpOutcomeTable) {
    return;
  }

  if (!students.length) {
    tnpOutcomeTable.innerHTML = buildEmptyState(
      "No student outcomes yet",
      "Once students are available, you can mark them placed or not placed and use those outcomes for retraining."
    );
    return;
  }

  tnpOutcomeTable.innerHTML = `
    <table class="min-w-full overflow-hidden rounded-2xl border border-slate-800">
      <thead class="bg-slate-900">
        <tr>
          <th class="px-4 py-3 text-left">Student</th>
          <th class="px-4 py-3 text-left">Predicted</th>
          <th class="px-4 py-3 text-left">Outcome</th>
          <th class="px-4 py-3 text-left">Company</th>
          <th class="px-4 py-3 text-left">Action</th>
        </tr>
      </thead>
      <tbody>
        ${students
          .map((student) => {
            const placed = student.profile?.placed;
            const outcomeLabel =
              typeof placed === "boolean" ? (placed ? "Placed" : "Not Placed") : "Pending";
            const outcomeClass =
              typeof placed !== "boolean"
                ? "bg-slate-500/15 text-slate-200"
                : placed
                  ? "bg-emerald-500/15 text-emerald-200"
                  : "bg-red-500/15 text-red-200";

            return `
              <tr class="border-t border-slate-800">
                <td class="px-4 py-3">
                  <div class="font-semibold text-white">${student.name || "-"}</div>
                  <div class="text-xs text-slate-400">${student.email || "-"}</div>
                </td>
                <td class="px-4 py-3">
                  <div>${student.prediction?.predictedRole || "-"}</div>
                  <div class="text-xs text-slate-400">${student.prediction?.placementProbability || 0}% probability</div>
                </td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-3 py-1 text-xs font-semibold ${outcomeClass}">${outcomeLabel}</span>
                  <div class="mt-2 text-xs text-slate-400">${student.profile?.finalRole || "Final role pending"}</div>
                </td>
                <td class="px-4 py-3">
                  <div>${student.profile?.placedCompany || "-"}</div>
                  <div class="text-xs text-slate-400">${student.profile?.placementDate || "Date pending"}</div>
                </td>
                <td class="px-4 py-3">
                  <button
                    class="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                    data-tnp-student='${encodeURIComponent(JSON.stringify(student))}'
                  >
                    Manage
                  </button>
                </td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;

  tnpOutcomeTable.querySelectorAll("button[data-tnp-student]").forEach((button) => {
    button.addEventListener("click", () => {
      const student = JSON.parse(decodeURIComponent(button.dataset.tnpStudent));
      selectedTnpStudentId = student.uid;
      if (!tnpOutcomeForm) {
        return;
      }

      tnpOutcomeForm.elements.studentId.value = student.uid;
      fillForm(tnpOutcomeForm, {
        placed:
          typeof student.profile?.placed === "boolean"
            ? String(student.profile.placed)
            : "true",
        placementDate: student.profile?.placementDate || "",
        finalRole: student.profile?.finalRole || student.prediction?.predictedRole || "",
        finalSalaryLpa:
          student.profile?.finalSalaryLpa || student.prediction?.expectedSalaryLpa || "",
        placedCompany: student.profile?.placedCompany || "",
        finalOutcomeNotes: student.profile?.finalOutcomeNotes || "",
      });
      tnpSelectedStudent.textContent = `Updating placement outcome for ${student.name} (${student.email})`;
    });
  });
}

function updateTrainingStatus(content) {
  if (tnpTrainingStatus) {
    tnpTrainingStatus.innerHTML = content;
  }
}

function populateTnpFilters(students) {
  if (!tnpYearFilter || !tnpDepartmentFilter) {
    return;
  }

  const selectedYear = tnpYearFilter.value || "all";
  const selectedDepartment = tnpDepartmentFilter.value || "all";
  const years = [...new Set(students.map(getStudentYear))].filter(Boolean).sort();
  const departments = [...new Set(students.map(getStudentDepartment))].filter(Boolean).sort();

  tnpYearFilter.innerHTML = [
    `<option value="all">All years</option>`,
    ...years.map((year) => `<option value="${year}">${year}</option>`),
  ].join("");
  tnpDepartmentFilter.innerHTML = [
    `<option value="all">All departments</option>`,
    ...departments.map((department) => `<option value="${department}">${department}</option>`),
  ].join("");

  tnpYearFilter.value = years.includes(selectedYear) ? selectedYear : "all";
  tnpDepartmentFilter.value = departments.includes(selectedDepartment) ? selectedDepartment : "all";
}

function getFilteredTnpStudents() {
  const selectedYear = tnpYearFilter?.value || "all";
  const selectedDepartment = tnpDepartmentFilter?.value || "all";

  return tnpStudentsCache.filter((student) => {
    const matchesYear = selectedYear === "all" || getStudentYear(student) === selectedYear;
    const matchesDepartment =
      selectedDepartment === "all" || getStudentDepartment(student) === selectedDepartment;
    return matchesYear && matchesDepartment;
  });
}

function renderLineChart(container, points) {
  if (!container) {
    return;
  }

  if (!points.length) {
    container.innerHTML = buildEmptyState("No trend data", "Add student outcomes to build a placement trend.");
    return;
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const width = 320;
  const height = 150;
  const path = points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - (point.value / maxValue) * (height - 24) - 12;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="h-44 w-full overflow-visible" role="img" aria-label="Placement trend chart">
      <path d="${path}" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
      ${points
        .map((point, index) => {
          const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
          const y = height - (point.value / maxValue) * (height - 24) - 12;
          return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#f97316"></circle><text x="${x.toFixed(1)}" y="${height - 1}" text-anchor="middle" class="fill-slate-400 text-[10px]">${point.label}</text></g>`;
        })
        .join("")}
    </svg>
  `;
}

function renderBarChart(container, items) {
  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = buildEmptyState("No branch data", "Department-wise analytics appear after students save profiles.");
    return;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);
  container.innerHTML = `
    <div class="flex h-44 items-end gap-3">
      ${items
        .slice(0, 6)
        .map(
          (item) => `
            <div class="flex flex-1 flex-col items-center gap-2">
              <div class="flex h-32 w-full items-end rounded-xl bg-slate-900/70 px-2 py-2">
                <div class="pm-chart-bar w-full rounded-lg bg-gradient-to-t from-blue-600 to-cyan-300" style="height:${Math.max(10, (item.value / maxValue) * 100)}%"></div>
              </div>
              <p class="line-clamp-1 text-center text-[11px] text-slate-400">${item.label}</p>
              <p class="text-xs font-bold text-white">${Math.round(item.value)}%</p>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderPieChart(container, items) {
  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = buildEmptyState("No company sectors", "Add companies to show sector distribution.");
    return;
  }

  const colors = ["#2563eb", "#14b8a6", "#f97316", "#22c55e", "#6366f1"];
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = 0;
  const gradient = items
    .map((item, index) => {
      const start = cursor;
      const end = cursor + (item.value / total) * 100;
      cursor = end;
      return `${colors[index % colors.length]} ${start}% ${end}%`;
    })
    .join(", ");

  container.innerHTML = `
    <div class="grid gap-4 sm:grid-cols-[150px_1fr] sm:items-center">
      <div class="mx-auto h-36 w-36 rounded-full shadow-2xl shadow-black/20" style="background: conic-gradient(${gradient})"></div>
      <div class="space-y-2">
        ${items
          .map(
            (item, index) => `
              <div class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span class="flex items-center gap-2 text-sm text-slate-300"><span class="h-2.5 w-2.5 rounded-full" style="background:${colors[index % colors.length]}"></span>${item.label}</span>
                <span class="text-sm font-bold text-white">${item.value}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderTnpDerivedAnalytics(students, companies) {
  const total = students.length;
  const ready = students.filter((student) => Number(student.prediction?.placementProbability || 0) >= 70).length;
  const placed = students.filter((student) => student.profile?.placed).length;
  const notPlaced = students.filter((student) => student.profile?.placed === false).length;
  const packageValues = students
    .map((student) => Number(student.profile?.finalSalaryLpa || 0))
    .filter(Boolean);
  const averagePackage =
    packageValues.length > 0
      ? average(packageValues)
      : average(companies.map((company) => Number(company.packageLpa || 0)).filter(Boolean));
  const probabilities = students
    .map((student) => Number(student.prediction?.placementProbability || 0))
    .filter(Boolean);

  document.getElementById("metricTotalStudents").textContent = total;
  document.getElementById("metricReadyStudents").textContent = ready;
  document.getElementById("metricAveragePlacement").textContent = `${Math.round(average(probabilities))}%`;
  document.getElementById("metricTotalCompanies").textContent = companies.length;
  if (metricAveragePackage) {
    metricAveragePackage.textContent = `${averagePackage.toFixed(1)}L`;
  }
  document.getElementById("metricPlacedStudents").textContent = placed;
  document.getElementById("metricNotPlacedStudents").textContent = notPlaced;

  const byYear = students.reduce((accumulator, student) => {
    const year = getStudentYear(student);
    accumulator[year] = accumulator[year] || { label: year, value: 0 };
    if (student.profile?.placed) {
      accumulator[year].value += 1;
    }
    return accumulator;
  }, {});
  renderLineChart(placementTrendChart, Object.values(byYear).sort((a, b) => a.label.localeCompare(b.label)));

  const byDepartment = students.reduce((accumulator, student) => {
    const department = getStudentDepartment(student);
    accumulator[department] = accumulator[department] || [];
    accumulator[department].push(Number(student.prediction?.placementProbability || 0));
    return accumulator;
  }, {});
  renderBarChart(
    branchWiseChart,
    Object.entries(byDepartment).map(([label, values]) => ({ label, value: average(values) }))
  );

  const bySector = companies.reduce((accumulator, company) => {
    const sector = classifyCompanySector(company);
    accumulator[sector] = (accumulator[sector] || 0) + 1;
    return accumulator;
  }, {});
  renderPieChart(
    sectorDistributionChart,
    Object.entries(bySector).map(([label, value]) => ({ label, value }))
  );
}

function renderRoleDistribution(students) {
  const container = document.getElementById("roleDistribution");
  if (!container) {
    return;
  }

  const distribution = students.reduce((accumulator, student) => {
    const role = student.prediction?.predictedRole || "Unassigned";
    accumulator[role] = (accumulator[role] || 0) + 1;
    return accumulator;
  }, {});
  const entries = Object.entries(distribution);
  container.innerHTML =
    entries.length > 0
      ? entries
          .map(
            ([role, count]) => `
              <div class="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <span>${role}</span>
                <span class="font-bold text-white">${count}</span>
              </div>
            `
          )
          .join("")
      : buildEmptyState("No role distribution yet", "Predicted roles will appear here after students generate predictions.");
}

function renderFilteredTnpViews() {
  const filteredStudents = getFilteredTnpStudents();
  renderTnpDerivedAnalytics(filteredStudents, tnpCompaniesCache);
  renderRoleDistribution(filteredStudents);
  renderGroupingBoard(filteredStudents);
  renderOutcomeSummary(filteredStudents);
  renderOutcomeTable(filteredStudents);
}

function renderModelPerformance(modelPerformance = {}, retrainingHistory = []) {
  if (tnpModelPerformance) {
    tnpModelPerformance.innerHTML = `
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Labeled Outcomes</p>
          <p class="mt-2 text-2xl font-black text-white">${modelPerformance.labeledOutcomes || 0}</p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Placement Accuracy</p>
          <p class="mt-2 text-2xl font-black text-white">${modelPerformance.placementAccuracy || 0}%</p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Role Accuracy</p>
          <p class="mt-2 text-2xl font-black text-white">${modelPerformance.roleAccuracy || 0}%</p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Salary MAE</p>
          <p class="mt-2 text-2xl font-black text-white">${modelPerformance.salaryMae || 0}</p>
        </div>
      </div>
    `;
  }

  if (tnpRetrainHistory) {
    tnpRetrainHistory.innerHTML = retrainingHistory.length
      ? retrainingHistory
          .map(
            (entry) => `
              <div class="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div class="flex items-center justify-between gap-3">
                  <p class="font-semibold text-white">${entry.type === "retrain" ? "Model Retrain" : "Training Event"}</p>
                  <span class="text-xs text-slate-400">${entry.createdAt || ""}</span>
                </div>
                <p class="mt-2 text-sm text-slate-300">Rows exported: ${entry.rowsExported || 0} | Rows trained: ${entry.rowsTrained || 0}</p>
                ${
                  entry.metrics
                    ? `<p class="mt-2 text-xs leading-5 text-slate-400">Placement train accuracy: ${entry.metrics.placementTrainAccuracy || 0}% | Role train accuracy: ${entry.metrics.roleTrainAccuracy || 0}% | Salary train MAE: ${entry.metrics.salaryTrainMae || 0}</p>`
                    : ""
                }
              </div>
            `
          )
          .join("")
      : buildEmptyState(
          "No retrain history yet",
          "Run the retrain action once labeled outcomes are exported to build a local learning trail."
        );
  }

  if (tnpPredictionActualTable) {
    const comparisons = modelPerformance.predictionVsActual || [];
    tnpPredictionActualTable.innerHTML = comparisons.length
      ? `
        <table class="min-w-full overflow-hidden rounded-2xl border border-slate-800">
          <thead class="bg-slate-900">
            <tr>
              <th class="px-4 py-3 text-left">Student</th>
              <th class="px-4 py-3 text-left">Predicted Role</th>
              <th class="px-4 py-3 text-left">Actual Role</th>
              <th class="px-4 py-3 text-left">Placement</th>
              <th class="px-4 py-3 text-left">Salary</th>
            </tr>
          </thead>
          <tbody>
            ${comparisons
              .map(
                (item) => `
                  <tr class="border-t border-slate-800">
                    <td class="px-4 py-3">${item.name}<div class="text-xs text-slate-400">${item.email}</div></td>
                    <td class="px-4 py-3">${item.predictedRole}</td>
                    <td class="px-4 py-3">${item.actualRole}</td>
                    <td class="px-4 py-3">${item.actualPlacement ? "Placed" : "Not Placed"}<div class="text-xs text-slate-400">${item.placementProbability}% predicted</div></td>
                    <td class="px-4 py-3">${item.expectedSalaryLpa || 0} / ${item.actualSalaryLpa || 0} LPA</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `
      : buildEmptyState(
          "No comparisons available yet",
          "Mark final outcomes for students to compare predicted roles and salaries against actual results."
        );
  }
}

function renderAnalytics(overview) {
  document.getElementById("metricTotalStudents").textContent = overview.totalStudents;
  document.getElementById("metricReadyStudents").textContent = overview.readyForPlacement;
  document.getElementById("metricAveragePlacement").textContent = `${overview.averagePlacementProbability}%`;
  document.getElementById("metricTotalCompanies").textContent = overview.totalCompanies;
  document.getElementById("metricPlacedStudents").textContent = overview.placedStudents || 0;
  document.getElementById("metricNotPlacedStudents").textContent = overview.notPlacedStudents || 0;

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

  renderModelPerformance(overview.modelPerformance, overview.retrainingHistory || []);
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

async function handleAvatarUpload(file) {
  if (!file || !currentProfile) {
    return;
  }

  try {
    await storeAvatarFromFile(currentProfile, file);
    renderAvatar(currentProfile, avatarImage, avatarInitials);
    showMessage("Profile photo updated.");
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function loadStudentData() {
  setContainerLoading(predictionResult, "Loading your latest prediction...");
  setContainerLoading(resumeAnalysisResult, "Loading resume insights...");
  setContainerLoading(studentCompanyMatches, "Loading company recommendations...");
  if (studentReadinessChart) {
    setContainerLoading(studentReadinessChart, "Refreshing readiness metrics...");
  }
  if (studentTimeline) {
    setContainerLoading(studentTimeline, "Preparing your action timeline...");
  }

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
  setContainerLoading(facultyStudentTable, "Loading student records...");
  const response = await apiRequest("/students");
  facultyStudentsCache = response.students;
  renderFacultyTable(filterAndSortStudents(response.students));
}

async function loadTnpData() {
  setContainerLoading(tnpFunnel, "Loading placement analytics...");
  setContainerLoading(tnpGroupingBoard, "Grouping students by predicted role...");
  setContainerLoading(tnpCompanyList, "Loading company records...");
  setContainerLoading(tnpOutcomeTable, "Loading labeled student outcomes...");
  setContainerLoading(tnpModelPerformance, "Computing model performance...");
  setContainerLoading(tnpRetrainHistory, "Loading retrain history...");
  setContainerLoading(tnpPredictionActualTable, "Loading prediction comparisons...");
  if (tnpOutcomeSummary) {
    setContainerLoading(tnpOutcomeSummary, "Checking training readiness...");
  }

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
  populateTnpFilters(tnpStudentsCache);
  renderCompanyList(tnpCompaniesCache);
  renderFilteredTnpViews();
}

studentProfileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const stopLoading = setButtonLoading(
    studentProfileForm.querySelector("button[type='submit']"),
    "Saving profile..."
  );
  try {
    validateScoreInputs(studentProfileForm);
    const payload = Object.fromEntries(new FormData(studentProfileForm).entries());
    await apiRequest("/students/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    showMessage("Student profile saved.");
    await loadStudentData();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    stopLoading();
  }
});

function updateResumeFileUi(file) {
  if (resumeFileName) {
    resumeFileName.textContent = file
      ? `${file.name} selected`
      : "or click to choose a PDF/DOCX file";
  }
  if (resumeUploadProgress) {
    resumeUploadProgress.style.width = file ? "18%" : "0%";
  }
}

resumeFileInput?.addEventListener("change", () => {
  updateResumeFileUi(resumeFileInput.files?.[0]);
});

["dragenter", "dragover"].forEach((eventName) => {
  resumeDropzone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    resumeDropzone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  resumeDropzone?.addEventListener(eventName, (event) => {
    event.preventDefault();
    resumeDropzone.classList.remove("is-dragging");
  });
});

resumeDropzone?.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files?.[0];
  if (!file || !resumeFileInput) {
    return;
  }

  const transfer = new DataTransfer();
  transfer.items.add(file);
  resumeFileInput.files = transfer.files;
  updateResumeFileUi(file);
});

resumeUploadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const stopLoading = setButtonLoading(
    resumeUploadForm.querySelector("button[type='submit']"),
    "Analyzing resume..."
  );
  try {
    if (!resumeFileInput.files.length) {
      throw new Error("Choose a PDF or DOCX resume first.");
    }

    setContainerLoading(resumeAnalysisResult, "Analyzing resume content and ATS signals...");
    if (resumeUploadProgress) {
      resumeUploadProgress.style.width = "55%";
    }
    const formData = new FormData();
    formData.append("resume", resumeFileInput.files[0]);

    const response = await apiRequest("/resume", {
      method: "POST",
      body: formData,
    });

    renderResumeAnalysis(response.analysis);
    if (resumeUploadProgress) {
      resumeUploadProgress.style.width = "100%";
    }
    showMessage("Resume analyzed successfully.");
    await loadStudentData();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    stopLoading();
  }
});

predictionButton?.addEventListener("click", async () => {
  const stopLoading = setButtonLoading(predictionButton, "Predicting...");
  try {
    validateScoreInputs(studentProfileForm);
    setContainerLoading(predictionResult, "Generating placement forecast...");
    const response = await apiRequest("/predictions", {
      method: "POST",
      body: JSON.stringify({}),
    });
    renderPrediction(response.prediction);
    showMessage("Prediction generated successfully.");
    await loadStudentData();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    stopLoading();
  }
});

facultyEditForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const stopLoading = setButtonLoading(
    facultyEditForm.querySelector("button[type='submit']"),
    "Updating student..."
  );
  try {
    validateScoreInputs(facultyEditForm);
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
  } finally {
    stopLoading();
  }
});

refreshFacultyData?.addEventListener("click", async () => {
  const stopLoading = setButtonLoading(refreshFacultyData, "Refreshing...");
  try {
    await loadFacultyData();
    showMessage("Faculty dashboard refreshed.");
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    stopLoading();
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

tnpYearFilter?.addEventListener("change", () => {
  renderFilteredTnpViews();
});

tnpDepartmentFilter?.addEventListener("change", () => {
  renderFilteredTnpViews();
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
  const stopLoading = setButtonLoading(
    companyForm.querySelector("button[type='submit']"),
    "Saving company..."
  );
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
  } finally {
    stopLoading();
  }
});

tnpOutcomeForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const stopLoading = setButtonLoading(
    tnpOutcomeForm.querySelector("button[type='submit']"),
    "Saving outcome..."
  );
  try {
    const payload = Object.fromEntries(new FormData(tnpOutcomeForm).entries());
    const studentId = payload.studentId || selectedTnpStudentId;
    if (!studentId) {
      throw new Error("Select a student outcome to update first.");
    }

    delete payload.studentId;
    await apiRequest(`/students/${studentId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    showMessage("Student placement outcome saved.");
    updateTrainingStatus(`
      <div class="space-y-2">
        <p class="font-semibold text-white">Latest update saved</p>
        <p class="text-sm text-slate-300">The student outcome is stored in Firestore and will be included the next time you export training data.</p>
      </div>
    `);
    await loadTnpData();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    stopLoading();
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

tnpExportTrainingButton?.addEventListener("click", async () => {
  const stopLoading = setButtonLoading(tnpExportTrainingButton, "Exporting...");
  try {
    updateTrainingStatus(`
      <div class="space-y-2">
        <p class="font-semibold text-white">Preparing training export</p>
        <p class="text-sm text-slate-300">Collecting labeled Firestore outcomes and building a CSV for retraining.</p>
      </div>
    `);
    const response = await apiRequest("/analytics/export-training-data", {
      method: "POST",
      body: JSON.stringify({}),
    });
    updateTrainingStatus(`
      <div class="space-y-2">
        <p class="font-semibold text-white">Training CSV exported</p>
        <p class="text-sm text-slate-300">Reviewed ${response.studentsReviewed} students and exported ${response.rowsExported} labeled rows.</p>
        <p class="text-xs text-slate-400">${response.exportPath}</p>
      </div>
    `);
    showMessage("Training data exported successfully.");
  } catch (error) {
    showMessage(error.message, "error");
    updateTrainingStatus(`
      <div class="space-y-2">
        <p class="font-semibold text-white">Training export failed</p>
        <p class="text-sm text-slate-300">${error.message}</p>
      </div>
    `);
  } finally {
    stopLoading();
  }
});

tnpRetrainButton?.addEventListener("click", async () => {
  const stopLoading = setButtonLoading(tnpRetrainButton, "Retraining...");
  try {
    updateTrainingStatus(`
      <div class="space-y-2">
        <p class="font-semibold text-white">Retraining in progress</p>
        <p class="text-sm text-slate-300">Exporting Firestore outcomes and running the Python training pipeline.</p>
      </div>
    `);
    const response = await apiRequest("/analytics/retrain", {
      method: "POST",
      body: JSON.stringify({}),
    });
    updateTrainingStatus(`
      <div class="space-y-2">
        <p class="font-semibold text-white">Retraining complete</p>
        <p class="text-sm text-slate-300">Exported ${response.export.rowsExported} labeled rows and trained on ${response.training.rows_trained} total rows.</p>
        <p class="text-xs text-slate-400">${(response.training.artifacts || []).join("<br />")}</p>
        <p class="text-xs text-slate-400">Placement accuracy: ${response.training.metrics?.placementTrainAccuracy || 0}% | Role accuracy: ${response.training.metrics?.roleTrainAccuracy || 0}% | Salary MAE: ${response.training.metrics?.salaryTrainMae || 0}</p>
      </div>
    `);
    showMessage("Models retrained successfully.");
    await loadTnpData();
  } catch (error) {
    showMessage(error.message, "error");
    updateTrainingStatus(`
      <div class="space-y-2">
        <p class="font-semibold text-white">Retraining failed</p>
        <p class="text-sm text-slate-300">${error.message}</p>
      </div>
    `);
  } finally {
    stopLoading();
  }
});

logoutButton.addEventListener("click", async () => {
  if (auth) {
    await signOut(auth);
  }
  window.location.href = "/login";
});

settingsButton?.addEventListener("click", () => {
  window.location.href = "/settings";
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
      renderWorkspaceNav(profile.role);
      renderAvatar(profile, avatarImage, avatarInitials);

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
