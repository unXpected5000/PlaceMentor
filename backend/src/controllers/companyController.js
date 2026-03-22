const { asyncHandler } = require("../utils/asyncHandler");
const {
  listCompanies,
  listStudents,
  getStudentProfile,
  getPrediction,
  getUserProfile,
  saveCompany,
  deleteCompany,
} = require("../services/studentService");
const { buildCompanyMatches } = require("../utils/companyMatcher");

const getCompanies = asyncHandler(async (req, res) => {
  const companies = await listCompanies();
  res.json({ success: true, companies });
});

const getCompanyMatches = asyncHandler(async (req, res) => {
  const targetStudentId = req.query.studentId || req.user.uid;
  const [user, profile, prediction, companies] = await Promise.all([
    getUserProfile(targetStudentId),
    getStudentProfile(targetStudentId),
    getPrediction(targetStudentId),
    listCompanies(),
  ]);

  const matches = buildCompanyMatches(
    {
      uid: targetStudentId,
      ...user,
      profile,
      prediction,
    },
    companies
  );

  res.json({
    success: true,
    matches,
  });
});

const getCompanyMatchBoard = asyncHandler(async (req, res) => {
  const [students, companies] = await Promise.all([listStudents(), listCompanies()]);

  const board = students.map((student) => ({
    uid: student.uid,
    name: student.name,
    email: student.email,
    prediction: student.prediction || null,
    topMatches: buildCompanyMatches(student, companies).slice(0, 3),
  }));

  res.json({
    success: true,
    board,
  });
});

const createCompany = asyncHandler(async (req, res) => {
  const company = await saveCompany(null, req.body);
  res.status(201).json({ success: true, company });
});

const updateCompany = asyncHandler(async (req, res) => {
  const company = await saveCompany(req.params.companyId, req.body);
  res.json({ success: true, company });
});

const removeCompany = asyncHandler(async (req, res) => {
  await deleteCompany(req.params.companyId);
  res.json({ success: true });
});

module.exports = {
  getCompanies,
  getCompanyMatches,
  getCompanyMatchBoard,
  createCompany,
  updateCompany,
  removeCompany,
};
