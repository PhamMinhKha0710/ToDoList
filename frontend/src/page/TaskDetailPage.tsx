import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { projectService } from "@/services/project.service";
import { columnService } from "@/services/column.service";
import { TaskDetailModal } from "@/components/taskDetail/TaskDetailModal";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKanbanStore } from "@/stores/kanban.store";

const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setMembers } = useKanbanStore();

  const { data: task, isLoading: isTaskLoading, error: taskError } = useQuery({
    queryKey: ["task", id],
    queryFn: () => taskService.getTaskById(id!),
    enabled: !!id,
  });

  // Fetch project members to populate the context needed by TaskDetailModal
  useEffect(() => {
    if (task?.columnId) {
      columnService.getColumnById(task.columnId).then((column) => {
        projectService.getProjectById(column.projectId).then((response) => {
          setMembers(response.data.project.members);
        });
      });
    }
  }, [task, setMembers]);

  if (isTaskLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (taskError || !task) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold text-destructive">Task not found</h2>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Task Details</h1>
      </div>
      
      <TaskDetailModal 
        task={task} 
        open={true} 
        onOpenChange={(open) => {
          if (!open) navigate(-1);
        }} 
      />
    </div>
  );
};

export default TaskDetailPage;
