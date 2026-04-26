import { clearSession, getSession, getTheme, setSession, setTheme } from "./auth.js";
import {
  addFacultyAccount,
  addOrUpdateCompany,
  appendActivity,
  deleteCompany,
  importDatasetIntoState,
  loadInitialData,
  resetToAssetData,
  saveData,
  syncCurrentUser,
  updateStudentRecord,
} from "./data.js";
import { analyzeResumeDocument } from "./resume.js";
import {
  deleteProfilePhoto,
  getProfile,
  requestOtp,
  uploadProfilePhoto,
  verifyOtp,
} from "./api.js";
import {
  getFilteredStudents,
  renderActivity,
  renderKpis,
  renderNav,
  renderRoute,
  renderStudentsSection,
} from "./dashboard.js";
import { formatOtpExpiry, createOtpNotice } from "./otp.js";
import { fileToBase64, validateProfileImage } from "./profile.js";
import { allowedRoutes, canViewAllStudents, ROLES } from "./roles.js";
import { applyTheme, setDrawerOpen, setIdentity, setLoading, showToast } from "./ui.js";

let state = null;
let currentUser = getSession();
let currentRoute = "dashboard";
let currentProfile = {};
let pendingUser = null;
let otpTimerId = null;

const viewState = {
  editingStudentId: null,
  resumeProgress: 0,
  resumeStatus: "",
  drawerOpen: false,
};

const elements = {
  authView: document.getElementById("authView"),
  dashboardView: document.getElementById("dashboardView"),
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  otpForm: document.getElementById("otpForm"),
  otpCode: document.getElementById("otpCode"),
  otpMessage: document.getElementById("otpMessage"),
  otpRetryButton: document.getElementById("otpRetryButton"),
  otpBackButton: document.getElementById("otpBackButton"),
  logoutButton: document.getElementById("logoutButton"),
  themeToggle: document.getElementById("themeToggle"),
  navList: document.getElementById("navList"),
  kpiGrid: document.getElementById("kpiGrid"),
  routeContainer: document.getElementById("routeContainer"),
  activityList: document.getElementById("activityList"),
  departmentFilter: document.getElementById("departmentFilter"),
  statusFilter: document.getElementById("statusFilter"),
  sortSelect: document.getElementById("sortSelect"),
  studentSearch: document.getElementById("studentSearch"),
  studentsTable: document.getElementById("studentsTable"),
  pageTitle: document.getElementById("pageTitle"),
  breadcrumbPage: document.getElementById("breadcrumbPage"),
  toast: document.getElementById("toast"),
  userAvatar: document.getElementById("userAvatar"),
  userName: document.getElementById("userName"),
  userRoleLabel: document.getElementById("userRoleLabel"),
  menuToggle: document.getElementById("menuToggle"),
  sidebar: document.querySelector(".sidebar"),
  navOverlay: document.getElementById("navOverlay"),
};

function toast(message) {
  showToast(elements.toast, message);
}

function clearOtpTimer() {
  if (otpTimerId) {
    window.clearInterval(otpTimerId);
    otpTimerId = null;
  }
}

function applyCurrentTheme() {
  applyTheme(getTheme(), elements.themeToggle);
}

function updateIdentity() {
  setIdentity(elements, currentUser, currentProfile);
}

function updateDrawer(open) {
  viewState.drawerOpen = open;
  setDrawerOpen(elements.sidebar, elements.navOverlay, open);
}

function getStatusOptions() {
  return [...new Set(state.students.map((student) => student.placementStatus))].sort();
}

function populateFilters() {
  const deptValue = elements.departmentFilter.value || "all";
  const statusValue = elements.statusFilter.value || "all";

  const departments = [...new Set(state.students.map((student) => student.department))].sort();
  elements.departmentFilter.innerHTML = [
    `<option value="all">All departments</option>`,
    ...departments.map((department) => `<option value="${department}">${department.toUpperCase()}</option>`),
  ].join("");
  elements.departmentFilter.value = departments.includes(deptValue) ? deptValue : "all";

  const statuses = getStatusOptions();
  elements.statusFilter.innerHTML = [
    `<option value="all">All statuses</option>`,
    ...statuses.map((status) => `<option value="${status}">${status}</option>`),
  ].join("");
  elements.statusFilter.value = statuses.includes(statusValue) ? statusValue : "all";
}

