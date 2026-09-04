import json
from pathlib import Path
from datetime import datetime


# =========================================================
# CACHE FILE
# =========================================================

CACHE_FILE = Path(__file__).parent / "scrape_cache.json"


# =========================================================
# LOAD CACHE
# =========================================================

def load_cache():
    """
    Load previously stored scheme hashes from the cache file.
    """

    if not CACHE_FILE.exists():
        return {}

    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as file:
            return json.load(file)

    except (json.JSONDecodeError, OSError):
        print("⚠️ Cache file could not be read. Starting with empty cache.")
        return {}


# =========================================================
# SAVE CACHE
# =========================================================

def save_cache(cache):
    """
    Save scheme hashes to the cache file.
    """

    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as file:
            json.dump(
                cache,
                file,
                indent=4,
                ensure_ascii=False
            )

    except OSError as error:
        print("❌ Failed to save cache.")
        print(error)


# =========================================================
# GET CACHED SCHEME
# =========================================================

def get_cached_scheme(scheme_id):
    """
    Return cached information for a scheme.
    """

    cache = load_cache()

    return cache.get(str(scheme_id))


# =========================================================
# SAVE SCHEME HASH
# =========================================================

def save_scheme_hash(scheme_id, source_url, content_hash):
    """
    Save the latest hash and source URL for a scheme.
    """

    cache = load_cache()

    cache[str(scheme_id)] = {
        "source_url": source_url,
        "content_hash": content_hash,
        "last_checked": datetime.now().isoformat()
    }

    save_cache(cache)


# =========================================================
# CHECK WHETHER CONTENT CHANGED
# =========================================================

def has_content_changed(scheme_id, source_url, new_hash):
    """
    Determine whether the scraped webpage has changed.

    Returns:
        True  -> new or changed content
        False -> content is unchanged
    """

    cached_scheme = get_cached_scheme(scheme_id)

    # No previous record
    if not cached_scheme:
        return True

    old_url = cached_scheme.get("source_url")
    old_hash = cached_scheme.get("content_hash")

    # Source URL changed
    if old_url != source_url:
        return True

    # Website content changed
    if old_hash != new_hash:
        return True

    # Nothing changed
    return False