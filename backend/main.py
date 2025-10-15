from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import shutil
from pathlib import  Path

import requests
from pydantic import BaseModel, HttpUrl
from io import BytesIO
from PIL import Image

load_dotenv()


from embedding_generator import ImageEmbedder

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue, PayloadSchemaType
from typing import List, Optional

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

print("Connecting to Qdrant...")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME")

FRONTEND_URL = os.getenv("FRONTEND_URL")

qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    timeout=10
)

qdrant_client.create_payload_index(
    collection_name=QDRANT_COLLECTION_NAME,
    field_name="category",
    field_schema=PayloadSchemaType.KEYWORD
)

print("✅ Category index created successfully!")
print("Qdrant connected!")

app = FastAPI(title="Visual Product Matcher API")

class SearchRequest(BaseModel):
    embedding: List[float]
    limit: Optional[int] = 10
    min_similarity: Optional[float] = 0.0
    category: Optional[str] = None

class ImageURLRequest(BaseModel):
    image_url: str

print("Loading embedding model...")
embedder = ImageEmbedder()
print("Model loaded successfully!")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/api/ping")
async def ping():
    return {"message": "pong"}

# @app.post("/api/search")
# async def search_similar_products(request: SearchRequest):
#     try:
#         print(f"Searching for similar products...")
#         print(f" Limit {request.limit}")
#         print(f"Min similarity: {request.min_similarity}")
#         if request.category:
#             print(f" Category filter: {request.category}")
            
#         search_filter = None
#         if request.category:
#             search_filter = Filter(
#                 must=[
#                     FieldCondition(
#                         key="category",
#                         match=MatchValue(value=request.category)
#                     )
#                 ]
#             )
        
#         search_results = qdrant_client.search(
#             collection_name=QDRANT_COLLECTION_NAME,
#             query_vector=request.embedding,
#             limit=request.limit,
#             score_threshold=request.min_similarity,
#             query_filter=search_filter
#         )
        
#         print(f"found {len(search_results)} results")
        
#         results = []
#         for hit in search_results:
#             results.append({
#                 "product_id": hit.payload.get("product_id"),
#                 "product_name": hit.payload.get("product_name"),
#                 "category": hit.payload.get("category"),
#                 "similarity_score": round(hit.score, 4),
#                 "similarity_percentage": round(hit.score * 100, 2)
#             })
        
#         return {
#             "status": "success",
#             "count": len(results),
#             "results": results
#         }
        
#     except Exception as e:
#         print(f"Search error: {str(e)}")
#         raise HTTPException(status_code=500, detail = str(e))

# @app.post("/api/upload-image")
# async def upload_image(file:UploadFile = File(...)):
#     try:
#         if not file.content_type.startswith("image/"):
#             raise HTTPException(status_code=400, detail="File must be an image")
#         file_path = UPLOAD_DIR / file.filename
        
#         with open(file_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)
#         print(f"Image saved: {file.filename}")
#         print("Generating embedding...")
        
#         embedding = embedder.generate_embedding(str(file_path))
        
#         if embedding is None:
#             raise HTTPException(status_code=500, detail="Failed to generate embedding")
        
#         print(f"Embedding generated (din: {len(embedding)})")
        
#         return {
#             "status": "success",
#             "filename": file.filename,
#             "embedding_dimension": len(embedding),
#             "embedding": embedding,
#             "message": "Image uploaded and embedding generated successfully"
#         }
#     except Exception as e:
#         print(f"Error: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))
    
    
# @app.post("/api/upload-url")
# async def upload_image_url(request: ImageURLRequest):
#     try:
#         print(f"Downloading image from URL: {request.image_url[:60]}..")
        
#         response = request.get(request.image_url, timeout=10)
        
#         if response.status_code !=200:
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"Failed to download image. status code: {response.status_code}"
#             )
            
#         try:
#             img = Image.open(BytesIO(response.content))
#             img.verify()
#         except Exception:
#             raise HTTPException(status_code=400, detail="URL does not contain a valid image")
        
#         filename = f"url_upload_{os.urandom(8).hex()}.jpg"
#         file_path = UPLOAD_DIR / filename
        
#         with open(file_path, "wb") as f:
#             f.write(response.content)
            
#         print(f"Image downloaded ans saved: {filename}")
        
#         print(f"🔄 Generating embedding...")
#         embedding = embedder.generate_embedding(str(file_path))
        
