import { useEffect } from "react";
import { useLeaveGuardStore } from "@/shared/stores/leave-guard.store";

export interface LeaveGuard {
  /** La destination qui attend confirmation ; `null` : la modale est fermée. */
  pendingTo: string | null;
  onRequest: (to: string) => void;
  onCancel: () => void;
}

/**
 * Tant que la modale de sortie est montée, la garde est armée : les liens du
 * bandeau lui confient leur destination, la modale demande confirmation.
 */
export function useLeaveGuard(): LeaveGuard {
  const arm = useLeaveGuardStore((state) => state.arm);
  const disarm = useLeaveGuardStore((state) => state.disarm);
  const pendingTo = useLeaveGuardStore((state) => state.pendingTo);
  const onRequest = useLeaveGuardStore((state) => state.request);
  const onCancel = useLeaveGuardStore((state) => state.cancel);

  useEffect(() => {
    arm();
    return disarm;
  }, [arm, disarm]);

  return { pendingTo, onRequest, onCancel };
}
