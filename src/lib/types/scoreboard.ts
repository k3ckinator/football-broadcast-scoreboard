export type Quarter = "1ST" | "2ND" | "3RD" | "4TH" | "OT";

export type DownNumber = 1 | 2 | 3 | 4;

export type DistanceKind = "yards" | "goal" | "long" | "inches";

export type EventBannerType =
  | "touchdown"
  | "fieldgoal"
  | "pat"
  | "twoPoint"
  | "safety"
  | "turnover"
  | null;

export type PenaltyPreset =
  | "Holding"
  | "False Start"
  | "Offside"
  | "Personal Foul"
  | "Pass Interference"
  | "Unsportsmanlike Conduct"
  | "Illegal Formation"
  | "Delay of Game"
  | "custom";

export interface TeamColors {
  /** Unified background: logo zone + score zone + card fill */
  fill: string;
  scoreText: string;
  border: string;
  borderWidth: number;
  /** Timeout bar color */
  timeout: string;
  /** @deprecated use `timeout` */
  accent?: string;
  /** @deprecated Legacy presets — synced with `fill` on save */
  primary?: string;
  secondary?: string;
  logoBackground?: string;
}

export interface TeamState {
  name: string;
  abbreviation: string;
  score: number;
  logoUrl: string | null;
  colors: TeamColors;
  timeouts: {
    total: number;
    used: number;
    visible: boolean;
  };
}

export interface PenaltyState {
  active: boolean;
  /** When true, overlay shows only "FLAG" (no penalty detail yet) */
  genericOnly: boolean;
  teamId: "home" | "away" | null;
  text: string;
  preset: PenaltyPreset;
}

export interface EventBannerState {
  type: EventBannerType;
  visible: boolean;
  teamId: "home" | "away" | null;
  customText?: string;
}

export interface ScoreboardTheme {
  statusBarBackground: string;
  statusBarText: string;
  statusBarBorder: string;
  outerShadow: string;
  possessionColor: string;
  penaltyBackground: string;
  penaltyText: string;
  eventBannerBackground: string;
  eventBannerText: string;
  skewDegrees: number;
}

export interface ScoreboardState {
  version: 1;
  home: TeamState;
  away: TeamState;
  quarter: Quarter;
  gameClock: string;
  gameClockRunning: boolean;
  downDistance: string;
  downNumber: DownNumber;
  yardsToGo: number;
  distanceKind: DistanceKind;
  /** @deprecated use distanceKind */
  goalToGo?: boolean;
  possession: "home" | "away" | "none";
  penalty: PenaltyState;
  eventBanner: EventBannerState;
  theme: ScoreboardTheme;
  overlayVisible: boolean;
  showGameClock: boolean;
  showPossession: boolean;
  showTeamNames: boolean;
  animationKey: number;
  lastScoreChange?: {
    teamId: "home" | "away";
    delta: number;
    at: number;
  };
}

export type ScoreboardPatch = Partial<{
  home: Partial<TeamState>;
  away: Partial<TeamState>;
  quarter: Quarter;
  gameClock: string;
  gameClockRunning: boolean;
  downDistance: string;
  downNumber: DownNumber;
  yardsToGo: number;
  distanceKind: DistanceKind;
  goalToGo: boolean;
  possession: "home" | "away" | "none";
  penalty: Partial<PenaltyState>;
  eventBanner: Partial<EventBannerState>;
  theme: Partial<ScoreboardTheme>;
  overlayVisible: boolean;
  showGameClock: boolean;
  showPossession: boolean;
  showTeamNames: boolean;
  animationKey: number;
  lastScoreChange: ScoreboardState["lastScoreChange"];
}>;

export interface GamePreset {
  id: string;
  name: string;
  createdAt: string;
  state: ScoreboardState;
}
