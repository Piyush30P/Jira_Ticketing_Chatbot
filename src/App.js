import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import TicketSummary from './components/TicketSummary';
import ChatBox from './components/ChatBox';
import SearchBar from './components/SearchBar';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial app loading
  useEffect(() => {
    // Fake loading delay for demonstration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="app-loader">
        <div className="loader-content">
          <div className="logo-icon app-logo">JT</div>
          <h1>Jira Ticket Chatbot</h1>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        
        <div className="main-content">
          <div className="top-bar">
            <SearchBar placeholder="Search tickets, users, or projects..." />
            
            {/* Notifications and User Menu can be added here */}
            <div className="top-bar-actions">
              <button className="action-btn">
                <span className="notification-badge">3</span>
                <i className="fas fa-bell"></i>
              </button>
            </div>
          </div>
          
          <div className="content-wrapper">
            <Routes>
              {/* Make HomePage the default entry point */}
              <Route path="/" element={<Navigate to="/home" />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ticket-summary" element={<TicketSummary />} />
              <Route path="/chat" element={<ChatBox />} />
              <Route path="/settings" element={
                <div className="settings-placeholder">
                  <h1>Settings</h1>
                  <p>Settings page is under construction.</p>
                </div>
              } />
              {/* Add a catch-all route to redirect to HomePage */}
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </div>
          
          <footer className="app-footer">
            <p>&copy; 2025 Jira Ticket Chatbot | <a href="#">Terms</a> | <a href="#">Privacy</a></p>
          </footer>
        </div>
      </div>
    </Router>
  );
}

export default App;