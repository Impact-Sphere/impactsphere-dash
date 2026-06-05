import type { Metadata } from "next";
import { OnboardingForm } from "../onboarding/onboarding-form";

export const metadata: Metadata = {
  title: "Resubmit Application | ImpactSphere",
  description: "Update and resubmit your application",
};

export default function ResubmitPage() {
  return (
    <div className="min-h-screen flex items-start justify-center bg-surface py-12">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-on-surface">
            Resubmit Application
          </h1>
          <p className="text-gray-500">
            Review and update your organization information based on the admin
            feedback below.
          </p>
        </div>
        <OnboardingForm mode="resubmit" />
      </div>
    </div>
  );
}
