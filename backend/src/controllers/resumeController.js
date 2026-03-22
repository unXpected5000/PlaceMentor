const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { bucket, firebaseEnabled } = require("../config/firebaseAdmin");
const { asyncHandler } = require("../utils/asyncHandler");
const { saveResumeAnalysis, saveStudentProfile } = require("../services/studentService");
const { runPythonScript } = require("../services/pythonRunner");
const { HttpError } = require("../utils/httpError");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const LOCAL_UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

const analyzeResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, "Resume file is required");
  }

  const extension = path.extname(req.file.originalname).toLowerCase();
  const localFileName = `${Date.now()}-${req.user.uid}${extension}`;
  const localFilePath = path.join(LOCAL_UPLOAD_DIR, localFileName);
  fs.writeFileSync(localFilePath, req.file.buffer);

  let storageUrl = null;
  if (firebaseEnabled) {
    const cloudFile = bucket.file(`resumes/${req.user.uid}/${localFileName}`);
    await cloudFile.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    storageUrl = `gs://${bucket.name}/${cloudFile.name}`;
  }

  const analysis = await runPythonScript("predict.py", {
    type: "resume_analysis",
    payload: {
      filePath: localFilePath,
      originalName: req.file.originalname,
    },
  });

  await Promise.all([
    saveResumeAnalysis(req.user.uid, {
      ...analysis,
      fileName: req.file.originalname,
      storageUrl,
      localFilePath,
    }),
    saveStudentProfile(req.user.uid, {
      skills: analysis.skills,
      projects: analysis.projects,
      certifications: analysis.certifications,
      resumeScore: analysis.atsScore,
    }, { partial: true }),
  ]);

  res.json({
    success: true,
    analysis: {
      ...analysis,
      storageUrl,
    },
  });
});

module.exports = {
  upload,
  analyzeResume,
};
