import { create } from "zustand";
import type { SortOrder } from "../types";

interface FilterState {
  activeTags: string[];
  sortOrder: SortOrder;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  clearTags: () => void;
  setSortOrder: (order: SortOrder) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  activeTags: [],
  sortOrder: "epoch_desc",
  addTag: (tag) =>
    set((s) =>
      s.activeTags.includes(tag)
        ? s
        : { activeTags: [...s.activeTags, tag] }
    ),
  removeTag: (tag) =>
    set((s) => ({ activeTags: s.activeTags.filter((t) => t !== tag) })),
  clearTags: () => set({ activeTags: [] }),
  setSortOrder: (order) => set({ sortOrder: order }),
}));
