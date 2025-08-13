import React, { useState, useEffect } from 'react';
import './App.css';
import AccountSelection from './components/AccountSelection';
import AvatarNaming from './components/AvatarNaming';
import PasswordSetting from './components/PasswordSetting';
import AvatarConfirmation from './components/AvatarConfirmation';
import IdentitySelection from './components/IdentitySelection';
import InfoSync from './components/InfoSync';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Dashboard组件
function Dashboard({ onBackToSelection }) {
  const { user, logout, sessions, isLoading, isAuthenticated } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    onBackToSelection();
  };
  
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  // 渲染保护：确保用户已认证且用户信息存在
  if (!isAuthenticated || !user) {
    console.log('Dashboard: User not authenticated or user data missing, redirecting to account selection');
    onBackToSelection();
    return null;
  }
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>欢迎回来，{user.displayName || user.username}！</h1>
        <button onClick={handleLogout} className="logout-button">注销</button>
      </div>
      
      <div className="dashboard-content">
        <div className="user-info-card">
          <h3>用户信息</h3>
          <p>用户名: {user.username}</p>
          <p>显示名: {user.displayName || '未设置'}</p>
          <p>邮箱: {user.email || '未设置'}</p>
          <p>角色: {user.role || 'user'}</p>
        </div>
        
        <div className="sessions-card">
          <h3>活跃会话</h3>
          <p>当前会话数: {sessions?.length || 0}</p>
        </div>
        
        <div className="actions-card">
          <h3>快速操作</h3>
          <button onClick={onBackToSelection} className="action-button">切换账户</button>
          <button onClick={() => window.location.reload()} className="action-button">刷新</button>
        </div>
      </div>
    </div>
  );
}

// 主应用组件
function AppContent() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState('accountSelection');
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [accountData, setAccountData] = useState({
    name: '',
    password: '',
    avatar: null,
    identity: '',
    email: ''
  });
  
  // 根据认证状态自动跳转
  useEffect(() => {
    if (isAuthenticated && user && currentStep === 'accountSelection') {
      setCurrentStep('dashboard');
    } else if (!isAuthenticated && currentStep === 'dashboard') {
      setCurrentStep('accountSelection');
    }
  }, [isAuthenticated, user, currentStep]);
  
  // 加载状态
  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  const handleCreateNew = () => {
    setCurrentStep('avatarNaming');
    setAccountData({
      name: '',
      password: '',
      avatar: null,
      identity: '',
      email: ''
    });
  };

  const handleAccountSwitch = (direction) => {
    // 这个函数现在由AccountSelection组件内部处理
    // 保留接口兼容性
  };

  const handleAccountLogin = async (account) => {
    // 登录成功后，AuthContext会自动更新状态，useEffect会处理跳转
    console.log('账户登录成功:', account);
  };

  const handleNameSubmit = (name) => {
    setAccountData(prev => ({ ...prev, name }));
    setCurrentStep('passwordSetting');
  };

  const handlePasswordSubmit = (password) => {
    setAccountData(prev => ({ ...prev, password }));
    setCurrentStep('avatarConfirmation');
  };

  const handleAvatarConfirm = (avatarData) => {
    setAccountData(prev => ({ ...prev, avatar: avatarData?.avatar || null }));
    setCurrentStep('identitySelection');
  };

  const handleIdentitySubmit = (identity) => {
    setAccountData(prev => ({ ...prev, identity }));
    setCurrentStep('infoSync');
  };

  const handleSyncComplete = async () => {
    // 注册成功后，AuthContext会自动处理登录和状态更新
    // useEffect会检测到认证状态变化并跳转到dashboard
    console.log('账户注册完成:', accountData);
    
    // 重置账户数据
    setAccountData({
      name: '',
      password: '',
      avatar: null,
      identity: '',
      email: ''
    });
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'accountSelection':
        return (
          <AccountSelection
            onCreateNew={handleCreateNew}
            onAccountLogin={handleAccountLogin}
          />
        );
      case 'avatarNaming':
        return (
          <AvatarNaming
            onNameSubmit={handleNameSubmit}
          />
        );
      case 'passwordSetting':
        return (
          <PasswordSetting
            username={accountData.name}
            onPasswordSubmit={handlePasswordSubmit}
          />
        );
      case 'avatarConfirmation':
        return (
          <AvatarConfirmation
            username={accountData.name}
            password={accountData.password}
            onConfirm={handleAvatarConfirm}
          />
        );
      case 'identitySelection':
        return (
          <IdentitySelection
            username={accountData.name}
            avatar={accountData.avatar}
            onIdentitySubmit={handleIdentitySubmit}
          />
        );
      case 'infoSync':
        return (
          <InfoSync
            username={accountData.name}
            avatar={accountData.avatar}
            accountData={accountData}
            onSyncComplete={handleSyncComplete}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            onBackToSelection={() => setCurrentStep('accountSelection')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      {renderCurrentStep()}
    </div>
  );
}

// 主 App 组件
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
