import { useState, useEffect } from "react";
import { Plus, Loader2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKanbanStore } from "@/stores/kanban.store";
import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { AddTaskModal } from "./AddTaskModal";

interface ColumnListProps {
  columnId: string;
}

export const ColumnList = ({ columnId }: ColumnListProps) => {
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const { tasks: storeTasks, setTasks } = useKanbanStore();
  const columnTasks = storeTasks[columnId] || [];

  const { data: queryTasks, isLoading } = useQuery({
    queryKey: ["tasks", columnId],
    queryFn: () => taskService.getTasksByColumnId(columnId),
    enabled: !!columnId,
  });

  // Sync with store
  useEffect(() => {
    if (queryTasks) {
      setTasks(columnId, queryTasks);
    }
  }, [queryTasks, columnId, setTasks]);

  return (
    <div className="flex flex-col h-full pt-3">
      <div 
        data-column-id={columnId} 
        className="flex-1 flex flex-col gap-3 overflow-y-auto mb-3"
      >
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : columnTasks.length === 0 ? (
          <div 
            onClick={() => setIsAddTaskModalOpen(true)}
            className="flex-1 min-h-[120px] rounded-lg p-4 flex flex-col items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-muted-foreground/20 bg-background/50 hover:bg-background/80 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-green-100/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Plus className="h-4 w-4 text-green-500" />
            </div>
            <span className="font-medium text-muted-foreground/70">Chưa có task nào</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {columnTasks.map((task) => {
              // Map priority to border color
              const priorityColors: Record<string, string> = {
                urgent: '#ef4444',
                high: '#f97316',
                normal: '#3b82f6',
                low: '#6b7280',
              };
              const borderColor = priorityColors[task.priority] || '#3b82f6';
              
              // Helper to display priority text
              const priorityLabels: Record<string, string> = {
                urgent: 'KHẨN CẤP',
                high: 'CAO',
                normal: 'BÌNH THƯỜNG',
                low: 'THẤP',
              };

              return (
                <div 
                  key={task._id} 
                  className="rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col"
                  style={{ 
                    backgroundColor: task.color || '#ffffff',
                    borderLeft: `6px solid ${borderColor}`
                  }}
                >
                  <div className="p-3 pb-2 flex flex-col gap-3">
                    {/* Header: Priority & Status Icon */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/20">
                        <Flag className="h-3 w-3 fill-current" />
                        <span className="text-[10px] font-extrabold uppercase tracking-tight">{priorityLabels[task.priority]}</span>
                      </div>
                      {task.status === 'done' ? (
                        <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                        </div>
                      )}
                    </div>

                    {/* Title & Project name */}
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-[15px] font-bold text-foreground/90 leading-snug line-clamp-2">
                        {task.title}
                      </h4>
                      <p className="text-[11px] font-medium text-foreground/60">
                        frontend
                      </p>
                    </div>

                    {/* Tags (Optional) */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.tags.map(tag => (
                          <div key={tag.name} className="px-1.5 py-0.5 rounded-md bg-white/30 text-[9px] font-bold text-foreground/70 border border-white/20">
                            {tag.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer: User & Date */}
                  <div className="px-3 py-2 border-t border-black/5 bg-black/5 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <span className="text-[10px] font-bold">U</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-foreground/60">
                         {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'No date'}
                      </div>
                    </div>
                    {/* Comment icon dummy */}
                    <div className="flex items-center gap-1 opacity-40">
                      <span className="text-[10px] font-bold">1</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Button 
        variant="outline" 
        className="w-full bg-background border-dashed text-muted-foreground hover:text-foreground justify-start px-4 h-10 shrink-0"
        onClick={() => setIsAddTaskModalOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        <span className="font-semibold">Thêm task</span>
      </Button>

      <AddTaskModal 
        columnId={columnId}
        open={isAddTaskModalOpen}
        onOpenChange={setIsAddTaskModalOpen}
      />
    </div>
  );
};
