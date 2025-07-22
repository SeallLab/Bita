import React, { useState } from 'react';
import '../styles/SessionManager.css';

//Handles session restoration based on entered session ID
const SessionManager = ({ inputHash, setInputHash, tryLoadSession, startNewSession, error }) => {
  const [storedSessionIds, setStoredSessionIds] = useState(() => {
    const saved = localStorage.getItem("bita-session-ids");
    return saved ? JSON.parse(saved) : [];
  });

  const handleLoadSession = async () => {
    await tryLoadSession(); //Try to load session based on session ID

    if (error || !inputHash) return; //If there was an error, don't save the session ID

    //If session is valid, update local storage with new ID for easier entry later
    const trimmed = inputHash.trim();
    if (trimmed && !storedSessionIds.includes(trimmed)) {
      const updated = [...storedSessionIds, trimmed];
      localStorage.setItem("bita-session-ids", JSON.stringify(updated));
      setStoredSessionIds(updated);
    }
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
          value={inputHash}
          onChange={(e) => setInputHash(e.target.value)}
          placeholder="Session ID"
          className="input-box"
          style={{ marginBottom: 10 }}
          list="sessionIds"
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
          onClick={startNewSession}
          className="send-button"
        >
          Start New Session
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