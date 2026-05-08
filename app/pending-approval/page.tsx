import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pending Approval | ImpactSphere",
  description: "Your account is pending approval",
};

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg text-center">
        <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-amber-600">
            hourglass_empty
          </span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-on-surface">
            Pending Approval
          </h1>
          <p className="text-gray-500">
            Your account is currently under review by our administrators. You
            will be notified once your account has been approved.
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">
          While waiting, you can explore public projects on the discovery page.
          Project creation and donations will be available after approval.
        </div>
      </div>
    </div>
  );
}
