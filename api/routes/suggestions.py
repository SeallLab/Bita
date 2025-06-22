from datetime import datetime
from flask import Blueprint, jsonify, request
from llm_query import send_suggestion_query
from database_connector import get_db_connection
from routes.chat import store_message

suggestions = Blueprint("suggestions", __name__)

@suggestions.route("/api/suggestions", methods=["POST"])
def find_suggestions():
    data = request.json
    session_id = data["session_id"]
    message = data["message"]

    store_message(session_id, "user", "According to my system details, what are some suggestions that you see could be possible?", datetime.utcnow())

    bot_reply = send_suggestion_query(message)

    store_message(session_id, "bot", bot_reply, datetime.utcnow())

    return jsonify({"reply": bot_reply})