import json
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
from dotenv import load_dotenv

from scrapper import (
    scrape_page,
    get_content_hash,
    normalize_url,
    extract_scheme_content,
)

from analyzer import analyze_scheme
from comparison import compare_scheme, print_changes
from cache import has_content_changed, save_scheme_hash


load_dotenv()


# =========================================================
# CONFIGURATION
# =========================================================

BACKEND_URL = os.getenv(
    "BACKEND_URL",
)

MAX_GEMINI_REQUESTS = 20
MAX_SCRAPE_WORKERS = 5

# Keep disabled unless automatic database updates are intentionally required.
AUTO_UPDATE = True

# =========================================================
# FALLBACK SOURCE URLS
# =========================================================
# These are used only when a scheme's database source_url
# cannot be scraped. They are official Government of Tamil
# Nadu sources selected for the affected schemes.
#
# The database remains the source of the primary URL.
# Fallbacks are intentionally kept here so no DB changes
# are required.
#
# IMPORTANT:
# - SCH003-SCH006 use the official Differently Abled
#   Welfare Department special education page.
# - SCH008 uses the official Welfare Board page.
# - SCH013-SCH020 use the official IT Department e-District
#   page.
# - SCH024 uses an official 2025 DIPR page containing
#   information about the scheme.
FALLBACK_URLS = {
    "SCH003": [
        "https://www.scd.tn.gov.in/specialedu.php",
    ],
    "SCH004": [
        "https://www.scd.tn.gov.in/specialedu.php",
    ],
    "SCH005": [
        "https://www.scd.tn.gov.in/specialedu.php",
    ],
    "SCH006": [
        "https://www.scd.tn.gov.in/specialedu.php",
    ],
    "SCH008": [
        "https://www.scd.tn.gov.in/tn_welfare.php",
    ],
    "SCH013": [
        "https://it.tn.gov.in/en/TNEGA/e-District",
    ],
    "SCH014": [
        "https://it.tn.gov.in/en/TNEGA/e-District",
    ],
    "SCH015": [
        "https://it.tn.gov.in/en/TNEGA/e-District",
    ],
    "SCH016": [
        "https://it.tn.gov.in/en/TNEGA/e-District",
    ],
    "SCH018": [
        "https://it.tn.gov.in/en/TNEGA/e-District",
    ],
    "SCH019": [
        "https://it.tn.gov.in/en/TNEGA/e-District",
    ],
    "SCH020": [
        "https://it.tn.gov.in/en/TNEGA/e-District",
    ],
    "SCH024": [
        "https://dipr.tn.gov.in/ords/r/dipr/info-prdept103/press-release1?cs=1NDdLYMxraFjtkzHQk3MjQkPKm23iLkvwoJ6fnxhrJyggAsb91l6hLpoijjVtvLoX0llW0atwfd7G_0MS3v2prQ&p33_file_id=14641&request=APPLICATION_PROCESS%3DGET_FILE&session=725425116646127",
    ],
}


# =========================================================
# BACKEND
# =========================================================

def get_all_schemes():
    """Get all schemes from the backend."""

    url = f"{BACKEND_URL}/api/schemes"

    try:
        print("\nGetting schemes from backend...")

        response = requests.get(url, timeout=20)

        if not response.ok:
            print(
                f"Failed to get schemes. "
                f"Status: {response.status_code}"
            )
            print(f"Response: {response.text}")
            return []

        data = response.json()

        if isinstance(data, list):
            return data

        if isinstance(data, dict):
            if isinstance(data.get("schemes"), list):
                return data["schemes"]

            if isinstance(data.get("data"), list):
                return data["data"]

        print("Unexpected backend response format.")
        return []

    except requests.RequestException as error:
        print(
            f"Could not connect to backend: {error}"
        )
        return []

    except ValueError as error:
        print(
            f"Backend returned invalid JSON: {error}"
        )
        return []


# =========================================================
# SCRAPING
# =========================================================

