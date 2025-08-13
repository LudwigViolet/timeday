const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  generateSessionId,
  blacklistToken,
  blacklistSessionTokens
} = require('../utils/jwt');
const { UserManager } = require('../models/User');
const SessionManager = require('../models/Session');
const { 
  authenticateToken, 
  authenticateRefreshToken,
  optionalAuth 
} = require('../middleware/auth');
const { externalApiClient } = require('../utils/externalApi');
const securityConfig = require('../config/security');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// 存储已撤销的token（生产环境应使用Redis）
const tokenBlacklist = new Set();

// 超时控制函数
const timeout = (ms) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error('timeout')), ms)
);

const router = express.Router();

/**
 * POST /oauth/token - 用户登录
 * 支持用户名密码登录，返回access_token和refresh_token
 */
router.post('/token', async (req, res) => {
  try {
    const { username, password, device_info } = req.body;

    // 验证请求参数
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Username and password are required'
      });
    }

    // 验证用户凭据
    const user = await UserManager.validateLogin(username, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password'
      });
    }

    // 生成会话ID和token
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      ...device_info
    };
    const sessionId = SessionManager.create(user.userId, deviceInfo);
    
    // 生成tokens
    const userPayload = {
      userId: user.userId,
      username: user.username,
      role: user.role
    };
    
    const accessToken = generateAccessToken(userPayload, sessionId);
    const refreshToken = generateRefreshToken(userPayload, sessionId);

    // 设置安全cookie
    const cookieOptions = {
      httpOnly: securityConfig.cookie.httpOnly,
      secure: securityConfig.cookie.secure,
      sameSite: securityConfig.cookie.sameSite,
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    };

    // Access token cookie
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: securityConfig.cookie.maxAge.accessToken
    });

    // Refresh token cookie
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: securityConfig.cookie.maxAge.refreshToken
    });

    // 返回用户信息和会话信息
    res.json({
      success: true,
      data: {
        user: user.getPublicInfo(),
        session_id: sessionId,
        expires_in: 3600, // access token有效期（秒）
        token_type: 'Bearer'
      },
      message: 'Login successful'
    });

    console.log(`User logged in: ${username} (session: ${sessionId})`);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Login failed due to server error'
    });
  }
});

/**
 * GET /oauth/userinfo - 获取当前用户信息
 * 需要有效的access_token
 */
router.get('/userinfo', authenticateToken, (req, res) => {
  try {
    // 获取用户的所有活跃会话
    const sessions = SessionManager.getUserSessions(req.user.userId);
    
    res.json({
      success: true,
      data: {
        user: req.user,
        session_id: req.sessionId,
        active_sessions: sessions.length,
        current_session: sessions.find(s => s.sessionId === req.sessionId)
      }
    });

  } catch (error) {
    console.error('Get userinfo error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get user information'
    });
  }
});

/**
 * POST /oauth/refresh - 刷新access token
 * 需要有效的refresh_token，返回新的access_token和refresh_token
 */
router.post('/refresh', authenticateRefreshToken, async (req, res) => {
  try {
    const user = req.user;
    const oldSessionId = req.sessionId;
    const oldRefreshToken = req.refreshToken;

    // 验证会话是否存在且有效
    if (!SessionManager.isValid(oldSessionId, user.userId)) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_SESSION',
        message: 'Invalid or expired session'
      });
    }
    
    // 获取当前会话信息
    const currentSession = SessionManager.get(oldSessionId);
    
    // 生成新的会话ID（可选：保持原会话ID或生成新的）
    // 这里选择生成新的会话ID以提高安全性
    const newSessionId = generateSessionId();
    
    // 移除旧会话
    SessionManager.remove(oldSessionId);
    
    // 创建新会话（保持设备信息）
    SessionManager.create(user.userId, currentSession.deviceInfo, newSessionId);

    // 将旧的refresh token加入黑名单
    blacklistToken(oldRefreshToken, oldSessionId);
    
    // 生成新的tokens
    const userPayload = {
      userId: user.userId,
      username: user.username,
      role: user.role
    };
    
    const newAccessToken = generateAccessToken(userPayload, newSessionId);
    const newRefreshToken = generateRefreshToken(userPayload, newSessionId);

    // 设置新的HttpOnly cookies
    const cookieOptions = {
      httpOnly: securityConfig.cookie.httpOnly,
      secure: securityConfig.cookie.secure,
      sameSite: securityConfig.cookie.sameSite,
      domain: process.env.COOKIE_DOMAIN
    };

    // 更新cookies
    res.cookie('access_token', newAccessToken, {
      ...cookieOptions,
      maxAge: securityConfig.cookie.maxAge.accessToken
    });

    res.cookie('refresh_token', newRefreshToken, {
      ...cookieOptions,
      maxAge: securityConfig.cookie.maxAge.refreshToken
    });

    res.json({
      success: true,
      data: {
        user: user,
        session_id: newSessionId,
        expires_in: 3600,
        token_type: 'Bearer'
      },
      message: 'Token refreshed successfully'
    });

    console.log(`Token refreshed for user: ${user.username} (old session: ${oldSessionId}, new session: ${newSessionId})`);

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Token refresh failed'
    });
  }
});

