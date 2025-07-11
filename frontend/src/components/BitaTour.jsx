// src/components/BitaTour.jsx
import React from 'react';
import Joyride from 'react-joyride';

export default function BitaTour({ run, setRun }) {
  const steps = [
    {
      target: ".app-header",
      content: "Welcome to Bita! This tool helps you find fairness issues in AI systems.",
    },
    {
      target: ".session-id",
      content: "This is your session ID — you can share or return to it later to continue your chat.",
    },
    {
      target: ".chat-area",
      content: "Use this chat to ask Bita questions about your system.",
    },
    {
      target: ".suggestion-bubbles",
      content: "Click a suggestion to guide your analysis based on your system results!",
    },
    {
      target: ".input-box",
      content: "Type your own custom questions here.",
    },
    {
      target: ".send-button",
      content: "Click here to send your question to Bita.",
    },
    {
      target: ".system-specs-floating-box",
      content: "You can update your system details here at any time. These are used with the suggestions to improve your current system design.",
    }
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showSkipButton
      showProgress
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#3c5f7f"
        }
      }}
      callback={(data) => {
        if (['finished', 'skipped'].includes(data.status)) {
          setRun(false);
        }
      }}
    />
  );
}