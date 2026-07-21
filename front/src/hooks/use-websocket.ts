import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined) ?? "";

export function useWebSocket(namespace: string): { socket: Socket | null; isConnected: boolean } {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const instance = io(`${WS_URL}/${namespace}`, { transports: ["websocket"] });
    instance.on("connect", () => setIsConnected(true));
    instance.on("disconnect", () => setIsConnected(false));
    setSocket(instance);

    return () => {
      instance.disconnect();
    };
  }, [namespace]);

  return { socket, isConnected };
}
