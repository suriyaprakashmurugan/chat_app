// /components/ChatList.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatList({ onSelect }: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      console.log("USER:", user?.id);

      const { data: members, error: mError } = await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("user_id", user?.id);

      const chatIds = members?.map((m) => m.chat_id);

      if (!chatIds?.length) return;

      const { data: chats, error: cError } = await supabase
        .from("chats")
        .select("*")
        .in("id", chatIds);

      setChats(chats || []);
    };

    fetchChats();
  }, []);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    onSelect(chatId);
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
            {chats.map((chat: any) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  selectedChatId === chat.id
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
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
                    Click to open
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
