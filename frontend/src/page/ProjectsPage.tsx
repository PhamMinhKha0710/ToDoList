import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, LayoutGrid, List as ListIcon, Loader2, Search, Filter } from "lucide-react";
import { projectService } from "@/services/project.service";
import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/user";
import { ProjectItem } from "@/components/project/ProjectItem";
import { CreateProjectModal } from "@/components/project/CreateProjectModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ProjectsPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"active" | "pending">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "name">("updated");
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

  // Phân loại, tìm kiếm và sắp xếp dự án
  const projects = allProjects
    .filter((project) => {
      // 1. Lọc theo trạng thái (active/pending) của user hiện tại
      const member = project.members.find(
        (m) =>
          (typeof m.userId === "string" ? m.userId : (m.userId as User)._id) ===
          currentUser?._id,
      );
      const status = member?.status || "active";
      if (status !== filter) return false;

      // 2. Tìm kiếm theo tên hoặc mô tả
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      // 3. Sắp xếp
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "created")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="flex flex-col h-full bg-background/50">
      {/* Header Area */}
      <div className="flex items-center justify-between px-8 py-6 border-b bg-background">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">
            Dự án của bạn
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Quản lý và xem tất cả các không gian làm việc của bạn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm dự án..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
            />
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Sắp xếp:</span>
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl bg-slate-50/50 border-slate-200 font-medium">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Vừa cập nhật</SelectItem>
                <SelectItem value="created">Mới nhất</SelectItem>
                <SelectItem value="name">Tên (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center bg-slate-100/50 rounded-xl p-1 border border-slate-200">
            <Button
              variant={filter === "active" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("active")}
              className={cn(
                "h-8 px-4 rounded-lg font-bold text-xs transition-all",
                filter === "active" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"
              )}
            >
              Dự án
            </Button>
            <Button
              variant={filter === "pending" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("pending")}
              className={cn(
                "h-8 px-4 rounded-lg font-bold text-xs transition-all",
                filter === "pending" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"
              )}
            >
              Lời mời
            </Button>
          </div>

          <div className="flex items-center bg-slate-100/50 rounded-xl p-1 border border-slate-200">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-8 px-3 rounded-lg flex items-center gap-1.5",
                viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-8 px-3 rounded-lg flex items-center gap-1.5",
                viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"
              )}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>

          <Button
            className="h-10 px-6 bg-indigo-600 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo dự án
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
