import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { loginSchema, type LoginInput } from '@/schemas/auth.schema'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/constants/routes'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { TwoFactorLoginModal } from '@/components/common/TwoFactorLoginModal'

export const LoginForm = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [isLoading, setIsLoading] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [tempToken, setTempToken] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true)
      const res = await authService.login(data)
      
      // Nếu server yêu cầu cấu hình 2FA
      if (res.data?.require2FA && res.data?.tempToken) {
        setTempToken(res.data.tempToken)
        setShow2FA(true)
        return
      }

      // Xử lý login bình thường
      const { accessToken, user } = res.data as any

      // Lưu trữ user info & setup socket real-time.
      login(user, accessToken)

      toast.success('Đăng nhập thành công')
      if (user.role === 'admin') {
        navigate(ROUTES.ADMIN)
      } else {
        navigate(ROUTES.PROJECTS)
      }
    } catch (error: any) {
      // Global toast handled in axios.ts
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Chào mừng trở lại</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Đăng nhập vào tài khoản của bạn
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-3">
            <div className="flex items-center">
              <Label htmlFor="password">Mật khẩu</Label>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="ml-auto text-sm underline-offset-4 hover:underline text-primary"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Đăng nhập
          </Button>

          <div className="text-center text-sm">
            Chưa có tài khoản?{' '}
            <Link to={ROUTES.REGISTER} className="underline underline-offset-4 hover:text-primary">
              Tạo tài khoản mới
            </Link>
          </div>

          {/* Divider */}
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              Hoặc tiếp tục với
            </span>
          </div>

          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            asChild
          >
            <a href={`${import.meta.env.VITE_API_URL ?? '/api'}/auth/google`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor"/>
              </svg>
              Đăng nhập bằng Google
            </a>
          </Button>
        </div>
      </form>

      {/* Intercept Overlay for 2FA */}
      <TwoFactorLoginModal 
        isOpen={show2FA} 
        onClose={() => setShow2FA(false)} 
        tempToken={tempToken} 
      />
    </div>
  )
}
