const schemes = require("../data/schemes");

const checkEligibility = async (schemeId, userData) => {
  // =========================================================
  // FIND SELECTED SCHEME
  // =========================================================

  const scheme = schemes.find(
    (scheme) => scheme.id === schemeId
  );

  if (!scheme) {
    throw new Error("Scheme not found");
  }

  const rules = scheme.eligibility;


  // =========================================================
  // GENDER CHECK
  // =========================================================

  if (
    rules.gender &&
    !rules.gender.includes(userData.gender)
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason: "Gender requirement not satisfied.",
    };
  }


  // =========================================================
  // TAMIL NADU RESIDENT CHECK
  // =========================================================

  if (
    rules.tnResident !== undefined &&
    userData.tnResident !== rules.tnResident
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Tamil Nadu residency requirement not satisfied.",
    };
  }


  // =========================================================
  // MINIMUM AGE CHECK
  // =========================================================

  if (
    rules.minAge !== undefined &&
    Number(userData.age) < rules.minAge
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason: "Age requirement not satisfied.",
    };
  }


  // =========================================================
  // MAXIMUM AGE CHECK
  // =========================================================

  if (
    rules.maxAge !== undefined &&
    Number(userData.age) > rules.maxAge
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason: "Age requirement not satisfied.",
    };
  }


  // =========================================================
  // COMMUNITY CHECK
  // =========================================================

  if (
    rules.community &&
    !rules.community.includes(userData.community)
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason: "Community requirement not satisfied.",
    };
  }


  // =========================================================
  // ANNUAL FAMILY INCOME CHECK
  // =========================================================

  if (
    rules.maxAnnualIncome !== undefined &&
    Number(userData.annualIncome) >
      rules.maxAnnualIncome
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Annual income exceeds the permitted limit.",
    };
  }


  // =========================================================
  // FAMILY HEAD CHECK
  // =========================================================

  if (
    rules.familyHead !== undefined &&
    userData.familyHead !== rules.familyHead
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Family head requirement not satisfied.",
    };
  }


  // =========================================================
  // SCHOOL TYPE CHECK
  // =========================================================

  if (
    rules.schoolType &&
    !rules.schoolType.includes(userData.schoolType)
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "School type requirement not satisfied.",
    };
  }


  // =========================================================
  // COURSE CHECK
  // =========================================================

  if (
    rules.course &&
    !rules.course.includes(userData.course)
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Course requirement not satisfied.",
    };
  }


  // =========================================================
  // INSTITUTION TYPE CHECK
  // =========================================================

  if (
    rules.institutionType &&
    !rules.institutionType.includes(
      userData.institutionType
    )
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Institution type requirement not satisfied.",
    };
  }


  // =========================================================
  // BONAFIDE / ADMISSION PROOF CHECK
  // =========================================================

  if (
    rules.bonafide !== undefined &&
    userData.bonafide !== rules.bonafide
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Admission/bonafide proof requirement not satisfied.",
    };
  }


  // =========================================================
  // ELECTRICITY CONSUMPTION CHECK
  // =========================================================

  if (
    rules.electricityConsumption !== undefined &&
    userData.electricityConsumption !==
      rules.electricityConsumption
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Electricity consumption requirement not satisfied.",
    };
  }


  // =========================================================
  // FULL-TIME STUDENT CHECK
  // =========================================================

  if (
    rules.fullTime !== undefined &&
    userData.fullTime !== rules.fullTime
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Full-time student requirement not satisfied.",
    };
  }


  // =========================================================
  // CURRENT STUDENT STATUS CHECK
  // =========================================================

  if (
    rules.studentStatus !== undefined &&
    userData.studentStatus !==
      rules.studentStatus
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Current student status requirement not satisfied.",
    };
  }


  // =========================================================
  // OVERSEAS PROGRAMME CHECK
  // =========================================================

  if (
    rules.program &&
    !rules.program.includes(userData.program)
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Programme requirement not satisfied.",
    };
  }


  // =========================================================
  // OVERSEAS PROGRAMME-SPECIFIC AGE CHECK
  // =========================================================

  if (
    rules.ageLimits &&
    userData.program
  ) {
    const programRules =
      rules.ageLimits[userData.program];

    if (
      programRules &&
      programRules.maxAge !== null &&
      programRules.maxAge !== undefined &&
      Number(userData.age) > programRules.maxAge
    ) {
      return {
        eligible: false,
        scheme: scheme.name,
        reason:
          "Age requirement for the selected programme is not satisfied.",
      };
    }
  }


  // =========================================================
  // CONFIRMED ADMISSION CHECK
  // =========================================================

  if (
    rules.admission !== undefined &&
    userData.admission !== rules.admission
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Confirmed admission requirement not satisfied.",
    };
  }


  // =========================================================
  // QS RANKING CHECK
  // =========================================================

  if (
    rules.qsRanking !== undefined &&
    userData.qsRanking !== rules.qsRanking
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "QS ranking requirement not satisfied.",
    };
  }


  // =========================================================
  // FAMILY BENEFICIARY CHECK
  // =========================================================

  if (
    rules.familyBeneficiary !== undefined &&
    userData.familyBeneficiary !==
      rules.familyBeneficiary
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Another family member has already received this benefit.",
    };
  }


  // =========================================================
  // PASSPORT CHECK
  // =========================================================

  if (
    rules.passport !== undefined &&
    userData.passport !== rules.passport
  ) {
    return {
      eligible: false,
      scheme: scheme.name,
      reason:
        "Valid passport requirement not satisfied.",
    };
  }


  // =========================================================
  // ELIGIBLE
  // =========================================================

  return {
    eligible: true,
    scheme: scheme.name,
    reason:
      "You are eligible for this scheme.",
  };
};


module.exports = {
  checkEligibility,
};