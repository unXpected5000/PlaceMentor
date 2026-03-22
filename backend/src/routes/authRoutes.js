const express = require("express");
const {
  registerProfile,
  getCurrentUser,
  updateCurrentUser,
} = require("../controllers/authController");
const { requireAuth, verifyFirebaseToken } = require("../middleware/auth");

const router = express.Router();

router.post("/profile", verifyFirebaseToken, registerProfile);
router.get("/me", requireAuth, getCurrentUser);
router.patch("/me", requireAuth, updateCurrentUser);

module.exports = router;
