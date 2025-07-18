import React, { useEffect, useState } from 'react';
import ReactMarkdown from "react-markdown";
import './App.css';
import { v4 as uuidv4 } from 'uuid';
import SuggestionTabs from './components/SuggestionsTabs';
import SystemSpecsDisplay from './components/SystemSpecsDisplay';
import SessionManager from './components/SessionManager';
import BitaTour from './components/BitaTour';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [sessionId, setSessionId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [inputHash, setInputHash] = useState("");
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemSpecs, setSystemSpecs] = useState("");
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (confirmed && sessionId) {
      localStorage.setItem("session_id", sessionId);
      fetchChat(sessionId).then((loaded) => {
        if (loaded?.length === 0) {
          //No messages yet, show intro
          const introMessage = {
            sender: "bot",
            message: "Hi there! I'm Bita. You can ask me about system testing, bias detection, or anything related to your project setup. How can I help today?"
          };
          setMessages([introMessage]);
        }
      });
    }
  }, [confirmed, sessionId]);

  const fetchChat = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "An unknown error occurred.");
        setMessages([]);
        setSystemSpecs("");
        return [];
      }

      const data = await res.json();
      setMessages(data.messages);
      setSystemSpecs(data.system_details);
      setError(null);
      return data.messages;
    } catch (err) {
      setError("Unable to connect to the server.");
      return [];
    }
  };

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
      setMessages(data.messages);
      setSystemSpecs(data.system_details);
      setConfirmed(true);
      setError(null);
    } catch (err) {
      setError("Failed to connect to the server.");
    }
  };

  const saveSystemSpecs = async (specs) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/system_details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          system_details: specs,
        })
      });

      if (!res.ok) {
        console.error("Failed to save system details");
      }
    } catch (err) {
      console.error("Error saving system details:", err);
    }
  };

  if (!confirmed) {
    return (
      <SessionManager
        inputHash={inputHash}
        setInputHash={setInputHash}
        tryLoadSession={tryLoadSession}
        startNewSession={() => {
          setSessionId(uuidv4());
          setConfirmed(true);
          setError(null);
        }}
        error={error}
      />
    );
  }

  return (
    <div className="app-container">
      <BitaTour run={runTour} setRun={setRunTour} />

      <div className="app-inner">
        {/* Header */}
        <div className="app-header">
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
            saveSystemSpecs={saveSystemSpecs}
          />
      </div>
    </div>
  );
}

export default App;