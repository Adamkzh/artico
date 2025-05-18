import torch
import pickle
import os
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from torchvision import transforms

# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load model
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def load_gallery_embeddings(embedding_file="clip_gallery_embeddings.pkl"):
    if not os.path.exists(embedding_file):
        raise FileNotFoundError(f"Gallery embeddings file not found: {embedding_file}")
    with open(embedding_file, "rb") as f:
        return pickle.load(f)

def process_user_image(image_path):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"User image not found: {image_path}")
    
    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="pt").to(device)
    
    with torch.no_grad():
        user_embedding = model.get_image_features(**inputs).squeeze()
        # Normalize embedding
        user_embedding = user_embedding / user_embedding.norm(dim=-1, keepdim=True)
    
    return user_embedding

def find_best_match(user_embedding, gallery_embeddings):
    best_score = -1
    best_match = None

    for emb, title, artist, img_path in gallery_embeddings:
        # Normalize gallery embedding if not already normalized
        emb = emb / emb.norm(dim=-1, keepdim=True)
        score = torch.nn.functional.cosine_similarity(user_embedding, emb, dim=0).item()
        if score > best_score:
            best_score = score
            best_match = (title, artist, img_path, score)

    return best_match

def main():
    # Load gallery embeddings
    gallery_embeddings = load_gallery_embeddings()
    
    # Process user image
    user_image_path = "user_uploaded.jpg"  # This could be made configurable
    user_embedding = process_user_image(user_image_path)
    
    # Find best match
    best_match = find_best_match(user_embedding, gallery_embeddings)
    
    # Output results
    if best_match:
        print("\n🎯 Best match:")
        print(f"📘 Title : {best_match[0]}")
        print(f"👨‍🎨 Artist: {best_match[1]}")
        print(f"🖼️ Image : {best_match[2]}")
        print(f"🔢 Score : {best_match[3]:.4f}")
    else:
        print("No matches found in the gallery.")

if __name__ == "__main__":
    main()
