"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrency } from "@/app/components/currency/currency-context";
import { authClient } from "@/app/lib/auth-client";

interface WorkroomData {
  id: string;
  serviceAcquisition: {
    id: string;
    status: string;
    revisionsUsed: number;
    deliveredAt: string | null;
    completedAt: string | null;
    deliveryMessage: string | null;
    service: {
      id: string;
      name: string;
      description: string;
      category: string;
      providerId: string;
      provider: { name: string | null; email: string };
    };
    project: {
      id: string;
      title: string;
      ngoId: string;
      ngo: {
        name: string | null;
        email: string;
        ngoInfo: { ngoName: string } | null;
      };
    };
    package: {
      name: string;
      price: number;
      deliveryDays: number;
      revisions: number;
    };
    review: { id: string; rating: number; comment: string | null } | null;
  };
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "In Progress",
  DELIVERED: "Delivered — Awaiting Review",
  REVISION_REQUESTED: "Revision Requested",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function WorkroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { format } = useCurrency();
  const { data: session, isPending } = authClient.useSession();
  const [chatId, setChatId] = useState<string | null>(null);
  const [workroom, setWorkroom] = useState<WorkroomData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then(({ id }) => setChatId(id));
  }, [params]);

  const acqStatus = workroom?.serviceAcquisition.status || "ACTIVE";
  const isProvider =
    workroom?.serviceAcquisition.service.providerId === session?.user?.id;
  const isNgo =
    workroom?.serviceAcquisition.project.ngoId === session?.user?.id;

  const revisionsLeft = useMemo(() => {
    if (!workroom) return 0;
    return Math.max(
      0,
      workroom.serviceAcquisition.package.revisions -
        workroom.serviceAcquisition.revisionsUsed,
    );
  }, [workroom]);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (!chatId) return;

    let workroomInterval: ReturnType<typeof setInterval> | null = null;
    let messageInterval: ReturnType<typeof setInterval> | null = null;

    const loadWorkroom = () =>
      fetch(`/api/workroom/${chatId}`)
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load workroom");
          return r.json();
        })
        .then((data: WorkroomData) => {
          setWorkroom(data);
          setLoading(false);
        })
        .catch(() => {
          setError("Workroom not found or access denied");
          setLoading(false);
        });

    const loadMessages = () =>
      fetch(`/api/chat/${chatId}`)
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load messages");
          return r.json();
        })
        .then((data: Message[]) => setMessages(data));

    loadWorkroom();
    loadMessages();
    workroomInterval = setInterval(loadWorkroom, 3000);
    messageInterval = setInterval(loadMessages, 3000);

    return () => {
      if (workroomInterval) clearInterval(workroomInterval);
      if (messageInterval) clearInterval(messageInterval);
    };
  }, [session, isPending, router, chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessage = async () => {
    if (!chatId || !newMessage.trim()) return;

    setSending(true);
    const res = await fetch(`/api/chat/${chatId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });

    setSending(false);

    if (res.ok) {
      const message = await res.json();
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    }
  };

  const handleAction = async (action: string, message?: string) => {
    if (!workroom) return;

    setActionLoading(true);
    const res = await fetch(`/api/services/${workroom.serviceAcquisition.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, message }),
    });
    setActionLoading(false);

    if (res.ok) {
      setShowDeliverModal(false);
      setShowRevisionModal(false);
      setDeliveryMessage("");
      setRevisionMessage("");
      // Reload workroom data
      fetch(`/api/workroom/${chatId}`)
        .then((r) => r.json())
        .then((data: WorkroomData) => setWorkroom(data));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Action failed");
    }
  };

  const handleReview = async () => {
    if (!workroom) return;

    setActionLoading(true);
    const res = await fetch(
      `/api/services/${workroom.serviceAcquisition.id}/review`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      },
    );
    setActionLoading(false);

    if (res.ok) {
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewComment("");
      fetch(`/api/workroom/${chatId}`)
        .then((r) => r.json())
        .then((data: WorkroomData) => setWorkroom(data));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to submit review");
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
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}
      >
        {STATUS_LABELS[status] || status}
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

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Chats
          </button>
        </div>
      </main>
    );
  }

  if (!workroom) return null;

  const acq = workroom.serviceAcquisition;

  return (
    <main className="min-h-screen bg-surface py-12 px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-on-surface">
              {acq.service.name}
              <span className="text-primary text-lg font-normal">
                {" "}
                — {acq.package.name}
              </span>
            </h1>
            <p className="text-sm text-gray-500">
              Project: <span className="font-medium">{acq.project.title}</span>
              {" · "}
              {isProvider
                ? `NGO: ${acq.project.ngo.ngoInfo?.ngoName || acq.project.ngo.name || acq.project.ngo.email}`
                : `Provider: ${acq.service.provider.name || acq.service.provider.email}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge(acqStatus)}
            <button
              type="button"
              onClick={() =>
                router.push(isProvider ? "/admin/acquisitions" : "/my-services")
              }
              className="px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Back
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex h-[calc(100vh-260px)]">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header with Actions */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-on-surface">Workroom Chat</h3>
                <span className="text-xs text-gray-400">
                  {revisionsLeft} revision{revisionsLeft !== 1 ? "s" : ""} left
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {isProvider &&
                  (acqStatus === "ACTIVE" ||
                    acqStatus === "REVISION_REQUESTED") && (
                    <button
                      type="button"
                      onClick={() => setShowDeliverModal(true)}
                      className="px-3 py-1.5 bg-primary text-white font-medium rounded-lg text-sm hover:bg-primary/90"
                    >
                      📦 Deliver Work
                    </button>
                  )}
                {isNgo && acqStatus === "DELIVERED" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAction("accept")}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-medium rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      ✓ Accept Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRevisionModal(true)}
                      disabled={actionLoading || revisionsLeft === 0}
                      className="px-3 py-1.5 border border-amber-300 text-amber-700 font-medium rounded-lg text-sm hover:bg-amber-50 disabled:opacity-50"
                    >
                      🔄 Request Revision ({revisionsLeft} left)
                    </button>
                  </>
                )}
                {isNgo &&
                  acqStatus === "COMPLETED" &&
                  !acq.review &&
                  !showReviewForm && (
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(true)}
                      className="px-3 py-1.5 border border-primary text-primary font-medium rounded-lg text-sm hover:bg-primary/5"
                    >
                      ⭐ Leave a Review
                    </button>
                  )}
              </div>

              {/* Delivery Note */}
              {acqStatus === "DELIVERED" && acq.deliveryMessage && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-800 mb-0.5">
                    Provider&apos;s delivery note:
                  </p>
                  <p className="text-sm text-blue-700">{acq.deliveryMessage}</p>
                </div>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <div className="mt-3 bg-violet-50 border border-violet-100 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-violet-800">
                    Leave a review
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl ${star <= reviewRating ? "text-yellow-400" : "text-gray-300"}`}
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleReview}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-primary text-white font-medium rounded-lg text-sm disabled:opacity-50"
                    >
                      Submit Review
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewRating(5);
                        setReviewComment("");
                      }}
                      className="px-4 py-2 border text-gray-600 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Review */}
              {acq.review && (
                <div className="mt-3 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-on-surface">
                      Review:
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${star <= (acq.review?.rating ?? 0) ? "text-yellow-400" : "text-gray-300"}`}
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
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === session?.user.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                        msg.senderId === session?.user.id
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-gray-100 text-on-surface rounded-bl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {sending ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-80 border-l border-gray-100 bg-slate-50 p-4 space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-on-surface">
                Service Details
              </h3>
              <p className="text-xs text-gray-500">
                Overview of this acquisition
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Status</p>
                <p className="text-sm font-semibold text-on-surface">
                  {STATUS_LABELS[acqStatus] || acqStatus}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Revisions</p>
                <p className="text-sm font-semibold text-on-surface">
                  {acq.revisionsUsed} used, {revisionsLeft} left
                </p>
              </div>
              {acq.deliveredAt && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Delivered</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {new Date(acq.deliveredAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {acq.completedAt && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Completed</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {new Date(acq.completedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Package</p>
                <p className="text-sm font-semibold text-on-surface">
                  {acq.package.name}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Price</p>
                <p className="text-sm font-semibold text-on-surface">
                  {format(acq.package.price)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Delivery Time</p>
                <p className="text-sm font-semibold text-on-surface">
                  {acq.package.deliveryDays} days
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-400">
                  {isProvider ? "NGO" : "Provider"}
                </p>
                <p className="text-sm font-semibold text-on-surface">
                  {isProvider
                    ? acq.project.ngo.ngoInfo?.ngoName ||
                      acq.project.ngo.name ||
                      acq.project.ngo.email
                    : acq.service.provider.name || acq.service.provider.email}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Project</p>
                <p className="text-sm font-semibold text-on-surface">
                  {acq.project.title}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Category</p>
                <p className="text-sm font-semibold text-on-surface">
                  {acq.service.category}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Deliver Modal */}
      {showDeliverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">Deliver Work</h3>
            <p className="text-sm text-gray-500">
              Add a note describing what you&apos;ve completed.
            </p>
            <textarea
              value={deliveryMessage}
              onChange={(e) => setDeliveryMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
              placeholder="Describe what you've completed..."
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeliverModal(false)}
                className="flex-1 py-2 border text-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction("deliver", deliveryMessage)}
                disabled={actionLoading}
                className="flex-1 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
              >
                {actionLoading ? "..." : "Submit Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">Request Revision</h3>
            <p className="text-sm text-gray-500">
              Describe what needs to be changed.
            </p>
            <textarea
              value={revisionMessage}
              onChange={(e) => setRevisionMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
              placeholder="What needs to be revised?"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="flex-1 py-2 border text-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction("revision", revisionMessage)}
                disabled={actionLoading}
                className="flex-1 py-2 bg-amber-600 text-white rounded-lg disabled:opacity-50"
              >
                {actionLoading ? "..." : "Request Revision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
