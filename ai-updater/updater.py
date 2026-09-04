import os
import requests

from dotenv import load_dotenv


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

BACKEND_URL = os.getenv(
    "BACKEND_URL",
    "http://localhost:5000"
).rstrip("/")

AI_UPDATE_TOKEN = os.getenv(
    "AI_UPDATE_TOKEN"
)


# =========================================================
# FIELDS ALLOWED TO BE UPDATED
# =========================================================

ALLOWED_UPDATE_FIELDS = {
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
}


# =========================================================
# UPDATE SCHEME
# =========================================================

def update_scheme(scheme_id, changes):

    # -----------------------------------------------------
    # No changes
    # -----------------------------------------------------

    if not changes:

        print(
            "ℹ️ No changes to update."
        )

        return None

    # -----------------------------------------------------
    # Validate authentication token
    # -----------------------------------------------------

    if not AI_UPDATE_TOKEN:

        print(
            "❌ AI_UPDATE_TOKEN is missing from .env"
        )

        return None

    # -----------------------------------------------------
    # Validate scheme ID
    # -----------------------------------------------------

    if not scheme_id:

        print(
            "❌ Scheme ID is missing."
        )

        return None

    # =====================================================
    # BUILD SAFE UPDATE OBJECT
    # =====================================================

    update_data = {}

    for change in changes:

        if not isinstance(change, dict):

            continue

        field = change.get(
            "field"
        )

        new_value = change.get(
            "new_value"
        )

        # -------------------------------------------------
        # Ignore unknown fields
        # -------------------------------------------------

        if field not in ALLOWED_UPDATE_FIELDS:

            print(
                f"⚠️ Ignoring unauthorized field: {field}"
            )

            continue

        # -------------------------------------------------
        # Never send null values
        # -------------------------------------------------

        if new_value is None:

            continue

        update_data[field] = new_value

    # -----------------------------------------------------
    # Nothing safe to update
    # -----------------------------------------------------

    if not update_data:

        print(
            "ℹ️ Nothing safe to update."
        )

        return None

    # =====================================================
    # BACKEND ENDPOINT
    # =====================================================

    url = (
        f"{BACKEND_URL}"
        f"/api/scheme-management/"
        f"{scheme_id}"
    )

    # =====================================================
    # AUTHENTICATION
    # =====================================================

    headers = {

        "Content-Type":
            "application/json",

        "Authorization":
            f"Bearer {AI_UPDATE_TOKEN}"
    }

    # =====================================================
    # SHOW UPDATE PREVIEW
    # =====================================================

    print(
        "\n📦 Safe update payload:"
    )

    for field, value in update_data.items():

        print(
            f"   {field}: {value}"
        )

    # =====================================================
    # SEND UPDATE
    # =====================================================

    try:

        print(
            "\n📤 Sending changes to backend..."
        )

        response = requests.put(

            url,

            json=update_data,

            headers=headers,

            timeout=20
        )

        # =================================================
        # SUCCESS
        # =================================================

        if response.ok:

            print(
                "✅ Scheme updated successfully."
            )

            try:

                return response.json()

            except ValueError:

                return {
                    "success": True,
                    "message": response.text
                }

        # =================================================
        # AUTHENTICATION ERROR
        # =================================================

        if response.status_code == 401:

            print(
                "\n🔐 Authentication failed."
            )

            print(
                "Check AI_UPDATE_TOKEN."
            )

            return None

        # =================================================
        # FORBIDDEN
        # =================================================

        if response.status_code == 403:

            print(
                "\n🚫 Backend rejected the update."
            )

            print(
                "The AI updater is not authorized."
            )

            return None

        # =================================================
        # NOT FOUND
        # =================================================

        if response.status_code == 404:

            print(
                "\n❌ Scheme or endpoint not found."
            )

            print(
                f"URL: {url}"
            )

            return None

        # =================================================
        # OTHER BACKEND ERROR
        # =================================================

        print(
            "\n❌ Backend rejected update."
        )

        print(
            f"Status code: {response.status_code}"
        )

        print(
            f"Response: {response.text}"
        )

        return None

    # =====================================================
    # CONNECTION ERROR
    # =====================================================

    except requests.RequestException as error:

        print(
            "\n❌ Could not connect to backend."
        )

        print(
            error
        )

        return None


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    print(
        "ℹ️ updater.py loaded successfully."
    )

    print(
        "Backend URL:",
        BACKEND_URL
    )

    print(
        "Authentication token:",
        "configured"
        if AI_UPDATE_TOKEN
        else "missing"
    )

    print(
        "⚠️ No database update was performed."
    )
