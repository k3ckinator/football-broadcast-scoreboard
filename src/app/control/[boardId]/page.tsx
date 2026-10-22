import { ControlDashboard } from "@/components/control/ControlDashboard";
import { BoardSocketProvider } from "@/components/providers/BoardSocketProvider";

type PageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function ControlBoardPage({ params }: PageProps) {
  const { boardId } = await params;
  return (
    <BoardSocketProvider boardId={boardId}>
      <ControlDashboard boardId={boardId} />
    </BoardSocketProvider>
  );
}
