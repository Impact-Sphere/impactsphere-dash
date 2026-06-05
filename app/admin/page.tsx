"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCurrency } from "@/app/components/currency/currency-context";
import { authClient } from "@/app/lib/auth-client";

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { format } = useCurrency();
  const { data: session, isPending } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<"users" | "projects">("users");
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [projects, setProjects] = useState<PendingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
    action: "approve" | "reject",
  ) => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

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
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-on-surface">
            Admin Dashboard
          </h1>
          <p className="text-gray-500">
            Review and approve pending accounts and projects.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 border border-gray-100 w-fit">
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center text-gray-500">
                No pending users to review.
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-1.5">
                        <h3 className="text-lg font-semibold text-on-surface break-words">
                          {user.ngoInfo?.ngoName ||
                            user.companyInfo?.companyName ||
                            user.name ||
                            "Unnamed"}
                        </h3>
                        <span
                          className={`self-start inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.userType === "NGO"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user.userType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 break-words">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUserAction(user.id, "reject")}
                        className="px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUserAction(user.id, "approve")}
                        className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
                      >
                        Approve
                      </button>
                    </div>
                  </div>

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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center text-gray-500">
                No pending projects to review.
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-lg font-semibold text-on-surface break-words">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-500 break-words">
                        by{" "}
                        {project.ngo.ngoInfo?.ngoName ||
                          project.ngo.name ||
                          "Unknown NGO"}{" "}
                        · {project.category}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
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

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
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
    </main>
  );
}
