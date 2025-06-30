import os
import torch
import pickle
from PIL import Image
from tqdm import tqdm
from transformers import CLIPProcessor, CLIPModel
import pandas as pd
from torch.utils.data import Dataset, DataLoader

# ---------------------
# 🧠 model and device configuration
# ---------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32",use_fast=True)

# ---------------------
# 🖼️ custom Dataset class
# ---------------------
class ImageDataset(Dataset):
    def __init__(self, df, processor):
        self.df = df
        self.processor = processor
        
    def __len__(self):
        return len(self.df)
    
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        image_path = row["image_path"]
        try:
            image = Image.open(image_path).convert("RGB")
            inputs = self.processor(images=image, return_tensors="pt")
            return {
                "inputs": inputs,
                "title": row["title"],
                "artist": row["artist"],
                "image_path": image_path
            }
        except Exception as e:
            print(f"⚠️ Error processing {image_path}: {e}")
            return None

# ---------------------
# 🔗 custom collate_fn to merge batch
# ---------------------
def collate_fn(batch):
    batch = [b for b in batch if b is not None]
    if not batch:
        return None
    pixel_values = torch.cat([item["inputs"]["pixel_values"] for item in batch], dim=0)
    return {
        "inputs": {"pixel_values": pixel_values},
        "title": [item["title"] for item in batch],
        "artist": [item["artist"] for item in batch],
        "image_path": [item["image_path"] for item in batch],
    }

# ---------------------
# 🧠 process batch，generate embeddings
# ---------------------
def process_batch(batch, model):
    inputs = {k: v.to(device) for k, v in batch["inputs"].items()}
    with torch.no_grad():
        embeddings = model.get_image_features(**inputs)
        embeddings = embeddings / embeddings.norm(dim=-1, keepdim=True)
    return embeddings

# ---------------------
# 📦 build gallery embeddings and save
# ---------------------
def build_gallery(metadata_csv, embedding_file, batch_size=32):
    if not os.path.exists(metadata_csv):
        raise FileNotFoundError(f"Metadata file not found: {metadata_csv}")
    
    df = pd.read_csv(metadata_csv)
    df.columns = df.columns.str.strip()
    
    # filter out rows with no image
    df = df[df["image_path"].apply(os.path.exists)]
    print(f"🖼️ Total valid images: {len(df)}")

    dataset = ImageDataset(df, processor)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=False, collate_fn=collate_fn)
    
    embeddings = []
    print("🧠 Encoding gallery images with CLIP...")
    
    for batch in tqdm(dataloader):
        if batch is None:
            continue
        batch_embeddings = process_batch(batch, model)
        for i in range(len(batch_embeddings)):
            embeddings.append((
                batch_embeddings[i].cpu(),
                batch["title"][i],
                batch["artist"][i],
                batch["image_path"][i]
            ))

    # save embeddings
    with open(embedding_file, "wb") as f:
        pickle.dump(embeddings, f)
    
    print(f"\n✅ Done! Saved {len(embeddings)} image embeddings to {embedding_file}")

# ---------------------
# 🎯 main entry
# ---------------------
def main():
    METADATA_CSV = "ambrosiana_metadata.csv"
    EMBEDDING_FILE = "clip_gallery_embeddings.pkl"
    
    build_gallery(METADATA_CSV, EMBEDDING_FILE)

if __name__ == "__main__":
    main()
