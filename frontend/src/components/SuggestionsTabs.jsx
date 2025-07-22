import React, { useState } from "react";
import PlanCheckModal from './PlanCheckModal';
import "../styles/SuggestionsTabs.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

//Handles the suggestion buttons, and the specific prompts that are sent for each button
export default function SuggestionTabs({ systemSpecs, sessionId, updateMessages, loadingStatus}) {
  const [activeTab, setActiveTab] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = async (type) => {
    if (!systemSpecs) {
      alert("Please enter your system specs first.");
      return;
    }

    loadingStatus(true);
    setActiveTab(type);

    let userMessage = "";
    let systemMessage = "";

    //Plan Check handled below, handles opening modal and submitting with message
    switch (type) {
      case 1:
        userMessage = "According to my system details, what are some biases that you see could be possible?";
        systemMessage = `Given this system context: "${systemSpecs}", what are the possible fairness or bias issues to watch for? Follow this format, listing 5-10 possible bugs:
        
          (Paragraph about components that could cause bias)
          Here are some bugs that could occur from ___ bias:
          **Bug ___**: List the bug here
          **Bug ___**: List the bug here
          
          Follow this structure exactly, with minimal spacing between each bug entry and spacing between each type of bias.`;
        break;
      case 3:
        userMessage = "Can you generate some exploratory testing charters?";
        systemMessage = `Based on this system and its context: "${systemSpecs}", can you generate 3-5 exploratory testing charters I can use? Use this formatting:
          **Charter ___:**
          ***Goal:*** Description of what to test.
          ***Time:*** How long keep testing
          ***Focus:***
          -Use dash '-' for each item (not bullets).
          -Keep spacing tight, no empty lines between items.

          Only return the charter content — no extra commentary.`;
        break;
      default:
        return;
    }

    updateMessages(prev => [...prev, { sender: "user", message: userMessage }]);

    try {
      const res = await fetch(`${BACKEND_URL}/api/suggestions`, {
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

  //Plan check handled here, has custom LLM message and modal logic
  const handlePlanSubmit = async (planText) => {
    setIsModalOpen(false);
    loadingStatus(true);

    updateMessages(prev => [...prev, { sender: "user", message: "Can you review my testing plan for fairness and bias support?" }]);

    const systemMessage = `Please review the following plan and provide feedback on its fairness evaluation aspects:\n\n${planText.text}`;

    loadingStatus(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: systemMessage }),
      });

      const data = await res.json();
      updateMessages(prev => [...prev, { sender: "bot", message: data.reply }]);
    } catch (err) {
      console.error("Plan check failed:", err);
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
        onClick={() => {
          setIsModalOpen(true)
          setActiveTab(2); //Normally handled in handleClick
        }}
        active={activeTab === 2}
      />

      {isModalOpen && (
        <PlanCheckModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handlePlanSubmit}
        />
      )}

      <SuggestionButton
        label="Testing Charters"
        description="Generate exploratory test ideas for fairness"
        onClick={() => handleClick(3)}
        active={activeTab === 3}
      />
    </div>
  );
}