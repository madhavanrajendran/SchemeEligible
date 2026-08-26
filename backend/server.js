const express = require("express");
const cors = require("cors");
require("dotenv").config();

const eligibilityRoutes = require("./routes/eligibilityroutes");
const db = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/eligibility", eligibilityRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Eligibility API is running",
  });
});

// Start server
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