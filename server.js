require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// 导入路由和中间件
const oauthRoutes = require('./routes/oauth');
const { errorHandler } = require('./middleware/auth');
const securityConfig = require('./config/security');

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // 允许发送cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Requested-With'],
  // Set-Cookie不需要在exposedHeaders中，由浏览器自动处理
}));

// 基础中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// 速率限制
const limiter = rateLimit({
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.max,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: securityConfig.rateLimit.message
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录接口特殊速率限制
const loginLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.windowMs,
  max: 5, // 每个IP最多5次登录尝试
  message: {
    success: false,
    error: 'LOGIN_RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts, please try again later'
  },
  skipSuccessfulRequests: true,
});

// 应用速率限制（注意顺序：先应用特定路由限制，再应用全局限制）
app.use('/oauth/token', loginLimiter);
app.use(limiter);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// API信息端点
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Violet Auth API',
      version: '1.0.0',
      description: 'Multi-account authentication system',
      endpoints: {
        oauth: {
          login: 'POST /oauth/token',
          userinfo: 'GET /oauth/userinfo',
          refresh: 'POST /oauth/refresh',
          logout: 'POST /oauth/logout',
          accounts: 'GET /oauth/accounts'
        }
      },
      features: [
        'JWT-based authentication',
        'Session management with UUID',
        'HttpOnly cookie storage',
        'Token blacklisting',
        'Multi-account support',
        'Rate limiting',
        'CORS support'
      ]
    }
  });
});

// 挂载OAuth路由
app.use('/oauth', oauthRoutes);

// 404处理（处理所有HTTP方法）
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// 错误处理中间件
app.use(errorHandler);

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log('\n🚀 Violet Auth Server Started!');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('\n📋 Available endpoints:');
  console.log('   GET  /health           - Health check');
  console.log('   GET  /api/info         - API information');
  console.log('   POST /oauth/token      - User login');
  console.log('   GET  /oauth/userinfo   - Get user info');
  console.log('   POST /oauth/refresh    - Refresh tokens');
  console.log('   POST /oauth/logout     - User logout');
  console.log('   GET  /oauth/accounts   - Get user accounts');
  console.log('\n✅ Ready to accept requests!\n');
});

module.exports = app;