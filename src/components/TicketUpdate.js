// src/components/TicketUpdate.js
import React, { useState } from 'react';

const TicketUpdate = () => {
  const [formData, setFormData] = useState({
    ticketId: '',
    title: '',
    assignee: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Ticket Updated:', formData);
    // Call API to update the ticket here
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Ticket ID:
        <input type="text" name="ticketId" value={formData.ticketId} onChange={handleChange} />
      </label>
      <label>
        Title:
        <input type="text" name="title" value={formData.title} onChange={handleChange} />
      </label>
      <label>
        Type:
        <select name="priority" value={formData.priority} onChange={handleChange}>
          <option value="Task">Task</option>
          <option value="Epic">Epic</option>
          <option value="Story">Story</option>
        </select>
      </label>
      <button type="submit">Update Ticket</button>
    </form>
  );
};

export default TicketUpdate;
