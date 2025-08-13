import React, { useState } from 'react';

const PasswordSetting = ({ username, onPasswordSubmit }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pwd) => {
    if (pwd.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (pwd.length > 20) {
      return 'Password must be less than 20 characters';
    }
    return '';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && password.trim()) {
      const validationError = validatePassword(password.trim());
      if (validationError) {
        setError(validationError);
        return;
      }
      setError('');
      onPasswordSubmit(password.trim());
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (error && value.trim()) {
      const validationError = validatePassword(value.trim());
      if (!validationError) {
        setError('');
      }
    }
  };

  const handleSubmit = () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    const validationError = validatePassword(password.trim());
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    onPasswordSubmit(password.trim());
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="password-setting-container">
      <div className="header">
        <h1 className="title">set your password:</h1>
      </div>
      
      <div className="content">
        <div className="avatar-display">
          <div className="avatar placeholder-avatar">
            <div className="avatar-icon">👤</div>
          </div>
          <div className="user-info">
            <div className="user-name">name: {username}</div>
          </div>
        </div>
        
        <div className="input-section">
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`password-input ${error ? 'error' : ''}`}
              placeholder="write your password here:"
              value={password}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              autoFocus
              maxLength={20}
            />
            <button 
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="password-requirements">
            Password must be 6-20 characters
          </div>
        </div>
        
        <div className="actions">
          <button 
            className="continue-btn"
            onClick={handleSubmit}
            disabled={!password.trim()}
          >
            Continue
          </button>
          <div className="hint">Press Enter to continue</div>
        </div>
      </div>
    </div>
  );
};

export default PasswordSetting;