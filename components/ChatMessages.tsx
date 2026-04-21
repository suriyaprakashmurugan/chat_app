"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  chat_id: string;
}

interface ChatMessagesProps {
  selectedChatId: string | null;
  userId: string | null;
  isTyping: boolean;
}

export default function ChatMessages({
  selectedChatId,
  userId,
  isTyping,
}: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [oldestTime, setOldestTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMore = async () => {
    if (!selectedChatId || !oldestTime || isLoading) return;

    setIsLoading(true);
    const container = messagesContainerRef.current;
    if (!container) {
      setIsLoading(false);
      return;
    }

    const scrollHeightBefore = container.scrollHeight;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", selectedChatId)
      .lt("created_at", oldestTime)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data?.length) {
      const reversedData = (data as Message[]).reverse();
      setMessages((prev) => {
        // Filter out any messages that already exist to prevent duplicates
        const newMessages = reversedData.filter(
          (newMsg) => !prev.some((existingMsg) => existingMsg.id === newMsg.id)
        );
        return [...newMessages, ...prev];
      });
      // Update oldest time to the oldest of the newly loaded messages
      setOldestTime(reversedData[0].created_at);

      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - scrollHeightBefore;
        }
      }, 0);
    }

    setIsLoading(false);
  };

  const fetchMessages = async () => {
    if (!selectedChatId) return;

    const PAGE_SIZE = 20;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", selectedChatId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data?.length) {
      const reversedData = (data as Message[]).reverse();
      setMessages(reversedData);
      // Track the oldest message (at index 0 after reverse)
      setOldestTime(reversedData[0].created_at);
    } else {
      setMessages([]);
      setOldestTime(null);
    }
  };

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      setOldestTime(null);
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop === 0 && !isLoading && oldestTime) {
      loadMore();
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
                className={`text-xs mt-2 ${
                  msg.user_id === userId
                    ? "text-blue-100"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
