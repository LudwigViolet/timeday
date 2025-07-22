import React, { useState } from "react";
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

 // ==================== 页面导航函数 ====================
  
  /**
   * 显示登录页面
   */
  const showLogin = () => {
    onPageChange('login');
    setMessage('');
  };
  
  /**
   * 显示注册页面
   */
  const showSignUp = () => {
    onPageChange('signup');
    setMessage('');
  };
  
  /**
   * 显示欢迎页面
   */
  const showWelcome = () => {
    onPageChange('welcome');
    setMessage('');
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
        // 保存用户信息到Cookie
        CookieUtils.setCookie('userToken', userData.token, 7);
        CookieUtils.setCookie('userData', JSON.stringify(userData), 7);
        
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
      setMessage('密码不匹配！');
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
      
      if (response.success) {
        setMessage(response.message);
        // 清空表单
        setFormData(prev => ({
          ...prev,
          signupUsername: '',
          signupEmail: '',
          signupPassword: '',
          signupConfirmPassword: ''
        }));
        // 2秒后跳转到登录页面
        setTimeout(() => {
          onPageChange('login');
          setMessage('');
        }, 2000);
      } else {
        setMessage(response.message);
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
   * 清理所有用户状态和Cookie
   */
  const handleLogout = () => {
    CookieUtils.deleteCookie('userToken');
    CookieUtils.deleteCookie('userData');
    onLogout();
    setMessage('');
  };

  // ==================== 渲染函数 ====================

  /**
   * 渲染欢迎页面
   */
  const renderWelcome = () => (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="welcome-title">Welcome to Timeday</h1>
        <p className="welcome-subtitle">for pastpaper searching</p>
        <div className="welcome-buttons">
          <button className="welcome-btn signup-btn" onClick={showSignUp}>
            Sign Up
          </button>
          <button className="welcome-btn login-btn" onClick={showLogin}>
            Login
          </button>
        </div>
      </div>
    </div>
  );

  /**
   * 渲染登录表单
   */
  const renderLoginForm = () => (
    <form className="login-form active" onSubmit={handleLoginSubmit}>
      <h1 className="page-title">Login Page</h1>
      {message && <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>{message}</div>}
      
      <div className="form-row">
        <div className="form-group">
          <label>用戶名：</label>
          <input 
            type="text" 
            placeholder="請輸入用戶名"
            value={formData.loginUsername}
            onChange={(e) => handleInputChange('loginUsername', e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="form-group">
          <label>密碼：</label>
          <input 
            type="password" 
            placeholder="請輸入密碼"
            value={formData.loginPassword}
            onChange={(e) => handleInputChange('loginPassword', e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>
      
      <div className="button-row">
        <button type="button" className="back-button" onClick={showWelcome} disabled={loading}>
          返回
        </button>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? '登入中...' : '登入'}
        </button>
      </div>
      
      <div className="form-footer">
        <p>還沒有帳號？ <button type="button" className="link-button" onClick={showSignUp}>立即註冊</button></p>
        <p className="test-accounts">測試帳號: tzy/123456 (访客) | TZY/123456 (用户)</p>
      </div>
    </form>
  );

  /**
   * 渲染注册表单
   */
  const renderSignupForm = () => (
    <form className="login-form active" onSubmit={handleSignupSubmit}>
      <h1 className="page-title">Sign Up Page</h1>
      {message && <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>{message}</div>}
      
      <div className="form-row">
        <div className="form-group">
          <label>用戶名：</label>
          <input 
            type="text" 
            placeholder="請輸入用戶名"
            value={formData.signupUsername}
            onChange={(e) => handleInputChange('signupUsername', e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="form-group">
          <label>電子郵件：</label>
          <input 
            type="email" 
            placeholder="請輸入電子郵件"
            value={formData.signupEmail}
            onChange={(e) => handleInputChange('signupEmail', e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>密碼：</label>
          <input 
            type="password" 
            placeholder="請輸入密碼"
            value={formData.signupPassword}
            onChange={(e) => handleInputChange('signupPassword', e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="form-group">
          <label>確認密碼：</label>
          <input 
            type="password" 
            placeholder="請再次輸入密碼"
            value={formData.signupConfirmPassword}
            onChange={(e) => handleInputChange('signupConfirmPassword', e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>
      
      <div className="button-row">
        <button type="button" className="back-button" onClick={showWelcome} disabled={loading}>
          返回
        </button>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? '註冊中...' : '註冊'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="login-container">
      {currentPage === 'welcome' && renderWelcome()}
      {currentPage === 'login' && renderLoginForm()}
      {currentPage === 'signup' && renderSignupForm()}
    </div>
  );
};

export default Login;
  