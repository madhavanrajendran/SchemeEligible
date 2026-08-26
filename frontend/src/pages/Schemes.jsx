import { useNavigate } from "react-router-dom";
import Navbar from "@/components/custom/Navbar";
import SchemeGrid from "@/components/custom/SchemeGrid";

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

    fields: [
      {
        name: "fullName",
        label: "Full Name",
        type: "text",
        required: true,
      },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Other"],
        required: true,
      },
      {
        name: "tnResident",
        label: "Are you a resident of Tamil Nadu?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "schoolName",
        label: "School Name (Classes 6–12)",
        type: "text",
        required: true,
      },
      {
        name: "schoolType",
        label: "School Type",
        type: "select",
        options: [
          "Government",
          "Government-Aided",
          "Private",
          "Other"
        ],
        required: true,
      },
      {
        name: "course",
        label: "Current Course",
        type: "select",
        options: [
          "Undergraduate Degree",
          "Diploma",
          "ITI",
          "Other",
        ],
        required: true,
      },
      {
        name: "institutionName",
        label: "Current Institution Name",
        type: "text",
        required: true,
      },
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

    fields: [
      {
        name: "fullName",
        label: "Full Name",
        type: "text",
        required: true,
      },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Other"],
        required: true,
      },
      {
        name: "tnResident",
        label: "Are you a resident of Tamil Nadu?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "age",
        label: "Age",
        type: "number",
        required: true,
      },
      {
        name: "familyHead",
        label: "Are you the head of the family?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "annualIncome",
        label: "Annual Family Income (₹)",
        type: "number",
        required: true,
      },
      {
        name: "numberOfLandHoldings",
        label: "Number of Land Holdings",
        type: "number",
        required: true,
      },
      {
        name: "totalLandArea",
        label: "Total Land Area Owned (acres)",
        type: "number",
        step: "0.01",
        required: true,
      },
      {
        name: "electricityConsumption",
        label: "Annual Household Electricity Consumption",
        type: "select",
        options: [
          "Up to 3,600 units",
          "Above 3,600 units",
        ],
        required: true,
      },
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

    fields: [
      {
        name: "fullName",
        label: "Full Name",
        type: "text",
        required: true,
      },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Other"],
        required: true,
      },
      {
        name: "tnResident",
        label: "Are you a resident of Tamil Nadu?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "community",
        label: "Community",
        type: "select",
        options: [
          "SC",
          "ST",
          "BC",
          "MBC",
          "DNC",
          "Other",
        ],
        required: true,
      },
      {
        name: "course",
        label: "Current Course",
        type: "select",
        options: [
          "Class XI",
          "Class XII",
          "ITI",
          "Diploma",
          "UG",
          "PG",
          "Professional Course",
          "PhD",
        ],
        required: true,
      },
      {
        name: "institutionName",
        label: "Current Institution Name",
        type: "text",
        required: true,
      },
      {
        name: "institutionType",
        label: "Institution Type",
        type: "select",
        options: [
          "Government",
          "Government-Aided",
          "Other",
        ],
        required: true,
      },
      {
        name: "annualIncome",
        label: "Annual Family Income (₹)",
        type: "number",
        required: true,
      },
      {
        name: "cgpa",
        label: "Previous Academic CGPA",
        type: "number",
        step: "0.01",
        required: true,
      },
      {
        name: "bonafide",
        label: "Do you have admission/bonafide proof?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
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

    fields: [
      {
        name: "fullName",
        label: "Full Name",
        type: "text",
        required: true,
      },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Other"],
        required: true,
      },
      {
        name: "tnResident",
        label: "Are you a resident of Tamil Nadu?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "institutionName",
        label: "Current Institution Name",
        type: "text",
        required: true,
      },
      {
        name: "institutionType",
        label: "Institution Type",
        type: "select",
        options: [
          "Government",
          "Government-Aided",
          "Other",
        ],
        required: true,
      },
      {
        name: "course",
        label: "Current Course",
        type: "select",
        options: [
          "Undergraduate Degree",
          "Engineering",
          "Polytechnic Diploma",
          "ITI",
          "Other",
        ],
        required: true,
      },
      {
        name: "fullTime",
        label: "Are you a full-time student?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "studentStatus",
        label: "Current Student Status",
        type: "select",
        options: [
          "Currently Enrolled",
          "Not Currently Enrolled",
        ],
        required: true,
      },
    ],
  },

  // =========================================================
  // 5. ANNAL AMBEDKAR OVERSEAS HIGHER EDUCATION SCHOLARSHIP
  // =========================================================
  {
    id: "SCH005",
    name: "Annal Ambedkar Overseas Higher Education Scholarship",
    description:
      "Financial assistance for eligible students pursuing higher education abroad.",
    benefit: "Overseas education financial assistance",

    fields: [
      {
        name: "fullName",
        label: "Full Name",
        type: "text",
        required: true,
      },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female", "Other"],
        required: true,
      },
      {
        name: "tnResident",
        label: "Are you a resident of Tamil Nadu?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "community",
        label: "Community",
        type: "select",
        options: [
          "SC",
          "SCC",
          "ST",
          "BC",
          "MBC",
          "DNC",
          "Other",
        ],
        required: true,
      },
      {
        name: "age",
        label: "Age",
        type: "number",
        required: true,
      },
      {
        name: "program",
        label: "Programme",
        type: "select",
        options: [
          "Master's Degree",
          "PhD",
          "Post-Doctoral Research",
          "Other",
        ],
        required: true,
      },
      {
        name: "annualIncome",
        label: "Annual Family Income (₹)",
        type: "number",
        required: true,
      },
      {
        name: "institutionName",
        label: "Foreign University Name",
        type: "text",
        required: true,
      },
      {
        name: "admission",
        label:
          "Do you have confirmed admission to a foreign university?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "qsRanking",
        label:
          "Is the university within the required QS Top 1,000 ranking?",
        type: "select",
        options: ["Yes", "No", "Not Sure"],
        required: true,
      },
      {
        name: "familyBeneficiary",
        label:
          "Has another person from your family already received this benefit?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
      {
        name: "passport",
        label: "Do you have a valid passport?",
        type: "select",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
];

function Schemes() {
  const navigate = useNavigate();

  const handleSelect = (scheme) => {
    navigate(`/eligibility/${scheme.id}`, {
      state: { scheme },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm font-medium text-gray-500">
            AVAILABLE SCHEMES
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Choose a scheme
          </h1>

          <p className="mt-3 text-gray-600">
            Select a scheme to check whether you meet its eligibility
            requirements.
          </p>
        </div>

        <SchemeGrid
          schemes={schemes}
          onSelect={handleSelect}
        />
      </main>
    </div>
  );
}

export default Schemes;