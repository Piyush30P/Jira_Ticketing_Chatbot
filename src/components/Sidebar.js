import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaComment, 
  FaChartBar, 
  FaTicketAlt, 
  FaUser,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaQuestion
} from 'react-icons/fa';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  
  // Sample notification count for demonstration
  const notificationCount = 3;
  
  // Navigation items
  const navItems = [
    { path: '/home', icon: <FaHome />, text: 'Home' },
    { path: '/chat', icon: <FaComment />, text: 'Chat' },
    { path: '/dashboard', icon: <FaChartBar />, text: 'Dashboard' },
    { path: '/ticket-summary', icon: <FaTicketAlt />, text: 'Tickets', badge: notificationCount },
  ];
  
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // Close mobile menu when a link is clicked
  const handleNavLinkClick = () => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile toggle button - appears only on mobile */}
      <button 
        className="mobile-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        {mobileOpen ? <FaTimes /> : <FaBars />}
      </button>
      
      <div className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`} onClick={toggleMobileMenu}></div>
      
      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">JT</div>
            <h1 className="logo-text">Jira Chat</h1>
          </div>
          
          <button 
            className="collapse-btn"
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <FaBars /> : <FaBars />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item, index) => (
              <li key={index}>
                <NavLink 
                  to={item.path} 
                  className={({isActive}) => isActive ? 'active' : ''}
                  onClick={handleNavLinkClick}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.text}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="help-button">
            <FaQuestion />
            <span className="help-text">Help</span>
          </div>
          
          <div className="user-profile">
            <div className="profile-avatar">
              <FaUser />
            </div>
            <div className="profile-info">
              <p className="user-name">John Doe</p>
              <p className="user-role">Developer</p>
            </div>
            <button className="logout-btn">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;