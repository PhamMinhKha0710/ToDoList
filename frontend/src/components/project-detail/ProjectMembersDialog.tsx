import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import type { Project, ProjectMember } from "@/types/project";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, ShieldAlert, Link as LinkIcon, Copy, RefreshCw, Check } from "lucide-react";
import { UserSearchSelect } from "../project/UserSearchSelect";
import type { User } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type AssignableRole = "admin" | "member" | "viewer";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const ROLE_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
  viewer: "outline",
};

interface ProjectMembersDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
  isManager: boolean; // owner hoặc admin
  currentUserId: string;
}

export const ProjectMembersDialog = ({
  project,
  open,
  onOpenChange,
  isOwner,
  isManager,
  currentUserId,
}: ProjectMembersDialogProps) => {
  const queryClient = useQueryClient();
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  // Queries
  const { data: inviteRes, refetch: refetchInvite } = useQuery({
    queryKey: ["projectInviteCode", project._id],
    queryFn: () => projectService.getInviteCode(project._id),
    enabled: open && isManager,
  });

  const inviteCode = inviteRes?.data?.inviteCode;
  const inviteLink = `${window.location.origin}/join/${inviteCode}`;

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (data: { user: User; role: AssignableRole }) =>
      projectService.addMember(project._id, data.user.email, data.role),
    onSuccess: () => {
      toast.success("Đã thêm thành viên thành công.");
      queryClient.invalidateQueries({ queryKey: ["project", project._id] });
    },
    onError: () => {
      // Global toast handled
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data: { memberId: string; role: AssignableRole }) =>
      projectService.updateMemberRole(project._id, data.memberId, data.role),
    onSuccess: () => {
      toast.success("Cập nhật quyền thành công.");
      queryClient.invalidateQueries({ queryKey: ["project", project._id] });
    },
    onError: () => {
      // Global toast handled in axios.ts
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      projectService.removeMember(project._id, memberId),
    onSuccess: () => {
      toast.success("Đã xóa thành viên khỏi dự án.");
      setMemberToRemove(null);
      queryClient.invalidateQueries({ queryKey: ["project", project._id] });
    },
    onError: () => {
      // Global toast handled
      setMemberToRemove(null);
    },
  });

  const regenerateInviteMutation = useMutation({
    mutationFn: () => projectService.regenerateInviteCode(project._id),
    onSuccess: () => {
      toast.success("Đã tạo mới mã mời thành công.");
      refetchInvite();
    },
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Đã sao chép link mời");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddMember = (user: User, role: AssignableRole) => {
    addMemberMutation.mutate({ user, role });
  };

  console.log("project: ", project);

  const activeMembers = project.members.filter(m => m.status !== 'pending');
  const pendingMembers = project.members.filter(m => m.status === 'pending');

  const renderMemberItem = (member: ProjectMember) => {
    const user = member.userId as User;
    const name = user.displayName || user.email.split("@")[0];
    const initials = name.substring(0, 2).toUpperCase();
    const isMe = user._id === currentUserId;
    const isMemberOwner = member.role === "owner";
    const isPending = member.status === "pending";

    return (
      <div
        key={user._id}
        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl} alt={name} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium flex items-center gap-2">
              {name}
              {isMe && (
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                  Bạn
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chỉ Owner mới được đổi role và chỉ cho người đã active */}
          {isOwner && !isMemberOwner && !isPending ? (
            <Select
              value={member.role as AssignableRole}
              disabled={updateRoleMutation.isPending}
              onValueChange={(val: AssignableRole) => {
                updateRoleMutation.mutate({
                  memberId: user._id,
                  role: val,
                });
              }}
            >
              <SelectTrigger className="w-[110px] h-8 text-xs border-transparent bg-transparent hover:bg-muted font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge
              variant={ROLE_BADGE_VARIANT[member.role]}
              className="text-[10px] h-5"
            >
              {ROLE_LABELS[member.role]}
            </Badge>
          )}

          {/* Nút xóa: Owner hoặc Admin mới được xóa. */}
          {isManager && !isMemberOwner && !isMe && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => setMemberToRemove(member)}
              disabled={removeMemberMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thành viên dự án</DialogTitle>
          <DialogDescription>
            Quản lý quyền truy cập và mời thêm thành viên mới.
          </DialogDescription>
        </DialogHeader>

        {/* Phần mời thành viên: chỉ hiện với Owner hoặc Admin */}
        {isManager && (
          <div className="py-4 border-b space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> Link mời tham gia
              </h4>
              <p className="text-xs text-muted-foreground">
                Gửi link này cho đồng nghiệp để họ tham gia trực tiếp vào dự án.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    readOnly
                    value={inviteCode ? inviteLink : "Đang tạo mã..."}
                    className="w-full h-9 px-3 py-1 text-xs bg-muted rounded-md border border-input focus:outline-none pr-20 truncate"
                  />
                  <div className="absolute right-1 top-1 flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 text-[10px]"
                      onClick={handleCopyLink}
                      disabled={!inviteCode}
                    >
                      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copied ? "Đã chép" : "Sao chép"}
                    </Button>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 px-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all group"
                  title="Tạo lại mã mới"
                  onClick={() => {
                    if (confirm("Bạn có chắc muốn tạo lại mã mời mới? Link cũ sẽ không còn hiệu lực.")) {
                      regenerateInviteMutation.mutate();
                    }
                  }}
                  disabled={regenerateInviteMutation.isPending || !inviteCode}
                >
                  <RefreshCw className={cn("h-4 w-4", regenerateInviteMutation.isPending && "animate-spin")} />
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-dashed">
              <h4 className="text-sm font-semibold">Mời qua email</h4>
              <UserSearchSelect
                onAddMember={handleAddMember}
                excludeUserIds={project.members.map(
                  (m) => (m.userId as User)._id,
                )}
              />
            </div>
          </div>
        )}

        <div className="py-4 space-y-6">
          {/* Active Members Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              Thành viên chính thức 
              <Badge variant="secondary" className="font-normal px-1.5 h-5">{activeMembers.length}</Badge>
            </h4>
            <div className="space-y-1">
              {activeMembers.map(renderMemberItem)}
            </div>
          </div>

          {/* Pending Members Section */}
          {pendingMembers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-700">
                Lời mời đã gửi
                <Badge variant="secondary" className="font-normal px-1.5 h-5 bg-amber-100 text-amber-700 border-amber-200">{pendingMembers.length}</Badge>
              </h4>
              <div className="space-y-1 opacity-80 italic">
                {pendingMembers.map(renderMemberItem)}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Confirmation Dialog for Removal */}
      <Dialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Xác nhận xóa
            </DialogTitle>
            <DialogDescription className="py-4">
              Bạn có chắc chắn muốn xóa thành viên
              <span className="font-semibold text-foreground mx-1">
                {(memberToRemove?.userId as User)?.displayName ||
                  (memberToRemove?.userId as User)?.email}
              </span>
              khỏi dự án này?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => setMemberToRemove(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                memberToRemove &&
                removeMemberMutation.mutate((memberToRemove.userId as User)._id)
              }
              disabled={removeMemberMutation.isPending}
            >
              Xóa thành viên
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
