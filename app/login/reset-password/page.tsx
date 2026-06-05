import type { Metadata } from "next";
import ResetPasswordForm from "./form";

export const metadata: Metadata = {
  title: "Reset Password | ImpactSphere",
  description: "Reset Account Password",
};

export default function ResetPassword() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen flex items-center justify-center bg-surface px-4 py-6 sm:px-6 sm:py-8">
      <div className="w-full max-w-md p-5 sm:p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-on-surface">Reset Password</h1>
          <p className="text-sm text-gray-500">Set new account password</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
