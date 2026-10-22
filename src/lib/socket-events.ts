import type { ScoreboardPatch, ScoreboardState } from "@/lib/types/scoreboard";

export const SOCKET_EVENTS = {
  BOARD_JOIN: "board:join",
  STATE_FULL: "state:full",
  STATE_REQUEST: "state:request",
  STATE_PATCH: "state:patch",
  STATE_REPLACE: "state:replace",
  SCORE_DELTA: "score:delta",
  TRIGGER_EVENT: "event:trigger",
  TRIGGER_PENALTY: "penalty:trigger",
  CLEAR_PENALTY: "penalty:clear",
  CLEAR_EVENT: "event:clear",
  CLOCK_START: "clock:start",
  CLOCK_STOP: "clock:stop",
} as const;

export interface ScoreDeltaPayload {
  teamId: "home" | "away";
  delta: number;
}

export interface TriggerEventPayload {
  type: NonNullable<ScoreboardState["eventBanner"]["type"]>;
  teamId: "home" | "away";
  customText?: string;
  durationMs?: number;
}

export interface TriggerPenaltyPayload {
  teamId?: "home" | "away" | null;
  text?: string;
  preset?: ScoreboardState["penalty"]["preset"];
  genericOnly?: boolean;
}

export type SocketClientMessage =
  | { event: typeof SOCKET_EVENTS.STATE_PATCH; data: ScoreboardPatch }
  | { event: typeof SOCKET_EVENTS.STATE_REPLACE; data: ScoreboardState }
  | { event: typeof SOCKET_EVENTS.SCORE_DELTA; data: ScoreDeltaPayload }
  | { event: typeof SOCKET_EVENTS.TRIGGER_EVENT; data: TriggerEventPayload }
  | { event: typeof SOCKET_EVENTS.TRIGGER_PENALTY; data: TriggerPenaltyPayload }
  | { event: typeof SOCKET_EVENTS.CLEAR_PENALTY }
  | { event: typeof SOCKET_EVENTS.CLEAR_EVENT };
