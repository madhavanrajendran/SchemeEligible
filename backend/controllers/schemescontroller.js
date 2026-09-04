const db = require("../config/db");

// =========================================================
// ALL POSSIBLE USER OPTIONS
// These are NOT eligibility rules.
// Eligibility is checked separately by eligibilityService.js
// =========================================================

const ALL_COMMUNITIES = [
  "SC",
  "ST",
  "SCC",
  "BC",
  "MBC",
  "DNC",
  "OC",
  "Other",
];

const ALL_COURSES = [
  "School",
  "ITI",
  "Diploma",
  "UG",
  "PG",
  "Professional",
  "PhD",
  "Research",
  "Other",
];

const ALL_PROGRAMMES = [
  "UG",
  "PG",
  "Professional",
  "PhD",
  "Research",
  "Other",
];

const ALL_SCHOOL_TYPES = [
  "Government",
  "Government-Aided",
  "Private",
  "Other",
];

const ALL_INSTITUTION_TYPES = [
  "Government",
  "Government-Aided",
  "Private",
  "Self Finance",
  "Recognised Institution",
  "Other",
];

const ALL_GENDERS = [
  "Male",
  "Female",
  "Other",
];

const YES_NO = [
  "Yes",
  "No",
];

// =========================================================
// BUILD DYNAMIC FORM FIELDS
// =========================================================

