import type { TeamColors } from "@/lib/types/scoreboard";

/** Unified fill for logo area, score area, and card body. */
export function teamFill(colors: TeamColors): string {
  if (colors.fill) return colors.fill;
  return (
    colors.secondary ??
    colors.primary ??
    colors.logoBackground ??
    "#333333"
  );
}

export function teamTimeoutColor(colors: TeamColors): string {
  return colors.timeout ?? colors.accent ?? "#ffffff";
}

export function withTeamFill(colors: TeamColors, fill: string): TeamColors {
  return {
    ...colors,
    fill,
    primary: fill,
    secondary: fill,
    logoBackground: fill,
  };
}
