const crypto = require("crypto");
require("dotenv").config();

const AI_UPDATE_TOKEN = process.env.AI_UPDATE_TOKEN;

const safeTokenCompare = (providedToken, expectedToken) => {
  if (!providedToken || !expectedToken) {
    return false;
  }

  const providedBuffer = Buffer.from(providedToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
};

const aiAuthMiddleware = (req, res, next) => {
  if (!AI_UPDATE_TOKEN) {
    console.error("❌ AI_UPDATE_TOKEN is not configured.");

    return res.status(500).json({
      success: false,
      message: "Server authentication is not configured.",
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required.",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization format.",
    });
  }

  const providedToken = authHeader.substring(7);

  if (!safeTokenCompare(providedToken, AI_UPDATE_TOKEN)) {
    return res.status(403).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }

  next();
};

module.exports = aiAuthMiddleware;