import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKanbanStore } from "@/stores/kanban.store";

interface ColumnListProps {
  columnId: string;
}

export const ColumnList = ({ columnId }: ColumnListProps) => {
  const { tasks } = useKanbanStore();
  const columnTasks = tasks[columnId] || [];

  return (
    <div className="flex flex-col h-full">
      <div 
        data-column-id={columnId} 
        className="flex-1 flex flex-col gap-2 overflow-y-auto mb-3"
      >
        {columnTasks.length === 0 ? (
          <div className="flex-1 min-h-[120px] rounded-lg p-4 flex flex-col items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-muted-foreground/20 bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-green-100/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Plus className="h-4 w-4 text-green-500" />
            </div>
            <span className="font-medium text-muted-foreground/70">Chưa có task nào</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* TODO: Tương lai render task items ở đây */}
          </div>
        )}
      </div>

      <Button 
        variant="outline" 
        className="w-full bg-background border-dashed text-muted-foreground hover:text-foreground justify-start px-4 h-10"
      >
        <Plus className="h-4 w-4 mr-2" />
        <span className="font-semibold">Thêm task</span>
      </Button>
    </div>
  );
};
