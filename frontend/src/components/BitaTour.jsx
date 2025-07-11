// src/components/BitaTour.jsx
import React from 'react';
import Joyride from 'react-joyride';

export default function BitaTour({ run, setRun }) {
  const steps = [
    {
      target: ".app-header",
      content: "Welcome to Bita! This tool helps you find fairness issues in AI systems.",
      disableBeacon: true,
    },
    {
      target: ".session-id",
      content: "This is your session ID — you can share or return to it later to continue your chat.",
      disableBeacon: true,
    },
    {
      target: ".chat-area",
      content: "Use this chat to ask Bita questions about your system.",
      disableBeacon: true,
    },
    {
      target: ".suggestion-bubbles",
      content: "Click a suggestion to guide your analysis based on your system results!",
      disableBeacon: true,
    },
    {
      target: ".input-box",
      content: "Type your own custom questions here.",
      disableBeacon: true,
    },
    {
      target: ".send-button",
      content: "Click here to send your question to Bita.",
      disableBeacon: true,
    },
    {
      target: ".system-specs-floating-box",
      content: "You can update your system details here at any time. These are used with the suggestions to improve your current system design.",
      placement: "left-start",
      disableBeacon: true,
      spotlightPadding: 10,
      styles: {
        options: {
          width: 300
        }
      }
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
      disableScrolling
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#3c5f7f"
        }
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour"
      }}
      callback={(data) => {
        if (['finished', 'skipped'].includes(data.status)) {
          setRun(false);
        }
      }}
    />
  );
}