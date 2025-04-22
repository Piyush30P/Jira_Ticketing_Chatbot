// src/components/HomePage.js
import React from 'react';
import '../styles/HomePage.css';
import { Link } from 'react-router-dom'; // Import Link component for navigation


const HomePage = () => {
  return (
    <div className="homepage">
      <div className="content-container"> {/* New container */}
        <h1>Welcome to the IT Solution</h1>
        <p>This is your home page for managing various platforms.</p>

        <div className="info-cards">
          <div className="card">ServiceNow</div>
          <div className="card">
            {/* Update Link to navigate to /chat */}
            <Link to="/chat" style={{ textDecoration: 'none', color: 'inherit' }}>
              Jira
            </Link>
          </div>         
          <div className="card">Platform 3</div>
          <div className="card">Platform 4</div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
