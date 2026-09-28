import type { MouseEvent } from "react";
import { useLeaveGuardStore } from "@/shared/stores/leave-guard.store";

/** Suivre un lien du bandeau : `to` est sa destination. */
export type FollowHandler = (event: MouseEvent<HTMLAnchorElement>, to: string) => void;

const PRIMARY_BUTTON = 0;
const MODIFIER_KEYS = ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const;

/**
 * Les liens du bandeau passent par la garde de sortie : armée, elle retient la
 * destination au lieu d'y aller. Désarmée, le lien suit son cours.
 */
export function useGuardedFollow(): FollowHandler {
  const isArmed = useLeaveGuardStore((state) => state.isArmed);
  const request = useLeaveGuardStore((state) => state.request);

  return (event, to) => {
    if (!isArmed || !isPlainClick(event)) return;

    event.preventDefault();
    request(to);
  };
}

/** Un clic modifié ouvre un autre onglet : la saisie en cours ne risque rien. */
function isPlainClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  if (event.button !== PRIMARY_BUTTON) return false;

  return !MODIFIER_KEYS.some((key) => event[key]);
}
