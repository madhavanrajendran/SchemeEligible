import json
import re


# =========================================================
# DATABASE FIELDS THAT AI IS ALLOWED TO COMPARE
# =========================================================

MANAGED_FIELDS = {
    "name",
    "description",
    "benefit",
    "min_age",
    "max_age",
    "gender",
    "tn_resident",
    "community",
    "class_level",
    "course",
    "program",
    "previous_qualification",
    "school_type",
    "institution_type",
    "studied_govt_school",
    "studied_classes_6_12_govt",
    "currently_enrolled",
    "full_time_required",
    "professional_course",
    "medium",
    "government_quota_required",
    "min_percentage",
    "previous_qualification_percentage",
    "max_annual_income",
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
}


# =========================================================
# BASIC NORMALIZATION
# =========================================================

def normalize(value):
    """
    Normalize simple text values for comparison.
    """

    if value is None:
        return None

    if isinstance(value, str):
        return " ".join(
            value.strip().lower().split()
        )

    return value


# =========================================================
# TEXT NORMALIZATION
# =========================================================

def normalize_text(value):
    """
    Normalize text while removing common descriptive wording
    that does not change the underlying meaning.
    """

    if value is None:
        return None

    text = normalize(value)

    if not isinstance(text, str):
        return text

    replacements = {
        "students must be": "",
        "student must be": "",
        "students should be": "",
        "student should be": "",
        "students are required to be": "",
        "student is required to be": "",
        "eligible students are": "",
        "eligible student is": "",
        "students who are": "",
        "students who": "",
        "male students": "male",
        "female students": "female",
        "male student": "male",
        "female student": "female",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    return " ".join(text.split()).strip()


# =========================================================
# BOOLEAN NORMALIZATION
# =========================================================

def normalize_boolean(value):

    if value is None:
        return None

    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):

        if value == 1:
            return True

        if value == 0:
            return False

    if isinstance(value, str):

        value = normalize(value)

        true_values = {
            "true",
            "yes",
            "required",
            "mandatory",
            "1",
            "applicable",
        }

        false_values = {
            "false",
            "no",
            "not required",
            "optional",
            "0",
            "not applicable",
        }

        if value in true_values:
            return True

        if value in false_values:
            return False

    return value


# =========================================================
# EXTRACT NUMBER
# =========================================================

def extract_number(value):

    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    if not isinstance(value, str):
        return None

    text = value.lower().strip()

    text = text.replace(",", "")

    # -----------------------------------------------------
    # Lakh
    # -----------------------------------------------------

    lakh_match = re.search(
        r"(\d+(?:\.\d+)?)\s*lakh",
        text
    )

    if lakh_match:

        number = float(
            lakh_match.group(1)
        )

        return number * 100000

    # -----------------------------------------------------
    # Crore
    # -----------------------------------------------------

    crore_match = re.search(
        r"(\d+(?:\.\d+)?)\s*crore",
        text
    )

    if crore_match:

        number = float(
            crore_match.group(1)
        )

        return number * 10000000

    # -----------------------------------------------------
    # Normal number
    # -----------------------------------------------------

    number_match = re.search(
        r"\d+(?:\.\d+)?",
        text
    )

    if number_match:

        return float(
            number_match.group(0)
        )

    return None


# =========================================================
# EXTRACT PERCENTAGE
# =========================================================

def extract_percentage(value):

    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    if not isinstance(value, str):
        return None

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*%",
        value
    )

    if match:

        return float(
            match.group(1)
        )

    return None


# =========================================================
# CONFIDENCE CHECK
# =========================================================

def is_safe_confidence(confidence):
    """
    Only high-confidence AI facts are allowed to create
    database changes automatically.

    Medium and low confidence information is ignored.
    """

    return confidence == "high"


# =========================================================
# EXTRACT AI FACT
# =========================================================

def extract_ai_fact(value):

    """
    Extract the value, evidence and confidence from the new
    Gemini structured format.

    Expected format:

    {
        "value": "...",
        "evidence": "...",
        "confidence": "high"
    }
    """

    if not isinstance(value, dict):
        return {
            "value": value,
            "evidence": None,
            "confidence": None,
        }

    return {
        "value": value.get("value"),
        "evidence": value.get("evidence"),
        "confidence": value.get("confidence"),
    }


# =========================================================
# SEMANTIC TEXT EQUALITY
# =========================================================

