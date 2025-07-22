// ==================== API服务 ====================
import { subjectsData } from './mockData.js';


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