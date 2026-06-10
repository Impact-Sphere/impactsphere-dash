"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/app/lib/auth-client";

interface SupportChat {
  id: string;
  status: string;
  subject: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    userType: string | null;
  };
  messages?: { content: string; createdAt: string }[];
}

interface SupportMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export default function SupportPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [closing, setClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }

    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setIsAdmin(data.userType === "ADMIN");
      })
      .catch(() => {});

    const loadChats = () =>
      fetch("/api/support-chat")
        .then((r) => r.json())
        .then((data) => {
          const arr = Array.isArray(data) ? data : [];
          setChats(arr);
          setLoading(false);
          if (arr.length > 0 && !activeChat) {
            setActiveChat(arr[0].id);
          }
        })
        .catch(() => setLoading(false));

    loadChats();
    const interval = setInterval(loadChats, 5000);
    return () => clearInterval(interval);
  }, [session, isPending, router, activeChat]);

  useEffect(() => {
    if (!activeChat) return;

    const loadMessages = () =>
      fetch(`/api/support-chat/${activeChat}/messages`)
        .then((r) => r.json())
        .then((data) => setMessages(Array.isArray(data) ? data : []));

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChat]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!activeChat || !newMessage.trim()) return;

    setSending(true);
    const res = await fetch(`/api/support-chat/${activeChat}/messages`, {
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

  const closeChat = async () => {
    if (!activeChat || !isAdmin) return;
    setClosing(true);
    const res = await fetch(`/api/support-chat/${activeChat}`, {
      method: "PUT",
    });
    setClosing(false);

    if (res.ok) {
      setChats((prev) => prev.filter((c) => c.id !== activeChat));
      setActiveChat(null);
      setMessages([]);
    }
  };

  const startNewChat = async () => {
    const res = await fetch("/api/support-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: "General support" }),
    });

    if (res.ok) {
      const chat = await res.json();
      if (chat?.id) {
        setChats((prev) => [chat, ...prev]);
        setActiveChat(chat.id);
      }
    }
  };

  const activeChatData = chats.find((c) => c.id === activeChat);

    if (isPending || loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-surface py-12 px-8">
      <div className="max-w-5xl mx-auto h-[calc(100dvh-150px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex">
        {/* Chat List */}
        <div className="w-80 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-on-surface">
              {isAdmin ? "Support Tickets" : "Contact ImpactSphere"}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm space-y-3">
                <p>No active support chats.</p>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={startNewChat}
                    className="px-4 py-2 bg-primary text-white font-medium rounded-lg text-sm hover:bg-primary/90 transition-colors"
                  >
                    Start New Chat
                  </button>
                )}
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
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-on-surface">
                      {isAdmin
                        ? chat.user?.name || chat.user?.email || "Unknown"
                        : chat.subject || "Support Chat"}
                    </p>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        chat.status === "OPEN"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {chat.status}
                    </span>
                  </div>
                  {isAdmin && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {chat.user?.email}
                    </p>
                  )}
                  {chat.messages?.[0] && (
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
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-on-surface">
                    {isAdmin
                      ? activeChatData.user?.name ||
                        activeChatData.user?.email ||
                        "Support Chat"
                      : activeChatData.subject || "ImpactSphere Support"}
                  </h3>
                  {isAdmin && activeChatData.user && (
                    <p className="text-xs text-gray-500">
                      {activeChatData.user.userType} ·{" "}
                      {activeChatData.user.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      activeChatData.status === "OPEN"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {activeChatData.status}
                  </span>
                  {isAdmin && activeChatData.status === "OPEN" && (
                    <button
                      type="button"
                      onClick={closeChat}
                      disabled={closing}
                      className="px-3 py-1.5 border border-gray-200 text-gray-600 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {closing ? "..." : "Close"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-8">
                    {isAdmin
                      ? "No messages yet. This user is waiting for your response."
                      : "Welcome to ImpactSphere support! Describe your question and our team will get back to you."}
                  </div>
                )}
                {messages.map((msg) => {
                  const isMe = msg.senderId === session?.user.id;
                  const isAdminMsg =
                    isAdmin && msg.senderId !== session?.user.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                          isMe
                            ? "bg-primary text-white rounded-br-none"
                            : isAdminMsg
                              ? "bg-gray-100 text-on-surface rounded-bl-none"
                              : "bg-violet-50 text-violet-900 rounded-bl-none border border-violet-100"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMe ? "text-white/70" : "text-gray-400"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={
                      activeChatData.status === "CLOSED"
                        ? "This chat is closed"
                        : "Type a message..."
                    }
                    disabled={activeChatData.status === "CLOSED"}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={
                      sending ||
                      !newMessage.trim() ||
                      activeChatData.status === "CLOSED"
                    }
                    className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center space-y-3">
                <p>
                  {chats.length === 0
                    ? isAdmin
                      ? "No open support tickets."
                      : "Start a chat to contact ImpactSphere support."
                    : "Select a chat to view messages."}
                </p>
                {!isAdmin && chats.length === 0 && (
                  <button
                    type="button"
                    onClick={startNewChat}
                    className="px-4 py-2 bg-primary text-white font-medium rounded-lg text-sm hover:bg-primary/90 transition-colors"
                  >
                    Start New Chat
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
