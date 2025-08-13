const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { externalApiClient } = require('../utils/externalApi');
const securityConfig = require('../config/security');

// 内存数据库 - 生产环境应使用真实数据库
const users = new Map();

class User {
  constructor(username, password, avatar = null, role = 'student') {
    this.userId = uuidv4();
    this.username = username;
    this.displayName = username; // 默认显示名为用户名
    this.passwordHash = bcrypt.hashSync(password, securityConfig.password.saltRounds);
    this.avatar = avatar || this.generateDefaultAvatar();
    this.role = role;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.externalToken = null; // 外部API的token
  }

  /**
   * 生成默认头像
   */
  generateDefaultAvatar() {
    // 简单的默认头像生成逻辑
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return {
      type: 'color',
      value: randomColor,
      initials: this.username.substring(0, 2).toUpperCase()
    };
  }

  /**
   * 验证密码
   */
  validatePassword(password) {
    return bcrypt.compareSync(password, this.passwordHash);
  }

  /**
   * 更新密码
   */
  updatePassword(newPassword) {
    this.passwordHash = bcrypt.hashSync(newPassword, securityConfig.password.saltRounds);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 更新头像
   */
  updateAvatar(avatar) {
    this.avatar = avatar;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 更新显示名
   */
  updateDisplayName(displayName) {
    this.displayName = displayName;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 获取用户公开信息
   */
  getPublicInfo() {
    return {
      userId: this.userId,
      username: this.username,
      displayName: this.displayName,
      avatar: this.avatar,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}

// 用户管理方法
class UserManager {
  /**
   * 创建新用户（优先使用外部API）
   */
  static async createUser(username, password, avatar = null, role = 'student') {
    // 检查用户名是否已存在
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    try {
      // 首先尝试在外部API创建用户
      const externalResult = await externalApiClient.createUser(username, password, { avatar, role });
      if (externalResult.success) {
        // 外部创建成功，创建本地用户记录
        const user = new User(username, password, avatar, role);
        user.userId = externalResult.user.userId; // 使用外部API的用户ID
        users.set(user.userId, user);
        console.log(`User created via external API: ${username} (${user.userId})`);
        return user;
      } else {
        // 外部API失败，检查是否是用户名冲突
        if (externalResult.error && externalResult.error.includes('already exists')) {
          throw new Error('Username already exists');
        }
        // 其他外部API错误，回退到本地创建
        console.warn('External API user creation failed, creating locally:', externalResult.error);
      }
    } catch (error) {
      // 如果是网络错误或其他异常，回退到本地创建
      if (error.message === 'Username already exists') {
        throw error; // 重新抛出用户名冲突错误
      }
      console.warn('External API user creation failed, creating locally:', error.message);
    }
    
    // 回退到本地创建
    const user = new User(username, password, avatar, role);
    users.set(user.userId, user);
    
    console.log(`User created locally: ${username} (${user.userId})`);
    return user;
  }

  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   * @returns {Promise<User|null>} 用户对象
   */
  static async findByUsername(username) {
    for (const user of users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  /**
   * 根据用户ID查找用户
   * @param {string} userId - 用户ID
   * @returns {Promise<User|null>} 用户对象
   */
  static async findById(userId) {
    return users.get(userId) || null;
  }

  /**
   * 验证用户登录（优先使用外部API）
   */
  static async validateLogin(username, password) {
    try {
      // 首先尝试外部API验证
      const externalUser = await externalApiClient.validateUserCredentials(username, password);
      if (externalUser) {
        // 如果外部验证成功，同步或创建本地用户
        let localUser = await this.findByUsername(username);
        if (!localUser) {
          // 创建本地用户记录
          localUser = new User(username, password, externalUser.avatar, externalUser.role);
          localUser.userId = externalUser.userId; // 使用外部API的用户ID
          localUser.externalToken = externalUser.externalToken;
          users.set(localUser.userId, localUser);
          console.log(`Local user created from external API: ${username}`);
        } else {
          // 更新本地用户信息
          localUser.avatar = externalUser.avatar;
          localUser.role = externalUser.role;
          localUser.externalToken = externalUser.externalToken;
          localUser.updatedAt = new Date().toISOString();
        }
        return localUser;
      }
    } catch (error) {
      console.warn('External API validation failed, falling back to local:', error.message);
    }

    // 回退到本地验证
    const user = await this.findByUsername(username);
    if (!user) {
      return null;
    }

    if (!user.validatePassword(password)) {
      return null;
    }

    return user;
  }

  /**
   * 更新用户密码
   * @param {string} userId - 用户ID
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async updatePassword(userId, newPassword) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        return false;
      }
      
      user.updatePassword(newPassword);
      
      // TODO: 同步到外部API
      // await externalApiClient.updateUserPassword(userId, newPassword);
      
      return true;
    } catch (error) {
      console.error('Failed to update password:', error);
      return false;
    }
  }
  
  /**
   * 更新用户头像
   * @param {string} userId - 用户ID
   * @param {object} avatar - 头像信息
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async updateAvatar(userId, avatar) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        return false;
      }
      
      user.updateAvatar(avatar);
      
      // TODO: 同步到外部API
      // await externalApiClient.updateUserAvatar(userId, avatar);
      
      return true;
    } catch (error) {
      console.error('Failed to update avatar:', error);
      return false;
    }
  }

  /**
   * 更新用户显示名
   * @param {string} userId - 用户ID
   * @param {string} displayName - 显示名
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async updateDisplayName(userId, displayName) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        return false;
      }
      
      user.updateDisplayName(displayName);
      
      // TODO: 同步到外部API
      // await externalApiClient.updateUserDisplayName(userId, displayName);
      
      return true;
    } catch (error) {
      console.error('Failed to update display name:', error);
      return false;
    }
  }

  /**
   * 获取所有用户（管理用途）
   */
  static getAllUsers() {
    return Array.from(users.values()).map(user => user.getPublicInfo());
  }
}

// 创建默认用户（仅在不存在时创建）
(async () => {
  try {
    const defaultUsers = [
      { username: 'alice', password: 'password123', role: 'teacher' },
      { username: 'bob', password: 'password123', role: 'student' },
      { username: 'charlie', password: 'password123', role: 'student' }
    ];
    
    for (const userData of defaultUsers) {
      const existingUser = await UserManager.findByUsername(userData.username);
      if (!existingUser) {
        await UserManager.createUser(userData.username, userData.password, null, userData.role);
        console.log(`Default user created: ${userData.username}`);
      }
    }
  } catch (error) {
    console.error('Error creating default users:', error.message);
  }
})();

module.exports = {
  User,
  UserManager
};