def scrape_unique_url(url):
    """Scrape one normalized URL and generate its content hash."""

    normalized_url = normalize_url(url)

    if not normalized_url:
        return {
            "url": url,
            "text": None,
            "hash": None,
            "success": False,
        }

    try:
        print(f"\nScraping: {normalized_url}")

        scraped_text = scrape_page(normalized_url)

        if not scraped_text:
            print(
                f"Scraping failed: {normalized_url}"
            )

            return {
                "url": normalized_url,
                "text": None,
                "hash": None,
                "success": False,
            }

        content_hash = get_content_hash(scraped_text)

        if not content_hash:
            print(
                f"Could not generate hash: "
                f"{normalized_url}"
            )

            return {
                "url": normalized_url,
                "text": None,
                "hash": None,
                "success": False,
            }

        print(
            f"Scraping successful: "
            f"{normalized_url}"
        )

        return {
            "url": normalized_url,
            "text": scraped_text,
            "hash": content_hash,
            "success": True,
        }

    except Exception as error:
        print(
            f"Scraping error for "
            f"{normalized_url}: {error}"
        )

        return {
            "url": normalized_url,
            "text": None,
            "hash": None,
            "success": False,
        }


def scrape_all_unique_urls(schemes):
    """
    Scrape each unique primary URL only once.

    If a scheme's primary source cannot be scraped, its
    configured fallback URLs are tried in order.

    The returned result is keyed by the scheme's primary
    normalized URL so the rest of the updater remains
    compatible with the existing database/API structure.
    """

    # -----------------------------------------------------
    # Build primary URL list
    # -----------------------------------------------------

    unique_urls = set()

    for scheme in schemes:
        source_url = scheme.get("source_url")

        if not source_url:
            continue

        normalized_url = normalize_url(source_url)

        if normalized_url:
            unique_urls.add(normalized_url)

    urls = list(unique_urls)

    print("\n" + "=" * 60)
    print("WEBPAGE SCRAPING")
    print("=" * 60)

    print(f"Schemes: {len(schemes)}")
    print(f"Unique URLs: {len(urls)}")
    print(f"Workers: {MAX_SCRAPE_WORKERS}")

    if len(urls) < len(schemes):
        print(
            f"Duplicate URLs avoided: "
            f"{len(schemes) - len(urls)}"
        )

    # -----------------------------------------------------
    # Scrape primary URLs
    # -----------------------------------------------------

    results = {}

    with ThreadPoolExecutor(
        max_workers=MAX_SCRAPE_WORKERS
    ) as executor:

        future_to_url = {
            executor.submit(
                scrape_unique_url,
                url,
            ): url
            for url in urls
        }

        for future in as_completed(future_to_url):
            url = future_to_url[future]

            try:
                results[url] = future.result()

            except Exception as error:
                print(
                    f"Unexpected scraping error "
                    f"for {url}: {error}"
                )

                results[url] = {
                    "url": url,
                    "text": None,
                    "hash": None,
                    "success": False,
                }

    # -----------------------------------------------------
    # Fallback scraping
    # -----------------------------------------------------
    # Only try a fallback when the primary URL failed.
    # Fallbacks are deduplicated and scraped only once.
    # -----------------------------------------------------

    fallback_candidates = {}

    for scheme in schemes:
        scheme_id = scheme.get("scheme_id")
        source_url = scheme.get("source_url")

        if not scheme_id or not source_url:
            continue

        primary_url = normalize_url(source_url)

        if not primary_url:
            continue

        primary_result = results.get(primary_url)

        if primary_result and primary_result.get("success"):
            continue

        fallback_urls = FALLBACK_URLS.get(scheme_id, [])

        if not fallback_urls:
            continue

        for fallback_url in fallback_urls:
            normalized_fallback = normalize_url(fallback_url)

            if not normalized_fallback:
                continue

            if normalized_fallback == primary_url:
                continue

            fallback_candidates.setdefault(
                normalized_fallback,
                set(),
            ).add(scheme_id)

    if fallback_candidates:
        print("\n" + "-" * 60)
        print("FALLBACK SOURCE SCRAPING")
        print("-" * 60)

        for fallback_url, scheme_ids in fallback_candidates.items():
            print(
                f"Fallback: {fallback_url} "
                f"(schemes: {', '.join(sorted(scheme_ids))})"
            )

        with ThreadPoolExecutor(
            max_workers=MAX_SCRAPE_WORKERS
        ) as executor:

            future_to_fallback = {
                executor.submit(
                    scrape_unique_url,
                    fallback_url,
                ): fallback_url
                for fallback_url in fallback_candidates
            }

            fallback_results = {}

            for future in as_completed(future_to_fallback):
                fallback_url = future_to_fallback[future]

                try:
                    fallback_results[fallback_url] = (
                        future.result()
                    )

                except Exception as error:
                    print(
                        f"Unexpected fallback scraping error "
                        f"for {fallback_url}: {error}"
                    )

                    fallback_results[fallback_url] = {
                        "url": fallback_url,
                        "text": None,
                        "hash": None,
                        "success": False,
                    }

        # -------------------------------------------------
        # Attach the first successful fallback to each
        # affected primary source result.
        # -------------------------------------------------

        for scheme in schemes:
            scheme_id = scheme.get("scheme_id")
            source_url = scheme.get("source_url")

            if not scheme_id or not source_url:
                continue

            primary_url = normalize_url(source_url)

            if not primary_url:
                continue

            primary_result = results.get(primary_url)

            if primary_result and primary_result.get("success"):
                continue

            fallback_urls = FALLBACK_URLS.get(scheme_id, [])

            for fallback_url in fallback_urls:
                normalized_fallback = normalize_url(
                    fallback_url
                )

                if not normalized_fallback:
                    continue

                fallback_result = fallback_results.get(
                    normalized_fallback
                )

                if (
                    fallback_result
                    and fallback_result.get("success")
                ):
                    results[primary_url] = {
                        "url": primary_url,
                        "text": fallback_result["text"],
                        "hash": fallback_result["hash"],
                        "success": True,
                        "used_fallback": True,
                        "fallback_url": normalized_fallback,
                    }

                    print(
                        f"\nFallback successful for "
                        f"{scheme_id}:"
                    )
                    print(
                        f"  Primary : {primary_url}"
                    )
                    print(
                        f"  Fallback: {normalized_fallback}"
                    )

                    break

    # -----------------------------------------------------
    # Summary
    # -----------------------------------------------------

    successful = sum(
        1
        for result in results.values()
        if result["success"]
    )

    fallback_used = sum(
        1
        for result in results.values()
        if result.get("success")
        and result.get("used_fallback")
    )

    print("\n" + "-" * 60)
    print("SCRAPING SUMMARY")
    print("-" * 60)

    print(f"Unique primary URLs : {len(urls)}")
    print(f"Successful          : {successful}")
    print(f"Failed              : {len(urls) - successful}")
    print(f"Fallbacks used      : {fallback_used}")

    return results


