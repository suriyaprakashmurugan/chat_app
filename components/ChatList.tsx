// /components/ChatList.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChatList({ onSelect }: any) {
  const [chats, setChats] = useState<any[]>([]);

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

  return (
    <div className="w-1/3 border-r p-3">
      <h2 className="mb-3 font-bold">Chats</h2>
      {chats.map((chat: any) => (
        <div
          key={chat.id} // ✅ FIX
          className="p-2 border mb-2 cursor-pointer"
          onClick={() => onSelect(chat.id)} // ✅ FIX
        >
          {chat.name || "Direct Chat"} {/* ✅ FIX */}
        </div>
      ))}
    </div>
  );
}
