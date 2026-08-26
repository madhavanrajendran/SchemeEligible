const express = require("express");

const router = express.Router();

const {
  checkUserEligibility,
} = require("../controllers/eligibilityController");

// Check user's eligibility
router.post("/check", checkUserEligibility);

module.exports = router;