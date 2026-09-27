"use client";

import { useEffect } from "react";
import { getSocket, subscribeFullState } from "@/lib/socket-client";
import { useScoreboardStore } from "@/store/useScoreboardStore";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const setFullState = useScoreboardStore((s) => s.setFullState);
  const setConnected = useScoreboardStore((s) => s.setConnected);

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);

    const unsub = subscribeFullState(setFullState);

    return () => {
      unsub();
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [setFullState, setConnected]);

  return <>{children}</>;
}
