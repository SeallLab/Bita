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

#Cache the model to avoid reloading it multiple times
_model = None

#Load and return the embedding model (MiniLM)
def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    return _model

#Clean unwanted text from research papers
def clean_text(text):
    text = re.sub(r"Authorized licensed use.*?Restrictions apply\.", "", text, flags=re.DOTALL) #Remove license watermark
    text = re.sub(r"\[\d+\]\s?.*?(\n|$)", "", text) #Remove inline references
    text = re.sub(r"\s+", " ", text) #Normalize whitespace
    return text.strip()

#Load PDFs, split them into chunks, and clean each chunk
def get_chunks_for_embedding(pdf_folder="papers", chunk_size=1500, chunk_overlap=150):
    docs = []
    #Load each PDF in the folder
    for filename in os.listdir(pdf_folder):
        if filename.endswith(".pdf"):
            loader = UnstructuredPDFLoader(os.path.join(pdf_folder, filename), strategy="fast")
            docs.extend(loader.load())

    #Use SpacyTextSplitter to split documents into overlapping chunks
    splitter = SpacyTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = splitter.split_documents(docs)

    #Clean each chunk's content
    cleaned_chunks = [clean_text(chunk.page_content) for chunk in chunks]
    metadata = [chunk.metadata for chunk in chunks]

    return cleaned_chunks, metadata

#Upload chunks and their vector embeddings to Supabase
def upload_chunks_to_supabase(texts, metadata):
    model = get_model()
    for i, text in enumerate(texts):
        embedding = model.encode(text).tolist()
        supabase.table("paper_chunks").insert({
            "text": text,
            "embedding": embedding
        }).execute()

#Perform a similarity search using Supabase RPC and vector embeddings
def query_papers(query, top_k=5):
    model = get_model()
    query_embedding = model.encode(query).tolist()

    #Call the Supabase stored procedure for vector search
    response = supabase.rpc("match_paper_chunks", {
        "query_embedding": query_embedding,
        "match_count": top_k
    }).execute()

    #Convert results into LangChain Document objects
    results = []
    for row in response.data:
        results.append(Document(page_content=row['text'], metadata={"similarity": row["similarity"]}))
    return results

#Build the vector index by processing PDFs and uploading them
def build_supabase_index(pdf_folder="papers"):
    texts, metadata = get_chunks_for_embedding(pdf_folder)
    upload_chunks_to_supabase(texts, metadata)

#Run indexing pipeline when new papers pushed to GitHub
if __name__ == "__main__":
    build_supabase_index(pdf_folder="papers")