"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";

export default function ResetPasswordForm() {
  const _router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [token, setToken] = useState("DUMMY_TOKEN"); // make password form appear by default and only disappear if token invalid
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
    if (!token)
      setTokenError(
        new URLSearchParams(window.location.search).get("error") || "",
      );
  });

  const handleSubmit = async (e: React.SubmitEvent) => {
    try {
      e.preventDefault();
      setError("");
      setLoading(true);

      if (password !== confirmPassword) {
        setError("Passwords don't match");
        setLoading(false);
        return;
      }

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

  return token ? (
    !isPasswordReset ? (
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
    ) : (
      <div className="text-center">
        <p>Password has been reset.</p>
        <Link href="/login" className="font-bold underline">
          Go to login page
        </Link>
      </div>
    )
  ) : (
    <p className="text-center">
      Error:{" "}
      {tokenError === "INVALID_TOKEN"
        ? "Token is invalid or expired."
        : "Something went wrong."}{" "}
      Try generating a new password reset token/URL.
    </p>
  );
}
