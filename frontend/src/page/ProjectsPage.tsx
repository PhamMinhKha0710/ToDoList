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
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Premium Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header Area */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between px-8 py-8 border-b bg-background/80 backdrop-blur-md sticky top-0">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-foreground">
            Dự án
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Quản lý không gian làm việc và cộng tác với nhóm của bạn.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Search Input */}
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Tìm kiếm dự án..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-9 bg-muted/30 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-muted/30 rounded-xl p-1 border shadow-inner">
            <Button
              variant={filter === "active" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("active")}
              className={`px-4 rounded-lg font-bold transition-all duration-300 ${filter === "active" ? "shadow-sm" : ""}`}
            >
              Đang hoạt động
            </Button>
            <Button
              variant={filter === "pending" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("pending")}
              className={`px-4 rounded-lg font-bold transition-all duration-300 ${filter === "pending" ? "shadow-sm" : ""}`}
            >
              Lời mời
            </Button>
          </div>

          <div className="flex items-center bg-muted/30 rounded-xl p-1 border shadow-inner">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`px-3 rounded-lg transition-all duration-300 ${viewMode === "grid" ? "shadow-sm" : ""}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={`px-3 rounded-lg transition-all duration-300 ${viewMode === "list" ? "shadow-sm" : ""}`}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            className="shadow-lg shadow-primary/20 bg-primary hover:scale-105 active:scale-95 transition-all duration-300 rounded-xl px-6 font-bold"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Thêm dự án
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-auto relative z-10 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-muted-foreground animate-in fade-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
            </div>
            <p className="font-bold tracking-widest uppercase text-xs opacity-50">Đang đồng bộ không gian làm việc...</p>
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
            className={`
              ${
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                  : "flex flex-col space-y-4 max-w-6xl mx-auto"
              }
              animate-in slide-in-from-bottom-4 duration-700
            `}
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

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
};

export default ProjectsPage;
