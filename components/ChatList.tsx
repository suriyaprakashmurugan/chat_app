// /components/ChatList.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatList({ onSelect }: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatDetails, setChatDetails] = useState<
    Record<string, { lastMessage: string; lastMessageTime: string; unreadCount: number }>
  >({});

  useEffect(() => {
    const fetchChats = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

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

      // ✅ Fetch last message and unread count for each chat
      for (const chatId of chatIds) {
        // Get last message
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: false })
          .limit(1);

        // Get unread count
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("chat_id", chatId)
          .eq("seen", false)
          .neq("user_id", user?.id);

        setChatDetails((prev) => ({
          ...prev,
          [chatId]: {
            lastMessage: lastMsg?.[0]?.content || "No messages yet",
            lastMessageTime: lastMsg?.[0]?.created_at || "",
            unreadCount: unreadCount || 0,
          },
        }));
      }
    };

    fetchChats();
  }, []);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
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
            {chats.map((chat: any) => {
              const details = chatDetails[chat.id];
              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-start gap-3 ${
                    selectedChatId === chat.id
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 mt-1">
                    {(chat.name || "DC")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">
                        {chat.name || "Direct Chat"}
                      </p>
                      {details?.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                          {details.unreadCount}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs truncate ${
                        selectedChatId === chat.id
                          ? "text-blue-100"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {details?.lastMessage || "No messages yet"}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        selectedChatId === chat.id
                          ? "text-blue-100"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {details?.lastMessageTime
                        ? formatTime(details.lastMessageTime)
                        : ""}
                    </p>
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
