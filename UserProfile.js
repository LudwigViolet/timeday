import React from 'react';

/**
 * UserProfile 组件 - 用户资料页面
 * @param {Object} props
 * @param {Object} props.user - 用户信息
 * @param {Object} props.userProfile - 用户个人资料
 * @param {string} props.userAvatar - 用户头像
 * @param {string} props.activeProfileTab - 当前活动的标签页
 * @param {Array} props.selectedSubjects - 选中的学科列表
 * @param {Object} props.dailyUsageData - 每日使用时间数据
 * @param {Array} props.browsingHistory - 浏览历史
 * @param {string} props.theme - 主题
 * @param {Function} props.onBackToMain - 返回主页面回调
 * @param {Function} props.onLogout - 登出回调
 * @param {Function} props.onAvatarUpload - 头像上传回调
 * @param {Function} props.onProfileUpdate - 资料更新回调
 * @param {Function} props.onTabChange - 标签切换回调
 * @param {Function} props.onSubjectModalOpen - 打开学科选择模态框回调
 * @param {Function} props.onThemeToggle - 主题切换回调
 */
const UserProfile = ({
  // 数据props
  user,
  userProfile,
  userAvatar,
  activeProfileTab,
  selectedSubjects,
  dailyUsageData,
  browsingHistory,
  theme,
  
  // 回调函数props
  onBackToMain,
  onLogout,
  onAvatarUpload,
  onProfileUpdate,
  onTabChange,
  onSubjectModalOpen,
  onThemeToggle
}) => {
  return (
    <div className="user-profile-page">
      {/* 主题切换按钮 - 在用户资料页面显示在全局位置 */}
      <button className="theme-toggle" onClick={onThemeToggle} style={{position: 'fixed', top: '20px', right: '20px', zIndex: 1000}}>
        {theme === 'light' ? '☀️' : '🌙'}
      </button>
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="profile-avatar" />
            ) : (
              <div className="profile-avatar default">👤</div>
            )}
            <h1 className="profile-username">{user?.username}</h1>
            <p className="profile-bio">Past Papers Enthusiast</p>
            <div className="profile-details">
              <div className="profile-detail-item">
                <span>📧</span>
                <span>{user?.email}</span>
              </div>
              <div className="profile-detail-item">
                <span>👤</span>
                <span>{user?.userType === 'user' ? 'Premium User' : 'Guest User'}</span>
              </div>
              {userProfile.grade && (
                <div className="profile-detail-item">
                  <span>🎓</span>
                  <span>Grade {userProfile.grade}</span>
                </div>
              )}
              {userProfile.gender && (
                <div className="profile-detail-item">
                  <span>{userProfile.gender === 'male' ? '♂️' : userProfile.gender === 'female' ? '♀️' : '📦'}</span>
                  <span>{userProfile.gender === 'male' ? 'Male' : userProfile.gender === 'female' ? 'Female' : '沃尔玛购物袋'}</span>
                </div>
              )}
              {userProfile.location && (
                <div className="profile-detail-item">
                  <span>📍</span>
                  <span>Base: {userProfile.location}</span>
                </div>
              )}
              {userProfile.curriculum && (
                <div className="profile-detail-item">
                  <span>📚</span>
                  <span>{userProfile.curriculum}</span>
                </div>
              )}
              <div className="profile-detail-item">
                <span>📅</span>
                <span>Joined December 2024</span>
              </div>
              {userProfile.bio && (
                <div className="profile-detail-item">
                  <span>💭</span>
                  <span>{userProfile.bio}</span>
                </div>
              )}
            </div>
            <div className="profile-actions">
              <label className="profile-action-btn">
                📷 Change Avatar
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onAvatarUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <button className="profile-action-btn" onClick={onBackToMain}>
                🏠 Back to Dashboard
              </button>
              <button className="profile-action-btn danger" onClick={onLogout}>
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
        
        <div className="profile-main">
          <nav className="profile-nav">
            <button 
              className={`profile-nav-item ${activeProfileTab === 'overview' ? 'active' : ''}`}
              onClick={() => onTabChange('overview')}
            >
              Overview
            </button>
            <button 
              className={`profile-nav-item ${activeProfileTab === 'activity' ? 'active' : ''}`}
              onClick={() => onTabChange('activity')}
            >
              Activity
            </button>
            <button 
              className={`profile-nav-item ${activeProfileTab === 'settings' ? 'active' : ''}`}
              onClick={() => onTabChange('settings')}
            >
              Settings
            </button>
          </nav>
          
          <div className="profile-content">
            {/* Overview Tab */}
            {activeProfileTab === 'overview' && (
              <>
            <div className="profile-subjects">
              <div className="subjects-header">
                <h3 className="subjects-title">我的學科</h3>
                <button className="add-subject-btn" onClick={onSubjectModalOpen}>
                  <span className="add-icon">+</span>
                  添加學科
                </button>
              </div>
              <div className="subjects-grid">
                {selectedSubjects.map((subject) => (
                  <div key={subject.id} className="subject-option-card" onClick={onSubjectModalOpen}>
                    <div className="subject-icon">{subject.icon}</div>
                    <div className="subject-name">{subject.name}</div>
                    <div className="subject-description">{subject.description}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="contribution-graph">
              <h3 className="contribution-title">每日使用時間</h3>
              
              {/* 月份標籤 - 按2025年實際日期分佈 */}
              <div className="contribution-months">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => {
                  // 計算2025年每個月1號在371天中的位置
                  const startDate = new Date(2025, 0, 1); // 2025年1月1日
                  const monthFirstDay = new Date(2025, index, 1);
                  const daysDiff = Math.floor((monthFirstDay - startDate) / (24 * 60 * 60 * 1000));
                  
                  // 只顯示在371天範圍內的月份
                  if (daysDiff >= 0 && daysDiff < 371) {
                    const weekPosition = Math.floor(daysDiff / 7);
                    return (
                      <span 
                        key={index} 
                        className="contribution-month"
                        style={{ left: `${weekPosition * 14}px` }} // 每週約14px寬
                      >
                        {month}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              
              <div className="contribution-calendar">
                {/* 生成53週 × 7天 = 371個格子 */}
                {Array.from({ length: 371 }, (_, i) => {
                  const week = Math.floor(i / 7);
                  const day = i % 7;
                  
                  // 计算对应的日期 - 从2025年1月1日开始
                  const startDate = new Date(2025, 0, 1); // 2025年1月1日
                  const targetDate = new Date(startDate);
                  targetDate.setDate(startDate.getDate() + i);
                  const dateStr = targetDate.toISOString().split('T')[0];
                  
                  // 从用户使用数据中获取该日的使用时间
                  const usageTime = dailyUsageData[dateStr] || 0;
                  
                  // 根据使用时间计算活动等级
                  let level = 0;
                  if (usageTime > 0) {
                    const hours = usageTime / (1000 * 60 * 60);
                    if (hours >= 3) level = 4;
                    else if (hours >= 2) level = 3;
                    else if (hours >= 1) level = 2;
                    else level = 1;
                  }
                  
                  const formatTime = (ms) => {
                    const hours = Math.floor(ms / (1000 * 60 * 60));
                    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
                    if (hours > 0) return `${hours}h ${minutes}m`;
                    return `${minutes}m`;
                  };
                  
                  return (
                    <div 
                      key={i} 
                      className={`contribution-day ${level > 0 ? `level-${level}` : ''}`}
                      title={`${dateStr}: ${formatTime(usageTime)}`}
                      style={{
                        gridColumn: week + 1,
                        gridRow: day + 1
                      }}
                    />
                  );
                })}
              </div>
              
              <div className="contribution-legend">
                <span>Less</span>
                <div className="contribution-day"></div>
                <div className="contribution-day level-1"></div>
                <div className="contribution-day level-2"></div>
                <div className="contribution-day level-3"></div>
                <div className="contribution-day level-4"></div>
                <span>More</span>
              </div>
            </div>
            
            <div className="recent-activity">
              <h3 className="activity-title">Recent Activity</h3>
              <div className="activity-list">
                {browsingHistory.slice(0, 5).map((item, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {item.type === 'subject' ? item.icon : '📄'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-description">
                        Viewed {item.name}
                        {item.subjectName && ` in ${item.subjectName}`}
                      </div>
                      <div className="activity-time">
                        {new Date(item.lastVisited).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              </>
            )}
            
            {/* Activity Tab */}
            {activeProfileTab === 'activity' && (
              <div className="activity-content">
                <h3>Activity History</h3>
                <div className="activity-list">
                  {browsingHistory.map((item, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        {item.type === 'subject' ? item.icon : '📄'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-description">
                          Viewed {item.name}
                          {item.subjectName && ` in ${item.subjectName}`}
                        </div>
                        <div className="activity-time">
                          {new Date(item.lastVisited).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Settings Tab */}
            {activeProfileTab === 'settings' && (
              <div className="settings-content">
                <h3>Personal Information</h3>
                <div className="settings-form">
                  <div className="form-group">
                    <label htmlFor="grade">Grade:</label>
                    <select 
                      id="grade"
                      value={userProfile.grade} 
                      onChange={(e) => {
                        const newProfile = { ...userProfile, grade: e.target.value };
                        onProfileUpdate(newProfile);
                        localStorage.setItem('userProfile', JSON.stringify(newProfile));
                      }}
                    >
                      <option value="">Select Grade</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="gender">Gender:</label>
                    <select 
                      id="gender"
                      value={userProfile.gender} 
                      onChange={(e) => {
                        const newProfile = { ...userProfile, gender: e.target.value };
                        onProfileUpdate(newProfile);
                        localStorage.setItem('userProfile', JSON.stringify(newProfile));
                      }}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="walmart">沃尔玛购物袋</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="bio">Personal Bio:</label>
                    <input 
                      type="text"
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={userProfile.bio} 
                      onChange={(e) => {
                        const newProfile = { ...userProfile, bio: e.target.value };
                        onProfileUpdate(newProfile);
                        localStorage.setItem('userProfile', JSON.stringify(newProfile));
                      }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="location">Base Location:</label>
                    <input 
                      type="text"
                      id="location"
                      placeholder="e.g., Shanghai"
                      value={userProfile.location} 
                      onChange={(e) => {
                        const newProfile = { ...userProfile, location: e.target.value };
                        onProfileUpdate(newProfile);
                        localStorage.setItem('userProfile', JSON.stringify(newProfile));
                      }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="curriculum">Curriculum:</label>
                    <select 
                      id="curriculum"
                      value={userProfile.curriculum} 
                      onChange={(e) => {
                        const newProfile = { ...userProfile, curriculum: e.target.value };
                        onProfileUpdate(newProfile);
                        localStorage.setItem('userProfile', JSON.stringify(newProfile));
                      }}
                    >
                      <option value="">Select Curriculum</option>
                      <option value="CIE">CIE (Cambridge International Examinations)</option>
                      <option value="AQA">AQA</option>
                      <option value="Edexcel">Edexcel (爱德思)</option>
                      <option value="OCR">OCR</option>
                      <option value="WJEC">WJEC</option>
                      <option value="IB">IB (International Baccalaureate)</option>
                      <option value="AP">AP (Advanced Placement)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

