"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StatusMessage } from "@/app/components/ui/status-message";
import { authClient } from "@/app/lib/auth-client";

interface AcquiredService {
  id: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  revisionsUsed: number;
  deliveryMessage: string | null;
  createdAt: string;
  service: {
    name: string;
    description: string;
    category: string;
    provider: { name: string | null; email: string };
  };
  package: {
    name: string;
    price: number;
    deliveryDays: number;
    revisions: number;
  };
  project: { title: string; id: string };
  chat: { id: string } | null;
  review: { id: string; rating: number; comment: string | null } | null;
}

export default function MyServicesPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [acquisitions, setAcquisitions] = useState<AcquiredService[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState<string | null>(
    null,
  );
  const [revisionMessage, setRevisionMessage] = useState("");
  const [toastMessage, setToastMessage] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  const loadAcquisitions = useCallback(() => {
    fetch("/api/services/acquired")
      .then((r) => r.json())
      .then((data) => {
        setAcquisitions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    loadAcquisitions();
  }, [session, isPending, router, loadAcquisitions]);

  const handleAction = async (
    acquisitionId: string,
    action: string,
    message?: string,
  ) => {
    setActionLoading(acquisitionId);
    const res = await fetch(`/api/services/${acquisitionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, message }),
    });

    setActionLoading(null);

    if (res.ok) {
      loadAcquisitions();
      setShowRevisionModal(null);
      setRevisionMessage("");
      setToastMessage({
        type: "success",
        message: "Action completed successfully.",
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setToastMessage({
        type: "error",
        message: data.error || "Action failed",
      });
    }
  };

  const handleReview = async (acquisitionId: string) => {
    setActionLoading(acquisitionId);
    const res = await fetch(`/api/services/${acquisitionId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
    });

    setActionLoading(null);

    if (res.ok) {
      setShowReviewModal(null);
      setReviewRating(5);
      setReviewComment("");
      loadAcquisitions();
      setToastMessage({
        type: "success",
        message: "Review submitted successfully.",
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setToastMessage({
        type: "error",
        message: data.error || "Failed to submit review",
      });
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: "bg-emerald-100 text-emerald-700",
      DELIVERED: "bg-blue-100 text-blue-700",
      REVISION_REQUESTED: "bg-amber-100 text-amber-700",
      COMPLETED: "bg-violet-100 text-violet-700",
      CANCELLED: "bg-gray-100 text-gray-600",
    };
    const labels: Record<string, string> = {
      ACTIVE: "In Progress",
      DELIVERED: "Delivered — Awaiting Review",
      REVISION_REQUESTED: "Revision Requested",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}
      >
        {labels[status] || status}
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
    <>
      {toastMessage && (
        <StatusMessage
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      <main className="min-h-screen bg-surface py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">
            My Acquired Services
          </h1>
          <p className="text-gray-500">
            Track deliveries, accept work, and leave reviews
          </p>
        </div>

        <div className="space-y-4">
          {acquisitions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-12 text-center text-gray-500 space-y-4">
              <p>You haven&apos;t acquired any services yet.</p>
              <Link
                href="/services"
                className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse Services Catalog
              </Link>
            </div>
          ) : (
            acquisitions.map((acq) => (
              <div
                key={acq.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-1.5">
                      <h3 className="text-base sm:text-lg font-semibold text-on-surface break-words">
                        {acq.service.name}
                        <span className="text-primary font-medium">
                          {" "}
                          — {acq.package.name}
                        </span>
                        <span className="text-gray-400 font-normal">
                          {" "}
                          — {acq.project.title}
                        </span>
                      </h3>
                      {statusBadge(acq.status)}
                    </div>
                  </div>
                  <div className="flex sm:flex-shrink-0">
                    {acq.chat && (
                      <Link
                        href={`/chat/${acq.chat.id}`}
                        className="w-full sm:w-auto text-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm"
                      >
                        Open Chat
                      </Link>
                    )}
                  </div>
                </div>

                {/* Delivery message */}
                {acq.status === "DELIVERED" && acq.deliveryMessage && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Provider&apos;s delivery note:
                    </p>
                    <p className="text-sm text-blue-700">
                      {acq.deliveryMessage}
                    </p>
                  </div>
                )}

                {/* Actions for DELIVERED status */}
                {acq.status === "DELIVERED" && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleAction(acq.id, "accept")}
                      disabled={actionLoading === acq.id}
                      className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                    >
                      {actionLoading === acq.id ? "..." : "✓ Accept Delivery"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRevisionModal(acq.id)}
                      disabled={
                        actionLoading === acq.id ||
                        acq.revisionsUsed >= acq.package.revisions
                      }
                      className="px-4 py-2 border border-amber-300 text-amber-700 font-medium rounded-lg hover:bg-amber-50 transition-colors text-sm disabled:opacity-50"
                    >
                      🔄 Request Revision (
                      {acq.package.revisions - acq.revisionsUsed} left)
                    </button>
                  </div>
                )}

                {/* Revision modal */}
                {showRevisionModal === acq.id && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-amber-800">
                      What needs to be revised?
                    </p>
                    <textarea
                      value={revisionMessage}
                      onChange={(e) => setRevisionMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                      placeholder="Describe what needs to be changed..."
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleAction(acq.id, "revision", revisionMessage)
                        }
                        className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg text-sm"
                      >
                        Submit Revision Request
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRevisionModal(null);
                          setRevisionMessage("");
                        }}
                        className="px-4 py-2 border text-gray-600 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Review section for COMPLETED */}
                {acq.status === "COMPLETED" && !acq.review && (
                  <div className="pt-2 border-t border-gray-100">
                    {showReviewModal === acq.id ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-on-surface">
                          Leave a review
                        </p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className={`text-2xl ${star <= reviewRating ? "text-yellow-400" : "text-gray-200"}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                          placeholder="Write a comment (optional)..."
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => handleReview(acq.id)}
                            disabled={actionLoading === acq.id}
                            className="px-4 py-2 bg-primary text-white font-medium rounded-lg text-sm disabled:opacity-50"
                          >
                            Submit Review
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowReviewModal(null)}
                            className="px-4 py-2 border text-gray-600 rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowReviewModal(acq.id)}
                        className="px-4 py-2 border border-primary text-primary font-medium rounded-lg hover:bg-primary/5 transition-colors text-sm"
                      >
                        ⭐ Leave a Review
                      </button>
                    )}
                  </div>
                )}

                {/* Existing review */}
                {acq.review && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-on-surface">
                        Your review:
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-sm ${star <= (acq.review?.rating ?? 0) ? "text-yellow-400" : "text-gray-200"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    {acq.review.comment && (
                      <p className="text-sm text-gray-600 mt-1">
                        {acq.review.comment}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-gray-400">Category</span>
                    <p className="font-medium text-on-surface break-words">
                      {acq.service.category}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400">Package</span>
                    <p className="font-medium text-on-surface break-words">
                      {acq.package.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400">Cost</span>
                    <p className="font-medium text-on-surface break-words">
                      €{acq.package.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400">Donation spend</span>
                    <p className="font-medium text-on-surface break-words">
                      €{acq.package.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {acq.status === "DELIVERED" || acq.status === "COMPLETED"
                        ? "Spent from donations"
                        : "Due on delivery"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400">Delivery</span>
                    <p className="font-medium text-on-surface">
                      {acq.package.deliveryDays} days
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400">Provider</span>
                    <p className="font-medium text-on-surface break-words">
                      {acq.service.provider.name || acq.service.provider.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                  <span>
                    Acquired: {new Date(acq.createdAt).toLocaleDateString()}
                  </span>
                  {acq.deliveredAt && (
                    <span>
                      Delivered:{" "}
                      {new Date(acq.deliveredAt).toLocaleDateString()}
                    </span>
                  )}
                  {acq.completedAt && (
                    <span>
                      Completed:{" "}
                      {new Date(acq.completedAt).toLocaleDateString()}
                    </span>
                  )}
                  {acq.revisionsUsed > 0 && (
                    <span>
                      Revisions used: {acq.revisionsUsed}/
                      {acq.package.revisions}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  </>
  );
}
