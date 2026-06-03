"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { StatusMessage } from "@/app/components/ui/status-message";
import { authClient } from "@/app/lib/auth-client";

interface Chat {
  id: string;
  serviceAcquisition: {
    id: string;
    status: string;
    revisionsUsed: number;
    service: { name: string; providerId: string };
    project: { title: string; ngoId: string };
    package: { name: string; price: number; revisions: number };
  };
  messages: { content: string; createdAt: string }[];
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [toastMessage, setToastMessage] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }

    const loadChats = () =>
      fetch("/api/chat")
        .then((r) => r.json())
        .then((data) => {
          setChats(data);
          setLoading(false);
          if (data.length > 0 && !activeChat) {
            setActiveChat(data[0].id);
          }
        });

    loadChats();
    const interval = setInterval(loadChats, 3000);
    return () => clearInterval(interval);
  }, [session, isPending, router, activeChat]);

  useEffect(() => {
    if (!activeChat) return;

    const loadMessages = () =>
      fetch(`/api/chat/${activeChat}`)
        .then((r) => r.json())
        .then((data) => setMessages(data));

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessage = async () => {
    if (!activeChat || !newMessage.trim()) return;

    setSending(true);
    const res = await fetch(`/api/chat/${activeChat}`, {
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
      setToastMessage({
        type: "error",
        message: data.error || "Unable to send message",
      });
    }
  };

  const handleDeliver = async () => {
    const chat = chats.find((c) => c.id === activeChat);
    if (!chat) return;

    setActionLoading(true);
    const res = await fetch(`/api/services/${chat.serviceAcquisition.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deliver", message: deliveryMessage }),
    });
    setActionLoading(false);

    if (res.ok) {
      setShowDeliverModal(false);
      setDeliveryMessage("");
      setToastMessage({
        type: "success",
        message: "Delivery message sent successfully.",
      });
      fetch("/api/chat")
        .then((r) => r.json())
        .then(setChats);
    } else {
      const data = await res.json().catch(() => ({}));
      setToastMessage({
        type: "error",
        message: data.error || "Delivery failed",
      });
    }
  };

  const handleAccept = async () => {
    const chat = chats.find((c) => c.id === activeChat);
    if (!chat) return;

    setActionLoading(true);
    const res = await fetch(`/api/services/${chat.serviceAcquisition.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    setActionLoading(false);

    if (res.ok) {
      fetch("/api/chat")
        .then((r) => r.json())
        .then(setChats);
    }
  };

  const handleRevision = async () => {
    const chat = chats.find((c) => c.id === activeChat);
    if (!chat) return;

    setActionLoading(true);
    const res = await fetch(`/api/services/${chat.serviceAcquisition.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revision", message: revisionMessage }),
    });
    setActionLoading(false);

    if (res.ok) {
      setShowRevisionModal(false);
      setRevisionMessage("");
      setToastMessage({
        type: "success",
        message: "Revision request sent successfully.",
      });
      fetch("/api/chat")
        .then((r) => r.json())
        .then(setChats);
    } else {
      const data = await res.json().catch(() => ({}));
      setToastMessage({
        type: "error",
        message: data.error || "Revision request failed",
      });
    }
  };

  const activeChatData = chats.find((c) => c.id === activeChat);
  const isProvider =
    activeChatData?.serviceAcquisition.service.providerId === session?.user?.id;
  const isNgo =
    activeChatData?.serviceAcquisition.project.ngoId === session?.user?.id;
  const acqStatus = activeChatData?.serviceAcquisition.status;

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
      <main className="min-h-screen bg-surface py-12 px-8">
        <div className="max-w-5xl mx-auto h-[calc(100vh-150px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex">
          {/* Chat List */}
          <div className="w-80 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-on-surface">Chats</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No active chats yet.
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => setActiveChat(chat.id)}
                    className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      activeChat === chat.id ? "bg-violet-50" : ""
                    }`}
                  >
                    <p className="font-medium text-sm text-on-surface">
                      {chat.serviceAcquisition.service.name}
                      <span className="text-primary">
                        {" "}
                        — {chat.serviceAcquisition.package.name}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {chat.serviceAcquisition.project.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          chat.serviceAcquisition.status === "DELIVERED"
                            ? "bg-blue-100 text-blue-700"
                            : chat.serviceAcquisition.status === "COMPLETED"
                              ? "bg-violet-100 text-violet-700"
                              : chat.serviceAcquisition.status ===
                                  "REVISION_REQUESTED"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {chat.serviceAcquisition.status === "ACTIVE"
                          ? "In Progress"
                          : chat.serviceAcquisition.status === "DELIVERED"
                            ? "Delivered"
                            : chat.serviceAcquisition.status ===
                                "REVISION_REQUESTED"
                              ? "Revision"
                              : chat.serviceAcquisition.status === "COMPLETED"
                                ? "Completed"
                                : chat.serviceAcquisition.status}
                      </span>
                    </div>
                    {chat.messages[0] && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {chat.messages[0].content}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {activeChatData ? (
              <>
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-on-surface">
                        {activeChatData.serviceAcquisition.service.name}
                        <span className="text-primary text-sm font-normal">
                          {" "}
                          — {activeChatData.serviceAcquisition.package.name}
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500">
                        Project:{" "}
                        {activeChatData.serviceAcquisition.project.title}
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
                      {acqStatus === "ACTIVE"
                        ? "In Progress"
                        : acqStatus === "DELIVERED"
                          ? "Delivered"
                          : acqStatus === "REVISION_REQUESTED"
                            ? "Revision Requested"
                            : acqStatus === "COMPLETED"
                              ? "Completed"
                              : acqStatus}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
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
                          onClick={handleAccept}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-emerald-600 text-white font-medium rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                        >
                          ✓ Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRevisionModal(true)}
                          disabled={
                            actionLoading ||
                            activeChatData.serviceAcquisition.revisionsUsed >=
                              activeChatData.serviceAcquisition.package
                                .revisions
                          }
                          className="px-3 py-1.5 border border-amber-300 text-amber-700 font-medium rounded-lg text-sm hover:bg-amber-50 disabled:opacity-50"
                        >
                          🔄 Revision (
                          {activeChatData.serviceAcquisition.package.revisions -
                            activeChatData.serviceAcquisition
                              .revisionsUsed}{" "}
                          left)
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a chat to start messaging
              </div>
            )}
          </div>
        </div>

        {/* Deliver Modal */}
        {showDeliverModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold">Deliver Work</h3>
              <p className="text-sm text-gray-500">
                Add a note describing what you&apos;ve delivered.
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
    </>
  );
}
