const db = require("../config/db");

/*
 * Check eligibility using the rules stored in the
 * schemes table.
 *
 * Database = single source of truth.
 */

const checkEligibility = async (schemeId, userData) => {
  // =========================================================
  // FIND SCHEME FROM DATABASE
  // =========================================================

  const [schemes] = await db.query(
    `SELECT *
     FROM schemes
     WHERE scheme_id = ?
     AND status = 'active'
     LIMIT 1`,
    [schemeId]
  );

  if (schemes.length === 0) {
    throw new Error("Scheme not found");
  }

  const scheme = schemes[0];

  // =========================================================
  // HELPERS
  // =========================================================

  const fail = (reason) => ({
    eligible: false,
    scheme: scheme.name,
    reason,
  });

  const isConfigured = (value) =>
    value !== null && value !== undefined;

  const isRequired = (value) =>
    Boolean(value);

  const getYesNoAnswer = (value) =>
    String(value).trim().toLowerCase() === "yes";

  const getAllowedValues = (value) =>
    String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const hasValue = (value) =>
    value !== undefined &&
    value !== null &&
    String(value).trim() !== "";

  const getNumber = (value) =>
    Number(value);

  const isValidNumber = (value) =>
    hasValue(value) && Number.isFinite(getNumber(value));

  // =========================================================
  // BASIC VALIDATION
  // =========================================================

  if (!userData || typeof userData !== "object") {
    throw new Error("User data is required");
  }

  if (
    typeof userData.fullName !== "string" ||
    !userData.fullName.trim()
  ) {
    throw new Error("Full name is required");
  }

  // =========================================================
  // AGE CHECK
  // =========================================================

  if (isConfigured(scheme.min_age)) {
    if (!isValidNumber(userData.age)) {
      return fail("Age is required.");
    }

    if (
      getNumber(userData.age) <
      getNumber(scheme.min_age)
    ) {
      return fail(
        `Age must be at least ${scheme.min_age} years.`
      );
    }
  }

  if (isConfigured(scheme.max_age)) {
    if (!isValidNumber(userData.age)) {
      return fail("Age is required.");
    }

    if (
      getNumber(userData.age) >
      getNumber(scheme.max_age)
    ) {
      return fail(
        `Age must not exceed ${scheme.max_age} years.`
      );
    }
  }

  // =========================================================
  // GENDER CHECK
  // =========================================================

  if (scheme.gender) {
    const allowedGenders = getAllowedValues(
      scheme.gender
    );

    if (!hasValue(userData.gender)) {
      return fail("Gender is required.");
    }

    if (
      !allowedGenders.includes(
        String(userData.gender).trim()
      )
    ) {
      return fail(
        "Gender requirement not satisfied."
      );
    }
  }

  // =========================================================
  // TAMIL NADU RESIDENCY CHECK
  // =========================================================

  if (isConfigured(scheme.tn_resident)) {
    if (!hasValue(userData.tnResident)) {
      return fail("Tamil Nadu residency information is required.");
    }

    const requiredResident = isRequired(
      scheme.tn_resident
    );

    const userIsResident = getYesNoAnswer(
      userData.tnResident
    );

    if (userIsResident !== requiredResident) {
      return fail(
        "Tamil Nadu residency requirement not satisfied."
      );
    }
  }

  // =========================================================
  // COMMUNITY CHECK
  // =========================================================

  if (scheme.community) {
    const allowedCommunities = getAllowedValues(
      scheme.community
    );

    if (!hasValue(userData.community)) {
      return fail("Community is required.");
    }

    if (
      !allowedCommunities.includes(
        String(userData.community).trim()
      )
    ) {
      return fail(
        "Community requirement not satisfied."
      );
    }
  }

  // =========================================================
  // CLASS LEVEL CHECK
  // =========================================================

  if (scheme.class_level) {
    const allowedLevels = getAllowedValues(
      scheme.class_level
    );

    if (!hasValue(userData.classLevel)) {
      return fail("Class or education level is required.");
    }

    if (
      !allowedLevels.includes(
        String(userData.classLevel).trim()
      )
    ) {
      return fail(
        "Class or education level requirement not satisfied."
      );
    }
  }

  // =========================================================
  // COURSE CHECK
  // =========================================================

  if (scheme.course) {
    const allowedCourses = getAllowedValues(
      scheme.course
    );

    if (!hasValue(userData.course)) {
      return fail("Course is required.");
    }

    if (
      !allowedCourses.includes(
        String(userData.course).trim()
      )
    ) {
      return fail(
        "Course requirement not satisfied."
      );
    }
  }

  // =========================================================
  // PROGRAM CHECK
  // =========================================================

  if (scheme.program) {
    const allowedPrograms = getAllowedValues(
      scheme.program
    );

    if (!hasValue(userData.program)) {
      return fail("Programme is required.");
    }

    if (
      !allowedPrograms.includes(
        String(userData.program).trim()
      )
    ) {
      return fail(
        "Programme requirement not satisfied."
      );
    }
  }

  // =========================================================
  // PREVIOUS QUALIFICATION CHECK
  // =========================================================

  if (scheme.previous_qualification) {
    const allowedQualifications =
      getAllowedValues(
        scheme.previous_qualification
      );

    if (!hasValue(userData.previousQualification)) {
      return fail(
        "Previous qualification is required."
      );
    }

    if (
      !allowedQualifications.includes(
        String(userData.previousQualification).trim()
      )
    ) {
      return fail(
        "Previous qualification requirement not satisfied."
      );
    }
  }

  // =========================================================
  // PREVIOUS QUALIFICATION PERCENTAGE
  // =========================================================

  if (
    isConfigured(
      scheme.previous_qualification_percentage
    )
  ) {
    if (
      !isValidNumber(
        userData.previousQualificationPercentage
      )
    ) {
      return fail(
        "Previous qualification percentage is required."
      );
    }

    if (
      getNumber(
        userData.previousQualificationPercentage
      ) <
      getNumber(
        scheme.previous_qualification_percentage
      )
    ) {
      return fail(
        `Previous qualification percentage must be at least ${scheme.previous_qualification_percentage}%.`
      );
    }
  }

  // =========================================================
  // ACADEMIC PERCENTAGE
  // =========================================================

  if (isConfigured(scheme.min_percentage)) {
    if (!isValidNumber(userData.percentage)) {
      return fail("Academic percentage is required.");
    }

    if (
      getNumber(userData.percentage) <
      getNumber(scheme.min_percentage)
    ) {
      return fail(
        `Academic percentage must be at least ${scheme.min_percentage}%.`
      );
    }
  }

  // =========================================================
  // SCHOOL TYPE CHECK
  // =========================================================

  if (scheme.school_type) {
    const allowedSchoolTypes = getAllowedValues(
      scheme.school_type
    );

    if (!hasValue(userData.schoolType)) {
      return fail("School type is required.");
    }

    if (
      !allowedSchoolTypes.includes(
        String(userData.schoolType).trim()
      )
    ) {
      return fail(
        "School type requirement not satisfied."
      );
    }
  }

  // =========================================================
  // INSTITUTION TYPE CHECK
  // =========================================================

  if (scheme.institution_type) {
    const allowedInstitutionTypes =
      getAllowedValues(
        scheme.institution_type
      );

    if (!hasValue(userData.institutionType)) {
      return fail("Institution type is required.");
    }

    if (
      !allowedInstitutionTypes.includes(
        String(userData.institutionType).trim()
      )
    ) {
      return fail(
        "Institution type requirement not satisfied."
      );
    }
  }

  // =========================================================
  // GOVERNMENT SCHOOL CHECK
  // =========================================================

  if (
    isConfigured(scheme.studied_govt_school)
  ) {
    if (!hasValue(userData.studiedGovtSchool)) {
      return fail(
        "Government school study information is required."
      );
    }

    const required = isRequired(
      scheme.studied_govt_school
    );

    const answer = getYesNoAnswer(
      userData.studiedGovtSchool
    );

    if (answer !== required) {
      return fail(
        "Government school study requirement not satisfied."
      );
    }
  }

  // =========================================================
  // CLASSES 6–12 GOVERNMENT SCHOOL CHECK
  // =========================================================

  if (
    isConfigured(
      scheme.studied_classes_6_12_govt
    )
  ) {
    if (
      !hasValue(
        userData.studiedClasses6To12Govt
      )
    ) {
      return fail(
        "Classes 6–12 government school information is required."
      );
    }

    const required = isRequired(
      scheme.studied_classes_6_12_govt
    );

    const answer = getYesNoAnswer(
      userData.studiedClasses6To12Govt
    );

    if (answer !== required) {
      return fail(
        "Classes 6–12 government school requirement not satisfied."
      );
    }
  }

  // =========================================================
  // CURRENTLY ENROLLED CHECK
  // =========================================================

  if (
    isConfigured(scheme.currently_enrolled)
  ) {
    if (!hasValue(userData.currentlyEnrolled)) {
      return fail(
        "Current enrollment information is required."
      );
    }

    const required = isRequired(
      scheme.currently_enrolled
    );

    const answer = getYesNoAnswer(
      userData.currentlyEnrolled
    );

    if (answer !== required) {
      return fail(
        "Current enrollment requirement not satisfied."
      );
    }
  }

  // =========================================================
  // FULL-TIME CHECK
  // =========================================================

  if (
    isConfigured(scheme.full_time_required)
  ) {
    if (!hasValue(userData.fullTime)) {
      return fail(
        "Full-time study information is required."
      );
    }

    const required = isRequired(
      scheme.full_time_required
    );

    const answer = getYesNoAnswer(
      userData.fullTime
    );

    if (answer !== required) {
      return fail(
        "Full-time study requirement not satisfied."
      );
    }
  }

  // =========================================================
  // PROFESSIONAL COURSE CHECK
  // =========================================================

  if (
    isConfigured(scheme.professional_course)
  ) {
    if (!hasValue(userData.professionalCourse)) {
      return fail(
        "Professional course information is required."
      );
    }

    const required = isRequired(
      scheme.professional_course
    );

    const answer = getYesNoAnswer(
      userData.professionalCourse
    );

    if (answer !== required) {
      return fail(
        "Professional course requirement not satisfied."
      );
    }
  }

  // =========================================================
  // ANNUAL FAMILY INCOME CHECK
  // =========================================================

  if (
    isConfigured(scheme.max_annual_income)
  ) {
    if (!isValidNumber(userData.annualIncome)) {
      return fail(
        "Annual family income is required."
      );
    }

    if (
      getNumber(userData.annualIncome) >
      getNumber(scheme.max_annual_income)
    ) {
      return fail(
        "Annual family income exceeds the permitted limit."
      );
    }
  }

  // =========================================================
  // FAMILY HEAD CHECK
  // =========================================================

  if (
    isConfigured(scheme.family_head_required)
  ) {
    if (!hasValue(userData.familyHead)) {
      return fail(
        "Family head information is required."
      );
    }

    const required = isRequired(
      scheme.family_head_required
    );

    const answer = getYesNoAnswer(
      userData.familyHead
    );

    if (answer !== required) {
      return fail(
        "Family head requirement not satisfied."
      );
    }
  }

  // =========================================================
  // FIRST GRADUATE CHECK
  // =========================================================

  if (
    isConfigured(scheme.first_graduate_required)
  ) {
    if (!hasValue(userData.firstGraduate)) {
      return fail(
        "First-generation graduate information is required."
      );
    }

    const required = isRequired(
      scheme.first_graduate_required
    );

    const answer = getYesNoAnswer(
      userData.firstGraduate
    );

    if (answer !== required) {
      return fail(
        "First-generation graduate requirement not satisfied."
      );
    }
  }

  // =========================================================
  // FIRST DIPLOMA HOLDER CHECK
  // =========================================================

  if (
    isConfigured(
      scheme.first_diploma_holder_required
    )
  ) {
    if (!hasValue(userData.firstDiplomaHolder)) {
      return fail(
        "First-generation diploma holder information is required."
      );
    }

    const required = isRequired(
      scheme.first_diploma_holder_required
    );

    const answer = getYesNoAnswer(
      userData.firstDiplomaHolder
    );

    if (answer !== required) {
      return fail(
        "First-generation diploma holder requirement not satisfied."
      );
    }
  }

  // =========================================================
  // RURAL STUDENT CHECK
  // =========================================================

  if (
    isConfigured(scheme.rural_student_required)
  ) {
    if (!hasValue(userData.ruralStudent)) {
      return fail(
        "Rural student information is required."
      );
    }

    const required = isRequired(
      scheme.rural_student_required
    );

    const answer = getYesNoAnswer(
      userData.ruralStudent
    );

    if (answer !== required) {
      return fail(
        "Rural student requirement not satisfied."
      );
    }
  }

  // =========================================================
  // HOSTELLER CHECK
  // =========================================================

  if (
    isConfigured(scheme.hosteller_required)
  ) {
    if (!hasValue(userData.hosteller)) {
      return fail(
        "Hosteller information is required."
      );
    }

    const required = isRequired(
      scheme.hosteller_required
    );

    const answer = getYesNoAnswer(
      userData.hosteller
    );

    if (answer !== required) {
      return fail(
        "Hosteller requirement not satisfied."
      );
    }
  }

  // =========================================================
  // FAMILY ALREADY RECEIVED BENEFIT
  // =========================================================

  if (
    isConfigured(
      scheme.family_already_received_benefit
    )
  ) {
    if (
      !hasValue(
        userData.familyAlreadyReceivedBenefit
      )
    ) {
      return fail(
        "Family benefit information is required."
      );
    }

    const required = isRequired(
      scheme.family_already_received_benefit
    );

    const answer = getYesNoAnswer(
      userData.familyAlreadyReceivedBenefit
    );

    if (answer !== required) {
      return fail(
        "Family benefit requirement not satisfied."
      );
    }
  }

  // =========================================================
  // DISABILITY CHECK
  // =========================================================

  if (
    isConfigured(scheme.disability_required)
  ) {
    if (!hasValue(userData.disability)) {
      return fail(
        "Disability information is required."
      );
    }

    const required = isRequired(
      scheme.disability_required
    );

    const answer = getYesNoAnswer(
      userData.disability
    );

    if (answer !== required) {
      return fail(
        "Disability requirement not satisfied."
      );
    }
  }

  // =========================================================
  // DISABILITY PERCENTAGE
  // =========================================================

  if (
    isConfigured(
      scheme.min_disability_percentage
    )
  ) {
    if (
      !isValidNumber(
        userData.disabilityPercentage
      )
    ) {
      return fail(
        "Disability percentage is required."
      );
    }

    if (
      getNumber(userData.disabilityPercentage) <
      getNumber(
        scheme.min_disability_percentage
      )
    ) {
      return fail(
        `Disability percentage must be at least ${scheme.min_disability_percentage}%.`
      );
    }
  }

  // =========================================================
  // CONFIRMED ADMISSION
  // =========================================================

  if (
    isConfigured(
      scheme.admission_confirmed_required
    )
  ) {
    if (!hasValue(userData.admissionConfirmed)) {
      return fail(
        "Admission confirmation information is required."
      );
    }

    const required = isRequired(
      scheme.admission_confirmed_required
    );

    const answer = getYesNoAnswer(
      userData.admissionConfirmed
    );

    if (answer !== required) {
      return fail(
        "Confirmed admission requirement not satisfied."
      );
    }
  }

  // =========================================================
  // FOREIGN UNIVERSITY
  // =========================================================

  if (
    isConfigured(
      scheme.foreign_university_required
    )
  ) {
    if (!hasValue(userData.foreignUniversity)) {
      return fail(
        "Foreign university information is required."
      );
    }

    const required = isRequired(
      scheme.foreign_university_required
    );

    const answer = getYesNoAnswer(
      userData.foreignUniversity
    );

    if (answer !== required) {
      return fail(
        "Foreign university admission requirement not satisfied."
      );
    }
  }

  // =========================================================
  // FOREIGN COUNTRY
  // =========================================================

  if (scheme.foreign_country) {
    if (!hasValue(userData.foreignCountry)) {
      return fail(
        "Foreign country is required."
      );
    }

    if (
      String(userData.foreignCountry)
        .trim()
        .toLowerCase() !==
      String(scheme.foreign_country)
        .trim()
        .toLowerCase()
    ) {
      return fail(
        "Foreign country requirement not satisfied."
      );
    }
  }

  // =========================================================
  // PASSPORT
  // =========================================================

  if (
    isConfigured(scheme.passport_required)
  ) {
    if (!hasValue(userData.passport)) {
      return fail(
        "Passport information is required."
      );
    }

    const required = isRequired(
      scheme.passport_required
    );

    const answer = getYesNoAnswer(
      userData.passport
    );

    if (answer !== required) {
      return fail(
        "Valid passport requirement not satisfied."
      );
    }
  }

  // =========================================================
  // COMMUNITY CERTIFICATE
  // =========================================================

  if (
    isConfigured(
      scheme.community_certificate_required
    )
  ) {
    if (!hasValue(userData.communityCertificate)) {
      return fail(
        "Community certificate information is required."
      );
    }

    const required = isRequired(
      scheme.community_certificate_required
    );

    const answer = getYesNoAnswer(
      userData.communityCertificate
    );

    if (answer !== required) {
      return fail(
        "Community certificate requirement not satisfied."
      );
    }
  }

  // =========================================================
  // INCOME CERTIFICATE
  // =========================================================

  if (
    isConfigured(
      scheme.income_certificate_required
    )
  ) {
    if (!hasValue(userData.incomeCertificate)) {
      return fail(
        "Income certificate information is required."
      );
    }

    const required = isRequired(
      scheme.income_certificate_required
    );

    const answer = getYesNoAnswer(
      userData.incomeCertificate
    );

    if (answer !== required) {
      return fail(
        "Income certificate requirement not satisfied."
      );
    }
  }

  // =========================================================
  // BONAFIDE CERTIFICATE
  // =========================================================

  if (
    isConfigured(
      scheme.bonafide_certificate_required
    )
  ) {
    if (!hasValue(userData.bonafideCertificate)) {
      return fail(
        "Bonafide certificate information is required."
      );
    }

    const required = isRequired(
      scheme.bonafide_certificate_required
    );

    const answer = getYesNoAnswer(
      userData.bonafideCertificate
    );

    if (answer !== required) {
      return fail(
        "Bonafide certificate requirement not satisfied."
      );
    }
  }

  // =========================================================
  // ADMISSION PROOF
  // =========================================================

  if (
    isConfigured(
      scheme.admission_proof_required
    )
  ) {
    if (!hasValue(userData.admissionProof)) {
      return fail(
        "Admission proof information is required."
      );
    }

    const required = isRequired(
      scheme.admission_proof_required
    );

    const answer = getYesNoAnswer(
      userData.admissionProof
    );

    if (answer !== required) {
      return fail(
        "Admission proof requirement not satisfied."
      );
    }
  }

  // =========================================================
  // DISABILITY CERTIFICATE
  // =========================================================

  if (
    isConfigured(
      scheme.disability_certificate_required
    )
  ) {
    if (
      !hasValue(
        userData.disabilityCertificate
      )
    ) {
      return fail(
        "Disability certificate information is required."
      );
    }

    const required = isRequired(
      scheme.disability_certificate_required
    );

    const answer = getYesNoAnswer(
      userData.disabilityCertificate
    );

    if (answer !== required) {
      return fail(
        "Disability certificate requirement not satisfied."
      );
    }
  }

  // =========================================================
  // NATIVITY CERTIFICATE
  // =========================================================

  if (
    isConfigured(
      scheme.nativity_certificate_required
    )
  ) {
    if (!hasValue(userData.nativityCertificate)) {
      return fail(
        "Nativity certificate information is required."
      );
    }

    const required = isRequired(
      scheme.nativity_certificate_required
    );

    const answer = getYesNoAnswer(
      userData.nativityCertificate
    );

    if (answer !== required) {
      return fail(
        "Nativity certificate requirement not satisfied."
      );
    }
  }

  // =========================================================
  // BANK ACCOUNT
  // =========================================================

  if (
    isConfigured(
      scheme.bank_account_required
    )
  ) {
    if (!hasValue(userData.bankAccount)) {
      return fail(
        "Bank account information is required."
      );
    }

    const required = isRequired(
      scheme.bank_account_required
    );

    const answer = getYesNoAnswer(
      userData.bankAccount
    );

    if (answer !== required) {
      return fail(
        "Active bank account requirement not satisfied."
      );
    }
  }

  // =========================================================
  // AADHAAR
  // =========================================================

  if (
    isConfigured(scheme.aadhaar_required)
  ) {
    if (!hasValue(userData.aadhaar)) {
      return fail(
        "Aadhaar information is required."
      );
    }

    const required = isRequired(
      scheme.aadhaar_required
    );

    const answer = getYesNoAnswer(
      userData.aadhaar
    );

    if (answer !== required) {
      return fail(
        "Aadhaar requirement not satisfied."
      );
    }
  }

  // =========================================================
  // ELIGIBLE
  // =========================================================

  return {
    eligible: true,
    scheme: scheme.name,
    reason: "You are eligible for this scheme.",
  };
};

module.exports = {
  checkEligibility,
};