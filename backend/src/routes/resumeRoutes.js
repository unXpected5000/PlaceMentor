const express = require("express");
const { upload, analyzeResume } = require("../controllers/resumeController");
const { requireAuth } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.post("/", requireAuth, authorize("student"), upload.single("resume"), analyzeResume);

module.exports = router;
