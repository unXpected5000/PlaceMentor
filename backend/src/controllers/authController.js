const { asyncHandler } = require("../utils/asyncHandler");
const { upsertUserProfile, getUserProfile } = require("../services/studentService");
const { ensureFirebase, firebaseEnabled } = require("../config/firebaseAdmin");
const { HttpError } = require("../utils/httpError");

const registerProfile = asyncHandler(async (req, res) => {
  if (!firebaseEnabled) {
    throw new HttpError(
      500,
      "Firebase is not configured. Update backend/.env and frontend Firebase config."
    );
  }

  ensureFirebase();

  const { uid, name, email, role, department } = req.body;

  if (!uid || !name || !email || !role) {
    throw new HttpError(400, "uid, name, email and role are required");
  }

  if (req.user.uid !== uid || req.user.email !== email) {
    throw new HttpError(403, "Token user does not match the submitted profile");
  }

  const profile = {
    name,
    email,
    role,
    department: department || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await upsertUserProfile(uid, profile);

  res.status(201).json({
    success: true,
    profile: { uid, ...profile },
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const profile = await getUserProfile(req.user.uid);

  if (!profile) {
    throw new HttpError(404, "User profile not found");
  }

  res.json({
    success: true,
    profile: {
      uid: req.user.uid,
      ...profile,
    },
  });
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const existingProfile = await getUserProfile(req.user.uid);

  if (!existingProfile) {
    throw new HttpError(404, "User profile not found");
  }

  const updates = {
    updatedAt: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
    updates.name = String(req.body.name || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "department")) {
    updates.department = String(req.body.department || "").trim();
  }

  await upsertUserProfile(req.user.uid, updates);

  res.json({
    success: true,
    profile: {
      uid: req.user.uid,
      ...existingProfile,
      ...updates,
    },
  });
});

module.exports = {
  registerProfile,
  getCurrentUser,
  updateCurrentUser,
};
