"use client";

import { useRef } from "react";

interface MessageInputProps {
  text: string;
  setText: (text: string) => void;
  sendMessage: () => void;
  handleTyping: () => void;
  loading: boolean;
}

export default function MessageInput({
  text,
  setText,
  sendMessage,
  handleTyping,
  loading,
}: MessageInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    handleTyping();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="flex gap-3">
        <input
          className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          disabled={loading}
        />
        <button
          disabled={!text.trim() || loading}
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold px-6 py-3 rounded-full transition-colors duration-200 flex items-center gap-2 disabled:cursor-not-allowed"
        >
          <span>{loading ? "..." : "Send"}</span>
        </button>
      </div>
    </div>
  );
}
