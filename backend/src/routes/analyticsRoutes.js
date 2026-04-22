const express = require("express");
const {
  getOverview,
  exportTrainingData,
  retrainModels,
} = require("../controllers/analyticsController");
const { requireAuth } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.get("/overview", requireAuth, authorize("tnp"), getOverview);
router.post("/export-training-data", requireAuth, authorize("tnp"), exportTrainingData);
router.post("/retrain", requireAuth, authorize("tnp"), retrainModels);

module.exports = router;
