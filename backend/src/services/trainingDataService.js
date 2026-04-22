const fs = require("fs");
const path = require("path");
const { listStudents } = require("./studentService");

const TRAINING_EXPORT_PATH = path.resolve(
  __dirname,
  "../../../ml/data/firestore_students.csv"
);
const TRAINING_LOG_PATH = path.resolve(
  __dirname,
  "../../../ml/artifacts/training_history.json"
);

const CSV_HEADERS = [
  "cgpa",
  "aptitude_score",
  "soft_skills_score",
  "resume_score",
  "skills",
  "projects",
  "certifications",
  "placement_status",
  "predicted_role",
  "expected_salary_lpa",
];

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function joinList(value) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join("|");
}

function buildTrainingRow(student) {
  const profile = student.profile || {};
  const prediction = student.prediction || {};
  const placed = Boolean(profile.placed);
  const predictedRole =
    profile.finalRole ||
    (placed ? prediction.predictedRole : "") ||
    profile.preferredRole ||
    "Support Engineer";
  const expectedSalary = placed
    ? Number(profile.finalSalaryLpa || prediction.expectedSalaryLpa || 0)
    : 0;

  return {
    cgpa: Number(profile.cgpa || 0),
    aptitude_score: Number(profile.aptitudeScore || 0),
    soft_skills_score: Number(profile.softSkillsScore || 0),
    resume_score: Number(profile.resumeScore || 0),
    skills: joinList(profile.skills),
    projects: joinList(profile.projects),
    certifications: joinList(profile.certifications),
    placement_status: placed ? 1 : 0,
    predicted_role: predictedRole,
    expected_salary_lpa: expectedSalary,
  };
}

function isTrainingEligible(student) {
  const profile = student.profile || {};
  const hasOutcomeFlag = typeof profile.placed === "boolean";
  const hasCoreScores =
    Number(profile.cgpa || 0) > 0 &&
    Number(profile.aptitudeScore || 0) > 0 &&
    Number(profile.softSkillsScore || 0) > 0;

  if (!hasOutcomeFlag || !hasCoreScores) {
    return false;
  }

  if (!profile.placed) {
    return true;
  }

  return Boolean(profile.finalRole) && Number(profile.finalSalaryLpa || 0) > 0;
}

async function exportStudentsTrainingData() {
  const students = await listStudents();
  const exportableStudents = students.filter(isTrainingEligible);
  const rows = exportableStudents.map(buildTrainingRow);
  const csvLines = [
    CSV_HEADERS.join(","),
    ...rows.map((row) => CSV_HEADERS.map((header) => csvEscape(row[header])).join(",")),
  ];

  fs.mkdirSync(path.dirname(TRAINING_EXPORT_PATH), { recursive: true });
  fs.writeFileSync(TRAINING_EXPORT_PATH, `${csvLines.join("\n")}\n`, "utf-8");

  return {
    exportPath: TRAINING_EXPORT_PATH,
    rowsExported: rows.length,
    studentsReviewed: students.length,
  };
}

function readTrainingHistory() {
  if (!fs.existsSync(TRAINING_LOG_PATH)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(TRAINING_LOG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function appendTrainingHistory(entry) {
  const history = readTrainingHistory();
  const nextHistory = [
    {
      createdAt: new Date().toISOString(),
      ...entry,
    },
    ...history,
  ].slice(0, 20);

  fs.mkdirSync(path.dirname(TRAINING_LOG_PATH), { recursive: true });
  fs.writeFileSync(TRAINING_LOG_PATH, JSON.stringify(nextHistory, null, 2), "utf-8");
  return nextHistory;
}

module.exports = {
  TRAINING_EXPORT_PATH,
  TRAINING_LOG_PATH,
  exportStudentsTrainingData,
  readTrainingHistory,
  appendTrainingHistory,
};
