const { verifyAccessToken, verifyRefreshToken } = require('../utils/jwt');
const { UserManager } = require('../models/User');
const SessionManager = require('../models/Session');

/**
 * 验证Access Token中间件
 */
async function authenticateToken(req, res, next) {
  try {
    // 从Cookie中获取access token
    const accessToken = req.cookies?.access_token;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'ACCESS_TOKEN_MISSING',
        message: 'Access token is required'
      });
    }

    // 验证token
    const { decoded, error } = verifyAccessToken(accessToken);
    if (!decoded) {
      const errorMessages = {
        'TOKEN_EXPIRED': 'Access token has expired',
        'TOKEN_BLACKLISTED': 'Token has been revoked',
        'INVALID_TOKEN_TYPE': 'Invalid token type',
        'TOKEN_INVALID': 'Invalid token format',
        'TOKEN_VERIFICATION_FAILED': 'Token verification failed'
      };
      
      return res.status(401).json({
        success: false,
        error: error || 'ACCESS_TOKEN_INVALID',
        message: errorMessages[error] || 'Invalid or expired access token'
      });
    }

    // 验证用户是否存在
    const user = await UserManager.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // 验证会话是否有效
    const isValidSession = await SessionManager.isValid(decoded.session_id, decoded.userId);
    if (!isValidSession) {
      return res.status(401).json({
        success: false,
        error: 'SESSION_INVALID',
        message: 'Session is no longer valid'
      });
    }

    // 更新会话活跃时间（异步执行，不阻塞请求）
    SessionManager.updateActivity(decoded.session_id).catch(err => {
      console.error('Failed to update session activity:', err);
    });

    // 将用户信息和会话信息添加到请求对象
    req.user = user.getPublicInfo();
    req.sessionId = decoded.session_id;
    req.accessToken = accessToken;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: 'Internal authentication error'
    });
  }
}

/**
 * 验证Refresh Token中间件
 */
async function authenticateRefreshToken(req, res, next) {
  try {
    // 从Cookie中获取refresh token
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'REFRESH_TOKEN_MISSING',
        message: 'Refresh token is required'
      });
    }

    // 验证token
    const { decoded, error } = verifyRefreshToken(refreshToken);
    if (!decoded) {
      const errorMessages = {
        'TOKEN_EXPIRED': 'Refresh token has expired',
        'TOKEN_BLACKLISTED': 'Token has been revoked',
        'INVALID_TOKEN_TYPE': 'Invalid token type',
        'TOKEN_INVALID': 'Invalid token format',
        'TOKEN_VERIFICATION_FAILED': 'Token verification failed'
      };
      
      return res.status(401).json({
        success: false,
        error: error || 'REFRESH_TOKEN_INVALID',
        message: errorMessages[error] || 'Invalid or expired refresh token'
      });
    }

    // 验证用户是否存在
    const user = await UserManager.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // 验证会话是否有效
    const isValidSession = await SessionManager.isValid(decoded.session_id, decoded.userId);
    if (!isValidSession) {
      return res.status(401).json({
        success: false,
        error: 'SESSION_INVALID',
        message: 'Session is no longer valid'
      });
    }

    // 将用户信息和会话信息添加到请求对象
    req.user = user.getPublicInfo();
    req.sessionId = decoded.session_id;
    req.refreshToken = refreshToken;

    next();
  } catch (error) {
    console.error('Refresh token authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: 'Internal authentication error'
    });
  }
}

/**
 * 可选的认证中间件（不强制要求token）
 */
async function optionalAuth(req, res, next) {
  try {
    const accessToken = req.cookies?.access_token;
    
    if (accessToken) {
      const { decoded } = verifyAccessToken(accessToken);
      if (decoded) {
        const user = await UserManager.findById(decoded.userId);
        if (user && await SessionManager.isValid(decoded.session_id, decoded.userId)) {
          req.user = user.getPublicInfo();
          req.sessionId = decoded.session_id;
          req.accessToken = accessToken;
          // 更新会话活跃时间（异步执行，不阻塞请求）
          SessionManager.updateActivity(decoded.session_id).catch(err => {
            console.error('Failed to update session activity:', err);
          });
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    // 可选认证失败不应该阻塞请求，继续执行
    next();
  }
}

/**
 * 角色校验中间件
 * @param {string|string[]} roles - 需要的角色（单个角色或角色数组）
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      });
    }

    // 支持单个角色或角色数组
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `One of the following roles required: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('Auth Error:', err);
  
  // JWT相关错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'TOKEN_INVALID',
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'TOKEN_EXPIRED',
      message: 'Token has expired'
    });
  }
  
  // 默认服务器错误
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error'
  });
}

module.exports = {
  authenticateToken,
  authenticateRefreshToken,
  optionalAuth,
  requireRole,
  errorHandler
};