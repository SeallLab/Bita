from dataclasses import dataclass
from datetime import datetime
import os
import sqlite3
from flask import Flask, jsonify, make_response, redirect, request, session
from flask_cors import CORS
from dotenv import load_dotenv
from waitress import serve
from database_connector import get_db_connection
from ieee import query_ieee
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

def store_message(conn, cursor, session_id, sender, message, timestamp):
    cursor.execute(
        "INSERT INTO messages (session_id, sender, message, timestamp) VALUES (%s, %s, %s, %s)",
        (session_id, sender, message, timestamp)
    )

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
    #context_docs = query_ieee(user_message)
    context_docs = [
        Document(page_content="""
        Title: Fairness in Machine Learning Systems
        Authors: A. Smith, B. Lee
        Abstract: This paper explores the definition and operationalization of fairness in machine learning systems. It compares group fairness metrics such as demographic parity and equalized odds, and evaluates their trade-offs using a credit lending dataset.
        """),

            Document(page_content="""
        Title: Bias Mitigation Techniques in AI
        Authors: C. Kumar, D. Zhang
        Abstract: We review algorithmic strategies to reduce bias in classification models, including re-weighting, adversarial debiasing, and fairness constraints during training. Our experiments on facial recognition systems show significant reductions in disparate impact.
        """),

            Document(page_content="""
        Title: The Impact of Dataset Imbalance on Fairness
        Authors: E. Chen, F. Miller
        Abstract: Dataset imbalance can cause predictive models to underperform on minority groups. This study quantifies the impact of class imbalance on fairness metrics and recommends stratified sampling and synthetic data generation to mitigate the effects.
        """),

            Document(page_content="""
        Title: Individual vs. Group Fairness in Decision Systems
        Authors: G. Wu, H. Patel
        Abstract: The paper compares the philosophical underpinnings and practical implications of individual fairness versus group fairness. It proposes a hybrid framework to balance fairness objectives across competing ethical perspectives.
        """),

            Document(page_content="""
        Title: Auditing Black-Box Models for Discrimination
        Authors: I. Rahman, J. O'Brien
        Abstract: This work introduces an auditing tool that can evaluate black-box ML models for signs of discrimination. Using counterfactual examples and sensitivity analysis, we expose hidden biases in recidivism prediction systems.
        """)
        ]
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