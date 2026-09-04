const express = require("express");

const {
  getAllSchemes,
  getSchemeById,
} = require("../controllers/schemescontroller");

const router = express.Router();

// Get all active schemes
router.get("/", getAllSchemes);

// Get one scheme by ID
router.get("/:id", getSchemeById);

module.exports = router;