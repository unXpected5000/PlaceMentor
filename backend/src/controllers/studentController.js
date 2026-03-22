const { asyncHandler } = require("../utils/asyncHandler");
const {
  saveStudentProfile,
  getStudentProfile,
  getPrediction,
  getResumeAnalysis,
  listStudents,
  getUserProfile,
} = require("../services/studentService");
const { HttpError } = require("../utils/httpError");

const getMyDashboard = asyncHandler(async (req, res) => {
  const [profile, studentProfile, prediction, resumeAnalysis] = await Promise.all([
    getUserProfile(req.user.uid),
    getStudentProfile(req.user.uid),
    getPrediction(req.user.uid),
    getResumeAnalysis(req.user.uid),
  ]);

  res.json({
    success: true,
    data: {
      user: {
        uid: req.user.uid,
        ...profile,
      },
      studentProfile,
      prediction,
      resumeAnalysis,
    },
  });
});

const saveMyProfile = asyncHandler(async (req, res) => {
  const studentProfile = await saveStudentProfile(req.user.uid, req.body);

  res.json({
    success: true,
    studentProfile,
  });
});

const getStudents = asyncHandler(async (req, res) => {
  const students = await listStudents();
  res.json({ success: true, students });
});

const updateStudentById = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (!studentId) {
    throw new HttpError(400, "studentId is required");
  }

  const profile = await saveStudentProfile(studentId, req.body, { partial: true });

  res.json({
    success: true,
    studentProfile: profile,
  });
});

module.exports = {
  getMyDashboard,
  saveMyProfile,
  getStudents,
  updateStudentById,
};
