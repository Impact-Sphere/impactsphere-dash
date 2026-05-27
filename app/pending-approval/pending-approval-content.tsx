"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

export function PendingApprovalContent() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [status, setStatus] = useState<ApprovalStatus>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setStatus(data.approvalStatus || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/login");
      return;
    }
    if (session) {
      fetchStatus();
    }
  }, [session, sessionPending, router, fetchStatus]);

  // Poll every 10 seconds so the user sees updates without refreshing
  useEffect(() => {
    if (!session || status === "APPROVED" || status === "REJECTED") return;
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [session, status, fetchStatus]);

  if (sessionPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-emerald-600">
              check_circle
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">
              Account Approved
            </h1>
            <p className="text-gray-500">
              Your account has been approved by our administrators. You can now
              create projects, donate, and access all features.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-red-600">
              cancel
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">
              Account Rejected
            </h1>
            <p className="text-gray-500">
              Your account application has been reviewed and unfortunately was
              not approved. If you believe this is a mistake, please contact
              support.
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-sm text-red-800">
            You can still browse public projects, but you cannot create projects
            or make donations until your account is approved.
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/discover")}
              className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Browse Projects
            </button>
            <button
              type="button"
              onClick={() => authClient.signOut()}
              className="flex-1 py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PENDING (default)
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
        <button
          type="button"
          onClick={() => router.push("/discover")}
          className="w-full py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Explore Projects
        </button>
      </div>
    </div>
  );
}
