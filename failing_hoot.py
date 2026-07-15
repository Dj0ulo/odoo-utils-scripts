import argparse
import html
import re
import requests


def generate_hash(*strings: str) -> str:
    """Translates the JS hash function to Python.

    Combines strings with field separator \\x1C, applies a 32-bit integer
    hash, and returns an 8-character hex string.
    """
    # Join strings with the field separator character
    string_to_hash = "\x1C".join(strings)

    hash_val = 0
    for char in string_to_hash:
        # (hash_val << 5) - hash_val
        hash_val = (hash_val << 5) - hash_val + ord(char)

        # Force a 32-bit signed integer (bitwise OR 0 equivalent in Python)
        hash_val = (hash_val + 2**31) % 2**32 - 2**31

    # Convert the possibly negative hash code into an 8-character hex string
    # (hash_val + 16**8) ensures a positive value for the lower 32 bits
    hex_hash = hex((hash_val + 16**8) & 0xFFFFFFFF)[2:]

    # Ensure it's exactly the last 8 characters (padded if necessary)
    return hex_hash.zfill(8)[-8:]


def main():
    # Set up command line argument parsing
    parser = argparse.ArgumentParser(
        description="Fetch HTML, find failed HOOT tests, hash them, and generate a test URL."
    )
    parser.add_argument("url", help="The URL of the page containing the test logs")
    args = parser.parse_args()

    try:
        # Fetch the HTML content
        print(f"Fetching content from: {args.url}...")
        response = requests.get(args.url)
        response.raise_for_status()
        html_content = response.text

        # Decode HTML entities (e.g., &#34; to ") to make regex matching cleaner
        decoded_html = html.unescape(html_content)

        # Regex to find: [HOOT] Test "something" failed
        # [HOOT]\s+Test\s+"([^"]+)"\s+failed
        pattern = r"\[HOOT\]\s+Test\s+\"([^\"]+)\"\s+failed"
        failed_tests = re.findall(pattern, decoded_html)

        if not failed_tests:
            print("No failed HOOT tests found.")
            return

        # Deduplicate tests while preserving order
        unique_tests = list(dict.fromkeys(failed_tests))

        # Generate hashes
        hashes = [generate_hash(test_name) for test_name in unique_tests]

        # Build the final localhost URL
        # e.g., id=hash1&id=hash2...
        id_params = "&".join([f"id={h}" for h in hashes])
        base_url = "http://localhost:8069/web/tests?debug=assets"
        final_url = f"{base_url}&{id_params}"

        print("\nGenerated URL:")
        print(final_url)

    except requests.exceptions.RequestException as e:
        print(f"Error fetching the URL: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()