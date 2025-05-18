import requests
from bs4 import BeautifulSoup
import os
import csv
from urllib.parse import urljoin

BASE_URL = "https://ambrosiana.it/en/discover/collection/page/{}/"
OUTPUT_DIR = "ambrosiana_images"
CSV_FILE = "ambrosiana_metadata.csv"

os.makedirs(OUTPUT_DIR, exist_ok=True)
csv_headers = ["title", "artist", "image_url", "image_path"]

def get_soup(url):
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")

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

                if not img_tag or not title_tag or not artist_tag:
                    continue

                image_url = img_tag["src"]
                title = title_tag.text.strip()
                artist = artist_tag.text.strip()

                filename = title.replace(" ", "_").replace("/", "_") + ".jpg"
                image_path = os.path.join(OUTPUT_DIR, filename)

                # Download image
                img_data = requests.get(image_url).content
                with open(image_path, "wb") as f:
                    f.write(img_data)

                all_data.append([title, artist, image_url, image_path])

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
    data = scrape(max_pages=10)
    save_csv(data)
    print(f"\n✅ Done! {len(data)} artworks saved.")
