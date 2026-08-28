import { io } from "socket.io-client";

const SOCKET_PATH = "/api/socket.io";

export const realtimeClient = io({
  path: SOCKET_PATH,
  transports: ["websocket"],
  withCredentials: true,
  autoConnect: false,
});
