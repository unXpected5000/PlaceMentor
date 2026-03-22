const admin = require("firebase-admin");
const { env } = require("./env");

let firebaseApp = null;
let db = null;
let bucket = null;

if (env.firebase.isConfigured) {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    }),
    storageBucket: env.firebase.storageBucket,
  });

  db = admin.firestore();
  bucket = admin.storage().bucket();
}

function ensureFirebase() {
  if (!env.firebase.isConfigured || !firebaseApp || !db || !bucket) {
    const error = new Error(
      "Firebase is not configured. Add backend/.env values before using protected features."
    );
    error.statusCode = 500;
    throw error;
  }
}

module.exports = {
  admin,
  db,
  bucket,
  ensureFirebase,
  firebaseEnabled: env.firebase.isConfigured,
};
