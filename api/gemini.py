import os
import google.generativeai as genai
from dotenv import load_dotenv

#Load from .env
load_dotenv()

def query_gemini(user_query: str, context_docs: list) -> str:
    context = "\n\n".join([doc.page_content for doc in context_docs])

    prompt = f"""You are a helpful research assistant that is explaining topics focused on software fairness testing to someone who doesn't know much on the topic.

Based on the following documents:

{context}

Interpret the main insights and create a short exploratory testing charter tailored to the user's problem. 
Keep the output concise (2–3 short paragraphs), and use plain text with simple line breaks between paragraphs.
If the user mentions a specific fairness concern (like gender bias, racial disparity, or underrepresentation), focus the charter on that. 
Include ideas for test inputs, comparison strategies, or ways to explore model behavior related to the issue.
Keep the language simple, where it is easy to interpret and understand what is expected to test.

User question:
{user_query}
"""

    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content(prompt)
    return response.text

