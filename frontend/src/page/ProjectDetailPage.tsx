import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
// import { ProjectHeader } from '@/components/project-detail/ProjectHeader';
import { Loader2 } from "lucide-react";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { useKanbanStore } from "@/stores/kanban.store";
import { useProjectSocket } from "@/hooks/use-socket";
import { EventReplayModal } from "@/components/board/EventReplayModal";
import { ProjectHeader } from "@/components/project-detail/ProjectHeader";
import { ProjectActivitySidebar } from "@/components/project-detail/ProjectActivitySidebar";

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { setMembers, setActiveProject } = useKanbanStore();
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getProjectById(id!),
    enabled: !!id,
  });

  const project = response?.data?.project;

  useEffect(() => {
    if (project) {
      setMembers(project.members);
      setActiveProject(project);
    }

    return () => {
      setActiveProject(null);
    };
  }, [project, setMembers, setActiveProject]);

  // Kết nối realtime cho project room này
  useProjectSocket(id);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 bg-accent-foreground/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-accent-foreground/5 gap-4">
        <h2 className="text-xl font-semibold text-destructive">
          Không thể tải dữ liệu dự án
        </h2>
        <p className="text-muted-foreground">
          Có thể dự án không tồn tại hoặc bạn không có quyền truy cập.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      <div className="p-4 pb-2">
        <ProjectHeader 
          project={project} 
          onToggleActivity={() => setIsActivityOpen(!isActivityOpen)}
          onToggleReplay={() => setIsReplayOpen(true)}
        />
      </div>
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Kanban Board Area */}
        <div className="flex-1 overflow-hidden">
          <KanbanBoard projectId={project._id} />
        </div>

        {/* Activity Sidebar */}
        <ProjectActivitySidebar 
          projectId={project._id}
          isOpen={isActivityOpen}
          onClose={() => setIsActivityOpen(false)}
        />
      </div>

      {isReplayOpen && (
        <EventReplayModal 
            isOpen={isReplayOpen} 
            onClose={() => setIsReplayOpen(false)} 
            projectId={project._id} 
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;
