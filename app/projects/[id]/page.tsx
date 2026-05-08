"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { ProgressBar } from "@/app/components/ui/progress-bar";
import { authClient } from "@/app/lib/auth-client";
import {
  formatCurrency,
  getFundedPercent,
  getNgoName,
  getProjectImage,
} from "@/app/lib/project-utils";
import type { Project } from "@/app/types/project";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = authClient.useSession();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [donateOpen, setDonateOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  const [donating, setDonating] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchProject();
  }, [id, fetchProject]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => setUserType(data.userType || null))
      .catch(() => {});
  }, [session]);

  const handleDonate = async () => {
    if (!donateAmount || Number(donateAmount) <= 0) return;
    setDonating(true);

    const res = await fetch(`/api/projects/${id}/donate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(donateAmount) }),
    });

    setDonating(false);

    if (res.ok) {
      setDonateOpen(false);
      setDonateAmount("");
      await fetchProject();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Donation failed.");
    }
  };

  if (loading) {
    return (
      <main className="ml-72 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="ml-72 min-h-screen flex items-center justify-center text-gray-500">
        Project not found.
      </main>
    );
  }

  const funded = getFundedPercent(project.currentAmount, project.targetBudget);
  const isLoggedIn = !!session?.user;
  const isNgo = userType === "NGO";
  const isOwner = isNgo && session?.user?.id === project.ngoId;
  const isAdmin = userType === "ADMIN";
  const showApprovalBadge = isOwner || isAdmin;

  return (
    <main className="ml-72 min-h-screen bg-surface py-12 px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Image */}
        <div className="relative w-full h-80 rounded-2xl overflow-hidden">
          {/* biome-ignore lint/performance/noImgElement: user-provided project images may be from any external host */}
          <img
            src={getProjectImage(project.image)}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Badge variant="primary">{project.category}</Badge>
            {project.status === "COMPLETED" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                Fully Funded
              </span>
            )}
            {showApprovalBadge && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  project.approvalStatus === "APPROVED"
                    ? "bg-emerald-100 text-emerald-700"
                    : project.approvalStatus === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {project.approvalStatus === "APPROVED"
                  ? "Approved"
                  : project.approvalStatus === "PENDING"
                    ? "Pending Approval"
                    : "Rejected"}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-on-surface">
            {project.title}
          </h1>
          <p className="text-gray-500">
            by{" "}
            <a
              href={`/profile/${project.ngoId}`}
              className="text-primary font-medium hover:underline"
            >
              {getNgoName(project)}
            </a>
          </p>
        </div>

        {/* Funding bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-3xl font-black text-primary">
              {funded}%
              <span className="text-base font-medium text-on-surface-variant ml-2">
                funded
              </span>
            </span>
            <span className="text-lg font-bold">
              {formatCurrency(project.currentAmount)}{" "}
              <span className="text-on-surface-variant font-normal">
                of {formatCurrency(project.targetBudget)}
              </span>
            </span>
          </div>
          <ProgressBar value={funded} size="md" />
          <p className="text-sm text-gray-500">
            {project._count?.donations ?? project.donations?.length ?? 0}{" "}
            donation
            {(project._count?.donations ?? project.donations?.length ?? 0) !== 1
              ? "s"
              : ""}{" "}
            so far
          </p>

          {isLoggedIn && project.status === "ACTIVE" && (
            <button
              type="button"
              onClick={() => setDonateOpen(true)}
              className="flex items-center justify-center space-x-3 w-full md:w-auto bg-primary hover:bg-primary-container text-on-primary px-10 py-5 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-primary/30 active:scale-95"
            >
              <span className="material-symbols-outlined text-2xl transition-transform hover:scale-110">
                favorite
              </span>
              <span>Donate Now</span>
            </button>
          )}

          {isOwner && (
            <p className="text-sm text-gray-500">You created this project.</p>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-on-surface mb-4">
            About this project
          </h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Donations */}
        {project.donations && project.donations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
            <h2 className="text-lg font-semibold text-on-surface">
              Recent Donations
            </h2>
            <div className="space-y-3">
              {project.donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs">
                      {(
                        donation.company.name ||
                        donation.company.companyInfo?.companyName ||
                        "?"
                      ).charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-on-surface">
                      {donation.company.companyInfo?.companyName ||
                        donation.company.name ||
                        "Anonymous"}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(donation.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Donate Modal */}
      {donateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
            <h2 className="text-xl font-bold text-on-surface">
              Make a Donation
            </h2>
            <p className="text-gray-500 text-sm">
              Your contribution helps bring &quot;{project.title}&quot; to life.
            </p>
            <div className="space-y-2">
              <div className="text-sm font-medium text-on-surface">
                Amount (USD)
              </div>
              <input
                type="number"
                value={donateAmount}
                onChange={(e) => setDonateAmount(e.target.value)}
                min={1}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="1000"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDonateOpen(false);
                  setDonateAmount("");
                }}
                className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDonate}
                disabled={
                  donating || !donateAmount || Number(donateAmount) <= 0
                }
                className="flex-1 py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {donating ? "Processing..." : "Donate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
