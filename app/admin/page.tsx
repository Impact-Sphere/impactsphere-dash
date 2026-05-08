"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import { formatCurrency } from "@/app/lib/project-utils";

interface PendingUser {
  id: string;
  name: string | null;
  email: string;
  userType: string;
  createdAt: string;
  ngoInfo?: {
    ngoName: string;
    taxIdentificationNumber: string;
    contactInfo: string;
    mainGoals: string;
    challenges: string;
  } | null;
  companyInfo?: {
    companyName: string;
    taxIdentificationNumber: string;
    contactInfo: string;
    causesSupported: string;
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
}

export default function AdminDashboardPage() {
  const router = useRouter();
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

  const handleUserAction = async (userId: string, action: "approve" | "reject") => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  const handleProjectAction = async (projectId: string, action: "approve" | "reject") => {
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
                      <div className="flex items-center space-x-3">
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
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex space-x-2">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-400">Tax ID</span>
                      <p className="font-medium text-on-surface">
                        {user.ngoInfo?.taxIdentificationNumber ||
                          user.companyInfo?.taxIdentificationNumber ||
                          "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-400">Contact</span>
                      <p className="font-medium text-on-surface">
                        {user.ngoInfo?.contactInfo ||
                          user.companyInfo?.contactInfo ||
                          "N/A"}
                      </p>
                    </div>
                    {user.userType === "NGO" && user.ngoInfo && (
                      <>
                        <div className="space-y-1">
                          <span className="text-gray-400">Main Goals</span>
                          <p className="font-medium text-on-surface">
                            {user.ngoInfo.mainGoals}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-400">Challenges</span>
                          <p className="font-medium text-on-surface">
                            {user.ngoInfo.challenges}
                          </p>
                        </div>
                      </>
                    )}
                    {user.userType === "COMPANY" && user.companyInfo && (
                      <div className="col-span-1 md:col-span-2 space-y-1">
                        <span className="text-gray-400">Causes Supported</span>
                        <p className="font-medium text-on-surface">
                          {user.companyInfo.causesSupported}
                        </p>
                      </div>
                    )}
                  </div>
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
                        by {project.ngo.ngoInfo?.ngoName || project.ngo.name || "Unknown NGO"} ·{" "}
                        {project.category}
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
                        {formatCurrency(project.targetBudget)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Submitted</span>
                      <p className="font-medium text-on-surface">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
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
