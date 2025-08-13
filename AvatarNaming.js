import React, { useState } from 'react';

const AvatarNaming = ({ onNameSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && name.trim()) {
      handleSubmit();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setName(value);
    if (error && value.trim().length >= 2) {
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    
    setError('');
    
    // 只收集用户名信息，不调用注册API
    // 真正的注册将在InfoSync阶段进行
    console.log('收集用户名:', name.trim());
    onNameSubmit(name.trim());
  };

  return (
    <div className="avatar-naming-container">
      <div className="header">
        <h1 className="title">name your avatar:</h1>
      </div>
      
      <div className="content">
        <div className="avatar-display">
          <div className="avatar placeholder-avatar">
            <div className="avatar-icon">👤</div>
          </div>
        </div>
        
        <div className="input-section">
          <input
            type="text"
            className={`name-input ${error ? 'error' : ''}`}
            placeholder="write your name here:"
            value={name}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            autoFocus
            maxLength={20}
          />
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        
        <div className="actions">
          <button 
            className="continue-btn"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Continue
          </button>
          <div className="hint">Press Enter to continue</div>
        </div>
      </div>
    </div>
  );
};

export default AvatarNaming;