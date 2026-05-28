import type { Metadata } from "next";
import RecoverForm from "./form";

export const metadata: Metadata = {
  title: "Recover Password | ImpactSphere",
  description: "Sign in to your ImpactSphere account",
};

export default function RecoverPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-on-surface">Password Recovery</h1>
          <p className="text-sm text-gray-500">
            Gain access back to your account
          </p>
        </div>
        <RecoverForm/>
      </div>
    </div>
  );
}
