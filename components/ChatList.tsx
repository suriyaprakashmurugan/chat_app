// /components/ChatList.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: string;
  content: string;
  created_at: string;
  chat_id: string;
  user_id: string;
  seen_at?: string | null;
}

// ✅ Helper: Fetch last message per chat
const fetchLastMessages = async (chatIds: string[]) => {
  const results: Record<string, Message> = {};

  for (const chatId of chatIds) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      results[chatId] = data;
    }
  }

  return results;
};

// ✅ Helper: Fetch unread count per chat
const fetchUnreadCounts = async (chatIds: string[], userId: string) => {
  const counts: Record<string, number> = {};

  for (const chatId of chatIds) {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("chat_id", chatId)
      .neq("user_id", userId)
      .is("seen_at", null);

    counts[chatId] = count || 0;
  }

  return counts;
};

export default function ChatList({ onSelect }: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Fetch initial chats and metadata
  useEffect(() => {
    const fetchChats = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      setUserId(user.id);

      const { data: members } = await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("user_id", user.id);

      const chatIds = members?.map((m) => m.chat_id) || [];

      if (!chatIds.length) return;

      const { data: chatsData } = await supabase
        .from("chats")
        .select("*")
        .in("id", chatIds);

      setChats(chatsData || []);

      // Fetch last messages and unread counts
      const lastMsgs = await fetchLastMessages(chatIds);
      const unreadCnts = await fetchUnreadCounts(chatIds, user.id);

      setLastMessages(lastMsgs);
      setUnreadCounts(unreadCnts);
    };

    fetchChats();
  }, []);

  // ✅ Real-time subscription for new messages
  useEffect(() => {
    if (!userId) return;

    // Helper to refetch unread count for a specific chat
    const refetchUnreadCount = async (chatId: string) => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("chat_id", chatId)
        .neq("user_id", userId)
        .is("seen_at", null);

      setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: count || 0,
      }));
    };

    const channel = supabase
      .channel("chat-list-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          const chatId = newMsg?.chat_id;
          if (!chatId) return;

          if (payload.eventType === "INSERT") {
            // ✅ Update last message
            setLastMessages((prev) => ({
              ...prev,
              [chatId]: newMsg,
            }));

            // ✅ Update unread count (only if not sent by current user)
            if (newMsg.user_id !== userId) {
              setUnreadCounts((prev) => ({
                ...prev,
                [chatId]: (prev[chatId] || 0) + 1,
              }));
            }
          }

          if (payload.eventType === "UPDATE") {
            // ✅ Update seen status (for read receipts)
            setLastMessages((prev) => ({
              ...prev,
              [chatId]: newMsg,
            }));

            // ✅ If seen_at was updated, refetch the unread count for accuracy
            if (newMsg?.seen_at) {
              refetchUnreadCount(chatId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    // ✅ Optimistic update: clear unread count when selecting chat
    // It will be marked as seen by ChatPage effect
    setUnreadCounts((prev) => ({
      ...prev,
      [chatId]: 0,
    }));
    onSelect(chatId);
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 h-screen overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Chats
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {chats.length} conversation{chats.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-slate-500 dark:text-slate-400">No chats yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {chats.map((chat) => {
              const lastMsg = lastMessages[chat.id];
              const unread = unreadCounts[chat.id] || 0;

              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-start justify-between gap-3 ${
                    selectedChatId === chat.id
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {/* Left side: Avatar + Chat info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 mt-1">
                      {(chat.name || "DC")[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {chat.name || "Direct Chat"}
                      </p>

                      <p
                        className={`text-xs truncate ${
                          selectedChatId === chat.id
                            ? "text-blue-100"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {lastMsg?.content || "No messages yet"}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Time + Unread badge */}
                  <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                    {lastMsg && (
                      <p
                        className={`text-xs ${
                          selectedChatId === chat.id
                            ? "text-blue-100"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {formatTime(lastMsg.created_at)}
                      </p>
                    )}

                    {unread > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        {unread}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
