import { ROLES, normalizeRole } from "./roles.js";

const STORAGE_KEY = "placementor.realdata.v2";

let cachedState = null;

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

export function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueList(values) {
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
}

function titleCase(value) {
  return String(value || "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeDepartment(value) {
  return String(value || "").trim().toLowerCase();
}

function statusFromPlacement(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "Not Placed";
  if (text === "placed" || text === "selected") return "Placed";
  if (text.includes("short")) return "Shortlisted";
  if (text.includes("interview")) return "Interviewing";
  if (text.includes("offer")) return "Placed";
  return "Not Placed";
}

function inferRoleFromSkills(skills = []) {
  const joined = skills.join(" ").toLowerCase();
  if (/python|machine learning|sql|analytics|pandas|power bi|excel/.test(joined)) return "Data Analyst";
  if (/react|vue|javascript|html|css|node|java|spring|go/.test(joined)) return "Software Engineer";
  if (/aws|cloud|linux|docker|kubernetes|devops/.test(joined)) return "Cloud Associate";
  if (/network|embedded|iot|matlab|electronics/.test(joined)) return "Systems Engineer";
  return "Graduate Trainee";
}

function normalizeStudent(student) {
  const skills = uniqueList(parseList(student.skills));
  return {
    id: String(student.id),
    name: student.name || "Unknown Student",
    email: String(student.email || "").trim().toLowerCase(),
    department: normalizeDepartment(student.department),
    cgpa: Number(student.cgpa || 0),
    resumeScore: Number(student.resumeScore || student.resume_score || 0),
    aptitudeScore: Number(student.aptitudeScore || student.aptitude || 0),
    softSkillsScore: Number(student.softSkillsScore || student.soft_skills || 0),
    skills,
    phone: student.phone || "",
    year: Number(student.year || 0),
    placementStatus: statusFromPlacement(student.placementStatus || student.status),
    predictedRole: student.predictedRole || inferRoleFromSkills(skills),
  };
}

function normalizeTeacher(teacher) {
  return {
    id: `faculty-${teacher.id}`,
    name: teacher.name || "Unknown Faculty",
    email: String(teacher.email || "").trim().toLowerCase(),
    role: normalizeRole(teacher.role),
    department: normalizeDepartment(teacher.department),
    subjects: uniqueList(parseList(teacher.subjects)),
    experienceYears: Number(teacher.experienceYears || 0),
    rating: Number(teacher.rating || 0),
    phone: teacher.phone || "",
  };
}

function normalizeTnpOfficer(record) {
  return {
    id: `tnp-${record.id}`,
    name: record.name || "TNP Officer",
    email: String(record.email || "").trim().toLowerCase(),
    role: ROLES.TNP,
    department: normalizeDepartment(record.department || "tnp"),
    designation: record.designation || "TNP Officer",
    experienceYears: Number(record.experienceYears || 0),
    phone: record.phone || "",
  };
}

function roleSkillHints(role) {
  const value = String(role || "").toLowerCase();
  if (value.includes("data")) return ["sql", "python", "excel", "machine learning"];
  if (value.includes("frontend")) return ["html", "css", "javascript", "react"];
  if (value.includes("software") || value.includes("developer")) return ["java", "javascript", "sql", "problem solving"];
  if (value.includes("cloud")) return ["linux", "cloud", "networking", "docker"];
  if (value.includes("consult")) return ["communication", "excel", "sql"];
  return ["communication", "problem solving"];
}

function normalizeCompany(company) {
  const roles = uniqueList(parseList(company.roles));
  return {
    id: String(company.id),
    name: company.name || "Unknown Company",
    roles,
    eligibleDepartments: uniqueList(parseList(company.eligibleDepartments).map(normalizeDepartment)),
    minCGPA: Number(company.minCGPA || 0),
    minResumeScore: Number(company.minResumeScore || 0),
    packageLPA: Number(company.packageLPA || 0),
    location: company.location || "",
    openings: Number(company.openings || 0),
    requiredSkills: uniqueList(parseList(company.requiredSkills || roles.flatMap(roleSkillHints))),
  };
}

function buildUsers(students, faculty, tnpOfficers) {
  const studentUsers = students.map((student) => ({
    id: `student-${student.id}`,
    name: student.name,
    email: student.email,
    role: ROLES.STUDENT,
    department: student.department,
    password: "demo123",
  }));

  const facultyUsers = faculty.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    role: teacher.role,
    department: teacher.department,
    password: "demo123",
  }));

  const tnpUsers = tnpOfficers.map((officer) => ({
    id: officer.id,
    name: officer.name,
    email: officer.email,
    role: ROLES.TNP,
    department: officer.department,
    password: "demo123",
  }));

  if (!tnpUsers.length) {
    tnpUsers.push({
      id: "tnp-1",
      name: "TNP Officer",
      email: "tnp@terna.edu",
      role: ROLES.TNP,
      department: "tnp",
      password: "demo123",
    });
  }

  return [...studentUsers, ...facultyUsers, ...tnpUsers];
}

