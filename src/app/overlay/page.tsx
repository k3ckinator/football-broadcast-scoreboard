import { ScoreboardOverlay } from "@/components/overlay/ScoreboardOverlay";

export default function OverlayPage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "transparent" }}
    >
      <ScoreboardOverlay />
    </div>
  );
}
