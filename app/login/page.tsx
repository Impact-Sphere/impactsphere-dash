import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login | ImpactSphere",
  description: "Sign in to your ImpactSphere account",
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] lg:min-h-dvh flex items-center justify-center bg-surface px-4 py-6 sm:px-6 sm:py-8">
      <div className="w-full max-w-md p-5 sm:p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-on-surface">Welcome back</h1>
          <p className="text-sm text-gray-500">
            Sign in to your ImpactSphere account
          </p>
        </div>
        <LoginForm />
        <div className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </div>
        <div className="text-center text-sm text-gray-500">
          Lost your password?{" "}
          <Link
            href="/login/recover"
            className="font-medium text-primary hover:underline"
          >
            Recover
          </Link>
        </div>
      </div>
    </div>
  );
}
