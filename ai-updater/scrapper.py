
import hashlib
import re
import requests
import certifi
import urllib3
from bs4 import BeautifulSoup
import sys

if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 "
    "Chrome/139.0.0.0 Safari/537.36"
)

REQUEST_TIMEOUT = 20

MAX_EXTRACTED_CHARACTERS = 12000

MAX_SECTION_LINES = 100


SSL_FALLBACK_DOMAINS = {
    "bcmbcmw.tn.gov.in",
    "www.bcmbcmw.tn.gov.in",
    "scd.tn.gov.in",
    "www.scd.tn.gov.in",
    "tndce.tn.gov.in"
}


urllib3.disable_warnings(
    urllib3.exceptions.InsecureRequestWarning
)


def scrape_page(url):
    """
    Fetch a webpage and return clean readable text.

    Normal websites:
        SSL certificate verification is enabled.

    Known official Tamil Nadu domains:
        If normal SSL verification fails, a controlled
        fallback request is attempted.

    Duplicate URL handling and concurrent scraping are
    handled by main.py.
    """

    if not url:
        return None


    try:

        response = requests.get(
            url,
            timeout=REQUEST_TIMEOUT,
            headers={
                "User-Agent": USER_AGENT
            },
            verify=certifi.where(),
        )

        response.raise_for_status()

        return parse_webpage(
            response.text
        )

    except requests.exceptions.SSLError as error:

        print(
            "⚠️ SSL certificate verification failed."
        )

        print(
            f"URL: {url}"
        )

        print(
            f"Error: {error}"
        )


        if is_allowed_ssl_fallback(url):

            print(
                "🔄 Trying approved SSL fallback "
                "for official Tamil Nadu source..."
            )

            return scrape_with_ssl_fallback(
                url
            )

        print(
            "❌ SSL fallback is not allowed for this domain."
        )

        return None

    except requests.RequestException as error:

        print(
            "❌ Failed to fetch webpage:"
        )

        print(
            f"URL: {url}"
        )

        print(
            f"Error: {error}"
        )

        return None

    except Exception as error:

        print(
            "❌ Unexpected scraping error:"
        )

        print(
            f"URL: {url}"
        )

        print(
            f"Error: {error}"
        )

        return None


def is_allowed_ssl_fallback(url):
    """
    Return True only for explicitly approved official
    Tamil Nadu government domains.
    """

    try:

        from urllib.parse import urlparse

        hostname = urlparse(
            url
        ).hostname

        if not hostname:
            return False

        hostname = hostname.lower()

        return hostname in SSL_FALLBACK_DOMAINS

    except Exception:

        return False


def scrape_with_ssl_fallback(url):
    """
    Controlled fallback for the specific official Tamil Nadu
    domains listed in SSL_FALLBACK_DOMAINS.

    This is NOT used globally.

    The fallback is necessary because the local Python
    environment cannot currently validate the certificate
    chain of these government domains.
    """

    try:

        response = requests.get(
            url,
            timeout=REQUEST_TIMEOUT,
            headers={
                "User-Agent": USER_AGENT
            },
            verify=False,
        )

        response.raise_for_status()

        print(
            "✅ Approved SSL fallback scrape successful."
        )

        return parse_webpage(
            response.text
        )

    except requests.RequestException as error:

        print(
            "❌ SSL fallback request failed:"
        )

        print(
            f"URL: {url}"
        )

        print(
            f"Error: {error}"
        )

        return None

    except Exception as error:

        print(
            "❌ Unexpected SSL fallback error:"
        )

        print(
            f"URL: {url}"
        )

        print(
            f"Error: {error}"
        )

        return None


def parse_webpage(html):
    """
    Convert HTML into clean readable text.
    """

    if not html:
        return None

    try:

        soup = BeautifulSoup(
            html,
            "html.parser"
        )


        unwanted_tags = [
            "script",
            "style",
            "noscript",
            "header",
            "footer",
            "nav",
            "aside",
        ]

        for tag in soup(
            unwanted_tags
        ):

            tag.decompose()


        text = soup.get_text(
            separator="\n",
            strip=True
        )


        lines = []

        for line in text.splitlines():

            line = " ".join(
                line.split()
            )

            if line:

                lines.append(
                    line
                )

        clean_text = "\n".join(
            lines
        )

        return clean_text

    except Exception as error:

        print(
            "❌ Failed to parse webpage:"
        )

        print(
            f"Error: {error}"
        )

        return None


