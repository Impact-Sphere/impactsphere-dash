"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { useCurrency } from "@/app/components/currency/currency-context";
import { authClient } from "@/app/lib/auth-client";
import {
  createDefaultSlot,
  getEndMinTimeForDate,
  getMinEndDate,
  getNextHalfHourStart,
  getSlotValidation,
  getStartMinTimeForDate,
  mergeContiguousSlots,
} from "@/app/lib/meetings-utils";
import type { TimeSlot } from "@/app/types/meeting";
import "react-datepicker/dist/react-datepicker.css";

type UploadedFile = {
  id: string;
  url: string;
  fileName: string;
  mimeType?: string;
  size?: number;
};

interface PendingUser {
  id: string;
  name: string | null;
  email: string;
  userType: string;
  approvalStatus: string;
  adminNotes: string | null;
  createdAt: string;
  ngoInfo?: {
    ngoName: string;
    country?: string | null;
    cityRegion?: string | null;
    ngoType?: string | null;
    yearFounded?: number | null;
    missionStatement?: string | null;
    activitiesDescription?: string | null;
    currentOrPastProjects?: string | null;
    contactEmail?: string | null;
    phoneNumber?: string | null;
    website?: string | null;
    registrationNumber?: string | null;
    registrationDocuments?: UploadedFile[];
    representativeFullName?: string | null;
    representativeRole?: string | null;
    representativeIdType?: string | null;
    representativeIdNumber?: string | null;
    representativeIdDocumentUrl?: string | null;
    activityProofUrls?: UploadedFile[];
    activityProofLink?: string | null;
    declarationConfirmed?: boolean;
    taxIdentificationNumber?: string | null;
    contactInfo?: string | null;
    mainGoals?: string | null;
    challenges?: string | null;
  } | null;
  companyInfo?: {
    companyName: string;
    country?: string | null;
    industryType?: string | null;
    businessDescription?: string | null;
    yearFounded?: number | null;
    registrationNumber?: string | null;
    taxVatNumber?: string | null;
    registrationDocuments?: UploadedFile[];
    contactEmail?: string | null;
    website?: string | null;
    phoneNumber?: string | null;
    registeredAddress?: string | null;
    representativeFullName?: string | null;
    representativeJobTitle?: string | null;
    representativeIdType?: string | null;
    representativeIdNumber?: string | null;
    representativeIdDocumentUrl?: string | null;
    declarationConfirmed?: boolean;
    taxIdentificationNumber?: string | null;
    contactInfo?: string | null;
    causesSupported?: string | null;
  } | null;
}

