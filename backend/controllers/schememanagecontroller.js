const db = require("../config/db");

// =========================================================
// ALLOWED SCHEME FIELDS
// =========================================================
// Only these columns can be created/updated through the API.
// scheme_id, created_at and updated_at are handled by the DB.

const allowedFields = [
  "name",
  "description",
  "benefit",
  "category",
  "course",
  "program",
  "gender",
  "community",
  "class_level",
  "previous_qualification",
  "previous_qualification_percentage",
  "min_age",
  "max_age",
  "min_percentage",
  "max_annual_income",
  "school_type",
  "institution_type",
  "medium",

  "tn_resident",

  "studied_govt_school",
  "studied_classes_6_12_govt",

  "currently_enrolled",
  "full_time_required",
  "professional_course",

  "government_quota_required",

  "family_head_required",
  "first_graduate_required",
  "first_diploma_holder_required",
  "rural_student_required",
  "hosteller_required",
  "family_already_received_benefit",
  "previous_scholarship_received_required",

  "parent_disability_required",
  "disability_required",
  "min_disability_percentage",
  "reader_required",

  "admission_confirmed_required",
  "admission_proof_required",

  "foreign_university_required",
  "foreign_country",
  "foreign_field_of_study",
  "passport_required",

  "community_certificate_required",
  "income_certificate_required",
  "bonafide_certificate_required",
  "disability_certificate_required",
  "nativity_certificate_required",
  "bank_account_required",
  "aadhaar_required",

  "previous_exam_pass_required",
  "minimum_attendance_percentage",

  "recognized_institution_required",
  "government_school_required",
  "government_aided_school_allowed",

  "source_url",
  "application_url",

  "status",
  "last_verified_at",
];

// =========================================================
// FILTER BODY
// =========================================================

const filterAllowedFields = (data) => {
  const filteredData = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      filteredData[field] = data[field];
    }
  }

  return filteredData;
};

// =========================================================
// CREATE SCHEME
// =========================================================

const createScheme = async (req, res) => {
  try {
    const schemeData = filterAllowedFields(req.body);

    // Basic validation
    if (!schemeData.name) {
      return res.status(400).json({
        success: false,
        message: "Scheme name is required.",
      });
    }

    if (!schemeData.status) {
      schemeData.status = "active";
    }

    const fields = Object.keys(schemeData);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid scheme data provided.",
      });
    }

    const columns = fields.map((field) => `\`${field}\``).join(", ");

    const placeholders = fields.map(() => "?").join(", ");

    const values = fields.map((field) => schemeData[field]);

    const [result] = await db.execute(
      `
      INSERT INTO schemes
      (${columns})
      VALUES
      (${placeholders})
      `,
      values
    );

    res.status(201).json({
      success: true,
      message: "Scheme created successfully.",
      scheme_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating scheme:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create scheme.",
    });
  }
};

// =========================================================
// UPDATE SCHEME
// =========================================================

const updateScheme = async (req, res) => {
  try {
    const { id } = req.params;

    const schemeData = filterAllowedFields(req.body);

    // Validate numeric fields
    const numericFields = [
      "previous_qualification_percentage",
      "min_age",
      "max_age",
      "min_percentage",
      "max_annual_income",
      "min_disability_percentage",
      "minimum_attendance_percentage",
    ];

    for (const field of numericFields) {
      if (
        Object.prototype.hasOwnProperty.call(schemeData, field) &&
        schemeData[field] !== null &&
        schemeData[field] !== "" &&
        !Number.isFinite(Number(schemeData[field]))
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid number.`,
        });
      }
    }

    const fields = Object.keys(schemeData);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    // Check whether scheme exists
    const [existingSchemes] = await db.execute(
      `
      SELECT scheme_id
      FROM schemes
      WHERE scheme_id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existingSchemes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Scheme not found.",
      });
    }

    const setClause = fields
      .map((field) => `\`${field}\` = ?`)
      .join(", ");

    const values = fields.map((field) => schemeData[field]);

    values.push(id);

    const [result] = await db.execute(
      `
      UPDATE schemes
      SET ${setClause}
      WHERE scheme_id = ?
      `,
      values
    );

    res.status(200).json({
      success: true,
      message: "Scheme updated successfully.",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error updating scheme:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update scheme.",
    });
  }
};

// =========================================================
// DELETE / DEACTIVATE SCHEME
// =========================================================
// We don't permanently delete the row.
// Instead, status becomes "inactive".

const deleteScheme = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `
      UPDATE schemes
      SET status = 'inactive'
      WHERE scheme_id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Scheme not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Scheme deactivated successfully.",
    });
  } catch (error) {
    console.error("Error deactivating scheme:", error);

    res.status(500).json({
      success: false,
      message: "Failed to deactivate scheme.",
    });
  }
};

// =========================================================
// EXPORT
// =========================================================

module.exports = {
  createScheme,
  updateScheme,
  deleteScheme,
};