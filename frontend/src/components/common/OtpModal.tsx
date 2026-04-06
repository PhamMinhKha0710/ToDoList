import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
  isLoading: boolean;
  email: string;
}

export function OtpModal({ isOpen, onClose, onSubmit, isLoading, email }: OtpModalProps) {
  const [otp, setOtp] = useState("");

  const handleConfirmClick = () => {
    if (otp.length === 0) {
      toast.error("Vui lòng nhập mã OTP");
      return;
    }
    if (otp.length !== 6) {
      toast.error("Mã OTP phải bao gồm chính xác 6 chữ số");
      return;
    }
    onSubmit(otp);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            Xác thực tính danh 🛡️
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Mã bảo mật gồm <strong>6 chữ số</strong> vừa được gửi đến email <span className="font-semibold text-primary">{email}</span>. <br/>Mã sẽ tự hủy sau 5 phút.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="flex justify-center">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className="text-center text-4xl font-bold tracking-[0.4em] h-16 w-56 focus-visible:ring-primary bg-muted/50 border-border"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading} 
            >
              Hủy
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirmClick}
              disabled={isLoading} 
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