def text_values_equal(old_value, new_value):

    old_text = normalize_text(old_value)
    new_text = normalize_text(new_value)

    if old_text == new_text:
        return True

    if not isinstance(old_text, str) or not isinstance(new_text, str):
        return False

    # -----------------------------------------------------
    # Simple word-set comparison
    #
    # This handles harmless wording differences such as:
    #
    # "Male students"
    # "Students must be male"
    # -----------------------------------------------------

    old_words = set(old_text.split())
    new_words = set(new_text.split())

    if old_words == new_words:
        return True

    return False


# =========================================================
# NUMERIC VALUES EQUALITY
# =========================================================

def numeric_values_equal(old_value, new_value):

    old_number = extract_number(old_value)
    new_number = extract_number(new_value)

    if old_number is None or new_number is None:
        return False

    return old_number == new_number


# =========================================================
# COMPARE ONE VALUE
# =========================================================

def compare_value(
    field,
    old_value,
    new_value,
    evidence=None,
    confidence=None
):

    # -----------------------------------------------------
    # Never compare an uncertain AI fact
    # -----------------------------------------------------

    if confidence is not None:

        if not is_safe_confidence(confidence):
            return None

    # -----------------------------------------------------
    # Both missing
    # -----------------------------------------------------

    if old_value is None and new_value is None:
        return None

    # -----------------------------------------------------
    # Never create a change from AI null
    # -----------------------------------------------------

    if new_value is None:
        return None

    # -----------------------------------------------------
    # Boolean comparison
    # -----------------------------------------------------

    old_boolean = normalize_boolean(old_value)
    new_boolean = normalize_boolean(new_value)

    if (
        isinstance(old_boolean, bool)
        and isinstance(new_boolean, bool)
    ):

        if old_boolean == new_boolean:
            return None

        return {
            "field": field,
            "old_value": old_value,
            "new_value": new_value,
            "evidence": evidence,
            "confidence": confidence,
        }

    # -----------------------------------------------------
    # Percentage comparison
    # -----------------------------------------------------

    old_percentage = extract_percentage(old_value)
    new_percentage = extract_percentage(new_value)

    if (
        old_percentage is not None
        and new_percentage is not None
    ):

        if old_percentage == new_percentage:
            return None

        return {
            "field": field,
            "old_value": old_value,
            "new_value": new_value,
            "evidence": evidence,
            "confidence": confidence,
        }

    # -----------------------------------------------------
    # Numeric comparison
    # -----------------------------------------------------

    if numeric_values_equal(
        old_value,
        new_value
    ):

        return None

    # -----------------------------------------------------
    # Semantic text comparison
    # -----------------------------------------------------

    if text_values_equal(
        old_value,
        new_value
    ):

        return None

    # -----------------------------------------------------
    # Different values
    # -----------------------------------------------------

    return {
        "field": field,
        "old_value": old_value,
        "new_value": new_value,
        "evidence": evidence,
        "confidence": confidence,
    }


# =========================================================
# DOCUMENT → DATABASE FIELD MAPPING
# =========================================================

DOCUMENT_MAPPING = {

    "community certificate":
        "community_certificate_required",

    "income certificate":
        "income_certificate_required",

    "bonafide certificate":
        "bonafide_certificate_required",

    "disability certificate":
        "disability_certificate_required",

    "nativity certificate":
        "nativity_certificate_required",

    "bank account":
        "bank_account_required",

    "bank pass book":
        "bank_account_required",

    "aadhaar":
        "aadhaar_required",

    "admission proof":
        "admission_proof_required",
}


# =========================================================
# CONVERT DOCUMENT LIST TO DB FLAGS
# =========================================================

def process_documents(
    current_scheme,
    documents
):

    changes = []

    if not documents:
        return changes

    detected_fields = {}

    for document in documents:

        # New Gemini document structure
        if isinstance(document, dict):

            document_name = document.get("name")
            evidence = document.get("evidence")
            confidence = document.get("confidence")

        else:

            document_name = document
            evidence = None
            confidence = None

        if not document_name:
            continue

        # -------------------------------------------------
        # Only high-confidence documents can create changes
        # -------------------------------------------------

        if confidence is not None:

            if not is_safe_confidence(confidence):
                continue

        document_normalized = normalize(
            document_name
        )

        for keyword, db_field in DOCUMENT_MAPPING.items():

            if keyword in document_normalized:

                detected_fields[db_field] = {
                    "evidence": evidence,
                    "confidence": confidence,
                }

    for db_field, metadata in detected_fields.items():

        old_value = current_scheme.get(
            db_field
        )

        new_value = 1

        change = compare_value(
            db_field,
            old_value,
            new_value,
            evidence=metadata.get("evidence"),
            confidence=metadata.get("confidence"),
        )

        if change:

            changes.append(
                change
            )

    return changes


