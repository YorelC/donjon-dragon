import { useCallback, useEffect } from "react";
import { useWebSocket } from "@/shared/hooks/use-websocket";
import { WS_NAMESPACES } from "@/shared/constants/api-routes";
import { useCombatStore } from "../stores/combat.store";
import type { RollDicePayload, RollDiceResult } from "../queries/use-dice";
import type { Combatant } from "../types/combat-schema";

type Advantage = "none" | "advantage" | "disadvantage";

export function useCombat(roomId: string) {
  const { socket } = useWebSocket(WS_NAMESPACES.combat);
  const { setCurrentCombat, clearCombat } = useCombatStore();

  useEffect(() => {
    if (!socket) return;
    socket.on("combat:state", setCurrentCombat);
    return () => {
      socket.off("combat:state", setCurrentCombat);
    };
  }, [socket, setCurrentCombat]);

  const startCombat = useCallback(
    (participantIds: Combatant[]) => {
      socket?.emit("combat:start", { roomId, participantIds });
    },
    [socket, roomId],
  );

  const rollDice = useCallback(
    (payload: RollDicePayload) =>
      new Promise<RollDiceResult>((resolve) => socket?.emit("combat:roll", payload, resolve)),
    [socket],
  );

  const attack = useCallback(
    (combatId: string, attackerId: string, targetId: string, attackRoll: number, advantage: Advantage = "none") => {
      socket?.emit("combat:attack", { combatId, attackerId, targetId, attackRoll, advantage });
    },
    [socket],
  );

  const nextTurn = useCallback(
    (combatId: string) => {
      socket?.emit("combat:next-turn", { combatId });
    },
    [socket],
  );

  const endCombat = useCallback(
    (combatId: string) => {
      socket?.emit("combat:end", { combatId });
      clearCombat();
    },
    [socket, clearCombat],
  );

  return { startCombat, rollDice, attack, nextTurn, endCombat };
}
