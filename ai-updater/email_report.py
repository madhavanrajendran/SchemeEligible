import os
import html

import resend
from dotenv import load_dotenv


load_dotenv()


# =========================================================
# CONFIGURATION
# =========================================================

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
REPORT_EMAIL = os.getenv("REPORT_EMAIL")
REPORT_FROM_EMAIL = os.getenv("REPORT_FROM_EMAIL")


# =========================================================
# HELPERS
# =========================================================

def format_value(value):
    """Convert a value into safe, readable HTML text."""

    if value is None:
        return "Not specified"

    if isinstance(value, bool):
        return "Yes" if value else "No"

    if isinstance(value, (dict, list)):
        return html.escape(str(value))

    return html.escape(str(value))


def build_changes_html(updated_schemes):
    """Build the changes section of the email."""

    if not updated_schemes:
        return """
        <div class="empty">
            No scheme data changes were detected today.
        </div>
        """

    sections = []

    for scheme in updated_schemes:
        scheme_name = format_value(
            scheme.get("scheme", "Unknown Scheme")
        )

        changes = scheme.get("changes", [])

        change_rows = []

        for change in changes:
            field = format_value(
                change.get("field", "Unknown field")
            )

            old_value = format_value(
                change.get("old_value")
            )

            new_value = format_value(
                change.get("new_value")
            )

            confidence = format_value(
                change.get("confidence", "Not specified")
            )

            evidence = format_value(
                change.get("evidence", "Not available")
            )

            change_rows.append(
                f"""
                <div class="change">
                    <div class="field">{field}</div>

                    <div class="values">
                        <div class="old">
                            <span>Previous</span>
                            <strong>{old_value}</strong>
                        </div>

                        <div class="arrow">→</div>

                        <div class="new">
                            <span>New</span>
                            <strong>{new_value}</strong>
                        </div>
                    </div>

                    <div class="details">
                        <strong>Confidence:</strong> {confidence}
                    </div>

                    <div class="evidence">
                        <strong>Evidence:</strong><br>
                        {evidence}
                    </div>
                </div>
                """
            )

        sections.append(
            f"""
            <div class="scheme">
                <h3>{scheme_name}</h3>
                {''.join(change_rows)}
            </div>
            """
        )

    return "".join(sections)


def build_failures_html(failed_schemes):
    """Build the failures section of the email."""

    if not failed_schemes:
        return ""

    sections = []

    for failure in failed_schemes:
        scheme_name = format_value(
            failure.get("scheme", "Unknown Scheme")
        )

        reason = format_value(
            failure.get("reason", "Unknown error")
        )

        sections.append(
            f"""
            <div class="failure">
                <strong>{scheme_name}</strong>
                <p>{reason}</p>
            </div>
            """
        )

    return f"""
    <h2>Failed Schemes</h2>

    <div class="failure-section">
        {''.join(sections)}
    </div>
    """


# =========================================================
# EMAIL HTML
# =========================================================

