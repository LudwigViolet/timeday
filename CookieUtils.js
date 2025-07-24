/**
 * Cookie操作工具类
 * 用于管理多用户登录状态的持久化存储
 * 后端对接说明：这些Cookie值需要与后端的session/token验证机制对应
 */
export const CookieUtils = {
  /**
   * 设置Cookie
   * @param {string} name - Cookie名称
   * @param {string} value - Cookie值
   * @param {number} days - 过期天数
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
   */
  deleteCookie: (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },

  // ========== 多用户Token管理方法 ==========
  
  /**
   * 设置用户Token
   * @param {string} username - 用户名
   * @param {string} token - 用户Token
   * @param {Object} userData - 用户数据
   * @param {number} days - 过期天数，默认7天
   */
  setUserToken: (username, token, userData, days = 7) => {
    // 存储用户Token
    CookieUtils.setCookie(`userToken_${username}`, token, days);
    
    // 处理头像数据存储
    if (userData.userAvatar) {
      CookieUtils.setUserAvatar(username, userData.userAvatar, days);
      // 从userData中移除头像数据，避免重复存储
      const userDataWithoutAvatar = { ...userData };
      delete userDataWithoutAvatar.userAvatar;
      CookieUtils.setCookie(`userData_${username}`, JSON.stringify(userDataWithoutAvatar), days);
    } else {
      // 存储用户数据(不含头像)
      CookieUtils.setCookie(`userData_${username}`, JSON.stringify(userData), days);
    }
    
    // 更新活跃用户
    CookieUtils.setCookie('activeUser', username, days);
    // 更新最近用户列表
    CookieUtils.updateLastUsers(username);
  },

  /**
   * 获取用户Token
   * @param {string} username - 用户名
   * @returns {string|null} Token或null
   */
  getUserToken: (username) => {
    return CookieUtils.getCookie(`userToken_${username}`);
  },

  /**
   * 获取用户数据
   * @param {string} username - 用户名
   * @returns {Object|null} 用户数据或null
   */
  getUserData: (username) => {
    const userData = CookieUtils.getCookie(`userData_${username}`);
    try {
      const parsedData = userData ? JSON.parse(userData) : null;
      if (parsedData) {
        // 自动获取头像数据并合并
        const avatarData = CookieUtils.getUserAvatar(username);
        if (avatarData && avatarData !== 'default') {
          parsedData.userAvatar = avatarData;
        }
      }
      return parsedData;
    } catch (e) {
      console.error('解析用户数据失败:', e);
      return null;
    }
  },

  /**
   * 删除用户Token和数据
   * @param {string} username - 用户名
   */
  deleteUserToken: (username) => {
    CookieUtils.deleteCookie(`userToken_${username}`);
    CookieUtils.deleteCookie(`userData_${username}`);
    CookieUtils.deleteUserAvatar(username);
  },

  /**
   * 获取当前活跃用户
   * @returns {string|null} 活跃用户名或null
   */
  getActiveUser: () => {
    return CookieUtils.getCookie('activeUser');
  },

  /**
   * 设置活跃用户
   * @param {string} username - 用户名
   */
  setActiveUser: (username) => {
    CookieUtils.setCookie('activeUser', username, 7);
  },

  /**
   * 获取所有用户Token
   * @returns {Array} 用户Token列表 [{username, token, userData}]
   */
  getAllUserTokens: () => {
    const cookies = document.cookie.split(';');
    const userTokens = [];
    
    cookies.forEach(cookie => {
      const trimmed = cookie.trim();
      if (trimmed.startsWith('userToken_')) {
        const username = trimmed.split('=')[0].replace('userToken_', '');
        const token = CookieUtils.getUserToken(username);
        const userData = CookieUtils.getUserData(username);
        
        if (token && userData) {
          userTokens.push({
            username,
            token,
            userData
          });
        }
      }
    });
    
    return userTokens;
  },

  /**
   * 更新最近用户列表
   * @param {string} username - 用户名
   */
  updateLastUsers: (username) => {
    let lastUsers = CookieUtils.getLastUsers();
    
    // 移除已存在的用户名
    lastUsers = lastUsers.filter(user => user !== username);
    
    // 添加到开头
    lastUsers.unshift(username);
    
    // 限制最多2个用户
    lastUsers = lastUsers.slice(0, 2);
    
    CookieUtils.setCookie('lastUsers', JSON.stringify(lastUsers), 30);
  },

  /**
   * 获取最近用户列表
   * @returns {Array} 最近用户名列表
   */
  getLastUsers: () => {
    const lastUsers = CookieUtils.getCookie('lastUsers');
    try {
      return lastUsers ? JSON.parse(lastUsers) : [];
    } catch (e) {
      console.error('解析最近用户列表失败:', e);
      return [];
    }
  },

  /**
   * 清理所有用户Token
   */
  clearAllUserTokens: () => {
    const userTokens = CookieUtils.getAllUserTokens();
    userTokens.forEach(({username}) => {
      CookieUtils.deleteUserToken(username);
    });
    CookieUtils.deleteCookie('activeUser');
    CookieUtils.deleteCookie('lastUsers');
  },

  /**
   * 兼容性方法：获取当前用户Token（向后兼容）
   * @returns {string|null} 当前活跃用户的Token
   */
  getCurrentUserToken: () => {
    const activeUser = CookieUtils.getActiveUser();
    return activeUser ? CookieUtils.getUserToken(activeUser) : null;
  },

  /**
   * 兼容性方法：获取当前用户数据（向后兼容）
   * @returns {Object|null} 当前活跃用户的数据
   */
  getCurrentUserData: () => {
    const activeUser = CookieUtils.getActiveUser();
    return activeUser ? CookieUtils.getUserData(activeUser) : null;
  },

  /**
   * 批量验证所有用户Token
   * @param {Function} validateTokenFn - Token验证函数，接收(username, token)参数
   * @returns {Promise<Array>} 验证结果数组 [{username, isValid, userData, error}]
   */
  batchValidateTokens: async (validateTokenFn) => {
    const allTokens = CookieUtils.getAllUserTokens();
    const validationResults = [];
    
    for (const {username, token, userData} of allTokens) {
      try {
        const isValid = await validateTokenFn(username, token);
        validationResults.push({
          username,
          isValid,
          userData: isValid ? userData : null,
          error: null
        });
        
        // 如果Token无效，清理该用户的数据
        if (!isValid) {
          CookieUtils.deleteUserToken(username);
        }
      } catch (error) {
        console.error(`验证用户 ${username} Token失败:`, error);
        validationResults.push({
          username,
          isValid: false,
          userData: null,
          error: error.message
        });
        
        // 验证出错也清理该用户数据
        CookieUtils.deleteUserToken(username);
      }
    }
    
    return validationResults;
  },

  /**
   * 获取有效的用户列表
   * @param {Array} validationResults - 批量验证结果
   * @returns {Array} 有效用户列表
   */
  getValidUsers: (validationResults) => {
    return validationResults
      .filter(result => result.isValid)
      .map(result => ({
        username: result.username,
        userData: result.userData
      }));
  },

  /**
   * 获取所有已保存的用户名列表
   * @returns {Array} 用户名数组
   */
  getAllSavedUsers: () => {
    const cookies = document.cookie.split(';');
    const usernames = new Set();
    
    cookies.forEach(cookie => {
      const trimmed = cookie.trim();
      if (trimmed.startsWith('userToken_')) {
        const username = trimmed.split('=')[0].replace('userToken_', '');
        if (username) {
          usernames.add(username);
        }
      }
    });
    
    return Array.from(usernames);
  }
};

