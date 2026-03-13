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

interface ColumnHeaderProps {
  column: Column;
}

export const ColumnHeader = ({ column }: ColumnHeaderProps) => {
  const { tasks } = useKanbanStore();
  const taskCount = tasks[column._id]?.length || 0;

  return (
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
          <DropdownMenuItem className="cursor-pointer">
            <Edit2 className="h-4 w-4 mr-2" />
            <span>Sửa tên cột</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
            <Trash className="h-4 w-4 mr-2" />
            <span>Xóa cột</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
