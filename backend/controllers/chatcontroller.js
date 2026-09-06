const db = require("../config/db");

// ============================================================
// HELPERS
// ============================================================

const normalize = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
};

const hasValue = (profile, field) =>
  profile[field] !== undefined &&
  profile[field] !== null &&
  String(profile[field]).trim() !== "";

const isYes = (value) =>
  ["yes", "y", "true", "1"].includes(normalize(value));

const isNo = (value) =>
  ["no", "n", "false", "0"].includes(normalize(value));

const splitList = (value) =>
  normalize(value)
    .split(/[,/|;]+/)
    .map((x) => x.trim())
    .filter(Boolean);

// ============================================================
// QUESTIONS
// ============================================================

const QUESTIONS = {
  age: { label: "What is your age?" },
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
    label: "What is your family's annual income? (Enter amount in ₹)",
  },
  currentlyEnrolled: {
    label: "Are you currently a student? (Yes / No)",
  },
  educationLevel: {
    label:
      "What are you currently studying? (10th / 12th / UG / PG / Other)",
  },
  disability: {
    label: "Are you a person with a disability? (Yes / No)",
  },
  parentDisability: {
    label:
      "Is your parent or guardian a person with a disability? (Yes / No)",
  },
};

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
// NEXT QUESTION
// ============================================================

const getNextQuestion = (profile) => {
  for (const field of BASIC_FIELDS) {
    if (
      field === "educationLevel" &&
      isNo(profile.currentlyEnrolled)
    ) {
      continue;
    }

    if (!hasValue(profile, field)) return field;
  }

  return null;
};

// ============================================================
// CONVERT ANSWER
// ============================================================

