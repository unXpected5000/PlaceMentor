const { asyncHandler } = require("../utils/asyncHandler");
const { listStudents, listCompanies } = require("../services/studentService");
const {
  exportStudentsTrainingData,
  readTrainingHistory,
  appendTrainingHistory,
} = require("../services/trainingDataService");
const { runPythonScript } = require("../services/pythonRunner");
const { HttpError } = require("../utils/httpError");

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildModelPerformance(students) {
  const labeledStudents = students.filter(
    (student) => student.profile && typeof student.profile.placed === "boolean"
  );
  const placementComparisons = labeledStudents.filter((student) => student.prediction);
  const correctPlacementCalls = placementComparisons.filter((student) => {
    const predictedPlaced = Number(student.prediction?.placementProbability || 0) >= 50;
    return predictedPlaced === Boolean(student.profile?.placed);
  }).length;

  const placedWithActualRole = labeledStudents.filter(
    (student) =>
      student.profile?.placed &&
      student.profile?.finalRole &&
      student.prediction?.predictedRole
  );
  const correctRoleCalls = placedWithActualRole.filter(
    (student) =>
      String(student.profile.finalRole).trim().toLowerCase() ===
      String(student.prediction.predictedRole).trim().toLowerCase()
  ).length;

  const placedWithSalary = labeledStudents.filter(
    (student) =>
      student.profile?.placed &&
      Number(student.profile?.finalSalaryLpa || 0) > 0 &&
      Number(student.prediction?.expectedSalaryLpa || 0) > 0
  );
  const salaryErrors = placedWithSalary.map((student) =>
    Math.abs(
      Number(student.profile.finalSalaryLpa || 0) -
        Number(student.prediction.expectedSalaryLpa || 0)
    )
  );

  const predictionVsActual = labeledStudents.slice(0, 12).map((student) => ({
    uid: student.uid,
    name: student.name,
    email: student.email,
    predictedRole: student.prediction?.predictedRole || "N/A",
    actualRole: student.profile?.finalRole || (student.profile?.placed ? "Pending role" : "Not Placed"),
    placementProbability: Number(student.prediction?.placementProbability || 0),
    actualPlacement: Boolean(student.profile?.placed),
    expectedSalaryLpa: Number(student.prediction?.expectedSalaryLpa || 0),
    actualSalaryLpa: Number(student.profile?.finalSalaryLpa || 0),
  }));

  return {
    labeledOutcomes: labeledStudents.length,
    placementAccuracy: placementComparisons.length
      ? Math.round((correctPlacementCalls / placementComparisons.length) * 100)
      : 0,
    roleAccuracy: placedWithActualRole.length
      ? Math.round((correctRoleCalls / placedWithActualRole.length) * 100)
      : 0,
    salaryMae: placedWithSalary.length ? Number(average(salaryErrors).toFixed(2)) : 0,
    predictionVsActual,
  };
}

const getOverview = asyncHandler(async (req, res) => {
  const [students, companies] = await Promise.all([listStudents(), listCompanies()]);

  const predictionValues = students
    .map((student) => student.prediction?.placementProbability || 0)
    .filter(Boolean);

  const averagePlacementProbability =
    predictionValues.length > 0
      ? Math.round(
          predictionValues.reduce((sum, value) => sum + value, 0) /
            predictionValues.length
        )
      : 0;

  const roleDistribution = students.reduce((accumulator, student) => {
    const role = student.prediction?.predictedRole || "Unassigned";
    accumulator[role] = (accumulator[role] || 0) + 1;
    return accumulator;
  }, {});

  const stageDistribution = students.reduce((accumulator, student) => {
    const stage = student.profile?.pipelineStage || "Shortlist";
    accumulator[stage] = (accumulator[stage] || 0) + 1;
    return accumulator;
  }, {});

  const statusDistribution = students.reduce((accumulator, student) => {
    const status = student.profile?.applicationStatus || "Not Applied";
    accumulator[status] = (accumulator[status] || 0) + 1;
    return accumulator;
  }, {});

  res.json({
    success: true,
    overview: {
      totalStudents: students.length,
      readyForPlacement: students.filter(
        (student) => (student.prediction?.placementProbability || 0) >= 70
      ).length,
      averagePlacementProbability,
      totalCompanies: companies.length,
      roleDistribution,
      stageDistribution,
      statusDistribution,
      placedStudents: students.filter((student) => student.profile?.placed).length,
      notPlacedStudents: students.filter((student) => student.profile && student.profile.placed === false).length,
      modelPerformance: buildModelPerformance(students),
      retrainingHistory: readTrainingHistory(),
    },
  });
});

const exportTrainingData = asyncHandler(async (req, res) => {
  const result = await exportStudentsTrainingData();

  res.json({
    success: true,
    message: "Firestore training dataset exported successfully.",
    ...result,
  });
});

const retrainModels = asyncHandler(async (req, res) => {
  const exportResult = await exportStudentsTrainingData();

  if (exportResult.rowsExported === 0) {
    throw new HttpError(
      400,
      "No labeled student outcomes available yet. Mark students as placed or not placed first."
    );
  }

  const trainingResult = await runPythonScript("train.py", {});
  const history = appendTrainingHistory({
    type: "retrain",
    rowsExported: exportResult.rowsExported,
    studentsReviewed: exportResult.studentsReviewed,
    rowsTrained: trainingResult.rows_trained,
    artifacts: trainingResult.artifacts || [],
    metrics: trainingResult.metrics || {},
  });

  res.json({
    success: true,
    message: "Models retrained successfully.",
    export: exportResult,
    training: trainingResult,
    history,
  });
});

module.exports = { getOverview, exportTrainingData, retrainModels };
