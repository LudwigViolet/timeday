const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const securityConfig = require('../config/security');

// Token黑名单 - 生产环境应使用Redis
const tokenBlacklist = new Set();
// 按sessionId索引token的映射表
const sessionTokens = new Map();

/**
 * 生成Access Token
 * @param {Object} payload - 用户信息
 * @param {string} sessionId - 会话ID
 * @returns {string} JWT token
 */
function generateAccessToken(payload, sessionId) {
  try {
    const tokenPayload = {
      ...payload,
      session_id: sessionId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_ACCESS_SECRET,
      { 
        expiresIn: securityConfig.jwt.accessTokenExpiry,
        issuer: 'violet-auth',
        audience: 'violet-app'
      }
    );
    
    // 记录token到session映射
    if (!sessionTokens.has(sessionId)) {
      sessionTokens.set(sessionId, new Set());
    }
    sessionTokens.get(sessionId).add(token);
    
    return token;
  } catch (error) {
    console.error('Failed to generate access token:', error);
    throw new Error('Token generation failed');
  }
}

/**
 * 生成Refresh Token
 * @param {Object} payload - 用户信息
 * @param {string} sessionId - 会话ID
 * @returns {string} JWT token
 */
function generateRefreshToken(payload, sessionId) {
  try {
    const tokenPayload = {
      userId: payload.userId,
      username: payload.username,
      session_id: sessionId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET,
      { 
        expiresIn: securityConfig.jwt.refreshTokenExpiry,
        issuer: 'violet-auth',
        audience: 'violet-app'
      }
    );
    
    // 记录token到session映射
    if (!sessionTokens.has(sessionId)) {
      sessionTokens.set(sessionId, new Set());
    }
    sessionTokens.get(sessionId).add(token);
    
    return token;
  } catch (error) {
    console.error('Failed to generate refresh token:', error);
    throw new Error('Token generation failed');
  }
}

/**
 * 生成新的会话ID
 * @returns {string} UUID v4
 */
function generateSessionId() {
  return uuidv4();
}

/**
 * 验证Access Token
 * @param {string} token - JWT token
 * @returns {Object} 包含decoded payload和error信息的对象
 */
function verifyAccessToken(token) {
  try {
    // 检查黑名单
    if (tokenBlacklist.has(token)) {
      return { decoded: null, error: 'TOKEN_BLACKLISTED' };
    }
    
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      issuer: 'violet-auth',
      audience: 'violet-app'
    });
    
    // 验证token类型
    if (decoded.type !== 'access') {
      return { decoded: null, error: 'INVALID_TOKEN_TYPE' };
    }
    
    return { decoded, error: null };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { decoded: null, error: 'TOKEN_EXPIRED' };
    } else if (error.name === 'JsonWebTokenError') {
      return { decoded: null, error: 'TOKEN_INVALID' };
    } else {
      return { decoded: null, error: 'TOKEN_VERIFICATION_FAILED' };
    }
  }
}

/**
 * 验证Refresh Token
 * @param {string} token - JWT token
 * @returns {Object} 包含decoded payload和error信息的对象
 */
function verifyRefreshToken(token) {
  try {
    // 检查黑名单
    if (tokenBlacklist.has(token)) {
      return { decoded: null, error: 'TOKEN_BLACKLISTED' };
    }
    
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'violet-auth',
      audience: 'violet-app'
    });
    
    // 验证token类型
    if (decoded.type !== 'refresh') {
      return { decoded: null, error: 'INVALID_TOKEN_TYPE' };
    }
    
    return { decoded, error: null };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { decoded: null, error: 'TOKEN_EXPIRED' };
    } else if (error.name === 'JsonWebTokenError') {
      return { decoded: null, error: 'TOKEN_INVALID' };
    } else {
      return { decoded: null, error: 'TOKEN_VERIFICATION_FAILED' };
    }
  }
}

/**
 * 将token加入黑名单
 * @param {string} token - 要失效的token
 * @param {string} sessionId - 会话ID
 */
function blacklistToken(token, sessionId) {
  tokenBlacklist.add(token);
  
  // 维护sessionId到token的映射
  if (!sessionTokens.has(sessionId)) {
    sessionTokens.set(sessionId, new Set());
  }
  sessionTokens.get(sessionId).add(token);
  
  // 记录黑名单信息（用于调试和监控）
  console.log(`Token blacklisted for session: ${sessionId}`);
  
  // 生产环境中应该设置过期时间清理黑名单
  // 这里简化处理，实际应使用Redis的TTL功能
}

/**
 * 根据session_id失效所有相关token
 * @param {string} sessionId - 会话ID
 */
function blacklistSessionTokens(sessionId) {
  // 获取该session的所有token
  const tokens = sessionTokens.get(sessionId);
  
  if (tokens) {
    // 将所有token加入黑名单
    tokens.forEach(token => {
      tokenBlacklist.add(token);
    });
    
    // 清理session映射
    sessionTokens.delete(sessionId);
    
    console.log(`${tokens.size} tokens blacklisted for session: ${sessionId}`);
  } else {
    console.log(`No tokens found for session: ${sessionId}`);
  }
}

/**
 * 清理过期的黑名单token
 * 生产环境中应该定期调用此函数或使用Redis TTL
 */
function cleanupBlacklist() {
  // 简化实现：清空所有黑名单
  // 生产环境中应该只清理过期的token
  tokenBlacklist.clear();
  sessionTokens.clear();
  console.log('Token blacklist and session mappings cleaned up');
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateSessionId,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  blacklistSessionTokens,
  cleanupBlacklist
};