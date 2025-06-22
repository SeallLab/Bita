import os
import re
from sentence_transformers import SentenceTransformer
from langchain.document_loaders import UnstructuredPDFLoader
from langchain.text_splitter import SpacyTextSplitter
from langchain.schema import Document
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URI")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    return _model

#Clean text from research papers
def clean_text(text):
    text = re.sub(r"Authorized licensed use.*?Restrictions apply\.", "", text, flags=re.DOTALL)
    text = re.sub(r"\[\d+\]\s?.*?(\n|$)", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

#Split and clean all PDFs
def get_chunks_for_embedding(pdf_folder="papers", chunk_size=1500, chunk_overlap=150):
    docs = []
    for filename in os.listdir(pdf_folder):
        if filename.endswith(".pdf"):
            loader = UnstructuredPDFLoader(os.path.join(pdf_folder, filename), strategy="fast")
            docs.extend(loader.load())

    splitter = SpacyTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = splitter.split_documents(docs)

    cleaned_chunks = [clean_text(chunk.page_content) for chunk in chunks]
    metadata = [chunk.metadata for chunk in chunks]

    return cleaned_chunks, metadata

#Store chunks + embeddings to Supabase
def upload_chunks_to_supabase(texts, metadata):
    model = get_model()
    for i, text in enumerate(texts):
        embedding = model.encode(text).tolist()
        supabase.table("paper_chunks").insert({
            "text": text,
            "embedding": embedding
        }).execute()

#Query using Supabase vector search
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

#Build and upload to Supabase vector store
def build_supabase_index(pdf_folder="papers"):
    texts, metadata = get_chunks_for_embedding(pdf_folder)
    upload_chunks_to_supabase(texts, metadata)

#
def supabase_rpc_match_paper_chunks(query_embedding, top_k=5):
    response = supabase.rpc(
        "match_paper_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": top_k
        }
    ).execute()

    if response.error:
        raise Exception(f"Supabase RPC error: {response.error.message}")
    
    return response.data

#Create inital index
if __name__ == "__main__":
    print("Embedding and uploading...")
    build_supabase_index(pdf_folder="papers")

    print("\nSearching for: 'How should I test my loan approval system?'")
    results = query_papers("How should I test my loan approval system?")
    for i, res in enumerate(results):
        print(f"\nResult {i+1}:\n{res.page_content[:500]}...\n")