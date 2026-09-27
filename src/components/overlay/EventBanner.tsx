"use client";

import {
  DEFAULT_TEAM_BORDER_WIDTH_PX,
  SCOREBOARD_MAIN_WIDTH_PX,
} from "@/lib/layout-constants";
import { teamFill } from "@/lib/team-colors";
import type { EventBannerType, TeamState } from "@/lib/types/scoreboard";
import { TeamLogo } from "./TeamLogo";

const LABELS: Record<NonNullable<EventBannerType>, string> = {
  touchdown: "Touchdown",
  fieldgoal: "Field Goal",
  pat: "PAT",
  twoPoint: "2-Point Conv.",
  safety: "Safety",
  turnover: "Turnover",
};

interface EventBannerProps {
  type: EventBannerType;
  visible: boolean;
  team: TeamState | null;
  side: "home" | "away" | null;
  customText?: string;
}

export function EventBanner({
  type,
  visible,
  team,
  side,
  customText,
}: EventBannerProps) {
  if (!visible || !type || !team || !side) return null;

  const label = customText || LABELS[type];
  const isHome = side === "home";
  const textColor = team.colors.scoreText;
  const fill = teamFill(team.colors);

  return (
    <div
      className="animate-event-replace relative h-[88px] shrink-0 overflow-hidden"
      style={{
        width: SCOREBOARD_MAIN_WIDTH_PX,
        border: `${team.colors.borderWidth ?? DEFAULT_TEAM_BORDER_WIDTH_PX}px solid ${team.colors.border}`,
        background: fill,
      }}
    >
      <div className="relative h-full w-full overflow-hidden">
        <div
          className={`pointer-events-none absolute inset-y-0 z-0 flex w-[50%] items-center ${
            isHome ? "left-0 justify-start" : "right-0 justify-end"
          }`}
        >
          <div
            className={`unskew-content ${
              isHome ? "-translate-x-5" : "translate-x-5"
            }`}
          >
            <TeamLogo
              url={team.logoUrl}
              name={team.name}
              abbreviation={team.abbreviation}
              size="event-embedded"
            />
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-24">
          <span
            className="event-title unskew-content text-center uppercase italic"
            style={{
              color: textColor,
            }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
