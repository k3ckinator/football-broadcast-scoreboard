"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_TEAM_BORDER_WIDTH_PX,
  TEAM_BLOCK_WIDTH_PX,
  TIMEOUT_INSET_PX,
  TIMEOUT_ZONE_WIDTH_PX,
  teamBlockInnerHeightPx,
} from "@/lib/layout-constants";
import { teamFill, teamTimeoutColor } from "@/lib/team-colors";
import type { TeamState } from "@/lib/types/scoreboard";
import { FootballIcon } from "./FootballIcon";
import { TeamLogo } from "./TeamLogo";
import { TimeoutBars } from "./TimeoutBars";

interface TeamBlockProps {
  team: TeamState;
  side: "home" | "away";
  hasPossession: boolean;
  skew: number;
  scoreAnimKey: number;
  lastScoreTeam?: "home" | "away";
  showName: boolean;
}

function TimeoutZone({
  team,
  fill,
  innerHeight,
}: {
  team: TeamState;
  fill: string;
  innerHeight: number;
}) {
  const trackHeight = innerHeight - TIMEOUT_INSET_PX * 2;

  return (
    <div
      className="relative z-30 flex h-full shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: TIMEOUT_ZONE_WIDTH_PX,
        padding: TIMEOUT_INSET_PX,
        background: fill,
      }}
    >
      <TimeoutBars
        total={team.timeouts.total}
        used={team.timeouts.used}
        visible={team.timeouts.visible}
        fillColor={teamTimeoutColor(team.colors)}
        trackHeightPx={trackHeight}
      />
    </div>
  );
}

function LogoScoreArea({
  team,
  isHome,
  showName,
  fill,
  animating,
  score,
  hasPossession,
}: {
  team: TeamState;
  isHome: boolean;
  showName: boolean;
  fill: string;
  animating: boolean;
  score: number;
  hasPossession: boolean;
}) {
  return (
    <div
      className="relative min-w-0 flex-1 overflow-visible"
      style={{ background: fill }}
    >
      {/* Logo darf in den Score-Bereich ragen; innen kein Clip — nur der Timeout-Streifen trennt außen */}
      <div
        className={`pointer-events-none absolute inset-y-0 z-[8] flex items-center ${
          isHome ? "left-0 justify-start" : "right-0 justify-end"
        }`}
        style={{ width: "78%" }}
      >
        <div
          className={`unskew-content ${isHome ? "-translate-x-2" : "translate-x-2"}`}
        >
          <TeamLogo
            url={team.logoUrl}
            name={team.name}
            abbreviation={team.abbreviation}
            size="embedded"
          />
        </div>
      </div>

      {!team.logoUrl && (
        <span
          className={`absolute bottom-1 z-[9] text-[9px] font-black tracking-widest uppercase ${
            isHome ? "left-2" : "right-2"
          }`}
          style={{ color: team.colors.scoreText }}
        >
          {team.abbreviation}
        </span>
      )}
      {showName && team.logoUrl && (
        <span
          className={`absolute bottom-1 z-[9] max-w-[80px] truncate text-[8px] font-black uppercase ${
            isHome ? "left-2" : "right-2"
          }`}
          style={{ color: team.colors.scoreText }}
        >
          {team.abbreviation}
        </span>
      )}

      {hasPossession && (
        <div
          className="pointer-events-none absolute top-1/2 left-[52%] z-[25] -translate-x-1/2 -translate-y-1/2"
          aria-label="Ballbesitz"
        >
          <div className="unskew-content animate-possession">
            <FootballIcon color={team.colors.scoreText} size={24} />
          </div>
        </div>
      )}

      <div
        className={`relative z-20 flex h-full items-center ${
          isHome ? "justify-end pr-1 pl-1" : "justify-start pl-1 pr-1"
        }`}
      >
        <span
          className={`score-display unskew-content text-[58px] italic tabular-nums ${
            isHome ? "translate-x-[-10px]" : "translate-x-[10px]"
          } ${animating ? "animate-score-pop animate-score-flash" : ""}`}
          style={{ color: team.colors.scoreText }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

export function TeamBlock({
  team,
  side,
  hasPossession,
  scoreAnimKey,
  lastScoreTeam,
  showName,
}: TeamBlockProps) {
  const isHome = side === "home";
  const [animating, setAnimating] = useState(false);
  const prevKey = useRef(scoreAnimKey);
  const borderWidth = team.colors.borderWidth ?? DEFAULT_TEAM_BORDER_WIDTH_PX;
  const fill = teamFill(team.colors);
  const innerHeight = teamBlockInnerHeightPx(borderWidth);

  useEffect(() => {
    if (lastScoreTeam === side && scoreAnimKey !== prevKey.current) {
      setAnimating(true);
      prevKey.current = scoreAnimKey;
      const t = setTimeout(() => setAnimating(false), 600);
      return () => clearTimeout(t);
    }
  }, [scoreAnimKey, lastScoreTeam, side]);

  return (
    <div
      className="relative h-[88px] shrink-0"
      style={{
        width: TEAM_BLOCK_WIDTH_PX,
      }}
    >
      <div
        className="relative flex h-full w-full overflow-hidden"
        style={{
          border: `${borderWidth}px solid ${team.colors.border}`,
          background: fill,
        }}
      >
        {isHome ? (
          <>
            <TimeoutZone team={team} fill={fill} innerHeight={innerHeight} />
            <LogoScoreArea
              team={team}
              isHome
              showName={showName}
              fill={fill}
              animating={animating}
              score={team.score}
              hasPossession={hasPossession}
            />
          </>
        ) : (
          <>
            <LogoScoreArea
              team={team}
              isHome={false}
              showName={showName}
              fill={fill}
              animating={animating}
              score={team.score}
              hasPossession={hasPossession}
            />
            <TimeoutZone team={team} fill={fill} innerHeight={innerHeight} />
          </>
        )}
      </div>
    </div>
  );
}