/**
 * 浏览历史工具类
 * 用于管理用户的浏览记录，存储在localStorage中
 * 后端对接说明：这些数据可以同步到后端用户行为分析系统
 */
export const HistoryUtils = {
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

// ========== 头像存储管理方法 ==========

/**
 * 设置用户头像数据
 * @param {string} username - 用户名
 * @param {string} avatarData - 头像数据(base64或URL)
 * @param {number} days - 过期天数
 */
CookieUtils.setUserAvatar = (username, avatarData, days = 7) => {
  try {
    // 检查数据大小，如果超过3KB则进行压缩处理
    if (avatarData.length > 3000) {
      console.warn(`用户 ${username} 的头像数据较大 (${avatarData.length} 字符)，建议优化`);
      // 可以在这里添加图片压缩逻辑
    }
    
    // 如果数据过大，分片存储
    if (avatarData.length > 3500) {
      CookieUtils.setAvatarChunks(username, avatarData, days);
    } else {
      CookieUtils.setCookie(`userAvatar_${username}`, avatarData, days);
    }
  } catch (error) {
    console.error(`存储用户 ${username} 头像失败:`, error);
    // 降级处理：存储默认头像标识
    CookieUtils.setCookie(`userAvatar_${username}`, 'default', days);
  }
};

/**
 * 获取用户头像数据
 * @param {string} username - 用户名
 * @returns {string|null} 头像数据或null
 */
CookieUtils.getUserAvatar = (username) => {
  try {
    // 首先尝试获取完整头像
    const avatar = CookieUtils.getCookie(`userAvatar_${username}`);
    if (avatar && avatar !== 'chunked') {
      return avatar;
    }
    
    // 如果是分片存储，则重组数据
    if (avatar === 'chunked') {
      return CookieUtils.getAvatarChunks(username);
    }
    
    return null;
  } catch (error) {
    console.error(`获取用户 ${username} 头像失败:`, error);
    return null;
  }
};

/**
 * 删除用户头像数据
 * @param {string} username - 用户名
 */
CookieUtils.deleteUserAvatar = (username) => {
  // 删除主头像cookie
  CookieUtils.deleteCookie(`userAvatar_${username}`);
  
  // 删除可能的分片数据
  for (let i = 0; i < 10; i++) {
    CookieUtils.deleteCookie(`userAvatar_${username}_chunk_${i}`);
  }
};

/**
 * 分片存储头像数据
 * @param {string} username - 用户名
 * @param {string} avatarData - 头像数据
 * @param {number} days - 过期天数
 */
CookieUtils.setAvatarChunks = (username, avatarData, days) => {
  const chunkSize = 3000; // 每片3KB
  const chunks = [];
  
  for (let i = 0; i < avatarData.length; i += chunkSize) {
    chunks.push(avatarData.slice(i, i + chunkSize));
  }
  
  // 存储分片标识
  CookieUtils.setCookie(`userAvatar_${username}`, 'chunked', days);
  CookieUtils.setCookie(`userAvatar_${username}_chunks`, chunks.length.toString(), days);
  
  // 存储各个分片
  chunks.forEach((chunk, index) => {
    CookieUtils.setCookie(`userAvatar_${username}_chunk_${index}`, chunk, days);
  });
};

/**
 * 获取分片头像数据
 * @param {string} username - 用户名
 * @returns {string|null} 重组后的头像数据
 */
CookieUtils.getAvatarChunks = (username) => {
  const chunkCount = parseInt(CookieUtils.getCookie(`userAvatar_${username}_chunks`) || '0');
  if (chunkCount === 0) return null;
  
  let avatarData = '';
  for (let i = 0; i < chunkCount; i++) {
    const chunk = CookieUtils.getCookie(`userAvatar_${username}_chunk_${i}`);
    if (!chunk) {
      console.error(`头像分片 ${i} 丢失，用户: ${username}`);
      return null;
    }
    avatarData += chunk;
  }
  
  return avatarData;
};