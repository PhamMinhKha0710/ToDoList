import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { twoFactorService } from "@/services/twoFactor.service";
import { useAuthStore } from "@/stores/auth.store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TwoFactorSetupModal({ isOpen, onClose, onSuccess }: Props) {
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen && step === 1 && !qrCodeUrl) {
      loadQrCode();
    }
  }, [isOpen]);

  const loadQrCode = async () => {
    try {
      setIsLoading(true);
      const res = await twoFactorService.generate();
      setQrCodeUrl(res.data.qrCodeUrl);
      setSecret(res.data.secret);
    } catch (error) {
      toast.error("Không thể kết nối máy chủ tạo mã QR");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("Mã xác thực phải gồm 6 chữ số");
      return;
    }
    try {
      setIsLoading(true);
      const res = await twoFactorService.verifySetup({ secret, code });
      setBackupCodes(res.data.backupCodes);
      setStep(2);

      // Mutate global user state locally to reflect the enabled status securely
      if (user) {
        setUser({ ...user, is2FAEnabled: true });
      }
      onSuccess();
      toast.success("Kích hoạt xác thực 2 bước thành công!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mã xác thực không hợp lệ");
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setIsCopied(true);
    toast.success("Đã sao chép mã dự phòng vào bộ nhớ tạm");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClose = () => {
    setStep(1);
    setCode("");
    setQrCodeUrl("");
    setSecret("");
    setBackupCodes([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border" aria-describedby="Trình thiết lập xác thực 2 lớp" onInteractOutside={(e) => {
        // Cấm click ra ngoài khi đang ở step khóa (optional but highly recommended for wizards)
        if (step === 2) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            {step === 1 ? "Thiết lập Xác thực 2 bước (2FA)" : "Lưu mã dự phòng"} 🛡️
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === 1 
              ? "Bảo vệ tài khoản của bạn bẳng ứng dụng Authenticator (Google, Microsoft, v.v.)"
              : "Lưu trữ cẩn thận các mã này. Bạn sẽ cần chúng nếu mất điện thoại."
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-6 mt-2">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="bg-muted p-4 rounded-xl border border-border shrink-0 w-44 h-44 flex items-center justify-center overflow-hidden">
                {isLoading || !qrCodeUrl ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                ) : (
                  <img src={qrCodeUrl} alt="Trình quét QR Code" className="w-full h-full object-contain" />
                )}
              </div>
              <div className="space-y-3 flex-1 w-full">
                <p className="text-sm font-medium text-foreground border-b border-border pb-2">1. Quét mã QR</p>
                <p className="text-xs text-muted-foreground">Mở ứng dụng Authenticator và quét mã bên cạnh. Hoặc nhập mã bí mật theo cách thủ công:</p>
                <code className="block w-full bg-muted/50 p-2 rounded text-center font-mono text-sm tracking-widest font-bold text-foreground break-all select-all border border-border">
                  {secret}
                </code>
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">2. Nhập mã xác nhận</p>
              <p className="text-xs text-muted-foreground mb-2">Sau khi quét luồng cấu hình sẽ tạo dãy 6 chữ số ngẫu nhiên thay đổi tự động. Hãy nhập mã hiện tại của bạn:</p>
              <div className="flex justify-center">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  className="text-center text-3xl font-bold tracking-[0.4em] h-14 w-64 focus-visible:ring-primary border-border bg-muted/30 text-foreground"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isLoading} className="border-border text-foreground hover:bg-muted">
                Hủy
              </Button>
              <Button onClick={handleVerify} disabled={isLoading || code.length !== 6} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Kích hoạt 2FA
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-2">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="shrink-0 w-5 h-5 mt-0.5" />
              <div className="text-sm leading-relaxed">
                <p className="font-bold mb-1">Đây là lần duy nhất mã dự phòng được hiển thị!</p>
                <p>Hãy sao chép các mã này và cất ở nơi an toàn (VD: trình quản lý mật khẩu). Mỗi mã chỉ có thể sử dụng giải nguy được 1 lần.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-muted/30 p-4 rounded-lg border border-border">
              {backupCodes.map((bc, idx) => (
                <div key={idx} className="font-mono text-sm tracking-widest font-bold text-center py-2 bg-card rounded-md shadow-sm border border-border text-foreground select-all">
                  {bc}
                </div>
              ))}
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={copyBackupCodes} className="w-full sm:w-auto border-border text-foreground hover:bg-muted">
                {isCopied ? <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
                {isCopied ? "Đã chép mã" : "Sao chép mã"}
              </Button>
              <Button onClick={handleClose} className="w-full sm:w-auto mt-2 sm:mt-0 bg-primary text-primary-foreground hover:bg-primary/90">
                Tôi đã lưu trữ an toàn
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
