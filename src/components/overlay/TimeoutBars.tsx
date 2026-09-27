"use client";

import { TIMEOUT_BAR_WIDTH_PX } from "@/lib/layout-constants";

interface TimeoutBarsProps {
  total: number;
  used: number;
  visible: boolean;
  fillColor: string;
  /** Height available inside timeout inset padding */
  trackHeightPx: number;
  gapPx?: number;
  emptyColor?: string;
}

export function TimeoutBars({
  total,
  used,
  visible,
  fillColor,
  trackHeightPx,
  gapPx = 4,
  emptyColor = "rgba(255,255,255,0.25)",
}: TimeoutBarsProps) {
  if (!visible || total <= 0) return null;

  const barHeight =
    total > 0 ? (trackHeightPx - gapPx * (total - 1)) / total : trackHeightPx;

  return (
    <div
      className="flex flex-col justify-center"
      style={{ gap: gapPx, width: TIMEOUT_BAR_WIDTH_PX, height: trackHeightPx }}
      aria-label={`Timeouts ${total - used} remaining`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const remaining = i >= used;
        return (
          <span
            key={i}
            className="w-full shrink-0 transition-all duration-300"
            style={{
              height: barHeight,
              backgroundColor: remaining ? fillColor : emptyColor,
              opacity: remaining ? 1 : 0.5,
              boxShadow: remaining ? "0 0 1px rgba(0,0,0,0.4)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
