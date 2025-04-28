import React, { useState, useEffect, useRef } from "react";
import "../styles/ChatBox.css";
import { FaPaperPlane, FaMicrophone, FaSpinner } from "react-icons/fa";

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

  // Improved ticket parsing function with better regex patterns
  const parseTicketInfo = text => {
    // First attempt to find tickets with a consistent format
    const ticketRegex = /\*\*Ticket ID:?\s*(\d+)\*\*\s*-\s*([^*\n]+)/gi;
    const matches = [...text.matchAll(ticketRegex)];
    
    if (matches.length > 0) {
      return matches.map(match => ({
        id: match[1].trim(),
        description: match[2].trim()
      }));
    }
    
    // Fallback: try to find any format that looks like Ticket ID: NUMBER - Description
    const fallbackRegex = /(?:Ticket ID:?|Ticket)\s*(\d+)(?:[\s:-]+)([^,.\n]+)/gi;
    const fallbackMatches = [...text.matchAll(fallbackRegex)];
    
    return fallbackMatches.map(match => ({
      id: match[1].trim(),
      description: match[2].trim()
    }));
  };

  // Function to check if message contains ticket information
  const containsTicketInfo = text => {
    return text.toLowerCase().includes("ticket id") || 
           text.match(/\b\d{5}\b/) !== null; // Match 5-digit ticket IDs
  };

  // Render message as regular text or ticket table
  const renderMessage = message => {
    if (!message.user && containsTicketInfo(message.text)) {
      const tickets = parseTicketInfo(message.text);
      
      // Extract any text before the tickets list
      let introText = "";
      const introMatch = message.text.match(/^(.*?)(?:\*\*Ticket ID|\bTicket ID)/s);
      if (introMatch) introText = introMatch[1].trim();

      return (
        <div className="message-content">
          {introText && <p>{introText}</p>}
          {tickets.length > 0 ? (
            <div className="ticket-table-container">
              <h3>Support Tickets</h3>
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket, idx) => (
                    <tr key={idx}>
                      <td className="ticket-id">{ticket.id}</td>
                      <td>{ticket.description}</td>
                      <td>
                        <button 
                          className="ticket-action-btn"
                          onClick={() => handleTicketAction(ticket.id, "view")}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="original-message">{message.text}</div>
          )}
        </div>
      );
    } else {
      // Format URLs as links
      const formattedText = message.text.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      );
      
      return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
    }
  };

  const handleTicketAction = (ticketId, action) => {
    if (action === "view") {
      const userMessage = { 
        user: true, 
        text: `Tell me more about ticket #${ticketId}`
      };
      
      setMessages([...messages, userMessage]);
      
      // Simulate API call for demo
      setIsLoading(true);
      
      setTimeout(() => {
        const ticketDetails = {
          response: `Here are the details for **Ticket ID: ${ticketId}**:
          
          **Status**: In Progress
          **Priority**: Medium
          **Assignee**: John Doe
          **Created**: April 25, 2025
          **Last Updated**: April 28, 2025
          
          **Description**:
          This issue was reported by the marketing team. They're experiencing intermittent problems with the feature.
          
          **Recent Comments**:
          - Sarah (April 26): I've reproduced the issue on Firefox
          - Mike (April 27): The problem appears to be related to caching
          `
        };
        
        const botMessage = { user: false, text: ticketDetails.response };
        setMessages(prevMessages => [...prevMessages, botMessage]);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage = { user: true, text: input };
      setMessages([...messages, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // For demo purposes - simulate API response for ticket-related queries
        if (
          input.toLowerCase().includes("ticket") ||
          input.toLowerCase().includes("current") ||
          input.toLowerCase().includes("issue") ||
          input.toLowerCase().includes("open")
        ) {
          setTimeout(() => {
            const demoTickets = {
              response: `Here are the current open tickets in the system: 
              
              * **Ticket ID: 10023** - The storage of laptop get full 
              * **Ticket ID: 10010** - Update website privacy policy 
              * **Ticket ID: 10009** - Images not loading on product page 
              * **Ticket ID: 10008** - Application crashes on submitting feedback form 
              * **Ticket ID: 10003** - Backup database 
              * **Ticket ID: 10001** - Add dark mode to user interface 
              * **Ticket ID: 10000** - Error 500 on user login page`,
            };
            const botMessage = { user: false, text: demoTickets.response };
            setMessages(prevMessages => [...prevMessages, botMessage]);
            setIsLoading(false);
          }, 1000);
        } else if (input.toLowerCase().includes("create") || input.toLowerCase().includes("new")) {
          setTimeout(() => {
            const createResponse = {
              response: `I can help you create a new ticket. Please provide the following information:
              
              1. Title/Summary
              2. Description
              3. Priority (Low, Medium, High)
              
              Or you can go directly to the Ticket Management page using the sidebar navigation.`
            };
            const botMessage = { user: false, text: createResponse.response };
            setMessages(prevMessages => [...prevMessages, botMessage]);
            setIsLoading(false);
          }, 1000);
        } else {
          // Simulated API call
          setTimeout(() => {
            const genericResponse = {
              response: `I'm your Jira ticket assistant. You can ask me about:
              
              - Current open tickets
              - Specific ticket details (by ID)
              - Creating new tickets
              - Updating existing tickets
              
              How can I assist you with your ticketing needs today?`
            };
            const botMessage = { user: false, text: genericResponse.response };
            setMessages(prevMessages => [...prevMessages, botMessage]);
            setIsLoading(false);
          }, 1000);
        }
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