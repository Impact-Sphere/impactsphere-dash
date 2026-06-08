"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/app/lib/auth-client";

interface MatchingRequest {
  id: string;
  causeAreas: string[];
  description: string | null;
  budgetRange: string | null;
  location: string | null;
  timeline: string | null;
  status: string;
  adminNotes: string | null;
  recommendedProjectIds: string[];
  createdAt: string;
  updatedAt: string;
  recommendedProjects?: Project[];
}

interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string | null;
  targetBudget: number;
  currentAmount: number;
  ngo: { name: string | null; ngoInfo?: { ngoName: string } | null };
}

const CAUSE_OPTIONS = [
  "Education",
  "Healthcare",
  "Tech Equity",
  "Disaster Relief",
  "Housing",
  "Poverty Alleviation",
  "Arts & Culture",
  "Community Development",
];

const BUDGET_OPTIONS = [
  { value: "under-10k", label: "Under €10,000" },
  { value: "10k-50k", label: "€10,000 – €50,000" },
  { value: "50k-100k", label: "€50,000 – €100,000" },
  { value: "100k-500k", label: "€100,000 – €500,000" },
  { value: "500k+", label: "€500,000+" },
];

const TIMELINE_OPTIONS = [
  { value: "immediate", label: "Immediate" },
  { value: "within-3-months", label: "Within 3 months" },
  { value: "within-6-months", label: "Within 6 months" },
  { value: "within-year", label: "Within a year" },
  { value: "flexible", label: "Flexible" },
];

export default function MatchingRequestPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [, setUserType] = useState<string | null>(null);
  const [requests, setRequests] = useState<MatchingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [selectedCauses, setSelectedCauses] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [location, setLocation] = useState("");
  const [timeline, setTimeline] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/matching-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          const type = data.userType as string | null;
          setUserType(type);
          if (type === "NGO" || type === "ADMIN") {
            router.push("/discover");
          } else {
            fetchRequests();
          }
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [session, isPending, router, fetchRequests]);

  const toggleCause = (cause: string) => {
    setSelectedCauses((prev) =>
      prev.includes(cause) ? prev.filter((c) => c !== cause) : [...prev, cause],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCauses.length === 0) {
      setError("Select at least one cause area.");
      return;
    }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/matching-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        causeAreas: selectedCauses,
        description,
        budgetRange: budgetRange || undefined,
        location: location || undefined,
        timeline: timeline || undefined,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      const newReq = await res.json();
      setRequests((prev) => [newReq, ...prev]);
      setShowForm(false);
      setSelectedCauses([]);
      setDescription("");
      setBudgetRange("");
      setLocation("");
      setTimeline("");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to submit.");
    }
  };

  const fetchRecommendations = async (requestId: string) => {
    const res = await fetch(`/api/matching-requests/${requestId}`);
    if (res.ok) {
      const data = await res.json();
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, ...data } : r)),
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-amber-100 text-amber-700",
      IN_REVIEW: "bg-blue-100 text-blue-700",
      MATCHED: "bg-emerald-100 text-emerald-700",
      DECLINED: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  if (isPending || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface py-12 px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">
              Project Matching
            </h1>
            <p className="text-gray-500">
              Tell us what kind of impact you want to support, and we will find
              the right projects for you.
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              + New Request
            </button>
          )}
        </div>

        {/* Submit Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-on-surface">
                New Matching Request
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Cause Areas */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-on-surface">
                  Cause areas you want to support{" "}
                  <span className="text-red-500">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {CAUSE_OPTIONS.map((cause) => {
                    const selected = selectedCauses.includes(cause);
                    return (
                      <button
                        key={cause}
                        type="button"
                        onClick={() => toggleCause(cause)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          selected
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {cause}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-on-surface"
                >
                  Describe what you are looking for
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder="e.g., We want to fund STEM education programs in rural African communities..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Budget */}
                <div className="space-y-2">
                  <label
                    htmlFor="budgetRange"
                    className="text-sm font-medium text-on-surface"
                  >
                    Budget range
                  </label>
                  <select
                    id="budgetRange"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
                  >
                    <option value="">Select budget...</option>
                    {BUDGET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label
                    htmlFor="location"
                    className="text-sm font-medium text-on-surface"
                  >
                    Preferred location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="e.g., Sub-Saharan Africa"
                  />
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <label
                    htmlFor="timeline"
                    className="text-sm font-medium text-on-surface"
                  >
                    Timeline
                  </label>
                  <select
                    id="timeline"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
                  >
                    <option value="">Select timeline...</option>
                    {TIMELINE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedCauses.length === 0}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Requests */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-on-surface">
            Your Requests ({requests.length})
          </h2>

          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
              No matching requests yet. Submit one above to get started.
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(req.status)}
                      <span className="text-xs text-gray-400">
                        Submitted {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {req.causeAreas.map((cause) => (
                        <span
                          key={cause}
                          className="text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full"
                        >
                          {cause}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchRecommendations(req.id)}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Refresh
                  </button>
                </div>

                {req.description && (
                  <p className="text-sm text-gray-600">{req.description}</p>
                )}

                <div className="grid grid-cols-3 gap-4 text-sm">
                  {req.budgetRange && (
                    <div>
                      <span className="text-gray-400">Budget</span>
                      <p className="font-medium text-on-surface">
                        {BUDGET_OPTIONS.find((b) => b.value === req.budgetRange)
                          ?.label || req.budgetRange}
                      </p>
                    </div>
                  )}
                  {req.location && (
                    <div>
                      <span className="text-gray-400">Location</span>
                      <p className="font-medium text-on-surface">
                        {req.location}
                      </p>
                    </div>
                  )}
                  {req.timeline && (
                    <div>
                      <span className="text-gray-400">Timeline</span>
                      <p className="font-medium text-on-surface">
                        {TIMELINE_OPTIONS.find((t) => t.value === req.timeline)
                          ?.label || req.timeline}
                      </p>
                    </div>
                  )}
                </div>

                {req.adminNotes && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                    <p className="font-semibold">Admin response:</p>
                    <p className="mt-1 whitespace-pre-wrap">{req.adminNotes}</p>
                  </div>
                )}

                {/* Recommended Projects */}
                {req.recommendedProjects &&
                  req.recommendedProjects.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-on-surface">
                        Recommended Projects
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {req.recommendedProjects.map((project) => (
                          <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="block rounded-xl border border-gray-200 p-4 hover:border-primary transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {project.image && (
                                <Image
                                  src={project.image}
                                  alt={project.title}
                                  width={64}
                                  height={64}
                                  unoptimized
                                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                />
                              )}
                              <div className="space-y-1 min-w-0">
                                <p className="text-sm font-medium text-on-surface truncate">
                                  {project.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {project.category} ·{" "}
                                  {project.ngo?.ngoInfo?.ngoName ||
                                    project.ngo?.name ||
                                    "Unknown NGO"}
                                </p>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-primary h-1.5 rounded-full"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        (project.currentAmount /
                                          Math.max(project.targetBudget, 1)) *
                                          100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                {req.status === "MATCHED" &&
                  (!req.recommendedProjects ||
                    req.recommendedProjects.length === 0) && (
                    <div className="text-sm text-gray-500">
                      Our team is preparing personalized recommendations for
                      you.
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
