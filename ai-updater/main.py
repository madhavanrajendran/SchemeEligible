import json
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

from scrapper import (
    scrape_page,
    get_content_hash,
    normalize_url,
    extract_scheme_content,
)
from analyzer import analyze_scheme
from comparison import compare_scheme, print_changes
from cache import has_content_changed, save_scheme_hash


# Configuration
BACKEND_URL = "http://localhost:5000"
MAX_GEMINI_REQUESTS = 20
MAX_SCRAPE_WORKERS = 5

# Keep disabled unless automatic database updates are intentionally required.
AUTO_UPDATE = False


def get_all_schemes():
    """Get all schemes from the backend."""

    url = f"{BACKEND_URL}/api/schemes"

    try:
        print("\nGetting schemes from backend...")

        response = requests.get(url, timeout=20)

        if not response.ok:
            print(f"Failed to get schemes. Status: {response.status_code}")
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
        print(f"Could not connect to backend: {error}")
        return []

    except ValueError as error:
        print(f"Backend returned invalid JSON: {error}")
        return []


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
            print(f"Scraping failed: {normalized_url}")
            return {
                "url": normalized_url,
                "text": None,
                "hash": None,
                "success": False,
            }

        content_hash = get_content_hash(scraped_text)

        if not content_hash:
            print(f"Could not generate hash: {normalized_url}")
            return {
                "url": normalized_url,
                "text": None,
                "hash": None,
                "success": False,
            }

        print(f"Scraping successful: {normalized_url}")

        return {
            "url": normalized_url,
            "text": scraped_text,
            "hash": content_hash,
            "success": True,
        }

    except Exception as error:
        print(f"Scraping error for {normalized_url}: {error}")

        return {
            "url": normalized_url,
            "text": None,
            "hash": None,
            "success": False,
        }


def scrape_all_unique_urls(schemes):
    """Scrape each unique source URL only once."""

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
        print(f"Duplicate URLs avoided: {len(schemes) - len(urls)}")

    results = {}

    with ThreadPoolExecutor(max_workers=MAX_SCRAPE_WORKERS) as executor:
        future_to_url = {
            executor.submit(scrape_unique_url, url): url
            for url in urls
        }

        for future in as_completed(future_to_url):
            url = future_to_url[future]

            try:
                results[url] = future.result()

            except Exception as error:
                print(f"Unexpected scraping error for {url}: {error}")

                results[url] = {
                    "url": url,
                    "text": None,
                    "hash": None,
                    "success": False,
                }

    successful = sum(
        1 for result in results.values()
        if result["success"]
    )

    print("\n" + "-" * 60)
    print("SCRAPING SUMMARY")
    print("-" * 60)
    print(f"Unique URLs : {len(urls)}")
    print(f"Successful  : {successful}")
    print(f"Failed      : {len(urls) - successful}")

    return results


def process_scheme(scheme, scraped_results, gemini_requests):
    """Process one scheme through cache, extraction, AI and comparison."""

    scheme_id = scheme.get("scheme_id")
    scheme_name = scheme.get("name")
    source_url = scheme.get("source_url")

    if not scheme_id:
        print("\nScheme skipped: missing scheme_id.")
        return "skipped", gemini_requests, False

    if not scheme_name:
        print(f"\nScheme {scheme_id} skipped: missing name.")
        return "skipped", gemini_requests, False

    if not source_url:
        print(f"\n{scheme_name} skipped: missing source_url.")
        return "skipped", gemini_requests, False

    normalized_url = normalize_url(source_url)

    print("\n" + "=" * 60)
    print(f"PROCESSING: {scheme_name}")
    print(f"Scheme ID: {scheme_id}")
    print(f"Source: {source_url}")
    print("=" * 60)

    scraped_result = scraped_results.get(normalized_url)

    if not scraped_result:
        print("No scraping result available.")
        return "failed", gemini_requests, False

    if not scraped_result["success"]:
        print("Scraping failed. Skipping scheme.")
        return "failed", gemini_requests, False

    scraped_text = scraped_result["text"]
    content_hash = scraped_result["hash"]

    if not has_content_changed(
        scheme_id,
        normalized_url,
        content_hash
    ):
        print("Website has not changed. Skipping AI analysis.")
        return "unchanged", gemini_requests, False

    print("New or changed webpage detected.")

    scheme_content = extract_scheme_content(
        scraped_text,
        scheme_name
    )

    if not scheme_content:
        print("Could not extract useful scheme information.")
        print("Cache will not be updated so it can be retried later.")
        return "failed", gemini_requests, False

    print(f"Scheme-specific content: {len(scheme_content)} characters")

    if gemini_requests >= MAX_GEMINI_REQUESTS:
        print("Gemini request limit reached.")
        return "limit", gemini_requests, True

    print("Sending scheme information to Gemini...")

    gemini_requests += 1

    analysis = analyze_scheme(
        scheme_name,
        scheme_content
    )

    if not analysis:
        print(f"AI analysis failed for {scheme_name}.")
        print("Cache will not be updated.")
        return "failed", gemini_requests, False

    print("AI analysis successful.")

    changes = compare_scheme(
        scheme,
        analysis
    )

    print_changes(changes)

    if changes:
        print(f"{len(changes)} change(s) detected.")

        if AUTO_UPDATE:
            print("Automatic update is enabled.")

            try:
                from updater import update_scheme

                result = update_scheme(
                    scheme_id,
                    changes
                )

                if not result:
                    print("Update failed.")
                    return "failed", gemini_requests, False

                print("Changes sent to backend.")

            except Exception as error:
                print(f"Updater error: {error}")
                return "failed", gemini_requests, False

        else:
            print("Automatic update is disabled.")
            print("Changes were detected but not written to the database.")

    else:
        print("Scheme is already up to date.")

    save_scheme_hash(
        scheme_id,
        normalized_url,
        content_hash
    )

    print("Webpage fingerprint saved.")

    return "analyzed", gemini_requests, False