#         if embedding is None:
#             raise HTTPException(status_code=500, detail="Failed to generate embedding")
        
#         print(f"✅ Embedding generated (dim: {len(embedding)})")
        
#         return {
#             "status": "success",
#             "source_url": request.image_url,
#             "filename": filename,
#             "embedding_dimension": len(embedding),
#             "embedding": embedding,
#             "message": "Image downloaded and embedding generated successfully"
#         }
        
        
#     except requests.exceptions.Timeout:
#         raise HTTPException(status_code=408, detail="Request timeout while downloading image")
#     except requests.exceptions.RequestException as e:
#         raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")
#     except Exception as e:
#         print(f"Error: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# Endpoint 1: Search by uploaded file
@app.post("/api/search-by-file")
async def search_by_file(
    file: UploadFile = File(...),
    limit: int = Form(30),
    min_similarity: float = Form(0.0),
    category: Optional[str] = Form(None)
):
    """
    Upload image file and get similar products
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Save uploaded file
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"✅ Image saved: {file.filename}")
        
        # Generate embedding
        print(f"🔄 Generating embedding...")
        embedding = embedder.generate_embedding(str(file_path))
        
        if embedding is None:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")
        
        print(f"✅ Embedding generated")
        
        # Search in Qdrant
        search_filter = None
        if category:
            search_filter = Filter(
                must=[FieldCondition(key="category", match=MatchValue(value=category))]
            )
        
        search_results = qdrant_client.search(
            collection_name=QDRANT_COLLECTION_NAME,
            query_vector=embedding,
            limit=limit,
            score_threshold=min_similarity,
            query_filter=search_filter
        )
        
        # Format results
        results = []
        for hit in search_results:
            results.append({
                "product_id": hit.payload.get("product_id"),
                "product_name": hit.payload.get("product_name"),
                "category": hit.payload.get("category"),
                "image_url": hit.payload.get("image_url"),
                "similarity_score": round(hit.score, 4),
                "similarity_percentage": round(hit.score * 100, 2)
            })
        
        return {
            "status": "success",
            "uploaded_image": file.filename,
            "count": len(results),
            "results": results
        }
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint 2: Search by URL
@app.post("/api/search-by-url")
async def search_by_url(
    image_url: str = Form(...),
    limit: int = Form(30),
    min_similarity: float = Form(0.0),
    category: Optional[str] = Form(None)
):
    """
    Provide image URL and get similar products
    """
    try:
        print(f"🔗 Downloading image from URL...")
        
        # Download image
        response = requests.get(image_url, timeout=10)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to download image. Status: {response.status_code}"
            )
        
        # Verify it's an image
        try:
            img = Image.open(BytesIO(response.content))
            img.verify()
        except Exception:
            raise HTTPException(status_code=400, detail="URL does not contain a valid image")
        
        # Save temporarily
        filename = f"url_upload_{os.urandom(8).hex()}.jpg"
        file_path = UPLOAD_DIR / filename
        
        with open(file_path, "wb") as f:
            f.write(response.content)
        
        print(f"✅ Image downloaded")
        
        # Generate embedding
        print(f"🔄 Generating embedding...")
        embedding = embedder.generate_embedding(str(file_path))
        
        if embedding is None:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")
        
        print(f"✅ Embedding generated")
        
        # Search in Qdrant
        search_filter = None
        if category:
            search_filter = Filter(
                must=[FieldCondition(key="category", match=MatchValue(value=category))]
            )
        
        search_results = qdrant_client.search(
            collection_name=QDRANT_COLLECTION_NAME,
            query_vector=embedding,
            limit=limit,
            score_threshold=min_similarity,
            query_filter=search_filter
        )
        
        # Format results
        results = []
        for hit in search_results:
            results.append({
                "product_id": hit.payload.get("product_id"),
                "product_name": hit.payload.get("product_name"),
                "category": hit.payload.get("category"),
                "image_url": hit.payload.get("image_url"),
                "similarity_score": round(hit.score, 4),
                "similarity_percentage": round(hit.score * 100, 2)
            })
        
        return {
            "status": "success",
            "source_url": image_url,
            "count": len(results),
            "results": results
        }
    
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=408, detail="Request timeout")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to download: {str(e)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/")
def root():
    return {
        "message": "Visual Product Matcher API",
        "status": "running",
        "version": "1.0"
    }
    
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)