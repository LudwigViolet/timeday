import React, { useState } from 'react';

const IdentitySelection = ({ username, avatar, onIdentitySubmit }) => {
  const [selectedIdentity, setSelectedIdentity] = useState('');

  const handleIdentitySelect = (identity) => {
    setSelectedIdentity(identity);
  };

  const handleConfirm = () => {
    if (selectedIdentity) {
      onIdentitySubmit(selectedIdentity);
    }
  };

  return (
    <div className="identity-selection-container">
      <div className="header">
        <h1 className="title">Welcome, {username}!</h1>
      </div>
      
      <div className="content">
        <div className="user-display">
          <div className="avatar">
            {avatar ? (
              <div className="avatar-icon">{avatar}</div>
            ) : (
              <div className="avatar-icon placeholder">👤</div>
            )}
          </div>
          <div className="welcome-message">
            Choose your role to get started
          </div>
        </div>
        
        <div className="identity-options">
          <div 
            className={`identity-option ${selectedIdentity === 'teacher' ? 'selected' : ''}`}
            onClick={() => handleIdentitySelect('teacher')}
          >
            <div className="option-indicator"></div>
            <span>I'm Teacher</span>
          </div>
          
          <div 
            className={`identity-option ${selectedIdentity === 'student' ? 'selected' : ''}`}
            onClick={() => handleIdentitySelect('student')}
          >
            <div className="option-indicator"></div>
            <span>I'm Student</span>
          </div>
        </div>
        
        {selectedIdentity && (
          <div className="actions">
            <button 
              className="continue-btn"
              onClick={handleConfirm}
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentitySelection;