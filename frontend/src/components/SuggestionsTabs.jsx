import React from 'react';

const BACKEND_URL = "http://localhost:5000";

/*A loan approval system that takes user data and decides if they should be approved and how much they should be approved for. The system takes in data like age, race, gender, current employment status, among other personal pieces of data.*/

const bubbleStyle = {
  position: "relative",
  borderRadius: 20,
  padding: "10px 16px",
  background: "#2c3e50",
  color: "#a0c4ff",
  border: "1px solid #34495e",
  cursor: "pointer",
  transition: "all 0.2s ease",
  textAlign: "center",
};

const tooltipStyle = {
  visibility: "hidden",
  width: 200,
  backgroundColor: "#1a1a1a",
  color: "#a0c4ff",
  textAlign: "center",
  borderRadius: 6,
  padding: "8px",
  position: "absolute",
  zIndex: 1,
  bottom: "-50px",
  left: "50%",
  transform: "translateX(-50%)",
  fontSize: 12,
  opacity: 0,
  transition: "opacity 0.3s",
};

const wrapperStyle = {
  position: "relative",
  display: "inline-block",
};

const showTooltip = {
  ...tooltipStyle,
  visibility: "visible",
  opacity: 1,
};

function SuggestionButton({ label, description, onClick }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      style={wrapperStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button style={bubbleStyle} onClick={onClick}>
        {label}
      </button>
      <div style={hovered ? showTooltip : tooltipStyle}>
        {description}
      </div>
    </div>
  );
}

export default function SuggestionTabs({ systemSpecs, sessionId, updateMessages, loadingStatus }) {
  const handleClick = async (type) => {
    if (!systemSpecs) {
      alert("Please enter your system specs first.");
      return;
    }

    loadingStatus(true);

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

    //Add user message
    updateMessages(prev => [...prev, { sender: "user", message: userMessage }]);

    try {
      const res = await fetch(`${BACKEND_URL}/api/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: systemMessage })
      });

      const data = await res.json();

      //Add bot message
      updateMessages(prev => [...prev, { sender: "bot", message: data.reply }]);
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      loadingStatus(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
      <SuggestionButton
        label="Bias Detection"
        description="Identify potential unfair treatment in your system"
        onClick={() => handleClick(1)}
      />
      <SuggestionButton
        label="Plan Check"
        description="Evaluate if your testing plan is missing key aspects"
        onClick={() => handleClick(2)}
      />
      <SuggestionButton
        label="Testing Charters"
        description="Generate exploratory test ideas for fairness"
        onClick={() => handleClick(3)}
      />
    </div>
  );
}