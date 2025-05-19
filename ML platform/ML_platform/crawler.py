import requests
from bs4 import BeautifulSoup
import os
import csv
from urllib.parse import urljoin
import time

BASE_URL = "https://ambrosiana.it/en/discover/collection/page/{}/"
OUTPUT_DIR = "ambrosiana_images"
CSV_FILE = "ambrosiana_metadata.csv"

os.makedirs(OUTPUT_DIR, exist_ok=True)
csv_headers = [
    "title", "artist", "image_url", "image_path", 
    "inventory", "date", "type", "technique", 
    "dimensions", "subject", "school", "room",
    "description"
]

def get_soup(url):
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")

def get_artwork_details(url):
    soup = get_soup(url)
    details = {}

    # Get description
    description_tag = soup.select_one("div#opera_content p")
    details["description"] = description_tag.text.strip() if description_tag else ""

    # Metadata section
    metadata_items = soup.select("div#opera_sidebar ul li")

    for item in metadata_items:
        try:
            key = item.select_one("h3").text.strip().lower()
            value = item.select_one("span").text.strip()

            if "inventory" in key:
                details["inventory"] = value
            elif "date" in key:
                details["date"] = value
            elif "type" in key:
                details["type"] = value
            elif "technique" in key:
                details["technique"] = value
            elif "dimension" in key:
                details["dimensions"] = value
            elif "subject" in key:
                details["subject"] = value
            elif "school" in key:
                details["school"] = value
            elif "room" in key:
                details["room"] = value
        except Exception as e:
            print(f"⚠️ Error parsing metadata item: {e}")
            continue

    return details

def scrape(max_pages=3):
    all_data = []
    for page in range(1, max_pages + 1):
        print(f"🔍 Scraping page {page}")
        soup = get_soup(BASE_URL.format(page))
        artworks = soup.select(".grid-item")

        if not artworks:
            print("No artworks found.")
            break

        for art in artworks:
            try:
                img_tag = art.select_one("img")
                title_tag = art.select_one("h2.italic")
                artist_tag = art.select("h2")[1] if len(art.select("h2")) > 1 else None
                link_tag = art.select_one("a")

                if not img_tag or not title_tag or not artist_tag or not link_tag:
                    continue

                image_url = img_tag["src"]
                title = title_tag.text.strip()
                artist = artist_tag.text.strip()
                artwork_url = urljoin(BASE_URL, link_tag["href"])

                filename = title.replace(" ", "_").replace("/", "_") + ".jpg"
                image_path = os.path.join(OUTPUT_DIR, filename)

                # Download image
                img_data = requests.get(image_url).content
                with open(image_path, "wb") as f:
                    f.write(img_data)

                # Get detailed information
                print(f"📖 Getting details for: {title}")
                details = get_artwork_details(artwork_url)
                
                # Add delay to be nice to the server
                time.sleep(1)

                # Combine all data
                row = [
                    title, artist, image_url, image_path,
                    details.get("inventory", ""),
                    details.get("date", ""),
                    details.get("type", ""),
                    details.get("technique", ""),
                    details.get("dimensions", ""),
                    details.get("subject", ""),
                    details.get("school", ""),
                    details.get("room", ""),
                    details.get("description", "")
                ]
                
                all_data.append(row)

            except Exception as e:
                print(f"⚠️ Error: {e}")
                continue

    return all_data

def save_csv(data):
    with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(csv_headers)
        writer.writerows(data)

if __name__ == "__main__":
    data = scrape(max_pages=20)
    save_csv(data)
    print(f"\n✅ Done! {len(data)} artworks saved.")
