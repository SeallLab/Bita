import os
from sentence_transformers import SentenceTransformer
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URI")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing SUPABASE_URI or SUPABASE_SERVICE_KEY in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Point HuggingFace and transformers caches to a temp location
os.environ["TRANSFORMERS_CACHE"] = "/tmp/transformers_cache"
os.environ["HF_HOME"] = "/tmp/huggingface_cache"

# Cache the model
_model = None
def get_model():
    global _model
    if _model is None:
        _model_path = "/models/all-MiniLM-L6-v2"
        if not os.path.exists(_model_path):
            _model_path = "all-MiniLM-L6-v2"

        _model = SentenceTransformer(
            _model_path,
            device="cpu",
            backend="onnx"
        )
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
        results.append({"text": row['text'], "similarity": row["similarity"]})
    return results