# =========================================================
# SCHEME PROCESSING
# =========================================================

def process_scheme(
    scheme,
    scraped_results,
    gemini_requests,
):
    """
    Process one scheme through cache, extraction,
    AI analysis and comparison.

    Returns:
        status,
        gemini_requests,
        hit_limit,
        changes,
        reason
    """

    scheme_id = scheme.get("scheme_id")
    scheme_name = scheme.get("name")
    source_url = scheme.get("source_url")

    # -----------------------------------------------------
    # Validate scheme
    # -----------------------------------------------------

    if not scheme_id:
        print("\nScheme skipped: missing scheme_id.")

        return (
            "skipped",
            gemini_requests,
            False,
            [],
            "Missing scheme_id.",
        )

    if not scheme_name:
        print(
            f"\nScheme {scheme_id} skipped: "
            f"missing name."
        )

        return (
            "skipped",
            gemini_requests,
            False,
            [],
            "Missing scheme name.",
        )

    if not source_url:
        print(
            f"\n{scheme_name} skipped: "
            f"missing source_url."
        )

        return (
            "skipped",
            gemini_requests,
            False,
            [],
            "Missing source_url.",
        )

    normalized_url = normalize_url(source_url)

    print("\n" + "=" * 60)
    print(f"PROCESSING: {scheme_name}")
    print(f"Scheme ID: {scheme_id}")
    print(f"Source: {source_url}")
    print("=" * 60)

    # -----------------------------------------------------
    # Get scraping result
    # -----------------------------------------------------

    scraped_result = scraped_results.get(
        normalized_url
    )

    if not scraped_result:
        print("No scraping result available.")

        return (
            "source_unavailable",
            gemini_requests,
            False,
            [],
            "No scraping result available.",
        )

    # -----------------------------------------------------
    # IMPORTANT:
    # Scraping failure is NOT a processing failure.
    # -----------------------------------------------------

    if not scraped_result["success"]:
        print(
            "Source website could not be scraped."
        )

        print(
            "Skipping scheme without marking "
            "it as a processing failure."
        )

        return (
            "source_unavailable",
            gemini_requests,
            False,
            [],
            "Source website could not be scraped "
            "or was unreachable.",
        )

    scraped_text = scraped_result["text"]
    content_hash = scraped_result["hash"]

    if scraped_result.get("used_fallback"):
        print(
            "Primary source was unavailable."
        )
        print(
            f"Using fallback source: "
            f"{scraped_result.get('fallback_url')}"
        )

    # -----------------------------------------------------
    # Check cache
    # -----------------------------------------------------

    if not has_content_changed(
        scheme_id,
        normalized_url,
        content_hash,
    ):
        print(
            "Website has not changed. "
            "Skipping AI analysis."
        )

        return (
            "unchanged",
            gemini_requests,
            False,
            [],
            None,
        )

    print(
        "New or changed webpage detected."
    )

    # -----------------------------------------------------
    # Extract scheme-specific content
    # -----------------------------------------------------

    scheme_content = extract_scheme_content(
        scraped_text,
        scheme_name,
    )

    if not scheme_content:
        print(
            "Could not extract useful "
            "scheme information."
        )

        print(
            "Cache will not be updated so "
            "it can be retried later."
        )

        return (
            "failed",
            gemini_requests,
            False,
            [],
            "Could not extract useful "
            "scheme information.",
        )

    print(
        f"Scheme-specific content: "
        f"{len(scheme_content)} characters"
    )

    # -----------------------------------------------------
    # Gemini request limit
    # -----------------------------------------------------

    if gemini_requests >= MAX_GEMINI_REQUESTS:
        print(
            "Gemini request limit reached."
        )

        return (
            "limit",
            gemini_requests,
            True,
            [],
            "Gemini request limit reached.",
        )

    # -----------------------------------------------------
    # Gemini analysis
    # -----------------------------------------------------

    print(
        "Sending scheme information to Gemini..."
    )

    gemini_requests += 1

    analysis = analyze_scheme(
        scheme_name,
        scheme_content,
    )

    if not analysis:
        print(
            f"AI analysis failed for "
            f"{scheme_name}."
        )

        print(
            "Cache will not be updated."
        )

        return (
            "failed",
            gemini_requests,
            False,
            [],
            "AI analysis failed.",
        )

    print(
        "AI analysis successful."
    )

    # -----------------------------------------------------
    # Compare current data with AI result
    # -----------------------------------------------------

    changes = compare_scheme(
        scheme,
        analysis,
    )

    print_changes(changes)

    # -----------------------------------------------------
    # Handle changes
    # -----------------------------------------------------

    if changes:
        print(
            f"{len(changes)} change(s) detected."
        )

        if AUTO_UPDATE:
            print(
                "Automatic update is enabled."
            )

            try:
                from updater import update_scheme

                result = update_scheme(
                    scheme_id,
                    changes,
                )

                if not result:
                    print(
                        "Update failed."
                    )

                    return (
                        "failed",
                        gemini_requests,
                        False,
                        changes,
                        "Backend database update failed.",
                    )

                print(
                    "Changes sent to backend."
                )

            except Exception as error:
                print(
                    f"Updater error: {error}"
                )

                return (
                    "failed",
                    gemini_requests,
                    False,
                    changes,
                    f"Updater error: {error}",
                )

        else:
            print(
                "Automatic update is disabled."
            )

            print(
                "Changes were detected but "
                "not written to the database."
            )

    else:
        print(
            "Scheme is already up to date."
        )

    # -----------------------------------------------------
    # Save content hash
    # -----------------------------------------------------

    save_scheme_hash(
        scheme_id,
        normalized_url,
        content_hash,
    )

    print(
        "Webpage fingerprint saved."
    )

    # -----------------------------------------------------
    # Final status
    # -----------------------------------------------------

    if changes:
        return (
            "changed",
            gemini_requests,
            False,
            changes,
            None,
        )

    return (
        "analyzed",
        gemini_requests,
        False,
        [],
        None,
    )


