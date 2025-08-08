import React, { useEffect, useState } from 'react';
import ReactMarkdown from "react-markdown";
import './App.css';
import BitaLogo from "./images/Bita.svg";
import SuggestionTabs from './components/SuggestionsTabs';
import SystemSpecsDisplay from './components/SystemSpecsDisplay';
import SessionManager from './components/SessionManager';
import BitaTour from './components/BitaTour';

const BACKEND_URL = "http://localhost:5000";

function App() {
  const [sessionId, setSessionId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemSpecs, setSystemSpecs] = useState("");
  const [runTour, setRunTour] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);

    const userMsg = input;
    setMessages(prev => [...prev, { sender: "user", message: userMsg }]);
    setInput("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: "bot", message: data.reply }]);
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!confirmed) {
    return (
      <SessionManager
        onSessionReady={({ sessionId, systemSpecs, messages }) => {
          setSessionId(sessionId);
          setSystemSpecs(systemSpecs);
          setMessages(messages);
          setConfirmed(true);
          localStorage.setItem("session_id", sessionId);
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <BitaTour run={runTour} setRun={setRunTour} />

      <div className="app-inner">
        {/* Header */}
        <div className="app-header">
          <img className="bita-logo" src={BitaLogo} alt="Bita Logo" />
          <h2>Bita</h2>
          <button
            onClick={() => setRunTour(true)}
            style={{
              marginLeft: "auto",
              backgroundColor: "#3c5f7f",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            How to Use Bita
          </button>
        </div>

        <div className="session-id">
          Session ID: <code>{sessionId}</code>
        </div>

        <div className="chat-area">
          <div className="chat-box">
            {messages.map((m, i) => (
              <div key={i} className="chat-message">
                <strong className={m.sender === "user" ? "message-user" : "message-bot"}>
                  {m.sender === "user" ? "You" : "Bita"}:
                </strong>{" "}
                <div className="message-text">
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <span {...props} />,  //replace <p> with <span> for no spacing
                      br: () => <br style={{ marginBottom: '0.2em' }} />, //reduce <br> spacing
                    }}
                  >
                    {m.message}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && <div style={{ color: "#888" }}><em>Bita is thinking...</em></div>}
          </div>
            
          <div className="suggestion-bubbles">
            <SuggestionTabs 
              systemSpecs={systemSpecs} 
              sessionId={sessionId} 
              updateMessages={setMessages} 
              loadingStatus={setLoading} 
            />
          </div>

          <div className="input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="input-box"
              placeholder="Ask Bita something..."
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="send-button"
            >
              Send
            </button>
          </div>
        </div>

        <SystemSpecsDisplay
            systemSpecs={systemSpecs}
            setSystemSpecs={setSystemSpecs}
          />
      </div>
    </div>
  );
}

export default App;