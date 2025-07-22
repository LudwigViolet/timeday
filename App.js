import { useState, useEffect } from 'react';
//===================== 样式 =======================
import './App.css';
// ==================== 工具函数 ====================
import { CookieUtils, HistoryUtils } from './CookieUtils.js';
import { ApiService } from './APIservice.js';
// ==================== 组件 ====================
import Login from './Login.js';
import UserProfile from './UserProfile.js';


// ==================== 模拟数据 ====================
import { subjectsData, userTestData } from './mockData.js';



// ==================== 主组件 ====================

/**
 * App主组件
 * 管理整个应用的状态和路由
 */
function App() {
  // ==================== 状态管理 ====================

  /**
   * 当前页面状态
   * 可能的值：'welcome', 'login', 'signup', 'main'
   */
  const [currentPage, setCurrentPage] = useState('welcome');

  /**
   * 用户信息状态
   * 结构：{ username: string, userType: 'user'|'guest', email: string, token: string }
   */
  const [user, setUser] = useState(null);

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
   * 主题状态
   */
  const [theme, setTheme] = useState('light');
  
  /**
   * 是否显示用户资料页面
   */
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  /**
   * 用户资料页面的活动标签
   */
  const [activeProfileTab, setActiveProfileTab] = useState('overview');
  
  /**
   * 用户头像
   */
  const [userAvatar, setUserAvatar] = useState(null);
  
  /**
   * 用户个人信息
   */
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : {
      grade: '',
      gender: '',
      bio: '',
      location: '',
      curriculum: ''
    };
  });
  
  // 學科選擇相關狀態
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([
    { id: 1, icon: '📐', name: '數學', description: 'Mathematics' },
    { id: 2, icon: '⚛️', name: '物理', description: 'Physics' },
    { id: 3, icon: '💻', name: '計算機科學', description: 'Computer Science' }
  ]);
  
  // 时间跟踪状态
  const [fileStartTime, setFileStartTime] = useState(null);
  const [currentDuration, setCurrentDuration] = useState(null);
  
  // 用户使用时间统计状态
  const [dailyUsageData, setDailyUsageData] = useState(() => {
    const saved = localStorage.getItem('dailyUsageData');
    return saved ? JSON.parse(saved) : {};
  });
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  
  // ==================== 生命周期钩子 ====================
  
  /**
   * 组件挂载时执行
   * 检查用户登录状态和加载浏览历史
   */
  useEffect(() => {
    checkCookieAndSession();
    loadBrowsingHistory();
    initializeTheme();
  }, []);

  /**
   * 加载用户头像
   */
  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setUserAvatar(savedAvatar);
    }
  }, []);

  /**
   * 实时更新文件查看时长
   */
  useEffect(() => {
    let interval = null;
    if (fileStartTime && showFilePreview) {
      interval = setInterval(() => {
        const currentTime = Date.now();
        const duration = currentTime - fileStartTime;
        setCurrentDuration(duration);
      }, 1000); // 每秒更新一次
    } else {
      setCurrentDuration(null);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fileStartTime, showFilePreview]);

  /**
   * 用户使用时间记录
   * 每分钟更新一次当日使用时间
   */
  useEffect(() => {
    const updateDailyUsage = () => {
       const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
       const currentTime = Date.now();
       
       setDailyUsageData(prevData => {
           const newData = { ...prevData };
           const todayUsage = newData[today] || 0;
           newData[today] = todayUsage + (60 * 1000); // 每分钟增加60秒
           
           // 保存到localStorage
           localStorage.setItem('dailyUsageData', JSON.stringify(newData));
           return newData;
         });
       
       // 重置session开始时间
       setSessionStartTime(currentTime);
     };

    // 每分钟更新一次
    const interval = setInterval(updateDailyUsage, 60000);
    
    // 页面关闭时保存最后的使用时间
     const handleBeforeUnload = () => {
        const today = new Date().toISOString().split('T')[0];
        const currentTime = Date.now();
        const sessionDuration = currentTime - sessionStartTime;
        
        const currentData = JSON.parse(localStorage.getItem('dailyUsageData') || '{}');
        const todayUsage = currentData[today] || 0;
        currentData[today] = todayUsage + sessionDuration;
        localStorage.setItem('dailyUsageData', JSON.stringify(currentData));
      };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // 组件卸载时也保存数据
    };
  }, [sessionStartTime]);

  // ==================== 工具函数 ====================
  
  /**
   * 加载浏览历史记录
   */
  const loadBrowsingHistory = () => {
    const history = HistoryUtils.getHistory();
    setBrowsingHistory(history);
  };

  /**
   * 初始化主题
   */
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.body.className = savedTheme === 'dark' ? 'dark-theme' : '';
  };

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme === 'dark' ? 'dark-theme' : '';
  };

  /**
   * 显示用户资料页面
   */
  const showUserProfilePage = () => {
    setShowUserProfile(true);
  };

  /**
   * 返回主页面
   */
  const backToMain = () => {
    setShowUserProfile(false);
  };

  /**
   * 处理头像上传
   */
  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserAvatar(e.target.result);
        localStorage.setItem('userAvatar', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * 可選學科列表
   */
  const availableSubjects = [
    { id: 1, icon: '📐', name: '數學', description: 'Mathematics' },
    { id: 2, icon: '⚛️', name: '物理', description: 'Physics' },
    { id: 3, icon: '💻', name: '計算機科學', description: 'Computer Science' },
    { id: 4, icon: '🧪', name: '化學', description: 'Chemistry' },
    { id: 5, icon: '🌍', name: '地理', description: 'Geography' },
    { id: 6, icon: '📚', name: '歷史', description: 'History' },
    { id: 7, icon: '🎨', name: '藝術', description: 'Art' },
    { id: 8, icon: '🎵', name: '音樂', description: 'Music' },
    { id: 9, icon: '🏃', name: '體育', description: 'Physical Education' },
    { id: 10, icon: '🌱', name: '生物', description: 'Biology' },
    { id: 11, icon: '💼', name: '經濟', description: 'Economics' },
    { id: 12, icon: '⚖️', name: '法律', description: 'Law' }
  ];

  /**
   * 打開學科選擇模態框
   */
  const openSubjectModal = () => {
    setShowSubjectModal(true);
  };

  /**
   * 關閉學科選擇模態框
   */
  const closeSubjectModal = () => {
    setShowSubjectModal(false);
  };

  /**
   * 切換學科選擇
   */
  const toggleSubjectSelection = (subject) => {
    setSelectedSubjects(prev => {
      const isSelected = prev.some(s => s.id === subject.id);
      if (isSelected) {
        return prev.filter(s => s.id !== subject.id);
      } else if (prev.length < 6) { // 最多選擇6個學科
        return [...prev, subject];
      }
      return prev;
    });
  };

  /**
   * 確認學科選擇
   */
  const confirmSubjectSelection = () => {
    closeSubjectModal();
    // 這裡可以添加保存到後端的邏輯
    localStorage.setItem('selectedSubjects', JSON.stringify(selectedSubjects));
  };

  /**
   * 处理用户登出
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
    setShowUserProfile(false);
    setUserAvatar(null);
    localStorage.removeItem('userAvatar');
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


  /**
   * 处理学科点击
   * @param {string} subjectKey - 学科键名
   */
  const handleSubjectClick = (subjectKey) => {
    setSelectedSubject(subjectKey);
    setSelectedTopic(null);
    setShowFilePreview(false);
    setViewingFile(null);
  };

  /**
   * 处理主题/课程点击
   * @param {Object} topic - 主题对象
   */
  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    setShowFilePreview(false);
    setViewingFile(null);
  };

  /**
   * 处理文件查看
   * @param {Object} file - 文件对象
   */
  const handleFileView = (file) => {
    setViewingFile(file);
    setShowFilePreview(true);
    
    // 记录开始时间
    setFileStartTime(Date.now());
    
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
    // 计算使用时长已通过实时更新实现
    
    setShowFilePreview(false);
    setViewingFile(null);
    setFileStartTime(null);
  };

  /**
   * 格式化时长显示
   * @param {number} duration - 毫秒数
   * @returns {string} 格式化的时长字符串
   */
  const formatDuration = (duration) => {
    if (!duration) return 'Duration: --';
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `Duration: ${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      return `Duration: ${minutes}m ${remainingSeconds}s`;
    } else {
      return `Duration: ${remainingSeconds}s`;
    }
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
   * 用户头像组件
   * @param {Object} props - 组件属性
   * @param {Function} props.onClick - 点击回调
   * @param {number} props.size - 头像大小
   */
  const UserAvatarComponent = ({ onClick, size = 40 }) => {
    return (
      <div className="user-avatar-component">
        {userAvatar ? (
          <img 
            src={userAvatar} 
            alt="User Avatar" 
            className="user-avatar"
            style={{ width: size, height: size }}
            onClick={onClick}
          />
        ) : (
          <div 
            className="user-avatar default"
            style={{ width: size, height: size }}
            onClick={onClick}
          >
            👤
          </div>
        )}
      </div>
    );
  };

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
                </div>
              ))}
            </div>
          </div>
          

        </aside>
      );
    }
    
    return null;
  };

  // ==================== 主渲染函数 ====================
  
  return (
    <div className="App">
      {/* 登录组件 */}
      {['welcome', 'login', 'signup'].includes(currentPage) && (
        <>
          {/* 主题切换按钮 */}
          <button className="theme-toggle" onClick={toggleTheme} style={{position: 'fixed', top: '20px', right: '20px', zIndex: 1000}}>
            {theme === 'light' ? '☀️' : '🌙'}
          </button>
          <Login
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onLoginSuccess={(userData) => {
              setUser(userData);
              setCurrentPage('main');
            }}
            onLogout={() => {
              setUser(null);
              setCurrentPage('welcome');
              setSelectedSubject(null);
              setSelectedTopic(null);
              setActiveTab('search');
              setViewingFile(null);
              setShowFilePreview(false);
              setShowUserProfile(false);
              setUserAvatar(null);
              localStorage.removeItem('userAvatar');
            }}
            theme={theme}
            onThemeToggle={toggleTheme}
          />
        </>
      )}

      {/* 主应用内容 */}
      {currentPage === 'main' && (
        <>
          {showUserProfile && (
            <UserProfile
              // 数据props
              user={user}
              userProfile={userProfile}
              userAvatar={userAvatar}
              activeProfileTab={activeProfileTab}
              selectedSubjects={selectedSubjects}
              dailyUsageData={dailyUsageData}
              browsingHistory={browsingHistory}
              theme={theme}
              
              // 回调函数props
              onBackToMain={backToMain}
              onLogout={handleLogout}
              onAvatarUpload={handleAvatarUpload}
              onProfileUpdate={setUserProfile}
              onTabChange={setActiveProfileTab}
              onSubjectModalOpen={openSubjectModal}
              onThemeToggle={toggleTheme}
            />
          )}
        </>
      )}

      {/* 主页面 - 登录后的主要功能界面 */}
      {currentPage === 'main' && !showUserProfile && (
        <div className={`dashboard ${user?.userType === 'user' ? 'with-toolbar' : 'no-toolbar'}`}>
          {/* 页面头部 */}
          <header className="dashboard-header">
            <div className="header-left">
              <h1 className="dashboard-title">❀ Past Papers Dashboard</h1>
              {/* 
                * 面包屑导航组件
                * 功能：根据当前活动的标签页显示相应的导航路径
                * 设计原则：
                * 1. 每个标签页都有三层级的导航结构，保持一致性
                * 2. 搜索标签页支持动态导航，其他标签页为静态导航
                * 3. 使用统一的样式类名：breadcrumb-link 和 breadcrumb-separator
                * 4. 为未来的交互功能（如点击导航）预留了结构基础
                */}
              <div className="breadcrumb">
                {/* 
                * 搜索标签页的面包屑导航
                * 特点：动态导航，根据用户的浏览状态显示不同层级
                * 层级结构：All Subjects → Subject Name → Topic Name → File Name
                * 交互功能：支持点击返回上级页面
                */}
                {activeTab === 'search' && (
                  <>
                    {/* 根目录状态：显示所有学科 */}
                    {!selectedSubject && !showFilePreview && <span>All Subjects</span>}
                    
                    {/* 学科选中状态：显示学科名称 */}
                    {selectedSubject && !selectedTopic && !showFilePreview && (
                      <>
                        <span className="breadcrumb-link" onClick={goBackToSubjects}>All Subjects</span>
                        <span className="breadcrumb-separator">›</span>
                        <span>{subjectsData[selectedSubject]?.name}</span>
                      </>
                    )}
                    
                    {/* 主题选中状态：显示学科 → 主题 */}
                    {selectedSubject && selectedTopic && !showFilePreview && (
                      <>
                        <span className="breadcrumb-link" onClick={goBackToSubjects}>All Subjects</span>
                        <span className="breadcrumb-separator">›</span>
                        <span className="breadcrumb-link" onClick={goBackToTopics}>{subjectsData[selectedSubject]?.name}</span>
                        <span className="breadcrumb-separator">›</span>
                        <span>{selectedTopic.name}</span>
                      </>
                    )}
                    
                    {/* 文件预览状态：显示完整路径 */}
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
                  </>
                )}
                
                {/* 
                * 教科书标签页的面包屑导航
                * 层级结构：Textbooks → Cambridge Resources → All Subjects
                * 語義：教科書總覽 → Cambridge資源分類 → 所有學科列表
                */}
                {activeTab === 'textbook' && (
                  <>
                    <span className="breadcrumb-link">📖 Textbooks</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-link">Cambridge Resources</span>
                    <span className="breadcrumb-separator">›</span>
                    <span>All Subjects</span>
                  </>
                )}
                
                {/* 
                * 教学大纲标签页的面包屑导航
                * 层级结构：Syllabus → Official Documents → All Subjects
                * 語義：教學大綱總覽 → 官方文檔分類 → 所有學科列表
                */}
                {activeTab === 'syllabus' && (
                  <>
                    <span className="breadcrumb-link">📋 Syllabus</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-link">Official Documents</span>
                    <span className="breadcrumb-separator">›</span>
                    <span>All Subjects</span>
                  </>
                )}
                
                {/* 
                * 笔记本标签页的面包屑导航
                * 层级结构：Notebook → All Notes → Recent
                * 語義：筆記本總覽 → 所有筆記 → 最近筆記
                */}
                {activeTab === 'notebook' && (
                  <>
                    <span className="breadcrumb-link">📝 Notebook</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-link">All Notes</span>
                    <span className="breadcrumb-separator">›</span>
                    <span>Recent</span>
                  </>
                )}
                
                {/* 
                * 日历标签页的面包屑导航
                * 层级结构：Calendar → Study Schedule → This Month
                * 語義：日曆總覽 → 學習計劃 → 本月視圖
                */}
                {activeTab === 'calendar' && (
                  <>
                    <span className="breadcrumb-link">📅 Calendar</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-link">Study Schedule</span>
                    <span className="breadcrumb-separator">›</span>
                    <span>This Month</span>
                  </>
                )}
                
                {/* 
                * 分析标签页的面包屑导航
                * 层级结构：Analytics → Performance → Overview
                * 語義：分析總覽 → 性能分析 → 概覽視圖
                */}
                {activeTab === 'analytics' && (
                  <>
                    <span className="breadcrumb-link">📊 Analytics</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-link">Performance</span>
                    <span className="breadcrumb-separator">›</span>
                    <span>Overview</span>
                  </>
                )}
                
                {/* 
                * 浏览历史标签页的面包屑导航
                * 层级结构：History → Browsing Activity → All Records
                * 語義：歷史記錄總覽 → 瀏覽活動 → 所有記錄
                */}
                {activeTab === 'history' && (
                  <>
                    <span className="breadcrumb-link">📊 History</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-link">Browsing Activity</span>
                    <span className="breadcrumb-separator">›</span>
                    <span>All Records</span>
                  </>
                )}
                
                {/* 
                * 设置标签页的面包屑导航
                * 层级结构：Settings → User Preferences → General
                * 語義：設置總覽 → 用戶偏好 → 一般設置
                */}
                {activeTab === 'settings' && (
                  <>
                    <span className="breadcrumb-link">⚙️ Settings</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-link">User Preferences</span>
                    <span className="breadcrumb-separator">›</span>
                    <span>General</span>
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
                <span className="user-info">👋 {user?.username}</span>
                
                {/* 根據用戶類型顯示不同的操作按鈕 */}
                {user?.userType === 'guest' ? (
                  /* 訪客模式：顯示退出按鈕 */
                  <button className="guest-logout-btn" onClick={handleLogout} title="退出訪客模式">
                    🚪 退出
                  </button>
                ) : (
                  /* 普通用戶：顯示頭像 */
                  <UserAvatarComponent onClick={showUserProfilePage} />
                )}
                
                {/* 主题切换按钮 - 在主页面头部显示 */}
                <button className="theme-toggle" onClick={toggleTheme}>
                  {theme === 'light' ? '☀️' : '🌙'}
                </button>
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
                            <span className="duration">{formatDuration(currentDuration)}</span>
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
                                  <p>Duration: {selectedTopic.id.includes('Paper') ? '2h 15m' : selectedTopic.id.includes('Worksheet') ? '45m' : '1h 30m'}</p>
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
                    <h2>📖 Textbooks</h2>
                    <p>Access Cambridge textbooks and coursebooks by subject</p>
                  </div>
                  
                  {/* 后端需要提供用户教科书API：GET /api/user/textbooks */}
                  <div className="subjects-overview">
                    {['Physics', 'Mathematics', 'Chemistry', 'Biology'].map(subject => {
                      const subjectTextbooks = userTestData.textBooks.filter(book => book.subject === subject);
                      const subjectIcon = subjectsData[subject.toLowerCase()]?.icon || '📚';
                      
                      return (
                        <div key={subject} className="subject-textbook-section">
                          <div className="subject-textbook-header">
                            <span className="subject-icon">{subjectIcon}</span>
                            <h3>{subject}</h3>
                          </div>
                          
                          <div className="textbook-grid">
                            {subjectTextbooks.map(textbook => (
                              <div key={textbook.id} className="textbook-card">
                                <div className="textbook-header">
                                  <div className="textbook-title">
                                    <span className="textbook-level">{textbook.level}</span>
                                    <span className="textbook-year">{textbook.year}</span>
                                  </div>
                                </div>
                                
                                <div className="textbook-content">
                                  <h4>{textbook.title}</h4>
                                  <div className="textbook-meta">
                                    <p className="textbook-author">📝 {textbook.author}</p>
                                    <p className="textbook-publisher">🏢 {textbook.publisher}</p>
                                  </div>
                                  <p className="textbook-description">
                                    {textbook.description}
                                  </p>
                                </div>
                                
                                <div className="textbook-actions">
                                  <button className="action-btn view-btn" title="View textbook">
                                    👁️ View
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 教学大纲标签页内容 - 仅user类型用户可见 */}
              {activeTab === 'syllabus' && (
                <div className="tool-content">
                  <div className="section-header">
                    <h2>📋 Syllabus Documents</h2>
                    <p>Access official Cambridge syllabus documents by subject</p>
                  </div>
                  
                  {/* 后端需要提供用户教学大纲API：GET /api/user/syllabuses */}
                  <div className="subjects-overview">
                    {['Physics', 'Mathematics', 'Chemistry', 'Biology'].map(subject => {
                      const subjectSyllabuses = userTestData.syllabuses.filter(s => s.subject === subject);
                      const subjectIcon = subjectsData[subject.toLowerCase()]?.icon || '📚';
                      
                      return (
                        <div key={subject} className="subject-syllabus-section">
                          <div className="subject-syllabus-header">
                            <span className="subject-icon">{subjectIcon}</span>
                            <h3>{subject}</h3>
                          </div>
                          
                          <div className="syllabus-grid">
                            {subjectSyllabuses.map(syllabus => (
                              <div key={syllabus.id} className="syllabus-card">
                                <div className="syllabus-header">
                                  <div className="syllabus-title">
                                    <span className="syllabus-level">{syllabus.level}</span>
                                    <span className="syllabus-code">{syllabus.code}</span>
                                  </div>
                                  <div className="syllabus-year">{syllabus.year}</div>
                                </div>
                                
                                <div className="syllabus-content">
                                  <h4>{syllabus.title}</h4>
                                  <p className="syllabus-description">
                                    Official Cambridge {syllabus.level} {subject} syllabus for examination years {syllabus.year}
                                  </p>
                                </div>
                                
                                <div className="syllabus-actions">
                                  <button className="action-btn view-btn" title="View syllabus online">
                                    👁️ View
                                  </button>
                                  <button className="action-btn download-btn" title="Download PDF">
                                    📥 Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 笔记本标签页内容 - 仅user类型用户可见 */}
              {activeTab === 'notebook' && (
                <div className="notebook-container">
                  {/* 侧边栏 */}
                  <div className="notebook-sidebar">
                    <div className="notebook-header">
                      <h2>📝 Notebook</h2>
                      <button className="notebook-new-note-btn" title="New Note">+</button>
                    </div>
                    
                    {/* 搜索框 */}
                    <div className="notebook-search">
                      <input 
                        type="text" 
                        placeholder="Search notes..." 
                        className="search-input"
                      />
                    </div>
                    
                    {/* 文件夹和笔记列表 */}
                    <div className="notebook-tree">
                      {/* 按文件夹分组显示笔记 */}
                      {Object.entries(
                        userTestData.notebooks.reduce((acc, note) => {
                          const folder = note.folder || 'Uncategorized';
                          if (!acc[folder]) acc[folder] = [];
                          acc[folder].push(note);
                          return acc;
                        }, {})
                      ).map(([folder, notes]) => (
                        <div key={folder} className="folder-group">
                          <div className="folder-header">
                            <span className="folder-icon">📁</span>
                            <span className="folder-name">{folder}</span>
                            <span className="note-count">({notes.length})</span>
                          </div>
                          <div className="folder-notes">
                            {notes.map(note => (
                              <div key={note.id} className="note-item">
                                <div className="note-item-content">
                                  <div className="note-title">{note.title}</div>
                                  <div className="note-subject">{note.subject}</div>
                                </div>
                                <div className="note-meta">
                                  <span className="note-date">{note.updatedAt}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 主内容区域 */}
                  <div className="notebook-main">
                    <div className="notebook-welcome">
                      <div className="welcome-content">
                        <h3>Welcome to Your Notebook</h3>
                        <p>Select a note from the sidebar to start reading, or create a new note.</p>
                        
                        <div className="quick-actions">
                          <button className="quick-action-btn">
                            <span className="action-icon">📝</span>
                            <span>New Note</span>
                          </button>
                          <button className="quick-action-btn">
                            <span className="action-icon">📁</span>
                            <span>New Folder</span>
                          </button>
                          <button className="quick-action-btn">
                            <span className="action-icon">📤</span>
                            <span>Import</span>
                          </button>
                        </div>
                        
                        <div className="recent-notes">
                          <h4>Recent Notes</h4>
                          <div className="recent-list">
                            {userTestData.notebooks
                              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                              .slice(0, 3)
                              .map(note => (
                                <div key={note.id} className="recent-item">
                                  <span className="recent-title">{note.title}</span>
                                  <span className="recent-date">{note.updatedAt}</span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 浏览历史标签页内容 - 仅user类型用户可见 */}
              {activeTab === 'history' && (
                <div className="tool-content">
                  <div className="section-header">
                    <div className="section-title-row">
                      <h2>📊 Browsing History</h2>
                      <button 
                        className="clear-history-btn"
                        onClick={clearBrowsingHistory}
                        title="清除所有浏览历史"
                      >
                        🗑️ 清除历史
                      </button>
                    </div>
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

      {/* 學科選擇模態框 */}
      {showSubjectModal && (
        <div className="modal-overlay" onClick={closeSubjectModal}>
          <div className="subject-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>选择学科</h3>
              <button className="close-btn" onClick={closeSubjectModal}>×</button>
            </div>
            <div className="modal-content">
              <p className="modal-description">选择您感兴趣的学科（最多6个）</p>
              <div className="subjects-selection-grid">
                {availableSubjects.map((subject) => {
                  const isSelected = selectedSubjects.some(s => s.id === subject.id);
                  return (
                    <div 
                      key={subject.id} 
                      className={`subject-selection-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSubjectSelection(subject)}
                    >
                      <div className="subject-icon">{subject.icon}</div>
                      <div className="subject-name">{subject.name}</div>
                      <div className="subject-description">{subject.description}</div>
                      {isSelected && <div className="selected-indicator">✓</div>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeSubjectModal}>取消</button>
              <button className="confirm-btn" onClick={confirmSubjectSelection}>确认</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;