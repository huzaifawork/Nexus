import React, { createContext, useState, useContext, useEffect } from "react";
import { User, UserRole, AuthContextType } from "../types";
import api from "../lib/api";
import toast from "react-hot-toast";

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = "business_nexus_user";
const ACCESS_TOKEN_KEY = "business_nexus_access_token";
const REFRESH_TOKEN_KEY = "business_nexus_refresh_token";

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpData, setOtpData] = useState<any>(null);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
      // Set default auth header
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    }
    setIsLoading(false);
  }, []);

  // Set up axios interceptor to handle token refresh
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          if (refreshToken) {
            try {
              const { data } = await api.post("/auth/refresh-token", {
                refreshToken,
              });
              localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
              localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
              api.defaults.headers.common["Authorization"] =
                `Bearer ${data.accessToken}`;
              originalRequest.headers["Authorization"] =
                `Bearer ${data.accessToken}`;
              return api(originalRequest);
            } catch (refreshError) {
              // Refresh failed, logout user
              logout();
              return Promise.reject(refreshError);
            }
          }
        }
        return Promise.reject(error);
      },
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const login = async (
    email: string,
    password: string,
    role: UserRole,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password, role });

      if (data.requiresOTPVerification) {
        // 2FA required
        setOtpRequired(true);
        setOtpData({
          otpId: data.otpId,
          email: data.email,
          userId: data._id,
        });
        toast.success("OTP sent to your email. Please verify to continue.");
      } else {
        // Direct login (if 2FA disabled)
        setUser(data);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        api.defaults.headers.common["Authorization"] =
          `Bearer ${data.accessToken}`;
        toast.success("Successfully logged in!");
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Login failed";
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (otpId: string, code: string): Promise<User> => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { otpId, code });
      setUser(data);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      api.defaults.headers.common["Authorization"] =
        `Bearer ${data.accessToken}`;
      setOtpRequired(false);
      setOtpData(null);
      toast.success("Login successful!");
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || "OTP verification failed";
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async (otpId: string): Promise<void> => {
    try {
      await api.post("/auth/resend-otp", { otpId });
      toast.success("New OTP sent to your email");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to resend OTP";
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: UserRole,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        confirmPassword,
        role,
      });
      setUser(data);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      api.defaults.headers.common["Authorization"] =
        `Bearer ${data.accessToken}`;
      toast.success("Account created successfully!");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Registration failed";
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("Password reset instructions sent to your email");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Request failed";
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const resetPassword = async (
    token: string,
    newPassword: string,
  ): Promise<void> => {
    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: newPassword,
      });
      toast.success("Password reset successfully");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Reset failed";
      toast.error(msg);
      throw new Error(msg);
    }
  };

  // Logout function
  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    delete api.defaults.headers.common["Authorization"];
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    toast.success("Logged out successfully");
  };

  const updateProfile = async (
    userId: string,
    updates: Partial<User>,
  ): Promise<void> => {
    try {
      const { data } = await api.put(`/users/${userId}`, updates);
      setUser(data);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
      toast.success("Profile updated successfully");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Update failed";
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
    verifyOTP,
    resendOTP,
    otpRequired,
    otpData,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
