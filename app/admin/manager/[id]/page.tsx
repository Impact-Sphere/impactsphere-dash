"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import { useCurrency } from "@/app/components/currency/currency-context";

interface Workroom {
  id: string;
  serviceAcquisition: {
    id: string;
    status: string;
    revisionsUsed: number;
    deliveredAt: string | null;
    completedAt: string | null;
    service: {
      name: string;
      providerId: string;
      provider: { name: string | null; email: string };
    };
    project: {
      title: string;
      ngoId: string;
      ngo: { name: string | null; email: string; ngoInfo: { ngoName: string } | null };
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
  DELIVERED: "Delivered",
  REVISION_REQUESTED: "Revision Requested",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function AdminWorkroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { format } = useCurrency();
  const { data: session, isPending } = authClient.useSession();
  const [chatId, setChatId] = useState<string | null>(null);
  const [workroom, setWorkroom] = useState<Workroom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then(({ id }) => setChatId(id));
  }, [params]);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (!chatId) return;

    let chatInterval: ReturnType<typeof setInterval> | null = null;
    let messageInterval: ReturnType<typeof setInterval> | null = null;

    const loadWorkroom = () =>
      fetch(`/api/workroom/${chatId}`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Workroom not found");
          }
          return res.json();
        })
        .then((data: Workroom) => {
          setWorkroom(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Workroom not found");
          setLoading(false);
        });

    const loadMessages = () =>
      fetch(`/api/chat/${chatId}`)
        .then((r) => r.json())
        .then((data: Message[]) => setMessages(data));

    loadWorkroom();
    loadMessages();
    chatInterval = setInterval(loadWorkroom, 3000);
    messageInterval = setInterval(loadMessages, 3000);

    return () => {
      if (chatInterval) clearInterval(chatInterval);
      if (messageInterval) clearInterval(messageInterval);
    };
  }, [session, isPending, router, chatId]);

  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Unable to send message");
    }
  };

  const handleDeliver = async () => {
    if (!workroom) return;

    setActionLoading(true);
    const res = await fetch(
      `/api/services/${workroom.serviceAcquisition.id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deliver", message: deliveryMessage }),
      },
    );
    setActionLoading(false);

    if (res.ok) {
      setShowDeliverModal(false);
      setDeliveryMessage("");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Delivery failed");
    }
  };

  const handleAccept = async () => {
    if (!workroom) return;

    setActionLoading(true);
    const res = await fetch(
      `/api/services/${workroom.serviceAcquisition.id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      },
    );
    setActionLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Accept failed");
    }
  };

  const handleRevision = async () => {
    if (!workroom) return;

    setActionLoading(true);
    const res = await fetch(
      `/api/services/${workroom.serviceAcquisition.id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revision", message: revisionMessage }),
      },
    );
    setActionLoading(false);

    if (res.ok) {
      setShowRevisionModal(false);
      setRevisionMessage("");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Revision request failed");
    }
  };

  if (isPending || loading) {
    return (
      <main className="ml-72 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="ml-72 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500">{error}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  if (!workroom) {
    return null;
  }

  const acq = workroom.serviceAcquisition;
  const isProvider = acq.service.providerId === session?.user?.id;
  const isNgo = acq.project.ngoId === session?.user?.id;
  const canMessage = isProvider || isNgo;
  const acqStatus = acq.status || "ACTIVE";
  const statusLabel = STATUS_LABELS[acqStatus] || acqStatus;
  const revisionsLeft = useMemo(() => {
    return Math.max(0, acq.package.revisions - acq.revisionsUsed);
  }, [acq.package.revisions, acq.revisionsUsed]);
  const spendLabel =
    acqStatus === "DELIVERED" || acqStatus === "COMPLETED"
      ? "Spent from donations"
      : "Due on delivery";

  return (
    <main className="ml-72 min-h-screen bg-surface py-10 px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-on-surface">Workroom</h1>
            <p className="text-sm text-gray-500">
              Chat, deliver work, and handle revisions for this service.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Back
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex h-[calc(100vh-220px)]">
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-on-surface">
                    {acq.service.name}
                    <span className="text-primary text-sm font-normal">
                      {" "}- {acq.package.name}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Project: {acq.project.title}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    acqStatus === "DELIVERED"
                      ? "bg-blue-100 text-blue-700"
                      : acqStatus === "COMPLETED"
                        ? "bg-violet-100 text-violet-700"
                        : acqStatus === "REVISION_REQUESTED"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {isProvider &&
                  (acqStatus === "ACTIVE" ||
                    acqStatus === "REVISION_REQUESTED") && (
                    <button
                      type="button"
                      onClick={() => setShowDeliverModal(true)}
                      className="px-3 py-1.5 bg-primary text-white font-medium rounded-lg text-sm hover:bg-primary/90"
                    >
                      Deliver Work
                    </button>
                  )}
                {isNgo && acqStatus === "DELIVERED" && (
                  <>
                    <button
                      type="button"
                      onClick={handleAccept}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-medium rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRevisionModal(true)}
                      disabled={actionLoading || revisionsLeft === 0}
                      className="px-3 py-1.5 border border-amber-300 text-amber-700 font-medium rounded-lg text-sm hover:bg-amber-50 disabled:opacity-50"
                    >
                      Request Revision ({revisionsLeft} left)
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderId === session?.user.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
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
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100">
              {!canMessage && (
                <p className="text-xs text-gray-400 mb-2">
                  You have read-only access to this workroom.
                </p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={canMessage ? "Type a message..." : "Read-only"}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={!canMessage}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim() || !canMessage}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {sending ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>

          <aside className="w-80 border-l border-gray-100 bg-slate-50 p-4 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-on-surface">
                Delivery Summary
              </h3>
              <p className="text-xs text-gray-500">
                Track status, revisions, and donation spend.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
              <p className="text-xs text-gray-400">Status</p>
              <p className="text-sm font-semibold text-on-surface">
                {statusLabel}
              </p>
              <p className="text-xs text-gray-400">Revisions</p>
              <p className="text-sm font-semibold text-on-surface">
                {acq.revisionsUsed} used, {revisionsLeft} left
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
              <p className="text-xs text-gray-400">Donation spend</p>
              <p className="text-sm font-semibold text-on-surface">
                {format(acq.package.price)}
              </p>
              <p className="text-xs text-gray-500">{spendLabel}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
              <p className="text-xs text-gray-400">Project</p>
              <p className="text-sm font-semibold text-on-surface">
                {acq.project.ngo.ngoInfo?.ngoName ||
                  acq.project.ngo.name ||
                  acq.project.ngo.email}
              </p>
              <p className="text-xs text-gray-400">Service</p>
              <p className="text-sm font-semibold text-on-surface">
                {acq.service.name}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {showDeliverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">Deliver Work</h3>
            <p className="text-sm text-gray-500">
              Add a note describing what you have delivered.
            </p>
            <textarea
              value={deliveryMessage}
              onChange={(e) => setDeliveryMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
              placeholder="Describe what you have completed..."
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
                onClick={handleDeliver}
                disabled={actionLoading}
                className="flex-1 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
              >
                {actionLoading ? "..." : "Submit Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                onClick={handleRevision}
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
