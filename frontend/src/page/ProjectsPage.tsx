import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, LayoutGrid, List as ListIcon, Loader2 } from "lucide-react";
import { projectService } from "@/services/project.service";
import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/user";
import { ProjectItem } from "@/components/project/ProjectItem";
import { CreateProjectModal } from "@/components/project/CreateProjectModal";
import { Button } from "@/components/ui/button";

const ProjectsPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"active" | "pending">("active");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user: currentUser } = useAuthStore();

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: projectService.getProjects,
  });

  const allProjects = response?.data?.projects || [];

  // Phân loại dự án dựa trên status của user hiện tại
  const projects = allProjects.filter((project) => {
    const member = project.members.find(
      (m) =>
        (typeof m.userId === "string" ? m.userId : (m.userId as User)._id) ===
        currentUser?._id,
    );
    const status = member?.status || "active"; // Mặc định active cho data cũ
    return status === filter;
  });

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Header Area */}
      <div className="flex items-center justify-between px-8 py-6 border-b bg-background">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all your current projects.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
            <Button
              variant={filter === "active" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("active")}
              className="px-3"
            >
              Dự án
            </Button>
            <Button
              variant={filter === "pending" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("pending")}
              className="px-3"
            >
              Chờ xác nhận
            </Button>
          </div>

          <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-3"
            >
              <ListIcon className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
          <Button
            className="shadow-sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading your projects...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-destructive">
            <p>Failed to load projects. Please try again.</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 border-2 border-dashed rounded-xl p-12 bg-background/50">
            <div className="p-4 bg-muted rounded-full">
              <LayoutGrid className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                {filter === "active"
                  ? "Không tìm thấy dự án nào"
                  : "Không có lời mời nào đang chờ"}
              </h3>
              <p className="text-muted-foreground mt-1">
                {filter === "active"
                  ? "Bắt đầu bằng cách tạo dự án đầu tiên của bạn."
                  : "Khi có người mời bạn vào dự án, lời mời sẽ xuất hiện ở đây."}
              </p>
            </div>
            {filter === "active" && (
              <Button
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div
            className={`
              ${
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "flex flex-col space-y-4 max-w-5xl mx-auto"
              }
            `}
          >
            {projects.map((project) => {
              return (
                <ProjectItem
                  key={project._id}
                  project={project}
                  viewMode={viewMode}
                />
              );
            })}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
};

export default ProjectsPage;