# =========================================================
# COURSE SEMANTIC COMPARISON
# =========================================================

def course_values_equal(old_value, new_value):

    if old_value is None or new_value is None:
        return False

    old_text = normalize_text(old_value)
    new_text = normalize_text(new_value)

    if old_text == new_text:
        return True

    # -----------------------------------------------------
    # Compare course names as sets
    # -----------------------------------------------------

    def extract_courses(text):

        text = text.lower()

        text = text.replace(
            " or equivalent courses",
            ""
        )

        text = text.replace(
            " or equivalent",
            ""
        )

        parts = re.split(
            r",|\bor\b|\band\b",
            text
        )

        courses = set()

        for part in parts:

            part = part.strip()

            if part:
                courses.add(part)

        return courses

    old_courses = extract_courses(old_text)
    new_courses = extract_courses(new_text)

    return old_courses == new_courses


# =========================================================
# COMPARE SCHEME
# =========================================================

def compare_scheme(
    current_scheme,
    analyzed_scheme
):

    changes = []

    eligibility = analyzed_scheme.get(
        "eligibility",
        {}
    )

    # =====================================================
    # DIRECT GEMINI → DATABASE MAPPING
    # =====================================================

    field_mapping = {

        "gender":
            "gender",

        "tn_resident":
            "tn_resident",

        "community":
            "community",

        "course":
            "course",

        "programme":
            "program",

        "academic_percentage":
            "min_percentage",

        "income":
            "max_annual_income",

        "government_quota":
            "government_quota_required",

        "disability":
            "disability_required",
    }

    # =====================================================
    # DIRECT FIELD COMPARISON
    # =====================================================

    for ai_field, db_field in field_mapping.items():

        ai_fact = eligibility.get(
            ai_field
        )

        if not ai_fact:
            continue

        # -------------------------------------------------
        # Extract structured Gemini fact
        # -------------------------------------------------

        fact = extract_ai_fact(
            ai_fact
        )

        new_value = fact["value"]
        evidence = fact["evidence"]
        confidence = fact["confidence"]

        # -------------------------------------------------
        # Never use uncertain information
        # -------------------------------------------------

        if not is_safe_confidence(
            confidence
        ):
            continue

        # -------------------------------------------------
        # Never replace DB information with null
        # -------------------------------------------------

        if new_value is None:
            continue

        if db_field not in MANAGED_FIELDS:
            continue

        old_value = current_scheme.get(
            db_field
        )

        # -------------------------------------------------
        # Course-specific comparison
        # -------------------------------------------------

        if ai_field == "course":

            if course_values_equal(
                old_value,
                new_value
            ):
                continue

        # -------------------------------------------------
        # Income-specific comparison
        # -------------------------------------------------

        if ai_field == "income":

            income_type = None

            if isinstance(ai_fact, dict):
                income_type = ai_fact.get(
                    "type"
                )

            # Only annual income can update
            # max_annual_income.
            if income_type != "annual":
                continue

            # Gemini gives a normalized numeric value.
            if not isinstance(
                new_value,
                (int, float)
            ):
                continue

        # -------------------------------------------------
        # Academic percentage
        # -------------------------------------------------

        if ai_field == "academic_percentage":

            percentage_type = None

            if isinstance(ai_fact, dict):
                percentage_type = ai_fact.get(
                    "type"
                )

            # min_percentage represents academic marks.
            # Attendance must not modify it.
            if percentage_type != "marks":
                continue

            if not isinstance(
                new_value,
                (int, float)
            ):
                continue

        # -------------------------------------------------
        # Disability
        # -------------------------------------------------

        if ai_field == "disability":

            disability_value = normalize_boolean(
                new_value
            )

            if not isinstance(
                disability_value,
                bool
            ):
                continue

        change = compare_value(
            db_field,
            old_value,
            new_value,
            evidence=evidence,
            confidence=confidence,
        )

        if change:

            changes.append(
                change
            )

    # =====================================================
    # AGE
    # =====================================================

    age = eligibility.get(
        "age"
    )

    if isinstance(age, dict):

        age_confidence = age.get(
            "confidence"
        )

        age_evidence = age.get(
            "evidence"
        )

        if is_safe_confidence(
            age_confidence
        ):

            min_age = age.get(
                "min"
            )

            max_age = age.get(
                "max"
            )

            if min_age is not None:

                change = compare_value(
                    "min_age",
                    current_scheme.get(
                        "min_age"
                    ),
                    min_age,
                    evidence=age_evidence,
                    confidence=age_confidence,
                )

                if change:
                    changes.append(
                        change
                    )

            if max_age is not None:

                change = compare_value(
                    "max_age",
                    current_scheme.get(
                        "max_age"
                    ),
                    max_age,
                    evidence=age_evidence,
                    confidence=age_confidence,
                )

                if change:
                    changes.append(
                        change
                    )

    # =====================================================
    # DISABILITY MINIMUM PERCENTAGE
    # =====================================================

    disability = eligibility.get(
        "disability"
    )

    if isinstance(disability, dict):

        confidence = disability.get(
            "confidence"
        )

        evidence = disability.get(
            "evidence"
        )

        min_disability_percentage = disability.get(
            "min_percentage"
        )

        if (
            is_safe_confidence(confidence)
            and min_disability_percentage is not None
        ):

            change = compare_value(
                "min_disability_percentage",
                current_scheme.get(
                    "min_disability_percentage"
                ),
                min_disability_percentage,
                evidence=evidence,
                confidence=confidence,
            )

            if change:
                changes.append(
                    change
                )

    # =====================================================
    # SCHOOL REQUIREMENT
    # =====================================================

    school_fact = eligibility.get(
        "school_requirement"
    )

    if isinstance(school_fact, dict):

        school_requirement = school_fact.get(
            "value"
        )

        evidence = school_fact.get(
            "evidence"
        )

        confidence = school_fact.get(
            "confidence"
        )

        if (
            school_requirement
            and is_safe_confidence(confidence)
        ):

            school_text = normalize(
                school_requirement
            )

            # -------------------------------------------------
            # Government school requirement
            # -------------------------------------------------

            if (
                "government school" in school_text
                or "government schools" in school_text
            ):

                change = compare_value(
                    "government_school_required",
                    current_scheme.get(
                        "government_school_required"
                    ),
                    1,
                    evidence=evidence,
                    confidence=confidence,
                )

                if change:
                    changes.append(
                        change
                    )

            # -------------------------------------------------
            # Classes VI-XII government school
            # -------------------------------------------------

            if (
                "vi to xii" in school_text
                or "6 to 12" in school_text
                or "classes vi to xii" in school_text
                or "classes 6 to 12" in school_text
                or "class vi to xii" in school_text
                or "class 6 to 12" in school_text
            ):

                change = compare_value(
                    "studied_classes_6_12_govt",
                    current_scheme.get(
                        "studied_classes_6_12_govt"
                    ),
                    1,
                    evidence=evidence,
                    confidence=confidence,
                )

                if change:
                    changes.append(
                        change
                    )

    # =====================================================
    # INSTITUTION REQUIREMENT
    # =====================================================

    institution_fact = eligibility.get(
        "institution_requirement"
    )

    if isinstance(institution_fact, dict):

        institution_requirement = institution_fact.get(
            "value"
        )

        evidence = institution_fact.get(
            "evidence"
        )

        confidence = institution_fact.get(
            "confidence"
        )

        if (
            institution_requirement
            and is_safe_confidence(confidence)
        ):

            institution_text = normalize(
                institution_requirement
            )

            if (
                "recognised" in institution_text
                or "recognized" in institution_text
            ):

                change = compare_value(
                    "recognized_institution_required",
                    current_scheme.get(
                        "recognized_institution_required"
                    ),
                    1,
                    evidence=evidence,
                    confidence=confidence,
                )

                if change:
                    changes.append(
                        change
                    )

    # =====================================================
    # BENEFIT
    # =====================================================

    benefit_fact = analyzed_scheme.get(
        "benefits"
    )

    if isinstance(benefit_fact, dict):

        new_benefit = benefit_fact.get(
            "value"
        )

        evidence = benefit_fact.get(
            "evidence"
        )

        confidence = benefit_fact.get(
            "confidence"
        )

        if (
            new_benefit
            and is_safe_confidence(confidence)
        ):

            change = compare_value(
                "benefit",
                current_scheme.get(
                    "benefit"
                ),
                new_benefit,
                evidence=evidence,
                confidence=confidence,
            )

            if change:
                changes.append(
                    change
                )

    # =====================================================
    # DOCUMENTS
    # =====================================================

    documents = analyzed_scheme.get(
        "documents"
    )

    changes.extend(
        process_documents(
            current_scheme,
            documents
        )
    )

    return changes


