import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "@/types/project";
import type { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
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
import { type AppAxiosError, getErrorMessage } from "@/types/error";

interface ProjectNavbarActionsProps {
  project: Project;
}

export function ProjectNavbarActions({ project }: ProjectNavbarActionsProps) {
  const navigate = useNavigate();
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
  const isManager =
    currentMember?.role === "owner" || currentMember?.role === "admin";

  const deleteMutation = useMutation({
    mutationFn: () => projectService.deleteProject(project._id),
    onSuccess: () => {
      toast.success("Xóa dự án thành công.");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
    onError: (error: AppAxiosError) => {
      toast.error(getErrorMessage(error) || "Có lỗi xảy ra khi xóa dự án");
      setIsDeleteDialogOpen(false);
    },
  });

  const membersToDisplay = project.members.slice(0, 3);
  const remainingMembersCount =
    project.members.length - membersToDisplay.length;

  return (
    <div className="flex items-center gap-2">
      {/* Members Avatars Button */}
      <Button
        variant="ghost"
        className="flex items-center gap-2 h-8 px-2 hover:bg-accent/50"
        onClick={() => setIsMembersDialogOpen(true)}
        title="Thành viên"
      >
        <div className="flex -space-x-1.5 mr-0.5">
          {membersToDisplay.map((member) => {
            const user = member.userId as User;
            const name = user.displayName || user.email.split("@")[0];
            return (
              <Avatar
                key={user._id}
                className="h-5 w-5 border border-background shadow-xs"
              >
                <AvatarImage src={user.avatarUrl} alt={name} />
                <AvatarFallback className="text-[8px]">
                  {name.substring(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            );
          })}
          {remainingMembersCount > 0 && (
            <Avatar className="h-5 w-5 border border-background shadow-xs">
              <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                +{remainingMembersCount}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <Users className="h-4 w-4 text-muted-foreground md:hidden" />
        <span className="text-xs font-medium text-muted-foreground hidden md:inline-block border-l pl-2 border-border ml-1">
          Thành viên
        </span>
      </Button>

      {/* Owner & Admin Actions Dropdown */}
      {isManager && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/50">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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

      {/* Dialogs */}
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
}
