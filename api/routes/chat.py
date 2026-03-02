from contextlib import closing
from datetime import datetime
import os
from cryptography.fernet import Fernet
import uuid
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from llm.llm_query import send_document_query
from rag.paper_query import query_papers
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
def store_system_details(session_id, system_details):
    try:
        #Check if ID entered is valid format
        try:
            session_uuid = str(uuid.UUID(session_id))
        except ValueError:
            return jsonify({"error": "Invalid session ID format."}), 400
        
        #Encryot system details
        encrypted_details = encrypt_text(system_details)

        db = get_db_connection()
        if db is None:
            return jsonify({"error": "Database connection failed."}), 500
        
        system_details_collection = db["system_details"]

        #Update system details based on ID
        system_details_collection.update_one(
            {"session_id": session_uuid},
            {"$set": {"system_details": encrypted_details}},
            upsert=True
        )
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
        
        encrypted_message = encrypt_text(message)

        db = get_db_connection()
        if db is None:
            return jsonify({"error": "Database connection failed."}), 500
        
        #Add message with details, based on ID
        messages_collection = db["messages"]

        messages_collection.insert_one({
            "session_id": session_uuid,
            "sender": sender,
            "message": encrypted_message,
            "timestamp": timestamp if isinstance(timestamp, datetime)
                        else datetime.fromisoformat(str(timestamp))
        })
    except Exception as err:
        return jsonify({"error": f"Database error: {err}"}), 500

#Fetches message history based on session ID
def get_session_history(session_id):
    #Create supabase connection and fetch messages and system details based on ID
    try:
        db = get_db_connection()

        messages_collection = db["messages"]
        system_collection = db["system_details"]

        message_response = list(messages_collection.find({"session_id": session_id}, {"_id": 0}))
        system_response = list(system_collection.find({"session_id": session_id}, {"_id": 0}))
    except Exception as err:
        print(f"Database error: {err}")
        return None

    #No messages found, new session created
    if not message_response:
        return "not_found"

    decrypted_messages = []
    for msg in message_response:
        decrypted_messages.append({
            "sender": msg["sender"],
            "message": decrypt_text(msg["message"]),
            "timestamp": msg["timestamp"],
        })

    # Decrypt system details
    system_details_list = system_response or []
    if system_details_list:
        system_details_list[0]["system_details"] = decrypt_text(system_details_list[0].get("system_details"))

    #Session found, return
    return {
        "messages": decrypted_messages,
        "system_details": system_details_list
    }

#Fetch last 6 chats to feed to LLM for previous conversation context
def get_conversation_context(session_hash, limit=6):
    try:
        db = get_db_connection()

        messages_collection = db["messages"]

        response = list(messages_collection
            .find({"session_id": session_hash}, {"_id": 0, "sender": 1, "message": 1})
            .sort("timestamp", -1) #descending
            .limit(limit)
        )
    except Exception as err:
        return jsonify({"error": f"Database error: {err}"}), 500

    #Return messages in chronological order, decrypt first
    messages = list(reversed(response))
    return "\n".join(f"{m['sender'].capitalize()}: {decrypt_text(m['message'])}" for m in messages)

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