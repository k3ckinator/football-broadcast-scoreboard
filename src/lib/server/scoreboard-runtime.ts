import "server-only";

import type { Server as SocketIOServer } from "socket.io";
import { formatGameClock, parseGameClock } from "@/lib/game-clock";
import { applyPatch, normalizeScoreboardState } from "@/lib/merge-state";
import { SOCKET_EVENTS } from "@/lib/socket-events";
import type { ScoreboardPatch, ScoreboardState } from "@/lib/types/scoreboard";
import {
  loadBoardState,
  saveBoardState,
  boardExists,
} from "./board-repository";

type BoardRuntime = {
  state: ScoreboardState;
  clockTimer: ReturnType<typeof setInterval> | null;
  saveTimer: ReturnType<typeof setTimeout> | null;
};

const boards = new Map<string, BoardRuntime>();

function getRuntime(boardId: string): BoardRuntime {
  let runtime = boards.get(boardId);
  if (!runtime) {
    const state = loadBoardState(boardId);
    if (!state) {
      throw new Error(`Unknown board: ${boardId}`);
    }
    runtime = { state, clockTimer: null, saveTimer: null };
    boards.set(boardId, runtime);
  }
  return runtime;
}

function schedulePersist(boardId: string, state: ScoreboardState) {
  const runtime = getRuntime(boardId);
  if (runtime.saveTimer) clearTimeout(runtime.saveTimer);
  runtime.saveTimer = setTimeout(() => {
    runtime.saveTimer = null;
    saveBoardState(boardId, state);
  }, 400);
}

export function broadcastBoardState(io: SocketIOServer, boardId: string) {
  const { state } = getRuntime(boardId);
  io.to(boardId).emit(SOCKET_EVENTS.STATE_FULL, state);
  schedulePersist(boardId, state);
}

function stopClock(boardId: string) {
  const runtime = boards.get(boardId);
  if (!runtime?.clockTimer) return;
  clearInterval(runtime.clockTimer);
  runtime.clockTimer = null;
}

function tickClock(io: SocketIOServer, boardId: string) {
  const runtime = getRuntime(boardId);
  const seconds = parseGameClock(runtime.state.gameClock);
  if (seconds === null || seconds <= 0) {
    runtime.state.gameClock = formatGameClock(0);
    runtime.state.gameClockRunning = false;
    stopClock(boardId);
    broadcastBoardState(io, boardId);
    return;
  }
  runtime.state.gameClock = formatGameClock(seconds - 1);
  broadcastBoardState(io, boardId);
}

function startClock(io: SocketIOServer, boardId: string) {
  stopClock(boardId);
  const runtime = getRuntime(boardId);
  runtime.clockTimer = setInterval(() => tickClock(io, boardId), 1000);
}

function syncClock(io: SocketIOServer, boardId: string) {
  const runtime = getRuntime(boardId);
  if (runtime.state.gameClockRunning) {
    startClock(io, boardId);
  } else {
    stopClock(boardId);
  }
}

export function joinBoardRoom(
  io: SocketIOServer,
  socket: import("socket.io").Socket,
  boardId: string,
): boolean {
  if (!boardExists(boardId)) return false;
  const previous = socket.data.boardId as string | undefined;
  if (previous && previous !== boardId) {
    socket.leave(previous);
  }
  socket.data.boardId = boardId;
  socket.join(boardId);
  const state = getRuntime(boardId).state;
  socket.emit(SOCKET_EVENTS.STATE_FULL, state);
  return true;
}

function requireBoardId(socket: import("socket.io").Socket): string | null {
  const boardId = socket.data.boardId as string | undefined;
  return boardId ?? null;
}

