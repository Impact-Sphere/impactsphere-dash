"use client";

import { useState } from "react";
import { authClient } from "@/app/lib/auth-client";

export default function RecoverForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await authClient.requestPasswordReset({
      email: email,
      redirectTo: "/login/reset-password",
    });

    if (error) {
      setError(error.message || "Failed to send request");
    } else {
      setEmailSent(true);
    }

    setLoading(false);
  };

  return !emailSent ? (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-on-surface">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Sending email..." : "Send Password Recovery Email"}
      </button>
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}
    </form>
  ) : (
    <p className="text-center">Check your email for further instructions.</p>
  );
}
