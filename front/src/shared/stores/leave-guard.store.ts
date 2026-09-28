import { create } from "zustand";

/**
 * La garde de sortie d'un écran qui perdrait une saisie en partant. Armée, elle
 * retient la destination d'un lien du bandeau au lieu de s'y rendre : l'écran
 * demande alors confirmation, puis y mène lui-même.
 *
 * Un store et non `useBlocker` : celui-ci exige un data router, l'application
 * tourne sous `BrowserRouter`.
 */
interface LeaveGuardState {
  isArmed: boolean;
  /** La destination qui attend confirmation ; `null` : aucune demande en cours. */
  pendingTo: string | null;
  arm: () => void;
  disarm: () => void;
  request: (to: string) => void;
  cancel: () => void;
}

export const useLeaveGuardStore = create<LeaveGuardState>((set) => ({
  isArmed: false,
  pendingTo: null,
  arm: () => set({ isArmed: true }),
  disarm: () => set({ isArmed: false, pendingTo: null }),
  request: (to) => set({ pendingTo: to }),
  cancel: () => set({ pendingTo: null }),
}));
