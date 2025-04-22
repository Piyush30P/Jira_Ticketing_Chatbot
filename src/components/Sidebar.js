// src/components/Sidebar.js
import React from 'react';
import { FaHome, FaComment, FaChartBar, FaTicketAlt, FaCog } from 'react-icons/fa';
import '../styles/Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>Menu</h2>
      <ul>
        <li>
          <a href="/home">
            <FaHome className="icon" /> Home Page
          </a>
        </li>
        <li>
          <a href="/chat">
            <FaComment className="icon" /> Chat
          </a>
        </li>
        <li>
          <a href="/dashboard">
            <FaChartBar className="icon" /> Dashboard
          </a>
        </li>
        <li>
          <a href="/ticket-summary">
            <FaTicketAlt className="icon" /> Tickets
          </a>
        </li>
        <li>
          <a href="/settings">
            <FaCog className="icon" /> Settings
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
