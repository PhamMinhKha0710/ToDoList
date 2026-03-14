import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "@/types/project";
import type { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Edit,
  Settings,
  Users,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { EditProjectDialog } from "./EditProjectDialog";
import { ProjectMembersDialog } from "./ProjectMembersDialog";
import { useAuthStore } from "@/stores/auth.store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import { toast } from "sonner";

interface ProjectHeaderProps {
  project: Project;
}

export const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  const navigate = useNavigate();

  console.log("project: ", project);

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Determine current user's role
  const currentMember = project.members.find(
    (m) => (m.userId as User)._id === currentUser?._id,
  );
  const isOwner = currentMember?.role === "owner";
  const isManager = currentMember?.role === "owner" || currentMember?.role === "admin";

  const deleteMutation = useMutation({
    mutationFn: () => projectService.deleteProject(project._id),
    onSuccess: () => {
      toast.success("Xóa dự án thành công.");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi xóa dự án",
      );
      setIsDeleteDialogOpen(false);
    },
  });

  const membersToDisplay = project.members.slice(0, 3);
  const remainingMembersCount =
    project.members.length - membersToDisplay.length;

  const initials = project.name.substring(0, 2).toUpperCase();
  const accentColor = project.color || "#3b82f6";

  return (
    <div className="flex flex-col gap-4 mb-6 border-b pb-4 pt-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/projects")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 rounded-lg border shadow-sm">
              <AvatarImage
                src={project.imageUrl}
                alt={project.name}
                className="object-cover"
              />
              <AvatarFallback
                className="rounded-lg text-white text-xl font-bold"
                style={{ backgroundColor: accentColor }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Members Avatars Button */}
          <Button
            variant="outline"
            className="flex items-center gap-2 h-10 px-3"
            onClick={() => setIsMembersDialogOpen(true)}
          >
            <div className="flex -space-x-2 mr-1">
              {membersToDisplay.map((member) => {
                const user = member.userId as User;
                const name = user.displayName || user.email.split("@")[0];
                return (
                  <Avatar
                    key={user._id}
                    className="h-7 w-7 border-2 border-background"
                  >
                    <AvatarImage src={user.avatarUrl} alt={name} />
                    <AvatarFallback className="text-[10px]">
                      {name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
              {remainingMembersCount > 0 && (
                <Avatar className="h-7 w-7 border-2 border-background">
                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                    +{remainingMembersCount}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <span className="text-sm border-l pl-2 border-border hidden sm:inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> Thành viên
            </span>
          </Button>

          {/* Owner & Admin Actions Dropdown */}
          {isManager && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" /> Sửa thông tin
                  </DropdownMenuItem>
                )}
                {isOwner && <DropdownMenuSeparator />}
                {isOwner && (
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Xóa dự án
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isEditDialogOpen && (
        <EditProjectDialog
          project={project}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}

      {isMembersDialogOpen && (
        <ProjectMembersDialog
          project={project}
          open={isMembersDialogOpen}
          onOpenChange={setIsMembersDialogOpen}
          isOwner={isOwner}
          isManager={isManager}
          currentUserId={currentUser?._id || ""}
        />
      )}

      {/* Delete Project Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Xác nhận xóa dự án
            </DialogTitle>
            <DialogDescription className="py-4">
              Bạn có chắc chắn muốn xóa dự án
              <span className="font-semibold text-foreground mx-1">
                {project.name}
              </span>
              không? Hành động này không thể hoàn tác và tất cả dữ liệu sẽ bị
              mất.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa dự án"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
