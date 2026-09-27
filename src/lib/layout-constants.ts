/** Fixed overlay widths so team blocks + status bar align exactly. */
export const TEAM_BLOCK_WIDTH_PX = 288;
export const TEAM_BLOCK_HEIGHT_PX = 88;
export const TEAM_BLOCK_GAP_PX = 4;
export const DEFAULT_TEAM_BORDER_WIDTH_PX = 5;
export const SCOREBOARD_MAIN_WIDTH_PX =
  TEAM_BLOCK_WIDTH_PX * 2 + TEAM_BLOCK_GAP_PX;

export function teamBlockInnerHeightPx(borderWidth: number): number {
  return TEAM_BLOCK_HEIGHT_PX - borderWidth * 2;
}

/** Padding around timeout bars (outer card edge + inner logo clip edge). */
export const TIMEOUT_INSET_PX = 6;
export const TIMEOUT_BAR_WIDTH_PX = 8;
export const TIMEOUT_ZONE_WIDTH_PX =
  TIMEOUT_INSET_PX * 2 + TIMEOUT_BAR_WIDTH_PX;
