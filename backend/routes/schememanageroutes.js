const express = require("express");

const {
  createScheme,
  updateScheme,
  deleteScheme,
} = require("../controllers/schememanagecontroller");

const aiAuthMiddleware = require("../middleware/aiAuthMiddleware");

const router = express.Router();


// =========================================================
// CREATE SCHEME
// POST /api/scheme-management
// =========================================================

router.post("/", aiAuthMiddleware, createScheme);


// =========================================================
// UPDATE SCHEME
// PUT /api/scheme-management/:id
// =========================================================

router.put("/:id", aiAuthMiddleware, updateScheme);


// =========================================================
// DEACTIVATE SCHEME
// DELETE /api/scheme-management/:id
// =========================================================

router.delete("/:id", aiAuthMiddleware, deleteScheme);


module.exports = router;