function currentFilters() {
  return {
    department: elements.departmentFilter.value || "all",
    status: elements.statusFilter.value || "all",
    sort: elements.sortSelect.value || "name",
    query: (elements.studentSearch.value || "").trim().toLowerCase(),
  };
}

function ensureAllowedRoute() {
  if (!currentUser) return;
  const routes = allowedRoutes(currentUser.role);
  if (!routes.includes(currentRoute)) {
    currentRoute = "dashboard";
  }
}

function showLoginStep() {
  elements.loginForm.classList.remove("hidden");
  elements.otpForm.classList.add("hidden");
  elements.otpCode.value = "";
  pendingUser = null;
  clearOtpTimer();
}

function showOtpStep(message, expiresAt) {
  elements.loginForm.classList.add("hidden");
  elements.otpForm.classList.remove("hidden");
  elements.otpMessage.textContent = message;
  elements.otpCode.value = "";
  elements.otpCode.focus();
  clearOtpTimer();
  if (expiresAt) {
    otpTimerId = window.setInterval(() => {
      const timeLeft = formatOtpExpiry(expiresAt);
      elements.otpMessage.textContent = `${message} Expires in ${timeLeft}.`;
      if (timeLeft === "00:00") {
        clearOtpTimer();
      }
    }, 1000);
  }
}

async function loadRemoteProfile() {
  if (!currentUser) {
    currentProfile = {};
    updateIdentity();
    return;
  }

  try {
    const response = await getProfile(currentUser.email);
    currentProfile = response.profile || {};
  } catch (error) {
    currentProfile = {};
  }
  updateIdentity();
}

function refreshLayout() {
  applyCurrentTheme();
  updateIdentity();

  if (!currentUser) {
    elements.authView.classList.remove("hidden");
    elements.dashboardView.classList.add("hidden");
    elements.logoutButton.classList.add("hidden");
    return;
  }

  ensureAllowedRoute();
  renderNav(elements.navList, currentRoute, currentUser.role);
  elements.authView.classList.add("hidden");
  elements.dashboardView.classList.remove("hidden");
  elements.logoutButton.classList.remove("hidden");
  elements.pageTitle.textContent = currentRoute.charAt(0).toUpperCase() + currentRoute.slice(1);
  elements.breadcrumbPage.textContent = elements.pageTitle.textContent;

  populateFilters();
  const filteredStudents = getFilteredStudents(state, currentFilters(), currentUser);
  renderKpis(elements.kpiGrid, currentUser.role === ROLES.STUDENT ? filteredStudents : state.students);
  renderStudentsSection(
    elements.studentsTable,
    canViewAllStudents(currentUser.role) ? filteredStudents : filteredStudents.slice(0, 1),
    currentUser.role,
    viewState
  );
  renderActivity(elements.activityList, state);
  renderRoute(elements.routeContainer, state, currentUser, currentRoute, filteredStudents, currentProfile, viewState);
  bindRouteActions();
}

function setRoute(route) {
  currentRoute = route;
  viewState.editingStudentId = null;
  refreshLayout();
}

function resolveUser(email, password) {
  const user = state.users.find(
    (candidate) =>
      String(candidate.email).toLowerCase() === String(email).toLowerCase() &&
      String(candidate.password || "demo123") === String(password)
  );
  if (!user) {
    throw new Error("Invalid email or password.");
  }
  return user;
}

async function beginLogin(email, password) {
  pendingUser = resolveUser(email, password);
  const response = await requestOtp(pendingUser.email);
  showOtpStep(createOtpNotice(response), response.expiresAt);
}

async function completeLogin(code) {
  if (!pendingUser) {
    throw new Error("Start login again to request a fresh OTP.");
  }

  await verifyOtp(pendingUser.email, code);
  currentUser = pendingUser;
  pendingUser = null;
  setSession(currentUser);
  await loadRemoteProfile();
  clearOtpTimer();
  setRoute("dashboard");
}

function saveCompanyFromForm(form) {
  const companyId = form.querySelector("#companyId")?.value?.trim();
  const company = addOrUpdateCompany(state, {
    id: companyId || `company-${Date.now()}`,
    name: form.querySelector("#companyName").value.trim(),
    roles: form.querySelector("#companyRoles").value,
    eligibleDepartments: form.querySelector("#companyDepartments").value,
    requiredSkills: form.querySelector("#companySkills").value,
    minCGPA: Number(form.querySelector("#companyCgpa").value || 0),
    minResumeScore: Number(form.querySelector("#companyResume").value || 0),
    packageLPA: Number(form.querySelector("#companyPackage").value || 0),
  });
  return company;
}

