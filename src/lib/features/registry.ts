/**
 * Extension registry for future overlay modules (play clock, drive tracker,
 * sponsor banners, lower thirds, Stream Deck hooks, API feeds).
 * Register components and socket handlers here as the product grows.
 */

export type FeatureId =
  | "play-clock"
  | "drive-tracker"
  | "player-stats"
  | "sponsor-banners"
  | "lower-thirds"
  | "stream-deck"
  | "api-integrations"
  | "touchscreen";

export interface FeatureDefinition {
  id: FeatureId;
  label: string;
  description: string;
  enabled: boolean;
}

export const FEATURE_ROADMAP: FeatureDefinition[] = [
  {
    id: "play-clock",
    label: "Play clock",
    description: "40/25 second play clock beside game clock",
    enabled: false,
  },
  {
    id: "drive-tracker",
    label: "Drive tracker",
    description: "Field position and drive summary bar",
    enabled: false,
  },
  {
    id: "player-stats",
    label: "Player statistics",
    description: "Lower-third stat lines tied to roster",
    enabled: false,
  },
  {
    id: "sponsor-banners",
    label: "Sponsor banners",
    description: "Rotating sponsor slates",
    enabled: false,
  },
  {
    id: "lower-thirds",
    label: "Lower thirds",
    description: "Generic broadcast lower thirds",
    enabled: false,
  },
  {
    id: "stream-deck",
    label: "Stream Deck",
    description: "Hotkey / HTTP bridge for Elgato Stream Deck",
    enabled: false,
  },
  {
    id: "api-integrations",
    label: "API integrations",
    description: "External score feed sync",
    enabled: false,
  },
  {
    id: "touchscreen",
    label: "Touchscreen controls",
    description: "Fullscreen touch UI mirroring control panel",
    enabled: false,
  },
];
