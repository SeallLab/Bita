import React, { useState } from "react";
import "../styles/SuggestionsTabs.css";

function SuggestionButton({ label, description, onClick, active }) {
  return (
    <div className="suggestion-wrapper">
      <button
        className={`suggestion-button ${active ? "active" : ""}`}
        onClick={onClick}
      >
        {label}
      </button>
      <div className="suggestion-tooltip">{description}</div>
    </div>
  );
}

export default function SuggestionTabs({ systemSpecs, sessionId, updateMessages, loadingStatus }) {
  const [activeTab, setActiveTab] = useState(null);

  const handleClick = async (type) => {
    if (!systemSpecs) {
      alert("Please enter your system specs first.");
      return;
    }

    loadingStatus(true);
    setActiveTab(type);

    let userMessage = "";
    let systemMessage = "";

    switch (type) {
      case 1:
        userMessage = "According to my system details, what are some biases that you see could be possible?";
        systemMessage = `Given this system context: "${systemSpecs}", what are the possible fairness or bias issues to watch for?`;
        break;
      case 2:
        userMessage = "Can you review my testing plan?";
        systemMessage = `Here are my system specs and test plan: "${systemSpecs}". Is there anything missing in this testing plan from a fairness perspective?`;
        break;
      case 3:
        userMessage = "Can you generate some exploratory testing charters?";
        systemMessage = `Based on this system and its context: "${systemSpecs}", can you generate some exploratory testing charters I can use?`;
        break;
      default:
        return;
    }

    updateMessages(prev => [...prev, { sender: "user", message: userMessage }]);

    try {
      const res = await fetch(`http://localhost:5000/api/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: systemMessage })
      });

      const data = await res.json();
      updateMessages(prev => [...prev, { sender: "bot", message: data.reply }]);
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      loadingStatus(false);
    }
  };

  return (
    <div className="suggestion-tabs">
      <SuggestionButton
        label="Bias Detection"
        description="Identify potential unfair treatment in your system"
        onClick={() => handleClick(1)}
        active={activeTab === 1}
      />
      <SuggestionButton
        label="Plan Check"
        description="Evaluate if your testing plan is missing key aspects"
        onClick={() => handleClick(2)}
        active={activeTab === 2}
      />
      <SuggestionButton
        label="Testing Charters"
        description="Generate exploratory test ideas for fairness"
        onClick={() => handleClick(3)}
        active={activeTab === 3}
      />
    </div>
  );
}