const buildFields = (scheme) => {
  const fields = [];

  // =======================================================
  // COMMON PERSONAL INFORMATION
  // =======================================================

  fields.push({
    name: "fullName",
    label: "Full Name",
    type: "text",
    required: true,
  });

  fields.push({
    name: "age",
    label: "Age",
    type: "number",
    required: true,
    min: 1,
    max: 100,
  });

  // =======================================================
  // GENDER
  // =======================================================

  if (scheme.gender) {
    fields.push({
      name: "gender",
      label: "Gender",
      type: "select",
      options: ALL_GENDERS,
      required: true,
    });
  }

  // =======================================================
  // TAMIL NADU RESIDENCY
  // =======================================================

  if (scheme.tn_resident !== null) {
    fields.push({
      name: "tnResident",
      label: "Are you a Tamil Nadu resident?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // COMMUNITY
  // =======================================================

  if (scheme.community) {
    fields.push({
      name: "community",
      label: "Community",
      type: "select",
      options: ALL_COMMUNITIES,
      required: true,
    });
  }

  // =======================================================
  // CLASS / LEVEL
  // =======================================================

  if (scheme.class_level) {
    fields.push({
      name: "classLevel",
      label: "Current Class / Level",
      type: "text",
      required: true,
    });
  }

  // =======================================================
  // COURSE
  // =======================================================

  if (scheme.course) {
    fields.push({
      name: "course",
      label: "Course",
      type: "select",
      options: ALL_COURSES,
      required: true,
    });
  }

  // =======================================================
  // PROGRAMME
  // =======================================================

  if (scheme.program) {
    fields.push({
      name: "program",
      label: "Programme",
      type: "select",
      options: ALL_PROGRAMMES,
      required: true,
    });
  }

  // =======================================================
  // PREVIOUS QUALIFICATION
  // =======================================================

  if (scheme.previous_qualification) {
    fields.push({
      name: "previousQualification",
      label: "Previous Qualification",
      type: "text",
      required: true,
    });
  }

  // =======================================================
  // SCHOOL TYPE
  // =======================================================

  if (
    scheme.school_type ||
    scheme.government_school_required !== null ||
    scheme.government_aided_school_allowed !== null
  ) {
    fields.push({
      name: "schoolType",
      label: "School Type",
      type: "select",
      options: ALL_SCHOOL_TYPES,
      required: true,
    });
  }

  // =======================================================
  // INSTITUTION TYPE
  // =======================================================

  if (
    scheme.institution_type ||
    scheme.recognized_institution_required !== null
  ) {
    fields.push({
      name: "institutionType",
      label: "Institution Type",
      type: "select",
      options: ALL_INSTITUTION_TYPES,
      required: true,
    });
  }

  // =======================================================
  // STUDIED IN GOVERNMENT SCHOOL
  // =======================================================

  if (scheme.studied_govt_school !== null) {
    fields.push({
      name: "studiedGovtSchool",
      label: "Did you study in a Government School?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // STUDIED CLASSES 6-12 IN GOVERNMENT SCHOOL
  // =======================================================

  if (scheme.studied_classes_6_12_govt !== null) {
    fields.push({
      name: "studiedClasses6To12Govt",
      label: "Did you study Classes 6–12 in a Government School?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // CURRENTLY ENROLLED
  // =======================================================

  if (scheme.currently_enrolled !== null) {
    fields.push({
      name: "currentlyEnrolled",
      label: "Are you currently enrolled?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // FULL TIME
  // =======================================================

  if (scheme.full_time_required !== null) {
    fields.push({
      name: "fullTime",
      label: "Are you studying full-time?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // PROFESSIONAL COURSE
  // =======================================================

  if (scheme.professional_course !== null) {
    fields.push({
      name: "professionalCourse",
      label: "Are you pursuing a professional course?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // MEDIUM
  // =======================================================

  if (scheme.medium) {
    fields.push({
      name: "medium",
      label: "Medium of Study",
      type: "select",
      options: [
        "Tamil",
        "English",
        "Other",
      ],
      required: true,
    });
  }

  // =======================================================
  // GOVERNMENT QUOTA
  // =======================================================

  if (scheme.government_quota_required !== null) {
    fields.push({
      name: "governmentQuota",
      label: "Are you admitted under Government Quota?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // ACADEMIC PERCENTAGE
  // =======================================================

  if (scheme.min_percentage !== null) {
    fields.push({
      name: "percentage",
      label: `Academic Percentage (minimum ${scheme.min_percentage}%)`,
      type: "number",
      required: true,
      min: 0,
      max: 100,
      step: 0.01,
    });
  }

  // =======================================================
  // PREVIOUS QUALIFICATION PERCENTAGE
  // =======================================================

  if (scheme.previous_qualification_percentage !== null) {
    fields.push({
      name: "previousQualificationPercentage",
      label: `Previous Qualification Percentage (minimum ${scheme.previous_qualification_percentage}%)`,
      type: "number",
      required: true,
      min: 0,
      max: 100,
      step: 0.01,
    });
  }

  // =======================================================
  // ANNUAL FAMILY INCOME
  // =======================================================

  if (scheme.max_annual_income !== null) {
    fields.push({
      name: "annualIncome",
      label: "Annual Family Income (₹)",
      type: "number",
      required: true,
      min: 0,
      step: 1000,
    });
  }

  // =======================================================
  // FAMILY HEAD
  // =======================================================

  if (scheme.family_head_required !== null) {
    fields.push({
      name: "familyHead",
      label: "Are you the head of your family?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // FIRST GRADUATE
  // =======================================================

  if (scheme.first_graduate_required !== null) {
    fields.push({
      name: "firstGraduate",
      label: "Are you a first-generation graduate?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // FIRST DIPLOMA HOLDER
  // =======================================================

  if (scheme.first_diploma_holder_required !== null) {
    fields.push({
      name: "firstDiplomaHolder",
      label: "Are you a first-generation diploma holder?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // RURAL STUDENT
  // =======================================================

  if (scheme.rural_student_required !== null) {
    fields.push({
      name: "ruralStudent",
      label: "Are you a rural student?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // HOSTELLER
  // =======================================================

  if (scheme.hosteller_required !== null) {
    fields.push({
      name: "hosteller",
      label: "Are you a hosteller?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // FAMILY ALREADY RECEIVED BENEFIT
  // =======================================================

  if (scheme.family_already_received_benefit !== null) {
    fields.push({
      name: "familyAlreadyReceivedBenefit",
      label: "Has your family already received this benefit?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // PREVIOUS SCHOLARSHIP
  // =======================================================

  if (scheme.previous_scholarship_received_required !== null) {
    fields.push({
      name: "previousScholarshipReceived",
      label: "Have you previously received a scholarship?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // PARENT DISABILITY
  // =======================================================

  if (scheme.parent_disability_required !== null) {
    fields.push({
      name: "parentDisability",
      label: "Does your parent have a disability?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // DISABILITY
  // =======================================================

  if (scheme.disability_required !== null) {
    fields.push({
      name: "disability",
      label: "Do you have a disability?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // DISABILITY PERCENTAGE
  // =======================================================

  if (scheme.min_disability_percentage !== null) {
    fields.push({
      name: "disabilityPercentage",
      label: `Disability Percentage (minimum ${scheme.min_disability_percentage}%)`,
      type: "number",
      required: true,
      min: 0,
      max: 100,
      step: 0.01,
    });
  }

  // =======================================================
  // READER REQUIREMENT
  // =======================================================

  if (scheme.reader_required !== null) {
    fields.push({
      name: "reader",
      label: "Do you require reader assistance?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // ADMISSION CONFIRMED
  // =======================================================

  if (scheme.admission_confirmed_required !== null) {
    fields.push({
      name: "admissionConfirmed",
      label: "Do you have confirmed admission?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // ADMISSION PROOF
  // =======================================================

  if (scheme.admission_proof_required !== null) {
    fields.push({
      name: "admissionProof",
      label: "Do you have admission proof?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // FOREIGN UNIVERSITY
  // =======================================================

  if (scheme.foreign_university_required !== null) {
    fields.push({
      name: "foreignUniversity",
      label: "Are you admitted to a foreign university?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // FOREIGN COUNTRY
  // =======================================================

  if (scheme.foreign_country) {
    fields.push({
      name: "foreignCountry",
      label: "Foreign Country",
      type: "text",
      required: true,
    });
  }

  // =======================================================
  // FOREIGN FIELD OF STUDY
  // =======================================================

  if (scheme.foreign_field_of_study) {
    fields.push({
      name: "foreignFieldOfStudy",
      label: "Field of Study",
      type: "text",
      required: true,
    });
  }

  // =======================================================
  // PASSPORT
  // =======================================================

  if (scheme.passport_required !== null) {
    fields.push({
      name: "passport",
      label: "Do you have a valid passport?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // COMMUNITY CERTIFICATE
  // =======================================================

  if (scheme.community_certificate_required !== null) {
    fields.push({
      name: "communityCertificate",
      label: "Do you have a Community Certificate?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // INCOME CERTIFICATE
  // =======================================================

  if (scheme.income_certificate_required !== null) {
    fields.push({
      name: "incomeCertificate",
      label: "Do you have an Income Certificate?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // BONAFIDE CERTIFICATE
  // =======================================================

  if (scheme.bonafide_certificate_required !== null) {
    fields.push({
      name: "bonafideCertificate",
      label: "Do you have a Bonafide Certificate?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // DISABILITY CERTIFICATE
  // =======================================================

  if (scheme.disability_certificate_required !== null) {
    fields.push({
      name: "disabilityCertificate",
      label: "Do you have a Disability Certificate?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // NATIVITY CERTIFICATE
  // =======================================================

  if (scheme.nativity_certificate_required !== null) {
    fields.push({
      name: "nativityCertificate",
      label: "Do you have a Nativity Certificate?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // BANK ACCOUNT
  // =======================================================

  if (scheme.bank_account_required !== null) {
    fields.push({
      name: "bankAccount",
      label: "Do you have an active bank account?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // AADHAAR
  // =======================================================

  if (scheme.aadhaar_required !== null) {
    fields.push({
      name: "aadhaar",
      label: "Do you have an Aadhaar Card?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // PREVIOUS EXAM PASSED
  // =======================================================

  if (scheme.previous_exam_pass_required !== null) {
    fields.push({
      name: "previousExamPass",
      label: "Have you passed the required previous examination?",
      type: "select",
      options: YES_NO,
      required: true,
    });
  }

  // =======================================================
  // MINIMUM ATTENDANCE
  // =======================================================

  if (scheme.minimum_attendance_percentage !== null) {
    fields.push({
      name: "attendancePercentage",
      label: `Attendance Percentage (minimum ${scheme.minimum_attendance_percentage}%)`,
      type: "number",
      required: true,
      min: 0,
      max: 100,
      step: 0.01,
    });
  }

  return fields;
};

// =========================================================
// GET ALL ACTIVE SCHEMES
// =========================================================

const getAllSchemes = async (req, res) => {
  try {
    const [schemes] = await db.query(
      `
      SELECT *
      FROM schemes
      WHERE status = 'active'
      ORDER BY scheme_id ASC
      `
    );

    const schemesWithFields = schemes.map((scheme) => ({
      ...scheme,
      fields: buildFields(scheme),
    }));

    res.status(200).json(schemesWithFields);
  } catch (error) {
    console.error("Error fetching schemes:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch schemes",
    });
  }
};

// =========================================================
// GET SINGLE SCHEME BY ID
// =========================================================

const getSchemeById = async (req, res) => {
  try {
    const { id } = req.params;

    const [schemes] = await db.query(
      `
      SELECT *
      FROM schemes
      WHERE scheme_id = ?
      AND status = 'active'
      LIMIT 1
      `,
      [id]
    );

    if (schemes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Scheme not found",
      });
    }

    const scheme = schemes[0];

    res.status(200).json({
      ...scheme,
      fields: buildFields(scheme),
    });
  } catch (error) {
    console.error("Error fetching scheme:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch scheme",
    });
  }
};

// =========================================================
// EXPORT
// =========================================================

module.exports = {
  getAllSchemes,
  getSchemeById,
};