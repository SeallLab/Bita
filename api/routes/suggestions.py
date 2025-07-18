from datetime import datetime
from flask import Blueprint, jsonify, request
from source_fetching import query_papers
from llm_query import send_suggestion_query
from database_connector import get_db_connection
from routes.chat import store_message

suggestions = Blueprint("suggestions", __name__)

@suggestions.route("/api/suggestions", methods=["POST"])
def find_suggestions():
    data = request.json
    session_id = data["session_id"]
    message = data["message"]

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)

    store_message(cursor, session_id, "user", "According to my system details, what are some suggestions that you see could be possible?", datetime.utcnow())

    context_docs = query_papers(message)
    bot_reply = send_suggestion_query(message, context_docs)

    store_message(cursor, session_id, "bot", bot_reply, datetime.utcnow())

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"reply": bot_reply})