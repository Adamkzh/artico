import torch
import pickle
import os
from PIL import Image
from transformers import CLIPProcessor, CLIPModel


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32",use_fast=True)

def load_gallery_embeddings(embedding_file="clip_gallery_embeddings.pkl"):
    if not os.path.exists(embedding_file):
        raise FileNotFoundError(f"Gallery embeddings file not found: {embedding_file}")
    with open(embedding_file, "rb") as f:
        return pickle.load(f)

def process_user_image(image_path):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"User image not found: {image_path}")
    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    # ▶️ 把 tensor 单独放到 device 上
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        user_emb = model.get_image_features(**inputs).squeeze(0)
        user_emb = user_emb / user_emb.norm(dim=-1, keepdim=True)
    return user_emb

def find_best_match(user_emb, gallery_embeddings):
    best_score = -1.0
    best_match = None

    for emb, title, artist, img_path in gallery_embeddings:
        # ▶️ 确保图库向量也在同一个 device 上并已归一化
        emb = emb.to(device)
        emb = emb / emb.norm(dim=-1, keepdim=True)

        score = torch.nn.functional.cosine_similarity(user_emb, emb, dim=0).item()
        if score > best_score:
            best_score = score
            best_match = (title, artist, img_path, score)

    return best_match

def main():
    gallery = load_gallery_embeddings()
    user_path = "test.jpg"
    user_emb = process_user_image(user_path)
    match = find_best_match(user_emb, gallery)

    if match:
        title, artist, img_path, score = match
        print("\n🎯 Best match:")
        print(f"📘 Title : {title}")
        print(f"👨‍🎨 Artist: {artist}")
        print(f"🖼️ Image : {img_path}")
        print(f"🔢 Score : {score:.4f}")
    else:
        print("No match found.")

if __name__ == "__main__":
    main()
