from datetime import datetime
from flask import Blueprint, jsonify, request
from llm_query import send_query
from source_fetching import query_papers
from database_connector import get_db_connection

#Register route with Flask app
chatting = Blueprint("chatting", __name__)

#Save sent message to database
def store_message(cursor, session_id, sender, message, timestamp):
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
    return "\n".join(f"{msg['sender'].capitalize()}: {msg['message']}" for msg in reversed(messages))

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
    bot_reply = send_query(user_message, context_docs, previous_chats, "gemini")

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
    history = get_messages(session_id)
    if history is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    if history == "not_found":
        return jsonify([])

    return jsonify([
        {
            "sender": row["sender"],
            "message": row["message"],
            "timestamp": row["timestamp"].isoformat() if hasattr(row["timestamp"], "isoformat") else str(row["timestamp"])
        }
        for row in history
    ])