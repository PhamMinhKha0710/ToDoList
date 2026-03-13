import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import { ProjectHeader } from '@/components/project-detail/ProjectHeader';
import { Loader2 } from 'lucide-react';
import { KanbanBoard } from '@/components/board/KanbanBoard';

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProjectById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 bg-accent-foreground/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !response?.data?.project) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-accent-foreground/5 gap-4">
        <h2 className="text-xl font-semibold text-destructive">Không thể tải dữ liệu dự án</h2>
        <p className="text-muted-foreground">Có thể dự án không tồn tại hoặc bạn không có quyền truy cập.</p>
      </div>
    );
  }

  const project = response.data.project;

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="p-6 pb-0">
        <ProjectHeader project={project} />
      </div>
      
      {/* Kanban Board Area */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={project._id} />
      </div>
    </div>
  );
};

export default ProjectDetailPage;
