/**
 * 安全配置
 */

module.exports = {
  // Cookie 安全配置
  cookie: {
    httpOnly: true,        // 防止XSS攻击
    secure: process.env.NODE_ENV === 'production', // 生产环境使用HTTPS
    sameSite: 'strict',    // 防止CSRF攻击
    maxAge: {
      accessToken: 15 * 60 * 1000,      // 15分钟
      refreshToken: 7 * 24 * 60 * 60 * 1000  // 7天
    }
  },
  
  // JWT 配置
  jwt: {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d'
  },
  
  // 会话配置
  session: {
    defaultExpiry: 24 * 60 * 60 * 1000,  // 24小时
    cleanupInterval: 60 * 60 * 1000      // 1小时清理一次
  },
  
  // 密码安全配置
  password: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    minLength: 8,
    requireSpecialChars: false
  },
  
  // 速率限制配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 1000, // 每个IP最多1000次请求（开发环境临时增加）
    message: 'Too many requests from this IP'
  }
};