import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [ticketsDone, setTicketsDone] = useState([]);
  const [ticketsInProgress, setTicketsInProgress] = useState([]);
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    // Fetch tickets from the backend API
    axios.get('http://localhost:5000/api/tickets')  // Adjust URL to point to your Flask backend
      .then(response => {
        const { done, inProgress } = response.data;
        setTicketsDone(done);
        setTicketsInProgress(inProgress);
      })
      .catch(error => {
        console.error("Error fetching tickets: ", error);
      });
  }, []);

  const toggleDetails = (index, type) => {
    setShowDetails(prevState => ({
      ...prevState,
      [`${type}-${index}`]: !prevState[`${type}-${index}`]
    }));
  };

  return (
    <div className="dashboard">
      <h1>Ticket Summary</h1>
      
      <div className="ticket-info">
        {/* Tickets Done Section */}
        <div className="team rounded-box">
          <h3>Tickets Done</h3>
          <ul>
            {ticketsDone.map((ticket, index) => (
              <li key={index}>
                <span>{ticket.fields.assignee ? ticket.fields.assignee.displayName : 'No Assignee'}</span> - {ticket.fields.summary}
                <button onClick={() => toggleDetails(index, 'done')}>View Details</button>
                {showDetails[`done-${index}`] && (
                  <div className="ticket-details">
                    <small>Reporter: {ticket.fields.reporter.displayName}</small><br />
                    <small>Labels: {ticket.fields.labels.join(', ')}</small><br />
                    <small>Created: {ticket.fields.created}</small>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Tickets In-Progress Section */}
        <div className="project-activity rounded-box">
          <h3>Tickets In-Progress</h3>
          <ul>
            {ticketsInProgress.map((ticket, index) => (
              <li key={index}>
                <span className={`${ticket.fields.status.name.toLowerCase()}-tag`}>
                  {ticket.fields.status.name.toUpperCase()}
                </span> {ticket.fields.summary} <span>{ticket.fields.created}</span>
                <button onClick={() => toggleDetails(index, 'inProgress')}>View Details</button>
                {showDetails[`inProgress-${index}`] && (
                  <div className="ticket-details">
                    <small>Assignee: {ticket.fields.assignee ? ticket.fields.assignee.displayName : 'No Assignee'}</small><br />
                    <small>Reporter: {ticket.fields.reporter.displayName}</small><br />
                    <small>Labels: {ticket.fields.labels.join(', ')}</small><br />
                    <small>Created: {ticket.fields.created}</small>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
