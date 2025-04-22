import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/ChatBox.css';

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage = { user: true, text: input };
      setMessages([...messages, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await axios.post('http://127.0.0.1:5000/chat', {
          message: input,
          conversation_history: messages.map(msg => ({ sender: msg.user ? 'user' : 'bot', message: msg.text }))
        });

        const botMessage = { user: false, text: response.data.response };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages => [...prevMessages, { user: false, text: 'Error, please try again.' }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVoiceInput = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  
    recognition.start();
  
    recognition.onresult = async (event) => {
      const speechResult = event.results[0][0].transcript;
  
      // Add the recognized speech directly as a message
      setMessages(prevMessages => [...prevMessages, { user: true, text: speechResult }]);
  
      try {
        const response = await axios.post('http://127.0.0.1:5000/chat', {
          message: speechResult,
          conversation_history: messages.map(msg => ({ sender: msg.user ? 'user' : 'bot', message: msg.text }))
        });
  
        const botMessage = { user: false, text: response.data.response };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages => [...prevMessages, { user: false, text: 'Error, please try again.' }]);
      }
    };
  
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      alert("Could not process the audio input. Please try again.");
    };
  };
  

  return (
    <div className="chatbox">
      <div className="chat-header">Chat with Us</div>
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.user ? 'user' : 'bot'}`}>
            {message.text}
          </div>
        ))}
        {isLoading && <div className="message bot loading-indicator">...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
        <button onClick={handleVoiceInput} className="voice-btn">🎤</button>
      </div>
    </div>
  );
};

export default ChatBox;