export function registerBoardSocketHandlers(io: SocketIOServer) {
  io.on("connection", (socket) => {
    socket.on(SOCKET_EVENTS.BOARD_JOIN, (boardId: string) => {
      if (typeof boardId !== "string" || !boardId.trim()) return;
      joinBoardRoom(io, socket, boardId.trim());
    });

    socket.on(SOCKET_EVENTS.STATE_REQUEST, () => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      socket.emit(SOCKET_EVENTS.STATE_FULL, getRuntime(boardId).state);
    });

    socket.on(SOCKET_EVENTS.STATE_PATCH, (patch: ScoreboardPatch) => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      const runtime = getRuntime(boardId);
      runtime.state = applyPatch(runtime.state, patch);
      if (patch.gameClock !== undefined && runtime.state.gameClockRunning) {
        const s = parseGameClock(runtime.state.gameClock);
        if (s === null || s <= 0) {
          runtime.state.gameClockRunning = false;
          runtime.state.gameClock = formatGameClock(0);
        }
      }
      if (patch.gameClockRunning !== undefined) {
        syncClock(io, boardId);
      }
      broadcastBoardState(io, boardId);
    });

    socket.on(SOCKET_EVENTS.STATE_REPLACE, (state: ScoreboardState) => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      const runtime = getRuntime(boardId);
      runtime.state = normalizeScoreboardState({
        ...state,
        gameClockRunning: state.gameClockRunning ?? false,
      });
      syncClock(io, boardId);
      broadcastBoardState(io, boardId);
    });

    socket.on(
      SOCKET_EVENTS.SCORE_DELTA,
      (payload: { teamId: "home" | "away"; delta: number }) => {
        const boardId = requireBoardId(socket);
        if (!boardId) return;
        const runtime = getRuntime(boardId);
        const team =
          payload.teamId === "home" ? runtime.state.home : runtime.state.away;
        team.score = Math.max(0, team.score + payload.delta);
        runtime.state.animationKey += 1;
        runtime.state.lastScoreChange = {
          teamId: payload.teamId,
          delta: payload.delta,
          at: Date.now(),
        };
        broadcastBoardState(io, boardId);
      },
    );

    socket.on(
      SOCKET_EVENTS.TRIGGER_EVENT,
      (payload: {
        type: NonNullable<ScoreboardState["eventBanner"]["type"]>;
        teamId: "home" | "away";
        customText?: string;
        durationMs?: number;
      }) => {
        const boardId = requireBoardId(socket);
        if (!boardId) return;
        const runtime = getRuntime(boardId);
        runtime.state.eventBanner = {
          type: payload.type,
          visible: true,
          teamId: payload.teamId,
          customText: payload.customText,
        };
        runtime.state.animationKey += 1;
        broadcastBoardState(io, boardId);
        const duration = payload.durationMs ?? 4500;
        setTimeout(() => {
          const current = getRuntime(boardId);
          if (
            current.state.eventBanner.type === payload.type &&
            current.state.eventBanner.visible
          ) {
            current.state.eventBanner.visible = false;
            broadcastBoardState(io, boardId);
          }
        }, duration);
      },
    );

    socket.on(
      SOCKET_EVENTS.TRIGGER_PENALTY,
      (payload: {
        teamId?: "home" | "away" | null;
        text?: string;
        preset?: ScoreboardState["penalty"]["preset"];
        genericOnly?: boolean;
      }) => {
        const boardId = requireBoardId(socket);
        if (!boardId) return;
        const runtime = getRuntime(boardId);
        if (payload.genericOnly) {
          runtime.state.penalty = {
            active: true,
            genericOnly: true,
            teamId: null,
            text: "",
            preset: "custom",
          };
        } else {
          runtime.state.penalty = {
            active: true,
            genericOnly: false,
            teamId: payload.teamId ?? null,
            text: payload.text ?? "",
            preset: payload.preset ?? "custom",
          };
        }
        runtime.state.animationKey += 1;
        broadcastBoardState(io, boardId);
      },
    );

    socket.on(SOCKET_EVENTS.CLEAR_PENALTY, () => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      const runtime = getRuntime(boardId);
      runtime.state.penalty = {
        ...runtime.state.penalty,
        active: false,
        genericOnly: false,
        teamId: null,
        text: "",
      };
      broadcastBoardState(io, boardId);
    });

    socket.on(SOCKET_EVENTS.CLEAR_EVENT, () => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      const runtime = getRuntime(boardId);
      runtime.state.eventBanner = {
        type: null,
        visible: false,
        teamId: null,
      };
      broadcastBoardState(io, boardId);
    });

    socket.on(SOCKET_EVENTS.CLOCK_START, () => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      const runtime = getRuntime(boardId);
      const s = parseGameClock(runtime.state.gameClock);
      if (s === null || s <= 0) {
        runtime.state.gameClockRunning = false;
        broadcastBoardState(io, boardId);
        return;
      }
      runtime.state.gameClockRunning = true;
      startClock(io, boardId);
      broadcastBoardState(io, boardId);
    });

    socket.on(SOCKET_EVENTS.CLOCK_STOP, () => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      const runtime = getRuntime(boardId);
      runtime.state.gameClockRunning = false;
      stopClock(boardId);
      broadcastBoardState(io, boardId);
    });
  });
}
