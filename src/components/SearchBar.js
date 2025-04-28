import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import '../styles/SearchBar.css';

const SearchBar = ({ placeholder = "Search tickets...", onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();

  // Sample quick search suggestions
  const recentSearches = [
    'High priority tickets',
    'Bugs assigned to me',
    'Updated in last 24 hours'
  ];

  const quickLinks = [
    { text: 'View Dashboard', path: '/dashboard' },
    { text: 'Create New Ticket', path: '/ticket-summary' },
    { text: 'Chat with Assistant', path: '/chat' }
  ];

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log(`Searching for: ${searchTerm}`);
      // For a global search, we could navigate to a search results page
      // navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleQuickSearch = (term) => {
    setSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
    setIsActive(false);
  };

  const handleQuickLink = (path) => {
    navigate(path);
    setIsActive(false);
  };

  return (
    <div className={`global-search ${isActive ? 'active' : ''}`}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder={placeholder}
            onFocus={() => setIsActive(true)}
            className="search-input"
          />
          {searchTerm && (
            <button type="button" className="clear-button" onClick={handleClear}>
              <FaTimes />
            </button>
          )}
        </div>
        
        {isActive && (
          <div className="search-dropdown">
            {recentSearches.length > 0 && (
              <div className="search-section">
                <h3 className="search-section-title">Recent Searches</h3>
                <ul className="search-list">
                  {recentSearches.map((term, index) => (
                    <li key={index} onClick={() => handleQuickSearch(term)}>
                      <FaSearch className="search-suggestion-icon" />
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="search-section">
              <h3 className="search-section-title">Quick Links</h3>
              <ul className="search-list">
                {quickLinks.map((link, index) => (
                  <li key={index} onClick={() => handleQuickLink(link.path)}>
                    <span>{link.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="search-footer">
              <p>Press Enter to search or Escape to close</p>
            </div>
          </div>
        )}
      </form>
      
      {isActive && (
        <div className="search-overlay" onClick={() => setIsActive(false)}></div>
      )}
    </div>
  );
};

export default SearchBar;