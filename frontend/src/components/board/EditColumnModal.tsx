import { useMutation, useQueryClient } from '@tanstack/react-query';
import { columnService } from '@/services/column.service';
import { updateColumnSchema, type UpdateColumnPayload, type Column } from '@/types/column';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useKanbanStore } from '@/stores/kanban.store';
import { useEffect } from 'react';

const PRESET_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

interface EditColumnModalProps {
  column: Column;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditColumnModal = ({ column, open, onOpenChange }: EditColumnModalProps) => {
  const queryClient = useQueryClient();
  const { updateColumn } = useKanbanStore();

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<UpdateColumnPayload>({
    resolver: zodResolver(updateColumnSchema),
    defaultValues: {
      title: column.title,
      color: column.color || PRESET_COLORS[0],
    }
  });

  // Sync form values when column changes
  useEffect(() => {
    if (open) {
      reset({
        title: column.title,
        color: column.color || PRESET_COLORS[0],
      });
    }
  }, [column, open, reset]);

  const selectedColor = watch('color');

  const updateMutation = useMutation({
    mutationFn: (data: UpdateColumnPayload) => columnService.updateColumn(column._id, data),
    onSuccess: (updatedColumn) => {
      toast.success('Cập nhật cột thành công!');
      // Update local store
      updateColumn(column._id, updatedColumn);
      // Invalidate query to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['columns'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật cột');
    }
  });

  const onSubmit = (data: UpdateColumnPayload) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa cột</DialogTitle>
          <DialogDescription>
            Thay đổi tên hoặc màu sắc của cột này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">Tên cột <span className="text-destructive">*</span></Label>
            <Input 
              id="title" 
              placeholder="Ví dụ: Đang tiến hành, Đã hoàn thành..." 
              {...register('title')}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Màu sắc đánh dấu</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c ? 'border-primary md:scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setValue('color', c)}
                />
              ))}
              
              <div className="relative w-8 h-8 rounded-full border-2 border-transparent hover:scale-105 transition-all outline-none" title="Màu tự chọn">
                <input 
                  type="color" 
                  {...register('color')}
                  className="absolute inset-[-10px] w-12 h-12 cursor-pointer opacity-0 z-10"
                />
                <div className="w-full h-full rounded-full border border-border" style={{ backgroundColor: selectedColor || '#fff' }} />
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
