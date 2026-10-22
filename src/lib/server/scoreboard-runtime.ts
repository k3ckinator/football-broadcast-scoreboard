import type { Server as SocketIOServer } from "socket.io";
import { formatGameClock, parseGameClock } from "@/lib/game-clock";
import { applyPatch, normalizeScoreboardState } from "@/lib/merge-state";
import { SOCKET_EVENTS } from "@/lib/socket-events";
import type { ScoreboardPatch, ScoreboardState } from "@/lib/types/scoreboard";
import {
  boardExistsAsync,
  loadBoardStateAsync,
  saveBoardState,
} from "./board-store";

type BoardRuntime = {
  state: ScoreboardState;
  clockTimer: ReturnType<typeof setInterval> | null;
  saveTimer: ReturnType<typeof setTimeout> | null;
};

const boards = new Map<string, BoardRuntime>();
const loading = new Map<string, Promise<BoardRuntime>>();

export function evictBoardRuntime(boardId: string): void {
  const runtime = boards.get(boardId);
  if (!runtime) return;
  if (runtime.clockTimer) clearInterval(runtime.clockTimer);
  if (runtime.saveTimer) clearTimeout(runtime.saveTimer);
  boards.delete(boardId);
  loading.delete(boardId);
}

async function getRuntime(boardId: string): Promise<BoardRuntime> {
  const existing = boards.get(boardId);
  if (existing) return existing;

  let pending = loading.get(boardId);
  if (!pending) {
    pending = (async () => {
      const state = await loadBoardStateAsync(boardId);
      if (!state) {
        throw new Error(`Unknown board: ${boardId}`);
      }
      const runtime: BoardRuntime = {
        state,
        clockTimer: null,
        saveTimer: null,
      };
      boards.set(boardId, runtime);
      return runtime;
    })();
    loading.set(boardId, pending);
  }

  try {
    return await pending;
  } finally {
    loading.delete(boardId);
  }
}

function schedulePersist(boardId: string, state: ScoreboardState) {
  const runtime = boards.get(boardId);
  if (!runtime) return;
  if (runtime.saveTimer) clearTimeout(runtime.saveTimer);
  runtime.saveTimer = setTimeout(() => {
    runtime.saveTimer = null;
    saveBoardState(boardId, state);
  }, 400);
}

export async function broadcastBoardState(
  io: SocketIOServer,
  boardId: string,
) {
  const { state } = await getRuntime(boardId);
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
  void (async () => {
    const runtime = await getRuntime(boardId);
    const seconds = parseGameClock(runtime.state.gameClock);
    if (seconds === null || seconds <= 0) {
      runtime.state.gameClock = formatGameClock(0);
      runtime.state.gameClockRunning = false;
      stopClock(boardId);
      await broadcastBoardState(io, boardId);
      return;
    }
    runtime.state.gameClock = formatGameClock(seconds - 1);
    await broadcastBoardState(io, boardId);
  })();
}

function startClock(io: SocketIOServer, boardId: string) {
  stopClock(boardId);
  const runtime = boards.get(boardId);
  if (!runtime) return;
  runtime.clockTimer = setInterval(() => tickClock(io, boardId), 1000);
}

async function syncClock(io: SocketIOServer, boardId: string) {
  const runtime = await getRuntime(boardId);
  if (runtime.state.gameClockRunning) {
    startClock(io, boardId);
  } else {
    stopClock(boardId);
  }
}

