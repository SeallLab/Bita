import os
import google.generativeai as genai
from dotenv import load_dotenv

#Load from .env
load_dotenv()

def query_gemini(user_query: str, context_docs: list) -> str:
    context = "\n\n".join([doc.page_content for doc in context_docs])

    prompt = f"""You are a helpful research assistant.
Based on the following documents:

{context}

Answer the question:
{user_query}"""

    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content(prompt)
    return response.text

