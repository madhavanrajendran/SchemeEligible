import os
import json

from dotenv import load_dotenv
from google import genai
from google.genai import types


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError(
        "❌ GEMINI_API_KEY is missing from the .env file."
    )


# =========================================================
# GEMINI CLIENT
# =========================================================

client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(
        timeout=30000,
        retry_options=types.HttpRetryOptions(
            attempts=1
        )
    )
)


# =========================================================
# ANALYZE SCHEME
# =========================================================

def analyze_scheme(scheme_name, scraped_text):
    """
    Analyze a government scheme webpage using Gemini.

    Gemini is instructed to extract only explicitly supported
    facts and provide evidence + confidence for each fact.
    """

    prompt = f"""
You are a strict information extraction system for a
Tamil Nadu Government student welfare and education
scheme database.

Your task is NOT to summarize the webpage.

Your task is to extract ONLY factual eligibility,
benefit, document, and application information that is
explicitly supported by the supplied webpage content.

SCHEME NAME:
{scheme_name}

=========================================================
WEBSITE CONTENT
=========================================================

{scraped_text}

=========================================================
END WEBSITE CONTENT
=========================================================


IMPORTANT EXTRACTION RULES
=========================================================

1. Use ONLY information present in the supplied website
   content.

2. NEVER use your own knowledge.

3. NEVER guess or infer an eligibility requirement.

4. If a requirement is not explicitly stated, return null.

5. If the wording is ambiguous, return null rather than
   guessing.

6. Distinguish carefully between:
   - eligibility requirements
   - required documents
   - benefits
   - application information

7. A document requirement does NOT automatically mean that
   the corresponding eligibility condition exists.

   Example:

   "Disability certificate is required"

   does NOT prove:

   "Applicant must have a disability."

8. A school being mentioned does NOT automatically mean that
   studying in that school is an eligibility requirement.

   Example:

   "Government schools are participating institutions"

   does NOT prove:

   "Applicant must have studied in a government school."

9. Preserve the meaning and context of numbers.

10. Do NOT treat numbers as equivalent when their units or
    meanings are different.

    Example:

    ₹2 lakh per year
    is NOT the same as
    ₹2 lakh per month.

11. Percentages must retain their meaning.

    Example:

    "60% marks"
    is NOT the same as
    "60% attendance".

12. Age limits must clearly distinguish minimum and maximum
    age.

13. Income limits must be represented as annual income only
    when the webpage explicitly states annual income.

14. If the webpage says only "income limit" without enough
    information to determine whether it is annual or monthly,
    do not convert it into an annual income value.

15. Do not convert natural-language requirements into database
    values unless the meaning is explicit.

16. For every extracted fact, provide:
    - value
    - evidence
    - confidence

17. Evidence must be a short quotation or faithful excerpt
    from the supplied webpage content.

18. Confidence must be one of:
    - "high"
    - "medium"
    - "low"

19. Use "high" only when the webpage explicitly and clearly
    states the fact.

20. Use "medium" only when the fact is clearly supported but
    wording requires minor interpretation.

21. Use "low" only when there is weak or ambiguous evidence.
    Prefer null instead of low confidence whenever possible.

22. Do NOT create a change merely because two sentences are
    worded differently.

23. Do NOT treat synonyms as different facts.

    Example:
    "Male students"
    and
    "Students must be male"

    represent the same requirement.

24. Do NOT treat additional descriptive wording as a new
    requirement.

25. If multiple pieces of evidence support the same fact,
    combine them into one fact when possible.

26. Do not include information that is unrelated to the scheme.

27. Return ONLY valid JSON.
    Do not return markdown.
    Do not return explanations outside JSON.


=========================================================
REQUIRED JSON STRUCTURE
=========================================================

Return exactly this structure:

{{
    "scheme_name": null,

    "eligibility": {{

        "age": {{
            "min": null,
            "max": null,
            "evidence": null,
            "confidence": null
        }},

        "gender": {{
            "value": null,
            "evidence": null,
            "confidence": null
        }},

        "tn_resident": {{
            "value": null,
            "evidence": null,
            "confidence": null
        }},

        "community": {{
            "value": null,
            "evidence": null,
            "confidence": null
        }},

        "school_requirement": {{
            "value": null,
            "evidence": null,
            "confidence": null
        }},

        "institution_requirement": {{
            "value": null,
            "evidence": null,
            "confidence": null
        }},

        "course": {{
            "value": null,
            "evidence": null,
            "confidence": null
        }},

        "programme": {{
            "value": null,
            "evidence": null,
            "confidence": null
        }},

        "academic_percentage": {{
            "value": null,
            "type": null,
            "evidence": null,
            "confidence": null
        }},

        "income": {{
            "value": null,
            "type": null,
            "evidence": null,
            "confidence": null
        }},

        "government_quota": {{
            "value": null,
            "evidence": null,
            "confidence": null
        }},

        "disability": {{
            "value": null,
            "min_percentage": null,
            "evidence": null,
            "confidence": null
        }},

        "other": []
    }},

    "documents": [],

    "benefits": {{
        "value": null,
        "evidence": null,
        "confidence": null
    }},

    "application_information": {{
        "value": null,
        "evidence": null,
        "confidence": null
    }},

    "important_changes": []
}}


=========================================================
FIELD-SPECIFIC RULES
=========================================================

AGE
---------------------------------------------------------

If the webpage explicitly states:

"Age should be at least 18"

return:

"min": 18

If it states:

"Age should not exceed 25"

return:

"max": 25

Do not guess missing boundaries.


GENDER
---------------------------------------------------------

Return only an explicitly stated gender requirement.

Examples:

"Male students" → "Male"

"Female students" → "Female"

If no gender restriction is stated → null.


TAMIL NADU RESIDENCY
---------------------------------------------------------

Only return true if the webpage explicitly requires
Tamil Nadu residency, nativity, domicile, or equivalent.

Do not assume residency simply because the scheme is
a Tamil Nadu Government scheme.


COMMUNITY
---------------------------------------------------------

Extract only explicitly stated community/category requirements.

Preserve the actual categories mentioned.

Do not invent caste/community mappings.


SCHOOL REQUIREMENT
---------------------------------------------------------

Extract only explicit educational-history requirements.

Examples:

"Studied Classes VI to XII in Government schools"

or

"Must have studied in a Government school"

These may be extracted.

Do NOT infer a school requirement from a general reference
to schools.


INSTITUTION REQUIREMENT
---------------------------------------------------------

Extract explicit institution restrictions.

Examples:

"Must study in a recognised institution"

"Must be enrolled in a Government institution"

Do not infer institution requirements from the institution
name alone.


COURSE
---------------------------------------------------------

Extract explicitly eligible courses.

Preserve the wording.

Example:

"Degree, Diploma, ITI or equivalent"

Do not remove "equivalent".


PROGRAMME
---------------------------------------------------------

Extract explicitly stated programme requirements.

Do not confuse programme names with course names.


ACADEMIC PERCENTAGE
---------------------------------------------------------

Return:

"value": the percentage number

"type": what the percentage refers to

Possible examples:

"marks"
"attendance"
"previous qualification"
"unknown"

Example:

"Minimum 60% marks"

becomes:

{{
    "value": 60,
    "type": "marks"
}}

Do not confuse marks with attendance.


INCOME
---------------------------------------------------------

Extract the actual income amount only when the webpage
clearly identifies the income limit.

Example:

"Annual family income should not exceed Rs. 2.5 lakh"

becomes:

{{
    "value": 250000,
    "type": "annual"
}}

Example:

"Monthly income should not exceed Rs. 20,000"

becomes:

{{
    "value": 20000,
    "type": "monthly"
}}

Do NOT convert monthly income into annual income.

Do NOT assume annual income when the webpage does not specify
the period.


GOVERNMENT QUOTA
---------------------------------------------------------

Return a requirement only when government quota is explicitly
mentioned as an eligibility condition.


DISABILITY
---------------------------------------------------------

A disability eligibility condition and a disability certificate
requirement are separate.

Example:

"Students with at least 40% disability"

becomes:

{{
    "value": true,
    "min_percentage": 40
}}

But:

"Disability certificate must be submitted"

does NOT create a disability eligibility requirement.


DOCUMENTS
---------------------------------------------------------

List only documents explicitly required by the webpage.

Do not convert documents into eligibility conditions.

Each document should use this structure:

{{
    "name": null,
    "evidence": null,
    "confidence": null
}}


BENEFITS
---------------------------------------------------------

Extract the actual benefit information.

Preserve important units and frequency.

Example:

"Rs. 1,000 per month"

must remain clearly monthly.


APPLICATION INFORMATION
---------------------------------------------------------

Extract explicitly stated information about:

- application process
- application portal
- application deadline
- where to apply
- application method

Do not invent URLs.


IMPORTANT CHANGES
---------------------------------------------------------

List only important changes or updated information explicitly
mentioned in the webpage.

Each change should use:

{{
    "description": null,
    "evidence": null,
    "confidence": null
}}


FINAL REQUIREMENT
=========================================================

Accuracy is more important than completeness.

If there is any uncertainty:

RETURN NULL.

Never guess.
"""


    try:

        # -------------------------------------------------
        # SEND REQUEST TO GEMINI
        # -------------------------------------------------

        interaction = client.interactions.create(
            model="gemini-3.6-flash",
            input=prompt,
        )

        result = interaction.output_text.strip()

        # -------------------------------------------------
        # CONVERT GEMINI RESPONSE TO PYTHON DICTIONARY
        # -------------------------------------------------

        try:
            parsed_result = json.loads(result)

            if not isinstance(parsed_result, dict):
                print("⚠️ Gemini returned JSON, but it is not an object.")
                return None

            return parsed_result

        except json.JSONDecodeError:

            print("⚠️ Gemini returned invalid JSON.")
            print("\nGemini response:")
            print(result)

            return None

    except Exception as error:

        print("❌ Gemini analysis failed:")
        print(error)

        return None


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    test_text = """
    Tamil Pudhalvan Thittam

    Tamil Pudhalvan Thittam is for male students.

    Male students who studied Classes VI to XII
    in Government schools in Tamil Nadu.

    Students must be pursuing higher education.

    Eligible courses include Degree, Diploma,
    ITI or equivalent courses.

    Students must be admitted to a recognised
    institution in Tamil Nadu.

    The benefit is Rs. 1,000 per month.
    """

    print("🤖 Sending information to Gemini...\n")

    result = analyze_scheme(
        "Tamil Pudhalvan Thittam",
        test_text
    )

    if result:

        print("✅ Gemini analysis successful!\n")

        print("=" * 70)

        print(
            json.dumps(
                result,
                indent=4,
                ensure_ascii=False
            )
        )

        print("=" * 70)

    else:

        print("❌ Analysis failed.")
