import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import type { User } from '@/types/user';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UserSearchSelect } from './UserSearchSelect';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Loader2 } from 'lucide-react';

const PRESET_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AssignableRole = 'admin' | 'member' | 'viewer';
type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

const ROLE_LABELS: Record<string, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị viên",
  member: "Thành viên",
  viewer: "Người xem",
};

interface SelectedMember {
  user: User;
  role: ProjectRole;
}

export const CreateProjectModal = ({ open, onOpenChange }: CreateProjectModalProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);

  const createMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      toast.success('Dự án đã được tạo thành công!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      // Global toast handled
    }
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setImageUrl('');
    setSelectedFile(null);
    setColor(PRESET_COLORS[0]);
    setSelectedMembers([]);
  };

  const handleAddMember = (user: User, role: AssignableRole) => {
    setSelectedMembers((prev) => [...prev, { user, role }]);
    toast.success(`Đã thêm ${user.displayName || user.email} vào danh sách chờ.`);
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.user._id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên dự án');
      return;
    }

    const payload = {
      name,
      description,
      imageUrl: selectedFile ? undefined : imageUrl,
      file: selectedFile || undefined,
      color,
      members: selectedMembers.map(m => ({
        userId: m.user._id,
        role: m.role
      }))
    };

    createMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Tạo dự án mới</DialogTitle>
          <DialogDescription>
            Thiết lập không gian làm việc mới và mời các thành viên tham gia.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">Tên dự án *</Label>
              <Input 
                id="name" 
                placeholder="Ví dụ: Phát triển tính năng Z" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">Mô tả chi tiết</Label>
              <Textarea 
                id="description" 
                placeholder="Mô tả mục tiêu và phạm vi của dự án..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Màu sắc chủ đạo</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c: string) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-primary scale-110' : 'border-transparent hover:scale-105 shadow-sm'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border shadow-sm flex items-center justify-center bg-muted/50 hover:bg-muted cursor-pointer transition-colors" title="Màu tùy chỉnh">
                    <Input 
                      type="color" 
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-[-10px] w-12 h-12 cursor-pointer opacity-0"
                    />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Ảnh đại diện nội bộ</Label>
                <div className="flex items-center gap-3">
                  {selectedFile || imageUrl ? (
                    <div 
                      className="h-10 w-10 shrink-0 rounded-lg bg-cover bg-center border relative group cursor-pointer"
                      style={{ backgroundImage: `url(${selectedFile ? URL.createObjectURL(selectedFile) : imageUrl})` }}
                      onClick={() => document.getElementById('project-avatar-upload')?.click()}
                    >
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white text-[10px] font-medium">Đổi</span>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: color }}
                      onClick={() => document.getElementById('project-avatar-upload')?.click()}
                    >
                      {name ? name.substring(0, 2).toUpperCase() : 'P'}
                    </div>
                  )}
                  <div className="flex-1">
                    <Input 
                      id="project-avatar-upload"
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => document.getElementById('project-avatar-upload')?.click()}
                      className="w-full text-xs"
                    >
                      Tải ảnh lên...
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div>
              <Label className="text-sm font-semibold">Thêm thành viên</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Tìm kiếm người dùng bằng email hoặc tên để mời họ tham gia.
              </p>
              
              <UserSearchSelect 
                onAddMember={handleAddMember}
                excludeUserIds={selectedMembers.map(m => m.user._id)}
              />
            </div>

            {/* Selected Members List */}
            {selectedMembers.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4 border mt-4">
                <Label className="text-xs font-semibold uppercase text-muted-foreground mb-3 block">
                  Đã chọn ({selectedMembers.length})
                </Label>
                <div className="space-y-2">
                  {selectedMembers.map((member) => {
                    const name = member.user.displayName || member.user.email.split('@')[0];
                    const initials = name.substring(0, 2).toUpperCase();

                    return (
                      <div key={member.user._id} className="flex flex-wrap items-center justify-between gap-2 bg-background p-2 rounded-md border shadow-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={member.user.avatarUrl} alt={name} />
                            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                            ({member.user.email})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                            {ROLE_LABELS[member.role] || member.role}
                          </span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemoveMember(member.user._id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="min-w-[120px]">
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : 'Khởi tạo dự án'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
