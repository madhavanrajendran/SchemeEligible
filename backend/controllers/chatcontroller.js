const db = require("../config/db");

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const normalize = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toLowerCase();
};

const hasValue = (profile, field) => {
  return (
    profile[field] !== undefined &&
    profile[field] !== null &&
    String(profile[field]).trim() !== ""
  );
};

const isYes = (value) => {
  const v = normalize(value);

  return (
    v === "yes" ||
    v === "y" ||
    v === "true" ||
    v === "1"
  );
};

const isNo = (value) => {
  const v = normalize(value);

  return (
    v === "no" ||
    v === "n" ||
    v === "false" ||
    v === "0"
  );
};

// ============================================================
// QUESTIONS
// ============================================================

const QUESTIONS = {
  age: {
    label: "What is your age?",
  },

  gender: {
    label: "What is your gender? (Male / Female / Other)",
  },

  tnResident: {
    label: "Are you a resident of Tamil Nadu? (Yes / No)",
  },

  community: {
    label:
      "What is your community? (SC / ST / SCC / BC / MBC / DNC / OC / Other)",
  },

  annualIncome: {
    label:
      "What is your family's annual income? (Enter amount in ₹)",
  },

  currentlyEnrolled: {
    label: "Are you currently a student? (Yes / No)",
  },

  educationLevel: {
    label:
      "What are you currently studying? (10th / 12th / UG / PG / Other)",
  },

  disability: {
    label:
      "Are you a person with a disability? (Yes / No)",
  },

  parentDisability: {
    label:
      "Is your parent or guardian a person with a disability? (Yes / No)",
  },
};

// ============================================================
// QUESTION ORDER
// ============================================================

const BASIC_FIELDS = [
  "age",
  "gender",
  "tnResident",
  "community",
  "annualIncome",
  "currentlyEnrolled",
  "educationLevel",
  "disability",
  "parentDisability",
];

// ============================================================
// GET NEXT QUESTION
// ============================================================

const getNextQuestion = (profile) => {
  for (const field of BASIC_FIELDS) {
    // Education level is required only for students
    if (
      field === "educationLevel" &&
      isNo(profile.currentlyEnrolled)
    ) {
      continue;
    }

    if (!hasValue(profile, field)) {
      return field;
    }
  }

  return null;
};

// ============================================================
// CONVERT ANSWER
// ============================================================

const convertAnswer = (field, value) => {
  const answer = String(value).trim();

  // ==========================================================
  // AGE
  // ==========================================================

  if (field === "age") {
    const match = answer.match(/\d+/);

    if (match) {
      return parseInt(match[0], 10);
    }

    return answer;
  }

  // ==========================================================
  // INCOME
  // ==========================================================

  if (field === "annualIncome") {
    const cleaned = answer
      .replace(/,/g, "")
      .replace(/₹/g, "")
      .replace(/\brs\.?\b/gi, "")
      .replace(/\binr\b/gi, "")
      .trim();

    const match = cleaned.match(
      /\d+(?:\.\d+)?/
    );

    if (match) {
      let income = parseFloat(match[0]);

      const lower = cleaned.toLowerCase();

      if (
        lower.includes("lakh") ||
        lower.includes("lakhs")
      ) {
        income *= 100000;
      } else if (/\bk\b/.test(lower)) {
        income *= 1000;
      }

      return income;
    }

    return answer;
  }

  // ==========================================================
  // EDUCATION LEVEL
  // ==========================================================

  if (field === "educationLevel") {
    const lower = normalize(answer);

    // 10th
    if (
      lower.includes("10th") ||
      lower.includes("class 10") ||
      lower.includes("class x") ||
      lower === "x" ||
      lower.includes("tenth") ||
      lower.includes("10 std") ||
      lower.includes("10th standard")
    ) {
      return "10th";
    }

    // 12th
    if (
      lower.includes("12th") ||
      lower.includes("class 12") ||
      lower.includes("class xii") ||
      lower === "xii" ||
      lower.includes("twelfth") ||
      lower.includes("12 std") ||
      lower.includes("12th standard")
    ) {
      return "12th";
    }

    // UG
    if (
      lower === "ug" ||
      lower.includes("undergraduate") ||
      lower.includes("bachelor") ||
      lower.includes("bachelors") ||
      lower.includes("degree") ||
      lower.includes("college")
    ) {
      return "UG";
    }

    // PG
    if (
      lower === "pg" ||
      lower.includes("postgraduate") ||
      lower.includes("post graduate") ||
      lower.includes("master") ||
      lower.includes("masters")
    ) {
      return "PG";
    }

    return "Other";
  }

  // ==========================================================
  // YES / NO
  // ==========================================================

  if (
    field === "tnResident" ||
    field === "currentlyEnrolled" ||
    field === "disability" ||
    field === "parentDisability"
  ) {
    if (isYes(answer)) {
      return "yes";
    }

    if (isNo(answer)) {
      return "no";
    }
  }

  return answer;
};

// ============================================================
// NATURAL LANGUAGE PROFILE EXTRACTION
// ============================================================

