import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { columnService } from "@/services/column.service";
import { Loader2 } from "lucide-react";
import { AddColumnModal } from "./AddColumnModal";
import { BoardContainer } from "./BoardContainer";
import { AddColumnButton } from "./AddColumnButton";
import { ColumnHeader } from "./ColumnHeader";
import { ColumnList } from "./ColumnList";
import { useKanbanStore } from "@/stores/kanban.store";

interface KanbanBoardProps {
  projectId: string;
}

export const KanbanBoard = ({ projectId }: KanbanBoardProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { columns: storeColumns, setColumns } = useKanbanStore();

  const { data: queryColumns, isLoading } = useQuery({
    queryKey: ["columns", projectId],
    queryFn: () => columnService.getProjectColumns(projectId),
    enabled: !!projectId,
  });

  // Đồng bộ data từ query vao store
  useEffect(() => {
    if (queryColumns) {
      setColumns(queryColumns);
    }
  }, [queryColumns, setColumns]);

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
      {storeColumns.map((column) => (
        <div
          key={column._id}
          className="w-[300px] shrink-0 bg-background/50 rounded-xl flex flex-col overflow-hidden shadow-sm"
        >
          <ColumnHeader column={column} />
          <div className="p-3 pt-0 flex flex-col gap-3 flex-1 h-full">
            <ColumnList columnId={column._id}  />
          </div>
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
