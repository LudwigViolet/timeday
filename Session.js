const { v4: uuidv4 } = require('uuid');
const securityConfig = require('../config/security');

// 内存存储sessions（生产环境建议使用Redis）
const sessions = new Map();

class SessionManager {
  /**
   * 创建新会话
   * @param {string} userId - 用户ID
   * @param {object} deviceInfo - 设备信息
   * @returns {string} sessionId
   */
  static create(userId, deviceInfo = {}) {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + securityConfig.session.defaultExpiry);
    
    const sessionData = {
      userId,
      deviceInfo,
      createdAt: new Date(),
      expiresAt,
      lastAccessAt: new Date()
    };
    
    sessions.set(sessionId, sessionData);
    console.log(`Session created for user ${userId}: ${sessionId}`);
    
    return sessionId;
  }
  
  /**
   * 获取会话信息
   * @param {string} sessionId - 会话ID
   * @returns {Promise<object|null>} 会话数据
   */
  static async get(sessionId) {
    const session = sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // 检查是否过期
    if (new Date() > session.expiresAt) {
      sessions.delete(sessionId);
      console.log(`Expired session removed: ${sessionId}`);
      return null;
    }
    
    return session;
  }
  
  /**
   * 验证会话是否有效
   * @param {string} sessionId - 会话ID
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>} 是否有效
   */
  static async isValid(sessionId, userId) {
    const session = await this.get(sessionId);
    return session && session.userId === userId;
  }

  /**
   * 更新会话活跃时间
   * @param {string} sessionId - 会话ID
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async updateActivity(sessionId) {
    const session = sessions.get(sessionId);
    
    if (!session) {
      return false;
    }
    
    // 检查是否过期
    if (new Date() > session.expiresAt) {
      sessions.delete(sessionId);
      console.log(`Expired session removed during activity update: ${sessionId}`);
      return false;
    }
    
    // 更新最后访问时间
    session.lastAccessAt = new Date();
    sessions.set(sessionId, session);
    
    return true;
  }
  
  /**
   * 删除指定会话
   * @param {string} sessionId - 会话ID
   * @returns {boolean} 是否删除成功
   */
  static remove(sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
      sessions.delete(sessionId);
      console.log(`Session removed for user ${session.userId}: ${sessionId}`);
      return true;
    }
    return false;
  }
  
  /**
   * 删除用户的所有会话
   * @param {string} userId - 用户ID
   * @returns {number} 删除的会话数量
   */
  static removeAllForUser(userId) {
    let count = 0;
    for (const [sessionId, session] of sessions.entries()) {
      if (session.userId === userId) {
        sessions.delete(sessionId);
        console.log(`Session removed for user ${userId}: ${sessionId}`);
        count++;
      }
    }
    return count;
  }
  
  /**
   * 获取用户的所有活跃会话
   * @param {string} userId - 用户ID
   * @returns {Array} 会话列表
   */
  static getUserSessions(userId) {
    const userSessions = [];
    for (const [sessionId, session] of sessions.entries()) {
      if (session.userId === userId && new Date() <= session.expiresAt) {
        userSessions.push({
          sessionId,
          deviceInfo: session.deviceInfo,
          createdAt: session.createdAt,
          lastAccessAt: session.lastAccessAt
        });
      }
    }
    return userSessions;
  }
  
  /**
   * 清理过期会话
   * @returns {number} 清理的会话数量
   */
  static cleanupExpired() {
    let count = 0;
    const now = new Date();
    
    for (const [sessionId, session] of sessions.entries()) {
      if (now > session.expiresAt) {
        sessions.delete(sessionId);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`Cleaned up ${count} expired sessions`);
    }
    
    return count;
  }
  
  /**
   * 获取统计信息
   * @returns {object} 统计数据
   */
  static getStats() {
    const now = new Date();
    let activeCount = 0;
    let expiredCount = 0;
    
    for (const session of sessions.values()) {
      if (now <= session.expiresAt) {
        activeCount++;
      } else {
        expiredCount++;
      }
    }
    
    return {
      total: sessions.size,
      active: activeCount,
      expired: expiredCount
    };
  }
}

// 定期清理过期会话
setInterval(() => {
  SessionManager.cleanupExpired();
}, securityConfig.session.cleanupInterval);

module.exports = SessionManager;