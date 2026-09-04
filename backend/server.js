const express = require("express");
const cors = require("cors");
require("dotenv").config();

const eligibilityRoutes = require("./routes/eligibilityroutes");
const schemesRoutes = require("./routes/schemesroutes");
const schemeManagementRoutes = require("./routes/schememanageroutes");

const db = require("./config/db");

const app = express();

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());
app.use(express.json());


// =========================================================
// ROUTES
// =========================================================

// Eligibility checking
app.use("/api/eligibility", eligibilityRoutes);

// Public scheme routes
app.use("/api/schemes", schemesRoutes);

// Scheme management routes
app.use("/api/scheme-management", schemeManagementRoutes);


// =========================================================
// TEST ROUTE
// =========================================================

app.get("/", (req, res) => {
  res.json({
    message: "Eligibility API is running",
  });
});


// =========================================================
// START SERVER
// =========================================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const connection = await db.getConnection();

    console.log("✅ Database connected successfully");

    connection.release();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error.message);
  }
};

startServer();