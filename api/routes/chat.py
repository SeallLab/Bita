from contextlib import closing
from datetime import datetime
from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
import hashlib
from llm_query import send_document_query
from source_fetching import query_papers
from database_connector import get_db_connection

#Register route with Flask app
chatting = Blueprint("chatting", __name__)

#Load environment variables
load_dotenv()

#Verify encryption key is available
FERNET_KEY = os.getenv("MESSAGE_ENCRYPTION_KEY")
fernet = Fernet(FERNET_KEY)

#Helpers to encrypt and decrypt messages
def encrypt_text(value: str | None) -> str:
    if value is None:
        value = ""
    return fernet.encrypt(value.encode()).decode()

def decrypt_text(token: str | None) -> str:
    if not token:
        return ""
    try:
        return fernet.decrypt(token.encode()).decode()
    except Exception:
        return "[decryption failed]"

#Save entered system details to database
def store_system_details(cursor, session_id, system_details):
    encrypted_details = encrypt_text(system_details)
    cursor.execute(
        """
        INSERT INTO system_details (session_id, system_details)
        VALUES (%s, %s)
        ON DUPLICATE KEY UPDATE system_details = VALUES(system_details)
        """,
        (session_id, encrypted_details)
    )

#Save sent message to database
def store_message(cursor, session_id, sender, message, timestamp):
    encrypted_message = encrypt_text(message)
    cursor.execute(
        "INSERT INTO messages (session_id, sender, message, timestamp) VALUES (%s, %s, %s, %s)",
        (session_id, sender, encrypted_message, timestamp)
    )

#Fetches message history and system details based on session ID
def get_session_history(session_id):
    conn = get_db_connection()
    if conn is None:
        return None

    with closing(conn.cursor(dictionary=True, buffered=True)) as cursor:
        #Fetch messages and decrypt
        cursor.execute("SELECT sender, message, timestamp FROM messages WHERE session_id = %s", (session_id,))
        messages = cursor.fetchall()

        for msg in messages:
            msg["message"] = decrypt_text(msg["message"])

        #Fetch system details and decrypt
        cursor.execute("SELECT * FROM system_details WHERE session_id = %s", (session_id,))
        raw_sd = cursor.fetchone()
        if raw_sd:
            raw_sd["system_details"] = decrypt_text(raw_sd["system_details"])
        system_details = raw_sd

    conn.close()

    if not messages:
        return "not_found"

    return {
        "messages": messages,
        "system_details": system_details
    }

#Fetches last 6 messages for conversation context
def get_conversation_context(session_hash, limit=6):
    conn = get_db_connection()
    if conn is None:
        return None
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT sender, message
        FROM messages
        WHERE session_id = %s
        ORDER BY timestamp DESC
        LIMIT %s
    """, (session_hash, limit))

    messages = cursor.fetchall()
    cursor.close()
    conn.close()
    return "\n".join(f"{msg['sender'].capitalize()}: {decrypt_text(msg['message'])}" for msg in reversed(messages))

#Message sent by user
@chatting.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    session_id = data["session_id"]
    user_message = data["message"]

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)

    #Save user message
    store_message(cursor, session_id, "user", user_message, datetime.utcnow())

    #Fetch Gemini answer from IEEE context and previous chat entries
    context_docs = query_papers(user_message)
    previous_chats = get_conversation_context(session_id)
    bot_reply = send_document_query(user_message, context_docs, previous_chats)

    #Save bot reply
    store_message(cursor, session_id, "bot", bot_reply, datetime.utcnow())

    conn.commit()
    cursor.close()
    conn.close()

    #Return reply for frontend display
    return jsonify({"reply": bot_reply})

#Restoring chat based on session_id
@chatting.route("/api/chat/<session_id>", methods=["GET"])
def get_chat(session_id):
    history = get_session_history(session_id)
    if history is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    if history == "not_found":
        return jsonify({"error": "Session not found"}), 404

    #Restore messages and system details
    messages = [
        {
            "sender": row["sender"],
            "message": row["message"],
            "timestamp": row["timestamp"].isoformat() if hasattr(row["timestamp"], "isoformat") else str(row["timestamp"])
        }
        for row in history["messages"]
    ]

    return jsonify({
        "messages": messages,
        "system_details": history["system_details"]["system_details"] if history["system_details"] else ""
    })

#Save entered system details to database
@chatting.route("/api/system_details", methods=["POST"])
def store_system_specs():
    data = request.json
    session_id = data["session_id"]
    system_details = data["system_details"]

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)

    store_system_details(cursor, session_id, system_details)

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"system_details": system_details}), 200