def normalize_text(text):
    """
    Normalize text for safer matching.
    """

    if not text:
        return ""

    text = text.lower()

    text = re.sub(
        r"[^\w\s]",
        " ",
        text,
        flags=re.UNICODE
    )

    text = " ".join(
        text.split()
    )

    return text


SCHEME_ALIASES = {


    "pudhumai penn": [
        "pudhumai penn",
        "pudhumai penn thittam",
        "moovalur ramamirtham ammaiyar pudhumai penn",
        "moovalur ramamirtham ammaiyar pudhumai penn thittam",
    ],

    "pudhumai penn thittam": [
        "pudhumai penn",
        "pudhumai penn thittam",
        "moovalur ramamirtham ammaiyar pudhumai penn",
        "moovalur ramamirtham ammaiyar pudhumai penn thittam",
    ],


    "tamil pudhalvan": [
        "tamil pudhalvan",
        "tamil pudhalvan thittam",
    ],

    "tamil pudhalvan thittam": [
        "tamil pudhalvan",
        "tamil pudhalvan thittam",
    ],


    "differently abled scholarship – classes 1–5": [
        "scholarship for differently abled students towards purchase of books and note books tamil nadu",
    ],

    "differently abled scholarship – classes 6–8": [
        "scholarship for differently abled students towards purchase of books and note books tamil nadu",
    ],

    "differently abled scholarship – classes 9–12": [
        "scholarship for differently abled students from class 9th onwards tamil nadu",
    ],

    "differently abled scholarship – degree/pg/professional": [
        "scholarship for differently abled students from class 9th onwards tamil nadu",
    ],

    "scholarship to sons/daughters of differently abled persons": [
        "scholarship to son and daughter of differently abled persons tamil nadu",
    ],


    "minority pre-matric scholarship": [
        "pre matric scholarship",
        "pre-matric scholarship",
        "pre matric scholarship scheme",
        "pre-matric scholarship scheme",
    ],

    "minority post-matric scholarship": [
        "post matric scholarship",
        "post-matric scholarship",
        "post matric scholarship scheme",
        "post-matric scholarship scheme",
    ],


    "readers allowance – visually impaired students": [
        "readers allowance",
        "reader allowance",
        "readers allowance to visually impaired students",
        "reader allowance to visually impaired students",
    ],
}


def get_scheme_search_terms(scheme_name):
    """
    Generate possible search terms for a scheme.
    """

    if not scheme_name:
        return []

    normalized_name = normalize_text(
        scheme_name
    )

    search_terms = [
        normalized_name
    ]


    for key, aliases in SCHEME_ALIASES.items():

        normalized_key = normalize_text(
            key
        )

        if (
            normalized_key in normalized_name
            or normalized_name in normalized_key
        ):

            search_terms.extend(
                normalize_text(alias)
                for alias in aliases
            )


    unique_terms = []

    for term in search_terms:

        if term and term not in unique_terms:

            unique_terms.append(
                term
            )


    unique_terms.sort(
        key=len,
        reverse=True
    )

    return unique_terms


def find_scheme_heading(lines, scheme_name):
    """
    Find the most likely line containing the scheme name.

    Returns:
        (index, matched_term)
    """

    search_terms = get_scheme_search_terms(
        scheme_name
    )

    if not search_terms:
        return None, None


    for index, line in enumerate(lines):

        normalized_line = normalize_text(
            line
        )

        if not normalized_line:
            continue

        if len(line.split()) > 15:
            continue

        for term in search_terms:

            if term in normalized_line:

                return index, term


    for index, line in enumerate(lines):

        normalized_line = normalize_text(
            line
        )

        if not normalized_line:
            continue

        for term in search_terms:

            if term in normalized_line:

                return index, term

    return None, None


def is_tndce_scheme(scheme_name):
    """
    Determine whether the scheme belongs to the TNDCE
    scholarship table.
    """

    if not scheme_name:
        return False

    normalized_name = normalize_text(
        scheme_name
    )

    tndce_terms = [
        "differently abled scholarship",
        "scholarship to sons",
        "scholarship to son and daughter",
    ]

    return any(
        term in normalized_name
        for term in tndce_terms
    )


