import os
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

DATA_DIR = "data"

model = SentenceTransformer("models/all-MiniLM-L6-v2", device="cpu")

#Load FAISS index and texts once at startup
try:
    index = faiss.read_index(f"{DATA_DIR}/faiss_index.bin")
    with open(f"{DATA_DIR}/texts.pkl", "rb") as f:
        stored_texts = pickle.load(f)
except FileNotFoundError:
    print("FAISS index or texts.pkl not found in data folder")
    raise

def query_papers(query, top_k=5):
    query_embedding = np.array(model.encode([query])).astype("float32")
    query_embedding = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)

    distances, indices = index.search(query_embedding, top_k)

    results = []
    for i, dist in zip(indices[0], distances[0]):
        results.append({
            "text": stored_texts[i],
            "similarity": float(dist)
        })

    return results