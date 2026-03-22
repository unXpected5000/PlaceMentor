const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const companyRoutes = require("./routes/companyRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { env } = require("./config/env");

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Placement Mentor backend is healthy",
    firebaseConfigured: env.firebase.isConfigured,
    pythonCommand: env.pythonCommand,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/analytics", analyticsRoutes);

const frontendPath = path.resolve(__dirname, "../../frontend");
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(frontendPath, "login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(frontendPath, "dashboard.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
