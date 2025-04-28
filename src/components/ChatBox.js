import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/ChatBox.css";
import { FaPaperPlane, FaMicrophone, FaSpinner, FaRegClock, FaUserCircle, FaTag, FaExclamationCircle, FaComment, FaCalendarAlt, FaHistory, FaCheckCircle } from "react-icons/fa";

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Add welcome message on component mount
    setMessages([
      {
        user: false,
        text: "👋 Welcome to the Jira Ticket Assistant! How can I help you today? You can ask about tickets, create new ones, or get updates on existing tickets."
      }
    ]);
    
    // Focus input field when component loads
    inputRef.current?.focus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to check if message contains ticket information
  const containsTicketInfo = text => {
    return text.toLowerCase().includes("ticket id") || 
           text.match(/\b#?\d{5}\b/) !== null || // Match 5-digit ticket IDs with optional # prefix
           text.match(/\bticket\b.*?\b#?\d{5}\b/i) !== null; // Match "ticket" followed by ID
  };

  // Function to check if message contains ticket details (full details view)
  const containsTicketDetails = text => {
    return (text.includes("Here are the details for") || 
           text.includes("details for **Ticket ID")) && 
           text.includes("Status") && 
           text.includes("Priority") && 
           text.includes("Description");
  };

  // Function to parse ticket IDs from text
  const parseTicketIds = text => {
    const ticketPattern = /#(\d{5})\b/g;
    const matches = [...text.matchAll(ticketPattern)];
    return matches.map(match => match[1]);
  };

  // Function to extract ticket information blocks from the response
  const extractTicketBlocks = text => {
    // Look for structured ticket details sections
    const ticketBlockPattern = /\*\*Ticket ID: (\d+)\*\*.*?(?=\*\*Ticket ID:|$)/gs;
    const matches = [...text.matchAll(ticketBlockPattern)];
    
    if (matches.length === 0) return null;
    
    return matches.map(match => ({
      fullText: match[0],
      ticketId: match[1]
    }));
  };

  // Function to parse detailed ticket information
  const parseTicketDetails = text => {
    // Extract ticket ID
    const idMatch = text.match(/Ticket ID:?\s*(\d+)/i);
    const ticketId = idMatch ? idMatch[1] : "Unknown";
    
    // Extract status
    const statusMatch = text.match(/Status\*\*:\s*([^*\n]+)/i);
    const status = statusMatch ? statusMatch[1].trim() : "Unknown";
    
    // Extract priority
    const priorityMatch = text.match(/Priority\*\*:\s*([^*\n]+)/i);
    const priority = priorityMatch ? priorityMatch[1].trim() : "Unknown";
    
    // Extract assignee
    const assigneeMatch = text.match(/Assignee\*\*:\s*([^*\n]+)/i);
    const assignee = assigneeMatch ? assigneeMatch[1].trim() : "Unassigned";
    
    // Extract dates
    const createdMatch = text.match(/Created\*\*:\s*([^*\n]+)/i);
    const created = createdMatch ? createdMatch[1].trim() : "Unknown";
    
    const updatedMatch = text.match(/Last Updated\*\*:\s*([^*\n]+)/i);
    const updated = updatedMatch ? updatedMatch[1].trim() : "Unknown";
    
    // Extract description
    const descriptionMatch = text.match(/Description\*\*:?\s*([^*]+?)(?:\*\*|$)/is);
    const description = descriptionMatch ? descriptionMatch[1].trim() : "No description provided";
    
    // Extract comments - special handling for structured comments
    const commentsMatch = text.match(/Recent Comments\*\*:?(.+?)(?:\*\*|$)/is);
    const commentsText = commentsMatch ? commentsMatch[1].trim() : "";
    
    // Parse individual comments
    const comments = [];
    if (commentsText) {
      // Match pattern like: - Name (Date): Comment or - Comment
      const commentRegex = /-\s*(?:([^:()]+)\s*(?:\(([^)]+)\))?:)?\s*([^-]+)(?=\n-|\n\n|$)/g;
      let commentMatch;
      
      while ((commentMatch = commentRegex.exec(commentsText)) !== null) {
        if (commentMatch[1]) {
          // Full format with author and possibly date
          comments.push({
            author: commentMatch[1].trim(),
            date: commentMatch[2] ? commentMatch[2].trim() : "",
            text: commentMatch[3].trim()
          });
        } else {
          // Simple format with just text
          comments.push({
            author: "Team Member",
            date: "",
            text: commentMatch[3].trim()
          });
        }
      }
      
      // If no structured comments found but text exists, add as single comment
      if (comments.length === 0 && commentsText) {
        comments.push({
          author: "Team Member",
          date: "",
          text: commentsText.trim()
        });
      }
    }
    
    return {
      id: ticketId,
      status,
      priority,
      assignee,
      created,
      updated,
      description,
      comments
    };
  };

  // Render structured ticket details
  const renderTicketDetails = (details) => {
    return (
      <div className="ticket-details-card">
        <div className="ticket-details-header">
          <div className="ticket-id-badge">#{details.id}</div>
          <div className={`ticket-status-badge status-${details.status.toLowerCase().replace(/\s+/g, '-')}`}>
            {details.status === "In Progress" ? (
              <><FaHistory className="status-icon" /> {details.status}</>
            ) : details.status === "Done" ? (
              <><FaCheckCircle className="status-icon" /> {details.status}</>
            ) : details.status === "Blocked" ? (
              <><FaExclamationCircle className="status-icon" /> {details.status}</>
            ) : (
              <>{details.status}</>
            )}
          </div>
        </div>
        
        <div className="ticket-details-grid">
          <div className="ticket-detail-item">
            <div className="detail-label">
              <FaTag className="detail-icon" /> Priority
            </div>
            <div className={`detail-value priority-badge priority-${details.priority.toLowerCase()}`}>
              {details.priority}
            </div>
          </div>
          
          <div className="ticket-detail-item">
            <div className="detail-label">
              <FaUserCircle className="detail-icon" /> Assignee
            </div>
            <div className="detail-value">{details.assignee}</div>
          </div>
          
          <div className="ticket-detail-item">
            <div className="detail-label">
              <FaCalendarAlt className="detail-icon" /> Created
            </div>
            <div className="detail-value">{details.created}</div>
          </div>
          
          <div className="ticket-detail-item">
            <div className="detail-label">
              <FaRegClock className="detail-icon" /> Updated
            </div>
            <div className="detail-value">{details.updated}</div>
          </div>
        </div>
        
        <div className="ticket-description">
          <h4>Description</h4>
          <p>{details.description}</p>
        </div>
        
        {details.comments && details.comments.length > 0 && (
          <div className="ticket-comments">
            <h4>Recent Comments</h4>
            {details.comments.map((comment, index) => (
              <div className="comment" key={index}>
                <div className="comment-header">
                  <span className="comment-author">{comment.author}</span>
                  {comment.date && <span className="comment-date">{comment.date}</span>}
                </div>
                <div className="comment-text">{comment.text}</div>
              </div>
            ))}
          </div>
        )}
        
        <div className="ticket-actions">
          <button className="ticket-action-btn">Update Status</button>
          <button className="ticket-action-btn">Add Comment</button>
        </div>
      </div>
    );
  };

  // Format AI responses to better display ticket information
  const formatBotResponse = (text) => {
    // Replace #XXXXX ticket mentions with styled spans
    const formattedText = text.replace(/#(\d{5})/g, '<span class="ticket-id-mention">#$1</span>');
    
    return formattedText;
  };

  // Main function to render message content
  const renderMessage = (message) => {
    if (!message.user) {
      // Handle bot messages specially
      
      // Case 1: This is a detailed ticket view
      if (containsTicketDetails(message.text)) {
        const ticketDetails = parseTicketDetails(message.text);
        return renderTicketDetails(ticketDetails);
      }
      
      // Case 2: AI response with ticket references
      const ticketIds = parseTicketIds(message.text);
      if (ticketIds.length > 0) {
        // Format the response text to highlight ticket IDs
        return <div dangerouslySetInnerHTML={{ __html: formatBotResponse(message.text) }} />;
      }

      // Case 3: Regular message - just return formatted text
      return <div dangerouslySetInnerHTML={{ __html: formatBotResponse(message.text) }} />;
    }
    
    // User message - simple display
    return <div>{message.text}</div>;
  };

  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage = { user: true, text: input };
      setMessages([...messages, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // Send message to backend
        const response = await axios.post("http://127.0.0.1:5000/chat", {
          message: input,
          conversation_history: messages.map(msg => ({
            sender: msg.user ? "user" : "bot",
            message: msg.text,
          })),
        });

        const botMessage = { user: false, text: response.data.response };
        setMessages(prevMessages => [...prevMessages, botMessage]);
        setIsLoading(false);
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages(prevMessages => [
          ...prevMessages,
          { user: false, text: "Sorry, I encountered an error. Please try again." },
        ]);
        setIsLoading(false);
      }
    }
  };

  const handleVoiceInput = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setMessages([
        ...messages,
        { user: false, text: "Sorry, voice recognition is not supported in your browser." }
      ]);
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = event => {
      const speechResult = event.results[0][0].transcript;
      setInput(speechResult);
      setIsListening(false);
    };

    recognition.onerror = event => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setMessages([
        ...messages,
        { user: false, text: "I couldn't understand that. Please try speaking again or type your message." }
      ]);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chatbox-container">
      <div className="chatbox">
        <div className="chat-header">
          <h2>Jira Ticket Assistant</h2>
          <p>Ask about tickets or get help with your issues</p>
        </div>
        
        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.user ? "user" : "bot"}`}
            >
              <div className="message-bubble">
                {renderMessage(message)}
              </div>
              <div className="message-time">
                {/* For demo, we'll just show "now" but in production you'd use actual timestamps */}
                {index === messages.length - 1 ? "Just now" : ""}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot">
              <div className="message-bubble loading-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-area">
          <input
            type="text"
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message here..."
            onKeyPress={handleKeyPress}
          />
          <button 
            onClick={handleSendMessage}
            className="send-btn"
            disabled={isLoading || input.trim() === ""}
          >
            <FaPaperPlane />
          </button>
          <button 
            onClick={handleVoiceInput} 
            className={`voice-btn ${isListening ? 'listening' : ''}`}
            disabled={isLoading || isListening}
          >
            {isListening ? <FaSpinner className="fa-spin" /> : <FaMicrophone />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;