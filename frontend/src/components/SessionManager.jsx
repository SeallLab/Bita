import React, { useEffect, useState } from "react";
import '../styles/SessionManager.css';
import { v4 as uuidv4 } from "uuid";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

//Handles session restoration based on entered session ID
const SessionManager = ({ onSessionReady }) => {
  const [inputHash, setInputHash] = useState("");
  const [storedSessionIds, setStoredSessionIds] = useState([]);
  const [error, setError] = useState(null);

  //Load saved session IDs from localStorage on first render
  useEffect(() => {
    const saved = localStorage.getItem("bita-session-ids");
    const parsed = saved ? JSON.parse(saved) : [];

    setStoredSessionIds(parsed);

    //Autofill the last used session ID if none is entered yet
    if (parsed.length > 0 && (!inputHash || inputHash.trim() === "")) {
      setInputHash(parsed[parsed.length - 1]);
    }
  }, []);

  //Attempt to load a session from the backend
  const handleLoadSession = async () => {
    const hash = inputHash.trim();
    if (!hash) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/${hash}`);

      if (res.status === 404) {
        //Session not found, silently ignore error
        setError("No Session Found");
        return; 
      }

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Invalid session.");
        return;
      }

      const data = await res.json();
      const trimmed = hash;

      if (!storedSessionIds.includes(trimmed)) {
        const updated = [...storedSessionIds, trimmed];
        localStorage.setItem("bita-session-ids", JSON.stringify(updated));
        setStoredSessionIds(updated);
      }

      //Notify parent component
      onSessionReady({
        sessionId: trimmed,
        systemDetails: data.system_details,
        messages: data.messages
      });

      setError(null);
    } catch (err) {
      setError("Failed to connect to the server.");
    }
  };

  //Start a new session with a generated UUID
  const handleStartNewSession = () => {
    const newId = uuidv4();
    onSessionReady({
      sessionId: newId,
      systemDetails: "",
      messages: [{
        sender: "bot",
        message: "Hi there! I'm Bita. You can ask me about fairness testing and bias detection. How can I help today?"
      }]
    });

    const updated = [...storedSessionIds, newId];
    localStorage.setItem("bita-session-ids", JSON.stringify(updated));
    setStoredSessionIds(updated);
    setInputHash(newId);
    setError(null);
  };

  return (
    <div className="app-container">
      <div className="session-manager-inner">
        {/* Intro Box */}
        <div className="intro-box">
          <h2 style={{ marginTop: 0 }}>Hi! I'm Bita 👋</h2>
          <p>
            Bita helps software testers explore AI systems for potential fairness issues. 
            Enter a session ID below to continue your previous work, or start a new session to begin analyzing your system. 
            I’ll guide you through identifying biases, evaluating fairness criteria, and documenting issues.
          </p>
        </div>

        {/* Session ID Input */}
        <label htmlFor="session-id-input" style={{ color: "#ccc", fontSize: 14 }}>
          Enter Session ID to Load:
        </label>
        <input
          id="session-id-input"
          type="text"
          list="sessionIds"
          value={inputHash}
          onChange={(e) => setInputHash(e.target.value)}
          placeholder="Session ID"
          className="input-box"
          style={{ marginBottom: 10 }}
        />
        <datalist id="sessionIds">
          {storedSessionIds.map((id) => (
            <option key={id} value={id} />
          ))}
        </datalist>

        <button
          onClick={handleLoadSession}
          className="send-button"
          style={{ marginBottom: 10 }}
        >
          Load Session
        </button>

        <div style={{ textAlign: "center", margin: "10px 0", color: "#888" }}>OR</div>

        <button
          onClick={handleStartNewSession}
          className="send-button"
        >
          Start New Session
        </button>

        <button
          onClick={() => {
            localStorage.removeItem("bita-session-ids");
            setStoredSessionIds([]);
            setInputHash("");
            setError("Stored Sessions Cleared");
          }}
          className="clear-button"
        >
          Clear Saved Sessions
        </button>

        {error && (
          <div style={{ color: "#ff6b6b", fontSize: 14, marginTop: 10, textAlign: "center" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManager;