import React, { useState } from 'react';
import TicketCreation from './TicketCreation';
import TicketUpdate from './TicketUpdate';
import { FaPlus, FaEdit, FaTicketAlt, FaInfoCircle } from 'react-icons/fa';
import '../styles/TicketSummary.css';

const TicketSummary = () => {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="ticket-summary">
      <div className="ticket-summary-header">
        <div className="header-icon">
          <FaTicketAlt />
        </div>
        <div className="header-content">
          <h1>Ticket Management</h1>
          <p>Create new tickets or update existing ones in the system</p>
        </div>
      </div>
      
      <div className="tab-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'create' ? 'active' : ''}`} 
            onClick={() => setActiveTab('create')}
          >
            <FaPlus className="tab-icon" />
            <span>Create Ticket</span>
          </button>
          <button 
            className={`tab ${activeTab === 'update' ? 'active' : ''}`} 
            onClick={() => setActiveTab('update')}
          >
            <FaEdit className="tab-icon" />
            <span>Update Ticket</span>
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'create' ? (
            <div className="ticket-form-container">
              <TicketCreation />
            </div>
          ) : (
            <div className="ticket-form-container">
              <TicketUpdate />
            </div>
          )}
        </div>
      </div>
      
      <div className="info-panel">
        <div className="info-icon">
          <FaInfoCircle />
        </div>
        <div className="info-content">
          <h3>About Ticket Management</h3>
          <p>
            This page allows you to manage tickets within your Jira system. You can create new tickets for issues or tasks that need attention, 
            or update existing tickets to change their status, assignee, or add comments.
          </p>
          <p>
            If you need help with specific fields or ticket types, please refer to the company's ticketing guidelines or contact your team lead.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketSummary;