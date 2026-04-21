"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ChatHeaderProps {
  chatId: string | null;
  chatName: string;
  onlineCount: number;
}

export default function ChatHeader({
  chatId,
  chatName,
  onlineCount,
}: ChatHeaderProps) {
  if (!chatId) return null;

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
            {(chatName || "Chat")[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
              {chatName || "Chat"}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {onlineCount} online
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
