"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  chat_id: string;
  seen?: boolean;
}

interface MessageListProps {
  selectedChatId: string | null;
  userId: string | null;
  isTyping: boolean;
}

const PAGE_SIZE = 20;

export default function MessageList({
  selectedChatId,
  userId,
  isTyping,
}: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [oldestTime, setOldestTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesLengthRef = useRef(0);

  // ✅ Auto-scroll ONLY when new messages are added (not on scroll)
  useEffect(() => {
    if (!messagesEndRef.current) return;
    if (messages.length > messagesLengthRef.current) {
      // Only scroll if new messages were added
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    messagesLengthRef.current = messages.length;
  }, [messages.length]);

  // ✅ Load more older messages when scrolled to top
  const loadMore = async (container: HTMLDivElement) => {
    if (!selectedChatId || !oldestTime || isLoading) return;

    setIsLoading(true);
    const scrollHeightBefore = container.scrollHeight;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", selectedChatId)
      .lt("created_at", oldestTime)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data?.length) {
      const newMessages = (data as Message[]).reverse();
      setMessages((prev) => [...newMessages, ...prev]);
      setOldestTime(newMessages[0].created_at);

      // ✅ Preserve scroll position
      setTimeout(() => {
        container.scrollTop = container.scrollHeight - scrollHeightBefore;
      }, 0);
    }

    setIsLoading(false);
  };

  // ✅ Initial fetch - latest messages first, reversed for display
  const fetchMessages = async () => {
    if (!selectedChatId) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", selectedChatId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data?.length) {
      const reversed = (data as Message[]).reverse();
      setMessages(reversed);
      setOldestTime(reversed[0].created_at); // oldest message
    } else {
      setMessages([]);
      setOldestTime(null);
    }
  };

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      setOldestTime(null);
      messagesLengthRef.current = 0;
      return;
    }

    fetchMessages();

    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChatId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.find((m) => m.id === payload.new.id);
            return exists ? prev : [...prev, payload.new as Message];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId]);

  // ✅ Scroll trigger for infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop === 0 && !isLoading && oldestTime) {
      loadMore(container);
    }
  };

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950"
    >
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Loading older messages...
          </div>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-500 dark:text-slate-400">
            Start the conversation
          </p>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.user_id === userId ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl shadow-sm transition-all ${
                msg.user_id === userId
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none"
              }`}
            >
              <div className="break-words">{msg.content}</div>
              <div
                className={`text-xs mt-2 flex items-center gap-1 ${
                  msg.user_id === userId
                    ? "text-blue-100"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <span>
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {msg.user_id === userId && (
                  <span>{msg.seen ? "✓✓" : "✓"}</span>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {isTyping && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
          <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
            Someone is typing...
          </span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
