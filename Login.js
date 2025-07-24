import React, { useState, useEffect } from "react";
import { CookieUtils } from "./CookieUtils";
import { ApiService } from "./APIservice";

/**
 * Login 组件 - 处理用户登录、注册和登出功能
 * @param {Object} props
 * @param {string} props.currentPage - 当前页面状态 ('loading', 'welcome', 'login', 'signup', 'main')
 * @param {Function} props.onPageChange - 页面切换回调函数
 * @param {Function} props.onLoginSuccess - 登录成功回调函数
 * @param {Function} props.onLogout - 登出回调函数
 */
const Login = ({ currentPage, onPageChange, onLoginSuccess, onLogout }) => {
  /**
   * 消息状态 - 用于显示成功/错误消息
   */
  const [message, setMessage] = useState('');

  /**
   * 加载状态 - 用于显示加载动画
   */
  const [loading, setLoading] = useState(false);
  /**
   * 表单数据状态
   * 包含登录和注册表单的所有字段
   */

const [formData, setFormData] = useState({
  loginUsername: '',
  loginPassword: '',
  signupUsername: '',
  signupEmail: '',
  signupPassword: '',
  signupConfirmPassword: ''
});

/**
 * 选中的用户状态
 */
const [selectedUser, setSelectedUser] = useState(null);

/**
 * 预设用户列表状态
 */
const [predefinedUsers, setPredefinedUsers] = useState([]);

 // ==================== 生命周期函数 ====================
 
 /**
  * 组件加载时从Cookie读取可切换的用户列表
  */
 useEffect(() => {
   console.log('Login useEffect - 从Cookie加载可切换用户列表');
   
   try {
      // 获取所有已保存的用户名
      const allUsernames = CookieUtils.getAllSavedUsers();
      console.log('Login useEffect - 从Cookie获取的用户名列表:', allUsernames);
     
     if (allUsernames.length > 0) {
        // 转换为登录界面需要的格式
        const userList = allUsernames.map(username => {
         const userData = CookieUtils.getUserData(username);
         const avatarData = CookieUtils.getUserAvatar(username);
         
         return {
           id: username + '-' + (userData?.userType || 'user'),
           username: username,
           displayName: userData?.displayName || username,
           role: 'User',
           avatar: avatarData || username.charAt(0).toUpperCase(),
           color: '#4299e1',
           isOnline: false,
           userAvatar: avatarData
         };
       });
       
       console.log('Login useEffect - 转换后的用户列表:', userList);
       setPredefinedUsers(userList.slice(0, 2)); // 最多显示2个用户
     } else {
       console.log('Login useEffect - 没有找到已保存的用户');
       setPredefinedUsers([]);
     }
   } catch (error) {
     console.error('Login useEffect - 加载用户列表失败:', error);
     setPredefinedUsers([]);
   }
 }, []);

 // ==================== 页面导航函数 ====================
  
  /**
   * 显示登录页面
   */
  const showLogin = () => {
    onPageChange('login');
    setMessage('');
  };
  
  /**
   * 处理用户选择
   * @param {Object} user - 选中的用户对象
   */
  const handleUserSelect = async (user) => {
    console.log('用户选择:', user.username);
    setSelectedUser(user);
    setLoading(true);
    setMessage('');
    
    try {
      // 检查用户Token是否存在
      const userToken = CookieUtils.getUserToken(user.username);
      const userData = CookieUtils.getUserData(user.username);
      
      if (userToken && userData) {
        // 直接使用已保存的用户数据登录
        CookieUtils.setActiveUser(user.username);
        console.log(`用户 ${user.username} 快速登录成功`);
        
        onLoginSuccess(userData);
        onPageChange('main');
      } else {
        // 如果Token不存在，提示重新登录
        setMessage('用户数据已过期，请重新登录');
        setFormData(prev => ({ ...prev, loginUsername: user.username }));
      }
    } catch (error) {
      console.error('用户选择登录失败:', error);
      setMessage('登录失败，请重新登录');
      setFormData(prev => ({ ...prev, loginUsername: user.username }));
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 显示注册页面
   */
  const showSignup = () => {
    onPageChange('signup');
    setMessage('');
  };

  /**
   * 删除账号
   * @param {string} userId - 要删除的用户ID
   */
  const handleDeleteUser = (userId, event) => {
    event.stopPropagation(); // 防止触发用户选择
    
    if (window.confirm('确定要删除这个账号吗？此操作不可撤销。')) {
      // 从userId中提取用户名
      const username = userId.split('-')[0];
      
      // 删除Cookie中的用户数据
      CookieUtils.deleteUserToken(username);
      console.log(`已删除用户 ${username} 的所有数据`);
      
      // 更新界面显示
      setPredefinedUsers(prev => prev.filter(user => user.id !== userId));
      
      // 如果删除的是当前选中的用户，清除选择
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
      
      setMessage('账号已删除');
    }
  };
  


  // ==================== 表单处理函数 ====================
  
  /**
   * 处理表单输入变化
   * @param {string} field - 字段名
   * @param {string} value - 字段值
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 处理登录表单提交
   * @param {Event} e - 表单提交事件
   */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      // 调用登录API
      const response = await ApiService.login(formData.loginUsername, formData.loginPassword);
      
      if (response.success) {
        const userData = response.data;
        const username = userData.username;
        
        // 使用新的多用户Token管理方法
        CookieUtils.setUserToken(username, userData.token, userData, 7);
        
        // 清理旧版本的Cookie（如果存在）
        CookieUtils.deleteCookie('userToken');
        CookieUtils.deleteCookie('userData');
        
        console.log(`用户 ${username} 登录成功，已保存到多用户Token系统`);
        
        onLoginSuccess(userData);
        onPageChange('main');
        
        // 清空表单
        setFormData(prev => ({ ...prev, loginUsername: '', loginPassword: '' }));
      } else {
        setMessage(response.message);
      }
    } catch (error) {
      setMessage('登录失败，请稍后重试');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理注册表单提交
   * @param {Event} e - 表单提交事件
   */
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    // 验证密码匹配
    if (formData.signupPassword !== formData.signupConfirmPassword) {
      setMessage('Passwords do not match!');
      setLoading(false);
      return;
    }
    
    try {
      // 调用注册API
      const response = await ApiService.register(
        formData.signupUsername,
        formData.signupEmail,
        formData.signupPassword
      );
      
      if (response.success && response.data) {
        // 注册即登录成功
        const userData = response.data;
        
        // 保存用户数据到Cookie（用于用户卡片显示）
        const userCookieData = {
          username: userData.username,
          userType: userData.userType,
          email: userData.email,
          lastLogin: new Date().toISOString()
        };
        
        // 保存到Cookie，过期时间30天
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        document.cookie = `user_${userData.username}=${JSON.stringify(userCookieData)}; expires=${expires.toUTCString()}; path=/`;
        
        // 显示成功消息
        setMessage('Registration successful! Welcome!');
        
        // 清空表单
        setFormData(prev => ({
          ...prev,
          signupUsername: '',
          signupEmail: '',
          signupPassword: '',
          signupConfirmPassword: ''
        }));
        
        // 调用登录成功回调（这会自动设置用户状态并跳转到主页面）
        setTimeout(() => {
          onLoginSuccess(userData);
        }, 1000);
      } else {
        setMessage(response.message || '注册失败，请稍后重试');
      }
    } catch (error) {
      setMessage('注册失败，请稍后重试');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理用户登出

  // ==================== 渲染函数 ====================

  /**
   * 渲染用户选择卡片
   */
  const renderUserCard = (user) => (
    <div 
      key={user.id}
      className={`user-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
      onClick={() => handleUserSelect(user)}
    >
      <div className="user-avatar" style={{ backgroundColor: user.color }}>
        {user.userAvatar ? (
          <img 
            src={user.userAvatar} 
            alt={user.displayName}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        ) : (
          user.avatar
        )}
      </div>
      <div className="user-info">
        <div className="user-name">{user.displayName}</div>
        <div className="user-role">{user.role}</div>
      </div>
      <div className="user-status">
        <div className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></div>
        <span className="status-text">{user.isOnline ? 'Online' : 'Offline'}</span>
      </div>
      <button 
        className="delete-user-btn"
        onClick={(e) => handleDeleteUser(user.id, e)}
        title="删除账号"
      >
        ×
      </button>
    </div>
  );

  /**
   * 渲染登录表单
   */
  const renderLoginForm = () => (
    <div className="modern-login-container">
      <div className="login-header">
        <h1 className="login-title">Welcome to TimeDay</h1>
        <p className="login-subtitle">Choose your account to continue</p>
      </div>
      
      {message && <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>{message}</div>}
      
      <div className="user-selection">
        <h3 className="section-title">Select Account</h3>
        <div className="user-cards">
          {predefinedUsers.length === 0 ? (
            <div className="empty-accounts-message">
              <p>No accounts available</p>
              <p className="subtitle">Create your first account to get started</p>
            </div>
          ) : (
            predefinedUsers.map(user => renderUserCard(user))
          )}
          
          {predefinedUsers.length < 2 && (
            <div className="add-account-card" onClick={showSignup}>
              <div className="add-icon">+</div>
              <span>{predefinedUsers.length === 0 ? 'Create Account' : 'Add New Account'}</span>
            </div>
          )}
        </div>
        
        {predefinedUsers.length >= 2 && (
          <div className="max-accounts-info">
            <p>Maximum accounts reached (2/2)</p>
          </div>
        )}
      </div>
      
      {selectedUser && (
        <form className="password-form" onSubmit={handleLoginSubmit}>
          <div className="password-section">
            <label>Password for {selectedUser.displayName}</label>
            <input 
              type="password" 
              placeholder="Enter your password"
              value={formData.loginPassword}
              onChange={(e) => handleInputChange('loginPassword', e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="forgot-password" onClick={() => setMessage('密码重置功能开发中...')}>Forgot password?</button>
            <button type="submit" className="sign-in-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      )}
      
      <div className="login-footer">
        <div className="footer-links">
          <span>Privacy Policy • Terms of Service</span>
          <span className="language-switch">🌐 English</span>
        </div>

      </div>
    </div>
  );

  /**
   * 渲染注册表单
   */
  const renderSignupForm = () => {
    // 检查是否已达到最大账号数量
    if (predefinedUsers.length >= 2) {
      return (
        <div className="modern-signup-container">
          <div className="signup-header">
            <h1 className="signup-title">Welcome to TimeDay</h1>
            <p className="signup-subtitle">Maximum accounts reached</p>
          </div>
          
          <div className="max-accounts-message">
            <p>Maximum account limit reached (2 accounts)</p>
            <button type="button" className="back-button" onClick={showLogin}>
              Back to Login
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="modern-signup-container">
        <div className="signup-header">
          <h1 className="signup-title">Join TimeDay</h1>
          <p className="signup-subtitle">Create your account to get started</p>
        </div>
        
        {message && <div className={`message ${message.includes('成功') || message.includes('success') ? 'success' : 'error'}`}>{message}</div>}
        
        <form className="horizontal-signup-form" onSubmit={handleSignupSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                placeholder="Enter your username"
                value={formData.signupUsername}
                onChange={(e) => handleInputChange('signupUsername', e.target.value)}
                disabled={loading}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="Enter your email"
                value={formData.signupEmail}
                onChange={(e) => handleInputChange('signupEmail', e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>
           
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="Enter your password"
                value={formData.signupPassword}
                onChange={(e) => handleInputChange('signupPassword', e.target.value)}
                disabled={loading}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Confirm Password</label>
              <input 
                type="password" 
                placeholder="Confirm your password"
                value={formData.signupConfirmPassword}
                onChange={(e) => handleInputChange('signupConfirmPassword', e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>
           
           <div className="form-actions">
             <button type="button" className="back-button" onClick={showLogin} disabled={loading}>
               Back to Login
             </button>
             <button type="submit" className="signup-btn" disabled={loading}>
               {loading ? 'Creating Account...' : 'Create Account'}
             </button>
           </div>
         </form>
         
         <div className="login-footer">
           <div className="footer-links">
             <span>Privacy Policy • Terms of Service</span>
             <span className="language-switch">🌐 English</span>
           </div>
         </div>
       </div>
     );
   };

  return (
    <div className="login-container">
      {currentPage === 'login' && renderLoginForm()}
      {currentPage === 'signup' && renderSignupForm()}
    </div>
  );
};

export default Login;
  