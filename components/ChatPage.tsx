"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ChatList from "@/components/ChatList";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchMessages = async () => {
    if (!selectedChatId) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", selectedChatId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const { error } = await supabase.from("messages").insert({
      content: text,
      user_id: currentUserId,
      chat_id: selectedChatId,
    });

    if (!error) {
      setText("");
    }
  };

  useEffect(() => {
    if (!selectedChatId) return;

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
          setMessages((prev) => [...prev, payload.new]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId]);

  useEffect(() => {
    const getUser = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      console.log("USER ID:", user?.id);
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  return (
    <div className="flex h-screen">
      <ChatList onSelect={setSelectedChatId} />

      <div className="flex-1 p-5">
        {!selectedChatId ? (
          <p>Select a chat</p>
        ) : (
          <div className="p-5 max-w-lg mx-auto">
            <h2 className="text-xl mb-4">Chat</h2>

            <div className="border h-64 overflow-y-auto p-2 mb-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-2 ${
                    msg.user_id === currentUserId ? "text-right" : "text-left"
                  }`}
                >
                  <span className="inline-block border border-gray-300 p-2 rounded">
                    {msg.content}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                className="border p-2 flex-1"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message"
              />
              <button
                className="bg-blue-500 text-white px-4"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
