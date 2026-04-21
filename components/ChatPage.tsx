"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ChatList from "@/components/ChatList";
import MessageList from "@/components/MessageList";
import ChatHeader from "@/components/ChatHeader";
import MessageInput from "@/components/MessageInput";

export default function ChatPage() {
  const [text, setText] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatName, setChatName] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [chats, setChats] = useState<any[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Fetch chats to get chat names
  useEffect(() => {
    const fetchChats = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: members } = await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("user_id", user.id);

      const chatIds = members?.map((m) => m.chat_id);

      if (!chatIds?.length) return;

      const { data: chatsData } = await supabase
        .from("chats")
        .select("*")
        .in("id", chatIds);

      setChats(chatsData || []);
    };

    fetchChats();
  }, []);

  // Update chat name when selected chat changes
  useEffect(() => {
    if (selectedChatId && chats.length > 0) {
      const chat = chats.find((c) => c.id === selectedChatId);
      setChatName(chat?.name || "Chat");
    }
  }, [selectedChatId, chats]);

  // Presence tracking for online users
  useEffect(() => {
    if (!selectedChatId || !userId) return;

    const channel = supabase
      .channel(`presence-${selectedChatId}`)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const onlineUsers = Object.keys(state).length;
        setOnlineCount(onlineUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId, userId]);

  // ✅ Typing indicator (fix: subscribe once, no memory leaks)
  useEffect(() => {
    if (!selectedChatId || !userId) return;

    const channel = supabase.channel("typing-channel");

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (
          payload.payload.chat_id === selectedChatId &&
          payload.payload.user_id !== userId
        ) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 1500);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId, userId]);

  // ✅ Debounced typing (IMPORTANT: prevent spam)
  const handleTyping = async () => {
    if (!selectedChatId || !userId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing event
    await supabase.channel("typing-channel").send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: userId,
        chat_id: selectedChatId,
      },
    });

    // Set timeout to prevent spam (only allow typing every 1 second)
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const sendMessage = async () => {
    if (!text.trim() || !userId || !selectedChatId) return;
    setLoading(true);

    const { error } = await supabase.from("messages").insert({
      content: text,
      user_id: userId,
      chat_id: selectedChatId,
    });

    if (!error) {
      setText("");
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950">
      {/* Sidebar - Chat List */}
      <ChatList onSelect={setSelectedChatId} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedChatId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                No chat selected
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Select a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <ChatHeader
              chatId={selectedChatId}
              chatName={chatName}
              onlineCount={onlineCount}
            />

            {/* Messages Area */}
            <MessageList
              selectedChatId={selectedChatId}
              userId={userId}
              isTyping={isTyping}
            />

            {/* Input Area */}
            <MessageInput
              text={text}
              setText={setText}
              sendMessage={sendMessage}
              handleTyping={handleTyping}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
}
