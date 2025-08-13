import React, { useState } from 'react';

const AvatarConfirmation = ({ username, password, onConfirm }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // 预设头像选项
  const avatarOptions = [
    '👤', '😀', '😎', '🤓', '😊', '🥳', 
    '🐱', '🐶', '🦊', '🐼', '🦁', '🐸',
    '🌟', '⭐', '🔥', '💎', '🎯', '🚀'
  ];

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    setShowAvatarModal(false);
  };

  const handleSubmit = () => {
    onConfirm({ avatar: selectedAvatar });
  };

  const openAvatarModal = () => {
    setShowAvatarModal(true);
  };

  const closeAvatarModal = () => {
    setShowAvatarModal(false);
  };

  return (
    <div className="avatar-confirmation-container">
      <div className="header">
        <h1 className="title">set your avatar:</h1>
      </div>
      
      <div className="content">
        <div className="avatar-display">
          <div className="avatar clickable-avatar" onClick={openAvatarModal}>
            {selectedAvatar ? (
              <div className="avatar-icon selected">{selectedAvatar}</div>
            ) : (
              <div className="avatar-icon placeholder">👤</div>
            )}
            <div className="avatar-overlay">
              <span>Click to change</span>
            </div>
          </div>
        </div>
        
        <div className="user-summary">
          <div className="user-detail">
            <span className="label">name:</span>
            <span className="value">{username}</span>
          </div>
          <div className="user-detail">
            <span className="label">password:</span>
            <span className="value">{'*'.repeat(password.length)}</span>
          </div>
        </div>
        
        <div className="actions">
          <button 
            className="continue-btn"
            onClick={handleSubmit}
          >
            Continue
          </button>
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="avatar-modal-overlay" onClick={closeAvatarModal}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Choose your avatar</h2>
              <button className="close-btn" onClick={closeAvatarModal}>×</button>
            </div>
            <div className="avatar-grid">
              {avatarOptions.map((avatar, index) => (
                <div 
                  key={index}
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  {avatar}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarConfirmation;