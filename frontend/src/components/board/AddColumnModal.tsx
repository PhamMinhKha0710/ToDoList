import { useMutation, useQueryClient } from '@tanstack/react-query';
import { columnService } from '@/services/column.service';
import { createColumnSchema, type CreateColumnPayload } from '@/schemas/column.schema';
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

const PRESET_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

interface AddColumnModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddColumnModal = ({ projectId, open, onOpenChange }: AddColumnModalProps) => {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<CreateColumnPayload>({
    resolver: zodResolver(createColumnSchema),
    defaultValues: {
      projectId,
      title: '',
      color: PRESET_COLORS[0],
    }
  });

  const selectedColor = watch('color');

  const createMutation = useMutation({
    mutationFn: columnService.createColumn,
    onSuccess: () => {
      toast.success('Đã thêm cột mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['columns', projectId] });
      reset();
      onOpenChange(false);
    },
    onError: () => {
      // Logic xử lý lỗi khác nếu cần (global axios đã hiển thị toast)
    }
  });

  const onSubmit = (data: CreateColumnPayload) => {
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm cột mới</DialogTitle>
          <DialogDescription>
            Tạo cột mới để phân loại và quản lý công việc trong dự án.
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
            <Label className="text-sm font-semibold">Màu sắc đánh dấu (Tùy chọn)</Label>
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
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : 'Thêm cột'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
