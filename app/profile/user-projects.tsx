"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrency } from "@/app/components/currency/currency-context";
import { getFundedPercent, getProjectImage } from "@/app/lib/project-utils";
import type { Project } from "@/app/types/project";

export function UserProjects({
  userType,
  userId,
  isPublic,
}: {
  userType: string | null;
  userId?: string;
  isPublic?: boolean;
}) {
  const router = useRouter();
  const { format } = useCurrency();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = userId
      ? `/api/projects?ngoId=${userId}`
      : "/api/projects?mine=true";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (projectId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone.",
    );
    if (!confirmed) return;
    setDeletingId(projectId);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });
    setDeletingId(null);
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete project.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const title = isPublic
    ? userType === "COMPANY"
      ? "Sponsored Projects"
      : "Projects"
    : userType === "COMPANY"
      ? "Sponsored Projects"
      : "My Projects";

  if (projects.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-on-surface mb-2">{title}</h2>
        <p className="text-gray-500 text-sm">
          {isPublic
            ? userType === "COMPANY"
              ? "This company hasn't sponsored any projects yet."
              : "This organization hasn't created any projects yet."
            : userType === "COMPANY"
              ? "You haven't sponsored any projects yet. Explore the discovery page to find initiatives to support."
              : "You haven't created any projects yet. Click 'Create Project' in the sidebar to get started."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
      <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
      <div className="space-y-4">
        {projects.map((project) => {
          const funded = getFundedPercent(
            project.currentAmount,
            project.targetBudget,
          );
          return (
            <a
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center space-x-4 p-4 rounded-xl hover:bg-surface-container-low transition-colors"
            >
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                {/* biome-ignore lint/performance/noImgElement: user-provided project images may be from any external host */}
                <img
                  src={getProjectImage(project.image)}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
                <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-on-surface truncate">
                    {project.title}
                  </h3>
                  {project.approvalStatus &&
                    project.approvalStatus !== "APPROVED" && (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          project.approvalStatus === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {project.approvalStatus === "PENDING"
                          ? "Pending"
                          : "Rejected"}
                      </span>
                    )}
                </div>
                <p className="text-xs text-gray-500">{project.category}</p>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-primary font-bold">{funded}%</span>
                  <span className="text-gray-400">
                    {format(project.currentAmount)} /{" "}
                    {format(project.targetBudget)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${funded}%` }}
                  />
                </div>
              </div>
              {!isPublic && userType === "NGO" && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/projects/${project.id}`);
                    }}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    aria-label="Edit project"
                    title="Edit project"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      edit
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    disabled={deletingId === project.id}
                    className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    aria-label="Delete project"
                    title="Delete project"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      delete
                    </span>
                  </button>
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
