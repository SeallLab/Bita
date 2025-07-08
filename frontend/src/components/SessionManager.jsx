import React from 'react';
import '../styles/SessionManager.css';

const SessionManager = ({ inputHash, setInputHash, tryLoadSession, startNewSession, error }) => {
  const [storedSessionIds, setStoredSessionIds] = React.useState(() => {
    const saved = localStorage.getItem("bita-session-ids");
    return saved ? JSON.parse(saved) : [];
  });

  const handleLoadSession = async () => {
    await tryLoadSession(); //Try to load session based on session ID

    if (error || !inputHash) return; //If there was an error, don't save the session ID

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
        <h2>Hi! I'm Bita</h2>

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