const express = require("express");

const router = express.Router();

const {
  checkUserEligibility,
} = require("../controllers/eligibilitycontroller");

// Check user's eligibility
router.post("/check", checkUserEligibility);

module.exports = router;