const extractProfileFromMessage = (
  message,
  existingProfile = {}
) => {
  const text = normalize(message);

  const extracted = {
    ...existingProfile,
  };

  // ==========================================================
  // AGE
  // ==========================================================

  let ageMatch = text.match(
    /\b(?:i am|i'm|im|age|aged)\s*(?:about\s*)?(\d{1,3})\s*(?:years?|yrs?)?\b/
  );

  if (!ageMatch) {
    ageMatch = text.match(
      /\b(\d{1,3})\s*(?:years?|yrs?)\s*old\b/
    );
  }

  if (!ageMatch) {
    ageMatch = text.match(
      /\b(?:age is|my age is)\s*(\d{1,3})\b/
    );
  }

  if (ageMatch) {
    const age = parseInt(ageMatch[1], 10);

    if (age >= 1 && age <= 120) {
      extracted.age = age;
    }
  }

  // ==========================================================
  // GENDER
  // ==========================================================

  if (
    /\b(female|woman|women|girl)\b/.test(text)
  ) {
    extracted.gender = "Female";
  } else if (
    /\b(male|man|men|boy)\b/.test(text)
  ) {
    extracted.gender = "Male";
  } else if (
    /\b(other|non[- ]?binary)\b/.test(text)
  ) {
    extracted.gender = "Other";
  }

  // ==========================================================
  // TAMIL NADU
  // ==========================================================

  if (
    /\b(resident of tamil nadu|from tamil nadu|live in tamil nadu|living in tamil nadu|tn resident|tamil nadu resident)\b/.test(
      text
    )
  ) {
    extracted.tnResident = "yes";
  }

  if (
    /\b(not a resident of tamil nadu|not from tamil nadu|outside tamil nadu|not a tamil nadu resident)\b/.test(
      text
    )
  ) {
    extracted.tnResident = "no";
  }

  // ==========================================================
  // COMMUNITY
  // ==========================================================

  const communities = [
    "scc",
    "sc",
    "st",
    "bc",
    "mbc",
    "dnc",
    "oc",
  ];

  for (const community of communities) {
    const pattern = new RegExp(
      `\\b${community}\\b`
    );

    if (pattern.test(text)) {
      extracted.community =
        community.toUpperCase();

      break;
    }
  }

  // ==========================================================
  // INCOME
  // ==========================================================

  let incomeMatch = text.match(
    /(?:family income|annual income|income)\s*(?:is|of|:)?\s*₹?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|l|k)?\b/
  );

  if (!incomeMatch) {
    incomeMatch = text.match(
      /₹?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|l|k)\b/
    );
  }

  if (incomeMatch) {
    let income = parseFloat(
      incomeMatch[1].replace(/,/g, "")
    );

    const unit = normalize(
      incomeMatch[2]
    );

    if (
      unit === "lakh" ||
      unit === "lakhs" ||
      unit === "l"
    ) {
      income *= 100000;
    } else if (unit === "k") {
      income *= 1000;
    }

    extracted.annualIncome = income;
  }

  // ==========================================================
  // STUDENT
  // ==========================================================

  if (
    /\b(student|studying|currently studying|college student|school student|undergraduate|postgraduate)\b/.test(
      text
    )
  ) {
    extracted.currentlyEnrolled = "yes";
  }

  if (
    /\b(not a student|not studying|finished studying|currently not studying|no longer studying)\b/.test(
      text
    )
  ) {
    extracted.currentlyEnrolled = "no";
  }

  // ==========================================================
  // EDUCATION LEVEL
  // ==========================================================

  if (
    /\b(10th|class 10|class x|tenth|10 std|10th standard)\b/.test(
      text
    )
  ) {
    extracted.educationLevel = "10th";
    extracted.currentlyEnrolled = "yes";
  } else if (
    /\b(12th|class 12|class xii|twelfth|12 std|12th standard)\b/.test(
      text
    )
  ) {
    extracted.educationLevel = "12th";
    extracted.currentlyEnrolled = "yes";
  } else if (
    /\b(ug|undergraduate|bachelor|bachelors|degree)\b/.test(
      text
    )
  ) {
    extracted.educationLevel = "UG";
    extracted.currentlyEnrolled = "yes";
  } else if (
    /\b(pg|postgraduate|post graduate|master|masters)\b/.test(
      text
    )
  ) {
    extracted.educationLevel = "PG";
    extracted.currentlyEnrolled = "yes";
  }

  // ==========================================================
  // USER DISABILITY
  // ==========================================================

  if (
    /\b(i have a disability|i am disabled|i'm disabled|person with a disability|i have disability|i am a person with disability)\b/.test(
      text
    )
  ) {
    extracted.disability = "yes";
  }

  if (
    /\b(i do not have a disability|i don't have a disability|not disabled|no disability|i have no disability)\b/.test(
      text
    )
  ) {
    extracted.disability = "no";
  }

  // ==========================================================
  // PARENT DISABILITY
  // ==========================================================

  const parentMentioned =
    /\b(parent|mother|father|guardian|parents)\b/.test(
      text
    );

  const disabilityMentioned =
    /\b(disabled|disability|differently abled|differently-abled)\b/.test(
      text
    );

  if (
    parentMentioned &&
    disabilityMentioned
  ) {
    if (
      /\b(no|not|doesn't|does not|don't|do not|none|neither)\b/.test(
        text
      )
    ) {
      extracted.parentDisability = "no";
    } else {
      extracted.parentDisability = "yes";
    }
  }

  return extracted;
};

// ============================================================
// EDUCATION MATCHING
// ============================================================

