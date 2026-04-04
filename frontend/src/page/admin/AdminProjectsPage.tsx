import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { adminService } from '@/services/admin/admin.service';
import { uploadService } from '@/services/upload.service';
import type { Project } from '@/types/project';
import type { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, MoreVertical, Layout, Users, Activity, Upload, X, Loader2, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AdminProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormData = {
    name: '',
    description: '',
    color: '#3b82f6',
    ownerId: '',
    imageUrl: '',
  };

  // Form states
  const [formData, setFormData] = useState(initialFormData);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, usersRes] = await Promise.all([
        adminService.getAdminProjects(),
        adminService.getAdminUsers(),
      ]);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lấy dữ liệu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.ownerId) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await adminService.createAdminProject(formData);
      toast.success('Tạo dự án thành công');
      setIsCreateModalOpen(false);
      setFormData(initialFormData);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Tạo dự án thất bại');
    }
  };

  const handleEdit = async () => {
    if (!selectedProject) return;

    try {
      await adminService.updateAdminProject(selectedProject._id, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        imageUrl: formData.imageUrl,
      });
      toast.success('Cập nhật dự án thành công');
      setIsEditModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật dự án thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa dự án này?')) return;

    try {
      await adminService.deleteAdminProject(id);
      toast.success('Xóa dự án thành công');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xóa dự án thất bại');
    }
  };

  const toggleStatus = async (project: Project) => {
    const newStatus = !project.isActive;
    try {
      await adminService.updateAdminProject(project._id, { isActive: newStatus });
      toast.success(`Dự án đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`);
      setProjects((prev) =>
        prev.map((p) => (p._id === project._id ? { ...p, isActive: newStatus } : p))
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const openCreateModal = () => {
    setSelectedProject(null);
    setFormData(initialFormData);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color || '#3b82f6',
      imageUrl: project.imageUrl || '',
      ownerId: '', // Owner can't be changed in edit for now based on requirement
    });
    setIsEditModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadService.uploadFile(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success('Tải ảnh thành công');
    } catch (error: any) {
      toast.error('Tải ảnh thất bại');
    } finally {
      setIsUploading(false);
    }
  };

  const getOwner = (project: Project) => {
    const ownerMember = project.members.find((m) => m.role === 'owner');
    if (!ownerMember) return 'Không rõ';
    const user = ownerMember.userId as User;
    return user.displayName || user.email;
  };

  const getOwnerAvatar = (project: Project) => {
    const ownerMember = project.members.find((m) => m.role === 'owner');
    if (!ownerMember) return null;
    return (ownerMember.userId as User).avatarUrl;
  };

  const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Dự án</h1>
          <p className="text-muted-foreground">Xem và quản lý tất cả các dự án trong hệ thống.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-[#0f172a] hover:bg-[#1e293b]">
          <Plus className="mr-2 h-4 w-4" /> Thêm Dự án
        </Button>
      </div>

      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Dự án</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Chủ sở hữu</th>
                <th className="px-4 py-3 font-medium text-center text-muted-foreground">Thành viên</th>
                <th className="px-4 py-3 font-medium text-center text-muted-foreground">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                    Chưa có dự án nào.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project._id} className={`hover:bg-muted/30 transition-colors ${!project.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {project.imageUrl ? (
                          <img src={project.imageUrl} alt={project.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: project.color || '#3b82f6' }}
                          >
                            <Layout className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{project.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {project.description || 'Không có mô tả'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={getOwnerAvatar(project) || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {getOwner(project).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{getOwner(project)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge variant="secondary" className="font-mono bg-muted text-muted-foreground">
                        <Users className="h-3 w-3 mr-1" />
                        {project.members.length}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge 
                        variant={project.isActive ? "default" : "destructive"}
                        className={`cursor-pointer hover:opacity-80 rounded-full px-4 ${project.isActive ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}`}
                        onClick={() => toggleStatus(project)}
                      >
                        {project.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(project)}>
                            <Pencil className="mr-2 h-4 w-4" /> Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toggleStatus(project)}
                            className={project.isActive ? 'text-orange-500' : 'text-green-500'}
                          >
                            <Activity className="mr-2 h-4 w-4" /> {project.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(project._id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-[550px] p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">Tạo dự án mới</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Thiết lập không gian làm việc mới và mời các thành viên tham gia.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-semibold">Tên dự án *</Label>
              <Input 
                id="name" 
                placeholder="Ví dụ: Phát triển tính năng Z" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 text-sm border-gray-200"
              />
            </div>
            
            <div className="space-y-1.5 relative">
              <Label htmlFor="owner" className="text-sm font-semibold">Người sở hữu</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full h-10 justify-start px-3 text-sm font-normal border-gray-200 bg-white hover:bg-gray-50"
                  >
                    {formData.ownerId ? (
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={users.find(u => u._id === formData.ownerId)?.avatarUrl || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {users.find(u => u._id === formData.ownerId)?.displayName?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">
                          {users.find(u => u._id === formData.ownerId)?.displayName || users.find(u => u._id === formData.ownerId)?.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Chọn người sở hữu...</span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px] p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Tìm người sở hữu..." 
                        className="pl-9 h-9 text-sm border-none focus-visible:ring-0 shadow-none"
                        autoFocus
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                    {users
                      .filter(user => 
                        user.displayName?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                        user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                      )
                      .map((user) => (
                        <button
                          key={user._id}
                          className="user-item w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-sm transition-colors cursor-pointer text-left"
                          onClick={() => {
                            setFormData({ ...formData, ownerId: user._id });
                            setUserSearchQuery('');
                          }}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {user.displayName?.substring(0, 2).toUpperCase() || user.email.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.displayName || 'Unnamed'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                          {formData.ownerId === user._id && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </button>
                      ))}
                    {users.filter(user => 
                      user.displayName?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                      user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <p className="p-4 text-center text-sm text-muted-foreground italic">Không tìm thấy người dùng nào</p>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-semibold">Mô tả chi tiết</Label>
              <Textarea 
                id="description" 
                placeholder="Mô tả mục tiêu và phạm vi của dự án..." 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px] text-sm border-gray-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-start py-1">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Màu sắc chủ đạo</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${formData.color === c ? 'border-blue-100 shadow-sm ring-2 ring-blue-500' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setFormData({ ...formData, color: c })}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Ảnh đại diện nội bộ</Label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0 overflow-hidden bg-blue-500"
                    style={{ backgroundColor: !formData.imageUrl ? formData.color : 'transparent' }}
                  >
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold uppercase">{formData.name ? formData.name[0] : 'P'}</span>
                    )}
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/*"
                    />
                    <Button 
                      variant="outline" 
                      className="h-10 px-4 border-gray-200 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Tải ảnh lên...'}
                    </Button>
                    {formData.imageUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 pt-5 border-t flex flex-row justify-between items-center bg-white">
            <Button variant="ghost" className="text-sm text-gray-500 hover:bg-transparent" onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
            <Button className="h-10 px-8 bg-[#0f172a] hover:bg-[#1e293b] text-sm font-medium rounded-md" onClick={handleCreate}>Khởi tạo dự án</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal - similar refinement */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-[550px] p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">Chỉnh sửa Dự án</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-sm font-semibold">Tên dự án</Label>
              <Input 
                id="edit-name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 text-sm border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-sm font-semibold">Mô tả chi tiết</Label>
              <Textarea 
                id="edit-description" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px] text-sm border-gray-200 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 items-start py-1">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Màu sắc chủ đạo</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${formData.color === c ? 'border-blue-100 shadow-sm ring-2 ring-blue-500' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setFormData({ ...formData, color: c })}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Ảnh đại diện nội bộ</Label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0 overflow-hidden bg-blue-500"
                    style={{ backgroundColor: !formData.imageUrl ? formData.color : 'transparent' }}
                  >
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold uppercase">{formData.name ? formData.name[0] : 'P'}</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/*"
                    />
                    <Button 
                      variant="outline" 
                      className="h-10 px-4 border-gray-200 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Thay đổi ảnh...'}
                    </Button>
                    {formData.imageUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 pt-5 border-t flex flex-row justify-between items-center bg-white">
            <Button variant="ghost" className="text-sm text-gray-500 hover:bg-transparent" onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
            <Button className="h-10 px-8 bg-[#0f172a] hover:bg-[#1e293b] text-sm font-medium rounded-md" onClick={handleEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProjectsPage;
