import React from 'react';

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

// Tooltip style
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

// Wrapper to handle tooltip visibility
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

export default function SuggestionTabs({ onSelect }) {
  const handleClick = (type) => {
    if (!systemSpecs) {
      alert("Please enter your system specs first.");
      return;
    }

    let message = "";
    switch (type) {
      case 1:
        message = `Given this system context: "${systemSpecs}", what are the possible fairness or bias issues to watch for?`;
        break;
      case 2:
        message = `Here are my system specs and test plan: "${systemSpecs}". Is there anything missing in this testing plan from a fairness perspective?`;
        break;
      case 3:
        message = `Based on this system and its context: "${systemSpecs}", can you generate some exploratory testing charters I can use?`;
        break;
      default:
        return;
    }

    onSelect(message);
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