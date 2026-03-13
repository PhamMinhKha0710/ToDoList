import type { Column } from '@/types/column';
import { MoreHorizontal, Edit2, Trash } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ColumnHeaderProps {
  column: Column;
}

export const ColumnHeader = ({ column }: ColumnHeaderProps) => {
  return (
    <div className="flex items-center justify-between font-semibold px-1 group">
      <div className="flex items-center gap-2">
        {column.color && (
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: column.color }} />
        )}
        <span className="text-sm font-bold text-foreground/90">{column.title}</span>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
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
