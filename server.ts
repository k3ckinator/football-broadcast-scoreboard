import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { formatGameClock, parseGameClock } from "./src/lib/game-clock";
import {
  initialGameState,
  loadPersistedGameState,
  schedulePersistGameState,
} from "./src/lib/game-state-persistence";
import { applyPatch, normalizeScoreboardState } from "./src/lib/merge-state";
import { SOCKET_EVENTS } from "./src/lib/socket-events";
import type { ScoreboardPatch, ScoreboardState } from "./src/lib/types/scoreboard";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let gameState: ScoreboardState = initialGameState();
let clockTimer: ReturnType<typeof setInterval> | null = null;

function broadcastState(io: SocketIOServer) {
  io.emit(SOCKET_EVENTS.STATE_FULL, gameState);
  schedulePersistGameState(gameState);
}

function stopClockTimer() {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}

function tickClock(io: SocketIOServer) {
  const seconds = parseGameClock(gameState.gameClock);
  if (seconds === null || seconds <= 0) {
    gameState.gameClock = formatGameClock(0);
    gameState.gameClockRunning = false;
    stopClockTimer();
    broadcastState(io);
    return;
  }
  gameState.gameClock = formatGameClock(seconds - 1);
  broadcastState(io);
}

function startClockTimer(io: SocketIOServer) {
  stopClockTimer();
  clockTimer = setInterval(() => tickClock(io), 1000);
}

function syncClockTimer(io: SocketIOServer) {
  if (gameState.gameClockRunning) {
    startClockTimer(io);
  } else {
    stopClockTimer();
  }
}

app.prepare().then(async () => {
  const persisted = await loadPersistedGameState();
  if (persisted) {
    gameState = persisted;
    console.log("> Restored scoreboard state from disk");
  }

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["polling"],
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
    pingTimeout: 60_000,
    pingInterval: 25_000,
  });

  io.on("connection", (socket) => {
    socket.emit(SOCKET_EVENTS.STATE_FULL, gameState);

    socket.on(SOCKET_EVENTS.STATE_REQUEST, () => {
      socket.emit(SOCKET_EVENTS.STATE_FULL, gameState);
    });

    socket.on(SOCKET_EVENTS.STATE_PATCH, (patch: ScoreboardPatch) => {
      gameState = applyPatch(gameState, patch);
      if (patch.gameClock !== undefined && gameState.gameClockRunning) {
        const s = parseGameClock(gameState.gameClock);
        if (s === null || s <= 0) {
          gameState.gameClockRunning = false;
          gameState.gameClock = formatGameClock(0);
        }
      }
      if (patch.gameClockRunning !== undefined) {
        syncClockTimer(io);
      }
      broadcastState(io);
    });

    socket.on(SOCKET_EVENTS.STATE_REPLACE, (state: ScoreboardState) => {
      gameState = normalizeScoreboardState({
        ...state,
        gameClockRunning: state.gameClockRunning ?? false,
      });
      syncClockTimer(io);
      broadcastState(io);
    });

    socket.on(
      SOCKET_EVENTS.SCORE_DELTA,
      (payload: { teamId: "home" | "away"; delta: number }) => {
        const team = payload.teamId === "home" ? gameState.home : gameState.away;
        team.score = Math.max(0, team.score + payload.delta);
        gameState.animationKey += 1;
        gameState.lastScoreChange = {
          teamId: payload.teamId,
          delta: payload.delta,
          at: Date.now(),
        };
        broadcastState(io);
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
        gameState.eventBanner = {
          type: payload.type,
          visible: true,
          teamId: payload.teamId,
          customText: payload.customText,
        };
        gameState.animationKey += 1;
        broadcastState(io);
        const duration = payload.durationMs ?? 4500;
        setTimeout(() => {
          if (
            gameState.eventBanner.type === payload.type &&
            gameState.eventBanner.visible
          ) {
            gameState.eventBanner.visible = false;
            broadcastState(io);
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
        if (payload.genericOnly) {
          gameState.penalty = {
            active: true,
            genericOnly: true,
            teamId: null,
            text: "",
            preset: "custom",
          };
        } else {
          gameState.penalty = {
            active: true,
            genericOnly: false,
            teamId: payload.teamId ?? null,
            text: payload.text ?? "",
            preset: payload.preset ?? "custom",
          };
        }
        gameState.animationKey += 1;
        broadcastState(io);
      },
    );

    socket.on(SOCKET_EVENTS.CLEAR_PENALTY, () => {
      gameState.penalty = {
        ...gameState.penalty,
        active: false,
        genericOnly: false,
        teamId: null,
        text: "",
      };
      broadcastState(io);
    });

    socket.on(SOCKET_EVENTS.CLEAR_EVENT, () => {
      gameState.eventBanner = { type: null, visible: false, teamId: null };
      broadcastState(io);
    });

    socket.on(SOCKET_EVENTS.CLOCK_START, () => {
      const s = parseGameClock(gameState.gameClock);
      if (s === null || s <= 0) {
        gameState.gameClockRunning = false;
        broadcastState(io);
        return;
      }
      gameState.gameClockRunning = true;
      startClockTimer(io);
      broadcastState(io);
    });

    socket.on(SOCKET_EVENTS.CLOCK_STOP, () => {
      gameState.gameClockRunning = false;
      stopClockTimer();
      broadcastState(io);
    });
  });

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\nPort ${port} is already in use. Stop the other process or run:\n` +
          `  PowerShell: Get-NetTCPConnection -LocalPort ${port} | Select OwningProcess\n` +
          `  Then: Stop-Process -Id <PID> -Force\n` +
          `  Or: $env:PORT="3001"; npm run dev\n`,
      );
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Control: http://${hostname}:${port}/control`);
    console.log(`> Overlay: http://${hostname}:${port}/overlay`);
  });
});
