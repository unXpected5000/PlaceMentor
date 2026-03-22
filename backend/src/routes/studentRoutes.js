const express = require("express");
const {
  getMyDashboard,
  saveMyProfile,
  getStudents,
  updateStudentById,
} = require("../controllers/studentController");
const { requireAuth } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.get("/me", requireAuth, getMyDashboard);
router.put("/me", requireAuth, authorize("student"), saveMyProfile);
router.get("/", requireAuth, authorize("faculty", "tnp"), getStudents);
router.patch("/:studentId", requireAuth, authorize("faculty", "tnp"), updateStudentById);

module.exports = router;
