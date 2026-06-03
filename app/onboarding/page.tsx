import type { Metadata } from "next";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Welcome | ImpactSphere",
  description: "Choose your account type",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-start justify-center bg-surface py-12">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-on-surface">
            Welcome to ImpactSphere!
          </h1>
          <p className="text-gray-500">
            Tell us a bit about yourself so we can tailor your experience.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
