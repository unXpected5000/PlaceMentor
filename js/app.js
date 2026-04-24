import { clearSession, getSession, getTheme, setSession, setTheme } from "./auth.js";
import {
  analyzeResumeFile,
  importDatasetIntoState,
  loadInitialData,
  resetToAssetData,
  saveData,
} from "./data.js";
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
import { applyAvatar, fileToBase64, validateProfileImage } from "./profile.js";
import {
  allowedRoutes,
  canEditStudents,
  canViewAllStudents,
  ROLES,
} from "./roles.js";

let state = null;
let currentUser = getSession();
let currentRoute = "dashboard";
let currentProfile = {};
let pendingUser = null;
let otpTimerId = null;
let otpExpiresAt = null;

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
};

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  window.setTimeout(() => elements.toast.classList.add("hidden"), 2600);
}

function setLoading(element, isLoading) {
  element?.classList.toggle("loading", isLoading);
  if (element && "disabled" in element) {
    element.disabled = isLoading;
  }
}

function clearOtpTimer() {
  if (otpTimerId) {
    window.clearInterval(otpTimerId);
    otpTimerId = null;
  }
}

function applyTheme() {
  const theme = getTheme();
  document.body.classList.toggle("dark-mode", theme === "dark");
  elements.themeToggle.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

function setIdentity() {
  if (!currentUser) {
    applyAvatar(elements.userAvatar, "Guest", "");
    elements.userName.textContent = "Guest";
    elements.userRoleLabel.textContent = "No active session";
    return;
  }

  applyAvatar(elements.userAvatar, currentUser.name, currentProfile.imageUrl);
  elements.userName.textContent = currentUser.name;
  elements.userRoleLabel.textContent = `${currentUser.role.toUpperCase()} | ${currentUser.email}`;
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
  otpExpiresAt = null;
  clearOtpTimer();
}

function showOtpStep(message, expiresAt) {
  elements.loginForm.classList.add("hidden");
  elements.otpForm.classList.remove("hidden");
  elements.otpMessage.textContent = message;
  elements.otpCode.value = "";
  elements.otpCode.focus();
  otpExpiresAt = expiresAt;
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
    setIdentity();
    return;
  }

  try {
    const response = await getProfile(currentUser.email);
    currentProfile = response.profile || {};
  } catch (error) {
    currentProfile = {};
  }

  setIdentity();
}

function refreshLayout() {
  applyTheme();
  setIdentity();

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
    currentUser.role
  );
  renderActivity(elements.activityList, state);
  renderRoute(elements.routeContainer, state, currentUser, currentRoute, filteredStudents, currentProfile);
  bindRouteActions();
}

function setRoute(route) {
  currentRoute = route;
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

function updateStudent(studentId, updates) {
  const target = state.students.find((student) => student.id === studentId);
  if (!target) return;
  Object.assign(target, updates);
  state.activity = [`Updated student record for ${target.name}`, ...(state.activity || [])].slice(0, 10);
  saveData(state);
}

function saveCompanyFromForm(form) {
  const companyId = form.querySelector("#companyId")?.value?.trim();
  const nextCompany = {
    id: companyId || `company-${Date.now()}`,
    name: form.querySelector("#companyName").value.trim(),
    roles: form.querySelector("#companyRoles").value.split(",").map((item) => item.trim()).filter(Boolean),
    eligibleDepartments: form.querySelector("#companyDepartments").value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean),
    minCGPA: Number(form.querySelector("#companyCgpa").value || 0),
    minResumeScore: Number(form.querySelector("#companyResume").value || 0),
    packageLPA: Number(form.querySelector("#companyPackage").value || 0),
    location: "",
    openings: 0,
  };

  const existingIndex = state.companies.findIndex((company) => company.id === nextCompany.id);
  if (existingIndex >= 0) {
    state.companies[existingIndex] = nextCompany;
  } else {
    state.companies.push(nextCompany);
  }
  state.activity = [`Saved company ${nextCompany.name}`, ...(state.activity || [])].slice(0, 10);
  saveData(state);
}

async function syncProfileFromServer() {
  await loadRemoteProfile();
  refreshLayout();
}

