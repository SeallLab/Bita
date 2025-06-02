import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL = "http://localhost:5000";

function App() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  //On load, create session ID and fetch chat
  useEffect(() => {
    let storedId = localStorage.getItem("session_id");
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem("session_id", storedId);
    }
    setSessionId(storedId);
    fetchChat(storedId);
  }, []);

  const fetchChat = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/${id}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
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

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>AI Fairness Bot</h2>
      <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 300, marginBottom: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: "8px 0" }}>
            <strong>{m.sender === "user" ? "You" : "Bot"}:</strong> {m.message}
          </div>
        ))}
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