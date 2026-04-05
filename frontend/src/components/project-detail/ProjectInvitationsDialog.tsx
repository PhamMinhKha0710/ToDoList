import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import type { Project } from "@/types/project";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Link as LinkIcon, 
  Copy, 
  RefreshCw, 
  Check,
  Calendar, 
  AlertCircle,
  Clock,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ProjectInvitationsDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectInvitationsDialog({
  project,
  open,
  onOpenChange,
}: ProjectInvitationsDialogProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00:00");

  // Queries
  const { data: inviteRes, refetch: refetchInvite, isLoading } = useQuery({
    queryKey: ["projectInviteCode", project._id],
    queryFn: () => projectService.getInviteCode(project._id),
    enabled: open,
  });

  const inviteCode = inviteRes?.data?.inviteCode;
  const expiresAt = inviteRes?.data?.expiresAt ? new Date(inviteRes.data.expiresAt) : null;
  const inviteLink = `${window.location.origin}/join/${inviteCode}`;
  
  const isExpired = expiresAt ? new Date() > expiresAt : false;

  // Countdown logic
  useEffect(() => {
    if (!expiresAt || isExpired) {
      setTimeLeft("00:00:00:00");
      return;
    }

    const calculateTimeLeft = () => {
      const difference = expiresAt.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft("00:00:00:00");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const pad = (num: number) => num.toString().padStart(2, "0");
      setTimeLeft(`${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, isExpired]);

  const regenerateInviteMutation = useMutation({
    mutationFn: () => projectService.regenerateInviteCode(project._id),
    onSuccess: () => {
      toast.success("Đã tạo mới mã mời thành công. Mã cũ đã bị vô hiệu hóa.");
      refetchInvite();
    },
  });

  const deleteInviteMutation = useMutation({
    mutationFn: () => projectService.deleteInviteCode(project._id),
    onSuccess: () => {
      toast.success("Đã xóa mã mời thành công.");
      refetchInvite();
    },
  });

  const handleCopyLink = () => {
    if (!inviteLink || isExpired) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Đã sao chép link mời");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <LinkIcon className="h-5 w-5 text-primary" /> Mã mời dự án
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Quản lý mã mời tham gia dự án. Mã mời sẽ có hiệu lực trong vòng 7 ngày kể từ lúc tạo.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Status Alert & Countdown */}
          <div className={cn(
            "p-5 rounded-[1.5rem] border flex flex-col items-center gap-4 transition-all duration-300 shadow-sm",
            !inviteCode 
              ? "bg-slate-50 border-slate-100 text-slate-400 border-dashed"
              : isExpired 
                ? "bg-red-50 border-red-100 text-red-600" 
                : "bg-indigo-50 border-indigo-100 text-indigo-600"
          )}>
            {!inviteCode ? (
              <div className="py-2 flex flex-col items-center gap-2">
                 <AlertCircle className="h-8 w-8 opacity-20" />
                 <p className="text-sm font-bold uppercase tracking-wider opacity-60">Chưa có mã mời</p>
                 <p className="text-[10px] font-medium opacity-40 text-center max-w-[200px]">Hãy tạo mã mới để bắt đầu mời thành viên tham gia</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 uppercase text-[10px] font-black tracking-[0.2em] opacity-70">
                  {isExpired ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {isExpired ? "Hết hạn" : "Thời gian hiệu lực còn lại"}
                </div>
                
                {/* Digit Timer (DD:HH:MM:SS) */}
                <div className={cn(
                  "flex items-center gap-1 font-mono text-3xl font-bold tracking-widest bg-white/50 px-6 py-3 rounded-2xl border border-white shadow-inner",
                  isExpired && "grayscale opacity-50"
                )}>
                  {timeLeft.split(":").map((part, i, arr) => (
                    <div key={i} className="flex items-center">
                      <span className="tabular-nums">{part}</span>
                      {i < arr.length - 1 && <span className="mx-1 opacity-30 animate-pulse text-2xl">:</span>}
                    </div>
                  ))}
                </div>

                <p className="text-[10px] font-bold opacity-60">
                  {expiresAt ? (
                    isExpired 
                      ? `Kết thúc vào: ${format(expiresAt, "HH:mm, dd/MM/yyyy", { locale: vi })}`
                      : `Hết hạn vào: ${format(expiresAt, "HH:mm, dd/MM/yyyy", { locale: vi })}`
                  ) : "Không xác định"}
                </p>
              </>
            )}
          </div>

          {/* Link Section */}
          {inviteCode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Link mời hiện tại</label>
                  {expiresAt && !isExpired && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold">
                      <Calendar className="h-3 w-3" /> {format(expiresAt, "dd/MM/yyyy")}
                    </span>
                  )}
              </div>
              
              <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <input
                      type="text"
                      readOnly
                      value={isLoading ? "Đang tải..." : inviteLink}
                      disabled={isExpired}
                      className={cn(
                        "w-full h-12 px-4 py-2 text-sm bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none pr-24 truncate font-semibold transition-all focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300",
                        isExpired && "opacity-50 grayscale bg-slate-100"
                      )}
                    />
                    <div className="absolute right-1.5 top-1.5">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-9 px-3 rounded-xl text-xs font-bold shadow-sm hover:bg-white transition-colors"
                        onClick={handleCopyLink}
                        disabled={isLoading || !inviteCode || isExpired}
                      >
                        {copied ? <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {copied ? "Đã chép" : "Sao chép"}
                      </Button>
                    </div>
                  </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 border-dashed space-y-3">
             <Button 
                variant={!inviteCode ? "default" : "outline"}
                className={cn(
                  "w-full h-12 rounded-2xl gap-3 font-black text-xs uppercase tracking-wider transition-all transform active:scale-95 shadow-sm border-slate-200 group",
                  !inviteCode && "bg-indigo-600 hover:bg-indigo-700 text-white"
                )}
                onClick={() => {
                  if (!inviteCode || confirm("Lưu ý: Tạo mã mới sẽ làm tất cả mã mời cũ (nếu còn hạn) trở nên vô hiệu. Tiếp tục?")) {
                    regenerateInviteMutation.mutate();
                  }
                }}
                disabled={regenerateInviteMutation.isPending || deleteInviteMutation.isPending}
             >
                <RefreshCw className={cn("h-4 w-4 transition-transform group-hover:rotate-180 duration-500", regenerateInviteMutation.isPending && "animate-spin")} />
                {!inviteCode ? "Tạo mã mời mới ngay" : (isExpired ? "Tạo mã mời mới" : "Làm mới hiệu lực (7 ngày)")}
             </Button>

             {inviteCode && (
               <Button 
                  variant="ghost" 
                  className="w-full h-10 rounded-xl gap-2 font-bold text-xs text-red-500 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
                  onClick={() => {
                    if (confirm("Bạn có chắc chắn muốn xóa mã mời này? Tính năng gia nhập qua link sẽ bị VÔ HIỆU HÓA cho đến khi bạn tạo mã mới.")) {
                      deleteInviteMutation.mutate();
                    }
                  }}
                  disabled={deleteInviteMutation.isPending || regenerateInviteMutation.isPending}
               >
                  <Trash2 className="h-4 w-4" />
                  Vô hiệu hóa link mời
               </Button>
             )}

             <p className="mt-2 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
                * Mã mời giúp gia nhập dự án nhanh chóng<br />
                Hãy bảo mật thông tin link này
             </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
