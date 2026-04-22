const env = {
  port: Number(process.env.PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5000",
  pythonCommand: process.env.PYTHON_COMMAND || "python",
  demoAuthBypass: process.env.DEMO_AUTH_BYPASS === "true",
  firebaseWeb: {
    apiKey: process.env.FIREBASE_WEB_API_KEY || "",
    authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN || "",
    projectId: process.env.FIREBASE_WEB_PROJECT_ID || "",
    storageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET || "",
    messagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_WEB_APP_ID || "",
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    isConfigured: Boolean(
      process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.FIREBASE_STORAGE_BUCKET
    ),
  },
};

module.exports = { env };
