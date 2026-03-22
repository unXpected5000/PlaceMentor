const express = require("express");
const {
  getCompanies,
  getCompanyMatches,
  getCompanyMatchBoard,
  createCompany,
  updateCompany,
  removeCompany,
} = require("../controllers/companyController");
const { requireAuth } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.get("/", requireAuth, getCompanies);
router.get("/matches", requireAuth, getCompanyMatches);
router.get("/board", requireAuth, authorize("tnp"), getCompanyMatchBoard);
router.post("/", requireAuth, authorize("tnp"), createCompany);
router.patch("/:companyId", requireAuth, authorize("tnp"), updateCompany);
router.delete("/:companyId", requireAuth, authorize("tnp"), removeCompany);

module.exports = router;
