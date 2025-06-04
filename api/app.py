from dataclasses import dataclass
from datetime import datetime
import os
from flask import Flask, jsonify, make_response, redirect, request, session
from flask_cors import CORS
from dotenv import load_dotenv
from waitress import serve
from database_connector import get_db_connection
from source_fetching import query_papers
from gemini import query_gemini

#Get env variables
load_dotenv()

#Set up app with Flask
app = Flask(__name__)

FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY")
APP_URL = os.getenv('APP_URL')
API_ACCESS_KEY = os.getenv('API_ACCESS_KEY')
API_KEY=os.getenv("GOOGLE_API_KEY")

#Configure Flask session for HTTPS hosting
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_COOKIE_SAMESITE"] = None  #Allows cross-site cookies
app.config["SESSION_COOKIE_SECURE"] = True  #Only over HTTPS
app.secret_key = FLASK_SECRET_KEY
CORS(app, supports_credentials=True, origins=["http://localhost:5173"]) #Allows access from frontend

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
def store_message(conn, cursor, session_id, sender, message, timestamp):
    cursor.execute(
        "INSERT INTO messages (session_id, sender, message, timestamp) VALUES (%s, %s, %s, %s)",
        (session_id, sender, message, timestamp)
    )

#Fetches message history based on session ID
def get_messages(session_id):
    conn = get_db_connection()
    if conn is None:
        return None

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT sender, message, timestamp FROM messages WHERE session_id = %s", (session_id,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    if not results:
        return "not_found"
    
    return results

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
    store_message(conn, cursor, session_id, "user", user_message, datetime.utcnow())

    #Fetch Gemini answer from IEEE context
    context_docs = query_papers(user_message)
    bot_reply = query_gemini(user_message, context_docs)

    #Save bot reply
    store_message(conn, cursor, session_id, "bot", bot_reply, datetime.utcnow())

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
            "timestamp": row["timestamp"].isoformat() if hasattr(row["timestamp"], "isoformat") else str(row["timestamp"])
        }
        for row in history
    ])

if __name__ == '__main__':
    serve(app, host="0.0.0.0", port=5000, threads=6, debug=True, timeout=120)