function defaultState(students, faculty, tnpOfficers, companies) {
  return {
    users: buildUsers(students, faculty, tnpOfficers),
    students,
    faculty,
    tnpOfficers,
    companies,
    resumes: {},
    activity: [
      "Datasets loaded from assets",
      `${students.length} students loaded`,
      `${faculty.length} faculty accounts loaded`,
      `${tnpOfficers.length} TNP officers loaded`,
      `${companies.length} companies loaded`,
    ],
  };
}

export function appendActivity(state, message) {
  state.activity = [message, ...(state.activity || [])].slice(0, 12);
}

export function loadPersistedState() {
  return safeJsonParse(localStorage.getItem(STORAGE_KEY), null);
}

export function saveData(state) {
  cachedState = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function loadInitialData() {
  if (cachedState) return cachedState;

  const override = loadPersistedState();
  if (override) {
    cachedState = override;
    return cachedState;
  }

  const [studentsRaw, teachersRaw, tnpRaw, companiesRaw] = await Promise.all([
    fetch("./assets/terna_students_dataset.json").then((response) => response.json()),
    fetch("./assets/terna_teachers_dataset.json").then((response) => response.json()),
    fetch("./assets/terna_tnp_officers_dataset.json").then((response) => response.json()),
    fetch("./assets/terna_companies_dataset.json").then((response) => response.json()),
  ]);

  const students = studentsRaw.map(normalizeStudent);
  const faculty = teachersRaw.map(normalizeTeacher);
  const tnpOfficers = tnpRaw.map(normalizeTnpOfficer);
  const companies = companiesRaw.map(normalizeCompany);
  cachedState = defaultState(students, faculty, tnpOfficers, companies);
  saveData(cachedState);
  return cachedState;
}

export function resetToAssetData() {
  localStorage.removeItem(STORAGE_KEY);
  cachedState = null;
  return loadInitialData();
}

export function importDatasetIntoState(state, datasetType, rawRecords) {
  if (datasetType === "students") {
    state.students = rawRecords.map(normalizeStudent);
  } else if (datasetType === "teachers") {
    state.faculty = rawRecords.map(normalizeTeacher);
  } else if (datasetType === "tnp_officers") {
    state.tnpOfficers = rawRecords.map(normalizeTnpOfficer);
  } else if (datasetType === "companies") {
    state.companies = rawRecords.map(normalizeCompany);
  }

  state.users = buildUsers(state.students, state.faculty, state.tnpOfficers, state.companies);
  appendActivity(state, `Updated ${datasetType} dataset`);
  saveData(state);
  return state;
}

export function syncCurrentUser(state, currentUser) {
  if (!currentUser) return null;
  return (
    state.users.find(
      (user) => user.email === currentUser.email && user.role === currentUser.role
    ) || null
  );
}

export function updateStudentRecord(state, studentId, updates) {
  const student = state.students.find((item) => item.id === studentId);
  if (!student) return null;

  if (updates.cgpa != null) student.cgpa = Number(updates.cgpa);
  if (updates.resumeScore != null) student.resumeScore = Number(updates.resumeScore);
  if (updates.skills != null) student.skills = uniqueList(parseList(updates.skills));
  if (updates.placementStatus != null) student.placementStatus = statusFromPlacement(updates.placementStatus);
  if (updates.aptitudeScore != null) student.aptitudeScore = Number(updates.aptitudeScore);
  if (updates.softSkillsScore != null) student.softSkillsScore = Number(updates.softSkillsScore);
  student.predictedRole = inferRoleFromSkills(student.skills);
  appendActivity(state, `Updated student record for ${student.name}`);
  saveData(state);
  return student;
}

export function addOrUpdateCompany(state, companyPayload) {
  const normalized = normalizeCompany(companyPayload);
  const existingIndex = state.companies.findIndex((item) => item.id === normalized.id);
  if (existingIndex >= 0) {
    state.companies[existingIndex] = normalized;
  } else {
    state.companies.push(normalized);
  }
  appendActivity(state, `Saved company ${normalized.name}`);
  saveData(state);
  return normalized;
}

export function deleteCompany(state, companyId) {
  state.companies = state.companies.filter((company) => company.id !== companyId);
  appendActivity(state, "Deleted company record");
  saveData(state);
}

export function addFacultyAccount(state, payload) {
  const facultyRecord = normalizeTeacher({
    ...payload,
    id: payload.id || Date.now(),
    role: ROLES.FACULTY,
  });
  state.faculty.push(facultyRecord);
  state.users = buildUsers(state.students, state.faculty, state.tnpOfficers, state.companies);
  appendActivity(state, `Added faculty account for ${facultyRecord.name}`);
  saveData(state);
  return facultyRecord;
}
