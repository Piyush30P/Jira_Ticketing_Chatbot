// src/components/TicketSummary.js
import React from 'react';
import TicketCreation from './TicketCreation';
import TicketUpdate from './TicketUpdate';
import '../styles/TicketSummary.css'; // Import the updated CSS

const TicketSummary = () => {
  return (
    <div className="ticket-summary">
      <h1>Ticket Management</h1>
      
      {/* Container for Create Ticket Form */}
      <div className="ticket-form-container">
        <h2>Create a New Ticket</h2>
        <TicketCreation />
      </div>

      {/* Container for Update Ticket Form */}
      <div className="ticket-form-container">
        <h2>Update an Existing Ticket</h2>
        <TicketUpdate />
      </div>
    </div>
  );
};

export default TicketSummary;
