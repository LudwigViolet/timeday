import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AccountSelection = ({ onCreateNew, onAccountLogin }) => {
  const { accounts, login, isLoading, error } = useAuth();
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [loginError, setLoginError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // 创建包含"新账户"占位的显示数组
  const displayAccounts = [...accounts, null]; // null 表示"创建新用户"
  const currentAccount = displayAccounts[currentAccountIndex];
  
  // 账户切换处理
  const handleAccountSwitch = (direction) => {
    const totalLength = displayAccounts.length;
    
    if (direction === 'next') {
      setCurrentAccountIndex((prev) => (prev + 1) % totalLength);
    } else {
      setCurrentAccountIndex((prev) => (prev - 1 + totalLength) % totalLength);
    }
  };
  
  // 处理账户登录
  const handleAccountLogin = (account) => {
    if (!account) return;
    
    setLoginError(null);
    setSelectedAccount(account);
    setShowPasswordModal(true);
  };
  
  // 处理密码提交
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || !selectedAccount) return;
    
    setIsLoggingIn(true);
    setLoginError(null);
    
    try {
      const result = await login(selectedAccount.username, password);
      
      if (result.success) {
        console.log('账户登录成功:', result.user);
        // 登录成功后，AuthContext会自动更新isAuthenticated状态
        // 不需要调用onAccountLogin回调，让useEffect处理页面跳转
        setShowPasswordModal(false);
        setPassword('');
        setSelectedAccount(null);
      } else {
        setLoginError(result.error || '登录失败');
      }
    } catch (error) {
      console.error('账户登录失败:', error);
      setLoginError('登录过程中发生错误');
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // 关闭密码模态框
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPassword('');
    setSelectedAccount(null);
    setLoginError(null);
  };

  return (
    <div className="account-selection-container">
      <div className="header">
        <h1 className="title">Welcome to TimeDay</h1>
        <p className="subtitle">choose an account:</p>
      </div>
      
      <div className="account-switcher">
        <button 
          className={`nav-arrow ${displayAccounts.length <= 1 ? 'disabled' : ''}`}
          onClick={() => displayAccounts.length > 1 && handleAccountSwitch('prev')}
          disabled={displayAccounts.length <= 1}
        >
          ‹
        </button>
        
        <div className="account-display">
          <div 
            className={`avatar ${!currentAccount ? 'create-new' : ''} ${isLoading ? 'loading' : ''}`}
            onClick={!currentAccount ? onCreateNew : () => handleAccountLogin(currentAccount)}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : currentAccount ? (
              currentAccount.avatar ? (
                typeof currentAccount.avatar === 'string' ? (
                  <img 
                    src={currentAccount.avatar} 
                    alt={currentAccount.name || currentAccount.displayName}
                    className="avatar-img"
                  />
                ) : (
                  <div 
                    className="avatar-icon"
                    style={currentAccount.avatar.backgroundColor ? { backgroundColor: currentAccount.avatar.backgroundColor } : {}}
                  >
                    {currentAccount.avatar.value || currentAccount.avatar.type || '👤'}
                  </div>
                )
              ) : (
                <div className="avatar-icon">👤</div>
              )
            ) : (
              <div className="create-icon">+</div>
            )}
          </div>
          
          {currentAccount ? (
            <div className="account-info">
              <div className="account-name">{currentAccount.displayName || currentAccount.name || currentAccount.username}</div>
              <div className="account-email">{currentAccount.email}</div>
            </div>
          ) : (
            <div className="create-prompt">click to create new</div>
          )}
        </div>
        
        <button 
          className={`nav-arrow ${displayAccounts.length <= 1 ? 'disabled' : ''}`}
          onClick={() => displayAccounts.length > 1 && handleAccountSwitch('next')}
          disabled={displayAccounts.length <= 1}
        >
          ›
        </button>
      </div>
      
      <div className="footer">
        <a href="#" className="footer-link">language</a>
        <span className="separator">·</span>
        <a href="#" className="footer-link">agreement</a>
        <span className="separator">·</span>
        <a href="#" className="footer-link">email</a>
      </div>
      
      {/* 密码输入模态框 */}
      {showPasswordModal && (
        <div className="password-modal-overlay" onClick={handleClosePasswordModal}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>输入密码</h3>
              <button className="close-btn" onClick={handleClosePasswordModal}>×</button>
            </div>
            <div className="modal-body">
              <p>请输入 {selectedAccount?.displayName || selectedAccount?.username} 的密码:</p>
              <form onSubmit={handlePasswordSubmit}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                  className="password-input"
                  autoFocus
                  disabled={isLoggingIn}
                />
                {loginError && (
                  <div className="error-message">{loginError}</div>
                )}
                <div className="modal-actions">
                  <button 
                    type="button" 
                    onClick={handleClosePasswordModal}
                    className="cancel-btn"
                    disabled={isLoggingIn}
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    className="login-btn"
                    disabled={!password.trim() || isLoggingIn}
                  >
                    {isLoggingIn ? '登录中...' : '登录'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSelection;