const { checkEligibility } = require("../services/eligibilityService");
const db = require("../config/db");

const checkUserEligibility = async (req, res) => {
  try {
    const { schemeId, formData } = req.body;

    if (!schemeId || !formData) {
      return res.status(400).json({
        success: false,
        message: "Scheme ID and form data are required.",
      });
    }

    // Check eligibility
    const result = await checkEligibility(schemeId, formData);

    // Get user name from submitted form
    const userName = formData.fullName;

    if (!userName) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

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
      [userName, schemeId, result.scheme, result.eligible, new Date()],
    );

    // Return result to frontend
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
