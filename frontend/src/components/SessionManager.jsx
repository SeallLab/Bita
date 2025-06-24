import React from 'react';
import '../styles/SessionManager.css';

const SessionManager = ({ inputHash, setInputHash, tryLoadSession, startNewSession, error }) => {
  return (
    <div className="app-container">
      <div className="session-manager-inner">
        <h2>Hi! I'm Bita</h2>

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
        />
        <button
          onClick={tryLoadSession}
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