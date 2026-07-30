import { useMutation } from "@tanstack/react-query";
import { useWebSocket } from "@/shared/hooks/use-websocket";
import { WS_NAMESPACES } from "@/shared/constants/api-routes";
import type { DiceType } from "../types/combat-schema";

export interface RollDicePayload {
  diceType: DiceType;
  count: number;
  modifier: number;
}

export interface RollDiceResult {
  die: DiceType;
  count: number;
  modifier: number;
  rolls: number[];
  rawTotal: number;
  total: number;
}

export function useRollDice() {
  const { socket } = useWebSocket(WS_NAMESPACES.combat);

  return useMutation({
    mutationFn: (payload: RollDicePayload) =>
      new Promise<RollDiceResult>((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket non connecté"));
          return;
        }
        socket.emit("combat:roll", payload, resolve);
      }),
  });
}
