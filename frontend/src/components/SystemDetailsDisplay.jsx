import React, { useState, useEffect } from 'react';
import '../styles/SystemDetailsDisplay.css';

export default function SystemDetailsDisplay({ systemDetails, setSystemDetails }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftDetails, setDraftDetails] = useState(systemDetails || "");

  //Sync draftDetails whenever systemDetails prop changes
  useEffect(() => {
    setDraftDetails(systemDetails || "");
  }, [systemDetails]);

  //Saves the system details to the backend, requires session ID in localStorage
  const saveSystemDetails = async (details) => {
    const sessionId = localStorage.getItem("session_id");
    if (!sessionId) {
      console.error("No session ID found for saving system details.");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/system_details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          system_details: details,
        }),
      });

      if (!res.ok) {
        console.error("Failed to save system details");
      }
    } catch (err) {
      console.error("Error saving system details:", err);
    }
  };

  //Handles saving details
  const handleSave = () => {
    setSystemDetails(draftDetails);
    saveSystemDetails(draftDetails);
    setIsEditing(false);
  };

  return (
    <>
      {!isEditing && (
        <div className="system-specs-floating-box">
          <div className="system-specs-header">
            <span className="specs-title">System Details</span>
            <button className="edit-btn" onClick={() => setIsEditing(true)}>✏️ Edit</button>
          </div>
          <div className="system-specs-summary">
            {systemDetails ? systemDetails : <em>No details yet</em>}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="system-specs-modal-overlay">
          <div className="system-specs-modal">
            <div className="system-specs-header">
              <h3>Edit System Details</h3>
              <button className="close-btn" onClick={() => setIsEditing(false)}>✖</button>
            </div>

            <textarea
              value={draftDetails}
              onChange={(e) => setDraftDetails(e.target.value)}
              className="system-specs-textarea"
              rows={6}
              placeholder="Describe your system: inputs, outputs, fairness concerns..."
            />

            <div className="system-specs-actions">
              <button className="save-btn" onClick={handleSave}>💾 Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}