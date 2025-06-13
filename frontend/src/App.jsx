import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL = "http://localhost:5000";

function App() {
  const [sessionId, setSessionId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [inputHash, setInputHash] = useState("");
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  //Only fetch chat once sessionId is confirmed
  useEffect(() => {
    if (confirmed && sessionId) {
      localStorage.setItem("session_id", sessionId);
      fetchChat(sessionId);
    }
  }, [confirmed, sessionId]);

  const fetchChat = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "An unknown error occurred.");
        setMessages([]);  //clear previous state
        return;
      }

      const data = await res.json();
      setMessages(data);
      setError(null);  //clear error if success
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
      setError("Unable to connect to the server.");
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);

    const userMsg = input;
    setMessages((prev) => [...prev, { sender: "user", message: userMsg }]);
    setInput("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: userMsg })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", message: data.reply }]);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  const tryLoadSession = async () => {
    const hash = inputHash.trim();
    if (!hash) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/${hash}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Invalid session.");
        return;
      }

      const data = await res.json();
      setSessionId(hash);
      setMessages(data);
      setConfirmed(true); //Only now allow user into the chat
      setError(null);
    } catch (err) {
      setError("Failed to connect to the server.");
    }
  };

  //Prompt user for session hash
  if (!confirmed) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Enter or Create a Conversation Hash</h2>

        <input
          value={inputHash}
          onChange={(e) => {
            setInputHash(e.target.value);
            setError(null);
          }}
          placeholder="Paste an existing session hash"
          style={{ marginRight: 10, width: "60%" }}
        />
        <button onClick={tryLoadSession}>Load Session</button>

        <span style={{ margin: "0 10px" }}>or</span>
        <button
          onClick={() => {
            const newId = uuidv4();
            setSessionId(newId);
            setConfirmed(true);
            setError(null);
          }}
        >
          Start New Session
        </button>

        {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>AI Fairness Bot</h2>
      <div style={{ fontSize: 14, marginBottom: 8, color: "#777" }}>
        Session ID: <code>{sessionId}</code>
      </div>
      <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 300, marginBottom: 10 }}>
        {(
          messages.map((m, i) => (
            <div key={i} style={{ margin: "8px 0" }}>
              <strong>{m.sender === "user" ? "You" : "Bot"}:</strong> {m.message}
            </div>
          ))
        )}
        {loading && <div><em>Bot is thinking...</em></div>}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "80%", marginRight: 10 }}
        placeholder="Ask a question about fairness..."
      />
      <button onClick={sendMessage} disabled={loading}>Send</button>
    </div>
  );
}

export default App;