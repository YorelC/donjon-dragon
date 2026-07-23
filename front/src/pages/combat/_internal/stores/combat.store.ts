import { create } from "zustand";
import type { CombatState } from "../types/combat-schema";

interface CombatStoreState {
  currentCombat: CombatState | null;
  setCurrentCombat: (state: CombatState) => void;
  updateCombat: (partial: Partial<CombatState>) => void;
  clearCombat: () => void;
}

export const useCombatStore = create<CombatStoreState>((set) => ({
  currentCombat: null,
  setCurrentCombat: (state) => set({ currentCombat: state }),
  updateCombat: (partial) =>
    set((s) => ({
      currentCombat: s.currentCombat ? { ...s.currentCombat, ...partial } : null,
    })),
  clearCombat: () => set({ currentCombat: null }),
}));
