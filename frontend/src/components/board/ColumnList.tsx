import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKanbanStore } from "@/stores/kanban.store";
import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { AddTaskModal } from "./AddTaskModal";
import { TaskCard } from "./TaskCard";
import { TaskDetailModal } from "../taskDetail/TaskDetailModal";
import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/user";
import type { Task } from "@/types/task";

interface ColumnListProps {
  columnId: string;
}

export const ColumnList = ({ columnId }: ColumnListProps) => {
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const {
    tasks: storeTasks,
    setTasks,
    members: projectMembers,
  } = useKanbanStore();
  const { user: currentUser } = useAuthStore();
  const columnTasks = storeTasks[columnId] || [];

  console.log("columnTasks: ", columnTasks);

  const currentMember = projectMembers.find(
    (m) => (m.userId as User)._id === currentUser?._id,
  );
  const isViewer = currentMember?.role === "viewer";

  const { data: queryTasks, isLoading } = useQuery({
    queryKey: ["tasks", columnId],
    queryFn: () => taskService.getTasksByColumnId(columnId),
    enabled: !!columnId,
  });

  // Sync with store
  useEffect(() => {
    if (queryTasks) {
      setTasks(columnId, queryTasks);
    }
  }, [queryTasks, columnId, setTasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div className="flex flex-col h-full pt-3">
      <div
        data-column-id={columnId}
        className="flex-1 flex flex-col gap-3 overflow-y-auto mb-3"
      >
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : columnTasks.length === 0 ? (
          <div
            onClick={() => !isViewer && setIsAddTaskModalOpen(true)}
            className={`flex-1 min-h-[120px] rounded-lg p-4 flex flex-col items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-muted-foreground/20 bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group ${isViewer ? "cursor-default pointer-events-none" : ""}`}
          >
            <div className="w-8 h-8 rounded-full bg-green-100/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Plus className="h-4 w-4 text-green-500" />
            </div>
            <span className="font-medium text-muted-foreground/70">
              Chưa có task nào
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {columnTasks.map((task) => (
              <TaskCard key={task._id} task={task} onClick={handleTaskClick} />
            ))}
          </div>
        )}
      </div>

      {!isViewer && (
        <Button
          variant="outline"
          className="w-full bg-background border-dashed text-muted-foreground hover:text-foreground justify-start px-4 h-10 shrink-0"
          onClick={() => setIsAddTaskModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="font-semibold">Thêm task</span>
        </Button>
      )}

      <AddTaskModal
        columnId={columnId}
        open={isAddTaskModalOpen}
        onOpenChange={setIsAddTaskModalOpen}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(isOpen: boolean) => {
            if (!isOpen) setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};
