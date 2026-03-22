const express = require("express");
const { createPrediction } = require("../controllers/predictionController");
const { requireAuth } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.post("/", requireAuth, authorize("student"), createPrediction);

module.exports = router;
