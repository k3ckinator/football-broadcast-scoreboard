"use client";

import { create } from "zustand";
import { defaultScoreboardState } from "@/lib/defaults";
import type { ScoreboardPatch, ScoreboardState } from "@/lib/types/scoreboard";

interface ScoreboardStore {
  state: ScoreboardState;
  connected: boolean;
  setConnected: (v: boolean) => void;
  setFullState: (state: ScoreboardState) => void;
  patchLocal: (patch: ScoreboardPatch) => void;
  resetLocal: () => void;
}

function patchState(
  current: ScoreboardState,
  patch: ScoreboardPatch,
): ScoreboardState {
  return {
    ...current,
    ...patch,
    home: patch.home ? { ...current.home, ...patch.home, colors: patch.home.colors ? { ...current.home.colors, ...patch.home.colors } : current.home.colors, timeouts: patch.home.timeouts ? { ...current.home.timeouts, ...patch.home.timeouts } : current.home.timeouts } : current.home,
    away: patch.away ? { ...current.away, ...patch.away, colors: patch.away.colors ? { ...current.away.colors, ...patch.away.colors } : current.away.colors, timeouts: patch.away.timeouts ? { ...current.away.timeouts, ...patch.away.timeouts } : current.away.timeouts } : current.away,
    penalty: patch.penalty ? { ...current.penalty, ...patch.penalty } : current.penalty,
    eventBanner: patch.eventBanner ? { ...current.eventBanner, ...patch.eventBanner } : current.eventBanner,
    theme: patch.theme ? { ...current.theme, ...patch.theme } : current.theme,
  };
}

export const useScoreboardStore = create<ScoreboardStore>((set) => ({
  state: defaultScoreboardState(),
  connected: false,
  setConnected: (connected) => set({ connected }),
  setFullState: (state) => set({ state }),
  patchLocal: (patch) =>
    set((s) => ({ state: patchState(s.state, patch) })),
  resetLocal: () => set({ state: defaultScoreboardState() }),
}));
