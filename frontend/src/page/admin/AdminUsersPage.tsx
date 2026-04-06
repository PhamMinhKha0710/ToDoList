import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { adminService } from '@/services/admin/admin.service';
import type { User } from '@/types/user';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreVertical, 
  UserCog, 
  KeyRound, 
  UserMinus, 
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadUsers = useCallback(async (page = 1, search = searchQuery) => {
    setIsLoading(true);
    try {
      const res = await adminService.getAdminUsers({ 
        page, 
        limit: pagination.limit, 
        search 
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lấy danh sách người dùng thất bại');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1);
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadUsers(newPage);
    }
  };

  const toggleStatus = async (user: User) => {
    const status = !user.isActive;
    try {
      await adminService.setUserActiveStatus(user._id, status);
      toast.success(`Người dùng ${user.email} đã được ${status ? 'mở khóa' : 'khóa'}`);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isActive: status } : u)));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật trạng thái người dùng thất bại');
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      toast.success(`Đã cập nhật quyền thành: ${newRole}`);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole as any } : u)));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật quyền thất bại');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn gửi yêu cầu đặt lại mật khẩu cho người dùng này?')) return;
    try {
      await adminService.resetUserPassword(userId);
      toast.success('Yêu cầu đặt lại mật khẩu đã được gửi đến email người dùng');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gửi yêu cầu thất bại');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Quản lý người dùng</h1>
          <p className="text-muted-foreground mt-1">Xem, tìm kiếm và quản trị quyền hạn thành viên trong hệ thống.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm theo email hoặc tên..." 
            className="pl-10 h-11 bg-card border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
              <tr>
                <th className="px-4 py-4">Tài khoản</th>
                <th className="px-4 py-4">Họ tên</th>
                <th className="px-4 py-4 text-center">Vai trò</th>
                <th className="px-4 py-4 text-center">Trạng thái</th>
                <th className="px-4 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-muted-foreground italic font-medium">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground italic">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className={`hover:bg-muted/30 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-4 font-medium text-foreground">{user.email}</td>
                    <td className="px-4 py-4 text-foreground">{user.displayName || 'Chưa cập nhật'}</td>
                    <td className="px-4 py-4 text-center">
                      <Badge 
                        variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                        className="capitalize font-mono text-[10px]"
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge 
                        variant={user.isActive ? 'default' : 'outline'}
                        className={`rounded-full px-3 ${user.isActive ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                          <DropdownMenuLabel className="text-foreground">Quản trị người dùng</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border" />
                          
                          <DropdownMenuItem className="text-foreground focus:bg-muted" onClick={() => changeRole(user._id, user.role === 'admin' ? 'user' : 'admin')}>
                            <UserCog className="mr-2 h-4 w-4" />
                            <span>Thay đổi vai trò ({user.role === 'admin' ? 'User' : 'Admin'})</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem className="text-foreground focus:bg-muted" onClick={() => handleResetPassword(user._id)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            <span>Gửi email Reset mật khẩu</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-border" />
                          
                          <DropdownMenuItem 
                            className={user.isActive ? "text-destructive focus:text-destructive focus:bg-destructive/10" : "text-green-600 focus:text-green-600 focus:bg-green-100"}
                            onClick={() => toggleStatus(user)}
                          >
                            {user.isActive ? (
                              <>
                                <UserMinus className="mr-2 h-4 w-4" />
                                <span>Khóa tài khoản</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                <span>Mở khóa tài khoản</span>
                              </>
                            )}
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

        {/* Pagination */}
        <div className="px-4 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground font-medium">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} đến {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} người dùng
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="h-8 w-8 hover:bg-muted border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-foreground mx-2">Trang {pagination.page} / {pagination.totalPages}</span>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="h-8 w-8 hover:bg-muted border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
