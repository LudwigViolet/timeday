/**
 * API服务模块
 * 处理与后端的所有HTTP通信
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * 通用HTTP请求函数
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} 响应数据
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // 重要：包含cookies
    ...options,
  };

  // 如果有body数据且不是FormData，则序列化为JSON
  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    // 检查响应状态
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        errorData = {
          error: 'NETWORK_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      // 对于特定的业务错误（如用户名冲突），返回标准对象而不是抛出异常
      if (response.status === 409 && errorData.error === 'USERNAME_EXISTS') {
        return { success: false, ...errorData };
      }
      
      // 其他错误继续抛出异常
      throw errorData;
    }

    // 解析响应数据
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw {
        error: 'PARSE_ERROR',
        message: 'Failed to parse server response'
      };
    }
    return data;
  } catch (error) {
    // 如果error已经是对象格式，直接抛出
    if (error && typeof error === 'object' && error.error) {
      throw error;
    }
    
    // 处理其他类型的错误（如网络错误）
    throw {
      error: 'NETWORK_ERROR',
      message: error.message || 'Network request failed'
    };
  }
}

/**
 * 认证相关API
 */
export const authAPI = {
  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {Object} deviceInfo - 设备信息
   * @returns {Promise<Object>} 登录结果
   */
  async login(username, password, deviceInfo = {}) {
    return apiRequest('/oauth/token', {
      method: 'POST',
      body: {
        username,
        password,
        device_info: {
          device_name: deviceInfo.device_name || 'Web Browser',
          platform: deviceInfo.platform || navigator.platform,
          user_agent: navigator.userAgent,
          ...deviceInfo
        }
      }
    });
  },

  /**
   * 用户注册
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 注册结果
   */
  async register(userData) {
    return apiRequest('/oauth/register', {
      method: 'POST',
      body: {
        username: userData.username,
        password: userData.password,
        displayName: userData.displayName,
        email: userData.email,
        role: userData.role || 'student',
        avatar: userData.avatar
      }
    });
  },

  /**
   * 获取当前用户信息
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo() {
    return apiRequest('/oauth/userinfo', {
      method: 'GET'
    });
  },

  /**
   * 刷新token
   * @returns {Promise<Object>} 新的token信息
   */
  async refreshToken() {
    return apiRequest('/oauth/refresh', {
      method: 'POST'
    });
  },

  /**
   * 用户登出
   * @returns {Promise<Object>} 登出结果
   */
  async logout() {
    return apiRequest('/oauth/logout', {
      method: 'POST'
    });
  },

  /**
   * 获取用户会话列表
   * @returns {Promise<Object>} 会话列表
   */
  async getSessions() {
    return apiRequest('/oauth/sessions', {
      method: 'GET'
    });
  },

  /**
   * 删除指定会话
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteSession(sessionId) {
    return apiRequest(`/oauth/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  },

  /**
   * 获取账户列表
   * @returns {Promise<Object>} 账户列表
   */
  async getAccounts() {
    return apiRequest('/oauth/accounts', {
      method: 'GET'
    });
  },

  /**
   * 检查后端健康状态
   * @returns {Promise<Object>} 健康状态
   */
  async checkHealth() {
    return apiRequest('/oauth/health', {
      method: 'GET'
    });
  },

  /**
   * 检查外部API状态
   * @returns {Promise<Object>} 外部API状态
   */
  async checkExternalStatus() {
    return apiRequest('/oauth/external/status', {
      method: 'GET'
    });
  }
};

/**
 * 通用API工具
 */
export const apiUtils = {
  /**
   * 检查是否为认证错误
   * @param {Object} error - 错误对象
   * @returns {boolean} 是否为认证错误
   */
  isAuthError(error) {
    return error && (
      error.error === 'TOKEN_EXPIRED' ||
      error.error === 'TOKEN_INVALID' ||
      error.error === 'TOKEN_BLACKLISTED' ||
      error.error === 'UNAUTHORIZED'
    );
  },

  /**
   * 检查是否为网络错误
   * @param {Object} error - 错误对象
   * @returns {boolean} 是否为网络错误
   */
  isNetworkError(error) {
    return error && error.error === 'NETWORK_ERROR';
  },

  /**
   * 格式化错误消息
   * @param {Object} error - 错误对象
   * @returns {string} 格式化的错误消息
   */
  formatError(error) {
    if (!error) return 'Unknown error';
    
    // 如果有自定义消息，优先使用
    if (error.message) {
      return error.message;
    }
    
    // 根据错误类型返回友好的消息
    switch (error.error) {
      case 'INVALID_CREDENTIALS':
        return '用户名或密码错误';
      case 'TOKEN_EXPIRED':
        return '登录已过期，请重新登录';
      case 'TOKEN_INVALID':
        return '登录状态无效，请重新登录';
      case 'TOKEN_BLACKLISTED':
        return '登录已失效，请重新登录';
      case 'UNAUTHORIZED':
        return '未授权访问，请先登录';
      case 'NETWORK_ERROR':
        return '网络连接失败，请检查网络设置';
      case 'MISSING_CREDENTIALS':
        return '请输入用户名和密码';
      case 'USER_EXISTS':
      case 'USERNAME_EXISTS':
        return '用户名已存在，请选择其他用户名';
      case 'INVALID_USERNAME':
        return '用户名格式不正确，请使用3-20个字符';
      case 'VALIDATION_ERROR':
        return '输入数据格式不正确';
      case 'INTERNAL_SERVER_ERROR':
        return '服务器内部错误，请稍后重试';
      default:
        return error.error || 'Unknown error';
    }
  }
};

const apiService = {
  authAPI,
  apiUtils
};

export default apiService;