const convertAnswer = (field, value) => {
  const answer = String(value).trim();
  const lower = normalize(answer);

  if (field === "age") {
    const match = answer.match(/\d+/);
    return match ? parseInt(match[0], 10) : answer;
  }

  if (field === "annualIncome") {
    const cleaned = answer
      .replace(/,/g, "")
      .replace(/₹/g, "")
      .replace(/\brs\.?\b/gi, "")
      .replace(/\binr\b/gi, "")
      .trim();

    const match = cleaned.match(/\d+(?:\.\d+)?/);

    if (match) {
      let income = parseFloat(match[0]);

      if (/\b(lakh|lakhs|l)\b/i.test(cleaned)) {
        income *= 100000;
      } else if (/\bk\b/i.test(cleaned)) {
        income *= 1000;
      }

      return income;
    }

    return answer;
  }

  if (field === "gender") {
    if (/\b(female|woman|women|girl)\b/i.test(answer))
      return "Female";
    if (/\b(male|man|men|boy)\b/i.test(answer))
      return "Male";
    return "Other";
  }

  if (field === "community") {
    const communities = ["SCC", "SC", "ST", "MBC", "BC", "DNC", "OC"];
    const found = communities.find((c) =>
      new RegExp(`\\b${c}\\b`, "i").test(answer)
    );
    return found ? found : "Other";
  }

  if (field === "educationLevel") {
    if (
      /\b(10th|class 10|class x|tenth|10 std|10th standard)\b/i.test(
        answer
      )
    )
      return "10th";

    if (
      /\b(12th|class 12|class xii|twelfth|12 std|12th standard)\b/i.test(
        answer
      )
    )
      return "12th";

    if (
      /\b(pg|postgraduate|post graduate|master|masters)\b/i.test(
        answer
      )
    )
      return "PG";

    if (
      /\b(ug|undergraduate|bachelor|bachelors|degree|college|engineering)\b/i.test(
        answer
      )
    )
      return "UG";

    return "Other";
  }

  if (
    [
      "tnResident",
      "currentlyEnrolled",
      "disability",
      "parentDisability",
    ].includes(field)
  ) {
    if (isYes(answer)) return "yes";
    if (isNo(answer)) return "no";
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
  const extracted = { ...existingProfile };
// AGE
  let ageMatch = text.match(
    /\b(?:i am|i'm|im|age|aged)\s*(?:about\s*)?(\d{1,3})(?:\s*(?:years?|yrs?))?\b/
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
    if (age >= 1 && age <= 120) extracted.age = age;
  }
  // GENDER
  if (/\b(female|woman|women|girl)\b/i.test(text)) {
    extracted.gender = "Female";
  } else if (/\b(male|man|men|boy)\b/i.test(text)) {
    extracted.gender = "Male";
  } else if (/\b(other|non[- ]?binary)\b/i.test(text)) {
    extracted.gender = "Other";
  }
// TAMIL NADU
  if (
    /\b(not a resident of tamil nadu|not from tamil nadu|outside tamil nadu|not a tamil nadu resident)\b/i.test(
      text
    )
  ) {
    extracted.tnResident = "no";
  } else if (
    /\b(resident of tamil nadu|from tamil nadu|live in tamil nadu|living in tamil nadu|tn resident|tamil nadu resident)\b/i.test(
      text
    )
  ) {
    extracted.tnResident = "yes";
  }

  // COMMUNITY
  const communities = [
    "SCC",
    "SC",
    "ST",
    "MBC",
    "BC",
    "DNC",
    "OC",
  ];

  for (const community of communities) {
    if (
      new RegExp(`\\b${community}\\b`, "i").test(text)
    ) {
      extracted.community = community;
      break;
    }
  }
 // INCOME
  let incomeMatch = text.match(
    /\b(?:family\s+income|annual\s+income|income)\s*(?:is|of|:)?\s*₹?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|l|k)?\b/i
  );

  if (!incomeMatch) {
    incomeMatch = text.match(
      /₹?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|l|k)\b/i
    );
  }

  if (incomeMatch) {
    let income = parseFloat(
      incomeMatch[1].replace(/,/g, "")
    );

    const unit = normalize(incomeMatch[2]);

    if (["lakh", "lakhs", "l"].includes(unit)) {
      income *= 100000;
    } else if (unit === "k") {
      income *= 1000;
    }

    extracted.annualIncome = income;
  }
 // STUDENT
  if (
    /\b(not a student|not studying|finished studying|currently not studying|no longer studying)\b/i.test(
      text
    )
  ) {
    extracted.currentlyEnrolled = "no";
  } else if (
    /\b(student|studying|currently studying|college student|school student|undergraduate|postgraduate)\b/i.test(
      text
    )
  ) {
    extracted.currentlyEnrolled = "yes";
  }

  // EDUCATION LEVEL
  if (
    /\b(10th|class 10|class x|tenth|10 std|10th standard)\b/i.test(
      text
    )
  ) {
    extracted.educationLevel = "10th";
    extracted.currentlyEnrolled = "yes";
  } else if (
    /\b(12th|class 12|class xii|twelfth|12 std|12th standard)\b/i.test(
      text
    )
  ) {
    extracted.educationLevel = "12th";
    extracted.currentlyEnrolled = "yes";
  } else if (
    /\b(pg|postgraduate|post graduate|master|masters)\b/i.test(
      text
    )
  ) {
    extracted.educationLevel = "PG";
    extracted.currentlyEnrolled = "yes";
  } else if (
    /\b(ug|undergraduate|bachelor|bachelors|degree|college|engineering)\b/i.test(
      text
    )
  ) {
    extracted.educationLevel = "UG";
    extracted.currentlyEnrolled = "yes";
  }

  // USER DISABILITY
  if (
    /\b(i do not have a disability|i don't have a disability|not disabled|no disability|i have no disability)\b/i.test(
      text
    )
  ) {
    extracted.disability = "no";
  } else if (
    /\b(i have a disability|i am disabled|i'm disabled|person with a disability|i have disability|i am a person with disability)\b/i.test(
      text
    )
  ) {
    extracted.disability = "yes";
  }

  // PARENT DISABILITY
  const parentMentioned =
    /\b(parent|parents|mother|father|guardian)\b/i.test(
      text
    );

  const disabilityMentioned =
    /\b(disabled|disability|differently abled|differently-abled)\b/i.test(
      text
    );

  if (parentMentioned && disabilityMentioned) {
    if (
      /\b(no|not|doesn't|does not|don't|do not|none|neither)\b/i.test(
        text
      )
    ) {
      extracted.parentDisability = "no";
    } else {
      extracted.parentDisability = "yes";
    }
  }

  if (
    /\b(neither parent|neither of my parents|parents are not disabled|parent is not disabled)\b/i.test(
      text
    )
  ) {
    extracted.parentDisability = "no";
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
  if (!educationLevel || educationLevel === "Other") {
    return true;
  }

  const classLevel = normalize(scheme.class_level);
  const course = normalize(scheme.course);
  const program = normalize(scheme.program);

  const text = `${classLevel} ${course} ${program}`;

  if (educationLevel === "10th") {
    return (
      /\b(10|10th|class x|ix|ix\/x)\b/i.test(text) ||
      /\bpre[- ]?matric\b/i.test(text) ||
      /\bschool\b/i.test(text)
    );
  }

  if (educationLevel === "12th") {
    return (
      /\b(12|12th|class xii|xi\/xii|11th|xii)\b/i.test(
        text
      ) ||
      /\bschool\b/i.test(text)
    );
  }

  if (educationLevel === "UG") {
    return (
      /\bug\b/i.test(text) ||
      /\bundergraduate\b/i.test(text) ||
      /\bbachelor\b/i.test(text) ||
      /\bdegree\b/i.test(text) ||
      /\bcollege\b/i.test(text)
    );
  }

  if (educationLevel === "PG") {
    return (
      /\bpg\b/i.test(text) ||
      /\bpostgraduate\b/i.test(text) ||
      /\bpost graduate\b/i.test(text) ||
      /\bmaster\b/i.test(text)
    );
  }

  return true;
};

// ============================================================
// PARENT DISABILITY SCHEME
// ============================================================

const isParentDisabilityScheme = (scheme) => {
  const text = normalize(
    `${scheme.name || ""} ${scheme.description || ""} ${
      scheme.benefit || ""
    }`
  );

  return (
    Boolean(Number(scheme.parent_disability_required)) ||
    text.includes("sons/daughters of differently abled") ||
    text.includes("sons and daughters of differently abled") ||
    text.includes("children of differently abled") ||
    text.includes("children of disabled persons") ||
    text.includes("children of differently abled persons") ||
    text.includes("child of differently abled") ||
    text.includes("children of disabled")
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
    // AGE
    if (hasValue(profile, "age")) {
      const age = Number(profile.age);

      if (isNaN(age)) return false;

      if (
        scheme.min_age !== null &&
        age < Number(scheme.min_age)
      )
        return false;

      if (
        scheme.max_age !== null &&
        age > Number(scheme.max_age)
      )
        return false;
    }

    // GENDER
    if (
      hasValue(profile, "gender") &&
      scheme.gender
    ) {
      const userGender = normalize(profile.gender);
      const allowed = splitList(scheme.gender);

      const matches = allowed.some(
        (gender) =>
          gender === "all" ||
          gender === "any" ||
          gender === userGender
      );

      if (allowed.length > 0 && !matches) {
        return false;
      }
    }

    // TN RESIDENT
    if (
      hasValue(profile, "tnResident") &&
      scheme.tn_resident !== null
    ) {
      const required = Boolean(
        Number(scheme.tn_resident)
      );

      if (
        required &&
        isNo(profile.tnResident)
      ) {
        return false;
      }
    }

    // COMMUNITY
    if (
      hasValue(profile, "community") &&
      scheme.community
    ) {
      const userCommunity =
        normalize(profile.community);

      const allowed = splitList(
        scheme.community
      );

      const matches = allowed.some(
        (community) =>
          community === userCommunity
      );

      if (allowed.length > 0 && !matches) {
        return false;
      }
    }

    // INCOME
    if (
      hasValue(profile, "annualIncome") &&
      scheme.max_annual_income !== null
    ) {
      const income = Number(
        profile.annualIncome
      );

      const maximum = Number(
        scheme.max_annual_income
      );

      if (isNaN(income)) return false;

      if (
        !isNaN(maximum) &&
        income > maximum
      ) {
        return false;
      }
    }

    // STUDENT
    if (
      hasValue(
        profile,
        "currentlyEnrolled"
      ) &&
      scheme.currently_enrolled !== null
    ) {
      const required = Boolean(
        Number(scheme.currently_enrolled)
      );

      if (
        required &&
        isNo(profile.currentlyEnrolled)
      ) {
        return false;
      }

      if (
        !required &&
        isYes(profile.currentlyEnrolled)
      ) {
        return false;
      }
    }

    // EDUCATION
    if (
      isYes(profile.currentlyEnrolled) &&
      hasValue(profile, "educationLevel")
    ) {
      const hasEducationData =
        scheme.class_level ||
        scheme.course ||
        scheme.program;

      if (
        hasEducationData &&
        !educationMatches(
          scheme,
          profile.educationLevel
        )
      ) {
        return false;
      }
    }

    // USER DISABILITY
    if (
      hasValue(profile, "disability") &&
      scheme.disability_required !== null
    ) {
      const required = Boolean(
        Number(scheme.disability_required)
      );

      if (
        required &&
        isNo(profile.disability)
      ) {
        return false;
      }
    }

    // PARENT DISABILITY
    if (
      hasValue(
        profile,
        "parentDisability"
      ) &&
      scheme.parent_disability_required !== null
    ) {
      const required = Boolean(
        Number(
          scheme.parent_disability_required
        )
      );

      if (
        required &&
        isNo(profile.parentDisability)
      ) {
        return false;
      }
    }

    // EXTRA SAFETY CHECK
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
// MATCH SCORE
// ============================================================

const calculateMatchScore = (
  scheme,
  profile
) => {
  let applicable = 0;
  let matched = 0;

  // AGE
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

    if (minOK && maxOK) matched++;
  }

  // GENDER
  if (
    hasValue(profile, "gender") &&
    scheme.gender
  ) {
    applicable++;

    const gender = normalize(profile.gender);
    const allowed = splitList(scheme.gender);

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

  // TN RESIDENT
  if (
    hasValue(profile, "tnResident") &&
    scheme.tn_resident !== null
  ) {
    applicable++;

    const required = Boolean(
      Number(scheme.tn_resident)
    );

    if (
      !required ||
      isYes(profile.tnResident)
    ) {
      matched++;
    }
  }

  // COMMUNITY
  if (
    hasValue(profile, "community") &&
    scheme.community
  ) {
    applicable++;

    const userCommunity =
      normalize(profile.community);

    const allowed = splitList(
      scheme.community
    );

    if (
      allowed.some(
        (x) => x === userCommunity
      )
    ) {
      matched++;
    }
  }

  // INCOME
  if (
    hasValue(profile, "annualIncome") &&
    scheme.max_annual_income !== null
  ) {
    applicable++;

    const income = Number(
      profile.annualIncome
    );

    if (
      !isNaN(income) &&
      income <=
        Number(scheme.max_annual_income)
    ) {
      matched++;
    }
  }

  // STUDENT
  if (
    hasValue(
      profile,
      "currentlyEnrolled"
    ) &&
    scheme.currently_enrolled !== null
  ) {
    applicable++;

    const required = Boolean(
      Number(scheme.currently_enrolled)
    );

    if (
      (required &&
        isYes(profile.currentlyEnrolled)) ||
      (!required &&
        isNo(profile.currentlyEnrolled))
    ) {
      matched++;
    }
  }

  // EDUCATION
  if (
    isYes(profile.currentlyEnrolled) &&
    hasValue(profile, "educationLevel")
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

  // USER DISABILITY
  if (
    hasValue(profile, "disability") &&
    scheme.disability_required !== null
  ) {
    applicable++;

    const required = Boolean(
      Number(scheme.disability_required)
    );

    if (
      (required &&
        isYes(profile.disability)) ||
      (!required &&
        isNo(profile.disability))
    ) {
      matched++;
    }
  }

  // PARENT DISABILITY
  if (
    hasValue(
      profile,
      "parentDisability"
    ) &&
    scheme.parent_disability_required !== null
  ) {
    applicable++;

    const required = Boolean(
      Number(
        scheme.parent_disability_required
      )
    );

    if (
      (required &&
        isYes(profile.parentDisability)) ||
      (!required &&
        isNo(profile.parentDisability))
    ) {
      matched++;
    }
  }

  // EXTRA PARENT SAFETY
  if (
    isParentDisabilityScheme(scheme) &&
    hasValue(
      profile,
      "parentDisability"
    )
  ) {
    applicable++;

    if (
      isYes(profile.parentDisability)
    ) {
      matched++;
    }
  }

  if (applicable === 0) return 50;

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
) => ({
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
    scheme.source_url || null,
  applicationUrl:
    scheme.application_url || null,
});

// ============================================================
// POSSIBLE SCHEMES RESPONSE
// ============================================================

const buildPossibleSchemesReply = (
  possibleSchemes,
  profile
) => {
  if (!possibleSchemes.length) {
    return (
      "I couldn't find any obvious matching schemes.\n\n" +
      "You can try checking other government schemes or complete a detailed eligibility check."
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
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return String(
          a.scheme.name
        ).localeCompare(
          String(b.scheme.name)
        );
      })
      .slice(0, 5);

  let reply =
    "Schemes You May Be Eligible For\n\n";

  reply +=
    "Based on the information you provided, these are your strongest preliminary matches:\n\n";

  scoredSchemes.forEach(
    (item, index) => {
      const scheme = item.scheme;

      reply +=
        `${index + 1}. ${scheme.name}\n\n`;

      reply +=
        `Preliminary Match: ${item.score}%\n\n`;

      reply +=
        `About the Scheme\n${
          scheme.description ||
          "Description not available."
        }\n\n`;

      reply +=
        `Benefit\n${
          scheme.benefit ||
          "Benefit information not available."
        }\n\n`;

      reply +=
        "────────────────────────\n\n";
    }
  );

  reply +=
    "Note:The Match Score is only a preliminary indication based on the information you provided. It is not a guarantee of eligibility.\n\n";

  reply +=
    "For exact eligibility, please use the detailed eligibility checker.";

  return reply;
};

// ============================================================
// SPECIFIC ELIGIBILITY RESPONSE
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
    `Eligibility Check\n\n ${scheme.name}\n\n`;

  reply +=
    `About the Scheme\n${
      scheme.description ||
      "Description not available."
    }\n\n`;

  reply +=
    `Benefit\n${
      scheme.benefit ||
      "Benefit information not available."
    }\n\n`;

  reply +=
    `Preliminary Match Score: ${score}%\n\n`;

  if (possibleMatches.length > 0) {
    reply +=
      " Based on the information you provided, you appear to be a possible match for this scheme.\n\n";
  } else {
    reply +=
      " Based on the information you provided, you do not appear to meet one or more of the basic requirements for this scheme.\n\n";
  }

  reply +=
    "Important: This is only a preliminary check. Additional scheme-specific requirements may apply.";

  if (scheme.application_url) {
    reply +=
      `\n\nApplication: ${scheme.application_url}`;
  }

  if (scheme.source_url) {
    reply +=
      `\n\nOfficial Source: ${scheme.source_url}`;
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
  const message = normalize(userMessage);

  // EXACT NAME
  const exactMatch = schemes.find(
    (scheme) =>
      normalize(scheme.name) === message
  );

  if (exactMatch) return exactMatch;

  // FULL NAME INSIDE MESSAGE
  const fullNameMatch = schemes.find(
    (scheme) => {
      const name = normalize(scheme.name);

      return (
        name.length >= 8 &&
        message.includes(name)
      );
    }
  );

  if (fullNameMatch) {
    return fullNameMatch;
  }

  // GENERIC QUERIES
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
    "post matric scholarship",
    "pre matric scholarship",
    "college scholarship",
    "higher education scholarship",
  ];

  if (
    genericPhrases.some(
      (phrase) =>
        message.includes(phrase)
    )
  ) {
    return null;
  }

  // REMOVE COMMON WORDS
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
    "do",
    "you",
  ];

  const words = message
    .split(/\s+/)
    .map((word) =>
      word.replace(
        /[^a-z0-9]/g,
        ""
      )
    )
    .filter(
      (word) =>
        word.length >= 3 &&
        !ignoredWords.includes(word)
    );

  if (!words.length) return null;

  // SCORE SCHEME NAMES
  const scored = schemes
    .map((scheme) => {
      const nameWords = normalize(
        scheme.name
      )
        .split(/[\s\-–—/(),.&]+/)
        .filter(
          (word) => word.length >= 3
        );

      let score = 0;

      for (const word of words) {
        if (nameWords.includes(word)) {
          score += 3;
        } else if (
          nameWords.some(
            (nameWord) =>
              nameWord.includes(word) ||
              word.includes(nameWord)
          )
        ) {
          score += 1;
        }
      }

      return { scheme, score };
    })
    .filter((item) => item.score >= 3)
    .sort(
      (a, b) => b.score - a.score
    );

  return scored.length
    ? scored[0].scheme
    : null;
};

// ============================================================
// SCHEME DETAILS
// ============================================================

const buildSchemeDetailsReply = (
  scheme,
  profile = {}
) => {
  let reply =
    `${scheme.name}\n\n`;

  reply +=
    `About the Scheme\n${
      scheme.description ||
      "Description not available."
    }\n\n`;

  reply +=
    `Benefit\n${
      scheme.benefit ||
      "Benefit information not available."
    }\n\n`;

  const hasProfileData =
    BASIC_FIELDS.some(
      (field) =>
        hasValue(profile, field)
    );

  if (hasProfileData) {
    const score =
      calculateMatchScore(
        scheme,
        profile
      );

    reply +=
      `Preliminary Match Score: ${score}%\n\n`;
  }

  reply +=
    "Eligibility\n" +
    "This scheme may have additional requirements. Use the detailed eligibility checker to verify all conditions.\n";

  if (scheme.application_url) {
    reply +=
      `\nApplication: ${scheme.application_url}\n`;
  }

  if (scheme.source_url) {
    reply +=
      `\n Official Source: ${scheme.source_url}`;
  }

  return reply;
};

// ============================================================
// CHECK IF SCHEME IS STUDENT RELATED
// ============================================================

const isStudentFocusedScheme = (
  scheme
) => {
  const text = normalize(
    `${scheme.name || ""} ${
      scheme.description || ""
    } ${scheme.benefit || ""} ${
      scheme.course || ""
    } ${scheme.program || ""} ${
      scheme.class_level || ""
    }`
  );

  return (
    Number(scheme.currently_enrolled) === 1 ||
    Boolean(
      scheme.course ||
      scheme.program ||
      scheme.class_level
    ) ||
    /\b(student|students|scholarship|school|college|education|post[- ]?matric|pre[- ]?matric)\b/i.test(
      text
    )
  );
};

// ============================================================
// GENERAL SEARCH
// ============================================================

const searchSchemes = (
  schemes,
  message,
  profile = {}
) => {
  const text = normalize(message);

  const studentQuery =
    /\b(student|students|scholarship|scholarships|school|college)\b/i.test(
      text
    );

  let searchableSchemes = schemes;

  // USE PROFILE FOR STUDENT SEARCH
  if (
    studentQuery &&
    isYes(profile.currentlyEnrolled)
  ) {
    const filtered =
      filterPossibleSchemes(
        schemes,
        profile
      );

    if (filtered.length) {
      searchableSchemes = filtered;
    }
  } else if (
    studentQuery &&
    !hasValue(
      profile,
      "currentlyEnrolled"
    )
  ) {
    searchableSchemes =
      schemes.filter(
        isStudentFocusedScheme
      );
  }

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
    "all",
  ];

  const words = text
    .split(/\s+/)
    .map((word) =>
      word.replace(
        /[^a-z0-9]/g,
        ""
      )
    )
    .filter(
      (word) =>
        word.length >= 3 &&
        !ignoredWords.includes(word)
    );

  if (!words.length) {
    if (
      hasValue(
        profile,
        "currentlyEnrolled"
      )
    ) {
      return searchableSchemes
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
        )
        .slice(0, 5)
        .map((item) => item.scheme);
    }

    return searchableSchemes.slice(
      0,
      5
    );
  }

  const matches =
    searchableSchemes.filter(
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

  return matches.length
    ? matches.slice(0, 5)
    : searchableSchemes.slice(0, 5);
};

// ============================================================
// NATURAL RESPONSE
// ============================================================

const buildNaturalResponse = (
  profile,
  nextField
) => {
  const knownDetails = [];

  if (hasValue(profile, "age")) {
    knownDetails.push(
      `you are ${profile.age} years old`
    );
  }

  if (hasValue(profile, "gender")) {
    knownDetails.push(
      `gender ${profile.gender}`
    );
  }

  if (isYes(profile.tnResident)) {
    knownDetails.push(
      "a Tamil Nadu resident"
    );
  }

  if (isNo(profile.tnResident)) {
    knownDetails.push(
      "not a Tamil Nadu resident"
    );
  }

  if (hasValue(profile, "community")) {
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
    isYes(
      profile.currentlyEnrolled
    ) &&
    hasValue(
      profile,
      "educationLevel"
    )
  ) {
    knownDetails.push(
      `studying at ${profile.educationLevel} level`
    );
  }

  if (isYes(profile.disability)) {
    knownDetails.push(
      "a person with a disability"
    );
  }

  if (isNo(profile.disability)) {
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
    if (knownDetails.length) {
      return (
        `Got it. I have noted that ${knownDetails.join(
          ", "
        )}.\n\n${QUESTIONS[nextField].label}`
      );
    }

    return QUESTIONS[nextField].label;
  }

  return null;
};

// ============================================================
// MAIN CHAT CONTROLLER
// ============================================================

const chat = async (req, res) => {
  try {
    const {
      message,
      profile = {},
      isAnswering = false,
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const userMessage = message.trim();
    const normalizedMessage =
      normalize(userMessage);

    // GET ACTIVE SCHEMES
    const [schemes] = await db.query(`
      SELECT *
      FROM schemes
      WHERE status = 'active'
      ORDER BY scheme_id ASC
    `);

    if (!schemes.length) {
      return res.json({
        success: true,
        reply:
          "Sorry, there are currently no active government schemes available.",
      });
    }

    // EXTRACT PROFILE
    let workingProfile =
      extractProfileFromMessage(
        userMessage,
        profile
      );

    // CONVERT ANSWER USING FRONTEND nextField
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

    // SPECIFIC SCHEME
    const directScheme =
      findSpecificScheme(
        schemes,
        normalizedMessage
      );

    // TARGET SCHEME FROM PREVIOUS QUESTION
    let targetScheme = null;

    if (
      isAnswering &&
      workingProfile.targetScheme
    ) {
      targetScheme =
        schemes.find(
          (scheme) =>
            scheme.scheme_id ===
            workingProfile.targetScheme
        ) || null;
    }

    // If user directly mentioned another scheme,
    // it becomes the new target.
    if (directScheme) {
      targetScheme = directScheme;
    }

    // INFORMATION REQUEST
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

    // SPECIFIC ELIGIBILITY
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

    const continuingSpecificCheck =
      targetScheme &&
      isAnswering &&
      !directScheme;

    if (
      asksSpecificEligibility ||
      continuingSpecificCheck
    ) {
      const schemeToCheck =
        directScheme ||
        targetScheme;

      const nextField =
        getNextQuestion(
          workingProfile
        );

      if (nextField) {
        workingProfile.targetScheme =
          schemeToCheck.scheme_id;

        return res.json({
          success: true,
          reply:
            `Sure! Let's check your eligibility for "${schemeToCheck.name}".\n\n` +
            buildNaturalResponse(
              workingProfile,
              nextField
            ),
          nextField,
          profile:
            workingProfile,
          targetScheme:
            schemeToCheck.scheme_id,
        });
      }

      delete workingProfile.targetScheme;

      return res.json({
        success: true,
        reply:
          buildSpecificEligibilityReply(
            schemeToCheck,
            workingProfile
          ),
        scheme:
          formatScheme(
            schemeToCheck,
            workingProfile
          ),
        profile:
          workingProfile,
        confirmed: false,
      });
    }

    // DIRECT SCHEME DETAILS
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

    // GENERAL ELIGIBILITY
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
      ) || isAnswering;

    if (wantsEligibility) {
      delete workingProfile.targetScheme;

      const nextField =
        getNextQuestion(
          workingProfile
        );

      if (nextField) {
        return res.json({
          success: true,
          reply:
            buildNaturalResponse(
              workingProfile,
              nextField
            ),
          nextField,
          profile:
            workingProfile,
        });
      }

      const possibleSchemes =
        filterPossibleSchemes(
          schemes,
          workingProfile
        );

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
        sortedSchemes.slice(0, 5);

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

    // GENERAL SCHEME QUERY
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

    if (isGeneralQuery) {
      const resultSchemes =
        searchSchemes(
          schemes,
          normalizedMessage,
          workingProfile
        );

      let list = resultSchemes
        .map((scheme, index) => {
          let text =
            `${index + 1}. ${scheme.name}\n\n`;

          text +=
            `About: ${
              scheme.description ||
              "Description not available."
            }\n\n`;

          text +=
            `Benefit: ${
              scheme.benefit ||
              "Benefit information not available."
            }`;

          return text;
        })
        .join(
          "\n\n────────────────────────\n\n"
        );

      return res.json({
        success: true,
        reply:
          `Government Schemes\n\n${list}\n\n` +
          "You can ask me about any specific scheme to learn more.",
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

    // NATURAL PROFILE COMPLETION
    const nextField =
      getNextQuestion(
        workingProfile
      );

    const profileChanged =
      JSON.stringify(
        workingProfile
      ) !==
      JSON.stringify(profile);

    if (
      profileChanged &&
      !nextField
    ) {
      const possibleSchemes =
        filterPossibleSchemes(
          schemes,
          workingProfile
        );

      return res.json({
        success: true,
        reply:
          buildPossibleSchemesReply(
            possibleSchemes,
            workingProfile
          ),
        schemes:
          possibleSchemes
            .slice(0, 5)
            .map(
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

    if (profileChanged) {
      const naturalReply =
        buildNaturalResponse(
          workingProfile,
          nextField
        );

      if (naturalReply) {
        return res.json({
          success: true,
          reply: naturalReply,
          nextField:
            nextField || null,
          profile:
            workingProfile,
        });
      }
    }

    // GREETING
    if (
      /^(hi|hello|hey|hai|good morning|good afternoon|good evening)\b/i.test(
        normalizedMessage
      )
    ) {
      return res.json({
        success: true,
        reply:
          "Hi! I'm SchemeCheck Assistant. I can help you find government schemes, check possible eligibility, and explain scheme benefits.\n\nYou can simply tell me about yourself, or ask about a specific scheme.",
      });
    }

    // DEFAULT
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

module.exports = {
  chat,
};