async function processResume(file) {
  if (!file) return;
  if (!/\.(pdf|txt)$/i.test(file.name)) {
    toast("Only PDF or TXT resumes are allowed.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast("Resume file must be 2 MB or smaller.");
    return;
  }
  const student = state.students.find((item) => item.email === currentUser.email) || state.students[0];
  viewState.resumeProgress = 0;
  viewState.resumeStatus = "Reading and analyzing resume...";
  refreshLayout();
  try {
    const resume = await analyzeResumeDocument(file, student, state.companies, (progress) => {
      viewState.resumeProgress = progress;
      viewState.resumeStatus = progress < 100 ? `Analyzing resume (${progress}%)` : "Resume analysis complete.";
      refreshLayout();
    });
    state.resumes[student.id] = resume;
    appendActivity(state, `Analyzed resume for ${student.name}`);
    saveData(state);
    toast("Resume analyzed successfully.");
  } catch (error) {
    toast(error.message);
  } finally {
    viewState.resumeProgress = 0;
    refreshLayout();
  }
}

function bindRouteActions() {
  document.querySelectorAll("[data-start-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      viewState.editingStudentId = button.dataset.startEdit;
      refreshLayout();
    });
  });

  document.querySelectorAll("[data-cancel-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      viewState.editingStudentId = null;
      refreshLayout();
    });
  });

  document.querySelectorAll("[data-save-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const studentId = button.dataset.saveEdit;
      const row = document.querySelector(`[data-edit-row="${studentId}"]`);
      if (!row) return;
      updateStudentRecord(state, studentId, {
        cgpa: row.querySelector('[data-field="cgpa"]')?.value,
        resumeScore: row.querySelector('[data-field="resumeScore"]')?.value,
        skills: row.querySelector('[data-field="skills"]')?.value,
        placementStatus: row.querySelector('[data-field="placementStatus"]')?.value,
      });
      viewState.editingStudentId = null;
      toast("Student record updated.");
      refreshLayout();
    });
  });

  document.querySelectorAll("[data-edit-company]").forEach((button) => {
    button.addEventListener("click", () => {
      const company = state.companies.find((item) => item.id === button.dataset.editCompany);
      const form = document.getElementById("companyForm");
      if (!company || !form) return;
      form.querySelector("#companyId").value = company.id;
      form.querySelector("#companyName").value = company.name;
      form.querySelector("#companyRoles").value = company.roles.join(", ");
      form.querySelector("#companyDepartments").value = company.eligibleDepartments.join(", ");
      form.querySelector("#companySkills").value = (company.requiredSkills || []).join(", ");
      form.querySelector("#companyCgpa").value = company.minCGPA;
      form.querySelector("#companyResume").value = company.minResumeScore;
      form.querySelector("#companyPackage").value = company.packageLPA;
      currentRoute = "profile";
      refreshLayout();
    });
  });

  document.querySelectorAll("[data-delete-company]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteCompany(state, button.dataset.deleteCompany);
      toast("Company removed.");
      refreshLayout();
    });
  });

  const companyForm = document.getElementById("companyForm");
  companyForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const company = saveCompanyFromForm(companyForm);
    companyForm.reset();
    toast(`Saved ${company.name}.`);
    refreshLayout();
  });

  const facultyForm = document.getElementById("facultyForm");
  facultyForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    addFacultyAccount(state, {
      id: Date.now(),
      name: facultyForm.querySelector("#facultyName").value.trim(),
      email: facultyForm.querySelector("#facultyEmail").value.trim(),
      department: facultyForm.querySelector("#facultyDepartment").value.trim(),
      role: ROLES.FACULTY,
    });
    facultyForm.reset();
    toast("Faculty account added.");
    refreshLayout();
  });

  const datasetImportForm = document.getElementById("datasetImportForm");
  datasetImportForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fileInput = datasetImportForm.querySelector("#datasetFile");
    const datasetType = datasetImportForm.querySelector("#datasetType").value;
    const file = fileInput.files?.[0];
    if (!file) {
      toast("Choose a JSON file to upload.");
      return;
    }
    const records = JSON.parse(await file.text());
    importDatasetIntoState(state, datasetType, records);
    currentUser = syncCurrentUser(state, currentUser);
    if (currentUser) setSession(currentUser);
    toast(`${datasetType} dataset updated.`);
    refreshLayout();
  });

  document.getElementById("resetDatasetsButton")?.addEventListener("click", async () => {
    state = await resetToAssetData();
    currentUser = syncCurrentUser(state, currentUser);
    if (currentUser) {
      setSession(currentUser);
      await loadRemoteProfile();
    }
    toast("Reset to asset datasets.");
    refreshLayout();
  });

  const dropzone = document.getElementById("dropzone");
  const resumeInput = document.getElementById("resumeInput");
  dropzone?.addEventListener("click", () => resumeInput.click());
  resumeInput?.addEventListener("change", () => processResume(resumeInput.files?.[0]));
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragging");
    });
  });
  dropzone?.addEventListener("drop", (event) => processResume(event.dataTransfer?.files?.[0]));

  const profilePhotoForm = document.getElementById("profilePhotoForm");
  profilePhotoForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const uploadButton = event.currentTarget.querySelector("button[type='submit']");
    const file = document.getElementById("profilePhotoInput")?.files?.[0];
    setLoading(uploadButton, true);
    try {
      validateProfileImage(file);
      const fileData = await fileToBase64(file);
      const response = await uploadProfilePhoto({
        email: currentUser.email,
        fileName: file.name,
        contentType: file.type,
        fileData,
      });
      currentProfile = response.profile || {};
      toast("Profile photo updated.");
      refreshLayout();
    } catch (error) {
      toast(error.message);
    } finally {
      setLoading(uploadButton, false);
    }
  });

  document.getElementById("removePhotoButton")?.addEventListener("click", async () => {
    try {
      await deleteProfilePhoto(currentUser.email);
      currentProfile = {};
      toast("Profile photo removed.");
      refreshLayout();
    } catch (error) {
      toast(error.message);
    }
  });

  document.getElementById("refreshProfileButton")?.addEventListener("click", async () => {
    await loadRemoteProfile();
    toast("Profile synced.");
    refreshLayout();
  });
}

