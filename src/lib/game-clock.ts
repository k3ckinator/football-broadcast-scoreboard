/** Parse MM:SS or M:SS into total seconds. Returns null if invalid. */
export function parseGameClock(value: string): number | null {
  const trimmed = value.trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (seconds > 59 || minutes < 0) return null;
  return minutes * 60 + seconds;
}

export function formatGameClock(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function adjustGameClock(current: string, deltaSeconds: number): string {
  const parsed = parseGameClock(current);
  const base = parsed ?? 15 * 60;
  return formatGameClock(base + deltaSeconds);
}
