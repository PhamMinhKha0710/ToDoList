import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import type { Project, ProjectMember } from '@/types/project';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, ShieldAlert } from 'lucide-react';
import { UserSearchSelect } from '../project/UserSearchSelect';
import type { User } from '@/types/user';

interface ProjectMembersDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
  currentUserId: string;
}

export const ProjectMembersDialog = ({ 
  project, 
  open, 
  onOpenChange, 
  isOwner,
  currentUserId
}: ProjectMembersDialogProps) => {
  const queryClient = useQueryClient();
  const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (data: { userId: string, role: 'owner' | 'member', user: User }) => 
      // Dùng user.email tạm để gửi qua backend do addMember API backend lấy email
      projectService.addMember(project._id, data.user.email),
    onSuccess: (_, variables) => {
      // Sau khi thêm member bằng API (backend default role=member), 
      // ta tự cập nhật role nếu chọn role là owner qua updateMemberRole.
      // Dù API gốc của createMember backend chỉ xài email và set default 'member' được
      if (variables.role === 'owner') {
        const addedUserId = variables.user._id;
        updateRoleMutation.mutate({ memberId: addedUserId, role: 'owner' });
      } else {
        toast.success('Đã thêm thành viên thành công.');
        queryClient.invalidateQueries({ queryKey: ['project', project._id] });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thêm thành viên');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data: { memberId: string, role: 'owner' | 'member' }) => 
      projectService.updateMemberRole(project._id, data.memberId, data.role),
    onSuccess: () => {
      toast.success('Cập nhật quyền thành công.');
      queryClient.invalidateQueries({ queryKey: ['project', project._id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể cập nhật quyền');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => 
      projectService.removeMember(project._id, memberId),
    onSuccess: () => {
      toast.success('Đã xóa thành viên khỏi dự án.');
      setMemberToRemove(null);
      queryClient.invalidateQueries({ queryKey: ['project', project._id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể xóa thành viên');
      setMemberToRemove(null);
    }
  });

  const handleAddMember = (user: User, role: 'owner' | 'member') => {
    addMemberMutation.mutate({ userId: user._id, role, user });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thành viên dự án</DialogTitle>
          <DialogDescription>
            Quản lý quyền truy cập và mời thêm thành viên mới.
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <div className="py-4 border-b">
            <h4 className="text-sm font-semibold mb-3">Mời người mới</h4>
            <UserSearchSelect 
              onAddMember={handleAddMember}
              excludeUserIds={project.members.map(m => (m.userId as User)._id)}
            />
          </div>
        )}

        <div className="py-4">
          <h4 className="text-sm font-semibold mb-3">
            Thành viên hiện tại ({project.members.length})
          </h4>
          <div className="space-y-3">
            {project.members.map((member) => {
              const user = member.userId as User;
              const name = user.displayName || user.email.split('@')[0];
              const initials = name.substring(0, 2).toUpperCase();
              const isMe = user._id === currentUserId;

              return (
                <div key={user._id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl} alt={name} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium flex items-center gap-2">
                        {name} {isMe && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">Bạn</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Select Role */}
                    <Select 
                      value={member.role} 
                      disabled={!isOwner || updateRoleMutation.isPending}
                      onValueChange={(val: 'owner' | 'member') => {
                        updateRoleMutation.mutate({ memberId: user._id, role: val });
                      }}
                    >
                      <SelectTrigger className="w-[100px] h-8 text-xs border-transparent bg-transparent hover:bg-muted font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Delete button (only owners can delete, but cannot delete themselves here easily without warning) */}
                    {isOwner && (
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
            })}
          </div>
        </div>
      </DialogContent>

      {/* Confirmation Dialog for Removal */}
      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Xác nhận xóa
            </DialogTitle>
            <DialogDescription className="py-4">
              Bạn có chắc chắn muốn xóa thành viên 
              <span className="font-semibold text-foreground mx-1">
                {(memberToRemove?.userId as User)?.displayName || (memberToRemove?.userId as User)?.email}
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
              onClick={() => memberToRemove && removeMemberMutation.mutate((memberToRemove.userId as User)._id)}
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
