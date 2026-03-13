import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/task.service';
import { createTaskSchema, type CreateTaskPayload, TaskPriority } from '@/types/task';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Loader2, Flag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useKanbanStore } from '@/stores/kanban.store';

const PRESET_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

interface AddTaskModalProps {
  columnId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTaskModal = ({ columnId, open, onOpenChange }: AddTaskModalProps) => {
  const queryClient = useQueryClient();
  const { addTask } = useKanbanStore();

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<CreateTaskPayload>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      columnId,
      title: '',
      description: '',
      priority: TaskPriority.NORMAL,
      color: PRESET_COLORS[0],
    }
  });

  const selectedColor = watch('color');
  const selectedPriority = watch('priority');

  const createMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: (newTask) => {
      toast.success('Đã thêm công việc mới!');
      // Update store locally for immediate UI update
      addTask(columnId, newTask);
      // Invalidate queries to keep server state in sync
      queryClient.invalidateQueries({ queryKey: ['tasks', columnId] });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo công việc');
    }
  });

  const onSubmit = (data: CreateTaskPayload) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) reset();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm công việc mới</DialogTitle>
          <DialogDescription>
            Nhập chi tiết công việc bạn muốn thêm vào cột này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">Tiêu đề <span className="text-destructive">*</span></Label>
            <Input 
              id="title" 
              placeholder="Nhập tiêu đề công việc..." 
              {...register('title')}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">Mô tả</Label>
            <Textarea 
              id="description" 
              placeholder="Thêm mô tả chi tiết (tùy chọn)..." 
              className="resize-none min-h-[100px]"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Độ ưu tiên</Label>
              <Select 
                value={selectedPriority} 
                onValueChange={(val: any) => setValue('priority', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.URGENT}>
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-destructive fill-destructive" />
                      <span>Khẩn cấp</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-orange-500 fill-orange-500" />
                      <span>Cao</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={TaskPriority.NORMAL}>
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-blue-500 fill-blue-500" />
                      <span>Bình thường</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={TaskPriority.LOW}>
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-gray-500 fill-gray-500" />
                      <span>Thấp</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-semibold">Ngày hết hạn</Label>
              <Input 
                id="dueDate" 
                type="date"
                {...register('dueDate')}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Màu sắc đánh dấu</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-md border-2 transition-all ${selectedColor === c ? 'border-primary md:scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setValue('color', c)}
                />
              ))}
              
              <div className="relative w-7 h-7 rounded-md border-2 border-transparent hover:scale-105 transition-all outline-none" title="Màu tự chọn">
                <input 
                  type="color" 
                  {...register('color')}
                  className="absolute inset-[-5px] w-10 h-10 cursor-pointer opacity-0 z-10"
                />
                <div className="w-full h-full rounded-md border border-border" style={{ backgroundColor: selectedColor || '#fff' }} />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : 'Thêm công việc'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