const educationMatches = (
  scheme,
  educationLevel
) => {
  if (
    !educationLevel ||
    educationLevel === "Other"
  ) {
    return true;
  }

  const classLevel = normalize(
    scheme.class_level
  );

  const course = normalize(
    scheme.course
  );

  const program = normalize(
    scheme.program
  );

  const educationText =
    `${classLevel} ${course} ${program}`;

  // ==========================================================
  // 10TH
  // ==========================================================

  if (educationLevel === "10th") {
    return (
      /\b10\b/.test(educationText) ||
      /\b10th\b/.test(educationText) ||
      /\bclass\s*x\b/.test(educationText) ||
      /\bix\b/.test(educationText) ||
      /\bix\/x\b/.test(educationText) ||
      /\bpre[- ]?matric\b/.test(educationText)
    );
  }

  // ==========================================================
  // 12TH
  // ==========================================================

  if (educationLevel === "12th") {
    return (
      /\b12\b/.test(educationText) ||
      /\b12th\b/.test(educationText) ||
      /\bclass\s*xii\b/.test(educationText) ||
      /\bxii\b/.test(educationText) ||
      /\bxi\/xii\b/.test(educationText) ||
      /\b11th\b/.test(educationText) ||
      /\bpost[- ]?matric\b/.test(educationText)
    );
  }

  // ==========================================================
  // UG
  // ==========================================================

  if (educationLevel === "UG") {
    return (
      /\bug\b/.test(educationText) ||
      /\bundergraduate\b/.test(educationText) ||
      /\bbachelor/.test(educationText) ||
      /\bdegree\b/.test(educationText) ||
      /\bcollege\b/.test(educationText)
    );
  }

  // ==========================================================
  // PG
  // ==========================================================

  if (educationLevel === "PG") {
    return (
      /\bpg\b/.test(educationText) ||
      /\bpostgraduate\b/.test(educationText) ||
      /\bpost graduate\b/.test(educationText) ||
      /\bmaster/.test(educationText)
    );
  }

  return true;
};

// ============================================================
// PARENT DISABILITY SCHEME DETECTION
// ============================================================

const isParentDisabilityScheme = (
  scheme
) => {
  const schemeText = normalize(
    `${scheme.name || ""} ${
      scheme.description || ""
    } ${scheme.benefit || ""}`
  );

  return (
    schemeText.includes(
      "sons/daughters of differently abled"
    ) ||
    schemeText.includes(
      "sons and daughters of differently abled"
    ) ||
    schemeText.includes(
      "children of differently abled"
    ) ||
    schemeText.includes(
      "children of disabled persons"
    ) ||
    schemeText.includes(
      "children of differently abled persons"
    ) ||
    schemeText.includes(
      "child of differently abled"
    ) ||
    schemeText.includes(
      "children of disabled"
    )
  );
};

// ============================================================
// FILTER POSSIBLE SCHEMES
// ============================================================

const filterPossibleSchemes = (
  schemes,
  profile
) => {
  return schemes.filter((scheme) => {

    // ========================================================
    // AGE
    // ========================================================

    if (hasValue(profile, "age")) {
      const age = Number(profile.age);

      if (isNaN(age)) {
        return false;
      }

      if (
        scheme.min_age !== null &&
        age < Number(scheme.min_age)
      ) {
        return false;
      }

      if (
        scheme.max_age !== null &&
        age > Number(scheme.max_age)
      ) {
        return false;
      }
    }

    // ========================================================
    // GENDER
    // ========================================================

    if (
      hasValue(profile, "gender") &&
      scheme.gender
    ) {
      const userGender =
        normalize(profile.gender);

      const allowed =
        normalize(scheme.gender)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

      const matches = allowed.some(
        (gender) =>
          gender === "all" ||
          gender === "any" ||
          gender === userGender
      );

      if (
        allowed.length > 0 &&
        !matches
      ) {
        return false;
      }
    }

    // ========================================================
    // TN RESIDENT
    // ========================================================

    if (
      hasValue(profile, "tnResident") &&
      scheme.tn_resident !== null
    ) {
      const required =
        Boolean(
          Number(scheme.tn_resident)
        );

      if (
        required &&
        isNo(profile.tnResident)
      ) {
        return false;
      }
    }

    // ========================================================
    // COMMUNITY
    // ========================================================

    if (
      hasValue(profile, "community") &&
      scheme.community
    ) {
      const userCommunity =
        normalize(profile.community);

      const allowed =
        normalize(scheme.community)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

      const matches = allowed.some(
        (community) =>
          community === userCommunity ||
          community.includes(userCommunity) ||
          userCommunity.includes(community)
      );

      if (
        allowed.length > 0 &&
        !matches
      ) {
        return false;
      }
    }

    // ========================================================
    // INCOME
    // ========================================================

    if (
      hasValue(profile, "annualIncome") &&
      scheme.max_annual_income !== null
    ) {
      const income =
        Number(profile.annualIncome);

      const maximum =
        Number(scheme.max_annual_income);

      if (
        !isNaN(income) &&
        !isNaN(maximum) &&
        income > maximum
      ) {
        return false;
      }
    }

    // ========================================================
    // STUDENT
    // ========================================================

    if (
      hasValue(
        profile,
        "currentlyEnrolled"
      ) &&
      scheme.currently_enrolled !== null
    ) {
      const required =
        Boolean(
          Number(
            scheme.currently_enrolled
          )
        );

      if (
        required &&
        isNo(
          profile.currentlyEnrolled
        )
      ) {
        return false;
      }

      // If scheme explicitly requires non-student
      if (
        !required &&
        isYes(
          profile.currentlyEnrolled
        )
      ) {
        return false;
      }
    }

    // ========================================================
    // EDUCATION LEVEL
    // ========================================================

    if (
      isYes(profile.currentlyEnrolled) &&
      hasValue(
        profile,
        "educationLevel"
      )
    ) {
      const hasEducationData =
        scheme.class_level ||
        scheme.course ||
        scheme.program;

      if (hasEducationData) {
        if (
          !educationMatches(
            scheme,
            profile.educationLevel
          )
        ) {
          return false;
        }
      }
    }

    // ========================================================
    // USER DISABILITY
    // ========================================================

    if (
      hasValue(profile, "disability") &&
      scheme.disability_required !== null
    ) {
      const required =
        Boolean(
          Number(
            scheme.disability_required
          )
        );

      if (
        required &&
        isNo(profile.disability)
      ) {
        return false;
      }

      if (
        !required &&
        isYes(profile.disability)
      ) {
        // Do not automatically reject.
        // Some schemes do not require disability
        // but can still be available to disabled students.
      }
    }

    // ========================================================
    // PARENT DISABILITY
    // ========================================================

    if (
      hasValue(
        profile,
        "parentDisability"
      ) &&
      scheme.parent_disability_required !== null
    ) {
      const required =
        Boolean(
          Number(
            scheme.parent_disability_required
          )
        );

      if (
        required &&
        isNo(
          profile.parentDisability
        )
      ) {
        return false;
      }
    }

    // ========================================================
    // EXTRA PARENT DISABILITY SAFETY
    // ========================================================

    if (
      isParentDisabilityScheme(scheme) &&
      isNo(profile.parentDisability)
    ) {
      return false;
    }

    return true;
  });
};

