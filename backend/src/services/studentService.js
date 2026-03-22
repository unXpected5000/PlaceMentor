const fs = require("fs");
const path = require("path");
const { db, ensureFirebase, firebaseEnabled } = require("../config/firebaseAdmin");

const COMPANIES_PATH = path.resolve(__dirname, "../data/companies.json");

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStudentProfile(payload = {}, options = {}) {
  const { partial = false } = options;
  const result = {};

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "cgpa")) {
    result.cgpa = Number(payload.cgpa || 0);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "skills")) {
    result.skills = normalizeList(payload.skills);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "projects")) {
    result.projects = normalizeList(payload.projects);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "certifications")) {
    result.certifications = normalizeList(payload.certifications);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "aptitudeScore")) {
    result.aptitudeScore = Number(payload.aptitudeScore || 0);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "softSkillsScore")) {
    result.softSkillsScore = Number(payload.softSkillsScore || 0);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "resumeScore")) {
    result.resumeScore = Number(payload.resumeScore || 0);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "preferredRole")) {
    result.preferredRole = payload.preferredRole || "";
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "department")) {
    result.department = payload.department || "";
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "graduationYear")) {
    result.graduationYear = Number(payload.graduationYear || 0);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "facultyNotes")) {
    result.facultyNotes = String(payload.facultyNotes || "");
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "applicationStatus")) {
    result.applicationStatus = payload.applicationStatus || "Not Applied";
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "interviewStatus")) {
    result.interviewStatus = payload.interviewStatus || "Not Scheduled";
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "pipelineStage")) {
    result.pipelineStage = payload.pipelineStage || "Shortlist";
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "targetCompanies")) {
    result.targetCompanies = normalizeList(payload.targetCompanies);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "notifications")) {
    result.notifications = normalizeList(payload.notifications);
  }

  result.updatedAt = new Date().toISOString();

  return result;
}

async function upsertUserProfile(uid, profile) {
  ensureFirebase();
  await db.collection("users").doc(uid).set(profile, { merge: true });
}

async function getUserProfile(uid) {
  ensureFirebase();
  const snapshot = await db.collection("users").doc(uid).get();
  return snapshot.exists ? snapshot.data() : null;
}

async function saveStudentProfile(uid, payload, options = {}) {
  ensureFirebase();
  const profile = normalizeStudentProfile(payload, options);
  await db.collection("studentProfiles").doc(uid).set(profile, { merge: true });
  return profile;
}

async function getStudentProfile(uid) {
  ensureFirebase();
  const snapshot = await db.collection("studentProfiles").doc(uid).get();
  return snapshot.exists ? snapshot.data() : null;
}

async function savePrediction(uid, prediction) {
  ensureFirebase();
  await db.collection("predictions").doc(uid).set(
    {
      ...prediction,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function getPrediction(uid) {
  ensureFirebase();
  const snapshot = await db.collection("predictions").doc(uid).get();
  return snapshot.exists ? snapshot.data() : null;
}

async function saveResumeAnalysis(uid, analysis) {
  ensureFirebase();
  await db.collection("resumeAnalyses").doc(uid).set(
    {
      ...analysis,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function getResumeAnalysis(uid) {
  ensureFirebase();
  const snapshot = await db.collection("resumeAnalyses").doc(uid).get();
  return snapshot.exists ? snapshot.data() : null;
}

async function listStudents() {
  ensureFirebase();
  const [usersSnapshot, profilesSnapshot, predictionsSnapshot] = await Promise.all([
    db.collection("users").where("role", "==", "student").get(),
    db.collection("studentProfiles").get(),
    db.collection("predictions").get(),
  ]);

  const profiles = new Map();
  profilesSnapshot.forEach((doc) => profiles.set(doc.id, doc.data()));

  const predictions = new Map();
  predictionsSnapshot.forEach((doc) => predictions.set(doc.id, doc.data()));

  return usersSnapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
    profile: profiles.get(doc.id) || null,
    prediction: predictions.get(doc.id) || null,
  }));
}

function getCompanySeedData() {
  return JSON.parse(fs.readFileSync(COMPANIES_PATH, "utf-8"));
}

async function listCompanies() {
  if (!firebaseEnabled) {
    return getCompanySeedData();
  }

  ensureFirebase();
  const snapshot = await db.collection("companies").get();

  if (snapshot.empty) {
    return getCompanySeedData();
  }

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function saveCompany(companyId, payload) {
  ensureFirebase();
  const id = companyId || db.collection("companies").doc().id;
  const record = {
    name: payload.name || "",
    role: payload.role || "",
    packageLpa: Number(payload.packageLpa || 0),
    minCgpa: Number(payload.minCgpa || 0),
    maxBacklogs: Number(payload.maxBacklogs || 0),
    requiredSkills: normalizeList(payload.requiredSkills),
    eligibilityRules: normalizeList(payload.eligibilityRules),
    updatedAt: new Date().toISOString(),
  };

  await db.collection("companies").doc(id).set(record, { merge: true });
  return { id, ...record };
}

async function deleteCompany(companyId) {
  ensureFirebase();
  await db.collection("companies").doc(companyId).delete();
}

module.exports = {
  normalizeStudentProfile,
  upsertUserProfile,
  getUserProfile,
  saveStudentProfile,
  getStudentProfile,
  savePrediction,
  getPrediction,
  saveResumeAnalysis,
  getResumeAnalysis,
  listStudents,
  listCompanies,
  saveCompany,
  deleteCompany,
};
