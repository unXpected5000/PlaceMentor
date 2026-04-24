import { ROLES, normalizeRole } from "./roles.js";

const STORAGE_KEY = "placementor.realdata.v1";

let cachedState = null;

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function statusFromPlacement(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "placed") return "Placed";
  if (text === "selected") return "Placed";
  if (text.includes("short")) return "Shortlisted";
  if (text.includes("interview")) return "Interviewing";
  return "Not Placed";
}

function deriveRoleFromSkills(skills = []) {
  const normalized = skills.map((skill) => skill.toLowerCase());
  if (normalized.some((skill) => /data|python|sql|ml|analytics|nlp/.test(skill))) {
    return "Data Analyst";
  }
  if (normalized.some((skill) => /react|vue|javascript|java|spring|html|css|go/.test(skill))) {
    return "Software Engineer";
  }
  if (normalized.some((skill) => /network|embedded|iot|matlab|electronics/.test(skill))) {
    return "Systems Engineer";
  }
  return "Graduate Trainee";
}

function normalizeStudent(student) {
  const skills = parseList(student.skills);
  return {
    id: String(student.id),
    name: student.name || "Unknown Student",
    email: student.email || "",
    department: String(student.department || "").toLowerCase(),
    cgpa: Number(student.cgpa || 0),
    resumeScore: Number(student.resumeScore || student.resume_score || 0),
    skills,
    phone: student.phone || "",
    year: Number(student.year || 0),
    placementStatus: statusFromPlacement(student.placementStatus || student.status),
    predictedRole: deriveRoleFromSkills(skills),
  };
}

function normalizeTeacher(teacher) {
  const role = normalizeRole(teacher.role);
  return {
    id: `faculty-${teacher.id}`,
    name: teacher.name || "Unknown Faculty",
    email: teacher.email || "",
    role,
    department: String(teacher.department || "").toLowerCase(),
    subjects: parseList(teacher.subjects),
    experienceYears: Number(teacher.experienceYears || 0),
    rating: Number(teacher.rating || 0),
    phone: teacher.phone || "",
  };
}

function normalizeCompany(company) {
  return {
    id: String(company.id),
    name: company.name || "Unknown Company",
    roles: parseList(company.roles),
    eligibleDepartments: parseList(company.eligibleDepartments).map((item) => item.toLowerCase()),
    minCGPA: Number(company.minCGPA || 0),
    minResumeScore: Number(company.minResumeScore || 0),
    packageLPA: Number(company.packageLPA || 0),
    location: company.location || "",
    openings: Number(company.openings || 0),
  };
}

function buildUsers(students, teachers) {
  const studentUsers = students.map((student) => ({
    id: `student-${student.id}`,
    name: student.name,
    email: student.email,
    role: ROLES.STUDENT,
    department: student.department,
    password: "demo123",
  }));

  const facultyUsers = teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    role: teacher.role,
    department: teacher.department,
    password: "demo123",
  }));

  const tnpSeed = {
    id: "tnp-1",
    name: "TNP Officer",
    email: "tnp@terna.edu",
    role: ROLES.TNP,
    department: "tnp",
    password: "demo123",
  };

  return [...studentUsers, ...facultyUsers, tnpSeed];
}

export function calculateProfileStrength(student) {
  const skillCount = Math.min((student.skills || []).length, 5);
  const score =
    (Math.max(0, Math.min(student.cgpa, 10)) / 10) * 40 +
    (Math.max(0, Math.min(student.resumeScore, 100)) / 100) * 40 +
    skillCount * 4;
  return Math.min(100, Math.round(score));
}

export function getEligibleCompanies(student, companies) {
  return companies.filter((company) => {
    const departmentEligible =
      !company.eligibleDepartments.length || company.eligibleDepartments.includes(student.department);
    return (
      student.cgpa >= company.minCGPA &&
      student.resumeScore >= company.minResumeScore &&
      departmentEligible
    );
  });
}

export function getPlacementTips(student, companies) {
  const tips = [];
  if (student.cgpa < 7) {
    tips.push("Improve academic consistency to cross more company CGPA cutoffs.");
  }
  if (student.resumeScore < 75) {
    tips.push("Strengthen resume structure, measurable project outcomes, and role keywords.");
  }
  const eligible = getEligibleCompanies(student, companies);
  if (!eligible.length) {
    tips.push("You are currently ineligible for most companies. Improve CGPA, resume score, or both.");
  }
  const allSkills = new Set(
    companies
      .filter((company) => company.eligibleDepartments.includes(student.department))
      .flatMap((company) => company.roles)
  );
  if ((student.skills || []).length < 3) {
    tips.push("Add more role-relevant technical skills to improve placement readiness.");
  }
  if (!tips.length) {
    tips.push("Your profile is competitive. Focus on mock interviews and company-specific preparation.");
  }
  return tips;
}

export function analyzeResumeFile(file, student) {
  const baseSkills = student?.skills || [];
  return {
    fileName: file.name,
    skills: baseSkills,
    education: student?.department ? `${student.department.toUpperCase()} - Year ${student.year}` : "Education details unavailable",
    experience: "Project-based academic experience",
    score: student?.resumeScore || 0,
  };
}

export async function loadInitialData() {
  if (cachedState) return cachedState;

  const override = safeJsonParse(localStorage.getItem(STORAGE_KEY), null);
  if (override) {
    cachedState = override;
    return cachedState;
  }

  const [studentsRaw, teachersRaw, companiesRaw] = await Promise.all([
    fetch("./assets/terna_students_dataset.json").then((response) => response.json()),
    fetch("./assets/terna_teachers_dataset.json").then((response) => response.json()),
    fetch("./assets/terna_companies_dataset.json").then((response) => response.json()),
  ]);

  const students = studentsRaw.map(normalizeStudent);
  const faculty = teachersRaw.map(normalizeTeacher);
  const companies = companiesRaw.map(normalizeCompany);
  cachedState = {
    users: buildUsers(students, faculty),
    students,
    faculty,
    companies,
    activity: [
      "Datasets loaded from assets",
      `${students.length} students loaded`,
      `${faculty.length} faculty accounts loaded`,
      `${companies.length} companies loaded`,
    ],
    resumes: {},
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
  return cachedState;
}

export function saveData(state) {
  cachedState = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  } else if (datasetType === "companies") {
    state.companies = rawRecords.map(normalizeCompany);
  }

  state.users = buildUsers(state.students, state.faculty);
  state.activity = [
    `Updated ${datasetType} dataset`,
    ...(state.activity || []),
  ].slice(0, 10);
  saveData(state);
  return state;
}
