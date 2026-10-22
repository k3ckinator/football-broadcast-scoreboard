"use client";

import { io, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/lib/socket-events";
import type { ScoreboardPatch, ScoreboardState } from "@/lib/types/scoreboard";
import type {
  ScoreDeltaPayload,
  TriggerEventPayload,
  TriggerPenaltyPayload,
} from "@/lib/socket-events";

type QueuedEmit = {
  event: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[];
};

let socket: Socket | null = null;
let activeBoardId: string | null = null;
const outboundQueue: QueuedEmit[] = [];
let queueBound = false;

function flushOutboundQueue() {
  const s = socket;
  if (!s?.connected || !activeBoardId) return;
  s.emit(SOCKET_EVENTS.BOARD_JOIN, activeBoardId);
  while (outboundQueue.length > 0) {
    const item = outboundQueue.shift()!;
    s.emit(item.event, ...item.args);
  }
  s.emit(SOCKET_EVENTS.STATE_REQUEST);
}

function emitQueued(event: string, ...args: unknown[]) {
  const s = getSocket();
  if (s.connected && activeBoardId) {
    s.emit(event, ...args);
    return;
  }
  outboundQueue.push({ event, args });
}

function bindQueueHandlers(s: Socket) {
  if (queueBound) return;
  queueBound = true;
  s.on("connect", () => {
    flushOutboundQueue();
  });
}

function createSocket(): Socket {
  const s = io({
    path: "/socket.io",
    transports: ["polling"],
    upgrade: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    timeout: 60_000,
  });
  bindQueueHandlers(s);
  return s;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = createSocket();
  }
  return socket;
}

export function connectToBoard(boardId: string) {
  activeBoardId = boardId;
  const s = getSocket();
  if (s.connected) {
    s.emit(SOCKET_EVENTS.BOARD_JOIN, boardId);
    s.emit(SOCKET_EVENTS.STATE_REQUEST);
  }
}

export function emitPatch(patch: ScoreboardPatch) {
  emitQueued(SOCKET_EVENTS.STATE_PATCH, patch);
}

export function emitReplace(state: ScoreboardState) {
  emitQueued(SOCKET_EVENTS.STATE_REPLACE, state);
}

export function emitScoreDelta(payload: ScoreDeltaPayload) {
  emitQueued(SOCKET_EVENTS.SCORE_DELTA, payload);
}

export function emitTriggerEvent(payload: TriggerEventPayload) {
  emitQueued(SOCKET_EVENTS.TRIGGER_EVENT, payload);
}

export function emitTriggerPenalty(payload: TriggerPenaltyPayload) {
  emitQueued(SOCKET_EVENTS.TRIGGER_PENALTY, payload);
}

export function emitTriggerGenericFlag() {
  emitQueued(SOCKET_EVENTS.TRIGGER_PENALTY, { genericOnly: true });
}

export function emitClearPenalty() {
  emitQueued(SOCKET_EVENTS.CLEAR_PENALTY);
}

export function emitClearEvent() {
  emitQueued(SOCKET_EVENTS.CLEAR_EVENT);
}

export function emitClockStart() {
  emitQueued(SOCKET_EVENTS.CLOCK_START);
}

export function emitClockStop() {
  emitQueued(SOCKET_EVENTS.CLOCK_STOP);
}

export function requestFullState() {
  emitQueued(SOCKET_EVENTS.STATE_REQUEST);
}

export function subscribeFullState(handler: (s: ScoreboardState) => void) {
  const s = getSocket();
  s.on(SOCKET_EVENTS.STATE_FULL, handler);
  return () => {
    s.off(SOCKET_EVENTS.STATE_FULL, handler);
  };
}
