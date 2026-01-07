import os
from sentence_transformers import SentenceTransformer
from supabase import create_client
from langchain.schema import Document
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URI")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing SUPABASE_URI or SUPABASE_SERVICE_KEY in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Cache the model
_model = None
def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    return _model

# Query Supabase using vector embeddings
def query_papers(query, top_k=5):
    model = get_model()
    query_embedding = model.encode(query).tolist()

    response = supabase.rpc("match_paper_chunks", {
        "query_embedding": query_embedding,
        "match_count": top_k
    }).execute()

    results = []
    for row in response.data:
        results.append(Document(page_content=row['text'], metadata={"similarity": row["similarity"]}))
    return results