def build_email_html(report):
    """Create the complete HTML email."""

    schemes_checked = report.get(
        "schemes_checked",
        0,
    )

    updated = report.get(
        "updated",
        [],
    )

    unchanged = report.get(
        "unchanged",
        0,
    )

    failed = report.get(
        "failed",
        [],
    )

    skipped = report.get(
        "skipped",
        0,
    )

    gemini_requests = report.get(
        "gemini_requests",
        0,
    )

    runtime = report.get(
        "runtime",
        0,
    )

    automatic_update = report.get(
        "automatic_update",
        False,
    )

    limit_reached = report.get(
        "limit_reached",
        False,
    )

    updated_count = len(updated)
    failed_count = len(failed)

    if failed_count > 0:
        status = "Completed with failures"
    elif updated_count > 0:
        status = f"{updated_count} scheme(s) updated"
    else:
        status = "No changes detected"

    changes_html = build_changes_html(updated)
    failures_html = build_failures_html(failed)

    return f"""
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<style>

body {{
    margin: 0;
    padding: 0;
    background: #f4f6f8;
    font-family: Arial, Helvetica, sans-serif;
    color: #1f2937;
}}

.container {{
    max-width: 720px;
    margin: 30px auto;
    background: #ffffff;
    border-radius: 14px;
    overflow: hidden;
}}

.header {{
    padding: 30px;
    border-bottom: 1px solid #e5e7eb;
}}

.header h1 {{
    margin: 0;
    font-size: 26px;
}}

.header p {{
    margin: 8px 0 0;
    color: #6b7280;
}}

.status {{
    margin-top: 20px;
    padding: 14px 16px;
    background: #f3f4f6;
    border-radius: 8px;
    font-weight: 600;
}}

.content {{
    padding: 30px;
}}

h2 {{
    margin: 0 0 18px;
    font-size: 20px;
}}

.summary {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 32px;
}}

.stat {{
    padding: 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
}}

.stat span {{
    display: block;
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 6px;
}}

.stat strong {{
    font-size: 22px;
}}

.scheme {{
    margin-bottom: 24px;
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
}}

.scheme h3 {{
    margin: 0 0 18px;
    font-size: 17px;
}}

.change {{
    margin-top: 14px;
    padding: 14px;
    background: #f9fafb;
    border-radius: 9px;
}}

.field {{
    font-weight: 600;
    margin-bottom: 12px;
}}

.values {{
    display: flex;
    align-items: center;
    gap: 12px;
}}

.values > div {{
    flex: 1;
}}

.values span {{
    display: block;
    font-size: 11px;
    color: #6b7280;
    margin-bottom: 4px;
}}

.old strong {{
    color: #6b7280;
}}

.new strong {{
    color: #111827;
}}

.arrow {{
    flex: 0 0 auto !important;
    font-size: 20px;
    color: #9ca3af;
}}

.details {{
    margin-top: 12px;
    font-size: 12px;
    color: #6b7280;
}}

.evidence {{
    margin-top: 10px;
    padding: 10px;
    background: #ffffff;
    border-radius: 7px;
    font-size: 12px;
    line-height: 1.5;
    color: #4b5563;
}}

.empty {{
    padding: 18px;
    background: #f9fafb;
    border-radius: 10px;
    color: #4b5563;
}}

.failure-section {{
    margin-top: 10px;
}}

.failure {{
    margin-bottom: 12px;
    padding: 14px;
    border: 1px solid #fecaca;
    background: #fef2f2;
    border-radius: 9px;
}}

.failure p {{
    margin: 6px 0 0;
    font-size: 13px;
}}

.info {{
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.6;
}}

.footer {{
    padding: 20px 30px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
}}

@media only screen and (max-width: 600px) {{
    .container {{
        margin: 0;
        border-radius: 0;
    }}

    .summary {{
        grid-template-columns: 1fr;
    }}

    .values {{
        flex-direction: column;
        align-items: stretch;
    }}

    .arrow {{
        text-align: center;
        transform: rotate(90deg);
    }}

}}

</style>

</head>

<body>

<div class="container">

    <div class="header">

        <h1>ThittamThunai</h1>

        <p>
            Daily AI Scheme Updater Report
        </p>

        <div class="status">
            {html.escape(status)}
        </div>

    </div>

    <div class="content">

        <h2>Run Summary</h2>

        <div class="summary">

            <div class="stat">
                <span>Schemes Checked</span>
                <strong>{schemes_checked}</strong>
            </div>

            <div class="stat">
                <span>Schemes Updated</span>
                <strong>{updated_count}</strong>
            </div>

            <div class="stat">
                <span>Unchanged</span>
                <strong>{unchanged}</strong>
            </div>

            <div class="stat">
                <span>Failed</span>
                <strong>{failed_count}</strong>
            </div>

            <div class="stat">
                <span>Skipped</span>
                <strong>{skipped}</strong>
            </div>

            <div class="stat">
                <span>Gemini Requests</span>
                <strong>{gemini_requests}</strong>
            </div>

        </div>

        <h2>Changes Detected</h2>

        {changes_html}

        {failures_html}

        <div class="info">

            <strong>Automatic database update:</strong>
            {"Enabled" if automatic_update else "Disabled"}

            <br>

            <strong>Gemini limit reached:</strong>
            {"Yes" if limit_reached else "No"}

            <br>

            <strong>Updater runtime:</strong>
            {runtime:.2f} seconds

        </div>

    </div>

    <div class="footer">

        Automatically generated by the
        ThittamThunai AI Scheme Updater.

    </div>

</div>

</body>

</html>
"""


# =========================================================
# SEND EMAIL
# =========================================================

def send_daily_report(report):
    """Send the daily updater report through Resend."""

    if not RESEND_API_KEY:
        print(
            "⚠️ RESEND_API_KEY is not configured. "
            "Email report skipped."
        )
        return False

    if not REPORT_EMAIL:
        print(
            "⚠️ REPORT_EMAIL is not configured. "
            "Email report skipped."
        )
        return False

    resend.api_key = RESEND_API_KEY

    updated_count = len(
        report.get("updated", [])
    )

    failed_count = len(
        report.get("failed", [])
    )

    if failed_count > 0:
        status = "Completed with failures"
    elif updated_count > 0:
        status = (
            f"{updated_count} Scheme(s) Updated"
        )
    else:
        status = "No Changes"

    subject = (
        f"ThittamThunai AI Updater — {status}"
    )

    html_content = build_email_html(report)

    try:
        resend.Emails.send(
            {
                "from": REPORT_FROM_EMAIL,
                "to": [REPORT_EMAIL],
                "subject": subject,
                "html": html_content,
            }
        )

        print(
            "📧 Daily report email sent successfully."
        )

        return True

    except Exception as error:
        print(
            f"⚠️ Failed to send daily report email: "
            f"{error}"
        )

        return False


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":
    print(
        "Email report module loaded successfully."
    )