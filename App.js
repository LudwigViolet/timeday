import React, { useState, useEffect } from 'react';
import './App.css';

// ==================== 工具函数 ====================

/**
 * Cookie操作工具类
 * 用于管理用户登录状态的持久化存储
 * 后端对接说明：这些Cookie值需要与后端的session/token验证机制对应
 */
const CookieUtils = {
  /**
   * 设置Cookie
   * @param {string} name - Cookie名称
   * @param {string} value - Cookie值
   * @param {number} days - 过期天数
   * 后端对接：userToken和userData是关键的Cookie，需要后端验证
   */
  setCookie: (name, value, days) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  },
  
  /**
   * 获取Cookie值
   * @param {string} name - Cookie名称
   * @returns {string|null} Cookie值或null
   */
  getCookie: (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },
  
  /**
   * 删除Cookie
   * @param {string} name - Cookie名称
   * 用于用户登出时清理登录状态
   */
  deleteCookie: (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

/**
 * 浏览历史工具类
 * 用于管理用户的浏览记录，存储在localStorage中
 * 后端对接说明：这些数据可以同步到后端用户行为分析系统
 */
const HistoryUtils = {
  /**
   * 获取浏览历史
   * @returns {Array} 浏览历史数组
   */
  getHistory: () => {
    const history = localStorage.getItem('browsingHistory');
    return history ? JSON.parse(history) : [];
  },
  
  /**
   * 添加浏览记录
   * @param {Object} item - 浏览项目对象
   * 后端对接：可以通过API将浏览行为发送到后端进行用户行为分析
   */
  addToHistory: (item) => {
    let history = HistoryUtils.getHistory();
    const existingIndex = history.findIndex(h => h.id === item.id && h.type === item.type);
    
    if (existingIndex !== -1) {
      // 更新访问次数和最后访问时间
      history[existingIndex].visitCount = (history[existingIndex].visitCount || 1) + 1;
      history[existingIndex].lastVisited = new Date().toISOString();
    } else {
      // 添加新的浏览记录
      history.unshift({
        ...item,
        visitCount: 1,
        lastVisited: new Date().toISOString()
      });
    }
    
    // 限制历史记录数量为50条
    history = history.slice(0, 50);
    localStorage.setItem('browsingHistory', JSON.stringify(history));
  },
  
  /**
   * 清空浏览历史
   */
  clearHistory: () => {
    localStorage.removeItem('browsingHistory');
  }
};

// ==================== API服务 ====================

/**
 * API服务类 - 与后端接口对接的核心模块
 * 后端开发人员需要实现以下所有API接口
 * 所有接口都应该返回统一的响应格式：{ success: boolean, data?: any, message?: string }
 */
const ApiService = {
  /**
   * 用户登录接口
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 登录响应
   * 
   * 后端API接口：POST /api/auth/login
   * 请求体：{ username: string, password: string }
   * 响应格式：{
   *   success: boolean,
   *   data?: {
   *     username: string,
   *     userType: 'user' | 'guest',  // 用户类型决定功能权限
   *     email: string,
   *     token: string  // JWT token或session token
   *   },
   *   message?: string
   * }
   */
  login: async (username, password) => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟用户数据 - 后端需要替换为真实的用户验证逻辑
    const users = {
      'tzy': { password: '123456', userType: 'guest', email: 'tzy@example.com' },
      'TZY': { password: '123456', userType: 'user', email: 'test@example.com' }
    };
    
    if (users[username] && users[username].password === password) {
      return {
        success: true,
        data: {
          username,
          userType: users[username].userType,
          email: users[username].email,
          token: 'mock_token_' + Date.now()  // 后端需要生成真实的JWT token
        }
      };
    }
    
    return {
      success: false,
      message: '用戶名或密碼錯誤'
    };
  },
  
  /**
   * 用户注册接口
   * @param {string} username - 用户名
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @returns {Promise<Object>} 注册响应
   * 
   * 后端API接口：POST /api/auth/register
   * 请求体：{ username: string, email: string, password: string }
   * 响应格式：{ success: boolean, message: string }
   */
  register: async (username, email, password) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 模拟用户名重复检查 - 后端需要实现真实的用户名唯一性验证
    if (username === 'existing_user') {
      return {
        success: false,
        message: '用戶名已存在'
      };
    }
    
    return {
      success: true,
      message: '註冊成功！請登入您的帳號。'
    };
  },
  
  /**
   * 会话验证接口
   * @param {string} token - 用户token
   * @returns {Promise<Object>} 验证响应
   * 
   * 后端API接口：POST /api/auth/validate
   * 请求头：Authorization: Bearer {token}
   * 响应格式：{ success: boolean }
   */
  validateSession: async (token) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // 后端需要验证token的有效性
    return { success: true };
  },
  
  /**
   * 获取学科数据接口
   * @returns {Promise<Object>} 学科数据响应
   * 
   * 后端API接口：GET /api/subjects
   * 响应格式：{
   *   success: boolean,
   *   data: {
   *     [subjectKey]: {
   *       name: string,
   *       icon: string,
   *       topics: Array<{
   *         id: string,
   *         name: string,
   *         papers: number,
   *         lastUpdated: string
   *       }>
   *     }
   *   }
   * }
   */
  getSubjects: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      data: subjectsData  // 后端需要从数据库获取真实的学科数据
    };
  },
  
  /**
   * 搜索试卷接口
   * @param {string} query - 搜索关键词
   * @returns {Promise<Object>} 搜索结果
   * 
   * 后端API接口：GET /api/papers/search?q={query}
   * 响应格式：{
   *   success: boolean,
   *   data: Array<{
   *     id: string,
   *     title: string,
   *     subject: string,
   *     year: string,
   *     session: string,
   *     paperNumber: number
   *   }>
   * }
   */
  searchPapers: async (query) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      success: true,
      data: []  // 后端需要实现真实的搜索逻辑
    };
  }
};