def main():
    start_time = time.perf_counter()

    print("=" * 60)
    print("AI SCHEME UPDATER")
    print("=" * 60)
    print(f"Gemini request limit: {MAX_GEMINI_REQUESTS}")
    print(f"Scraping workers: {MAX_SCRAPE_WORKERS}")
    print(
        f"Automatic update: "
        f"{'ENABLED' if AUTO_UPDATE else 'DISABLED'}"
    )

    schemes = get_all_schemes()

    if not schemes:
        print("\nNo schemes found.")
        return

    print(f"\nFound {len(schemes)} scheme(s).")

    valid_schemes = []

    for scheme in schemes:
        scheme_id = scheme.get("scheme_id")
        scheme_name = scheme.get("name", scheme_id)
        source_url = scheme.get("source_url")

        if not scheme_id:
            print("Scheme skipped: missing scheme_id.")
            continue

        if not scheme_name:
            print(f"Scheme {scheme_id} skipped: missing name.")
            continue

        if not source_url:
            print(f"{scheme_name} skipped: missing source_url.")
            continue

        valid_schemes.append(scheme)

    if not valid_schemes:
        print("No valid schemes available.")
        return

    scraped_results = scrape_all_unique_urls(
        valid_schemes
    )

    successful = 0
    failed = 0
    changed = 0
    unchanged = 0
    skipped = 0
    gemini_requests = 0
    limit_reached = False

    for scheme in valid_schemes:
        try:
            status, gemini_requests, hit_limit = process_scheme(
                scheme,
                scraped_results,
                gemini_requests
            )

            if status == "analyzed":
                successful += 1
                changed += 1

            elif status == "unchanged":
                successful += 1
                unchanged += 1

            elif status == "failed":
                failed += 1

            elif status == "skipped":
                skipped += 1

            elif status == "limit":
                limit_reached = True

            if hit_limit:
                limit_reached = True

        except Exception as error:
            failed += 1

            scheme_name = scheme.get(
                "name",
                scheme.get("scheme_id", "Unknown Scheme")
            )

            print(
                f"\nError processing {scheme_name}: {error}"
            )

    elapsed_time = time.perf_counter() - start_time

    unique_url_count = len(scraped_results)

    successful_scrapes = sum(
        1 for result in scraped_results.values()
        if result["success"]
    )

    failed_scrapes = (
        unique_url_count - successful_scrapes
    )

    print("\n" + "=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)

    print(f"Total schemes found       : {len(schemes)}")
    print(f"Valid schemes processed   : {len(valid_schemes)}")
    print(f"Successfully processed    : {successful}")
    print(f"Changed / analyzed        : {changed}")
    print(f"Unchanged / AI skipped    : {unchanged}")
    print(f"Skipped                   : {skipped}")
    print(f"Failed                    : {failed}")

    print(
        f"Gemini requests used      : "
        f"{gemini_requests}/{MAX_GEMINI_REQUESTS}"
    )

    print(f"Unique URLs scraped       : {unique_url_count}")
    print(f"Successful unique scrapes : {successful_scrapes}")
    print(f"Failed unique scrapes     : {failed_scrapes}")

    print(
        f"Gemini limit reached      : "
        f"{'YES' if limit_reached else 'NO'}"
    )

    print(
        f"Automatic update          : "
        f"{'ENABLED' if AUTO_UPDATE else 'DISABLED'}"
    )

    print(f"Total runtime             : {elapsed_time:.2f} seconds")

    print("=" * 60)


if __name__ == "__main__":
    main()