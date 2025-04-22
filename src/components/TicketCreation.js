import React, { useState } from 'react';
import axios from 'axios';

const TicketCreation = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Task',
    assignee: ''
  });

  const [responseMessage, setResponseMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/create-ticket', formData);
      setResponseMessage(response.data.message || 'Ticket created successfully!');
    } catch (error) {
      setResponseMessage(
        error.response?.data?.error || 'Failed to create the ticket. Please try again.'
      );
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Title:
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </label>
        <label>
          Description:
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Type:
          <select name="priority" value={formData.priority} onChange={handleChange}>
            <option value="Task">Task</option>
            <option value="Epic">Epic</option>
            <option value="Story">Story</option>
          </select>
        </label>
        <label>
          Assignee:
          <input type="text" name="assignee" value={formData.assignee} onChange={handleChange} />
        </label>
        <button type="submit">Create Ticket</button>
      </form>
      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
};

export default TicketCreation;
