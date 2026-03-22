const { admin, db, ensureFirebase } = require("../config/firebaseAdmin");
const { env } = require("../config/env");
const { asyncHandler } = require("../utils/asyncHandler");
const { HttpError } = require("../utils/httpError");

const DEMO_PROFILE = {
  uid: "demo-student",
  email: "demo@student.local",
  name: "Demo Student",
  role: "student",
};

async function decodeRequestToken(req) {
  if (env.demoAuthBypass) {
    return DEMO_PROFILE;
  }

  ensureFirebase();

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    throw new HttpError(401, "Missing Firebase auth token");
  }

  const decoded = await admin.auth().verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email,
  };
}

const verifyFirebaseToken = asyncHandler(async (req, res, next) => {
  req.user = await decodeRequestToken(req);
  next();
});

const requireAuth = asyncHandler(async (req, res, next) => {
  req.user = await decodeRequestToken(req);

  if (env.demoAuthBypass) {
    return next();
  }

  const profileSnapshot = await db.collection("users").doc(req.user.uid).get();

  if (!profileSnapshot.exists) {
    throw new HttpError(403, "User profile not found. Complete registration first.");
  }

  req.user = {
    uid: req.user.uid,
    email: req.user.email,
    ...profileSnapshot.data(),
  };

  next();
});

module.exports = { requireAuth, verifyFirebaseToken };
