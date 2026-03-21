import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { userService } from '@/services/user.service';
import type { User } from '@/types/user';

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAdminUsers();
      setUsers(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lấy danh sách user thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleStatus = async (user: User) => {
    const status = !user.isActive;
    try {
      await userService.setUserActiveStatus(user._id, status);
      toast.success(`User ${user.email} đã ${status ? 'mở khóa' : 'khóa'} thành công`);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isActive: status } : u)));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật trạng thái user thất bại');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
      <p className="text-muted-foreground mb-4">Danh sách user (admin only). Có thể khoá hoặc kích hoạt.</p>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b p-2">Email</th>
                <th className="border-b p-2">Tên</th>
                <th className="border-b p-2">Role</th>
                <th className="border-b p-2">Trạng thái</th>
                <th className="border-b p-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className={user.isActive ? '' : 'opacity-70'}>
                  <td className="border-b p-2">{user.email}</td>
                  <td className="border-b p-2">{user.displayName || '---'}</td>
                  <td className="border-b p-2">{user.role}</td>
                  <td className="border-b p-2">{user.isActive ? 'Active' : 'Blocked'}</td>
                  <td className="border-b p-2">
                    <button
                      className={`rounded-md px-3 py-1 text-xs font-medium ${user.isActive ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}
                      onClick={() => toggleStatus(user)}
                    >
                      {user.isActive ? 'Khoá' : 'Kích hoạt'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && users.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">Chưa có user</div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