// ==================== 模拟数据 ====================

/**
 * 学科数据结构
 * 后端数据库表结构参考：
 * subjects表：id, name, icon, created_at, updated_at
 * topics表：id, subject_id, name, code, papers_count, last_updated
 * papers表：id, topic_id, title, year, session, paper_number, file_path
 */
const subjectsData = {
  physics: {
    name: 'Physics',
    icon: '⚛️',
    topics: [
      { id: '9702', name: 'AS Level Physics', papers: 156, lastUpdated: '2024-01-15' },
      { id: '0625', name: 'IGCSE Physics', papers: 234, lastUpdated: '2024-01-10' }
    ]
  },
  chemistry: {
    name: 'Chemistry',
    icon: '🧪',
    topics: [
      { id: '9701', name: 'AS Level Chemistry', papers: 142, lastUpdated: '2024-01-12' },
      { id: '0620', name: 'IGCSE Chemistry', papers: 198, lastUpdated: '2024-01-08' }
    ]
  },
  mathematics: {
    name: 'Mathematics',
    icon: '📐',
    topics: [
      { id: '9709', name: 'AS Level Mathematics', papers: 178, lastUpdated: '2024-01-14' },
      { id: '0580', name: 'IGCSE Mathematics', papers: 267, lastUpdated: '2024-01-09' }
    ]
  },
  biology: {
    name: 'Biology',
    icon: '🧬',
    topics: [
      { id: '9700', name: 'AS Level Biology', papers: 134, lastUpdated: '2024-01-11' },
      { id: '0610', name: 'IGCSE Biology', papers: 189, lastUpdated: '2024-01-07' }
    ]
  },
  english: {
    name: 'English',
    icon: '📚',
    topics: [
      { id: '9093', name: 'AS Level English Language', papers: 98, lastUpdated: '2024-01-13' },
      { id: '0500', name: 'IGCSE First Language English', papers: 156, lastUpdated: '2024-01-06' }
    ]
  },
  economics: {
    name: 'Economics',
    icon: '📊',
    topics: [
      { id: '9708', name: 'AS Level Economics', papers: 87, lastUpdated: '2024-01-16' },
      { id: '0455', name: 'IGCSE Economics', papers: 123, lastUpdated: '2024-01-05' }
    ]
  }
};