def extract_tndce_scheme_content(
    scraped_text,
    scheme_name
):
    """
    Extract one complete scholarship row from the TNDCE
    scholarship table.
    """

    if not scraped_text:
        return None

    lines = scraped_text.splitlines()

    if not lines:
        return None


    heading_index, matched_term = find_scheme_heading(
        lines,
        scheme_name
    )

    if heading_index is None:

        print(
            f"⚠️ Could not find TNDCE scheme section: "
            f"{scheme_name}"
        )

        return None

    print(
        f"🔎 TNDCE scheme found: "
        f"{scheme_name}"
    )

    print(
        f"   Matched term: {matched_term}"
    )

    print(
        f"   Scheme line: "
        f"{lines[heading_index]}"
    )


    start_index = heading_index

    for index in range(
        heading_index - 1,
        max(-1, heading_index - 5),
        -1
    ):

        if re.fullmatch(
            r"\d+",
            lines[index].strip()
        ):

            start_index = index

            break


    end_index = len(lines)

    for index in range(
        heading_index + 1,
        len(lines)
    ):

        if re.fullmatch(
            r"\d+",
            lines[index].strip()
        ):

            end_index = index

            break


    extracted_lines = []

    characters = 0

    for index in range(
        start_index,
        end_index
    ):

        line = lines[index].strip()

        if not line:
            continue

        extracted_lines.append(
            line
        )

        characters += len(line)

        if characters >= MAX_EXTRACTED_CHARACTERS:

            print(
                "   ⚠️ TNDCE extraction reached "
                "character limit."
            )

            break

    extracted_content = "\n".join(
        extracted_lines
    ).strip()


    if len(extracted_content) < 100:

        print(
            f"⚠️ TNDCE extracted content is too small: "
            f"{scheme_name}"
        )

        return None

    print(
        f"   Lines extracted: "
        f"{len(extracted_lines)}"
    )

    print(
        f"   Characters extracted: "
        f"{len(extracted_content)}"
    )

    return extracted_content


def is_minority_scheme(scheme_name):
    """
    Determine whether the scheme belongs to the minority
    scholarship page.
    """

    if not scheme_name:
        return False

    normalized_name = normalize_text(
        scheme_name
    )

    return (
        "minority pre matric scholarship"
        in normalized_name
        or
        "minority post matric scholarship"
        in normalized_name
    )


def extract_minority_scheme_content(
    scraped_text,
    scheme_name
):
    """
    Extract the relevant minority scholarship section.
    """

    if not scraped_text:
        return None

    lines = scraped_text.splitlines()

    if not lines:
        return None

    normalized_name = normalize_text(
        scheme_name
    )


    if "pre matric" in normalized_name:

        search_terms = [
            "pre matric scholarship",
            "pre-matric scholarship",
        ]

    else:

        search_terms = [
            "post matric scholarship",
            "post-matric scholarship",
        ]


    heading_index = None
    matched_term = None

    for index, line in enumerate(lines):

        normalized_line = normalize_text(
            line
        )

        for term in search_terms:

            if term in normalized_line:

                heading_index = index
                matched_term = term

                break

        if heading_index is not None:
            break

    if heading_index is None:

        print(
            f"⚠️ Could not find minority scholarship "
            f"section: {scheme_name}"
        )

        return None

    print(
        f"🔎 Minority scholarship section found: "
        f"{scheme_name}"
    )

    print(
        f"   Matched term: {matched_term}"
    )

    print(
        f"   Section line: "
        f"{lines[heading_index]}"
    )


    extracted_lines = [
        lines[heading_index]
    ]

    characters = len(
        lines[heading_index]
    )

    stop_terms = [
    "post matric scholarship",
    "post-matric scholarship",
    "pre matric scholarship",
    "pre-matric scholarship",
    "merit cum means scholarship",
    "merit-cum-means scholarship",
    "merit cum means based scholarship scheme",
    "merit-cum-means based scholarship scheme",
]

    for index in range(
        heading_index + 1,
        min(
            len(lines),
            heading_index + MAX_SECTION_LINES
        )
    ):

        current_line = lines[index]

        if not current_line:
            continue

        normalized_line = normalize_text(
            current_line
        )


        is_another_section = False

        for stop_term in stop_terms:

            if stop_term in normalized_line:

                if (
                    normalize_text(
                        matched_term
                    )
                    in normalized_line
                ):

                    continue

                is_another_section = True

                break

        if is_another_section:

            print(
                f"   🛑 Next scholarship section found:"
                f" {current_line}"
            )

            break

        extracted_lines.append(
            current_line
        )

        characters += len(
            current_line
        )

        if characters >= MAX_EXTRACTED_CHARACTERS:

            print(
                "   ⚠️ Minority extraction reached "
                "character limit."
            )

            break

    extracted_content = "\n".join(
        extracted_lines
    ).strip()

    if len(extracted_content) < 100:

        print(
            f"⚠️ Minority extracted content is too small:"
            f" {scheme_name}"
        )

        return None

    print(
        f"   Lines extracted: "
        f"{len(extracted_lines)}"
    )

    print(
        f"   Characters extracted: "
        f"{len(extracted_content)}"
    )

    return extracted_content


