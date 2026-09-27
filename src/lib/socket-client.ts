"use client";

import { io, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@/lib/socket-events";
import type { ScoreboardPatch, ScoreboardState } from "@/lib/types/scoreboard";
import type {
  ScoreDeltaPayload,
  TriggerEventPayload,
  TriggerPenaltyPayload,
} from "@/lib/socket-events";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export function emitPatch(patch: ScoreboardPatch) {
  getSocket().emit(SOCKET_EVENTS.STATE_PATCH, patch);
}

export function emitReplace(state: ScoreboardState) {
  getSocket().emit(SOCKET_EVENTS.STATE_REPLACE, state);
}

export function emitScoreDelta(payload: ScoreDeltaPayload) {
  getSocket().emit(SOCKET_EVENTS.SCORE_DELTA, payload);
}

export function emitTriggerEvent(payload: TriggerEventPayload) {
  getSocket().emit(SOCKET_EVENTS.TRIGGER_EVENT, payload);
}

export function emitTriggerPenalty(payload: TriggerPenaltyPayload) {
  getSocket().emit(SOCKET_EVENTS.TRIGGER_PENALTY, payload);
}

export function emitTriggerGenericFlag() {
  getSocket().emit(SOCKET_EVENTS.TRIGGER_PENALTY, { genericOnly: true });
}

export function emitClearPenalty() {
  getSocket().emit(SOCKET_EVENTS.CLEAR_PENALTY);
}

export function emitClearEvent() {
  getSocket().emit(SOCKET_EVENTS.CLEAR_EVENT);
}

export function emitClockStart() {
  getSocket().emit(SOCKET_EVENTS.CLOCK_START);
}

export function emitClockStop() {
  getSocket().emit(SOCKET_EVENTS.CLOCK_STOP);
}

export function subscribeFullState(handler: (s: ScoreboardState) => void) {
  const s = getSocket();
  s.on(SOCKET_EVENTS.STATE_FULL, handler);
  return () => {
    s.off(SOCKET_EVENTS.STATE_FULL, handler);
  };
}
