"use client";

import {
  SCOREBOARD_MAIN_WIDTH_PX,
  TEAM_BLOCK_GAP_PX,
} from "@/lib/layout-constants";
import { useScoreboardStore } from "@/store/useScoreboardStore";
import { EventBanner } from "./EventBanner";
import { StatusBar } from "./StatusBar";
import { TeamBlock } from "./TeamBlock";

export function ScoreboardOverlay() {
  const state = useScoreboardStore((s) => s.state);

  if (!state.overlayVisible) {
    return <div className="overlay-root" />;
  }

  const skew = state.theme.skewDegrees;
  const penaltyTeamLabel =
    state.penalty.teamId === "home"
      ? state.home.abbreviation
      : state.penalty.teamId === "away"
        ? state.away.abbreviation
        : "";

  const eventTeam =
    state.eventBanner.teamId === "home"
      ? state.home
      : state.eventBanner.teamId === "away"
        ? state.away
        : null;

  const showEventOverlay =
    state.eventBanner.visible &&
    state.eventBanner.type &&
    eventTeam &&
    state.eventBanner.teamId;

  return (
    <div className="overlay-root">
      <div
        className="scoreboard-enter absolute bottom-[72px] left-1/2 -translate-x-1/2"
        style={{
          width: SCOREBOARD_MAIN_WIDTH_PX,
          filter: `drop-shadow(${state.theme.outerShadow})`,
        }}
      >
        {/* Single skew for the whole scoreboard — corners of status bar align with team cards */}
        <div
          className="scoreboard-parallelogram"
          style={{
            transform: `skewX(${-skew}deg)`,
            ["--unskew" as string]: `${skew}deg`,
          }}
        >
          {showEventOverlay ? (
            <EventBanner
              type={state.eventBanner.type}
              visible={state.eventBanner.visible}
              team={eventTeam}
              side={state.eventBanner.teamId}
              customText={state.eventBanner.customText}
            />
          ) : (
            <div className="flex" style={{ gap: TEAM_BLOCK_GAP_PX }}>
              <TeamBlock
                team={state.home}
                side="home"
                hasPossession={
                  state.showPossession && state.possession === "home"
                }
              skew={skew}
                scoreAnimKey={state.animationKey}
                lastScoreTeam={state.lastScoreChange?.teamId}
                showName={state.showTeamNames}
              />
              <TeamBlock
                team={state.away}
                side="away"
                hasPossession={
                  state.showPossession && state.possession === "away"
                }
              skew={skew}
                scoreAnimKey={state.animationKey}
                lastScoreTeam={state.lastScoreChange?.teamId}
                showName={state.showTeamNames}
              />
            </div>
          )}

          <div
            className="shrink-0"
            style={{ height: TEAM_BLOCK_GAP_PX }}
            aria-hidden
          />

          <StatusBar
            quarter={state.quarter}
            downDistance={state.downDistance}
            gameClock={state.gameClock}
            showGameClock={state.showGameClock}
            background={state.theme.statusBarBackground}
            textColor={state.theme.statusBarText}
            penaltyActive={state.penalty.active}
            penaltyGenericOnly={state.penalty.genericOnly ?? false}
            penaltyText={state.penalty.text}
            penaltyTeamLabel={penaltyTeamLabel}
            penaltyBackground={state.theme.penaltyBackground}
            penaltyTextColor={state.theme.penaltyText}
          />
        </div>
      </div>
    </div>
  );
}