/**
 * 文件查看器组件
 * 用于预览试卷文件
 * 后端对接：需要提供文件预览API和下载API
 */
const FileViewer = ({ file, onClose }) => {
  if (!file) return null;
  
  return (
    <div className="file-viewer-overlay" onClick={onClose}>
      <div className="file-viewer" onClick={e => e.stopPropagation()}>
        <div className="file-viewer-header">
          <div className="file-info">
            <h3>{file.title}</h3>
            <div className="file-meta">
              <span className="duration">Duration: 2h15m</span>
              {/* 后端需要提供标准答案链接API */}
              <button className="mark-scheme-link">Mark scheme link</button>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="file-content">
          <div className="candidate-section">
            <h4>CANDIDATE NAME</h4>
            <div className="candidate-lines">
              <div className="line"></div>
              <div className="line"></div>
              <div className="line"></div>
            </div>
          </div>
          {/* 这里需要集成PDF查看器或图片查看器 */}
          {/* 后端需要提供文件内容API：GET /api/files/{fileId}/content */}
        </div>
      </div>
    </div>
  );
};

/**
 * 用户测试数据
 * 后端数据库表结构参考：
 * user_textbooks表：id, user_id, title, subject, file_path
 * user_syllabuses表：id, user_id, title, subject, year, level, file_path
 * user_notebooks表：id, user_id, title, subject, pages, content
 */
const userTestData = {
  textBooks: [
    { id: 1, title: 'IGCSE Physics Textbook Vol.1', subject: 'Physics', type: 'textbook' },
    { id: 2, title: 'AS Level Math Syllabus Notes', subject: 'Mathematics', type: 'textbook' }
  ],
  syllabuses: [
    { id: 1, title: '2024 Physics Syllabus', subject: 'Physics', year: '2024' },
    { id: 2, title: 'Math AS Level Syllabus', subject: 'Mathematics', level: 'AS' },
    { id: 3, title: 'Chemistry IGCSE Syllabus', subject: 'Chemistry', level: 'IGCSE' }
  ],
  notebooks: [
    { id: 1, title: 'Physics Lab Notes', subject: 'Physics', pages: 45 }
  ]
};

// ==================== 主组件 ====================

/**
 * App主组件
 * 管理整个应用的状态和路由
 */
