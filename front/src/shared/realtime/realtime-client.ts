import { io, type Socket } from "socket.io-client";

const SOCKET_PATH = "/api/socket.io";

/**
 * Le type est annoté explicitement : sans lui, TypeScript doit nommer le type
 * inféré en traversant l'arborescence pnpm de `@socket.io/component-emitter`,
 * chemin non portable qu'il refuse d'écrire (TS2742).
 */
export const realtimeClient: Socket = io({
  path: SOCKET_PATH,
  transports: ["websocket"],
  withCredentials: true,
  autoConnect: false,
});
