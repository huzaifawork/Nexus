import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import api from '../lib/api';
import toast from 'react-hot-toast';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password, role });
      setUser(data);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
      toast.success('Successfully logged in!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      setUser(data);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
      toast.success('Account created successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Request failed';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await api.post(`/auth/reset-password/${token}`, { password: newPassword });
      toast.success('Password reset successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Reset failed';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  // Logout function
  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const { data } = await api.put(`/users/${userId}`, updates);
      setUser(data);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Update failed';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};