/**
 * POST /oauth/logout - 用户登出
 * 使当前会话的tokens失效
 */
router.post('/logout', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const sessionId = req.sessionId;
    const accessToken = req.accessToken;
    const refreshToken = req.cookies?.refresh_token;

    // 移除会话
    SessionManager.remove(sessionId);

    // 将tokens加入黑名单
    if (accessToken) {
      blacklistToken(accessToken, sessionId);
    }
    if (refreshToken) {
      blacklistToken(refreshToken, sessionId);
    }

    // 清除cookies
    const cookieOptions = {
      httpOnly: securityConfig.cookie.httpOnly,
      secure: securityConfig.cookie.secure,
      sameSite: securityConfig.cookie.sameSite,
      domain: process.env.COOKIE_DOMAIN
    };
    
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);

    res.json({
      success: true,
      message: 'Logout successful'
    });

    console.log(`User logged out: ${req.user.username} (session: ${sessionId})`);

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Logout failed'
    });
  }
});

/**
 * POST /oauth/register - 用户注册
 * 创建新用户账号并自动登录返回token
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, avatar, role = 'student', device_info, displayName } = req.body;
    
    // 调试日志：输出收到的用户名信息
    console.log('注册请求 - 用户名:', username);
    console.log('注册请求 - 用户名长度:', username ? username.length : 'undefined');
    console.log('注册请求 - 用户名字符:', username ? Array.from(username).map(c => `${c}(${c.charCodeAt(0)})`).join(', ') : 'undefined');

    // 验证请求参数
    if (!username || !password) {
      console.log('注册失败 - 缺少凭据');
      return res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Username and password are required'
      });
    }

    // 验证用户名格式
    if (username.length < 3 || username.length > 20) {
      console.log('注册失败 - 用户名长度不符合要求:', username.length);
      return res.status(400).json({
        success: false,
        error: 'INVALID_USERNAME',
        message: 'Username must be between 3 and 20 characters'
      });
    }

    // 验证用户名包含字母、数字、下划线和中文字符
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_USERNAME',
        message: 'Username can only contain letters, numbers, underscores and Chinese characters'
      });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters long'
      });
    }

    // 检查用户是否已存在
    const existingUser = await UserManager.findByUsername(username);
    if (existingUser) {
      console.log(`注册失败 - 用户名已存在: ${username}`);
      return res.status(409).json({
        success: false,
        error: 'USERNAME_EXISTS',
        message: 'Username already exists'
      });
    }

    // 创建用户
    const user = await UserManager.createUser(username, password, avatar, role);
    
    // 如果提供了displayName，更新用户信息
    if (displayName && displayName !== username) {
      await UserManager.updateDisplayName(user.userId, displayName);
    }
    
    // 注册成功后自动登录，生成token
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      ...device_info
    };
    const sessionId = SessionManager.create(user.userId, deviceInfo);
    
    // 生成tokens
    const userPayload = {
      userId: user.userId,
      username: user.username,
      role: user.role
    };
    
    const accessToken = generateAccessToken(userPayload, sessionId);
    const refreshToken = generateRefreshToken(userPayload, sessionId);

    // 设置安全cookie
    const cookieOptions = {
      httpOnly: securityConfig.cookie.httpOnly,
      secure: securityConfig.cookie.secure,
      sameSite: securityConfig.cookie.sameSite,
      path: '/',
      domain: process.env.COOKIE_DOMAIN
    };

    // Access token cookie
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: securityConfig.cookie.maxAge.accessToken
    });

    // Refresh token cookie
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: securityConfig.cookie.maxAge.refreshToken
    });
    
    res.status(201).json({
      success: true,
      data: {
        user: user.getPublicInfo(),
        session_id: sessionId,
        expires_in: 3600, // access token有效期（秒）
        token_type: 'Bearer'
      },
      message: 'User registered and logged in successfully'
    });

    console.log(`User registered and logged in: ${username} (${user.userId}, session: ${sessionId})`);

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'Username already exists') {
      return res.status(409).json({
        success: false,
        error: 'USERNAME_EXISTS',
        message: 'Username already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Registration failed due to server error'
    });
  }
});

/**
 * GET /oauth/accounts - 获取用户的多账号信息
 * 返回当前用户可切换的账号列表
 */
