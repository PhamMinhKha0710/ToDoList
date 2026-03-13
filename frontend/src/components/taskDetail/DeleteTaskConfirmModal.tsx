import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteTaskConfirmModalProps {
  taskTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export const DeleteTaskConfirmModal = ({ 
  taskTitle, 
  open, 
  onOpenChange, 
  onConfirm,
  isPending 
}: DeleteTaskConfirmModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl overflow-hidden p-0 border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] outline-none">
        
        <div className="bg-red-50/50 p-8 flex flex-col items-center justify-center border-b border-red-100">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-5 rotate-3 border border-red-100">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center -rotate-3 transition-transform">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-xl font-black text-slate-800 tracking-tight text-center">
            Xóa công việc này?
          </DialogTitle>
        </div>

        <div className="p-8 pt-6 bg-white">
          <DialogDescription className="text-center text-slate-600 leading-relaxed text-[15px]">
            Bạn có chắc chắn muốn xóa công việc <br/>
            <strong className="text-slate-800 font-bold">"{taskTitle}"</strong>?
            <br /><br />
            Hành động này sẽ xóa vĩnh viễn công việc và mọi dữ liệu liên quan. <span className="text-red-600 font-semibold">Không thể hoàn tác.</span>
          </DialogDescription>

          <DialogFooter className="flex-col sm:flex-row gap-3 mt-8 sm:space-x-0">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl text-slate-600 font-bold border-slate-200 hover:bg-slate-50 transition-colors"
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm}
              className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang xóa...
                </>
              ) : 'Xác nhận Xóa'}
            </Button>
          </DialogFooter>
        </div>

      </DialogContent>
    </Dialog>
  );
};
