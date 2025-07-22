/**
 * Cookie操作工具类
 * 用于管理用户登录状态的持久化存储
 * 后端对接说明：这些Cookie值需要与后端的session/token验证机制对应
             */
export const CookieUtils = {
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