"use client";

import { useEffect } from "react";
import {
  connectToBoard,
  getSocket,
  requestFullState,
  subscribeFullState,
} from "@/lib/socket-client";
import { useScoreboardStore } from "@/store/useScoreboardStore";

export function BoardSocketProvider({
  boardId,
  children,
}: {
  boardId: string;
  children: React.ReactNode;
}) {
  const setFullState = useScoreboardStore((s) => s.setFullState);
  const setConnected = useScoreboardStore((s) => s.setConnected);

  useEffect(() => {
    connectToBoard(boardId);
    const socket = getSocket();
    const onConnect = () => {
      setConnected(true);
      connectToBoard(boardId);
      requestFullState();
    };
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);
    if (socket.connected) {
      connectToBoard(boardId);
    }

    const unsub = subscribeFullState(setFullState);

    return () => {
      unsub();
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [boardId, setFullState, setConnected]);

  return <>{children}</>;
}
