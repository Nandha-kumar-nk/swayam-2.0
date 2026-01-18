import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: true,
  isAuthenticated: false,
};

// Actions
const AUTH_ACTIONS = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAIL: 'AUTH_FAIL',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        loading: true,
      };
    case AUTH_ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        loading: false,
        isAuthenticated: true,
      };
    case AUTH_ACTIONS.AUTH_FAIL:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        loading: false,
        isAuthenticated: false,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        loading: false,
        isAuthenticated: false,
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set token in API headers
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
      if (state.refreshToken) {
        localStorage.setItem('refreshToken', state.refreshToken);
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }, [state.token, state.refreshToken]);

  // Load user from token
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch({ type: AUTH_ACTIONS.AUTH_FAIL });
      return;
    }

    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await api.get('/auth/me');

      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: {
          user: res.data.data,
          token: token,
          refreshToken: localStorage.getItem('refreshToken'),
        },
      });
    } catch (error) {
      console.error('Load user failed:', error);
      // Try to refresh token
      await refreshAccessToken();
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      dispatch({ type: AUTH_ACTIONS.AUTH_FAIL });
      return;
    }

    try {
      const res = await api.post('/auth/refresh', { refreshToken });
      const newToken = res.data.data.token;

      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      localStorage.setItem('token', newToken);

      // Load user with new token
      await loadUser();
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: AUTH_ACTIONS.AUTH_FAIL });
    }
  }, [loadUser]);

  // Register user
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.AUTH_START });
    
    try {
      const res = await api.post('/auth/register', userData);
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: {
          user: res.data.data.user,
          token: res.data.data.token,
          refreshToken: res.data.data.refreshToken,
        },
      });

      toast.success('Registration successful! Welcome to SWAYAM 2.0');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.AUTH_FAIL });
      toast.error(message);
      return { success: false, message };
    }
  };

  // Login user
  const login = async (credentials) => {
    console.log('Login attempt with credentials:', credentials);
    dispatch({ type: AUTH_ACTIONS.AUTH_START });
    
    try {
      const res = await api.post('/auth/login', credentials, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('Login response:', res.data);
      
      if (!res.data || !res.data.data) {
        throw new Error('Invalid response format from server');
      }
      
      const { user, token, refreshToken } = res.data.data;
      
      if (!user || !token) {
        throw new Error('Missing user data in response');
      }
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: { user, token, refreshToken },
      });

      toast.success(`Welcome back, ${user.name || 'User'}!`);
      return { success: true };
    } catch (error) {
      console.error('Login error details:', {
        error,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      let message = 'Login failed';
      
      if (error.response) {
        // Server responded with an error status code
        message = error.response.data?.message || 
                 error.response.statusText || 
                 `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        message = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request
        message = error.message || 'Error setting up login request';
      }
      
      dispatch({ type: AUTH_ACTIONS.AUTH_FAIL });
      toast.error(message);
      return { 
        success: false, 
        message,
        status: error.response?.status
      };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const res = await api.put('/auth/profile', userData);
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: res.data.data,
      });

      toast.success('Profile updated successfully');
      return { success: true, user: res.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await api.put('/auth/change-password', passwordData);
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    ...state,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    loadUser,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;