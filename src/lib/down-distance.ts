export type DownNumber = 1 | 2 | 3 | 4;

export type DistanceKind = "yards" | "goal" | "long" | "inches";

const DOWN_LABELS: Record<DownNumber, string> = {
  1: "1ST",
  2: "2ND",
  3: "3RD",
  4: "4TH",
};

export interface DownDistanceParts {
  down: DownNumber;
  yardsToGo: number;
  distanceKind: DistanceKind;
}

export function formatDownDistance(parts: DownDistanceParts): string {
  const head = DOWN_LABELS[parts.down];
  switch (parts.distanceKind) {
    case "goal":
      return `${head} & GOAL`;
    case "long":
      return `${head} & LONG`;
    case "inches":
      return `${head} & INCHES`;
    default:
      return `${head} & ${parts.yardsToGo}`;
  }
}

export function parseDownDistance(raw: string): DownDistanceParts {
  const text = raw.trim().toUpperCase();
  if (text === "GOAL TO GO") {
    return { down: 1, yardsToGo: 0, distanceKind: "goal" };
  }
  const match = /^(1ST|2ND|3RD|4TH)\s*&\s*(GOAL|LONG|INCHES|\d+)/.exec(text);
  if (!match) {
    return { down: 1, yardsToGo: 10, distanceKind: "yards" };
  }
  const downMap: Record<string, DownNumber> = {
    "1ST": 1,
    "2ND": 2,
    "3RD": 3,
    "4TH": 4,
  };
  const down = downMap[match[1]];
  const tail = match[2];
  if (tail === "GOAL") return { down, yardsToGo: 0, distanceKind: "goal" };
  if (tail === "LONG") return { down, yardsToGo: 0, distanceKind: "long" };
  if (tail === "INCHES") return { down, yardsToGo: 0, distanceKind: "inches" };
  return {
    down,
    yardsToGo: Math.max(0, Math.min(99, Number(tail))),
    distanceKind: "yards",
  };
}

export function resolveDownDistance(state: {
  downDistance: string;
  downNumber?: DownNumber;
  yardsToGo?: number;
  distanceKind?: DistanceKind;
  /** @deprecated */
  goalToGo?: boolean;
}): DownDistanceParts {
  if (state.downNumber !== undefined && state.yardsToGo !== undefined) {
    let kind: DistanceKind =
      state.distanceKind ??
      (state.goalToGo ? "goal" : "yards");
    return {
      down: state.downNumber,
      yardsToGo: state.yardsToGo,
      distanceKind: kind,
    };
  }
  return parseDownDistance(state.downDistance);
}

export function patchDownDistance(
  current: DownDistanceParts,
  patch: Partial<DownDistanceParts> & { goalToGo?: boolean },
): DownDistanceParts {
  let distanceKind = patch.distanceKind ?? current.distanceKind;
  if (patch.goalToGo === true) distanceKind = "goal";

  const next: DownDistanceParts = {
    down: patch.down ?? current.down,
    yardsToGo: patch.yardsToGo ?? current.yardsToGo,
    distanceKind,
  };

  if (
    patch.distanceKind === "goal" ||
    patch.distanceKind === "long" ||
    patch.distanceKind === "inches"
  ) {
    next.yardsToGo = 0;
  }
  if (patch.yardsToGo !== undefined && patch.distanceKind === undefined) {
    next.distanceKind = "yards";
  }
  return next;
}
