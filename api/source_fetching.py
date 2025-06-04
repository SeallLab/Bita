import os
import re
import pickle
import faiss
from sentence_transformers import SentenceTransformer
from langchain.document_loaders import UnstructuredPDFLoader
from langchain.text_splitter import SpacyTextSplitter
from langchain.schema import Document

#Remove extra research paper things
def clean_text(text):
    text = re.sub(r"Authorized licensed use.*?Restrictions apply\.", "", text, flags=re.DOTALL)
    text = re.sub(r"\[\d+\]\s?.*?(\n|$)", "", text)  #Clean references
    text = re.sub(r"\s+", " ", text)  #Normalize whitespace
    return text.strip()

#Create index from sources, ran once to create index
def build_local_index(pdf_folder="papers", index_path="vector_store"):
    model = SentenceTransformer("all-MiniLM-L6-v2")

    docs = []
    for filename in os.listdir(pdf_folder):
        if filename.endswith(".pdf"):
            loader = UnstructuredPDFLoader(os.path.join(pdf_folder, filename), strategy="fast")
            docs.extend(loader.load())

    #Split documents into chunks
    splitter = SpacyTextSplitter(chunk_size=1500, chunk_overlap=150)
    chunks = splitter.split_documents(docs)

    texts = [clean_text(chunk.page_content) for chunk in chunks]
    metadata = [chunk.metadata for chunk in chunks]

    #Embed all chunks
    embeddings = model.encode(texts, show_progress_bar=True)

    #Store with FAISS
    dim = embeddings[0].shape[0]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    #Save index and metadata
    if not os.path.exists(index_path):
        os.makedirs(index_path)

    faiss.write_index(index, os.path.join(index_path, "faiss.index"))

    with open(os.path.join(index_path, "metadata.pkl"), "wb") as f:
        pickle.dump((texts, metadata), f)

#Called to get source summaries for Gemini
def query_papers(query, index_path="vector_store", top_k=5):
    model = SentenceTransformer("all-MiniLM-L6-v2")

    index = faiss.read_index(os.path.join(index_path, "faiss.index"))
    with open(os.path.join(index_path, "metadata.pkl"), "rb") as f:
        texts, metadata = pickle.load(f)

    query_embedding = model.encode([query])
    distances, indices = index.search(query_embedding, top_k)

    results = []
    for i in indices[0]:
        doc = Document(page_content=texts[i], metadata=metadata[i])
        results.append(doc)
    return results

if __name__ == "__main__":
    build_local_index(pdf_folder="papers")

    results = query_papers("How should I test my loan approval system?")
    for i, res in enumerate(results):
        print(f"\nResult {i+1}:\n{res['content'][:500]}...\n")