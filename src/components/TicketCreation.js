import React, { useState } from 'react';

import { 
  FaCheck, 
  FaTimes, 
  FaInfoCircle, 
  FaExclamationTriangle,
  FaUserCircle,
  FaTag,
  FaPaperclip
} from 'react-icons/fa';
import '../styles/TicketCreation.css';

const TicketCreation = () => {
  const initialFormState = {
    title: '',
    description: '',
    type: 'Task',
    priority: 'Medium',
    assignee: '',
    labels: [],
    attachments: []
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [responseMessage, setResponseMessage] = useState('');
  const [responseType, setResponseType] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Type options
  const typeOptions = ['Task', 'Bug', 'Story', 'Epic', 'Improvement'];
  
  // Priority options
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
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

  const handleLabelAdd = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData({
        ...formData,
        labels: [...formData.labels, newLabel.trim()]
      });
      setNewLabel('');
    }
  };

  const handleLabelRemove = (labelToRemove) => {
    setFormData({
      ...formData,
      labels: formData.labels.filter(label => label !== labelToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLabelAdd();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // For demo purposes, we'll just store file names
    // In a real app, you'd handle file uploads to a server
    const fileNames = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));
    
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...fileNames]
    });
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setResponseType('error');
      setResponseMessage('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // For demo purposes, we'll simulate an API call
      // In a real app, you would send this to your backend
      setTimeout(() => {
        // Generate a random ID for the ticket
        const ticketId = Math.floor(10000 + Math.random() * 90000);
        
        console.log('Ticket created:', {
          id: ticketId,
          ...formData,
          createdAt: new Date().toISOString()
        });
        
        setResponseType('success');
        setResponseMessage(`Ticket #${ticketId} created successfully!`);
        
        // Reset form after successful submission
        setFormData(initialFormState);
        setIsSubmitting(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error creating ticket:', error);
      setResponseType('error');
      setResponseMessage(error.response?.data?.error || 'Failed to create the ticket. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setFormErrors({});
    setResponseMessage('');
  };

  return (
    <div className="ticket-creation-container">
      <div className="form-header">
        <h2>Create a New Ticket</h2>
        <p>Fill in the details below to create a new support ticket</p>
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
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={formErrors.title ? 'error' : ''}
              placeholder="Brief summary of the issue"
            />
            {formErrors.title && (
              <div className="error-message">
                <FaInfoCircle /> {formErrors.title}
              </div>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              {typeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              {priorityOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="assignee">
              Assignee
            </label>
            <div className="input-with-icon">
              <FaUserCircle className="input-icon" />
              <input
                type="text"
                id="assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                placeholder="Enter name or leave blank for auto-assignment"
              />
            </div>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              className={formErrors.description ? 'error' : ''}
              placeholder="Detailed explanation of the issue or request"
            ></textarea>
            {formErrors.description && (
              <div className="error-message">
                <FaInfoCircle /> {formErrors.description}
              </div>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label>Labels</label>
            <div className="label-input-container">
              <div className="input-with-icon">
                <FaTag className="input-icon" />
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add labels (press Enter to add)"
                />
              </div>
              <button
                type="button"
                className="add-label-btn"
                onClick={handleLabelAdd}
                disabled={!newLabel.trim()}
              >
                Add
              </button>
            </div>
            
            {formData.labels.length > 0 && (
              <div className="labels-container">
                {formData.labels.map((label, index) => (
                  <div key={index} className="label-chip">
                    <span>{label}</span>
                    <button
                      type="button"
                      className="remove-label-btn"
                      onClick={() => handleLabelRemove(label)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label>Attachments</label>
            <div className="file-upload-container">
              <label htmlFor="file-upload" className="file-upload-label">
                <FaPaperclip className="upload-icon" />
                <span>Choose files</span>
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
            
            {formData.attachments.length > 0 && (
              <div className="attachments-list">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <span className="attachment-name">{file.name}</span>
                    <button
                      type="button"
                      className="remove-attachment-btn"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="reset-btn" onClick={handleReset}>
            Reset
          </button>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Creating...
              </>
            ) : (
              'Create Ticket'
            )}
          </button>
        </div>
      </form>
      
      <div className="form-tips">
        <h3>Tips for effective tickets</h3>
        <ul>
          <li>Be specific in your title and description</li>
          <li>Include steps to reproduce for bugs</li>
          <li>Add relevant labels to help with categorization</li>
          <li>Attach screenshots if applicable</li>
        </ul>
      </div>
    </div>
  );
};

export default TicketCreation;