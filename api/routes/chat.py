from contextlib import closing
from datetime import datetime
import uuid
from flask import Blueprint, jsonify, request
from llm_query import send_document_query
from vector_search import query_papers
from database_connector import get_db_connection

#Register route with Flask app
chatting = Blueprint("chatting", __name__)

#Save entered system details to database
def store_system_details(session_id, system_details):
    try:
        #Check if ID entered is valid format
        try:
            session_uuid = str(uuid.UUID(session_id))
        except ValueError:
            return jsonify({"error": "Invalid session ID format."}), 400

        #Create supabase connection and update system details based on ID
        supabase = get_db_connection()
        supabase.table("system_details").insert({
            "session_id": session_uuid,
            "system_details": system_details
        }).execute()
    except Exception as err:
        return jsonify({"error": f"Database error: {err}"}), 500

#Saves message into database for chat retrieval
def store_message(session_id, sender, message, timestamp):
    try:
        #Check if ID entered is valid format
        try:
            session_uuid = str(uuid.UUID(session_id))
        except ValueError:
            return jsonify({"error": "Invalid session ID format."}), 400
        
        #Create supabase connection and add message with details, based on ID
        supabase = get_db_connection()
        supabase.table("messages").insert({
            "session_id": session_uuid,
            "sender": sender,
            "message": message,
            "timestamp": timestamp.isoformat()
        }).execute()
    except Exception as err:
        return jsonify({"error": f"Database error: {err}"}), 500

#Fetches message history based on session ID
def get_session_history(session_id):
    #Create supabase connection and fetch messages and system details based on ID
    try:
        supabase = get_db_connection()
        message_response = supabase.table("messages").select("*").eq("session_id", session_id).execute()
        system_response = supabase.table("system_details").select("*").eq("session_id", session_id).execute()
    except Exception as err:
        print(f"Database error: {err}")
        return None

    #No messages found, new session created
    if not message_response.data:
        return "not_found"

    #Session found, return
    return {
        "messages": message_response.data or [],
        "system_details": system_response.data or []
    }

#Fetch last 6 chats to feed to LLM for previous conversation context
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

    #Return messages in chronological order
    messages = list(reversed(response.data))
    return "\n".join(f"{m['sender'].capitalize()}: {m['message']}" for m in messages)

#Message sent by user
@chatting.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    session_id = data["session_id"]
    user_message = data["message"]

    #Check session ID is valid format
    session_uuid = str(uuid.UUID(session_id))

    #Save user message
    store_message(session_uuid, "user", user_message, datetime.utcnow())

    #Fetch Gemini answer from IEEE context and previous chat entries
    context_docs = query_papers(user_message)
    previous_chats = get_conversation_context(session_id)
    bot_reply = send_document_query(user_message, context_docs, previous_chats)

    #Save bot reply
    store_message(session_uuid, "bot", bot_reply, datetime.utcnow())

    #Return reply for frontend display
    return jsonify({"reply": bot_reply})

#Restoring chat based on session_id
@chatting.route("/api/chat/<session_id>", methods=["GET"])
def get_chat(session_id):
    #Check if ID entered is valid format
    try:
        _ = str(uuid.UUID(session_id))
    except ValueError:
        return jsonify({"error": "Invalid session ID format"}), 400

    #Fetch session data based on ID (Messages, system details)
    history = get_session_history(session_id)
    if history is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    #No history found
    if history == "not_found":
        return jsonify({"error": "Session not found"}), 404

    #Return formatted messages
    messages = [
        {
            "sender": row["sender"],
            "message": row["message"],
            "timestamp": row["timestamp"].isoformat() if hasattr(row["timestamp"], "isoformat") else str(row["timestamp"])
        }
        for row in history["messages"]
    ]

    #Return formatted system details
    system_details_list = history.get("system_details")
    system_details_value = ""

    #If system details are not empty
    if isinstance(system_details_list, list) and len(system_details_list) > 0:
        system_details_value = system_details_list[0].get("system_details", "")

    return jsonify({
        "messages": messages,
        "system_details": system_details_value
    })

#Save entered system details to database
@chatting.route("/api/system_details", methods=["POST"])
def store_system_specs():
    data = request.json
    session_id = data["session_id"]
    system_details = data["system_details"]

    store_system_details(session_id, system_details)

    return jsonify({"system_details": system_details}), 200