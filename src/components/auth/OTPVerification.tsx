import React, { useState } from "react";
import api from "../../lib/api";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface OTPVerificationProps {
  otpId: string;
  email: string;
  onVerificationSuccess: (tokens: any) => void;
  onBackToLogin: () => void;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  otpId,
  email,
  onVerificationSuccess,
  onBackToLogin,
}) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Format OTP input to only show numbers
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    setError("");
  };

  // Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (otp.length !== 6) {
      setError("Please enter a 6-digit code");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/verify-otp", {
        otpId,
        code: otp,
      });

      if (response.data.accessToken) {
        // Store tokens
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        // Call success with user data
        onVerificationSuccess(response.data);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "OTP verification failed";
      setError(message);
      setAttemptCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setOtp("");
        }
        return newCount;
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError("");
    setLoading(true);
    setResendCooldown(60);

    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      await api.post("/auth/resend-otp", { otpId });
      setOtp("");
      setAttemptCount(0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Verify Your Identity
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              Enter the 6-digit code sent to {email}
            </p>
          </div>

          {/* OTP Input Form */}
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Valid for 10 minutes</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Attempt Counter */}
            {attemptCount > 0 && (
              <p className="text-sm text-amber-600">
                Attempts remaining: {3 - attemptCount}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || loading}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50"
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend OTP"}
            </Button>
          </div>

          {/* Back to Login */}
          <Button
            type="button"
            onClick={onBackToLogin}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            ← Back to Login
          </Button>

          {/* Security Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <p className="font-semibold mb-1">🛡️ Two-Factor Authentication</p>
            <p>
              Your account is protected with 2FA. This additional security step
              helps keep your account safe.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OTPVerification;
