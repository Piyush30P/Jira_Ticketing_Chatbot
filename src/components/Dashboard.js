import React, { useState, useEffect } from 'react';

import '../styles/Dashboard.css';
import { 
  FaExclamationCircle, 
  FaCheckCircle, 
  FaHourglassHalf, 
  FaSearch,
  FaChartPie,
  FaCalendarAlt,
  FaUserClock
} from 'react-icons/fa';

const Dashboard = () => {
  const [ticketsDone, setTicketsDone] = useState([]);
  const [ticketsInProgress, setTicketsInProgress] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    done: 0,
    highPriority: 0
  });

  useEffect(() => {
    // Fetch tickets from the backend API (or mock data for now)
    setTimeout(() => {
      const mockTicketsDone = [
        {
          id: "JIRA-1001",
          fields: {
            summary: "Fix login page redirect issue",
            status: { name: "Done" },
            assignee: { displayName: "Jane Smith" },
            reporter: { displayName: "John Manager" },
            labels: ["frontend", "bug", "login"],
            created: "2025-04-20T10:30:00",
            updated: "2025-04-22T15:45:00",
            priority: { name: "Medium" },
            description: "Users are being redirected to the wrong page after login. This is affecting all users on Chrome browsers."
          }
        },
        {
          id: "JIRA-1002",
          fields: {
            summary: "Update privacy policy page",
            status: { name: "Done" },
            assignee: { displayName: "Mark Johnson" },
            reporter: { displayName: "Legal Team" },
            labels: ["documentation", "legal", "content"],
            created: "2025-04-18T09:15:00",
            updated: "2025-04-21T14:20:00",
            priority: { name: "High" },
            description: "The privacy policy needs to be updated to reflect the new data handling procedures. This is a legal requirement."
          }
        },
        {
          id: "JIRA-1003",
          fields: {
            summary: "Implement dark mode",
            status: { name: "Done" },
            assignee: { displayName: "Sarah Developer" },
            reporter: { displayName: "UX Team" },
            labels: ["frontend", "feature", "ui"],
            created: "2025-04-15T11:45:00",
            updated: "2025-04-19T16:30:00",
            priority: { name: "Low" },
            description: "Add dark mode option to user preferences. This should apply to all pages and components."
          }
        }
      ];
      
      const mockTicketsInProgress = [
        {
          id: "JIRA-1004",
          fields: {
            summary: "Fix image loading on product page",
            status: { name: "In Progress" },
            assignee: { displayName: "David Wong" },
            reporter: { displayName: "Customer Support" },
            labels: ["frontend", "bug", "images"],
            created: "2025-04-23T13:20:00",
            updated: "2025-04-24T09:10:00",
            priority: { name: "High" },
            description: "Product images are not loading properly on the main product listing page. This is affecting sales."
          }
        },
        {
          id: "JIRA-1005",
          fields: {
            summary: "API integration with payment gateway",
            status: { name: "In Review" },
            assignee: { displayName: "Alex Backend" },
            reporter: { displayName: "Product Manager" },
            labels: ["backend", "feature", "payment"],
            created: "2025-04-22T10:00:00",
            updated: "2025-04-24T11:30:00",
            priority: { name: "Critical" },
            description: "Implement the new payment gateway API to support additional payment methods."
          }
        },
        {
          id: "JIRA-1006",
          fields: {
            summary: "Add analytics tracking to checkout flow",
            status: { name: "In Progress" },
            assignee: { displayName: "Lisa Analytics" },
            reporter: { displayName: "Marketing Team" },
            labels: ["analytics", "feature"],
            created: "2025-04-21T15:45:00",
            updated: "2025-04-24T10:15:00",
            priority: { name: "Medium" },
            description: "Add event tracking to each step of the checkout process to better understand user drop-offs."
          }
        },
        {
          id: "JIRA-1007",
          fields: {
            summary: "Fix application crash on feedback form",
            status: { name: "Blocked" },
            assignee: { displayName: "Rob Developer" },
            reporter: { displayName: "QA Team" },
            labels: ["frontend", "critical", "bug"],
            created: "2025-04-24T09:30:00",
            updated: "2025-04-24T14:00:00",
            priority: { name: "Critical" },
            description: "The application crashes when users submit the feedback form with attachments. This is affecting all users."
          }
        }
      ];
      
      setTicketsDone(mockTicketsDone);
      setTicketsInProgress(mockTicketsInProgress);
      
      // Calculate stats
      setStats({
        total: mockTicketsDone.length + mockTicketsInProgress.length,
        open: mockTicketsInProgress.filter(t => t.fields.status.name === "Open").length,
        inProgress: mockTicketsInProgress.filter(t => 
          t.fields.status.name === "In Progress" || 
          t.fields.status.name === "In Review"
        ).length,
        done: mockTicketsDone.length,
        highPriority: mockTicketsInProgress.filter(t => 
          t.fields.priority.name === "High" || 
          t.fields.priority.name === "Critical"
        ).length
      });
      
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter tickets based on search term
  const filteredDone = ticketsDone.filter(ticket => 
    ticket.fields.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.fields.assignee.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredInProgress = ticketsInProgress.filter(ticket => 
    ticket.fields.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.fields.assignee.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle ticket details
  const [expandedTickets, setExpandedTickets] = useState({});
  
  const toggleDetails = (id) => {
    setExpandedTickets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Get appropriate status icon based on status name
  const getStatusIcon = (statusName) => {
    switch(statusName.toLowerCase()) {
      case 'done':
        return <FaCheckCircle className="status-icon done" />;
      case 'in progress':
        return <FaHourglassHalf className="status-icon in-progress" />;
      case 'in review':
        return <FaUserClock className="status-icon in-review" />;
      case 'blocked':
        return <FaExclamationCircle className="status-icon blocked" />;
      default:
        return <FaHourglassHalf className="status-icon in-progress" />;
    }
  };

  // Get appropriate class based on priority
  const getPriorityClass = (priority) => {
    switch(priority.toLowerCase()) {
      case 'critical':
        return 'priority-critical';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };
  
  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading ticket data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Ticket Dashboard</h1>
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tickets by ID, summary, or assignee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <FaChartPie />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tickets</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaHourglassHalf />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.done}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon warning">
            <FaExclamationCircle />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.highPriority}</div>
            <div className="stat-label">High Priority</div>
          </div>
        </div>
      </div>
      
      <div className="tickets-container">
        <div className="tickets-section in-progress">
          <h2>
            <FaHourglassHalf className="section-icon" />
            Active Tickets
            <span className="ticket-count">{filteredInProgress.length}</span>
          </h2>
          
          {filteredInProgress.length === 0 ? (
            <div className="no-tickets">
              <p>No active tickets match your search criteria.</p>
            </div>
          ) : (
            <div className="tickets-list">
              {filteredInProgress.map((ticket) => (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header" onClick={() => toggleDetails(ticket.id)}>
                    <div className="ticket-title">
                      {getStatusIcon(ticket.fields.status.name)}
                      <h3>{ticket.fields.summary}</h3>
                    </div>
                    <div className="ticket-meta">
                      <span className="ticket-id">{ticket.id}</span>
                      <span className={`ticket-priority ${getPriorityClass(ticket.fields.priority.name)}`}>
                        {ticket.fields.priority.name}
                      </span>
                    </div>
                  </div>
                  
                  {expandedTickets[ticket.id] && (
                    <div className="ticket-details">
                      <div className="ticket-info-grid">
                        <div className="info-item">
                          <span className="info-label">Assignee</span>
                          <span className="info-value">{ticket.fields.assignee.displayName}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Reporter</span>
                          <span className="info-value">{ticket.fields.reporter.displayName}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Status</span>
                          <span className="info-value">{ticket.fields.status.name}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Created</span>
                          <span className="info-value">
                            <FaCalendarAlt className="info-icon" />
                            {formatDate(ticket.fields.created)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="ticket-labels">
                        {ticket.fields.labels.map((label, index) => (
                          <span key={index} className="ticket-label">{label}</span>
                        ))}
                      </div>
                      
                      <div className="ticket-description">
                        <h4>Description</h4>
                        <p>{ticket.fields.description}</p>
                      </div>
                      
                      <div className="ticket-actions">
                        <button className="action-btn">View Details</button>
                        <button className="action-btn">Update Status</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="tickets-section completed">
          <h2>
            <FaCheckCircle className="section-icon" />
            Completed Tickets
            <span className="ticket-count">{filteredDone.length}</span>
          </h2>
          
          {filteredDone.length === 0 ? (
            <div className="no-tickets">
              <p>No completed tickets match your search criteria.</p>
            </div>
          ) : (
            <div className="tickets-list">
              {filteredDone.map((ticket) => (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header" onClick={() => toggleDetails(ticket.id)}>
                    <div className="ticket-title">
                      {getStatusIcon(ticket.fields.status.name)}
                      <h3>{ticket.fields.summary}</h3>
                    </div>
                    <div className="ticket-meta">
                      <span className="ticket-id">{ticket.id}</span>
                      <span className={`ticket-priority ${getPriorityClass(ticket.fields.priority.name)}`}>
                        {ticket.fields.priority.name}
                      </span>
                    </div>
                  </div>
                  
                  {expandedTickets[ticket.id] && (
                    <div className="ticket-details">
                      <div className="ticket-info-grid">
                        <div className="info-item">
                          <span className="info-label">Assignee</span>
                          <span className="info-value">{ticket.fields.assignee.displayName}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Reporter</span>
                          <span className="info-value">{ticket.fields.reporter.displayName}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Completed</span>
                          <span className="info-value">
                            <FaCalendarAlt className="info-icon" />
                            {formatDate(ticket.fields.updated)}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Created</span>
                          <span className="info-value">
                            <FaCalendarAlt className="info-icon" />
                            {formatDate(ticket.fields.created)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="ticket-labels">
                        {ticket.fields.labels.map((label, index) => (
                          <span key={index} className="ticket-label">{label}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;