import React, { useState } from 'react';
import '../styles/PlanCheckModal.css';

export default function PlanCheckModal({ isOpen, onClose, onSubmit }) {
  const [planText, setPlanText] = useState('');
  const [showExample, setShowExample] = useState(false);

  const handleSubmit = () => {
    const trimmed = planText.trim();
    if (!trimmed) {
        alert("Please enter your plan before submitting.");
        return;
    }

    const input = {
      text: trimmed,
    };
    onSubmit(input);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="plan-modal-overlay">
      <div className="plan-modal">
        <h2>Submit Your Testing Plan</h2>
        <p className="plan-modal-subtext">Paste your plan below.</p>

        <textarea
          value={planText}
          onChange={(e) => setPlanText(e.target.value)}
          placeholder="Describe your plan here..."
          className="plan-textarea"
        />

        <div className="plan-modal-actions">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button 
            className="submit-button" onClick={handleSubmit}>Submit Plan</button>
        </div>

        <div className="tutorial-container">
          {showExample && (
            <div className="example-plan">
                <h3>Testing fairness in an online loan approval system.</h3>

                <h4>Inputs & Goals:</h4>
                <ul>
                    <li>Input user financial and demographic data</li>
                    <li>Assess loan approval decisions for bias</li>
                    <li>Ensure equitable treatment across groups</li>
                </ul>

                <h4>Outputs & Testing Focus:</h4>
                <ul>
                    <li>Report approval rates by demographic</li>
                    <li>Identify unfair denial patterns</li>
                    <li>Recommend improvements to reduce bias</li>
                </ul>
            </div>
          )}
          <button
            className="tutorial-button"
            onClick={() => setShowExample(!showExample)}
          >
            {showExample ? "Hide Example" : "Not Sure?"}
          </button>
        </div>
      </div>
    </div>
  );
}