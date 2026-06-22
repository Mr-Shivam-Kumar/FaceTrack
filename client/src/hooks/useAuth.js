import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * useAuth - Hook to access authentication state and methods
 * @returns {{ user, token, loading, isAuthenticated, login, logout, register, updateUser }}
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
