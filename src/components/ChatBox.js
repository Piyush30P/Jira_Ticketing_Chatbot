import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/ChatBox.css";

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to check if message contains ticket information
  const containsTicketInfo = text => {
    return text.includes("Ticket ID:") || text.includes("Ticket ID");
  };

  // Function to parse ticket information into structured data
  const parseTicketInfo = text => {
    // Split the message by ticket identifier patterns
    const ticketBlocks = text.split(/\s*\*\s*(?=\*\*Ticket ID)/);

    const tickets = [];

    // Process each block
    ticketBlocks.forEach(block => {
      // Extract ticket ID and description using regex
      const ticketMatch = block.match(
        /\*\*Ticket ID:?\s*(\d+)\*\*\s*-\s*([^*]+)/i
      );

      if (ticketMatch) {
        tickets.push({
          id: ticketMatch[1].trim(),
          description: ticketMatch[2].trim(),
        });
      }
    });

    // If no tickets found with the first method, try an alternative approach
    if (tickets.length === 0) {
      // Try extracting with a more general pattern
      const allMatches = text.matchAll(
        /(?:\*\*)?Ticket ID:?\s*(\d+)(?:\*\*)?\s*-\s*([^*]+?)(?=\s*(?:\*\*Ticket|\s*$))/gi
      );

      for (const match of allMatches) {
        tickets.push({
          id: match[1].trim(),
          description: match[2].trim(),
        });
      }
    }

    console.log("Parsed tickets:", tickets);
    return tickets;
  };

  // Function to render a message as ticket table or normal message
  const renderMessage = message => {
    if (!message.user && containsTicketInfo(message.text)) {
      const tickets = parseTicketInfo(message.text);

      // Extract any text before the tickets list
      let introText = "";
      const introMatch = message.text.match(
        /^(.*?)(?:\*\*Ticket ID|\bTicket ID)/s
      );
      if (introMatch) introText = introMatch[1];

      return (
        <div className="message-content">
          {introText && <p>{introText}</p>}
          <div className="ticket-table-container">
            <h2>Support Tickets</h2>
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length > 0 ? (
                  tickets.map((ticket, idx) => (
                    <tr key={idx}>
                      <td>{ticket.id}</td>
                      <td>{ticket.description}</td>
                    </tr>
                  ))
                ) : (
                  // Add a fallback in case parsing fails
                  <tr>
                    <td colSpan="2">
                      No ticket data could be parsed. Displaying original
                      message:
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {tickets.length === 0 && (
              <div className="original-message">{message.text}</div>
            )}
          </div>
        </div>
      );
    } else {
      return message.text;
    }
  };

  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage = { user: true, text: input };
      setMessages([...messages, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // For testing - if user asks about tickets, provide a hardcoded response
        if (
          input.toLowerCase().includes("ticket") ||
          input.toLowerCase().includes("current")
        ) {
          setTimeout(() => {
            const demoTickets = {
              response: `Okay, based on the information you provided at the beginning, here are the tickets I have information on: * **Ticket ID: 10023** - The storage of laptop get full * **Ticket ID: 10010** - Update website privacy policy * **Ticket ID: 10009** - Images not loading on product page * **Ticket ID: 10008** - Application crashes on submitting feedback form * **Ticket ID: 10003** - Backup database * **Ticket ID: 10001** - Add dark mode to user interface * **Ticket ID: 10000** - Error 500 on user login page`,
            };
            const botMessage = { user: false, text: demoTickets.response };
            setMessages(prevMessages => [...prevMessages, botMessage]);
            setIsLoading(false);
          }, 1000);
        } else {
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
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages(prevMessages => [
          ...prevMessages,
          { user: false, text: "Error, please try again." },
        ]);
        setIsLoading(false);
      }
    }
  };

  const handleVoiceInput = () => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = async event => {
      const speechResult = event.results[0][0].transcript;

      // Add the recognized speech directly as a message
      setMessages(prevMessages => [
        ...prevMessages,
        { user: true, text: speechResult },
      ]);

      try {
        const response = await axios.post("http://127.0.0.1:5000/chat", {
          message: speechResult,
          conversation_history: messages.map(msg => ({
            sender: msg.user ? "user" : "bot",
            message: msg.text,
          })),
        });

        const botMessage = { user: false, text: response.data.response };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages(prevMessages => [
          ...prevMessages,
          { user: false, text: "Error, please try again." },
        ]);
      }
    };

    recognition.onerror = event => {
      console.error("Speech recognition error:", event.error);
      alert("Could not process the audio input. Please try again.");
    };
  };

  return (
    <div className="chatbox">
      <div className="chat-header">Chat with Us</div>
      <div className="messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.user ? "user" : "bot"}`}
          >
            {renderMessage(message)}
          </div>
        ))}
        {isLoading && <div className="message bot loading-indicator">...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={e => e.key === "Enter" && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
        <button onClick={handleVoiceInput} className="voice-btn">
          🎤
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
