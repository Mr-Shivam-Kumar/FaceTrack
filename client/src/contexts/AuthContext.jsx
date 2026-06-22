import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api from '../services/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthContext = createContext(null);

/**
 * AuthProvider - Manages authentication state across the app
 * Handles login, logout, register, and token validation
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user || data.data || data);
        setToken(storedToken);
      } catch (err) {
        console.error('Token validation failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const responseToken = data.token || data.data?.token;
      const responseUser = data.user || data.data?.user || data.data;
      localStorage.setItem('token', responseToken);
      localStorage.setItem('user', JSON.stringify(responseUser));
      setToken(responseToken);
      setUser(responseUser);
      return { success: true, user: responseUser };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      const responseToken = data.token || data.data?.token;
      const responseUser = data.user || data.data?.user || data.data;
      if (responseToken) {
        localStorage.setItem('token', responseToken);
        localStorage.setItem('user', JSON.stringify(responseUser));
        setToken(responseToken);
        setUser(responseUser);
      }
      return { success: true, user: responseUser };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
        register,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