// ============================================================
// CALCULATE MATCH SCORE
// ============================================================

const calculateMatchScore = (
  scheme,
  profile
) => {
  let applicable = 0;
  let matched = 0;

  // ==========================================================
  // AGE
  // ==========================================================

  if (
    hasValue(profile, "age") &&
    (
      scheme.min_age !== null ||
      scheme.max_age !== null
    )
  ) {
    applicable++;

    const age = Number(profile.age);

    const minOK =
      scheme.min_age === null ||
      age >= Number(scheme.min_age);

    const maxOK =
      scheme.max_age === null ||
      age <= Number(scheme.max_age);

    if (minOK && maxOK) {
      matched++;
    }
  }

  // ==========================================================
  // GENDER
  // ==========================================================

  if (
    hasValue(profile, "gender") &&
    scheme.gender
  ) {
    applicable++;

    const gender =
      normalize(profile.gender);

    const allowed =
      normalize(scheme.gender)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    if (
      allowed.some(
        (x) =>
          x === "all" ||
          x === "any" ||
          x === gender
      )
    ) {
      matched++;
    }
  }

  // ==========================================================
  // TN RESIDENT
  // ==========================================================

  if (
    hasValue(
      profile,
      "tnResident"
    ) &&
    scheme.tn_resident !== null
  ) {
    applicable++;

    const required =
      Boolean(
        Number(
          scheme.tn_resident
        )
      );

    if (
      !required ||
      (
        required &&
        isYes(profile.tnResident)
      )
    ) {
      matched++;
    }
  }

  // ==========================================================
  // COMMUNITY
  // ==========================================================

  if (
    hasValue(
      profile,
      "community"
    ) &&
    scheme.community
  ) {
    applicable++;

    const userCommunity =
      normalize(profile.community);

    const allowed =
      normalize(scheme.community)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    if (
      allowed.some(
        (x) =>
          x === userCommunity ||
          x.includes(userCommunity) ||
          userCommunity.includes(x)
      )) 
      {
      matched++;
    }
  }

  // ==========================================================
  // INCOME
  // ==========================================================

  if (
    hasValue(
      profile,
      "annualIncome"
    ) &&
    scheme.max_annual_income !== null) {
    applicable++;

    if (
      Number(profile.annualIncome) <=
      Number(scheme.max_annual_income)
    ) {
      matched++;
    }
  }

  // ==========================================================
  // STUDENT
  // ==========================================================

  if (
    hasValue(
      profile,
      "currentlyEnrolled"
    ) &&
    scheme.currently_enrolled !== null
  ) {
    applicable++;

    const required =
      Boolean(
        Number(
          scheme.currently_enrolled
        )
      );

    if (
      (
        required &&
        isYes(profile.currentlyEnrolled)
      ) ||
      (
        !required &&
        isNo(profile.currentlyEnrolled)
      )
    ) {
      matched++;
    }
  }

  // ==========================================================
  // EDUCATION LEVEL
  // ==========================================================

  if (
    isYes(
      profile.currentlyEnrolled
    ) &&
    hasValue(
      profile,
      "educationLevel"
    )
  ) {
    const hasEducationData =
      scheme.class_level ||
      scheme.course ||
      scheme.program;

    if (hasEducationData) {
      applicable++;

      if (
        educationMatches(
          scheme,
          profile.educationLevel
        )
      ) {
        matched++;
      }
    }
  }

  // ==========================================================
  // USER DISABILITY
  // ==========================================================

  if (
    hasValue(
      profile,
      "disability"
    ) &&
    scheme.disability_required !== null) {
    applicable++;

    const required =
      Boolean(
        Number(
          scheme.disability_required
        )
      );

    if (
      (
        required &&
        isYes(profile.disability)
      ) ||
      (
        !required &&
        isNo(profile.disability)
      )
    ) {
      matched++;
    }
  }

  // ==========================================================
  // PARENT DISABILITY
  // ==========================================================

  if (
    hasValue(
      profile,
      "parentDisability"
    ) &&
    scheme.parent_disability_required !== null
  ) {
    applicable++;

    const required =
      Boolean(
        Number(
          scheme.parent_disability_required
        )
      );

    if (
      (
        required &&
        isYes(
          profile.parentDisability
        )
      ) ||
      (
        !required &&
        isNo(
          profile.parentDisability
        )
      )
    ) {
      matched++;
    }
  }

  // ==========================================================
  // PARENT DISABILITY SAFETY
  // ==========================================================

  if (
    isParentDisabilityScheme(scheme) &&
    hasValue(
      profile,
      "parentDisability"
    )
  ) {
    applicable++;

    if (
      isYes(
        profile.parentDisability
      )
    ) {
      matched++;
    }
  }

  // ==========================================================
  // SCORE
  // ==========================================================

  if (applicable === 0) {
    return 50;
  }

  return Math.round(
    (matched / applicable) * 100
  );
};

