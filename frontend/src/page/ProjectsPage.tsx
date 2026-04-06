import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, LayoutGrid, List as ListIcon, Loader2, Search, X } from "lucide-react";
import { projectService } from "@/services/project.service";
import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/user";
import { ProjectItem } from "@/components/project/ProjectItem";
import { CreateProjectModal } from "@/components/project/CreateProjectModal";
import { Button } from "@/components/ui/button";

const ProjectsPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"active" | "pending">("active");
  const [searchTerm, setSearchTerm] = useState("");
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
    
    const matchesFilter = status === filter;
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
                         
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b bg-background">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dự án
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý không gian làm việc và cộng tác với nhóm của bạn.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative group w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm dự án..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-8 bg-background border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
            <Button
              variant={filter === "active" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("active")}
              className="px-3"
            >
              Đang hoạt động
            </Button>
            <Button
              variant={filter === "pending" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("pending")}
              className="px-3"
            >
              Lời mời
            </Button>
          </div>

          <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-2"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            className="shadow-sm ml-1"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm dự án
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1600px] mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm">Đang tải danh sách dự án...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-destructive border rounded-lg bg-destructive/5">
              <p className="font-medium">Không thể tải dữ liệu dự án. Vui lòng thử lại.</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed rounded-xl bg-muted/30">
              <div className="p-4 bg-background shadow-sm rounded-full mb-4 inline-flex items-center justify-center">
                <LayoutGrid className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm 
                  ? "Không tìm thấy kết quả"
                  : filter === "active"
                    ? "Chưa có dự án nào"
                    : "Không có lời mời nào"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {searchTerm
                  ? `Không có dự án nào khớp với "${searchTerm}". Hãy thử từ khóa khác.`
                  : filter === "active"
                    ? "Không gian làm việc của bạn đang trống. Hãy tạo dự án đầu tiên để bắt đầu theo dõi công việc."
                    : "Các dự án bạn được mời tham gia sẽ xuất hiện ở đây."}
              </p>
              {(filter === "active" || searchTerm) && (
                <Button
                  onClick={() => {
                    if (searchTerm) setSearchTerm("");
                    else setIsCreateModalOpen(true);
                  }}
                  className="shadow-sm"
                >
                  {searchTerm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {searchTerm ? "Xóa tìm kiếm" : "Tạo dự án"}
                </Button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "flex flex-col space-y-4"
              }
            >
              {projects.map((project) => (
                <ProjectItem
                  key={project._id}
                  project={project}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
};

export default ProjectsPage;
