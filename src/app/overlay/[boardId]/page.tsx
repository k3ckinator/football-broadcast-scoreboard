import { ScoreboardOverlay } from "@/components/overlay/ScoreboardOverlay";
import { BoardSocketProvider } from "@/components/providers/BoardSocketProvider";

type PageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function OverlayBoardPage({ params }: PageProps) {
  const { boardId } = await params;
  return (
    <BoardSocketProvider boardId={boardId}>
      <div
        className="min-h-screen w-full"
        style={{ background: "transparent" }}
      >
        <ScoreboardOverlay />
      </div>
    </BoardSocketProvider>
  );
}
