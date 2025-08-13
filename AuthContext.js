import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI, apiUtils } from '../services/api';

/**
 * 认证状态管理
 */
const AuthContext = createContext();

// 认证状态的初始值
const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  sessionId: null,
  error: null,
  accounts: [],
  sessions: []
};

// 认证状态的action类型
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_ACCOUNTS: 'SET_ACCOUNTS',
  SET_SESSIONS: 'SET_SESSIONS',
  UPDATE_USER: 'UPDATE_USER'
};

// 认证状态的reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        sessionId: action.payload.sessionId,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        sessionId: null,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        sessionId: null,
        error: null,
        sessions: []
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.SET_ACCOUNTS:
      return {
        ...state,
        accounts: action.payload
      };
    
    case AUTH_ACTIONS.SET_SESSIONS:
      return {
        ...state,
        sessions: action.payload
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };
    
    default:
      return state;
  }
}

/**
 * 认证提供者组件
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 清除错误
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // 设置加载状态
  const setLoading = (loading) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: loading });
  };

  // 登录函数
  const login = async (username, password, deviceInfo = {}) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await authAPI.login(username, password, deviceInfo);
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.user,
            sessionId: response.data.session_id
          }
        });
        
        // 登录成功后获取账户列表
        await loadAccounts();
        
        return { success: true, user: response.data.user };
      } else {
        const error = response.error || 'Login failed';
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: error
        });
        return { success: false, error };
      }
    } catch (error) {
      console.error('Login error:', error);
      const formattedError = apiUtils.formatError(error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: formattedError
      });
      return { success: false, error: formattedError };
    }
  };

  // 注册函数
  const register = async (userData) => {
    // 防止重复提交
    if (state.isLoading) {
      console.log('Registration already in progress, ignoring duplicate request');
      return { success: false, error: 'REGISTRATION_IN_PROGRESS' };
    }
    
    try {
      setLoading(true);
      clearError();
      
      const response = await authAPI.register(userData);
      
      // 检查注册是否成功
      if (response.success) {
        // 注册成功，后端已自动登录并返回token
        const user = response.data.user;
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user,
            sessionId: response.data.session_id,
            isAuthenticated: true
          }
        });
        
        // 加载用户账户信息
        await loadAccounts();
        
        return { success: true, user };
      } else {
        // 注册失败，返回错误信息
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: response.error
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // 处理特定的注册错误
      if (error && error.error) {
        const errorType = error.error;
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: errorType
        });
        return { success: false, error: errorType };
      }
      
      // 处理其他错误
      const formattedError = apiUtils.formatError(error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: formattedError
      });
      return { success: false, error: formattedError };
    } finally {
      setLoading(false);
    }
  };

  // 登出函数
  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // 即使登出API失败，也要清除本地状态
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // 刷新token
  const refreshAuth = async () => {
    try {
      const response = await authAPI.refreshToken();
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.user,
            sessionId: response.data.session_id
          }
        });
        
        // 刷新token成功后重新加载账户列表
        await loadAccounts();
        
        return true;
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return false;
    }
  };

  // 检查认证状态
  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // 先检查是否有基本的认证信息（如 cookie）
      // 如果没有任何认证信息，直接设置为未登录状态
      const hasCookies = document.cookie.includes('access_token') || document.cookie.includes('refresh_token');
      if (!hasCookies) {
        console.log('No authentication cookies found, skipping auth check');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        setLoading(false);
        return false;
      }
      
      const response = await authAPI.getUserInfo();
      
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.SET_USER,
          payload: response.data.user
        });
        
        // 获取账户列表
        await loadAccounts();
        
        return true;
      } else {
        // token无效或缺失时强制logout，防止显示占位用户
        console.log('Auth check failed, forcing logout:', response.error);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      
      // 对于401错误，直接logout，不尝试刷新
      if (error.status === 401 || error.error === 'ACCESS_TOKEN_MISSING') {
        console.log('401 error detected, forcing logout');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return false;
      }
      
      // 如果是其他认证错误，尝试刷新token
      if (apiUtils.isAuthError(error)) {
        const refreshed = await refreshAuth();
        if (refreshed) {
          await loadAccounts();
          return true;
        }
      }
      
      // 所有情况下最终都要logout，防止显示占位用户
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return false;
    }
  };

  // 加载账户列表
  const loadAccounts = async () => {
    try {
      const response = await authAPI.getAccounts();
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.SET_ACCOUNTS,
          payload: response.data.accounts || []
        });
      }
    } catch (error) {
      console.error('Load accounts error:', error);
      // 不影响主要流程，只是记录错误
    }
  };

  // 加载会话列表
  const loadSessions = async () => {
    try {
      const response = await authAPI.getSessions();
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.SET_SESSIONS,
          payload: response.sessions || []
        });
      }
    } catch (error) {
      console.error('Load sessions error:', error);
    }
  };

  // 删除会话
  const deleteSession = async (sessionId) => {
    try {
      const response = await authAPI.deleteSession(sessionId);
      if (response.success) {
        // 重新加载会话列表
        await loadSessions();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete session error:', error);
      return false;
    }
  };

  // 更新用户信息
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
  };

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 提供给子组件的值
  const value = {
    // 状态
    ...state,
    
    // 方法
    login,
    register,
    logout,
    refreshAuth,
    checkAuth,
    loadAccounts,
    loadSessions,
    deleteSession,
    updateUser,
    clearError,
    setLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 使用认证上下文的Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;