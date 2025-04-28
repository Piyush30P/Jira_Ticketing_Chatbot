import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';
import { 
  FaExclamationCircle, 
  FaCheckCircle, 
  FaHourglassHalf, 
  FaSearch,
  FaChartPie,
  FaCalendarAlt,
  FaUserClock,
  FaSync,
  FaTicketAlt,
  FaExclamationTriangle,
  FaEye
} from 'react-icons/fa';

const Dashboard = () => {
  const [ticketsDone, setTicketsDone] = useState([]);
  const [ticketsInProgress, setTicketsInProgress] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    done: 0,
    highPriority: 0
  });
  const [expandedTickets, setExpandedTickets] = useState({});

  // Function to fetch tickets from API
  const fetchTickets = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:5000/api/tickets');
      setTicketsDone(response.data.done || []);
      setTicketsInProgress(response.data.inProgress || []);
      
      // Calculate statistics
      const done = response.data.done || [];
      const inProgress = response.data.inProgress || [];
      const allTickets = [...done, ...inProgress];
      
      // Count open tickets (assuming any not "Done" is considered open)
      const openTickets = inProgress.filter(t => 
        t.fields.status.name.toLowerCase() !== 'in progress'
      );
      
      // Count high priority tickets
      const highPriorityTickets = allTickets.filter(t => 
        t.fields.priority && 
        (t.fields.priority.name === 'High' || t.fields.priority.name === 'Critical')
      );
      
      setStats({
        total: allTickets.length,
        open: openTickets.length,
        inProgress: inProgress.length,
        done: done.length,
        highPriority: highPriorityTickets.length
      });
      
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError("Failed to load tickets. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    
    // Setup auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchTickets(true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchTickets]);

  // Filter tickets based on search term
  const filteredDone = ticketsDone.filter(ticket => 
    ticket.fields.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.fields.assignee && ticket.fields.assignee.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredInProgress = ticketsInProgress.filter(ticket => 
    ticket.fields.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.fields.assignee && ticket.fields.assignee.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Toggle ticket details
  const toggleDetails = (id) => {
    setExpandedTickets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Get appropriate status icon based on status name
  const getStatusIcon = (statusName) => {
    const status = statusName.toLowerCase();
    if (status.includes('done')) {
      return <FaCheckCircle className="status-icon done" />;
    } else if (status.includes('progress')) {
      return <FaHourglassHalf className="status-icon in-progress" />;
    } else if (status.includes('review')) {
      return <FaUserClock className="status-icon in-review" />;
    } else if (status.includes('block')) {
      return <FaExclamationCircle className="status-icon blocked" />;
    } else {
      return <FaTicketAlt className="status-icon" />;
    }
  };

  // Get appropriate class based on priority
  const getPriorityClass = (priority) => {
    if (!priority) return 'priority-medium';
    
    const priorityName = priority.toLowerCase();
    if (priorityName.includes('critical')) {
      return 'priority-critical';
    } else if (priorityName.includes('high')) {
      return 'priority-high';
    } else if (priorityName.includes('medium')) {
      return 'priority-medium';
    } else if (priorityName.includes('low')) {
      return 'priority-low';
    } else {
      return 'priority-medium';
    }
  };
  
  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Handle viewing ticket details
  const handleViewTicket = (ticketId) => {
    // Redirect to chat with a query to display the ticket details
    window.location.href = `/chat?query=Tell me about ticket #${ticketId}`;
  };

  // Handle force refresh of data
  const handleRefresh = () => {
    fetchTickets(true);
  };

  if (isLoading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading ticket data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard error">
        <FaExclamationTriangle className="error-icon" />
        <p>{error}</p>
        <button onClick={handleRefresh} className="refresh-btn">
          <FaSync /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Ticket Dashboard</h1>
        <div className="dashboard-actions">
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
          <button 
            className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <FaSync className={isRefreshing ? 'fa-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
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
              {searchTerm ? (
                <p>No active tickets match your search criteria.</p>
              ) : (
                <p>No active tickets found. Create a new ticket to get started.</p>
              )}
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
                      <span className="ticket-id">#{ticket.id}</span>
                      <span className={`ticket-priority ${getPriorityClass(ticket.fields.priority?.name)}`}>
                        {ticket.fields.priority?.name || 'Medium'}
                      </span>
                    </div>
                  </div>
                  
                  {expandedTickets[ticket.id] && (
                    <div className="ticket-details">
                      <div className="ticket-info-grid">
                        <div className="info-item">
                          <span className="info-label">Assignee</span>
                          <span className="info-value">{ticket.fields.assignee?.displayName || 'Unassigned'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Reporter</span>
                          <span className="info-value">{ticket.fields.reporter?.displayName || 'Unknown'}</span>
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
                      
                      {ticket.fields.labels && ticket.fields.labels.length > 0 && (
                        <div className="ticket-labels">
                          {ticket.fields.labels.map((label, index) => (
                            <span key={index} className="ticket-label">{label}</span>
                          ))}
                        </div>
                      )}
                      
                      {ticket.fields.description && (
                        <div className="ticket-description">
                          <h4>Description</h4>
                          <p>{typeof ticket.fields.description === 'object' ? 
                              'Complex description (click View Details to see full content)' : 
                              ticket.fields.description}
                          </p>
                        </div>
                      )}
                      
                      <div className="ticket-actions">
                        <button 
                          className="action-btn"
                          onClick={() => handleViewTicket(ticket.id)}
                        >
                          <FaEye /> View Details
                        </button>
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
              {searchTerm ? (
                <p>No completed tickets match your search criteria.</p>
              ) : (
                <p>No completed tickets found.</p>
              )}
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
                      <span className="ticket-id">#{ticket.id}</span>
                      <span className={`ticket-priority ${getPriorityClass(ticket.fields.priority?.name)}`}>
                        {ticket.fields.priority?.name || 'Medium'}
                      </span>
                    </div>
                  </div>
                  
                  {expandedTickets[ticket.id] && (
                    <div className="ticket-details">
                      <div className="ticket-info-grid">
                        <div className="info-item">
                          <span className="info-label">Assignee</span>
                          <span className="info-value">{ticket.fields.assignee?.displayName || 'Unassigned'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Reporter</span>
                          <span className="info-value">{ticket.fields.reporter?.displayName || 'Unknown'}</span>
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
                      
                      {ticket.fields.labels && ticket.fields.labels.length > 0 && (
                        <div className="ticket-labels">
                          {ticket.fields.labels.map((label, index) => (
                            <span key={index} className="ticket-label">{label}</span>
                          ))}
                        </div>
                      )}
                      
                      <div className="ticket-actions">
                        <button 
                          className="action-btn"
                          onClick={() => handleViewTicket(ticket.id)}
                        >
                          <FaEye /> View Details
                        </button>
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