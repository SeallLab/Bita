import os
import re
import nltk
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from langchain_community.document_loaders import UnstructuredPDFLoader
from langchain.text_splitter import SpacyTextSplitter

nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('averaged_perceptron_tagger_eng')

MODEL_PATH = "models/all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_PATH, device="cpu")

PDF_FOLDER = "papers"
DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

def clean_text(text):
    text = re.sub(r"Authorized licensed use.*?Restrictions apply\.", "", text, flags=re.DOTALL)
    text = re.sub(r"\[\d+\]\s?.*?(\n|$)", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def get_chunks(pdf_folder):
    docs = []
    for filename in os.listdir(pdf_folder):
        if filename.endswith(".pdf"):
            loader = UnstructuredPDFLoader(os.path.join(pdf_folder, filename), strategy="fast")
            docs.extend(loader.load())
    splitter = SpacyTextSplitter(chunk_size=600, chunk_overlap=150)
    chunks = splitter.split_documents(docs)
    texts = [clean_text(c.page_content) for c in chunks]
    return texts

#Build FAISS index
texts = get_chunks(PDF_FOLDER)
embeddings = np.array(model.encode(texts)).astype("float32")
dim = embeddings.shape[1]

index = faiss.IndexFlatL2(dim)
index.add(embeddings)

#Save index and texts
faiss.write_index(index, os.path.join(DATA_DIR, "faiss_index.bin"))
with open(os.path.join(DATA_DIR, "texts.pkl"), "wb") as f:
    pickle.dump(texts, f)

print(f"Index built with {len(texts)} chunks.")