export async function joinBoardRoom(
  io: SocketIOServer,
  socket: import("socket.io").Socket,
  boardId: string,
): Promise<boolean> {
  if (!(await boardExistsAsync(boardId))) return false;
  const previous = socket.data.boardId as string | undefined;
  if (previous && previous !== boardId) {
    socket.leave(previous);
  }
  socket.data.boardId = boardId;
  socket.join(boardId);
  const state = (await getRuntime(boardId)).state;
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
      void joinBoardRoom(io, socket, boardId.trim());
    });

    socket.on(SOCKET_EVENTS.STATE_REQUEST, () => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      void getRuntime(boardId).then((runtime) => {
        socket.emit(SOCKET_EVENTS.STATE_FULL, runtime.state);
      });
    });

    socket.on(SOCKET_EVENTS.STATE_PATCH, (patch: ScoreboardPatch) => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      void (async () => {
        const runtime = await getRuntime(boardId);
        runtime.state = applyPatch(runtime.state, patch);
        if (patch.gameClock !== undefined && runtime.state.gameClockRunning) {
          const s = parseGameClock(runtime.state.gameClock);
          if (s === null || s <= 0) {
            runtime.state.gameClockRunning = false;
            runtime.state.gameClock = formatGameClock(0);
          }
        }
        if (patch.gameClockRunning !== undefined) {
          await syncClock(io, boardId);
        }
        await broadcastBoardState(io, boardId);
      })();
    });

    socket.on(SOCKET_EVENTS.STATE_REPLACE, (state: ScoreboardState) => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      void (async () => {
        const runtime = await getRuntime(boardId);
        runtime.state = normalizeScoreboardState({
          ...state,
          gameClockRunning: state.gameClockRunning ?? false,
        });
        await syncClock(io, boardId);
        await broadcastBoardState(io, boardId);
      })();
    });

    socket.on(
      SOCKET_EVENTS.SCORE_DELTA,
      (payload: { teamId: "home" | "away"; delta: number }) => {
        const boardId = requireBoardId(socket);
        if (!boardId) return;
        void (async () => {
          const runtime = await getRuntime(boardId);
          const team =
            payload.teamId === "home" ? runtime.state.home : runtime.state.away;
          team.score = Math.max(0, team.score + payload.delta);
          runtime.state.animationKey += 1;
          runtime.state.lastScoreChange = {
            teamId: payload.teamId,
            delta: payload.delta,
            at: Date.now(),
          };
          await broadcastBoardState(io, boardId);
        })();
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
        void (async () => {
          const runtime = await getRuntime(boardId);
          runtime.state.eventBanner = {
            type: payload.type,
            visible: true,
            teamId: payload.teamId,
            customText: payload.customText,
          };
          runtime.state.animationKey += 1;
          await broadcastBoardState(io, boardId);
          const duration = payload.durationMs ?? 4500;
          setTimeout(() => {
            void (async () => {
              const current = await getRuntime(boardId);
              if (
                current.state.eventBanner.type === payload.type &&
                current.state.eventBanner.visible
              ) {
                current.state.eventBanner.visible = false;
                await broadcastBoardState(io, boardId);
              }
            })();
          }, duration);
        })();
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
        void (async () => {
          const runtime = await getRuntime(boardId);
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
          await broadcastBoardState(io, boardId);
        })();
      },
    );

    socket.on(SOCKET_EVENTS.CLEAR_PENALTY, () => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      void (async () => {
        const runtime = await getRuntime(boardId);
        runtime.state.penalty = {
          ...runtime.state.penalty,
          active: false,
          genericOnly: false,
          teamId: null,
          text: "",
        };
        await broadcastBoardState(io, boardId);
      })();
    });

    socket.on(SOCKET_EVENTS.CLEAR_EVENT, () => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      void (async () => {
        const runtime = await getRuntime(boardId);
        runtime.state.eventBanner = {
          type: null,
          visible: false,
          teamId: null,
        };
        await broadcastBoardState(io, boardId);
      })();
    });

    socket.on(SOCKET_EVENTS.CLOCK_START, () => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      void (async () => {
        const runtime = await getRuntime(boardId);
        const s = parseGameClock(runtime.state.gameClock);
        if (s === null || s <= 0) {
          runtime.state.gameClockRunning = false;
          await broadcastBoardState(io, boardId);
          return;
        }
        runtime.state.gameClockRunning = true;
        startClock(io, boardId);
        await broadcastBoardState(io, boardId);
      })();
    });

    socket.on(SOCKET_EVENTS.CLOCK_STOP, () => {
      const boardId = requireBoardId(socket);
      if (!boardId) return;
      void (async () => {
        const runtime = await getRuntime(boardId);
        runtime.state.gameClockRunning = false;
        stopClock(boardId);
        await broadcastBoardState(io, boardId);
      })();
    });
  });
}
