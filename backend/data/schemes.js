const schemes = [
  // =========================================================
  // 1. TAMIZH PUDHALVAN THITTAM
  // =========================================================
  {
    id: "SCH001",

    name: "Tamizh Pudhalvan Thittam",

    description:
      "Financial assistance for eligible male students pursuing higher education.",

    benefit: "₹1,000 per month",

    department: "Social Welfare and Women Empowerment Department",

    status: "Active",

    eligibility: {
      gender: ["Male"],

      tnResident: "Yes",

      schoolType: ["Government", "Government-Aided"],

      course: ["Undergraduate Degree", "Diploma", "ITI"],
    },

    requiredDocuments: [
      "Aadhaar Card",
      "Class 6–12 Study Certificate",
      "College Bonafide Certificate",
      "Active Bank Account Details",
    ],
  },

  // =========================================================
  // 2. KALAIGNAR MAGALIR URIMAI THITTAM
  // =========================================================
  {
    id: "SCH002",

    name: "Kalaignar Magalir Urimai Thittam",

    description:
      "Monthly financial assistance for eligible women heads of families.",

    benefit: "₹1,000 per month",

    department:
      "Special Programme Implementation Department / E-Governance Authority",

    status: "Active",

    eligibility: {
      gender: ["Female"],

      tnResident: "Yes",

      minAge: 21,

      familyHead: "Yes",

      maxAnnualIncome: 250000,

      electricityConsumption: "Up to 3,600 units",

      // numberOfLandHoldings and totalLandArea
      // are collected from the user but are not
      // checked until confirmed limits are defined.
    },

    requiredDocuments: [
      "Aadhaar Card",
      "Family / Smart Ration Card",
      "Bank Passbook linked with Aadhaar",
    ],
  },

  // =========================================================
  // 3. POST-MATRIC SCHOLARSHIP
  // =========================================================
  {
    id: "SCH003",

    name: "Post-Matric Scholarship",

    description:
      "Financial assistance for eligible students pursuing post-matriculation studies.",

    benefit: "Educational financial assistance",

    department:
      "Adi Dravidar and Tribal Welfare Department / BC, MBC & Minorities Welfare Department",

    status: "Active",

    eligibility: {
      tnResident: "Yes",

      community: ["SC", "ST", "BC", "MBC", "DNC"],

      course: [
        "Class XI",
        "Class XII",
        "ITI",
        "Diploma",
        "UG",
        "PG",
        "Professional Course",
        "PhD",
      ],

      bonafide: "Yes",

      minPercentage: 50,
    },

    requiredDocuments: [
      "Community Certificate",
      "Income Certificate",
      "Previous Year Marksheet",
      "Fee Receipt",
      "Aadhaar Card",
      "Institutional Bonafide / Admission Proof",
    ],
  },

  // =========================================================
  // 4. FREE LAPTOP DISTRIBUTION SCHEME
  // =========================================================
  {
    id: "SCH004",

    name: "Free Laptop Distribution Scheme",

    description:
      "Laptop distribution assistance for eligible students in higher education.",

    benefit: "Free laptop",

    department:
      "Higher Education Department / Special Programme Implementation Department",

    status: "Active",

    eligibility: {
      tnResident: "Yes",

      institutionType: ["Government", "Government-Aided"],

      course: [
        "Undergraduate Degree",
        "Engineering",
        "Polytechnic Diploma",
        "ITI",
      ],

      fullTime: "Yes",

      studentStatus: "Currently Enrolled",
    },

    requiredDocuments: [
      "Student Identity / Aadhaar Card",
      "College Identity / Bonafide Certificate",
      "Admission / Enrollment Proof",
    ],
  },

  // =========================================================
  // 5. ANNAL AMBEDKAR OVERSEAS HIGHER EDUCATION
  //    SCHOLARSHIP SCHEME
  // =========================================================
  {
    id: "SCH005",

    name: "Annal Ambedkar Overseas Higher Education Scholarship",

    description:
      "Financial assistance for eligible students pursuing higher education abroad.",

    benefit: "Overseas education financial assistance",

    department: "Adi Dravidar and Tribal Welfare Department",

    status: "Active",

    eligibility: {
      community: ["SC", "SCC", "ST"],

      program: ["Master's Degree", "PhD", "Post-Doctoral Research"],

      maxAnnualIncome: 1200000,

      admission: "Yes",

      qsRanking: "Yes",

      familyBeneficiary: "No",

      passport: "Yes",

      // Age depends on the selected programme.
      ageLimits: {
        "Master's Degree": {
          maxAge: 35,
        },

        PhD: {
          maxAge: 40,
        },

        "Post-Doctoral Research": {
          maxAge: null,
        },
      },

      scholarshipSlabs: [
        {
          maxAnnualIncome: 800000,

          maximumScholarship: "₹36 Lakhs per annum",
        },

        {
          minAnnualIncome: 800001,

          maxAnnualIncome: 1200000,

          maximumScholarship: "₹24 Lakhs per annum",
        },
      ],
    },

    requiredDocuments: [
      "University Admission / Offer Letter",
      "Valid Passport",
      "Visa Documentation",
      "Community Certificate",
      "Family Income Certificate",
      "Income Tax Return / Salary Slips",
      "Aadhaar Card",
      "Smart / Ration Card",
      "Academic Transcripts",
      "Provisional Degree Certificates",
    ],
  },
];

module.exports = schemes;
