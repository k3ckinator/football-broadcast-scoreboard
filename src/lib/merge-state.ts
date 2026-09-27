import {
  formatDownDistance,
  parseDownDistance,
  patchDownDistance,
  resolveDownDistance,
} from "@/lib/down-distance";
import type { ScoreboardPatch, ScoreboardState } from "@/lib/types/scoreboard";

function mergePartial<T extends object>(base: T, patch?: Partial<T>): T {
  if (!patch) return base;
  const next = { ...base, ...patch };
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const val = patch[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const baseVal = base[key];
      if (baseVal && typeof baseVal === "object" && !Array.isArray(baseVal)) {
        next[key] = { ...baseVal, ...val } as T[keyof T];
      }
    }
  }
  return next;
}

function syncDownDistanceFields(state: ScoreboardState): ScoreboardState {
  const parts = resolveDownDistance(state);
  return {
    ...state,
    downNumber: parts.down,
    yardsToGo: parts.yardsToGo,
    distanceKind: parts.distanceKind,
    downDistance: formatDownDistance(parts),
  };
}

export function normalizeScoreboardState(state: ScoreboardState): ScoreboardState {
  const withDown = syncDownDistanceFields(state);
  return {
    ...withDown,
    penalty: {
      ...withDown.penalty,
      genericOnly: withDown.penalty.genericOnly ?? false,
    },
  };
}

export function applyPatch(
  state: ScoreboardState,
  patch: ScoreboardPatch,
): ScoreboardState {
  const { home, away, penalty, eventBanner, theme, ...top } = patch;
  let next: ScoreboardState = {
    ...state,
    ...top,
    home: mergePartial(state.home, home),
    away: mergePartial(state.away, away),
    penalty: mergePartial(state.penalty, penalty),
    eventBanner: mergePartial(state.eventBanner, eventBanner),
    theme: mergePartial(state.theme, theme),
  };

  const structuredDownPatch =
    patch.downNumber !== undefined ||
    patch.yardsToGo !== undefined ||
    patch.distanceKind !== undefined ||
    patch.goalToGo !== undefined;

  if (structuredDownPatch) {
    const current = resolveDownDistance(next);
    const parts = patchDownDistance(current, {
      down: patch.downNumber,
      yardsToGo: patch.yardsToGo,
      distanceKind: patch.distanceKind,
      goalToGo: patch.goalToGo,
    });
    next = {
      ...next,
      downNumber: parts.down,
      yardsToGo: parts.yardsToGo,
      distanceKind: parts.distanceKind,
      downDistance: formatDownDistance(parts),
    };
  } else if (patch.downDistance !== undefined) {
    const parts = parseDownDistance(patch.downDistance);
    next = {
      ...next,
      downNumber: parts.down,
      yardsToGo: parts.yardsToGo,
      distanceKind: parts.distanceKind,
      downDistance: formatDownDistance(parts),
    };
  }

  return next;
}
