const express = require("express");
const { getOverview } = require("../controllers/analyticsController");
const { requireAuth } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.get("/overview", requireAuth, authorize("tnp"), getOverview);

module.exports = router;