router.get('/accounts', optionalAuth, (req, res) => {
  try {
    // 如果用户已登录，返回其账号信息
    if (req.user) {
      const sessions = SessionManager.getUserSessions(req.user.userId);
      
      res.json({
        success: true,
        data: {
          current_user: {
            userId: req.user.userId,
            username: req.user.username,
            avatar: req.user.avatar,
            session_id: req.sessionId
          },
          accounts: [{
            userId: req.user.userId,
            username: req.user.username,
            avatar: req.user.avatar,
            session_id: req.sessionId,
            is_current: true,
            last_active: sessions.find(s => s.sessionId === req.sessionId)?.lastActiveAt
          }]
        }
      });
    } else {
      // 未登录用户返回空账号列表
      res.json({
        success: true,
        data: {
          current_user: null,
          accounts: []
        }
      });
    }

  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get accounts'
    });
  }
});

/**
 * GET /oauth/external/status - 检查外部API连接状态（带超时控制）
 */
router.get('/external/status', async (req, res) => {
  try {
    const isConnected = await Promise.race([
      externalApiClient.testConnection(),
      timeout(2000) // 2秒超时
    ]);
    const apiInfo = isConnected ? await Promise.race([
      externalApiClient.getApiInfo(),
      timeout(2000) // 2秒超时
    ]) : null;
    
    res.json({
      success: true,
      data: {
        external_api_connected: isConnected,
        external_api_info: apiInfo,
        fallback_mode: !isConnected
      }
    });
  } catch (error) {
    console.error('External API status check error:', error.message);
    res.json({
      success: true,
      data: {
        external_api_connected: false,
        external_api_info: null,
        fallback_mode: true,
        error: error.message
      }
    });
  }
});

// 健康检查接口（不依赖外部API）
router.get('/health', (req, res) => {
  const stats = SessionManager.getStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    sessions: stats,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 调试接口：获取所有用户（仅用于调试）
router.get('/debug/users', (req, res) => {
  try {
    const allUsers = UserManager.getAllUsers();
    res.json({
      success: true,
      data: {
        users: allUsers,
        count: allUsers.length
      },
      message: 'All users retrieved successfully'
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get debug users'
    });
  }
});

// 会话管理接口
router.get('/sessions', authenticateToken, (req, res) => {
  try {
    const userSessions = SessionManager.getUserSessions(req.user.userId);
    res.json({
      success: true,
      sessions: userSessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get sessions'
    });
  }
});

// 撤销指定会话
router.delete('/sessions/:sessionId', authenticateToken, (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = SessionManager.get(sessionId);
    
    // 验证会话属于当前用户
    if (!session || session.userId !== req.user.userId) {
      return res.status(404).json({
        success: false,
        error: 'SESSION_NOT_FOUND',
        message: 'Session not found or access denied'
      });
    }
    
    // 将该会话的所有token加入黑名单
    blacklistSessionTokens(sessionId);
    
    SessionManager.remove(sessionId);
    
    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
    
    console.log(`Session revoked: ${sessionId} for user: ${req.user.username}`);
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to revoke session'
    });
  }
});

module.exports = router;