def is_readers_allowance_scheme(scheme_name):
    """
    Determine whether the scheme is Readers Allowance.
    """

    if not scheme_name:
        return False

    normalized_name = normalize_text(
        scheme_name
    )

    return (
        "readers allowance"
        in normalized_name
        or
        "reader allowance"
        in normalized_name
    )


def extract_readers_allowance_content(
    scraped_text,
    scheme_name
):
    """
    Extract the complete Readers Allowance section from the SCD page.

    The SCD page contains Readers Allowance inside a popup/modal.
    In the flattened text, the useful content starts after the
    Readers Allowance heading and continues until the popup's
    "close" marker. The next scheme begins after "close".
    """

    if not scraped_text:
        return None

    lines = [
        line.strip()
        for line in scraped_text.splitlines()
        if line.strip()
    ]

    if not lines:
        return None


    start_index = None

    for index, line in enumerate(lines):

        normalized_line = normalize_text(line)

        if (
            "readers allowance" in normalized_line
            or "reader allowance" in normalized_line
        ):

            start_index = index

            print(
                f"🔎 Readers Allowance section found: "
                f"{scheme_name}"
            )

            print(
                "   Matched term: readers allowance"
            )

            print(
                f"   Section line: {line}"
            )

            break

    if start_index is None:

        print(
            f"⚠️ Readers Allowance section not found: "
            f"{scheme_name}"
        )

        return None


    extracted_lines = []
    characters = 0

    for index in range(
        start_index,
        min(
            len(lines),
            start_index + MAX_SECTION_LINES
        )
    ):

        current_line = lines[index]

        if not current_line:
            continue

        normalized_line = normalize_text(
            current_line
        )


        if (
            index > start_index
            and normalized_line == "close"
        ):

            extracted_lines.append(
                current_line
            )

            print(
                f"   🛑 End of Readers Allowance section: "
                f"{current_line}"
            )

            break

        extracted_lines.append(
            current_line
        )

        characters += len(current_line)

        if characters >= MAX_EXTRACTED_CHARACTERS:

            print(
                "   ⚠️ Readers Allowance extraction "
                "reached character limit."
            )

            break


    extracted_content = "\n".join(
        extracted_lines
    ).strip()


    if len(extracted_content) < 100:

        print(
            f"⚠️ Readers Allowance content is too small: "
            f"{scheme_name}"
        )

        return None

    print(
        f"   Lines extracted: "
        f"{len(extracted_lines)}"
    )

    print(
        f"   Characters extracted: "
        f"{len(extracted_content)}"
    )

    return extracted_content


def looks_like_next_scheme_heading(
    line,
    current_scheme_name
):
    """
    Determine whether a line is probably another scheme
    heading.
    """

    if not line:
        return False

    normalized_line = normalize_text(
        line
    )

    if not normalized_line:
        return False

    current_terms = get_scheme_search_terms(
        current_scheme_name
    )


    for term in current_terms:

        if term in normalized_line:
            return False

    words = normalized_line.split()

    if len(words) > 8:
        return False

    scheme_indicators = [
        "thittam",
        "scheme",
        "scholarship",
        "programme",
        "program",
        "pudhalvan",
        "penn",
        "allowance",
    ]

    for indicator in scheme_indicators:

        if indicator in normalized_line:
            return True

    return False


