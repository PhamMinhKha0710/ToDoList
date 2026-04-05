import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Loader2 } from 'lucide-react';
import { userService } from '@/services/user.service';
import type { User } from '@/types/user';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AssignableRole = 'admin' | 'member' | 'viewer';

interface UserSearchSelectProps {
  onAddMember: (user: User, role: AssignableRole) => void;
  excludeUserIds?: string[];
}

export const UserSearchSelect = ({ onAddMember, excludeUserIds = [] }: UserSearchSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roles, setRoles] = useState<Record<string, AssignableRole>>({});

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['users:search', debouncedSearch],
    queryFn: () => userService.searchUsers(debouncedSearch),
    enabled: debouncedSearch.length > 0,
  });

  const searchResults = response?.data?.users || [];
  const filteredResults = searchResults.filter(
    (u) => !excludeUserIds.includes(u._id)
  );

  const handleRoleChange = (userId: string, role: string) => {
    setRoles((prev) => ({ ...prev, [userId]: role as AssignableRole }));
  };

  const handleInvite = (user: User) => {
    const role = roles[user._id] || 'member';
    onAddMember(user, role);
    setSearchTerm(''); // Optional: clear search after invite
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm user theo email hoặc tên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {debouncedSearch && filteredResults.length > 0 && (
        <div className="border rounded-md divide-y divide-border overflow-hidden">
          {filteredResults.map((user) => {
            const name = user.displayName || user.email.split('@')[0];
            const initials = name.substring(0, 2).toUpperCase();

            return (
              <div key={user._id} className="flex items-center justify-between p-3 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                
                {/* Left Side: Avatar & Info */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={user.avatarUrl} alt={name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-medium truncate">{name}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                </div>

                {/* Right Side: Role Select & Invite Button */}
                <div className="flex items-center gap-2">
                  <Select 
                    value={roles[user._id] || 'member'} 
                    onValueChange={(val: string) => handleRoleChange(user._id, val)}
                  >
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue placeholder="Vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button size="sm" onClick={() => handleInvite(user)} className="h-8">
                    <Plus className="h-4 w-4 mr-1" /> Mời
                  </Button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {debouncedSearch && !isLoading && filteredResults.length === 0 && searchResults.length !== 0 && (
        <div className="text-sm text-center p-4 border rounded-md text-muted-foreground">
          Tất cả người dùng phù hợp đã được mời.
        </div>
      )}

      {debouncedSearch && !isLoading && searchResults.length === 0 && (
        <div className="text-sm text-center p-4 border rounded-md text-muted-foreground bg-muted/50">
          Không tìm thấy người dùng cho "{debouncedSearch}".
        </div>
      )}
    </div>
  );
};
