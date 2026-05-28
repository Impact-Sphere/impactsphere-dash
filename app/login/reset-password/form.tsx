"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/app/lib/auth-client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    try {
      e.preventDefault();
      setError("");
      setLoading(true);

      if (password != confirmPassword) {
        setError("Passwords don't match");
        setLoading(false);
        return;
      }

      const token = new URLSearchParams(window.location.search).get("token")!;
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        setError(error.message || "Something went wrong");
      } else {
        setIsPasswordReset(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    !isPasswordReset ?
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-on-surface"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-on-surface"
          >
            Confirm New Password
          </label>
          <input
            id="password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Setting new password..." : "Reset Password"}
        </button>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
            {error}
          </div>
        )}
      </form>
    :
      <p className="text-center">Password has been reset.</p>
  );
}
