import React, { useState } from "react";
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

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
  isLoading: boolean;
  email: string;
}

export function OtpModal({ isOpen, onClose, onSubmit, isLoading, email }: OtpModalProps) {
  const [otp, setOtp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      onSubmit(otp);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            Xác thực tính danh 🛡️
          </DialogTitle>
          <DialogDescription className="text-slate-600 pt-2">
            Mã bảo mật gồm <strong>6 chữ số</strong> vừa được gửi đến email <span className="font-semibold text-indigo-600">{email}</span>. <br/>Mã sẽ tự hủy sau 5 phút.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="flex justify-center">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className="text-center text-4xl font-bold tracking-[0.4em] h-16 w-56 focus-visible:ring-indigo-500"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="border-slate-300 hover:bg-slate-50 text-slate-700">
              Hủy
            </Button>
            <Button type="submit" disabled={otp.length !== 6 || isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
