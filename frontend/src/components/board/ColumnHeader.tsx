import { useState } from 'react';
import type { Column } from '@/types/column';
import { MoreHorizontal, Edit2, Trash } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useKanbanStore } from '@/stores/kanban.store';
import { EditColumnModal } from './EditColumnModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { columnService } from '@/services/column.service';
import { toast } from 'sonner';

interface ColumnHeaderProps {
  column: Column;
}

export const ColumnHeader = ({ column }: ColumnHeaderProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { tasks, deleteColumn: deleteColumnFromStore } = useKanbanStore();
  const queryClient = useQueryClient();
  const taskCount = tasks[column._id]?.length || 0;

  const deleteMutation = useMutation({
    mutationFn: () => columnService.deleteColumn(column._id),
    onSuccess: () => {
      toast.success('Đã xóa cột thành công!');
      deleteColumnFromStore(column._id);
      queryClient.invalidateQueries({ queryKey: ['columns'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa cột');
    }
  });

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cột này? Tất cả task bên trong cũng sẽ bị mất.')) {
      deleteMutation.mutate();
    }
  };

  return (
    <>
      <div 
        className="flex items-center justify-between font-semibold px-4 py-3 group"
        style={{ backgroundColor: column.color || '#3b82f6' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-white tracking-wide">{column.title}</span>
          <div className="bg-white/30 text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[20px] text-center">
            {taskCount}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:bg-white/20 hover:text-white transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              <span>Sửa tên cột</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash className="h-4 w-4 mr-2" />
              <span>Xóa cột</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditColumnModal 
        column={column}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </>
  );
};