interface PendingProject {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string | null;
  targetBudget: number;
  createdAt: string;
  ngo: {
    name: string | null;
    ngoInfo?: { ngoName: string } | null;
  };
  projectDocuments?: UploadedFile[];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    MORE_INFO_REQUESTED: "bg-amber-100 text-amber-700",
    MEETING_REQUESTED: "bg-violet-100 text-violet-700",
    REJECTED: "bg-red-100 text-red-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
  };
  const labels: Record<string, string> = {
    PENDING: "Pending",
    MORE_INFO_REQUESTED: "More Info Needed",
    MEETING_REQUESTED: "Meeting Requested",
    REJECTED: "Rejected",
    APPROVED: "Approved",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}
    >
      {labels[status] || status}
    </span>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { format } = useCurrency();
  const { data: session, isPending } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<"users" | "projects">("users");
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [projects, setProjects] = useState<PendingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUserId, setModalUserId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<
    "request_more_info" | "request_meeting" | null
  >(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalTimes, setModalTimes] = useState<TimeSlot[]>([]);
  const [modalSaving, setModalSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [usersRes, projectsRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/projects"),
    ]);

    if (usersRes.ok) {
      setUsers(await usersRes.json());
    }
    if (projectsRes.ok) {
      setProjects(await projectsRes.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }

    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.userType !== "ADMIN") {
          router.push("/discover");
        } else {
          setIsAdmin(true);
          fetchData();
        }
      })
      .catch(() => router.push("/discover"));
  }, [session, isPending, router, fetchData]);

  const handleUserAction = async (
    userId: string,
    action: "approve" | "reject" | "request_more_info" | "request_meeting",
    notes?: string,
  ) => {
    const body: Record<string, string> = { userId, action };
    if (notes) body.adminNotes = notes;

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      if (action === "approve") {
        // Approved users are no longer in the pending list
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        // Update status for rejected / request_more_info / request_meeting
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, approvalStatus: data.status, adminNotes: notes || "" }
              : u,
          ),
        );
      }
    }
  };

  const openModal = (
    userId: string,
    action: "request_more_info" | "request_meeting",
  ) => {
    setModalUserId(userId);
    setModalAction(action);
    setModalNotes("");
    setModalTimes(action === "request_meeting" ? [createDefaultSlot()] : []);
    setModalOpen(true);
  };

  const submitModal = async () => {
    if (!modalUserId || !modalAction) return;
    setModalSaving(true);

    if (modalAction === "request_meeting") {
      const merged = mergeContiguousSlots(modalTimes);
      const res = await fetch("/api/verification-meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: modalUserId,
          proposedTimes: merged,
          notes: modalNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === modalUserId
              ? { ...u, approvalStatus: data.status || "MEETING_REQUESTED", adminNotes: modalNotes }
              : u,
          ),
        );
      }
    } else {
      await handleUserAction(modalUserId, modalAction, modalNotes);
    }

    setModalSaving(false);
    setModalOpen(false);
    setModalUserId(null);
    setModalAction(null);
    setModalNotes("");
    setModalTimes([]);
  };

  const addModalTimeSlot = () => {
    setModalTimes((prev) =>
      prev.length >= 10 ? prev : [...prev, createDefaultSlot()],
    );
  };

  const updateModalSlotStart = (index: number, newStart: Date) => {
    const updated = [...modalTimes];
    const currentEnd = new Date(updated[index].end);
    const minStart = getNextHalfHourStart();

    let start = newStart;
    if (start.getTime() < minStart.getTime()) {
      start = minStart;
    }

    const duration =
      currentEnd.getTime() - new Date(updated[index].start).getTime();
    let newEnd = new Date(start.getTime() + duration);
    if (newEnd.getTime() - start.getTime() < 30 * 60000) {
      newEnd = new Date(start.getTime() + 30 * 60000);
    }

    updated[index] = {
      start: start.toISOString(),
      end: newEnd.toISOString(),
    };
    setModalTimes(updated);
  };

  const updateModalSlotEnd = (index: number, newEnd: Date) => {
    const updated = [...modalTimes];
    const currentStart = new Date(updated[index].start);
    const minEnd = new Date(currentStart.getTime() + 30 * 60000);

    let end = newEnd;
    if (end < minEnd) {
      end = minEnd;
    }

    updated[index] = {
      ...updated[index],
      end: end.toISOString(),
    };
    setModalTimes(updated);
  };

  const removeModalTimeSlot = (index: number) => {
    setModalTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const modalHasInvalidSlots = modalTimes.some((slot, index) => {
    const { invalidRange, pastStart, colliding } = getSlotValidation(
      slot,
      modalTimes,
      index,
    );
    return invalidRange || pastStart || colliding;
  });

  const handleProjectAction = async (
    projectId: string,
    action: "approve" | "reject",
  ) => {
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, action }),
    });

    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  };

  if (isPending || loading || !isAdmin) {
    return (
      <main className="ml-72 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="ml-72 min-h-screen bg-surface py-12 px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-on-surface">
            Admin Dashboard
          </h1>
          <p className="text-gray-500">
            Review and approve pending accounts and projects.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white rounded-xl p-1 border border-gray-100 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "bg-primary text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Pending Users ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "projects"
                ? "bg-primary text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Pending Projects ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/services")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-500 hover:bg-gray-50"
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/acquisitions")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-500 hover:bg-gray-50"
          >
            Acquisitions
          </button>
        </div>

        {activeTab === "users" && (
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                No pending users to review.
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="text-lg font-semibold text-on-surface">
                          {user.ngoInfo?.ngoName ||
                            user.companyInfo?.companyName ||
                            user.name ||
                            "Unnamed"}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.userType === "NGO"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user.userType}
                        </span>
                        <StatusBadge status={user.approvalStatus} />
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.approvalStatus === "REJECTED" ? (
                        <span className="px-3 py-1.5 border border-red-200 text-red-700 font-medium rounded-lg text-sm bg-red-50 cursor-default">
                          Rejected
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUserAction(user.id, "reject")}
                          className="px-3 py-1.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          openModal(user.id, "request_more_info")
                        }
                        className="px-3 py-1.5 border border-amber-200 text-amber-700 font-medium rounded-lg hover:bg-amber-50 transition-colors text-sm"
                      >
                        Request More Info
                      </button>
                      <button
                        type="button"
                        onClick={() => openModal(user.id, "request_meeting")}
                        className="px-3 py-1.5 border border-violet-200 text-violet-700 font-medium rounded-lg hover:bg-violet-50 transition-colors text-sm"
                      >
                        Request Meeting
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUserAction(user.id, "approve")}
                        className="px-3 py-1.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
                      >
                        {user.approvalStatus === "REJECTED"
                          ? "Re-approve"
                          : "Approve"}
                      </button>
                    </div>
                  </div>

                  {user.adminNotes && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                      <span className="font-semibold">Admin notes: </span>
                      <span className="whitespace-pre-wrap">
                        {user.adminNotes}
                      </span>
                    </div>
                  )}

                  {user.approvalStatus === "REJECTED" && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                      <span className="font-semibold">Previously rejected. </span>
                      <span>
                        The applicant can resubmit with updated information, or
                        you can re-approve them directly.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-400">Contact</span>
                      <p>
                        {user.ngoInfo?.contactInfo ||
                          user.companyInfo?.contactInfo ||
                          user.email ||
                          "N/A"}
                      </p>

                      <p>
                        {user.ngoInfo?.phoneNumber ||
                          user.companyInfo?.phoneNumber ||
                          "No phone number"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400">Website</span>
                      <p className="font-medium text-on-surface">
                        {user.ngoInfo?.website ||
                          user.companyInfo?.website ||
                          "N/A"}
                      </p>
                    </div>

                    {user.userType === "NGO" && user.ngoInfo && (
                      <>
                        <div className="space-y-1">
                          <span className="text-gray-400">
                            Organization type
                          </span>
                          <p className="font-medium text-on-surface">
                            {user.ngoInfo.ngoType || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-400">
                            Country / region
                          </span>
                          <p className="font-medium text-on-surface">
                            {user.ngoInfo.country || "N/A"}
                            {user.ngoInfo.cityRegion
                              ? ` · ${user.ngoInfo.cityRegion}`
                              : ""}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-400">
                            Registration number
                          </span>
                          <p className="font-medium text-on-surface">
                            {user.ngoInfo.registrationNumber || "N/A"}
                          </p>
                        </div>
                        <div className="md:col-span-3 w-full space-y-2">
                          <div className="space-y-1">
                            <span className="text-gray-400">
                              Registration docs
                            </span>
                            <p className="font-medium text-on-surface">
                              {user.ngoInfo.registrationDocuments?.length ?? 0}{" "}
                              uploaded
                            </p>
                            {user.ngoInfo.registrationDocuments?.length ? (
                              <div className="space-y-2 mt-2">
                                {user.ngoInfo.registrationDocuments.map(
                                  (file) => (
                                    <div
                                      key={file.id}
                                      className="rounded-2xl bg-gray-50 p-3 text-xs"
                                    >
                                      <div className="truncate text-gray-700">
                                        {file.fileName}
                                      </div>
                                      <div className="mt-1 flex gap-2">
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-primary underline"
                                        >
                                          Open
                                        </a>
                                        <a
                                          href={file.url}
                                          download
                                          className="text-primary underline"
                                        >
                                          Download
                                        </a>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </>
                    )}

                    {user.userType === "COMPANY" && user.companyInfo && (
                      <>
                        <div className="space-y-1">
                          <span className="text-gray-400">Industry</span>
                          <p className="font-medium text-on-surface">
                            {user.companyInfo.industryType || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-400">Country</span>
                          <p className="font-medium text-on-surface">
                            {user.companyInfo.country || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-400">
                            Registered address
                          </span>
                          <p className="font-medium text-on-surface">
                            {user.companyInfo.registeredAddress || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-400">Tax ID</span>
                          <p className="font-medium text-on-surface">
                            {user.companyInfo?.taxIdentificationNumber ||
                              user.companyInfo?.taxVatNumber ||
                              "N/A"}
                          </p>
                        </div>
                        <div className="md:col-span-3 w-full space-y-2">
                          <div className="space-y-1">
                            <span className="text-gray-400">
                              Registration docs
                            </span>
                            <p className="font-medium text-on-surface">
                              {user.companyInfo.registrationDocuments?.length ??
                                0}{" "}
                              uploaded
                            </p>
                            {user.companyInfo.registrationDocuments?.length ? (
                              <div className="space-y-2 mt-2">
                                {user.companyInfo.registrationDocuments.map(
                                  (file) => (
                                    <div
                                      key={file.id}
                                      className="rounded-2xl bg-gray-50 p-3 text-xs"
                                    >
                                      <div className="truncate text-gray-700">
                                        {file.fileName}
                                      </div>
                                      <div className="mt-1 flex gap-2">
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-primary underline"
                                        >
                                          Open
                                        </a>
                                        <a
                                          href={file.url}
                                          download
                                          className="text-primary underline"
                                        >
                                          Download
                                        </a>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="border-t border-gray-200 my-4" />

                  {user.userType === "NGO" && user.ngoInfo && (
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-gray-400">Mission statement</span>
                        <p className="font-medium text-on-surface">
                          {user.ngoInfo.missionStatement || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-400">Activities</span>
                        <p className="font-medium text-on-surface">
                          {user.ngoInfo.activitiesDescription || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-400">Project history</span>
                        <p className="font-medium text-on-surface">
                          {user.ngoInfo.currentOrPastProjects || "N/A"}
                        </p>
                      </div>

                      <div className="border-t border-gray-200 my-4" />
                      <div className="space-y-1">
                        <span className="text-gray-400">Proof link</span>
                        <p className="font-medium text-on-surface">
                          {user.ngoInfo.activityProofLink ? (
                            <a
                              href={user.ngoInfo.activityProofLink}
                              target="_blank"
                              rel="noreferrer"
                              className="underline text-primary"
                            >
                              {user.ngoInfo.activityProofLink}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-400">Proof files</span>
                        <p className="font-medium text-on-surface">
                          {user.ngoInfo.activityProofUrls?.length ?? 0} uploaded
                        </p>
                      </div>

                      {user.ngoInfo.activityProofUrls?.length ? (
                        <div className="space-y-2">
                          {user.ngoInfo.activityProofUrls.map((file) => (
                            <div
                              key={file.id}
                              className="rounded-2xl bg-gray-50 p-3 text-xs"
                            >
                              <div className="truncate text-gray-700">
                                {file.fileName}
                              </div>
                              <div className="mt-1 flex gap-2">
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline"
                                >
                                  Open
                                </a>
                                <a
                                  href={file.url}
                                  download
                                  className="text-primary underline"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="border-t border-gray-200 my-4" />
                      <div className="space-y-1 mt-2">
                        <span className="text-gray-400">Rep & ID</span>
                        <p className="font-medium text-on-surface">
                          {user.ngoInfo.representativeFullName || "N/A"}
                          {user.ngoInfo.representativeRole
                            ? ` · ${user.ngoInfo.representativeRole}`
                            : ""}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {user.ngoInfo.representativeIdType || ""}{" "}
                          {user.ngoInfo.representativeIdNumber || ""}
                        </p>
                        {user.ngoInfo.representativeIdDocumentUrl ? (
                          <p className="text-xs text-primary hover:underline">
                            <a
                              href={user.ngoInfo.representativeIdDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View document
                            </a>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {user.userType === "COMPANY" && user.companyInfo && (
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-gray-400">
                          Business description
                        </span>
                        <p className="font-medium text-on-surface">
                          {user.companyInfo.businessDescription || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-400">Causes supported</span>
                        <p className="font-medium text-on-surface">
                          {user.companyInfo.causesSupported || "N/A"}
                        </p>
                      </div>

                      <div className="border-t border-gray-200 my-4" />
                      <div className="space-y-1">
                        <span className="text-gray-400">Rep & ID</span>
                        <p className="font-medium text-on-surface">
                          {user.companyInfo.representativeFullName || "N/A"}
                          {user.companyInfo.representativeJobTitle
                            ? ` · ${user.companyInfo.representativeJobTitle}`
                            : ""}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {user.companyInfo.representativeIdType || ""}{" "}
                          {user.companyInfo.representativeIdNumber || ""}
                        </p>
                        {user.companyInfo.representativeIdDocumentUrl ? (
                          <p className="text-xs text-primary hover:underline">
                            <a
                              href={
                                user.companyInfo.representativeIdDocumentUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              View representative ID document
                            </a>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                No pending projects to review.
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-on-surface">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        by{" "}
                        {project.ngo.ngoInfo?.ngoName ||
                          project.ngo.name ||
                          "Unknown NGO"}{" "}
                        · {project.category}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleProjectAction(project.id, "reject")
                        }
                        className="px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleProjectAction(project.id, "approve")
                        }
                        className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
                      >
                        Approve
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700">{project.description}</p>

                  <div className="flex items-center space-x-6 text-sm">
                    <div>
                      <span className="text-gray-400">Target Budget</span>
                      <p className="font-medium text-on-surface">
                        {format(project.targetBudget)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Submitted</span>
                      <p className="font-medium text-on-surface">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-gray-400">Project documents</span>
                      <p className="font-medium text-on-surface">
                        {project.projectDocuments?.length ?? 0} uploaded
                      </p>
                    </div>

                    {project.projectDocuments?.length ? (
                      <div className="space-y-2">
                        {project.projectDocuments.map((file) => (
                          <div
                            key={file.id}
                            className="rounded-2xl bg-gray-50 p-3 text-xs"
                          >
                            <div className="truncate text-gray-700">
                              {file.fileName}
                            </div>
                            <div className="mt-1 flex gap-2">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline"
                              >
                                Open
                              </a>
                              <a
                                href={file.url}
                                download
                                className="text-primary underline"
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal for Request More Info / Request Meeting */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-on-surface">
                {modalAction === "request_more_info"
                  ? "Request More Information"
                  : "Request Verification Meeting"}
              </h3>
              <p className="text-sm text-gray-500">
                {modalAction === "request_more_info"
                  ? "Describe what additional documents or information the applicant needs to provide."
                  : "Propose time slots for the verification meeting and add any notes."}
              </p>
            </div>
            <textarea
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
              placeholder={
                modalAction === "request_more_info"
                  ? "e.g., Please upload your latest annual report and board member list..."
                  : "e.g., 30-minute video call to discuss your organization's mission and current projects..."
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />

            {modalAction === "request_meeting" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-on-surface">
                    Proposed Time Slots
                  </p>
                  <button
                    type="button"
                    onClick={addModalTimeSlot}
                    disabled={modalTimes.length >= 10}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    + Add Slot
                  </button>
                </div>

                {modalTimes.map((slot, index) => {
                  const { invalidRange, pastStart, colliding } =
                    getSlotValidation(slot, modalTimes, index);
                  const isInvalid = invalidRange || pastStart || colliding;

                  return (
                    <div
                      key={index}
                      className={`rounded-xl border p-3 space-y-2 text-sm ${
                        isInvalid
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          Slot {index + 1}
                        </span>
                        {modalTimes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeModalTimeSlot(index)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {isInvalid && (
                        <div className="text-xs text-red-600">
                          {invalidRange && "Minimum 30 minutes required. "}
                          {pastStart && "Start time must be in the future. "}
                          {colliding && "This slot overlaps with another."}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">
                            Start
                          </label>
                          <DatePicker
                            selected={new Date(slot.start)}
                            onChange={(date: Date | null) =>
                              date && updateModalSlotStart(index, date)
                            }
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={30}
                            dateFormat="MMM d, yyyy HH:mm"
                            minDate={new Date()}
                            minTime={getStartMinTimeForDate(
                              new Date(slot.start),
                            )}
                            maxTime={new Date(
                              new Date(slot.start).setHours(23, 30),
                            )}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">
                            End
                          </label>
                          <DatePicker
                            selected={new Date(slot.end)}
                            onChange={(date: Date | null) =>
                              date && updateModalSlotEnd(index, date)
                            }
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={30}
                            dateFormat="MMM d, yyyy HH:mm"
                            minDate={new Date(slot.start)}
                            minTime={getEndMinTimeForDate(
                              new Date(slot.end),
                              slot,
                            )}
                            maxTime={new Date(
                              new Date(slot.end).setHours(23, 59),
                            )}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setModalUserId(null);
                  setModalAction(null);
                  setModalNotes("");
                  setModalTimes([]);
                }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitModal}
                disabled={
                  modalSaving ||
                  !modalNotes.trim() ||
                  (modalAction === "request_meeting" &&
                    (modalTimes.length === 0 || modalHasInvalidSlots))
                }
                className="flex-1 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {modalSaving ? "Saving..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