# =========================================================
# EMAIL REPORT
# =========================================================

def send_report(report):
    """Send the final updater report through email_report.py."""

    try:
        from email_report import send_daily_report

        send_daily_report(report)

    except ImportError:
        print(
            "\n⚠️ email_report.py not found. "
            "Email report was skipped."
        )

    except Exception as error:
        print(
            f"\n⚠️ Email report could not be sent: "
            f"{error}"
        )


# =========================================================
# MAIN
# =========================================================

def main():
    start_time = time.perf_counter()

    print("=" * 60)
    print("AI SCHEME UPDATER")
    print("=" * 60)

    print(
        f"Gemini request limit: "
        f"{MAX_GEMINI_REQUESTS}"
    )

    print(
        f"Scraping workers: "
        f"{MAX_SCRAPE_WORKERS}"
    )

    print(
        f"Automatic update: "
        f"{'ENABLED' if AUTO_UPDATE else 'DISABLED'}"
    )

    # -----------------------------------------------------
    # Get schemes
    # -----------------------------------------------------

    schemes = get_all_schemes()

    if not schemes:
        print("\nNo schemes found.")

        send_report({
            "schemes_checked": 0,
            "updated": [],
            "unchanged": 0,
            "source_unavailable": [],
            "failed": [],
            "skipped": 0,
            "gemini_requests": 0,
            "runtime": 0,
            "automatic_update": AUTO_UPDATE,
            "limit_reached": False,
        })

        return

    print(
        f"\nFound {len(schemes)} scheme(s)."
    )

    # -----------------------------------------------------
    # Validate schemes
    # -----------------------------------------------------

    valid_schemes = []

    for scheme in schemes:
        scheme_id = scheme.get("scheme_id")

        scheme_name = scheme.get(
            "name",
            scheme_id,
        )

        source_url = scheme.get(
            "source_url"
        )

        if not scheme_id:
            print(
                "Scheme skipped: "
                "missing scheme_id."
            )
            continue

        if not scheme_name:
            print(
                f"Scheme {scheme_id} skipped: "
                f"missing name."
            )
            continue

        if not source_url:
            print(
                f"{scheme_name} skipped: "
                f"missing source_url."
            )
            continue

        valid_schemes.append(scheme)

    if not valid_schemes:
        print(
            "No valid schemes available."
        )

        send_report({
            "schemes_checked": len(schemes),
            "updated": [],
            "unchanged": 0,
            "source_unavailable": [],
            "failed": [],
            "skipped": len(schemes),
            "gemini_requests": 0,
            "runtime": 0,
            "automatic_update": AUTO_UPDATE,
            "limit_reached": False,
        })

        return

    # -----------------------------------------------------
    # Scrape unique URLs
    # -----------------------------------------------------

    scraped_results = scrape_all_unique_urls(
        valid_schemes
    )

    # -----------------------------------------------------
    # Counters
    # -----------------------------------------------------

    successful = 0
    failed = 0
    changed = 0
    unchanged = 0
    source_unavailable = 0
    skipped = 0

    gemini_requests = 0
    limit_reached = False

    # -----------------------------------------------------
    # Data collected for email report
    # -----------------------------------------------------

    updated_schemes = []
    failed_schemes = []
    unavailable_schemes = []

    # -----------------------------------------------------
    # Process schemes
    # -----------------------------------------------------

    for scheme in valid_schemes:

        scheme_name = scheme.get(
            "name",
            scheme.get(
                "scheme_id",
                "Unknown Scheme",
            ),
        )

        try:

            (
                status,
                gemini_requests,
                hit_limit,
                changes,
                reason,
            ) = process_scheme(
                scheme,
                scraped_results,
                gemini_requests,
            )

            # -------------------------------------------------
            # Scheme changed and updated
            # -------------------------------------------------

            if status == "changed":

                successful += 1
                changed += 1

                updated_schemes.append({
                    "scheme": scheme_name,
                    "scheme_id": scheme.get(
                        "scheme_id"
                    ),
                    "changes": changes,
                })

            # -------------------------------------------------
            # Scheme analyzed but no changes
            # -------------------------------------------------

            elif status == "analyzed":

                successful += 1

            # -------------------------------------------------
            # Website unchanged
            # -------------------------------------------------

            elif status == "unchanged":

                successful += 1
                unchanged += 1

            # -------------------------------------------------
            # Source unavailable
            # -------------------------------------------------

            elif status == "source_unavailable":

                source_unavailable += 1

                unavailable_schemes.append({
                    "scheme": scheme_name,
                    "scheme_id": scheme.get(
                        "scheme_id"
                    ),
                    "source_url": scheme.get(
                        "source_url"
                    ),
                    "reason": reason or (
                        "Source website could not "
                        "be reached."
                    ),
                })

            # -------------------------------------------------
            # Genuine processing failure
            # -------------------------------------------------

            elif status == "failed":

                failed += 1

                failed_schemes.append({
                    "scheme": scheme_name,
                    "scheme_id": scheme.get(
                        "scheme_id"
                    ),
                    "reason": reason or (
                        "Processing failed."
                    ),
                })

                # If changes were detected but the
                # backend update failed, preserve them
                # in the email report.

                if changes:

                    updated_schemes.append({
                        "scheme": scheme_name,
                        "scheme_id": scheme.get(
                            "scheme_id"
                        ),
                        "changes": changes,
                    })

            # -------------------------------------------------
            # Skipped
            # -------------------------------------------------

            elif status == "skipped":

                skipped += 1

            # -------------------------------------------------
            # Gemini limit
            # -------------------------------------------------

            elif status == "limit":

                limit_reached = True

                failed_schemes.append({
                    "scheme": scheme_name,
                    "scheme_id": scheme.get(
                        "scheme_id"
                    ),
                    "reason": reason or (
                        "Gemini request limit reached."
                    ),
                })

            # -------------------------------------------------
            # Check limit flag
            # -------------------------------------------------

            if hit_limit:
                limit_reached = True

        except Exception as error:

            failed += 1

            failed_schemes.append({
                "scheme": scheme_name,
                "scheme_id": scheme.get(
                    "scheme_id"
                ),
                "reason": str(error),
            })

            print(
                f"\nError processing "
                f"{scheme_name}: {error}"
            )

    # -----------------------------------------------------
    # Runtime
    # -----------------------------------------------------

    elapsed_time = (
        time.perf_counter()
        - start_time
    )

    # -----------------------------------------------------
    # Scraping statistics
    # -----------------------------------------------------

    unique_url_count = len(
        scraped_results
    )

    successful_scrapes = sum(
        1
        for result in scraped_results.values()
        if result["success"]
    )

    failed_scrapes = (
        unique_url_count
        - successful_scrapes
    )

    # -----------------------------------------------------
    # FINAL SUMMARY
    # -----------------------------------------------------

    print("\n" + "=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)

    print(
        f"Total schemes found       : "
        f"{len(schemes)}"
    )

    print(
        f"Valid schemes processed   : "
        f"{len(valid_schemes)}"
    )

    print(
        f"Successfully processed    : "
        f"{successful}"
    )

    print(
        f"Changed                   : "
        f"{changed}"
    )

    print(
        f"Unchanged                 : "
        f"{unchanged}"
    )

    print(
        f"Source unavailable        : "
        f"{source_unavailable}"
    )

    print(
        f"Skipped                   : "
        f"{skipped}"
    )

    print(
        f"Failed                    : "
        f"{failed}"
    )

    print(
        f"Gemini requests used      : "
        f"{gemini_requests}/"
        f"{MAX_GEMINI_REQUESTS}"
    )

    print(
        f"Unique URLs scraped       : "
        f"{unique_url_count}"
    )

    print(
        f"Successful unique scrapes : "
        f"{successful_scrapes}"
    )

    print(
        f"Failed unique scrapes     : "
        f"{failed_scrapes}"
    )

    print(
        f"Gemini limit reached      : "
        f"{'YES' if limit_reached else 'NO'}"
    )

    print(
        f"Automatic update          : "
        f"{'ENABLED' if AUTO_UPDATE else 'DISABLED'}"
    )

    print(
        f"Total runtime             : "
        f"{elapsed_time:.2f} seconds"
    )

    print("=" * 60)

    # -----------------------------------------------------
    # EMAIL REPORT
    # -----------------------------------------------------

    report = {
        "schemes_checked": len(valid_schemes),
        "updated": updated_schemes,
        "unchanged": unchanged,
        "source_unavailable": unavailable_schemes,
        "failed": failed_schemes,
        "skipped": skipped,
        "gemini_requests": gemini_requests,
        "runtime": elapsed_time,
        "automatic_update": AUTO_UPDATE,
        "limit_reached": limit_reached,
    }

    send_report(report)


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":
    main()