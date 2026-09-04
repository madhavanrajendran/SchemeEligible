const { checkEligibility } = require("../services/eligibilityService");
const db = require("../config/db");

const checkUserEligibility = async (req, res) => {
  try {
    const { schemeId, formData } = req.body;

    // Validate request
    if (!schemeId || !formData) {
      return res.status(400).json({
        success: false,
        message: "Scheme ID and form data are required.",
      });
    }

    // Validate user name
    const userName = formData.fullName;

    if (!userName || !userName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    // Check eligibility using the eligibility service
    const result = await checkEligibility(schemeId, formData);

    // Store eligibility check in database
    await db.execute(
      `
        INSERT INTO eligibility_checks
        (
          name,
          scheme_id,
          scheme_name,
          eligible,
          checked_at
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        userName.trim(),
        schemeId,
        result.scheme,
        result.eligible,
        new Date(),
      ]
    );

    // Return eligibility result to frontend
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Eligibility Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while checking eligibility.",
    });
  }
};

module.exports = {
  checkUserEligibility,
};