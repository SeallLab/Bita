# Bita by Plurise Labs

## Overview
**Bita** is a standalone conversational application designed to assist software testers in identifying and addressing fairness and bias issues within systems, particularly those involving machine learning models. The application leverages natural language interaction to guide exploratory testing, suggest test cases, log results, and generate structured reports.

This tool is especially useful in contexts where systems may produce unequal outcomes across demographic or sensitive attributes, aligning with research in fairness-aware software engineering and responsible AI.

---

## Features

### Conversational Testing Assistant
- Natural language interface for interacting with the system
- Provides context-aware suggestions during testing sessions
- Offers explanations and clarifications when inputs are unclear

### Fairness-Focused Test Suggestions
- Generates targeted test cases to uncover bias
- Encourages variation of sensitive attributes (e.g., location, demographics)
- Adapts suggestions based on prior interactions and testing history

### Exploratory Testing Support
- Guides users through exploratory testing workflows
- Suggests next steps and follow-up questions
- Helps identify edge cases and fairness concerns

### Test Case Logging
- Log test inputs, outputs, and observations
- Add notes and annotations for future reference
- Maintain persistent session history

### Report Generation
- Automatically compiles structured reports from test sessions
- Includes:
  - Test objectives
  - Inputs and variations
  - Observed outcomes
  - Identified fairness concerns
- Exportable for reuse across projects

### Adaptive Learning
- Learns from previous sessions and interactions
- Personalizes suggestions based on user behavior
- Enables continuation of past testing sessions

---

## System Design

The application functions as a **standalone conversational system** that integrates:

- User inputs and interaction history
- Logged test cases and notes
- Context-aware suggestion generation
- Report compilation and export

The workflow includes:
1. **Start a Session** – Define the system under test and testing goals  
2. **Receive Suggestions** – Get fairness-oriented test ideas  
3. **Log Results** – Record outcomes and observations  
4. **Iterate** – Continue exploration with adaptive guidance  
5. **Generate Report** – Produce a structured summary of findings  

---

## Example Use Case

**Scenario:** Testing a housing price prediction model for bias.

**User Input:**
> “I am testing a housing application that predicts prices based on location and neighbourhood. I want to ensure there is no bias. What tests should I run?”

**Bot Suggestion:**
- Modify location while keeping other variables constant
- Compare outputs across neighborhoods
- Log discrepancies and flag potential bias

---

## User Stories

- Create and manage exploratory testing sessions  
- Receive intelligent suggestions for fairness testing  
- Log and annotate test cases  
- Resume previous testing sessions  
- Generate formal reports summarizing findings  
- Ask questions about fairness testing concepts  
- Receive feedback on insufficient or unclear inputs  

---

## Research Foundation

This application is grounded in research on:
- **Fairness in Machine Learning** (e.g., Barocas et al., 2019)
- **Exploratory Testing Practices** (Itkonen & Mäntylä, 2009)
- **AI-Assisted Software Engineering Tools** (Storey et al., 2020)

It aligns with the concept of **fairness testing bots**, which aim to systematically evaluate software systems for discriminatory behavior by varying sensitive attributes and analyzing outcomes.

---

## Goals

- Promote fairness-aware software testing practices  
- Support testers with intelligent, adaptive guidance  
- Improve detection of bias in software systems  
- Provide reusable and structured testing documentation  

---

## Getting Started

1. Launch the application [here](bitatesting.ca)
2. Start a new testing session  
3. Describe your system and testing goals  
4. Follow the bot’s suggestions  
5. Log results and generate reports  

---

## License

This project is intended for academic and educational use. Licensing details may vary depending on implementation.

---

## Acknowledgments

This project builds on concepts from software testing automation, AI-assisted development tools, and fairness-aware computing research. 
