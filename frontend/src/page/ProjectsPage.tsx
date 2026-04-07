import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, LayoutGrid, List as ListIcon, Loader2, Search, X } from "lucide-react";
import { projectService } from "@/services/project.service";
import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/user";
import { ProjectItem } from "@/components/project/ProjectItem";
import { CreateProjectModal } from "@/components/project/CreateProjectModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const projects = allProjects.filter((project) => {
    const member = project.members.find(
      (m) =>
        (typeof m.userId === "string" ? m.userId : (m.userId as User)._id) ===
        currentUser?._id,
    );
    const status = member?.status || "active";

    const matchesFilter = status === filter;
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-8 py-6 border-b">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-foreground">
            Dự án
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Quản lý không gian làm việc và cộng tác với nhóm của bạn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full md:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm dự án..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
            <Button
              variant={filter === "active" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("active")}
              className={`px-3 ${filter === "active" ? "shadow-sm" : ""}`}
            >
              Đang hoạt động
            </Button>
            <Button
              variant={filter === "pending" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("pending")}
              className={`px-3 ${filter === "pending" ? "shadow-sm" : ""}`}
            >
              Lời mời
            </Button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`px-3 ${viewMode === "grid" ? "shadow-sm" : ""}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={`px-3 ${viewMode === "list" ? "shadow-sm" : ""}`}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>

          <Button
            className="shadow-sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm dự án
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Đang tải dự án...</p>
              <p className="font-bold tracking-wider uppercase text-xs opacity-50">Đang đồng bộ không gian làm việc...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-destructive p-8 border-2 border-destructive/20 border-dashed rounded-3xl bg-destructive/5 m-4">
              <p className="font-bold">Không thể tải dự án. Vui lòng thử lại.</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 border-2 border-dashed rounded-[2.5rem] p-16 bg-muted/10 backdrop-blur-sm animate-in zoom-in-95 duration-500">
              <div className="p-6 bg-background shadow-xl rounded-[2rem] border-2 border-primary/10">
                <LayoutGrid className="h-12 w-12 text-primary/40" />
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-2xl font-bold text-foreground">
                  {searchTerm 
                    ? "Không tìm thấy kết quả"
                    : filter === "active"
                      ? "Chưa có dự án nào"
                      : "Không có lời mời nào"}
                </h3>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  {searchTerm
                    ? `Không tìm thấy dự án nào khớp với "${searchTerm}". Hãy thử từ khóa khác.`
                    : filter === "active"
                      ? "Không gian làm việc của bạn đang trống. Hãy tạo dự án đầu tiên để bắt đầu theo dõi công việc."
                      : "Các cộng tác sẽ xuất hiện ở đây khi bạn được mời tham gia dự án."}
                </p>
              </div>
              {(filter === "active" || searchTerm) && (
                <Button
                  className="mt-6 px-10 h-12 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  onClick={() => {
                    if (searchTerm) setSearchTerm("");
                    else setIsCreateModalOpen(true);
                  }}
                >
                  {searchTerm ? <X className="mr-2 h-6 w-6" /> : <Plus className="mr-2 h-6 w-6" />}
                  {searchTerm ? "Xóa tìm kiếm" : "Khởi tạo dự án"}
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
