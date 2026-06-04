#!/usr/bin/env python3
import sys
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

# Step 1: Define base URL and target headers to mimic a browser
BASE_URL = "https://runbot.odoo.com"
START_URL = f"{BASE_URL}/runbot/bundle/master-1"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def main():
    print(f"[*] Fetching initial bundle page: {START_URL}")
    try:
        response = requests.get(START_URL, headers=HEADERS)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"[-] Error fetching the bundle page: {e}")
        sys.exit(1)

    soup = BeautifulSoup(response.text, "html.parser")

    # Step 2: Find the href of the first .batch_row a
    first_batch_row = soup.select_one(".batch_row a")
    if not first_batch_row or not first_batch_row.get("href"):
        print("[-] Could not find the first '.batch_row a' element.")
        sys.exit(1)

    batch_href = first_batch_row["href"]

    # Handle relative URLs if necessary
    if batch_href.startswith("/"):
        second_page_url = f"{BASE_URL}{batch_href}"
    else:
        second_page_url = batch_href

    print(f"[*] Navigating to batch page: {second_page_url}")

    # Step 3: Go to the second page
    try:
        response = requests.get(second_page_url, headers=HEADERS)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"[-] Error fetching the batch page: {e}")
        sys.exit(1)

    soup_batch = BeautifulSoup(response.text, "html.parser")

    # Step 4: Find all Github links matching the specific title selector
    github_links = soup_batch.select("a[title='View Commit on Github']")

    if not github_links:
        print("[-] No GitHub commit links found on this page.")
        sys.exit(1)

    print(f"[+] Found {len(github_links)} commit link(s). Generating one-liners:\n")

    # Step 5: Parse URL structures and print the single chained command line
    for link in github_links:
        href = link.get("href", "")

        # Target shape: https://github.com/odoo/<repo>/commit/<hash>
        if "github.com/odoo/" in href and "/commit/" in href:
            parsed_url = urlparse(href)
            path_parts = parsed_url.path.strip("/").split("/")

            # path_parts structure: ['odoo', '<repo>', 'commit', '<hash>']
            if len(path_parts) >= 4:
                repo = path_parts[1]
                commit_hash = path_parts[3]

                # Reconstruct the base remote URL (e.g., https://github.com/odoo/odoo)
                remote_url = f"https://github.com/odoo/{repo}"

                # Generate the one-liner command chaining with &&
                one_liner = (
                    f"cd ~/src/{repo} && "
                    f"git fetch {remote_url} {commit_hash} && "
                    f"git rebase {commit_hash}"
                )

                print(one_liner)


if __name__ == "__main__":
    main()