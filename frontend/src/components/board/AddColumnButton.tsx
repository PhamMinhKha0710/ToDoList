import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddColumnButtonProps {
  onClick: () => void;
}

export const AddColumnButton = ({ onClick }: AddColumnButtonProps) => {
  return (
    <div className="w-[300px] shrink-0">
      <Button 
        variant="outline" 
        className="w-full h-12 border-dashed bg-background/50 hover:bg-background/80 flex items-center justify-center gap-2"
        onClick={onClick}
      >
        <Plus className="h-4 w-4" />
        <span className="font-semibold">Thêm cột mới</span>
      </Button>
    </div>
  );
};