function App() {
  // ==================== 状态管理 ====================
  
  /**
   * 当前页面状态
   * 可能的值：'loading', 'welcome', 'login', 'signup', 'main'
   */
  const [currentPage, setCurrentPage] = useState('loading');
  
  /**
   * 用户信息状态
   * 结构：{ username: string, userType: 'user'|'guest', email: string, token: string }
   */
  const [user, setUser] = useState(null);
  
  /**
   * 加载状态 - 用于显示加载动画
   */
  const [loading, setLoading] = useState(false);
  
  /**
   * 消息状态 - 用于显示成功/错误消息
   */
  const [message, setMessage] = useState('');
  
  /**
   * 选中的学科
   */
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  /**
   * 选中的主题/课程
   */
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  /**
   * 浏览历史记录
   */
  const [browsingHistory, setBrowsingHistory] = useState([]);
  
  /**
   * 当前激活的标签页
   * 可能的值：'search', 'textbook', 'syllabus', 'notebook', 'history'
   */
  const [activeTab, setActiveTab] = useState('search');
  
  /**
   * 当前查看的文件
   */
  const [viewingFile, setViewingFile] = useState(null);
  
  /**
   * 是否显示文件预览
   */
  const [showFilePreview, setShowFilePreview] = useState(false);
  
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

  // ==================== 生命周期钩子 ====================
  
  /**
   * 组件挂载时执行
   * 检查用户登录状态和加载浏览历史
   */
  useEffect(() => {
    checkCookieAndSession();
    loadBrowsingHistory();
  }, []);

  // ==================== 工具函数 ====================
  
  /**
   * 加载浏览历史记录
   */
  const loadBrowsingHistory = () => {
    const history = HistoryUtils.getHistory();
    setBrowsingHistory(history);
  };

  /**
   * 检查Cookie和会话状态
   * 用于自动登录功能
   */
  const checkCookieAndSession = async () => {
    const userToken = CookieUtils.getCookie('userToken');
    const userData = CookieUtils.getCookie('userData');
    
    if (userToken && userData) {
      try {
        // 验证token是否仍然有效
        const response = await ApiService.validateSession(userToken);
        if (response.success) {
          const parsedUserData = JSON.parse(userData);
          setUser(parsedUserData);
          setCurrentPage('main');
        } else {
          // token无效，清理Cookie
          CookieUtils.deleteCookie('userToken');
          CookieUtils.deleteCookie('userData');
          setCurrentPage('welcome');
        }
      } catch (error) {
        console.error('Session validation error:', error);
        setCurrentPage('welcome');
      }
    } else {
      setCurrentPage('welcome');
    }
  };

  // ==================== 页面导航函数 ====================
  
  /**
   * 显示登录页面
   */
  const showLogin = () => {
    setCurrentPage('login');
    setMessage('');
  };
  
  /**
   * 显示注册页面
   */
  const showSignUp = () => {
    setCurrentPage('signup');
    setMessage('');
  };
  
  /**
   * 显示欢迎页面
   */
  const showWelcome = () => {
    setCurrentPage('welcome');
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
        
        setUser(userData);
        setCurrentPage('main');
        
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
          setCurrentPage('login');
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
    setUser(null);
    setCurrentPage('welcome');
    setSelectedSubject(null);
    setSelectedTopic(null);
    setActiveTab('search');
    setViewingFile(null);
    setShowFilePreview(false);
    setMessage('');
  };

  // ==================== 内容导航函数 ====================
  
  /**
   * 处理学科点击
   * @param {string} subjectKey - 学科键名
   */
  const handleSubjectClick = (subjectKey) => {
    setSelectedSubject(subjectKey);
    setSelectedTopic(null);
    setShowFilePreview(false);
    setViewingFile(null);
    
    // 添加到浏览历史
    HistoryUtils.addToHistory({
      type: 'subject',
      id: subjectKey,
      name: subjectsData[subjectKey].name,
      icon: subjectsData[subjectKey].icon
    });
    
    loadBrowsingHistory();
  };

  /**
   * 处理主题/课程点击
   * @param {Object} topic - 主题对象
   */
  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    setShowFilePreview(false);
    setViewingFile(null);
    
    // 添加到浏览历史
    HistoryUtils.addToHistory({
      type: 'topic',
      id: topic.id,
      name: topic.name,
      subjectName: subjectsData[selectedSubject]?.name,
      papers: topic.papers
    });
    
    loadBrowsingHistory();
  };

  /**
   * 处理文件查看
   * @param {Object} file - 文件对象
   */
  const handleFileView = (file) => {
    setViewingFile(file);
    setShowFilePreview(true);
    
    // 添加到浏览历史
    HistoryUtils.addToHistory({
      type: 'file',
      id: file.title,
      name: file.title,
      subjectName: subjectsData[selectedSubject]?.name,
      topicName: selectedTopic?.name
    });
    
    loadBrowsingHistory();
  };

  /**
   * 关闭文件预览
   */
  const closeFilePreview = () => {
    setShowFilePreview(false);
    setViewingFile(null);
  };

  /**
   * 返回到学科列表
   */
  const goBackToSubjects = () => {
    setSelectedSubject(null);
    setSelectedTopic(null);
    setShowFilePreview(false);
    setViewingFile(null);
  };

  /**
   * 返回到主题列表
   */
  const goBackToTopics = () => {
    setSelectedTopic(null);
    setShowFilePreview(false);
    setViewingFile(null);
  };

  /**
   * 清空浏览历史
   */
  const clearBrowsingHistory = () => {
    HistoryUtils.clearHistory();
    setBrowsingHistory([]);
  };

  // ==================== 子组件定义 ====================
  
  /**
   * 工具栏组件
   * 仅对'user'类型用户显示，'guest'用户无工具栏
   * @param {Object} props - 组件属性
   * @param {string} props.userType - 用户类型
   * @param {string} props.activeTab - 当前激活标签
   * @param {Function} props.onTabChange - 标签切换回调
   */
  const ObsidianToolbar = ({ userType, activeTab, onTabChange }) => {
    const tools = [
      { id: 'search', name: 'Search', icon: '🔍' },
      // 只有'user'类型用户才能看到这些工具
      ...(userType === 'user' ? [
        { id: 'textbook', name: 'Text Book', icon: '📖' },
        { id: 'syllabus', name: 'Syllabus', icon: '📋' },
        { id: 'notebook', name: 'Notebook', icon: '📝' },
        { id: 'history', name: 'History', icon: '📊' }
      ] : [])
    ];

    return (
      <div className="obsidian-toolbar">
        <div className="toolbar-tools">
          {tools.map(tool => (
            <div 
              key={tool.id}
              className={`tool-item ${activeTab === tool.id ? 'active' : ''}`}
              onClick={() => onTabChange(tool.id)}
            >
              <span className="tool-icon">{tool.icon}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * 侧边栏组件
   * 显示学科列表和浏览历史（仅限guest用户）
   */
  const Sidebar = ({ selectedSubject, subjectsData, onSubjectClick, browsingHistory, clearHistory, activeTab, userType }) => {
    if (activeTab === 'search') {
      return (
        <aside className="sidebar">
          {/* 学科列表部分 */}
          <div className="sidebar-section">
            <h3>📂 Subjects</h3>
            <div className="subject-list">
              {Object.entries(subjectsData).map(([key, subject]) => (
                <div 
                  key={key}
                  className={`subject-item ${selectedSubject === key ? 'active' : ''}`}
                  onClick={() => onSubjectClick(key)}
                >
                  <span className="subject-icon">{subject.icon}</span>
                  <span className="subject-name">{subject.name}</span>
                  <span className="subject-count">{subject.topics.reduce((sum, topic) => sum + topic.papers, 0)}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 浏览历史部分 - 仅对guest用户显示 */}
          {userType === 'guest' && (
            <div className="sidebar-section">
              <div className="history-header">
                <h3>📊 History</h3>
                {browsingHistory.length > 0 && (
                  <button className="clear-history-btn" onClick={clearHistory} title="清空历史">
                    🗑️
                  </button>
                )}
              </div>
              
              {browsingHistory.length === 0 ? (
                <div className="empty-history">
                  <p>暂无浏览记录</p>
                </div>
              ) : (
                <div className="history-list">
                  {browsingHistory.slice(0, 10).map((item, index) => (
                    <div key={index} className="history-item">
                      <div className="history-icon">
                        {item.type === 'subject' ? item.icon : '📄'}
                      </div>
                      <div className="history-content">
                        <div className="history-name">{item.name}</div>
                        {item.subjectName && (
                          <div className="history-subject">{item.subjectName}</div>
                        )}
                        <div className="history-meta">
                          <span className="visit-count">访问 {item.visitCount} 次</span>
                          {item.papers && (
                            <span className="paper-count">{item.papers} 份试卷</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 浏览统计 */}
              <div className="history-stats">
                <div className="stat-item">
                  <div className="stat-number">{browsingHistory.length}</div>
                  <div className="stat-label">浏览记录</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">
                    {browsingHistory.filter(h => h.type === 'subject').length}
                  </div>
                  <div className="stat-label">学科数</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">
                    {browsingHistory.filter(h => h.type === 'topic').length}
                  </div>
                  <div className="stat-label">试卷数</div>
                </div>
              </div>
            </div>
          )}
        </aside>
      );
    }
    
    return null;
  };

  // ==================== 主渲染函数 ====================
  
  return (
    <div className="App">
      {/* 欢迎页面 */}
      {currentPage === 'welcome' && (
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
      )}

      {/* 登录页面 */}
      {currentPage === 'login' && (
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
      )}

      {/* 注册页面 */}
      {currentPage === 'signup' && (
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
          
          <div className="form-footer">
            <p>已有帳號？ <button type="button" className="link-button" onClick={showLogin}>立即登入</button></p>
          </div>
        </form>
      )}

      {/* 主页面 - 登录后的主要功能界面 */}
      {currentPage === 'main' && (
        <div className={`dashboard ${user?.userType === 'user' ? 'with-toolbar' : 'no-toolbar'}`}>
          {/* 页面头部 */}
          <header className="dashboard-header">
            <div className="header-left">
              <h1 className="dashboard-title">📚 Past Papers Dashboard</h1>
              {/* 面包屑导航 */}
              <div className="breadcrumb">
                {!selectedSubject && !showFilePreview && <span>All Subjects</span>}
                {selectedSubject && !selectedTopic && !showFilePreview && (
                  <>
                    <span className="breadcrumb-link" onClick={goBackToSubjects}>All Subjects</span>
                    <span className="breadcrumb-separator">›</span>
                    <span>{subjectsData[selectedSubject]?.name}</span>
                  </>
                )}
                {selectedSubject && selectedTopic && !showFilePreview && (
                  <>
                    <span className="breadcrumb-link" onClick={goBackToSubjects}>All Subjects</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-link" onClick={goBackToTopics}>{subjectsData[selectedSubject]?.name}</span>
                    <span className="breadcrumb-separator">›</span>
                    <span>{selectedTopic.name}</span>
                  </>
                )}
                {showFilePreview && viewingFile && (
                  <>
                    <span className="breadcrumb-link" onClick={goBackToSubjects}>All Subjects</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-link" onClick={goBackToTopics}>{subjectsData[selectedSubject]?.name}</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-link" onClick={closeFilePreview}>{selectedTopic?.name}</span>
                    <span className="breadcrumb-separator">›</span>
                    <span>{viewingFile.title}</span>
                  </>
                )}
              </div>
            </div>
            <div className="header-right">
              {/* 全局搜索框 - 后端需要实现搜索API */}
              <div className="search-box">
                <input type="text" placeholder="🔍 Search papers..." className="global-search" />
              </div>
              {/* 用户菜单 */}
              <div className="user-menu">
                <span className="user-info">👋 {user?.username} ({user?.userType})</span>
                <button className="logout-button" onClick={handleLogout}>退出</button>
              </div>
            </div>
          </header>

          {/* 主要内容区域 */}
          <main className="dashboard-content">
            {/* 工具栏 - 仅对user类型用户显示 */}
            {user?.userType === 'user' && (
              <ObsidianToolbar 
                userType={user?.userType}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            )}
            
            {/* 侧边栏 - 仅在搜索标签页显示 */}
            {activeTab === 'search' && (
              <Sidebar 
                selectedSubject={selectedSubject}
                subjectsData={subjectsData}
                onSubjectClick={handleSubjectClick}
                browsingHistory={browsingHistory}
                clearHistory={clearBrowsingHistory}
                activeTab={activeTab}
                userType={user?.userType}
              />
            )}

            {/* 主内容区域 */}
            <div className="main-content">
              {/* 搜索标签页内容 */}
              {activeTab === 'search' && (
                <>
                  {showFilePreview && viewingFile ? (
                    // 文件预览视图
                    <div className="file-preview-container">
                      <div className="file-preview-header">
                        <div className="file-info">
                          <h2>{viewingFile.title}</h2>
                          <div className="file-meta">
                            <span className="duration">Duration: 2h15m</span>
                            {/* 后端需要提供标准答案API */}
                            <button className="mark-scheme-link">Mark scheme link</button>
                          </div>
                        </div>
                        <button className="back-to-papers-btn" onClick={closeFilePreview}>
                          ← Back to Papers
                        </button>
                      </div>
                      <div className="file-preview-content">
                        <div className="candidate-section">
                          <h4>CANDIDATE NAME</h4>
                          <div className="candidate-lines">
                            <div className="line"></div>
                            <div className="line"></div>
                            <div className="line"></div>
                          </div>
                        </div>
                        {/* 这里需要集成PDF查看器或图片查看器 */}
                        {/* 后端需要提供文件内容API：GET /api/files/{fileId}/content */}
                      </div>
                    </div>
                  ) : (
                    // 原有的学科/试卷列表视图
                    <>
                      {/* 学科概览页面 */}
                      {!selectedSubject && (
                        <div className="subjects-overview">
                          <div className="section-header">
                            <h2>📚 All Subjects</h2>
                            <p>Choose a subject to explore past papers</p>
                          </div>
                          
                          <div className="subjects-grid">
                            {Object.entries(subjectsData).map(([key, subject]) => (
                              <div 
                                key={key}
                                className="subject-card"
                                onClick={() => handleSubjectClick(key)}
                              >
                                <div className="card-header">
                                  <span className="card-icon">{subject.icon}</span>
                                  <h3>{subject.name}</h3>
                                </div>
                                <div className="card-content">
                                  <div className="topics-preview">
                                    {subject.topics.map(topic => (
                                      <div key={topic.id} className="topic-preview">
                                        <span className="topic-id">{topic.id}</span>
                                        <span className="topic-name">{topic.name}</span>
                                        <span className="paper-count">{topic.papers} papers</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="card-footer">
                                  <span className="total-papers">
                                    {subject.topics.reduce((sum, topic) => sum + topic.papers, 0)} total papers
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 主题/课程列表页面 */}
                      {selectedSubject && !selectedTopic && (
                        <div className="topics-view">
                          <div className="section-header">
                            <h2>{subjectsData[selectedSubject]?.icon} {subjectsData[selectedSubject]?.name}</h2>
                            <p>Select a course to view past papers</p>
                          </div>
                          
                          <div className="topics-grid">
                            {subjectsData[selectedSubject]?.topics.map(topic => (
                              <div 
                                key={topic.id}
                                className="topic-card"
                                onClick={() => handleTopicClick(topic)}
                              >
                                <div className="topic-header">
                                  <h3>{topic.id}</h3>
                                  <span className="paper-count">{topic.papers} papers</span>
                                </div>
                                <div className="topic-content">
                                  <h4>{topic.name}</h4>
                                  <p>Last updated: {topic.lastUpdated}</p>
                                </div>
                                <div className="topic-footer">
                                  <button className="explore-btn">Explore Papers →</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 试卷列表页面 */}
                      {selectedSubject && selectedTopic && (
                        <div className="papers-view">
                          <div className="section-header">
                            <h2>{selectedTopic.id} - {selectedTopic.name}</h2>
                            <p>{selectedTopic.papers} past papers available</p>
                          </div>
                          
                          {/* 试卷筛选器 - 后端需要实现筛选API */}
                          <div className="papers-filters">
                            <div className="filter-group">
                              <label>Year:</label>
                              <select>
                                <option value="">All Years</option>
                                <option value="2023">2023</option>
                                <option value="2022">2022</option>
                                <option value="2021">2021</option>
                              </select>
                            </div>
                            <div className="filter-group">
                              <label>Session:</label>
                              <select>
                                <option value="">All Sessions</option>
                                <option value="may">May/June</option>
                                <option value="oct">Oct/Nov</option>
                                <option value="feb">Feb/March</option>
                              </select>
                            </div>
                            <div className="filter-group">
                              <label>Paper:</label>
                              <select>
                                <option value="">All Papers</option>
                                <option value="1">Paper 1</option>
                                <option value="2">Paper 2</option>
                                <option value="3">Paper 3</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* 试卷网格 - 后端需要提供试卷列表API */}
                          <div className="papers-grid">
                            {[1,2,3,4,5,6].map(i => (
                              <div key={i} className="paper-card">
                                <div className="paper-header">
                                  <h4>{selectedTopic.id} Paper {i % 3 + 1}</h4>
                                  <span className="paper-year">2023</span>
                                </div>
                                <div className="paper-content">
                                  <p>Session: {i % 2 === 0 ? 'May/June' : 'Oct/Nov'}</p>
                                  <p>Type: Question Paper</p>
                                  <p>Duration: {i % 3 === 0 ? '1h 15m' : i % 3 === 1 ? '1h 45m' : '2h'}</p>
                                </div>
                                <div className="paper-actions">
                                  <button 
                                    className="action-btn view-btn"
                                    onClick={() => handleFileView({
                                      title: `${selectedTopic.id} Paper ${i % 3 + 1}`,
                                      year: '2023',
                                      session: i % 2 === 0 ? 'May/June' : 'Oct/Nov'
                                    })}
                                  >
                                    👁️ View
                                  </button>
                                  {/* 后端需要提供文件下载API */}
                                  <button className="action-btn download-btn">📥 Download</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* 教科书标签页内容 - 仅user类型用户可见 */}
              {activeTab === 'textbook' && (
                <div className="tool-content">
                  <div className="section-header">
                    <h2>📖 Text Books</h2>
                    <p>Access your textbooks and study materials</p>
                  </div>
                  
                  {/* 后端需要提供用户教科书API：GET /api/user/textbooks */}
                  {userTestData.textBooks.length === 0 ? (
                    <div className="empty-state">
                      <p>暂无内容</p>
                    </div>
                  ) : (
                    <div className="content-grid">
                      {userTestData.textBooks.map(book => (
                        <div key={book.id} className="content-card">
                          <div className="card-header">
                            <span className="card-icon">📖</span>
                            <h3>{book.title}</h3>
                          </div>
                          <div className="card-content">
                            <p>Subject: {book.subject}</p>
                            <p>Type: {book.type}</p>
                          </div>
                          <div className="card-actions">
                            <button className="action-btn">Open</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 教学大纲标签页内容 - 仅user类型用户可见 */}
              {activeTab === 'syllabus' && (
                <div className="tool-content">
                  <div className="section-header">
                    <h2>📋 Syllabus</h2>
                    <p>View curriculum and syllabus documents</p>
                  </div>
                  
                  {/* 后端需要提供用户教学大纲API：GET /api/user/syllabuses */}
                  <div className="content-grid">
                    {userTestData.syllabuses.map(syllabus => (
                      <div key={syllabus.id} className="content-card">
                        <div className="card-header">
                          <span className="card-icon">📋</span>
                          <h3>{syllabus.title}</h3>
                        </div>
                        <div className="card-content">
                          <p>Subject: {syllabus.subject}</p>
                          {syllabus.year && <p>Year: {syllabus.year}</p>}
                          {syllabus.level && <p>Level: {syllabus.level}</p>}
                        </div>
                        <div className="card-actions">
                          <button className="action-btn">View</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 笔记本标签页内容 - 仅user类型用户可见 */}
              {activeTab === 'notebook' && (
                <div className="tool-content">
                  <div className="section-header">
                    <h2>📝 Notebook</h2>
                    <p>Your personal notes and study materials</p>
                  </div>
                  
                  {/* 后端需要提供用户笔记API：GET /api/user/notebooks */}
                  <div className="content-grid">
                    {userTestData.notebooks.map(notebook => (
                      <div key={notebook.id} className="content-card">
                        <div className="card-header">
                          <span className="card-icon">📝</span>
                          <h3>{notebook.title}</h3>
                        </div>
                        <div className="card-content">
                          <p>Subject: {notebook.subject}</p>
                          <p>Pages: {notebook.pages}</p>
                        </div>
                        <div className="card-actions">
                          <button className="action-btn">Open</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 浏览历史标签页内容 - 仅user类型用户可见 */}
              {activeTab === 'history' && (
                <div className="tool-content">
                  <div className="section-header">
                    <h2>📊 Browsing History</h2>
                    <p>Your recent activity and visited content</p>
                  </div>
                  
                  {/* 后端可以提供用户行为分析API：GET /api/user/activity */}
                  {browsingHistory.length === 0 ? (
                    <div className="empty-state">
                      <p>暂无浏览记录</p>
                    </div>
                  ) : (
                    <div className="history-full-view">
                      {browsingHistory.map((item, index) => (
                        <div key={index} className="history-item-full">
                          <div className="history-icon">
                            {item.type === 'subject' ? item.icon : '📄'}
                          </div>
                          <div className="history-content">
                            <div className="history-name">{item.name}</div>
                            {item.subjectName && (
                              <div className="history-subject">{item.subjectName}</div>
                            )}
                            <div className="history-meta">
                              <span className="visit-count">访问 {item.visitCount} 次</span>
                              {item.papers && (
                                <span className="paper-count">{item.papers} 份试卷</span>
                              )}
                              <span className="last-visited">
                                {new Date(item.lastVisited).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      )}

    </div>
  );
}

export default App;