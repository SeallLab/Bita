import React, { useState, useEffect } from 'react';
import '../styles/SystemSpecsDisplay.css';

export default function SystemSpecsDisplay({ systemSpecs, setSystemSpecs, saveSystemSpecs }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftSpecs, setDraftSpecs] = useState(systemSpecs || "");

  useEffect(() => {
      setDraftSpecs(systemSpecs || "");
    }, [systemSpecs]);

  //Updates database with system details, sets frontend system details to new specs
  const handleSave = () => {
    setSystemSpecs(draftSpecs);
    saveSystemSpecs(draftSpecs);
    setIsEditing(false);
  };

  return (
    <>
      {/* Small summary box in corner */}
      {!isEditing && (
        <div className="system-specs-floating-box">
          <div className="system-specs-header">
            <span className="specs-title">System Details</span>
            <button className="edit-btn" onClick={() => setIsEditing(true)}>✏️ Edit</button>
          </div>
          <div className="system-specs-summary">
            {systemSpecs ? systemSpecs : <em>No details yet</em>}
          </div>
        </div>
      )}

      {/*Modal when editing*/}
      {isEditing && (
        <div className="system-specs-modal-overlay">
          <div className="system-specs-modal">
            <div className="system-specs-header">
              <h3>Edit System Specs</h3>
              <button className="close-btn" onClick={() => setIsEditing(false)}>✖</button>
            </div>

            <textarea
              value={draftSpecs}
              onChange={(e) => setDraftSpecs(e.target.value)}
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