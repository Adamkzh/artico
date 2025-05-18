import os
import torch
import pickle
from PIL import Image
from tqdm import tqdm
from transformers import CLIPProcessor, CLIPModel
import pandas as pd
from torch.utils.data import Dataset, DataLoader

# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load model
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

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

def process_batch(batch, model):
    inputs = {k: v.to(device) for k, v in batch["inputs"].items()}
    with torch.no_grad():
        embeddings = model.get_image_features(**inputs)
        # Normalize embeddings
        embeddings = embeddings / embeddings.norm(dim=-1, keepdim=True)
    return embeddings

def build_gallery(img_folder, metadata_csv, embedding_file, batch_size=32):
    if not os.path.exists(metadata_csv):
        raise FileNotFoundError(f"Metadata file not found: {metadata_csv}")
    
    df = pd.read_csv(metadata_csv)
    # Filter out non-existent images
    df = df[df["image_path"].apply(os.path.exists)]
    
    dataset = ImageDataset(df, processor)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=False)
    
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
    
    # Save embeddings
    with open(embedding_file, "wb") as f:
        pickle.dump(embeddings, f)
    
    print(f"\n✅ Done! Saved {len(embeddings)} image embeddings.")

def main():
    # Configuration - using paths relative to the crawler directory
    IMG_FOLDER = "../crawler/ambrosiana_images"
    METADATA_CSV = "../crawler/ambrosiana_metadata.csv"
    EMBEDDING_FILE = "clip_gallery_embeddings.pkl"
    
    build_gallery(IMG_FOLDER, METADATA_CSV, EMBEDDING_FILE)

if __name__ == "__main__":
    main()
