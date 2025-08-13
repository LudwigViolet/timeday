const https = require('https');
const http = require('http');
const querystring = require('querystring');

/**
 * 外部API客户端类
 * 用于与外部后端服务器进行OAuth认证通信
 */
class ExternalApiClient {
  constructor() {
    this.host = process.env.EXTERNAL_BACKEND_HOST;
    this.port = process.env.EXTERNAL_BACKEND_PORT;
    this.clientId = process.env.OAUTH_CLIENT_ID;
    this.clientSecret = process.env.OAUTH_CLIENT_SECRET;
    this.baseUrl = `http://${this.host}:${this.port}`;
  }

  /**
   * 发送HTTP请求的通用方法
   * @param {string} method - HTTP方法
   * @param {string} path - API路径
   * @param {Object} data - 请求数据
   * @param {Object} headers - 请求头
   * @returns {Promise<Object>} 响应数据
   */
  async makeRequest(method, path, data = null, headers = {}) {
    const REQUEST_TIMEOUT = 3000; // 3秒超时
    
    // 创建超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT);
    });
    
    // 创建请求Promise
    const requestPromise = new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Violet-Auth-Client/1.0',
          ...headers
        }
      };

      // 如果是POST请求且有数据，设置Content-Length
      if (data && (method === 'POST' || method === 'PUT')) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsedData
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      // 设置请求超时
      req.setTimeout(REQUEST_TIMEOUT, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      // 发送数据
      if (data && (method === 'POST' || method === 'PUT')) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
    
    // 使用Promise.race实现超时控制
    return Promise.race([requestPromise, timeoutPromise]);
  }

  /**
   * 验证用户凭据（通过外部API）
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 用户信息或null
   */
  async validateUserCredentials(username, password) {
    try {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: username,
        password: password,
        grant_type: 'password'
      });

      if (response.statusCode === 200 && response.data.success) {
        return {
          userId: response.data.user.id,
          username: response.data.user.username,
          role: response.data.user.role || 'student',
          avatar: response.data.user.avatar,
          externalToken: response.data.access_token
        };
      }

      return null;
    } catch (error) {
      console.error('External API validation error:', error);
      return null;
    }
  }

  /**
   * 获取用户信息（通过外部API）
   * @param {string} externalToken - 外部API的访问令牌
   * @returns {Promise<Object>} 用户信息或null
   */
  async getUserInfo(externalToken) {
    try {
      const response = await this.makeRequest('GET', '/api/user/info', null, {
        'Authorization': `Bearer ${externalToken}`
      });

      if (response.statusCode === 200 && response.data.success) {
        return {
          userId: response.data.user.id,
          username: response.data.user.username,
          role: response.data.user.role || 'student',
          avatar: response.data.user.avatar
        };
      }

      return null;
    } catch (error) {
      console.error('External API get user info error:', error);
      return null;
    }
  }

  /**
   * 创建新用户（通过外部API）
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {Object} userInfo - 其他用户信息
   * @returns {Promise<Object>} 创建结果
   */
  async createUser(username, password, userInfo = {}) {
    try {
      const response = await this.makeRequest('POST', '/api/auth/register', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: username,
        password: password,
        role: userInfo.role || 'student',
        avatar: userInfo.avatar
      });

      if (response.statusCode === 201 && response.data.success) {
        return {
          success: true,
          user: {
            userId: response.data.user.id,
            username: response.data.user.username,
            role: response.data.user.role,
            avatar: response.data.user.avatar
          }
        };
      }

      return {
        success: false,
        error: response.data.error || 'Registration failed'
      };
    } catch (error) {
      console.error('External API create user error:', error);
      return {
        success: false,
        error: 'External API error'
      };
    }
  }

  /**
   * 验证外部API连接
   * @returns {Promise<boolean>} 连接状态
   */
  async testConnection() {
    try {
      const response = await this.makeRequest('GET', '/api/health');
      return response.statusCode === 200;
    } catch (error) {
      console.error('External API connection test failed:', error);
      return false;
    }
  }

  /**
   * 获取API信息
   * @returns {Promise<Object>} API信息
   */
  async getApiInfo() {
    try {
      const response = await this.makeRequest('GET', '/api/info');
      if (response.statusCode === 200) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Get external API info error:', error);
      return null;
    }
  }
}

// 创建单例实例
const externalApiClient = new ExternalApiClient();

module.exports = {
  ExternalApiClient,
  externalApiClient
};