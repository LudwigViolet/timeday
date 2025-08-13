import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const InfoSync = ({ accountData, avatar, onSyncComplete }) => {
  const { register, login } = useAuth();
  const [progress, setProgress] = useState(0);
  const [syncStage, setSyncStage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const hasStartedRegistration = useRef(false);
  const animationRef = useRef(null);

  const syncStages = [
    'Initializing account...',
    'Setting up profile...',
    'Configuring preferences...',
    'Syncing data...',
    'Finalizing setup...',
    'Complete!'
  ];

  // 统一错误处理
  const handleError = React.useCallback((error) => {
    console.error('InfoSync error:', error);
    setError(error.message || error || 'An error occurred during setup');
    setIsProcessing(false);
    setProgress(0);
    setSyncStage(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // 统一完成处理
  const finalizeSync = React.useCallback(() => {
    setProgress(100);
    setSyncStage(syncStages.length - 1); // "Complete!"
    setTimeout(() => {
      setIsProcessing(false);
      onSyncComplete();
    }, 500);
  }, [onSyncComplete, syncStages.length]);

  // 处理用户名已存在的情况，尝试自动登录
  const handleExistingUser = React.useCallback(async (username, password) => {
    try {
      const loginResult = await login({ username, password });
      if (loginResult.success) {
        console.log('Auto-login successful:', loginResult.user);
        finalizeSync();
      } else {
        handleError('Username exists but auto-login failed. Please contact administrator.');
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      handleError('Username exists but auto-login failed. Please contact administrator.');
    }
  }, [login, finalizeSync, handleError]);

  // 执行真实的注册请求（独立于动画）
  const performActualRegistration = React.useCallback(async (userData) => {
    try {
      // 设置最终阶段
      setSyncStage(syncStages.length - 2); // "Finalizing setup..."
      
      const result = await register(userData);
      
      if (result.success) {
        console.log('Registration successful:', result.user);
        finalizeSync();
      } else if (result && result.error === 'USERNAME_EXISTS') {
        // 用户名已存在，尝试自动登录
        console.log('Username exists, attempting auto-login...');
        await handleExistingUser(userData.username, userData.password);
      } else {
        handleError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      handleError(error);
    }
  }, [register, syncStages.length, finalizeSync, handleExistingUser, handleError]);

  // 处理注册流程 - 动画与异步逻辑完全分离
  const handleRegistration = React.useCallback((userData) => {
    setSyncStage(0);
    setProgress(0);
    setIsProcessing(true);
    
    const startTime = Date.now();
    const animationDuration = 2000; // 2秒动画
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min(90, (elapsed / animationDuration) * 90);
      const stageIndex = Math.min(
        syncStages.length - 3,
        Math.floor((elapsed / animationDuration) * (syncStages.length - 2))
      );
      
      setProgress(progressPercent);
      setSyncStage(stageIndex);
      
      if (elapsed < animationDuration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 动画完成，设置到90%并启动异步注册
        setProgress(90);
        setSyncStage(syncStages.length - 2);
        // 异步注册独立执行，不阻塞动画
        performActualRegistration(userData);
      }
    };
    
    // 启动动画
    animationRef.current = requestAnimationFrame(animate);
  }, [syncStages.length, performActualRegistration]);

  useEffect(() => {
    if (hasStartedRegistration.current) return;
    hasStartedRegistration.current = true;
    
    // 构建完整的用户注册数据
    const userData = {
      username: accountData.name || accountData.username,
      password: accountData.password || `${(accountData.name || accountData.username)}123!`, // 使用设置的密码或默认密码
      displayName: accountData.name || accountData.username,
      avatar: avatar || {
        type: 'initials',
        value: (accountData.name || accountData.username).substring(0, 2).toUpperCase(),
        backgroundColor: '#4ECDC4'
      },
      role: accountData.identity || 'student',
      email: accountData.email || `${(accountData.name || accountData.username).toLowerCase()}@adcote.cn`
    };
    
    console.log('InfoSync: 准备注册用户数据:', userData);
    
    // 启动注册流程（不await，让动画自然触发）
    handleRegistration(userData);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [accountData, avatar, handleRegistration]);

  const handleRetry = () => {
    setError('');
    hasStartedRegistration.current = false;
    setIsProcessing(false);
    setProgress(0);
    setSyncStage(0);
    
    // 清理动画
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  return (
    <div className="info-sync-container">
      <div className="header">
        <h1 className="title">Setting up your account</h1>
      </div>
      
      <div className="content">
        <div className="user-preview">
          <div className="avatar">
            {avatar ? (
              <div className="avatar-icon">
                {typeof avatar === 'string' ? avatar : (
                  avatar.emoji || avatar.icon || avatar.initials || '👤'
                )}
              </div>
            ) : (
              <div className="avatar-icon placeholder">👤</div>
            )}
          </div>
          <div className="user-info">
            <div className="user-name">{accountData?.username}</div>
            <div className="user-email">{accountData?.email || `@${accountData?.username?.toLowerCase()}:adcote.cn`}</div>
          </div>
        </div>
        
        <div className="sync-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.round(progress)}%` }}
            ></div>
          </div>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>
        
        <div className="sync-status">
          {error ? (
            <div className="error-message">
              <div className="error-icon">❌</div>
              <div className="error-text">{error}</div>
              <button 
                className="retry-button" 
                onClick={handleRetry}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Retry'}
              </button>
            </div>
          ) : (
            <>
              <div className="status-message">
                {syncStages[syncStage]}
              </div>
              {syncStage < syncStages.length - 1 && (
                <div className="loading-animation">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              )}
              {syncStage === syncStages.length - 1 && (
                <div className="success-icon">✅</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoSync;