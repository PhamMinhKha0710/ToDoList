import { useEffect, useCallback, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { columnService } from "@/services/column.service";
import { taskService } from "@/services/task.service";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { AddColumnModal } from "./AddColumnModal";
import { AddColumnButton } from "./AddColumnButton";
import { SortableColumn } from "./SortableColumn";
import { useKanbanStore } from "@/stores/kanban.store";
import { useAuthStore } from "@/stores/auth.store";
import type { Column } from "@/types/column";
import type { Task } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const originalColumnsRef = useRef<Column[] | null>(null);
  const queryClient = useQueryClient();

  const {
    columns: storeColumns,
    setColumns,
    moveTask,
    reorderColumns,
    members: projectMembers,
  } = useKanbanStore();

  const { user: currentUser } = useAuthStore();
  const currentMember = projectMembers.find((m) => {
    const mUserId = typeof m.userId === "string" ? m.userId : m.userId?._id;
    return mUserId === currentUser?._id;
  });
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

  // Navigation scrolling logic
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isNearLeft, setIsNearLeft] = useState(false);
  const [isNearRight, setIsNearRight] = useState(false);

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      // Buffer of 10px to be safe against subpixel rendering
      const canScrollLeft = scrollLeft > 10;
      const canScrollRight = Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10;
      
      setShowLeftArrow(canScrollLeft);
      setShowRightArrow(canScrollRight);
    }
  }, []);

  // Global mouse listener for viewport-edge detection
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const trigger = 40; // Proximity to activate
      const maintain = 150; // Distance to keep active
      
      const x = e.clientX;
      const windowWidth = window.innerWidth;
      
      // Right edge detection (relative to window width)
      const distFromRight = windowWidth - x;
      setIsNearRight(prev => prev ? (distFromRight <= maintain) : (distFromRight <= trigger));
      
      // Left edge detection (relative to container start)
      const distFromLeft = x - rect.left;
      setIsNearLeft(prev => prev ? (distFromLeft >= 0 && distFromLeft <= maintain) : (distFromLeft >= 0 && distFromLeft <= trigger));
      
      // Always keep checkScroll sync
      checkScroll();
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, [checkScroll]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      
      const resizeObserver = new ResizeObserver(() => checkScroll());
      resizeObserver.observe(container);

      const mutationObserver = new MutationObserver(() => checkScroll());
      mutationObserver.observe(container, { childList: true, subtree: true, characterData: true });
      
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, [checkScroll]);

  // Re-check scroll buttons when columns change or after a short delay for rendering
  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 300); // Wait bit longer for layout
    return () => clearTimeout(timer);
  }, [storeColumns, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      // Cuộn theo 50% chiều rộng của vùng chứa hiển thị
      // Lấy chiều rộng hiện tại của container (phần đang nhìn thấy)
      const scrollAmount = container.clientWidth * 0.5;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Cần di chuyển 5px mới bắt đầu kéo
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      if (active.data?.current?.type === "column") {
        const cols = useKanbanStore.getState().columns;
        setActiveColumn(active.data.current.column as Column);
        originalColumnsRef.current = cols;
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
      const isActiveColumn = active.data?.current?.type === "column";
      const isOverTask = over.data?.current?.type === "task";
      const isOverColumn = over.data?.current?.type === "column";

      // ─── Move Task ───
      if (isActiveTask) {
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
          if (isOverTask) {
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
          if (isOverColumn) {
            moveTask(activeColumnId, overColumnId, activeId, 0);
          }
        }
      }

      // ─── Move Column ───
      if (isActiveColumn) {
        const storeColsFresh = useKanbanStore.getState().columns;
        const oldIndex = storeColsFresh.findIndex((c) => c._id === activeId);
        
        const overColumnId = isOverColumn 
          ? overId 
          : (over.data?.current?.columnId as string);
          
        const newIndex = storeColsFresh.findIndex((c) => c._id === overColumnId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newColumns = arrayMove(storeColsFresh, oldIndex, newIndex).map(
            (col, i) => ({ ...col, position: i }),
          );
          reorderColumns(newColumns);
        }
      }
    },
    [moveTask, reorderColumns],
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
      if (isActiveColumn) {
        const finalColumns = useKanbanStore.getState().columns;
        const snapshot = originalColumnsRef.current;
        const hasChanged = snapshot &&
          finalColumns.some((col, i) => col._id !== snapshot[i]?._id);

        if (hasChanged) {
          try {
            const updatedColumns = await columnService.reorderColumns(
              projectId,
              finalColumns.map((c) => c._id),
            );
            // Sync store and query cache with server truth
            setColumns(updatedColumns);
            queryClient.invalidateQueries({ queryKey: ["columns", projectId] });
          } catch {
            if (snapshot) reorderColumns(snapshot);
          }
        }
        originalColumnsRef.current = null;
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
              queryClient.invalidateQueries({ queryKey: ["tasks", originalColumnId] });
            } catch {
              // Rollback or handle error
              moveTask(originalColumnId, originalColumnId, activeId, originalIndex);
              queryClient.invalidateQueries({ queryKey: ["tasks", originalColumnId] });
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
            // Invalidate queries to get fresh data from server
            queryClient.invalidateQueries({ queryKey: ["tasks", originalColumnId] });
            queryClient.invalidateQueries({ queryKey: ["tasks", overColumnId] });
          } catch {
            // Rollback on fail
            moveTask(overColumnId, originalColumnId, activeId, originalIndex);
            queryClient.invalidateQueries({ queryKey: ["tasks", originalColumnId] });
            queryClient.invalidateQueries({ queryKey: ["tasks", overColumnId] });
          }
        }
        setDragInfo(null);
      }
    },
    [projectId, reorderColumns, moveTask, dragInfo, setColumns, queryClient],
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
      <div 
        className="relative h-full w-full group/board overflow-hidden min-w-0"
      >
        {/* Navigation Arrows & Gradient Overlays */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-32 z-40 flex items-center pl-4 pointer-events-none transition-all duration-500 ease-out",
          (showLeftArrow && isNearLeft) ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <Button
            variant="secondary"
            size="icon"
            className="relative h-14 w-14 rounded-full shadow-2xl border border-primary/20 bg-background/80 backdrop-blur-xl hover:scale-110 pointer-events-auto transition-all duration-300 flex items-center justify-center group"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-10 w-10 text-primary group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
          </Button>
        </div>

        <div className={cn(
          "absolute right-20 top-0 bottom-0 w-32 z-40 flex items-center justify-end pr-4 pointer-events-none transition-all duration-500 ease-out",
          (showRightArrow && isNearRight) ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
        )}>

          <div className="absolute inset-0 bg-gradient-to-l from-background via-background/60 to-transparent" />
          <Button
            variant="secondary"
            size="icon"
            className="relative h-14 w-14 rounded-full shadow-2xl border border-primary/20 bg-background/80 backdrop-blur-xl hover:scale-110 pointer-events-auto transition-all duration-300 flex items-center justify-center group"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-10 w-10 text-primary group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
          </Button>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex gap-4 h-full w-full p-4 overflow-x-auto overflow-y-hidden"
        >
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {storeColumns.map((column) => (
              <SortableColumn key={column._id} column={column} />
            ))}
          </SortableContext>

          {isManager && <AddColumnButton onClick={() => setIsAddModalOpen(true)} />}
        </div>

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