function bindRouteActions() {
  document.querySelectorAll("[data-edit-student]").forEach((button) => {
    button.addEventListener("click", () => {
      const student = state.students.find((item) => item.id === button.dataset.editStudent);
      if (!student) return;
      const cgpa = window.prompt(`Update CGPA for ${student.name}`, String(student.cgpa));
      const resumeScore = window.prompt(`Update Resume Score for ${student.name}`, String(student.resumeScore));
      const placementStatus = window.prompt(`Update Placement Status for ${student.name}`, student.placementStatus);
      if (cgpa == null || resumeScore == null || placementStatus == null) return;
      updateStudent(student.id, {
        cgpa: Number(cgpa),
        resumeScore: Number(resumeScore),
        placementStatus: placementStatus.trim(),
      });
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
      form.querySelector("#companyCgpa").value = company.minCGPA;
      form.querySelector("#companyResume").value = company.minResumeScore;
      form.querySelector("#companyPackage").value = company.packageLPA;
    });
  });

  document.querySelectorAll("[data-delete-company]").forEach((button) => {
    button.addEventListener("click", () => {
      state.companies = state.companies.filter((company) => company.id !== button.dataset.deleteCompany);
      state.activity = ["Deleted company record", ...(state.activity || [])].slice(0, 10);
      saveData(state);
      refreshLayout();
    });
  });

  const companyForm = document.getElementById("companyForm");
  companyForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCompanyFromForm(companyForm);
    companyForm.reset();
    refreshLayout();
  });

  const facultyForm = document.getElementById("facultyForm");
  facultyForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = facultyForm.querySelector("#facultyName").value.trim();
    const email = facultyForm.querySelector("#facultyEmail").value.trim();
    const department = facultyForm.querySelector("#facultyDepartment").value.trim().toLowerCase();
    state.faculty.push({
      id: `faculty-${Date.now()}`,
      name,
      email,
      role: ROLES.FACULTY,
      department,
      subjects: [],
      experienceYears: 0,
      rating: 0,
      phone: "",
    });
    state.users.push({
      id: `faculty-user-${Date.now()}`,
      name,
      email,
      role: ROLES.FACULTY,
      department,
      password: "demo123",
    });
    state.activity = [`Added faculty account for ${name}`, ...(state.activity || [])].slice(0, 10);
    saveData(state);
    facultyForm.reset();
    refreshLayout();
  });

  const datasetImportForm = document.getElementById("datasetImportForm");
  datasetImportForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fileInput = datasetImportForm.querySelector("#datasetFile");
    const datasetType = datasetImportForm.querySelector("#datasetType").value;
    const file = fileInput.files?.[0];
    if (!file) {
      showToast("Choose a JSON file to upload.");
      return;
    }
    const records = JSON.parse(await file.text());
    importDatasetIntoState(state, datasetType, records);
    showToast(`${datasetType} dataset updated.`);
    refreshLayout();
  });

  document.getElementById("resetDatasetsButton")?.addEventListener("click", async () => {
    state = await resetToAssetData();
    currentUser =
      state.users.find((user) => user.email === currentUser.email && user.role === currentUser.role) || currentUser;
    if (currentUser) {
      setSession(currentUser);
      await loadRemoteProfile();
    }
    showToast("Reset to asset datasets.");
    refreshLayout();
  });

  const dropzone = document.getElementById("dropzone");
  const resumeInput = document.getElementById("resumeInput");
  const handleResume = (file) => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name)) {
      showToast("Only PDF resumes are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Resume file must be 2 MB or smaller.");
      return;
    }
    const student = state.students.find((item) => item.email === currentUser.email) || state.students[0];
    state.resumes[student.id] = analyzeResumeFile(file, student);
    state.activity = [`Analyzed resume for ${student.name}`, ...(state.activity || [])].slice(0, 10);
    saveData(state);
    refreshLayout();
  };

  dropzone?.addEventListener("click", () => resumeInput.click());
  resumeInput?.addEventListener("change", () => handleResume(resumeInput.files?.[0]));
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
  dropzone?.addEventListener("drop", (event) => handleResume(event.dataTransfer?.files?.[0]));

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
      showToast("Profile photo updated.");
      refreshLayout();
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(uploadButton, false);
    }
  });

  document.getElementById("removePhotoButton")?.addEventListener("click", async () => {
    try {
      await deleteProfilePhoto(currentUser.email);
      currentProfile = {};
      showToast("Profile photo removed.");
      refreshLayout();
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById("refreshProfileButton")?.addEventListener("click", async () => {
    await syncProfileFromServer();
    showToast("Profile synced.");
  });
}

async function initialize() {
  applyTheme();
  showLoginStep();
  state = await loadInitialData();
  if (currentUser) {
    currentUser =
      state.users.find((user) => user.email === currentUser.email && user.role === currentUser.role) || null;
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
      showToast("Password accepted. Enter the in-app OTP to continue.");
    } catch (error) {
      showToast(error.message);
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
      showToast("Login verified.");
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(button, false);
    }
  });

  elements.otpRetryButton.addEventListener("click", async () => {
    if (!pendingUser) return;
    try {
      const response = await requestOtp(pendingUser.email);
      showOtpStep(createOtpNotice(response), response.expiresAt);
      showToast("A new OTP has been generated.");
    } catch (error) {
      showToast(error.message);
    }
  });

  elements.otpBackButton.addEventListener("click", () => {
    showLoginStep();
  });

  elements.logoutButton.addEventListener("click", () => {
    currentUser = null;
    currentProfile = {};
    clearSession();
    showLoginStep();
    refreshLayout();
  });

  elements.themeToggle.addEventListener("click", () => {
    setTheme(getTheme() === "dark" ? "light" : "dark");
    applyTheme();
    showToast(`Switched to ${getTheme()} mode.`);
  });

  elements.navList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-route]");
    if (!button) return;
    setRoute(button.dataset.route);
  });

  ["change", "input"].forEach((eventName) => {
    elements.departmentFilter.addEventListener(eventName, refreshLayout);
    elements.statusFilter.addEventListener(eventName, refreshLayout);
    elements.sortSelect.addEventListener(eventName, refreshLayout);
    elements.studentSearch.addEventListener(eventName, refreshLayout);
  });

  refreshLayout();
}

initialize().catch((error) => showToast(error.message));