// ============================================================
// FORMAT SCHEME
// ============================================================

const formatScheme = (
  scheme,
  profile = {}
) => {
  return {
    schemeId: scheme.scheme_id,

    name: scheme.name,

    description:
      scheme.description ||
      "Description not available.",

    benefit:
      scheme.benefit ||
      "Benefit information not available.",

    matchScore:
      calculateMatchScore(
        scheme,
        profile
      ),

    sourceUrl:
      scheme.source_url ||
      null,

    applicationUrl:
      scheme.application_url ||
      null,
  };
};

// ============================================================
// BUILD POSSIBLE SCHEMES REPLY
// ============================================================

const buildPossibleSchemesReply = (
  possibleSchemes,
  profile
) => {
  if (
    possibleSchemes.length === 0
  ) {
    return (
      "Based on the information you provided, I couldn't find any obvious matching schemes.\n\n" +
      "You can try checking the available government schemes or complete a detailed eligibility check."
    );
  }

  const scoredSchemes =
    possibleSchemes
      .map((scheme) => ({
        scheme,
        score:
          calculateMatchScore(
            scheme,
            profile
          ),
      }))
      .sort(
        (a, b) =>
          b.score - a.score
      );

  const topSchemes =
    scoredSchemes.slice(0, 5);

  const list =
    topSchemes
      .map(
        (item, index) => {
          const scheme =
            item.scheme;

          let text =
            `${index + 1}. ${scheme.name}`;

          text +=
            `\n   Match Score: ${item.score}%`;

          text +=
            `\n   Description: ${
              scheme.description ||
              "Description not available."
            }`;

          text +=
            `\n   Benefit: ${
              scheme.benefit ||
              "Benefit information not available."
            }`;

          return text;
        }
      )
      .join("\n\n");

  return (
    "Based on the information you provided, these schemes are your strongest preliminary matches:\n\n" +
    list +
    "\n\n" +
    "The Match Score shows how closely your provided information matches the available scheme requirements. It is not a guarantee of eligibility.\n\n" +
    "For exact eligibility, please complete the detailed eligibility check for the selected scheme."
  );
};

// ============================================================
// SPECIFIC SCHEME ELIGIBILITY
// ============================================================

const buildSpecificEligibilityReply = (
  scheme,
  profile
) => {
  const possibleMatches =
    filterPossibleSchemes(
      [scheme],
      profile
    );

  const score =
    calculateMatchScore(
      scheme,
      profile
    );

  let reply =
    `Checking your information against:\n\n${scheme.name}\n\n`;

  reply +=
    `Description:\n${
      scheme.description ||
      "Description not available."
    }\n\n`;

  reply +=
    `Benefit:\n${
      scheme.benefit ||
      "Benefit information not available."
    }\n\n`;

  reply +=
    `Preliminary Match Score: ${score}%\n\n`;

  if (
    possibleMatches.length > 0
  ) {
    reply +=
      "Based on the information you have provided so far, you appear to be a possible match for this scheme.\n\n";
  } else {
    reply +=
      "Based on the information you have provided, you do not appear to meet one or more of the basic requirements for this scheme.\n\n";
  }

  reply +=
    "Important: This is only a preliminary check. The scheme may have additional requirements that are checked by the detailed eligibility checker.";

  if (
    scheme.application_url
  ) {
    reply +=
      `\n\nApplication:\n${scheme.application_url}`;
  }

  if (
    scheme.source_url
  ) {
    reply +=
      `\n\nOfficial Source:\n${scheme.source_url}`;
  }

  return reply;
};

// ============================================================
// FIND SPECIFIC SCHEME
// ============================================================

