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

export const LoginForm = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [isLoading, setIsLoading] = useState(false)

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
      const { accessToken, user } = res.data

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
        </div>
      </form>
    </div>
  )
}
