import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/axios";
import { ROUTES } from "@/constants/routes";
import { Loader2 } from "lucide-react";

/**
 * Trang này được backend redirect tới sau khi Google xác thực thành công.
 * URL có dạng: /auth/google/callback?accessToken=xxx
 * Nhiệm vụ: lưu accessToken vào store, lấy thông tin user, rồi chuyển hướng vào app.
 */
const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const hasCalled = useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    const accessToken = searchParams.get("accessToken");

    if (!accessToken) {
      navigate(ROUTES.LOGIN + "?error=google_failed", { replace: true });
      return;
    }

    // Gọi API /users/me để lấy thông tin user (dùng accessToken vừa nhận)
    api
      .get("/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        const user = res.data?.data ?? res.data;
        login(user, accessToken);
        navigate(ROUTES.PROJECTS, { replace: true });
      })
      .catch(() => {
        navigate(ROUTES.LOGIN + "?error=google_failed", { replace: true });
      });
  }, []);

  return (
    <div className="flex min-h-svh items-center justify-center flex-col gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Đang xử lý đăng nhập Google...</p>
    </div>
  );
};

export default GoogleCallbackPage;
