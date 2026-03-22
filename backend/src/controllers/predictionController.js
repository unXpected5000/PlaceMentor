const { asyncHandler } = require("../utils/asyncHandler");
const { getStudentProfile, savePrediction } = require("../services/studentService");
const { runPythonScript } = require("../services/pythonRunner");
const { HttpError } = require("../utils/httpError");

const createPrediction = asyncHandler(async (req, res) => {
  const storedProfile = await getStudentProfile(req.user.uid);
  const studentInput = {
    ...(storedProfile || {}),
    ...req.body,
  };

  if (!studentInput.cgpa) {
    throw new HttpError(400, "Student profile is incomplete. Please save CGPA and scores.");
  }

  const prediction = await runPythonScript("predict.py", {
    type: "prediction",
    payload: studentInput,
  });

  await savePrediction(req.user.uid, prediction);

  res.json({
    success: true,
    prediction,
  });
});

module.exports = { createPrediction };