def extract_scheme_content(
    scraped_text,
    scheme_name
):
    """
    Extract content relevant to one scheme.

    Uses a source-specific extractor when required.
    Otherwise uses the original generic extraction logic.
    """

    if not scraped_text:
        return None

    if not scheme_name:
        return None


    if is_tndce_scheme(
        scheme_name
    ):

        return extract_tndce_scheme_content(
            scraped_text,
            scheme_name
        )


    if is_minority_scheme(
        scheme_name
    ):

        return extract_minority_scheme_content(
            scraped_text,
            scheme_name
        )


    if is_readers_allowance_scheme(
        scheme_name
    ):

        return extract_readers_allowance_content(
            scraped_text,
            scheme_name
        )


    lines = scraped_text.splitlines()

    if not lines:
        return None

    heading_index, matched_term = find_scheme_heading(
        lines,
        scheme_name
    )

    if heading_index is None:

        print(
            f"⚠️ Could not find scheme section: "
            f"{scheme_name}"
        )

        return None

    print(
        f"🔎 Scheme heading found: "
        f"{scheme_name}"
    )

    print(
        f"   Matched term: {matched_term}"
    )

    print(
        f"   Heading line: "
        f"{lines[heading_index]}"
    )


    extracted_lines = [
        lines[heading_index]
    ]

    characters = len(
        lines[heading_index]
    )


    for index in range(
        heading_index + 1,
        min(
            len(lines),
            heading_index + MAX_SECTION_LINES
        )
    ):

        current_line = lines[index]

        if not current_line:
            continue


        if (
            index > heading_index + 5
            and looks_like_next_scheme_heading(
                current_line,
                scheme_name
            )
        ):

            print(
                f"   🛑 Possible next scheme found:"
                f" {current_line}"
            )

            break

        extracted_lines.append(
            current_line
        )

        characters += len(
            current_line
        )

        if characters >= MAX_EXTRACTED_CHARACTERS:

            print(
                "   ⚠️ Extraction reached "
                "character limit."
            )

            break


    extracted_content = "\n".join(
        extracted_lines
    ).strip()

    if len(extracted_content) < 100:

        print(
            f"⚠️ Extracted content is too small for:"
            f" {scheme_name}"
        )

        return None

    print(
        f"   Lines extracted: "
        f"{len(extracted_lines)}"
    )

    print(
        f"   Characters extracted: "
        f"{len(extracted_content)}"
    )

    return extracted_content


def get_content_hash(text):
    """
    Generate SHA-256 hash for the complete scraped page.
    """

    if not text:
        return None

    content_hash = hashlib.sha256(
        text.encode("utf-8")
    ).hexdigest()

    return content_hash


def normalize_url(url):
    """
    Normalize URL formatting.
    """

    if not url:
        return None

    return url.strip().rstrip("/")


if __name__ == "__main__":

    url = "https://tils.tn.gov.in/schemes"

    test_scheme = "Tamil Pudhalvan Thittam"

    print(
        "🌐 Scraping webpage..."
    )

    print(
        f"URL: {url}\n"
    )


    text = scrape_page(
        url
    )

    if text:

        print(
            "✅ Scraping successful!\n"
        )


        content_hash = get_content_hash(
            text
        )

        print(
            "🔐 Full Page Content Hash:"
        )

        print(
            content_hash
        )

        print(
            "\n" + "=" * 70
        )


        print(
            "🔎 Testing scheme extraction"
        )

        print(
            f"Scheme: {test_scheme}"
        )

        print(
            "=" * 70
        )

        scheme_content = extract_scheme_content(
            text,
            test_scheme
        )

        if scheme_content:

            print(
                "\n✅ Scheme section extracted "
                "successfully!\n"
            )

            print(
                "=" * 70
            )

            print(
                scheme_content
            )

            print(
                "=" * 70
            )

        else:

            print(
                "\n❌ Scheme section extraction failed."
            )

        print(
            "\n✅ Scraper test finished."
        )

    else:

        print(
            "❌ Scraping failed."
        )
