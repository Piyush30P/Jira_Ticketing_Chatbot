import React, { useState, useEffect } from 'react';
import { 
  FaCheck, 
  FaTimes, 
  FaInfoCircle, 
  FaExclamationTriangle,
  FaSearch,
  FaHistory,
  FaComment
} from 'react-icons/fa';
import '../styles/TicketUpdate.css';

const TicketUpdate = () => {
  const initialFormState = {
    ticketId: '',
    title: '',
    description: '',
    status: '',
    priority: '',
    assignee: '',
    comment: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [responseMessage, setResponseMessage] = useState('');
  const [responseType, setResponseType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [ticketFound, setTicketFound] = useState(false);
  const [ticketHistory, setTicketHistory] = useState([]);

  // Status options
  const statusOptions = ['Open', 'In Progress', 'In Review', 'Blocked', 'Done'];
  
  // Priority options
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

  const validateTicketId = () => {
    const errors = {};
    
    if (!formData.ticketId.trim()) {
      errors.ticketId = 'Ticket ID is required';
    } else if (!/^\d{5}$/.test(formData.ticketId)) {
      errors.ticketId = 'Ticket ID must be a 5-digit number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const errors = {};
    
    if (ticketFound) {
      if (!formData.status) {
        errors.status = 'Status is required';
      }
      
      if (formData.comment && formData.comment.length < 5) {
        errors.comment = 'Comment must be at least 5 characters';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error message when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const searchTicket = async () => {
    if (!validateTicketId()) {
      return;
    }
    
    setIsSearching(true);
    setResponseMessage('');
    
    try {
      // For demo purposes, simulate API call
      setTimeout(() => {
        // Simulate ticket data based on ID
        if (formData.ticketId === '10023') {
          setFormData({
            ...formData,
            title: 'Storage issue on laptop',
            description: 'The storage on the company laptop is getting full, needs cleanup or upgrade.',
            status: 'In Progress',
            priority: 'Medium',
            assignee: 'Jane Smith'
          });
          
          setTicketHistory([
            {
              date: '2025-04-28T14:23:00',
              user: 'Jane Smith',
              action: 'Status changed from "Open" to "In Progress"',
              comment: 'Starting work on this ticket now.'
            },
            {
              date: '2025-04-27T09:15:00',
              user: 'John Manager',
              action: 'Assigned to Jane Smith',
              comment: 'Please handle this ticket as soon as possible.'
            },
            {
              date: '2025-04-26T16:45:00',
              user: 'Mark Davis',
              action: 'Created ticket',
              comment: 'Laptop storage is almost full, affecting performance.'
            }
          ]);
          
          setTicketFound(true);
          setResponseType('success');
          setResponseMessage('Ticket found!');
        } else if (formData.ticketId === '10010') {
          setFormData({
            ...formData,
            title: 'Update website privacy policy',
            description: 'The privacy policy needs to be updated to comply with new regulations.',
            status: 'Open',
            priority: 'High',
            assignee: 'Legal Team'
          });
          
          setTicketHistory([
            {
              date: '2025-04-28T11:30:00',
              user: 'Legal Team',
              action: 'Created ticket',
              comment: 'Need to update our privacy policy before May 15th to comply with new regulations.'
            }
          ]);
          
          setTicketFound(true);
          setResponseType('success');
          setResponseMessage('Ticket found!');
        } else {
          setTicketFound(false);
          setResponseType('error');
          setResponseMessage(`No ticket found with ID: ${formData.ticketId}`);
        }
        
        setIsSearching(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error searching for ticket:', error);
      setResponseType('error');
      setResponseMessage('Failed to search for the ticket. Please try again.');
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ticketFound) {
      searchTicket();
      return;
    }
    
    if (!validateForm()) {
      setResponseType('error');
      setResponseMessage('Please fix the errors in the form');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // For demo purposes, simulate API call
      setTimeout(() => {
        console.log('Ticket updated:', formData);
        
        // Add the update to history
        const newHistoryItem = {
          date: new Date().toISOString(),
          user: 'Current User',
          action: `Status changed from "${formData.status}" to "${formData.status}"`,
          comment: formData.comment || 'No comment provided'
        };
        
        setTicketHistory([newHistoryItem, ...ticketHistory]);
        
        setResponseType('success');
        setResponseMessage(`Ticket #${formData.ticketId} updated successfully!`);
        setFormData({
          ...formData,
          comment: '' // Clear only the comment field after update
        });
        
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating ticket:', error);
      setResponseType('error');
      setResponseMessage(error.response?.data?.error || 'Failed to update the ticket. Please try again.');
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setFormErrors({});
    setResponseMessage('');
    setTicketFound(false);
    setTicketHistory([]);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  return (
    <div className="ticket-update-container">
      <div className="form-header">
        <h2>Update Existing Ticket</h2>
        <p>Search for a ticket by ID and update its details</p>
      </div>
      
      {responseMessage && (
        <div className={`response-message ${responseType}`}>
          {responseType === 'success' ? (
            <FaCheck className="response-icon" />
          ) : (
            <FaExclamationTriangle className="response-icon" />
          )}
          <span>{responseMessage}</span>
          <button className="close-btn" onClick={() => setResponseMessage('')}>
            <FaTimes />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="ticket-form">
        <div className="search-section">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ticketId">
                Ticket ID <span className="required">*</span>
              </label>
              <div className="input-with-icon">
                <FaSearch className="input-icon" />
                <input
                  type="text"
                  id="ticketId"
                  name="ticketId"
                  value={formData.ticketId}
                  onChange={handleChange}
                  className={formErrors.ticketId ? 'error' : ''}
                  placeholder="Enter 5-digit ticket ID (e.g. 10023)"
                  disabled={ticketFound}
                />
              </div>
              {formErrors.ticketId && (
                <div className="error-message">
                  <FaInfoCircle /> {formErrors.ticketId}
                </div>
              )}
            </div>
            
            {!ticketFound && (
              <div className="search-button-container">
                <button 
                  type="button" 
                  className="search-btn" 
                  onClick={searchTicket}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <span className="spinner"></span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <FaSearch /> Search
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {ticketFound && (
          <div className="ticket-details-section">
            <div className="form-row">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  disabled
                  className="readonly-field"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Current Assignee</label>
                <input
                  type="text"
                  value={formData.assignee}
                  disabled
                  className="readonly-field"
                />
              </div>
              
              <div className="form-group">
                <label>Current Priority</label>
                <input
                  type="text"
                  value={formData.priority}
                  disabled
                  className="readonly-field"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  disabled
                  rows="3"
                  className="readonly-field"
                ></textarea>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">
                  Status <span className="required">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={formErrors.status ? 'error' : ''}
                >
                  <option value="">Select status</option>
                  {statusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {formErrors.status && (
                  <div className="error-message">
                    <FaInfoCircle /> {formErrors.status}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="assignee">New Assignee (optional)</label>
                <input
                  type="text"
                  id="assignee"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                  placeholder="Leave unchanged or enter new assignee"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="comment">Add Comment</label>
                <div className="input-with-icon">
                  <FaComment className="input-icon" />
                  <textarea
                    id="comment"
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    rows="3"
                    className={formErrors.comment ? 'error' : ''}
                    placeholder="Add a comment about the changes you're making"
                  ></textarea>
                </div>
                {formErrors.comment && (
                  <div className="error-message">
                    <FaInfoCircle /> {formErrors.comment}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button type="button" className="reset-btn" onClick={resetForm}>
            {ticketFound ? 'New Search' : 'Reset'}
          </button>
          
          {ticketFound && (
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Updating...
                </>
              ) : (
                'Update Ticket'
              )}
            </button>
          )}
        </div>
      </form>
      
      {ticketFound && ticketHistory.length > 0 && (
        <div className="ticket-history">
          <h3>
            <FaHistory /> Ticket History
          </h3>
          <div className="history-timeline">
            {ticketHistory.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-connector">
                  <div className="history-dot"></div>
                  {index < ticketHistory.length - 1 && <div className="history-line"></div>}
                </div>
                <div className="history-content">
                  <div className="history-header">
                    <span className="history-user">{item.user}</span>
                    <span className="history-date">{formatDate(item.date)}</span>
                  </div>
                  <div className="history-action">{item.action}</div>
                  {item.comment && (
                    <div className="history-comment">
                      <FaComment className="comment-icon" /> {item.comment}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!ticketFound && (
        <div className="ticket-search-tips">
          <h3>Tips for finding tickets</h3>
          <ul>
            <li>Enter the exact 5-digit ticket ID (e.g., 10023, 10010)</li>
            <li>Make sure you have permission to view the ticket</li>
            <li>For demo, try ticket IDs: 10023 or 10010</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TicketUpdate;