import { useEffect, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { columnService } from "@/services/column.service";
import { taskService } from "@/services/task.service";
import { Loader2 } from "lucide-react";
import { AddColumnModal } from "./AddColumnModal";
import { AddColumnButton } from "./AddColumnButton";
import { SortableColumn } from "./SortableColumn";
import { useKanbanStore } from "@/stores/kanban.store";
import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/user";
import type { Column } from "@/types/column";
import type { Task } from "@/types/task";
import { TaskCard } from "./TaskCard";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type {
  DragOverEvent,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

interface KanbanBoardProps {
  projectId: string;
}

export const KanbanBoard = ({ projectId }: KanbanBoardProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragInfo, setDragInfo] = useState<{ sourceColumnId: string; sourceIndex: number } | null>(null);

  const {
    columns: storeColumns,
    setColumns,
    moveTask,
    reorderColumns,
    members: projectMembers,
  } = useKanbanStore();

  const { user: currentUser } = useAuthStore();
  const currentMember = projectMembers.find(
    (m) => (m.userId as User)._id === currentUser?._id,
  );
  const isManager =
    currentMember?.role === "owner" || currentMember?.role === "admin";

  const { data: queryColumns, isLoading } = useQuery({
    queryKey: ["columns", projectId],
    queryFn: () => columnService.getProjectColumns(projectId),
    enabled: !!projectId,
    // staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (queryColumns) {
      setColumns(queryColumns);
    }
  }, [queryColumns, setColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Cần di chuyển 5px mới bắt đầu kéo
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      if (active.data?.current?.type === "column") {
        setActiveColumn(active.data.current.column as Column);
      }
      if (active.data?.current?.type === "task") {
        setActiveTask(active.data.current.task as Task);
        const colId = active.data.current.columnId as string;
        const storeFresh = useKanbanStore.getState().tasks;
        const tasks = storeFresh[colId] || [];
        const idx = tasks.findIndex((t) => t._id === active.id);
        setDragInfo({ sourceColumnId: colId, sourceIndex: idx });
      }
    },
    [],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      if (activeId === overId) return;

      const isActiveTask = active.data?.current?.type === "task";
      const isOverTask = over.data?.current?.type === "task";
      const isOverColumn = over.data?.current?.type === "column";

      if (!isActiveTask) return;

      const storeTasksFresh = useKanbanStore.getState().tasks;

      const activeColumnId = Object.keys(storeTasksFresh).find((colId) =>
        storeTasksFresh[colId].some((t) => t._id === activeId),
      );
      if (!activeColumnId) return;

      const overColumnId = isOverColumn
        ? overId
        : (over.data?.current?.columnId as string);

      if (activeColumnId !== overColumnId) {
        // Task dropped over another task in a different column
        if (isActiveTask && isOverTask) {
          const destList = storeTasksFresh[overColumnId] || [];
          const overIndex = destList.findIndex((t) => t._id === overId);
          moveTask(
            activeColumnId,
            overColumnId,
            activeId,
            overIndex !== -1 ? overIndex : 0,
          );
        }

        // Task dropped over an empty column
        if (isActiveTask && isOverColumn) {
          moveTask(activeColumnId, overColumnId, activeId, 0);
        }
      }
    },
    [moveTask],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveColumn(null);
      setActiveTask(null);
      const { active, over } = event;
      if (!over) {
        setDragInfo(null);
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      const isActiveColumn = active.data?.current?.type === "column";
      const isActiveTask = active.data?.current?.type === "task";

      // ─── Column Reorder ───────────────────────────────────────────────
      if (isActiveColumn && activeId !== overId) {
        const storeColsFresh = useKanbanStore.getState().columns;
        const oldIndex = storeColsFresh.findIndex((c) => c._id === activeId);
        const newIndex = storeColsFresh.findIndex((c) => c._id === overId);
        if (oldIndex === -1 || newIndex === -1) return;

        const newColumns = arrayMove(storeColsFresh, oldIndex, newIndex).map(
          (col, i) => ({ ...col, position: i }),
        );

        reorderColumns(newColumns);
        try {
          await columnService.reorderColumns(
            projectId,
            newColumns.map((c) => c._id),
          );
        } catch {
          reorderColumns(storeColsFresh);
        }
        return;
      }

      // ─── Task Move/Reorder ────────────────────────────────────────────
      if (isActiveTask) {
        const originalColumnId = dragInfo?.sourceColumnId;
        const originalIndex = dragInfo?.sourceIndex ?? 0;
        if (!originalColumnId) {
          setDragInfo(null);
          return;
        }

        const isOverColumn = over.data?.current?.type === "column";
        const overColumnId = isOverColumn
          ? overId
          : (over.data?.current?.columnId as string);

        const storeFresh = useKanbanStore.getState();
        const storeTasksFresh = storeFresh.tasks;
        const isSameColumn = originalColumnId === overColumnId;

        if (isSameColumn) {
          const currentTasks = storeTasksFresh[originalColumnId] || [];
          const currentIndex = currentTasks.findIndex((t) => t._id === activeId);
          let targetIndex = currentTasks.findIndex((t) => t._id === overId);

          if (isOverColumn) targetIndex = currentTasks.length - 1;

          if (currentIndex !== -1 && targetIndex !== -1 && currentIndex !== targetIndex) {
            moveTask(originalColumnId, originalColumnId, activeId, targetIndex);
            
            const newOrderIds = useKanbanStore.getState().tasks[originalColumnId].map((t) => t._id);

            try {
              await taskService.moveTask({
                taskId: activeId,
                sourceColumnId: originalColumnId,
                destinationColumnId: originalColumnId,
                sourceTaskIds: newOrderIds,
                destinationTaskIds: newOrderIds,
                sourceIndex: originalIndex,
                destinationIndex: targetIndex,
              });
            } catch {
              // Handle error
            }
          }
        } else {
          // Cross-column
          const destList = storeTasksFresh[overColumnId] || [];
          const currentIndexInDest = destList.findIndex((t) => t._id === activeId);
          let targetIndex = destList.findIndex((t) => t._id === overId);

          if (isOverColumn) targetIndex = destList.length - 1;

          // Adjust position in dest column before saving
          if (currentIndexInDest !== -1 && targetIndex !== -1 && currentIndexInDest !== targetIndex) {
            moveTask(overColumnId, overColumnId, activeId, targetIndex);
          }

          const finalSourceIds = (useKanbanStore.getState().tasks[originalColumnId] || []).map((t) => t._id);
          const finalDestIds = (useKanbanStore.getState().tasks[overColumnId] || []).map((t) => t._id);
          const finalDestIndex = useKanbanStore.getState().tasks[overColumnId].findIndex((t) => t._id === activeId);

          try {
            await taskService.moveTask({
              taskId: activeId,
              sourceColumnId: originalColumnId,
              destinationColumnId: overColumnId,
              sourceTaskIds: finalSourceIds,
              destinationTaskIds: finalDestIds,
              sourceIndex: originalIndex,
              destinationIndex: finalDestIndex !== -1 ? finalDestIndex : 0,
            });
          } catch {
            // Handle error
          }
        }
        setDragInfo(null);
      }
    },
    [projectId, reorderColumns, moveTask, dragInfo],
  );

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const columnIds = storeColumns.map((c) => c._id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full p-4 overflow-x-auto">
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {storeColumns.map((column) => (
            <SortableColumn key={column._id} column={column} />
          ))}
        </SortableContext>

        {isManager && <AddColumnButton onClick={() => setIsAddModalOpen(true)} />}

        {isManager && (
          <AddColumnModal
            projectId={projectId}
            open={isAddModalOpen}
            onOpenChange={setIsAddModalOpen}
          />
        )}
      </div>

      {/* Drag Overlay: phai des khi kéo cột hoặc task */}
      <DragOverlay dropAnimation={{
          duration: 350,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
        {activeColumn && (
          <div className="w-[300px] bg-background/80 rounded-xl border-2 border-primary/20 shadow-2xl opacity-80 p-3 text-sm font-bold rotate-2 scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
               <span>{activeColumn.title}</span>
               <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
               </div>
            </div>
            <div className="space-y-3 opacity-50">
               <div className="h-20 w-full bg-slate-100 rounded-lg border border-dashed border-slate-300" />
               <div className="h-20 w-full bg-slate-100 rounded-lg border border-dashed border-slate-300" />
            </div>
          </div>
        )}
        {activeTask && (
          <div className="w-[300px] rotate-2 scale-105 transition-transform pointer-events-none">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
