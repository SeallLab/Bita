from dataclasses import dataclass
from datetime import datetime
import os
from flask import Flask, jsonify, make_response, redirect, request, session
from flask_cors import CORS
from dotenv import load_dotenv
import supabase
from waitress import serve
from database_connector import get_db_connection
from source_fetching import query_papers
from gemini import query_gemini

#Get env variables
load_dotenv()

#Set up app with Flask
app = Flask(__name__)

FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY")
APP_URL = os.getenv('FRONTEND_APP_URL')
API_ACCESS_KEY = os.getenv('API_ACCESS_KEY')
API_KEY=os.getenv("GOOGLE_API_KEY")


#Configure Flask session for HTTPS hosting
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_COOKIE_SAMESITE"] = None  #Allows cross-site cookies
app.config["SESSION_COOKIE_SECURE"] = True  #Only over HTTPS
app.secret_key = FLASK_SECRET_KEY
CORS(app, supports_credentials=True, origins=[APP_URL]) #Allows access from frontend

#Function to lock backend route calls without key
def require_api_key(f):
    def decorated_function(*args, **kwargs):
        api_key = request.args.get("api_key")
        if api_key != API_ACCESS_KEY:
            return jsonify({"error": "Unauthorized"}), 403
        return f(*args, **kwargs)
    return decorated_function

@dataclass
class Document:
    page_content: str

#Default path
@app.route("/", methods=["GET"])
def default_api():
    return jsonify({"message": "API is working!"})

#Saves message into database for chat retrieval
def store_message(session_id, sender, message, timestamp):
    try:
        supabase = get_db_connection()
        supabase.table("messages").insert({
            "session_id": session_id,
            "sender": sender,
            "message": message,
            "timestamp": timestamp.isoformat()
        }).execute()
    except Exception as err:
        return jsonify({"error": f"Database error: {err}"}), 500

#Fetches message history based on session ID
def get_messages(session_id):
    try:
        supabase = get_db_connection()
        response = supabase.table("messages").select("*").eq("session_id", session_id).execute()
    except Exception as err:
        return jsonify({"error": f"Database error: {err}"}), 500

    messages = response.data
    if not messages:
        return "not_found"

    return messages

def get_conversation_context(session_hash, limit=6):
    try:
        supabase = get_db_connection()
        response = (
            supabase
            .table("messages")
            .select("sender, message")
            .eq("session_id", session_hash)
            .order("timestamp", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception as err:
        return jsonify({"error": f"Database error: {err}"}), 500

    messages = list(reversed(response.data))
    return "\n".join(f"{m['sender'].capitalize()}: {m['message']}" for m in messages)

#Message sent by user
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    session_id = data["session_id"]
    user_message = data["message"]

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)

    #Save user message
    store_message(session_id, "user", user_message, datetime.utcnow())

    #Fetch Gemini answer from IEEE context and previous chat entries
    context_docs = query_papers(user_message)
    previous_chats = get_conversation_context(session_id)
    bot_reply = query_gemini(user_message, context_docs, previous_chats)

    #Save bot reply
    store_message(session_id, "bot", bot_reply, datetime.utcnow())

    conn.commit()
    cursor.close()
    conn.close()

    #Return reply for frontend display
    return jsonify({"reply": bot_reply})

#Restoring chat based on session_id
@app.route("/api/chat/<session_id>", methods=["GET"])
def get_chat(session_id):
    history = get_messages(session_id)
    if history is None:
        return jsonify({"error": "Database connection failed"}), 500

    if history == "not_found":
        return jsonify({"error": "Session ID not found"}), 404

    return jsonify([
        {
            "sender": row["sender"],
            "message": row["message"],
            "timestamp": row["timestamp"]
        }
        for row in history
    ])

if __name__ == '__main__':
    serve(app, host="0.0.0.0", port=5000, threads=6, debug=True, timeout=120)