const findSpecificScheme = (
  schemes,
  userMessage
) => {
  const message =
    normalize(userMessage);

  // ==========================================================
  // EXACT FULL NAME
  // ==========================================================

  const exactMatch =
    schemes.find(
      (scheme) =>
        normalize(
          scheme.name
        ) === message
    );

  if (exactMatch) {
    return exactMatch;
  }

  // ==========================================================
  // FULL SCHEME NAME INSIDE MESSAGE
  // ==========================================================

  const nameMatch =
    schemes.find(
      (scheme) => {
        const schemeName =
          normalize(
            scheme.name
          );

        return (
          schemeName.length >= 8 &&
          message.includes(
            schemeName
          )
        );
      }
    );

  if (nameMatch) {
    return nameMatch;
  }

  // ==========================================================
  // GENERIC QUESTIONS
  // ==========================================================

  const genericPhrases = [
    "student scholarship",
    "student scholarships",
    "scholarship scheme",
    "scholarship schemes",
    "government scholarship",
    "government scholarships",
    "student scheme",
    "student schemes",
    "schemes for students",
    "scheme for students",
    "available schemes",
    "available scholarships",
    "government schemes",
    "all schemes",
  ];

  if (
    genericPhrases.some(
      (phrase) =>
        message.includes(phrase)
    )
  ) {
    return null;
  }

  // ==========================================================
  // REMOVE COMMON WORDS
  // ==========================================================

  const ignoredWords = [
    "tell",
    "about",
    "scheme",
    "schemes",
    "government",
    "what",
    "this",
    "please",
    "give",
    "details",
    "detail",
    "information",
    "benefit",
    "benefits",
    "eligible",
    "eligibility",
    "which",
    "what",
    "is",
    "the",
    "me",
    "can",
    "for",
    "my",
    "am",
    "i",
    "student",
    "students",
    "scholarship",
    "scholarships",
    "available",
    "sheme",
    "apply",
    "qualify",
    "get",
    "check",
  ];

  const words =
    message
      .split(/\s+/)
      .map((word) =>
        word.replace(
          /[^a-z0-9-]/g,
          ""
        )
      )
      .filter(
        (word) =>
          word.length >= 4 &&
          !ignoredWords.includes(word)
      );

  if (
    words.length === 0
  ) {
    return null;
  }

  // ==========================================================
  // SCORE SCHEME NAMES
  // ==========================================================

  const scored =
    schemes
      .map((scheme) => {
        const schemeName =
          normalize(
            scheme.name
          );

        const nameWords =
          schemeName
            .split(
              /[\s\-–—/(),]+/
            )
            .filter(
              (word) =>
                word.length >= 3
            );

        let score = 0;

        for (
          const word of words
        ) {
          // Exact word
          if (
            nameWords.includes(word)
          ) {
            score += 3;
          }

          // Partial word
          else if (
            nameWords.some(
              (nameWord) =>
                nameWord.includes(word) ||
                word.includes(nameWord)
            )
          ) {
            score += 1;
          }
        }

        return {
          scheme,
          score,
        };
      })
      .filter(
        (item) =>
          item.score >= 3
      )
      .sort(
        (a, b) =>
          b.score - a.score
      );

  if (
    scored.length > 0
  ) {
    return scored[0].scheme;
  }

  return null;
};

// ============================================================
// SPECIFIC SCHEME DETAILS
// ============================================================

const buildSchemeDetailsReply = (
  scheme,
  profile = {}
) => {
  let reply =
    `${scheme.name}\n\n`;

  reply +=
    `Description:\n${
      scheme.description ||
      "Description not available."
    }\n\n`;

  reply +=
    `Benefit:\n${
      scheme.benefit ||
      "Benefit information not available."
    }\n\n`;

  const hasProfileData =
    BASIC_FIELDS.some(
      (field) =>
        hasValue(
          profile,
          field
        )
    );

  if (hasProfileData) {
    const score =
      calculateMatchScore(
        scheme,
        profile
      );

    reply +=
      `Preliminary Match Score:\n${score}%\n\n`;
  }

  reply +=
    "Eligibility:\n" +
    "This scheme may have additional requirements. Use the detailed eligibility checker to verify all conditions.\n\n";

  if (
    scheme.application_url
  ) {
    reply +=
      `Application:\n${scheme.application_url}\n\n`;
  }

  if (
    scheme.source_url
  ) {
    reply +=
      `Official Source:\n${scheme.source_url}`;
  }

  return reply;
};

// ============================================================
// GENERAL SEARCH
// ============================================================

const searchSchemes = (
  schemes,
  message,
  profile = {}
) => {
  const normalizedMessage =
    normalize(message);

  const genericStudentQuery =
    normalizedMessage.includes(
      "student"
    ) ||
    normalizedMessage.includes(
      "students"
    ) ||
    normalizedMessage.includes(
      "scholarship"
    );

  // ==========================================================
  // IF USER IS A STUDENT AND ASKS FOR STUDENT SCHEMES
  // USE PROFILE INFORMATION
  // ==========================================================

  if (
    genericStudentQuery &&
    isYes(
      profile.currentlyEnrolled
    )
  ) {
    const studentSchemes =
      filterPossibleSchemes(
        schemes,
        profile
      );

    if (
      studentSchemes.length > 0
    ) {
      return studentSchemes
        .sort(
          (a, b) =>
            calculateMatchScore(
              b,
              profile
            ) -
            calculateMatchScore(
              a,
              profile
            )
        )
        .slice(0, 5);
    }
  }

  // ==========================================================
  // GENERAL KEYWORD SEARCH
  // ==========================================================

  const ignoredWords = [
    "show",
    "scheme",
    "schemes",
    "government",
    "available",
    "give",
    "some",
    "tell",
    "about",
    "details",
    "detail",
    "students",
    "student",
    "please",
    "me",
    "the",
    "for",
    "what",
    "is",
    "scholarship",
    "scholarships",
  ];

  const words =
    normalizedMessage
      .split(/\s+/)
      .map((word) =>
        word.replace(
          /[^a-z0-9-]/g,
          ""
        )
      )
      .filter(
        (word) =>
          word.length >= 3 &&
          !ignoredWords.includes(word)
      );

  if (
    words.length === 0
  ) {
    return schemes.slice(
      0,
      5
    );
  }

  const matches =
    schemes.filter(
      (scheme) => {
        const searchableText =
          normalize(
            `${scheme.name} ${
              scheme.description || ""
            } ${
              scheme.benefit || ""
            }`
          );

        return words.some(
          (word) =>
            searchableText.includes(
              word
            )
        );
      }
    );

  return matches.length > 0
    ? matches.slice(0, 5)
    : schemes.slice(0, 5);
};

// ============================================================
// NATURAL RESPONSE
// ============================================================

