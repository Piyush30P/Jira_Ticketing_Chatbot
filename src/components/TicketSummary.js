import React from 'react';
import TicketCreation from './TicketCreation';
import { FaTicketAlt, FaInfoCircle } from 'react-icons/fa';
import '../styles/TicketSummary.css';

const TicketSummary = () => {
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
      
      <div className="ticket-creation-section">
        <div className="ticket-form-container">
          <TicketCreation />
        </div>
      </div>
      
      <div className="info-panel">
        <div className="info-icon">
          <FaInfoCircle />
        </div>
        <div className="info-content">
          <h3>About Ticket Management</h3>
          <p>
            This page allows you to create new tickets for issues or tasks that need attention.
            Fill in the details in the form above to create a new ticket in the system.
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