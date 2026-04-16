import { create } from "zustand";

export const useChatStore = create((set) => ({
  selectedChatId: null,
  setSelectedChatId: (id: string) => set({ selectedChatId: id }),
}));