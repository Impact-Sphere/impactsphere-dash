import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Register | ImpactSphere",
  description: "Create your ImpactSphere account",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-on-surface">
            Create an account
          </h1>
          <p className="text-sm text-gray-500">Get started with ImpactSphere</p>
        </div>
        <RegisterForm />
        <div className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