const buildNaturalResponse = (
  profile,
  nextField
) => {
  const knownDetails = [];

  if (
    hasValue(profile, "age")
  ) {
    knownDetails.push(
      `you are ${profile.age} years old`
    );
  }

  if (
    hasValue(profile, "gender")
  ) {
    knownDetails.push(
      String(profile.gender)
    );
  }

  if (
    isYes(profile.tnResident)
  ) {
    knownDetails.push(
      "a Tamil Nadu resident"
    );
  }

  if (
    isNo(profile.tnResident)
  ) {
    knownDetails.push(
      "not a Tamil Nadu resident"
    );
  }

  if (
    hasValue(profile, "community")
  ) {
    knownDetails.push(
      `${profile.community} community`
    );
  }

  if (
    hasValue(
      profile,
      "annualIncome"
    )
  ) {
    knownDetails.push(
      `family income of ₹${Number(
        profile.annualIncome
      ).toLocaleString("en-IN")}`
    );
  }

  if (
    isYes(
      profile.currentlyEnrolled
    )
  ) {
    knownDetails.push(
      "currently a student"
    );
  }

  if (
    isNo(
      profile.currentlyEnrolled
    )
  ) {
    knownDetails.push(
      "not currently a student"
    );
  }

  if (
    hasValue(
      profile,
      "educationLevel"
    )
  ) {
    knownDetails.push(
      `studying at ${profile.educationLevel} level`
    );
  }

  if (
    isYes(profile.disability)
  ) {
    knownDetails.push(
      "a person with a disability"
    );
  }

  if (
    isNo(profile.disability)
  ) {
    knownDetails.push(
      "no personal disability"
    );
  }

  if (
    isYes(
      profile.parentDisability
    )
  ) {
    knownDetails.push(
      "a parent/guardian with a disability"
    );
  }

  if (
    isNo(
      profile.parentDisability
    )
  ) {
    knownDetails.push(
      "no parent/guardian disability"
    );
  }

  if (nextField) {
    if (
      knownDetails.length > 0
    ) {
      return (
        `Got it. I have noted that ${knownDetails.join(
          ", "
        )}.\n\n${
          QUESTIONS[nextField].label
        }`
      );
    }

    return QUESTIONS[
      nextField
    ].label;
  }

  return null;
};

// ============================================================
// MAIN CHAT CONTROLLER
// ============================================================