# =========================================================
# PRINT CHANGES
# =========================================================

def print_changes(changes):

    if not changes:

        print(
            "\n✅ No changes detected."
        )

        return

    print(
        "\n⚠️ Changes detected:"
    )

    print(
        "=" * 70
    )

    for change in changes:

        print(
            f"\nField: {change['field']}"
        )

        print(
            f"Old: {change['old_value']}"
        )

        print(
            f"New: {change['new_value']}"
        )

        if change.get("confidence"):

            print(
                f"Confidence: {change['confidence']}"
            )

        if change.get("evidence"):

            print(
                f"Evidence: {change['evidence']}"
            )

    print(
        "\n" + "=" * 70
    )


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    current_scheme = {

        "scheme_id":
            "SCH001",

        "name":
            "Tamil Pudhalvan Thittam",

        "gender":
            "Male",

        "government_school_required":
            1,

        "studied_classes_6_12_govt":
            1,

        "recognized_institution_required":
            1,

        "course":
            "Degree, Diploma, ITI",

        "benefit":
            "Rs. 1,000 per month",

        "aadhaar_required":
            0,

        "admission_proof_required":
            0,

        "bank_account_required":
            0,
    }

    analyzed_scheme = {

        "scheme_name":
            "Tamil Pudhalvan Thittam",

        "eligibility": {

            "age": {
                "min": None,
                "max": None,
                "evidence": None,
                "confidence": None
            },

            "gender": {
                "value":
                    "None",
                "evidence":
                   None,
                "confidence":
                    "medium"
            },

            "tn_resident": {
                "value": None,
                "evidence": None,
                "confidence": None
            },

            "community": {
                "value": None,
                "evidence": None,
                "confidence": None
            },

            "school_requirement": {
                "value":
                    "Studied Classes VI to XII in Government schools in Tamil Nadu",
                "evidence":
                    "Male students who studied Classes VI to XII in Government schools in Tamil Nadu.",
                "confidence":
                    "high"
            },

            "institution_requirement": {
                "value":
                    "Admitted to a recognised institution in Tamil Nadu",
                "evidence":
                    "Students must be admitted to a recognised institution in Tamil Nadu.",
                "confidence":
                    "high"
            },

            "course": {
                "value":
                    "Degree, Diploma, ITI or equivalent courses",
                "evidence":
                    "Eligible courses include Degree, Diploma, ITI or equivalent courses.",
                "confidence":
                    "high"
            },

            "programme": {
                "value": None,
                "evidence": None,
                "confidence": None
            },

            "academic_percentage": {
                "value": None,
                "type": None,
                "evidence": None,
                "confidence": None
            },

            "income": {
                "value": None,
                "type": None,
                "evidence": None,
                "confidence": None
            },

            "government_quota": {
                "value": None,
                "evidence": None,
                "confidence": None
            },

            "disability": {
                "value": None,
                "min_percentage": None,
                "evidence": None,
                "confidence": None
            },

            "other": [
                {
                    "value":
                        "Must be pursuing higher education",
                    "evidence":
                        "Students must be pursuing higher education.",
                    "confidence":
                        "high"
                }
            ]
        },

        "documents": [],

        "benefits": {
            "value":
                "Rs. 1,000 per month",
            "evidence":
                "The benefit is Rs. 1,000 per month.",
            "confidence":
                "high"
        },

        "application_information": {
            "value": None,
            "evidence": None,
            "confidence": None
        },

        "important_changes": []
    }

    print(
        "🔍 Comparing scheme information..."
    )

    changes = compare_scheme(
        current_scheme,
        analyzed_scheme
    )

    print_changes(
        changes
    )

    print(
        "\n📦 Raw change data:"
    )

    print(
        json.dumps(
            changes,
            indent=4,
            ensure_ascii=False
        )
    )
