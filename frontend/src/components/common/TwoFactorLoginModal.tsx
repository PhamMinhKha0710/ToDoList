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
import { Loader2, ShieldCheck, Key } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tempToken: string;
}

export function TwoFactorLoginModal({ isOpen, onClose, tempToken }: Props) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleConfirmClick = async () => {
    if (code.length === 0) {
      toast.error("Vui lòng nhập mã xác nhận");
      return;
    }
    if (code.length !== 6 && code.length !== 8) {
      toast.error("Mã xác nhận phải gồm 6 chữ số hoặc 8 ký tự (mã dự phòng)");
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.authenticate2FA({ tempToken, code });
      
      // Safety check just in case types drift
      if (res.data && res.data.accessToken && res.data.user) {
        login(res.data.user, res.data.accessToken);
        toast.success('Xác thực 2 bước thành công. Đang đăng nhập...');
        onClose();
        navigate(ROUTES.PROJECTS);
      }
    } catch (error: any) {
      // Global errorHandler handles the toast automatically, but we can do it explicitly
      // toast.error(error.response?.data?.message || "Mã xác nhận không đúng");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <ShieldCheck size={32} />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-center text-foreground">
            Xác thực 2 bước 🛡️
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            Vì lý do bảo mật, vui lòng mở ứng dụng <strong>Authenticator</strong> trên điện thoại và nhập mã hoặc sử dụng <strong>Mã dự phòng</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="flex justify-center relative">
            <Key className="absolute left-[15%] top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              inputMode="text"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
              placeholder="000000"
              className="text-center text-3xl font-bold tracking-[0.4em] h-16 w-80 focus-visible:ring-primary pl-10 bg-muted/30 border-border text-foreground"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading} 
              className="border-border text-foreground hover:bg-muted w-full sm:w-auto"
            >
              Hủy đăng nhập
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirmClick}
              disabled={isLoading} 
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Tiếp tục
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
