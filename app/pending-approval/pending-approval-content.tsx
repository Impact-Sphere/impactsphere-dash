"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";

interface VerificationMeeting {
  id: string;
  status: string;
  notes: string | null;
  proposedTimes: { id: string; start: string; end: string }[];
  selectedTime: string | null;
}

type ApprovalStatus =
  | "PENDING"
  | "MORE_INFO_REQUESTED"
  | "MEETING_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | null;

export function PendingApprovalContent() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [status, setStatus] = useState<ApprovalStatus>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [verificationMeeting, setVerificationMeeting] =
    useState<VerificationMeeting | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setStatus(data.approvalStatus || null);
        setAdminNotes(data.adminNotes || "");
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchVerificationMeeting = useCallback(async () => {
    try {
      const res = await fetch("/api/verification-meetings");
      if (res.ok) {
        const meetings = await res.json();
        if (meetings.length > 0) {
          setVerificationMeeting(meetings[0]);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/login");
      return;
    }
    if (session) {
      fetchStatus().then(() => setLoading(false));
    }
  }, [session, sessionPending, router, fetchStatus]);

  // Fetch verification meeting when status is MEETING_REQUESTED
  useEffect(() => {
    if (status === "MEETING_REQUESTED") {
      fetchVerificationMeeting();
    }
  }, [status, fetchVerificationMeeting]);

  // Poll every 10 seconds so the user sees updates without refreshing
  useEffect(() => {
    if (!session || status === "APPROVED") return;
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [session, status, fetchStatus]);

  const handleScheduleMeeting = async () => {
    if (!verificationMeeting || !selectedSlot) return;
    setScheduling(true);
    const res = await fetch(`/api/verification-meetings/${verificationMeeting.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedTime: selectedSlot }),
    });
    setScheduling(false);
    if (res.ok) {
      const data = await res.json();
      setVerificationMeeting(data);
    }
  };

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
              not approved.
            </p>
          </div>

          {adminNotes && (
            <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800 text-left">
              <p className="font-semibold">Admin feedback:</p>
              <p className="mt-1 whitespace-pre-wrap">{adminNotes}</p>
            </div>
          )}

          <div className="bg-red-50 rounded-xl p-4 text-sm text-red-800">
            You can update your information and resubmit your application for
            another review.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/resubmit")}
              className="flex-1 py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Resubmit Application
            </button>
            <button
              type="button"
              onClick={() => authClient.signOut()}
              className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "MORE_INFO_REQUESTED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-amber-600">
              info
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">
              More Information Needed
            </h1>
            <p className="text-gray-500">
              Our administrators need additional information or documents to
              verify your account.
            </p>
          </div>

          {adminNotes && (
            <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800 text-left">
              <p className="font-semibold">What we need:</p>
              <p className="mt-1 whitespace-pre-wrap">{adminNotes}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => router.push("/resubmit")}
              className="w-full py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Update & Resubmit
            </button>
            <button
              type="button"
              onClick={() => router.push("/discover")}
              className="w-full py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Explore Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "MEETING_REQUESTED") {
    const isScheduled = verificationMeeting?.status === "SCHEDULED";

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 mx-auto bg-violet-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-violet-600">
              event
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">
              Verification Meeting Requested
            </h1>
            <p className="text-gray-500">
              Our administrators would like to schedule a verification meeting
              with you before finalizing your account approval.
            </p>
          </div>

          {adminNotes && (
            <div className="bg-violet-50 rounded-xl p-4 text-sm text-violet-800 text-left">
              <p className="font-semibold">Meeting details:</p>
              <p className="mt-1 whitespace-pre-wrap">{adminNotes}</p>
            </div>
          )}

          {isScheduled && verificationMeeting?.selectedTime ? (
            <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-800">
              <p className="font-semibold">Meeting scheduled!</p>
              <p className="mt-1">
                {new Date(verificationMeeting.selectedTime).toLocaleString(
                  undefined,
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </p>
              <p className="mt-2 text-emerald-700">
                We will contact you with the meeting link and further
                instructions.
              </p>
            </div>
          ) : (
            <>
              {verificationMeeting && verificationMeeting.proposedTimes.length > 0 && (
                <div className="space-y-3 text-left">
                  <p className="text-sm font-medium text-on-surface text-center">
                    Select a time slot that works for you:
                  </p>
                  <div className="space-y-2">
                    {verificationMeeting.proposedTimes.map((slot) => {
                      const start = new Date(slot.start);
                      const end = new Date(slot.end);
                      const isSelected = selectedSlot === slot.start;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot.start)}
                          className={`w-full p-3 rounded-xl border text-left text-sm transition-colors ${
                            isSelected
                              ? "border-violet-500 bg-violet-50 text-violet-800"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="font-medium">
                            {start.toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-gray-500">
                            {start.toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            —{" "}
                            {end.toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={handleScheduleMeeting}
                    disabled={!selectedSlot || scheduling}
                    className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {scheduling ? "Confirming..." : "Confirm Time Slot"}
                  </button>
                </div>
              )}

              {!verificationMeeting && (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                  Loading meeting options...
                </div>
              )}
            </>
          )}

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