async function initialize() {
  applyCurrentTheme();
  showLoginStep();
  state = await loadInitialData();
  if (currentUser) {
    currentUser = syncCurrentUser(state, currentUser);
    if (currentUser) {
      setSession(currentUser);
      await loadRemoteProfile();
    } else {
      clearSession();
    }
  }

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type='submit']");
    setLoading(button, true);
    try {
      await beginLogin(elements.loginEmail.value, elements.loginPassword.value);
      toast("Password accepted. Enter the in-app OTP to continue.");
    } catch (error) {
      toast(error.message);
      showLoginStep();
    } finally {
      setLoading(button, false);
    }
  });

  elements.otpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type='submit']");
    setLoading(button, true);
    try {
      await completeLogin(elements.otpCode.value.trim());
      toast("Login verified.");
    } catch (error) {
      toast(error.message);
    } finally {
      setLoading(button, false);
    }
  });

  elements.otpRetryButton.addEventListener("click", async () => {
    if (!pendingUser) return;
    try {
      const response = await requestOtp(pendingUser.email);
      showOtpStep(createOtpNotice(response), response.expiresAt);
      toast("A new OTP has been generated.");
    } catch (error) {
      toast(error.message);
    }
  });

  elements.otpBackButton.addEventListener("click", showLoginStep);

  elements.logoutButton.addEventListener("click", () => {
    currentUser = null;
    currentProfile = {};
    clearSession();
    showLoginStep();
    refreshLayout();
  });

  elements.themeToggle.addEventListener("click", () => {
    setTheme(getTheme() === "dark" ? "light" : "dark");
    applyCurrentTheme();
    toast(`Switched to ${getTheme()} mode.`);
  });

  elements.navList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-route]");
    if (!button) return;
    updateDrawer(false);
    setRoute(button.dataset.route);
  });

  elements.menuToggle?.addEventListener("click", () => {
    updateDrawer(!viewState.drawerOpen);
  });
  elements.navOverlay?.addEventListener("click", () => updateDrawer(false));

  ["change", "input"].forEach((eventName) => {
    elements.departmentFilter.addEventListener(eventName, refreshLayout);
    elements.statusFilter.addEventListener(eventName, refreshLayout);
    elements.sortSelect.addEventListener(eventName, refreshLayout);
    elements.studentSearch.addEventListener(eventName, refreshLayout);
  });

  refreshLayout();
}

initialize().catch((error) => toast(error.message));
