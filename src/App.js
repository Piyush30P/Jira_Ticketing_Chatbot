// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import TicketSummary from './components/TicketSummary';
import ChatBox from './components/ChatBox';
import './App.css'; // Make sure to include your CSS

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="content">
          <Routes>
          <Route path="/chat" element={<ChatBox />} />

          <Route path="/home" element={<HomePage />} /> {/* This will match /home */}            
          <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ticket-summary" element={<TicketSummary />} />
            <Route path="/chat" component={ChatBox} />  {/* ChatBox route */}

            
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
