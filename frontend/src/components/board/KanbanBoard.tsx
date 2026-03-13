import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { columnService } from "@/services/column.service";
import { Loader2 } from "lucide-react";
import { AddColumnModal } from "./AddColumnModal";
import { BoardContainer } from "./BoardContainer";
import { AddColumnButton } from "./AddColumnButton";
import { ColumnHeader } from "./ColumnHeader";
import { ColumnList } from "./ColumnList";

interface KanbanBoardProps {
  projectId: string;
}

export const KanbanBoard = ({ projectId }: KanbanBoardProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: columns, isLoading } = useQuery({
    queryKey: ["columns", projectId],
    queryFn: () => columnService.getProjectColumns(projectId),
    enabled: !!projectId,
  });

  console.log("columns: ", columns);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BoardContainer>
      {/* Các cột hiện tại */}
      {columns?.map((column) => (
        <div
          key={column._id}
          className="w-[300px] shrink-0 bg-secondary/50 rounded-xl p-3 flex flex-col gap-3"
        >
          <ColumnHeader column={column} />
          <ColumnList columnId={column._id} />
        </div>
      ))}

      {/* Nút thêm cột */}
      <AddColumnButton onClick={() => setIsAddModalOpen(true)} />

      {/* Modal thêm cột */}
      <AddColumnModal
        projectId={projectId}
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </BoardContainer>
  );
};
