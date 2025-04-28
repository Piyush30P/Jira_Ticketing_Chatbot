import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';
import { 
  FaSearch, 
  FaChartLine, 
  FaBug, 
  FaBook, 
  FaHeadset,
  FaLightbulb
} from 'react-icons/fa';

const HomePage = () => {
  // Feature cards for homepage
  const features = [
    {
      title: "Quick Ticket Lookup",
      description: "Find ticket information instantly with simple questions",
      icon: <FaSearch className="feature-icon-svg" />
    },
    {
      title: "Real-time Status Updates",
      description: "Get the latest updates on ticket progress and status changes",
      icon: <FaChartLine className="feature-icon-svg" />
    },
    {
      title: "Easy Issue Reporting",
      description: "Report new issues directly through the chat interface",
      icon: <FaBug className="feature-icon-svg" />
    },
    {
      title: "Knowledge Base Access",
      description: "Find solutions and best practices from our knowledge repository",
      icon: <FaBook className="feature-icon-svg" />
    }
  ];

  // Example queries to demonstrate to users
  const exampleQueries = [
    "What's the status of ticket #10023?",
    "List all open tickets for the mobile app",
    "Show tickets assigned to me",
    "Create a new ticket for the login page issue"
  ];
  
  // Testimonials for social proof
  const testimonials = [
    {
      quote: "The chatbot has reduced our ticket resolution time by 40%. It's a game-changer for our support team.",
      author: "Sarah Johnson, Support Lead"
    },
    {
      quote: "I can quickly check on my tickets without navigating through multiple pages. Saves me so much time!",
      author: "Mark Davis, Developer"
    }
  ];

  return (
    <div className="homepage">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Simplify Ticket Management with AI</h1>
          <p className="subtitle">Get instant answers, create tickets, and track progress—all through a simple chat interface</p>
          <div className="hero-buttons">
            <Link to="/chat" className="cta-button primary">
              <span className="button-text">Start Chatting</span>
              <FaHeadset className="button-icon" />
            </Link>
            <Link to="/dashboard" className="cta-button secondary">
              <span className="button-text">View Dashboard</span>
              <FaChartLine className="button-icon" />
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="chat-preview">
            <div className="chat-header">
              <div className="chat-title">Jira Assistant</div>
            </div>
            <div className="chat-messages">
              <div className="message user">What are the current open tickets?</div>
              <div className="message bot">
                Here are the open tickets:
                <div className="mini-table">
                  <div className="table-row header">
                    <div className="table-cell">ID</div>
                    <div className="table-cell">Description</div>
                  </div>
                  <div className="table-row">
                    <div className="table-cell">10023</div>
                    <div className="table-cell">Storage issue on laptop</div>
                  </div>
                  <div className="table-row">
                    <div className="table-cell">10010</div>
                    <div className="table-cell">Update privacy policy</div>
                  </div>
                  <div className="table-row">
                    <div className="table-cell">10009</div>
                    <div className="table-cell">Images not loading</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="examples-section">
        <h2>Try These Queries</h2>
        <div className="examples-container">
          {exampleQueries.map((query, index) => (
            <div className="example-query" key={index}>
              <div className="query-bubble">"{query}"</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="testimonials-section">
        <h2>What Our Users Say</h2>
        <div className="testimonials-container">
          {testimonials.map((testimonial, index) => (
            <div className="testimonial-card" key={index}>
              <div className="quote-icon">❝</div>
              <p className="testimonial-text">{testimonial.quote}</p>
              <p className="testimonial-author">{testimonial.author}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Ask a Question</h3>
              <p>Type your query about tickets in natural language</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Get Instant Answers</h3>
              <p>The assistant provides relevant ticket information</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Take Action</h3>
              <p>Create, update, or track tickets directly from chat</p>
            </div>
          </div>
        </div>
      </div>

      <div className="get-started-section">
        <FaLightbulb className="idea-icon" />
        <h2>Ready to transform your ticket management?</h2>
        <p>Start using the Jira Chatbot Assistant today</p>
        <Link to="/chat" className="cta-button primary large">
          Get Started Now
        </Link>
      </div>
    </div>
  );
};

export default HomePage;