const { asyncHandler } = require("../utils/asyncHandler");
const { listStudents, listCompanies } = require("../services/studentService");

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
    },
  });
});

module.exports = { getOverview };
