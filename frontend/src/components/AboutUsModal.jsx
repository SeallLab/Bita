import React from "react";
import pluriseLogo from '../images/plurise.png';
import ronniePhoto from '../images/SouzaSantos.jpg';
import keerynPhoto from '../images/KeerynJohnson.jpg';
import '../styles/AboutUsModal.css';

export default function AboutUsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="info-modal-overlay"
      onClick={onClose} //close if user clicks outside
    >
      <div
        className="info-modal"
        onClick={(e) => e.stopPropagation()} //prevent close on modal click
      >
        <h2>About Us</h2>

        <div className="about-section">
          <img src={pluriseLogo} alt="Plurise Logo" />
          <div>
            <h4>Plurise Lab</h4>
            <p>
              The Plurise Lab focuses 
              on the human aspects of software engineering, including development practices, 
              project management, software testing, fairness, and EDI. Understanding behaviors, 
              cognitive skills, teamwork, and diverse user perspectives is vital for creating 
              effective and innovative technology. As society becomes increasingly reliant on 
              software across work, education, politics, and leisure, and with the rise of 
              AI-powered systems, ensuring fairness and bias-free solutions in software is essential.
            </p>
          </div>
        </div>

        <div className="about-section">
          <img src={keerynPhoto} alt="Keeryn Johnson Portrait" />
          <div>
            <h4>Keeryn Johnson (Undergraduate Research Assistant)</h4>
            <p>
              Keeryn Johnson is currently studying at the University of Calgary for a Software Engineering Degree with a minor in Mechatronics. 
              He has an interest in Robotics and Software Design, and hopes to work in the robotics industry in the future.
            </p>
          </div>
        </div>

        <div className="about-section">
          <img src={ronniePhoto} alt="Dr. Ronnie De Souza Santos Portrait" />
          <div>
            <h4>Dr. Ronnie de Souza Santos, Ph.D.</h4>
            <p>
              Dr. Ronnie de Souza Santos is an Assistant Professor in Software Engineering at the University of Calgary. 
              He has an interest in the Human Aspects of Software Engineering, the Software Development Process, Software Project Management,
              Software Quality and Software Testing, EDI in the Software Industry, and Software Fairness.
            </p>
          </div>
        </div>
        <div className="info-modal-actions">
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}