const chat = async (
  req,
  res
) => {
  try {
    const {
      message,
      profile = {},
      isAnswering = false,
    } = req.body;

    // ========================================================
    // VALIDATE MESSAGE
    // ========================================================

    if (
      !message ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Message is required.",
      });
    }

    const userMessage =
      message.trim();

    const normalizedMessage =
      normalize(userMessage);

    // ========================================================
    // GET ACTIVE SCHEMES
    // ========================================================

    const [schemes] =
      await db.query(`
        SELECT *
        FROM schemes
        WHERE status = 'active'
        ORDER BY scheme_id ASC
      `);

    if (
      schemes.length === 0
    ) {
      return res.json({
        success: true,
        reply:
          "Sorry, there are currently no active government schemes available.",
      });
    }

    // ========================================================
    // EXTRACT NATURAL INFORMATION
    // ========================================================

    let workingProfile =
      extractProfileFromMessage(
        userMessage,
        profile
      );

    // ========================================================
    // IF WE ARE ANSWERING A QUESTION
    // CONVERT THE ANSWER USING nextField
    // ========================================================

    if (
      isAnswering &&
      profile.nextField
    ) {
      workingProfile[
        profile.nextField
      ] = convertAnswer(
        profile.nextField,
        userMessage
      );

      delete workingProfile.nextField;
    }

    // ========================================================
    // SPECIFIC SCHEME DETECTION
    // ========================================================

    const directScheme =
      findSpecificScheme(
        schemes,
        normalizedMessage
      );

    // ========================================================
    // INFORMATION REQUEST
    // ========================================================

    const informationKeywords = [
      "tell me about",
      "details of",
      "detail about",
      "information about",
      "what is",
      "describe",
      "description of",
      "benefit of",
      "benefits of",
    ];

    const asksForInformation =
      informationKeywords.some(
        (keyword) =>
          normalizedMessage.includes(
            keyword
          )
      );

    if (
      directScheme &&
      asksForInformation
    ) {
      return res.json({
        success: true,

        reply:
          buildSchemeDetailsReply(
            directScheme,
            workingProfile
          ),

        scheme:
          formatScheme(
            directScheme,
            workingProfile
          ),

        profile:
          workingProfile,
      });
    }

    // ========================================================
    // SPECIFIC SCHEME ELIGIBILITY
    // ========================================================

    const eligibilityKeywords = [
      "eligible",
      "eligibility",
      "am i eligible",
      "can i get",
      "can i apply",
      "do i qualify",
      "qualify for",
    ];

    const asksSpecificEligibility =
      directScheme &&
      eligibilityKeywords.some(
        (keyword) =>
          normalizedMessage.includes(
            keyword
          )
      );

    if (
      asksSpecificEligibility
    ) {
      const nextField =
        getNextQuestion(
          workingProfile
        );

      // ------------------------------------------------------
      // NEED MORE INFORMATION
      // ------------------------------------------------------

      if (nextField) {
        return res.json({
          success: true,

          reply:
            `Sure! Let's check your eligibility for "${directScheme.name}".\n\n` +
            buildNaturalResponse(
              workingProfile,
              nextField
            ),

          nextField,

          profile:
            workingProfile,

          targetScheme:
            directScheme.scheme_id,
        });
      }

      // ------------------------------------------------------
      // ALL INFORMATION AVAILABLE
      // ------------------------------------------------------

      return res.json({
        success: true,

        reply:
          buildSpecificEligibilityReply(
            directScheme,
            workingProfile
          ),

        scheme:
          formatScheme(
            directScheme,
            workingProfile
          ),

        profile:
          workingProfile,

        targetScheme:
          directScheme.scheme_id,

        confirmed: false,
      });
    }

    // ========================================================
    // DIRECT SPECIFIC SCHEME
    // ========================================================

    if (directScheme) {
      return res.json({
        success: true,

        reply:
          buildSchemeDetailsReply(
            directScheme,
            workingProfile
          ),

        scheme:
          formatScheme(
            directScheme,
            workingProfile
          ),

        profile:
          workingProfile,
      });
    }

    // ========================================================
    // GENERAL ELIGIBILITY REQUEST
    // ========================================================

    const generalEligibilityKeywords = [
      "eligible",
      "eligibility",
      "which scheme",
      "which schemes",
      "can i get",
      "what can i get",
      "scheme for me",
      "schemes for me",
      "am i eligible",
    ];

    const wantsEligibility =
      generalEligibilityKeywords.some(
        (keyword) =>
          normalizedMessage.includes(
            keyword
          )
      ) ||
      isAnswering;

    if (
      wantsEligibility
    ) {
      const nextField =
        getNextQuestion(
          workingProfile
        );

      // ------------------------------------------------------
      // ASK NEXT QUESTION
      // ------------------------------------------------------

      if (nextField) {
        const naturalReply =
          buildNaturalResponse(
            workingProfile,
            nextField
          );

        return res.json({
          success: true,

          reply:
            naturalReply,

          nextField,

          profile:
            workingProfile,
        });
      }

      // ------------------------------------------------------
      // FILTER SCHEMES
      // ------------------------------------------------------

      const possibleSchemes =
        filterPossibleSchemes(
          schemes,
          workingProfile
        );

      // ------------------------------------------------------
      // SCORE + SORT
      // ------------------------------------------------------

      const sortedSchemes =
        possibleSchemes
          .map((scheme) => ({
            ...scheme,

            _matchScore:
              calculateMatchScore(
                scheme,
                workingProfile
              ),
          }))
          .sort(
            (a, b) =>
              b._matchScore -
              a._matchScore
          );

      const resultSchemes =
        sortedSchemes.slice(
          0,
          5
        );

      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------

      return res.json({
        success: true,

        reply:
          buildPossibleSchemesReply(
            resultSchemes,
            workingProfile
          ),

        schemes:
          resultSchemes.map(
            (scheme) =>
              formatScheme(
                scheme,
                workingProfile
              )
          ),

        profile:
          workingProfile,

        confirmed: false,
      });
    }

    // ========================================================
    // GENERAL SCHEME QUERY
    // ========================================================

    const generalKeywords = [
      "scheme",
      "schemes",
      "government",
      "benefit",
      "available",
      "scholarship",
      "scholarships",
    ];

    const isGeneralQuery =
      generalKeywords.some(
        (keyword) =>
          normalizedMessage.includes(
            keyword
          )
      );

    if (
      isGeneralQuery
    ) {
      const resultSchemes =
        searchSchemes(
          schemes,
          normalizedMessage,
          workingProfile
        );

      const list =
        resultSchemes
          .map(
            (scheme, index) => {
              let text =
                `${index + 1}. ${scheme.name}`;

              text +=
                `\n   Description: ${
                  scheme.description ||
                  "Description not available."
                }`;

              text +=
                `\n   Benefit: ${
                  scheme.benefit ||
                  "Benefit information not available."
                }`;

              return text;
            }
          )
          .join("\n\n");

      return res.json({
        success: true,

        reply:
          `Here are some government schemes that may be relevant:\n\n${list}\n\nYou can ask me about any specific scheme to learn more.`,

        schemes:
          resultSchemes.map(
            (scheme) =>
              formatScheme(
                scheme,
                workingProfile
              )
          ),

        profile:
          workingProfile,
      });
    }

    // ========================================================
    // NATURAL CONVERSATION
    // ========================================================

    const nextField =
      getNextQuestion(
        workingProfile
      );

    if (
      Object.keys(
        workingProfile
      ).length >
      Object.keys(
        profile
      ).length
    ) {
      const naturalReply =
        buildNaturalResponse(
          workingProfile,
          nextField
        );

      if (naturalReply) {
        return res.json({
          success: true,

          reply:
            naturalReply,

          nextField:
            nextField || null,

          profile:
            workingProfile,
        });
      }
    }

    // ========================================================
    // GREETING
    // ========================================================

    if (
      /^(hi|hello|hey|hai|good morning|good afternoon|good evening)\b/.test(
        normalizedMessage
      )
    ) {
      return res.json({
        success: true,

        reply:
          "Hi! I'm SchemeCheck Assistant. I can help you find government schemes, check possible eligibility, and explain scheme benefits.\n\nYou can simply tell me about yourself, or ask about a specific scheme.",
      });
    }

    // ========================================================
    // DEFAULT
    // ========================================================

    return res.json({
      success: true,

      reply:
        "Sure! I can help you with government schemes.\n\n" +
        "You can ask naturally, for example:\n\n" +
        "• I'm 20 years old and a BC student from Tamil Nadu.\n" +
        "• I'm studying UG.\n" +
        "• Which schemes am I eligible for?\n" +
        "• Tell me about PM-YASASVI.\n" +
        "• Am I eligible for Pudhumai Penn Thittam?\n" +
        "• What benefits does this scheme provide?",
    });

  } catch (error) {
    console.error(
      "Chatbot Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Something went wrong while processing your question.",
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  chat,
};