import os
import google.generativeai as genai
from dotenv import load_dotenv

#Load from .env
load_dotenv()

def query_gemini(prompt: str) -> str:
    try:
        model = genai.GenerativeModel(model_name="gemini-1.5-flash-latest")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error communicating with Gemini: {e}"
