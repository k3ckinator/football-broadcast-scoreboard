"use client";

interface StatusBarProps {
  quarter: string;
  downDistance: string;
  gameClock: string;
  showGameClock: boolean;
  background: string;
  textColor: string;
  penaltyActive: boolean;
  penaltyGenericOnly: boolean;
  penaltyText: string;
  penaltyTeamLabel: string;
  penaltyBackground: string;
  penaltyTextColor: string;
}

export function StatusBar({
  quarter,
  downDistance,
  gameClock,
  showGameClock,
  background,
  textColor,
  penaltyActive,
  penaltyGenericOnly,
  penaltyText,
  penaltyTeamLabel,
  penaltyBackground,
  penaltyTextColor,
}: StatusBarProps) {
  const detailLabel = penaltyTeamLabel
    ? `${penaltyText} — ${penaltyTeamLabel}`
    : penaltyText;

  const genericFlag = penaltyGenericOnly || !penaltyText.trim();
  const flagLine = genericFlag ? "FLAG" : `FLAG — ${detailLabel}`;
  const flagTextClass =
    "unskew-content px-4 text-center text-[28px] leading-none font-black tracking-wide uppercase";
  const flagTextStyle = {
    color: penaltyTextColor,
    textShadow: "0 1px 0 rgba(0,0,0,0.35), 0 0 1px currentColor",
  };

  return (
    <div className="relative w-full">
      <div
        className="relative grid h-[46px] w-full grid-cols-[1fr_auto_1fr] items-center overflow-hidden px-6"
        style={{
          background,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div
          className={`unskew-content flex items-center justify-start transition-opacity duration-200 ${
            penaltyActive ? "opacity-0" : "opacity-100"
          }`}
        >
          <span
            className="text-[26px] leading-none font-black italic tracking-wide uppercase"
            style={{ color: textColor }}
          >
            {quarter}
          </span>
        </div>

        <div
          className={`unskew-content flex justify-center px-4 transition-opacity duration-200 ${
            penaltyActive ? "opacity-0" : "opacity-100"
          }`}
        >
          {showGameClock && (
            <span
              className="text-[30px] leading-none font-black italic tabular-nums tracking-wide"
              style={{ color: textColor }}
            >
              {gameClock}
            </span>
          )}
        </div>

        <div
          className={`unskew-content flex items-center justify-end transition-opacity duration-200 ${
            penaltyActive ? "opacity-0" : "opacity-100"
          }`}
        >
          <span
            className="text-right text-[26px] leading-none font-black italic tracking-wide uppercase"
            style={{ color: textColor }}
          >
            {downDistance}
          </span>
        </div>

        {penaltyActive && (
          <div
            className="animate-penalty-pulse absolute inset-0 flex items-center justify-center"
            style={{ background: penaltyBackground }}
          >
            <span className={flagTextClass} style={flagTextStyle}>
              {flagLine}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
