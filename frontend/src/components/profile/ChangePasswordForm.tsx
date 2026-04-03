import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/stores/auth.store";
import { OtpModal } from "@/components/common/OtpModal";
import { TwoFactorSetupModal } from "@/components/common/TwoFactorSetupModal";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
  newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ChangePasswordForm() {
  const { user } = useAuthStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // 2FA Flow mapping
  const is2faActive = user?.is2FAEnabled || false;
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);

  // OTP States
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingPasswordData, setPendingPasswordData] = useState<PasswordFormValues | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormValues) => {
    if (!user?.email) {
      toast.error("Không tìm thấy thông tin email của bạn");
      return;
    }
    try {
      setIsRequestingOtp(true);
      await userService.requestOtp({ email: user.email, action: 'CHANGE_PASSWORD' });
      setPendingPasswordData(data);
      setShowOtpModal(true);
      toast.success("Mã OTP đã được gửi đến email của bạn");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi yêu cầu OTP");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleOtpSubmit = async (otp: string) => {
    if (!pendingPasswordData) return;
    try {
      setIsVerifying(true);
      await userService.changePassword({ 
        currentPassword: pendingPasswordData.currentPassword, 
        newPassword: pendingPasswordData.newPassword, 
        confirmPassword: pendingPasswordData.confirmPassword,
        otp
      });
      toast.success("Đổi mật khẩu thành công!");
      setIsChangingPassword(false);
      setShowOtpModal(false);
      setPendingPasswordData(null);
      reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setIsVerifying(false);
    }
  };

  const newPassword = watch("newPassword", "");

  // Basic password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", color: "bg-slate-200", text: "" };
    if (pass.length < 6) return { label: "Yếu", color: "bg-red-400", text: "text-red-500" };
    if (pass.length < 10) return { label: "Trung bình", color: "bg-amber-400", text: "text-amber-500" };
    return { label: "Mạnh", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" size={24} />
          Tùy chọn Bảo mật
        </CardTitle>
        <CardDescription>Quản lý mật khẩu và các phương thức xác thực của bạn.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Password Section */}
        <div className="space-y-4 border rounded-xl p-5 border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div>
              <h4 className="font-medium text-slate-900 text-sm">Đổi mật khẩu</h4>
              <p className="text-sm text-slate-500">Cập nhật mật khẩu tài khoản của bạn</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              {isChangingPassword ? "Hủy" : "Đổi mật khẩu"}
            </Button>
          </div>

          <div className={`grid transition-all duration-300 ease-in-out ${isChangingPassword ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    {...register("currentPassword")} 
                    className="bg-white focus-visible:ring-indigo-500" 
                  />
                  {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    {...register("newPassword")} 
                    className="bg-white focus-visible:ring-indigo-500" 
                  />
                  {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
                  
                  {/* Strength Meter */}
                  {newPassword && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 flex gap-1 h-1.5">
                        <div className={`flex-1 rounded-full ${strength.color}`}></div>
                        <div className={`flex-1 rounded-full ${strength.label === 'Trung bình' || strength.label === 'Mạnh' ? strength.color : 'bg-slate-200'}`}></div>
                        <div className={`flex-1 rounded-full ${strength.label === 'Mạnh' ? strength.color : 'bg-slate-200'}`}></div>
                      </div>
                      <span className={`text-xs font-medium w-max text-right ${strength.text}`}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    {...register("confirmPassword")} 
                    className="bg-white focus-visible:ring-indigo-500" 
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={isRequestingOtp} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                    {isRequestingOtp && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Cập nhật mật khẩu
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* 2FA Section */}
        <div className="flex items-start sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="space-y-1">
            <h4 className="font-medium text-slate-900 flex items-center gap-2">
              Xác thực 2 yếu tố (2FA)
              {is2faActive && <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Đang bật</span>}
            </h4>
            <p className="text-sm text-slate-500">
              Thêm một lớp bảo mật bổ sung cho tài khoản của bạn.
            </p>
          </div>
          
          {/* Custom Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={is2faActive}
            onClick={() => {
              if (is2faActive) {
                toast.info("Tính năng hủy liên kết Authenticator đang được cập nhật.");
                return;
              }
              setShow2FASetupModal(true);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
              is2faActive ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                is2faActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

      </CardContent>

      <OtpModal 
        isOpen={showOtpModal} 
        onClose={() => setShowOtpModal(false)}
        onSubmit={handleOtpSubmit}
        isLoading={isVerifying}
        email={user?.email || ""}
      />

      <TwoFactorSetupModal 
        isOpen={show2FASetupModal}
        onClose={() => setShow2FASetupModal(false)}
        onSuccess={() => setShow2FASetupModal(false)}
      />
    </Card>
  );
}
