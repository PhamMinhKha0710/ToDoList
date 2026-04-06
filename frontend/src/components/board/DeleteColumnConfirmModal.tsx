import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteColumnConfirmModalProps {
  columnTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export const DeleteColumnConfirmModal = ({ 
  columnTitle, 
  open, 
  onOpenChange, 
  onConfirm,
  isPending 
}: DeleteColumnConfirmModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl">Xác nhận xóa cột?</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Bạn có chắc chắn muốn xóa cột <strong>"{columnTitle}"</strong>? 
            <br />
            Hành động này sẽ xóa vĩnh viễn cột và <strong>tất cả các công việc</strong> bên trong. Không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="flex-1"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : 'Xác nhận xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
