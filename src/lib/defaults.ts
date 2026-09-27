import type { ScoreboardState, TeamState } from "@/lib/types/scoreboard";

const defaultTeamHome: TeamState = {
  name: "HOME",
  abbreviation: "HOM",
  score: 0,
  logoUrl: null,
  colors: {
    fill: "#121212",
    scoreText: "#ffffff",
    border: "#7c3aed",
    borderWidth: 5,
    timeout: "#7c3aed",
  },
  timeouts: { total: 3, used: 0, visible: true },
};

const defaultTeamAway: TeamState = {
  name: "AWAY",
  abbreviation: "AWY",
  score: 0,
  logoUrl: null,
  colors: {
    fill: "#ffffff",
    scoreText: "#121212",
    border: "#121212",
    borderWidth: 5,
    timeout: "#121212",
  },
  timeouts: { total: 3, used: 0, visible: true },
};

export const defaultScoreboardState = (): ScoreboardState => ({
  version: 1,
  home: structuredClone(defaultTeamHome),
  away: structuredClone(defaultTeamAway),
  quarter: "1ST",
  gameClock: "12:00",
  gameClockRunning: false,
  downDistance: "1ST & 10",
  downNumber: 1,
  yardsToGo: 10,
  distanceKind: "yards",
  possession: "none",
  penalty: {
    active: false,
    genericOnly: false,
    teamId: null,
    text: "",
    preset: "Holding",
  },
  eventBanner: {
    type: null,
    visible: false,
    teamId: null,
  },
  theme: {
    statusBarBackground: "rgba(28, 28, 28, 0.92)",
    statusBarText: "#ffffff",
    statusBarBorder: "rgba(255,255,255,0.15)",
    outerShadow: "0 8px 32px rgba(0,0,0,0.55)",
    possessionColor: "#ffd700",
    penaltyBackground: "#F7D117",
    penaltyText: "#111111",
    eventBannerBackground: "linear-gradient(90deg, #c8102e 0%, #8b0000 100%)",
    eventBannerText: "#ffffff",
    skewDegrees: 10,
  },
  overlayVisible: true,
  showGameClock: true,
  showPossession: true,
  showTeamNames: false,
  animationKey: 0,
});
