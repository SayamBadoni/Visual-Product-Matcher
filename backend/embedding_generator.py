#embedding_generator.py

import torch
from sentence_transformers import SentenceTransformer
from PIL import Image

class ImageEmbedder:
    def __init__(self, model_name='clip-ViT-B-32'):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"Using device: {self.device}")
        
        self.model = SentenceTransformer(model_name, device= self.device)
        print("Image embedding model loaded. ")
        
    def generate_embedding(self, image_path: str) -> list[float]:
        try:
            image = Image.open(image_path)
            
            embedding = self.model.encode(image, convert_to_tensor=False).tolist()
            return embedding
        
        except FileNotFoundError:
            print(f"Error: Image file not found at {image_path}")
            return None
        except Exception as e:
            print(f"An error occured while generating a embedding for {image_path}: {e}")
            return None
        
if __name__ == '__main__':
    try:
        dummy_image = Image.new('RGB', (100, 100), color = 'red')
        dummy_image_path = "test_image.jpg"
        dummy_image.save(dummy_image_path)
        
        embedder = ImageEmbedder()
        vector = embedder.generate_embedding(dummy_image_path)
        if vector:
            print(f"Successfully generated a vector of dimension: {len(vector)}")
            
    except Exception as e:
        print(f"An error occured the example run: {e}")
        