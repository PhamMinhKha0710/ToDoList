import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, Mail, BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { userService } from "@/services/user.service";
import { uploadService } from "@/services/upload.service";
import { isEmojiUrl, getAvatarUrl } from "@/lib/utils";
import { OtpModal } from "@/components/common/OtpModal";

const profileSchema = z.object({
  fullName: z.string().min(1, "Họ và tên là bắt buộc").max(50, "Tối đa 50 ký tự"),
  displayName: z.string().min(1, "Tên hiển thị là bắt buộc").max(50, "Tối đa 50 ký tự"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const DEFAULT_AVATARS = ["✨", "🔥", "🚀", "🌟", "🎨", "👽"];

export default function ProfileForm() {
  const { user } = useAuthStore();
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatarUrl || "✨");
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email Update States
  const [newEmailValue, setNewEmailValue] = useState("");
  const [isRequestingEmailOtp, setIsRequestingEmailOtp] = useState(false);
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      displayName: user?.displayName || "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        displayName: user.displayName || "",
      });
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      }
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const payload = { fullName: data.fullName, displayName: data.displayName, avatarUrl: avatarPreview };
      const res = await userService.updateProfile(payload);
      useAuthStore.getState().setUser(res.data.user);
      toast.success("Thông tin đã được cập nhật thành công!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ảnh không được vượt quá 2MB");
        return;
      }
      setIsSavingAvatar(true);
      try {
        const imageUrl = await uploadService.uploadFile(file);
        setAvatarPreview(imageUrl);
        toast.success("Tải ảnh lên thành công");
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi tải ảnh lên");
      } finally {
        setIsSavingAvatar(false);
      }
    }
  };
  const handleSelectDefaultAvatar = (emoji: string) => {
    setIsSavingAvatar(true);
    setAvatarPreview(emoji);
    setTimeout(() => setIsSavingAvatar(false), 500);
  };

  const handleRequestEmailOtp = async () => {
    if (!newEmailValue || !/^\S+@\S+\.\S+$/.test(newEmailValue)) {
      toast.error("Vui lòng nhập định dạng email hợp lệ");
      return;
    }
    if (!user?.email) return;

    try {
      setIsRequestingEmailOtp(true);
      await userService.requestOtp({ email: user.email, action: 'UPDATE_EMAIL' });
      setShowEmailOtpModal(true);
      toast.success("Mã OTP đã được gửi đến email hiện tại của bạn");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi yêu cầu OTP");
    } finally {
      setIsRequestingEmailOtp(false);
    }
  };

  const handleEmailOtpSubmit = async (otp: string) => {
    try {
      setIsVerifyingEmailOtp(true);
      const payload = { fullName: user?.fullName, displayName: user?.displayName, email: newEmailValue, otp };
      const res = await userService.updateProfile(payload);
      useAuthStore.getState().setUser(res.data.user);
      toast.success("Cập nhật địa chỉ email thành công!");
      setShowEmailOtpModal(false);
      setIsUpdatingEmail(false);
      setNewEmailValue("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật email");
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  return (
    <Card className="shadow-sm border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Thông tin cơ bản</CardTitle>
        <CardDescription className="text-muted-foreground">Cập nhật ảnh đại diện và chi tiết thông tin cá nhân của bạn.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border-4 border-background shadow-xl ring-1 ring-border transition-all duration-300 overflow-hidden flex items-center justify-center bg-muted">
              {isSavingAvatar ? (
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
              ) : isEmojiUrl(avatarPreview) ? (
                <span className="text-4xl leading-none select-none">
                  {avatarPreview}
                </span>
              ) : (
                <Avatar className="w-full h-full border-0 shadow-none">
                  <AvatarImage src={getAvatarUrl(avatarPreview)} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-muted text-muted-foreground font-bold uppercase tracking-wider border-0">
                    {(user?.displayName || "JD").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-sm border border-border bg-background hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSavingAvatar}
            >
              <Camera size={14} className="text-muted-foreground" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              Ảnh đại diện mẫu
              {isSavingAvatar && <span className="text-xs text-primary font-normal flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...</span>}
            </h4>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelectDefaultAvatar(emoji)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-muted/50 border transition-all hover:scale-110 hover:shadow-sm ${avatarPreview === emoji ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground/30'}`}
                  disabled={isSavingAvatar}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Hoặc tải lên ảnh tùy chỉnh định dạng .jpg, .png</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">Họ và tên</Label>
              <Input
                id="fullName"
                placeholder="Nguyễn Văn A"
                {...register("fullName")}
                className="focus-visible:ring-primary transition-shadow bg-background border-border text-foreground"
              />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground">Tên hiển thị</Label>
              <Input
                id="displayName"
                placeholder="Văn A"
                {...register("displayName")}
                className="focus-visible:ring-primary transition-shadow bg-background border-border text-foreground"
              />
              {errors.displayName && <p className="text-xs text-red-500">{errors.displayName.message}</p>}
            </div>
          </div>

          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Lưu thay đổi
          </Button>
        </form>

        <div className="pt-6 border-t border-border">
          <div className="space-y-4">
            <div>
              <Label className="text-foreground mb-2 block">Địa chỉ Email</Label>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    value={user?.email || "Chưa có email"}
                    readOnly
                    className="pl-9 bg-muted/50 text-foreground focus-visible:ring-0 border-border cursor-default"
                  />
                  <BadgeCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUpdatingEmail(!isUpdatingEmail)}
                  className="shrink-0 border-border text-foreground hover:bg-muted"
                >
                  {isUpdatingEmail ? "Hủy" : "Cập nhật Email"}
                </Button>
              </div>
            </div>

            {isUpdatingEmail && (
              <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-2">
                  <Label htmlFor="newEmail" className="text-foreground">Địa chỉ Email mới</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmailValue}
                    onChange={(e) => setNewEmailValue(e.target.value)}
                    placeholder="Nhập email mới"
                    className="bg-background border-border text-foreground focus-visible:ring-primary"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRequestEmailOtp}
                  disabled={isRequestingEmailOtp || !newEmailValue}
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isRequestingEmailOtp && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Gửi liên kết xác minh
                </Button>
              </div>
            )}
          </div>
        </div>

      </CardContent>

      <OtpModal
        isOpen={showEmailOtpModal}
        onClose={() => setShowEmailOtpModal(false)}
        onSubmit={handleEmailOtpSubmit}
        isLoading={isVerifyingEmailOtp}
        email={user?.email || ""}
      />
    </Card>
  );
}
