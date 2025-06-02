import os
import google.generativeai as genai
from dotenv import load_dotenv

#Load from .env
load_dotenv()

def query_gemini(user_query: str, context_docs: list) -> str:
    context = "\n\n".join([doc.page_content for doc in context_docs])

    prompt = f"""You are a helpful research assistant who interprets and synthesizes research findings.

Based on the following research summaries:

{context}

Please provide a thoughtful, high-level answer to the user's question below. Avoid directly quoting the documents. Instead, explain the main insights in your own words, and relate them to the user’s specific domain or problem.

If the question involves testing or evaluating a system (e.g., an AI used for loans, hiring, etc.), suggest relevant fairness concerns (such as racial or gender bias), and propose one or two specific testing strategies the user could try (e.g., counterfactual testing, group comparison, fairness metric evaluation).

User question:
{user_query}
"""

    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content(prompt)
    return response.text

