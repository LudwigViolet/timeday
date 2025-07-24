// ==================== API服务 ====================
import axios from 'axios';
import { subjectsData } from './mockData.js';

// 创建axios实例
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://117.72.57.227',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加认证头
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || document.cookie
      .split('; ')
      .find(row => row.startsWith('authToken='))
      ?.split('=')[1];
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.config?.url);
    
    // 处理认证错误
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// 所有API调用都使用真实后端接口


/**
 * API服务类 - 与后端接口对接的核心模块
 * 后端开发人员需要实现以下所有API接口
 * 所有接口都应该返回统一的响应格式：{ success: boolean, data?: any, message?: string }
 */
export const ApiService = {
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
   *     userType: 'user',  // 用户类型
   *     email: string,
   *     token: string  // JWT token或session token
   *   },
   *   message?: string
   * }
   */
  login: async (username, password) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        username,
        password
      });
      
      // 保存token到localStorage和cookie
      if (response.data.success && response.data.data?.token) {
        localStorage.setItem('authToken', response.data.data.token);
        document.cookie = `authToken=${response.data.data.token}; path=/; max-age=86400`; // 24小时
      }
      
      return response.data;
    } catch (error) {
      console.error('Login API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || '登录失败，请检查网络连接'
      };
    }
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
   * 响应格式：{
   *   success: boolean,
   *   data?: {
   *     username: string,
   *     userType: 'user',
   *     email: string,
   *     token: string
   *   },
   *   message?: string
   * }
   */
  register: async (username, email, password) => {
    try {
      const response = await apiClient.post('/api/auth/register', {
        username,
        email,
        password
      });
      
      // 保存token到localStorage和cookie（注册即登录）
      if (response.data.success && response.data.data?.token) {
        localStorage.setItem('authToken', response.data.data.token);
        document.cookie = `authToken=${response.data.data.token}; path=/; max-age=86400`; // 24小时
      }
      
      return response.data;
    } catch (error) {
      console.error('Register API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || '注册失败，请检查网络连接'
      };
    }
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
    try {
      const response = await apiClient.post('/api/auth/validate', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Validate Session API Error:', error);
      return {
        success: false,
        message: '会话验证失败'
      };
    }
  },

  /**
   * 用户注销接口
   * @returns {Promise<Object>} 注销响应
   * 
   * 后端API接口：POST /api/auth/logout
   * 请求头：Authorization: Bearer {token}
   * 响应格式：{ success: boolean, message?: string }
   */
  logout: async () => {
    try {
      const response = await apiClient.post('/api/auth/logout');
      
      // 清除本地存储的token
      localStorage.removeItem('authToken');
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      return response.data;
    } catch (error) {
      console.error('Logout API Error:', error);
      // 即使API调用失败，也要清除本地token
      localStorage.removeItem('authToken');
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      return {
        success: false,
        message: error.response?.data?.message || '注销失败，请检查网络连接'
      };
    }
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
  },

  // ==================== 第三方登录接口预留 ====================
  /**
   * 微信登录接口（预留）
   * @param {string} code - 微信授权码
   * @returns {Promise<Object>} 登录响应
   * 
   * 后端API接口：POST /api/auth/wechat
   * 请求体：{ code: string }
   * 响应格式：同login接口，额外包含provider字段
   */
  wechatLogin: async (code) => {
    // TODO: 实现微信登录逻辑
    throw new Error('微信登录功能暂未实现');
  },

  /**
   * 苹果登录接口（预留）
   * @param {string} identityToken - 苹果身份令牌
   * @param {string} authorizationCode - 苹果授权码
   * @returns {Promise<Object>} 登录响应
   * 
   * 后端API接口：POST /api/auth/apple
   * 请求体：{ identityToken: string, authorizationCode: string }
   * 响应格式：同login接口，额外包含provider字段
   */
  appleLogin: async (identityToken, authorizationCode) => {
    // TODO: 实现苹果登录逻辑
    throw new Error('苹果登录功能暂未实现');
  },

  /**
   * 谷歌登录接口（预留）
   * @param {string} credential - 谷歌凭证
   * @returns {Promise<Object>} 登录响应
   * 
   * 后端API接口：POST /api/auth/google
   * 请求体：{ credential: string }
   * 响应格式：同login接口，额外包含provider字段
   */
  googleLogin: async (credential) => {
    // TODO: 实现谷歌登录逻辑
    throw new Error('谷歌登录功能暂未实现');
  }
};