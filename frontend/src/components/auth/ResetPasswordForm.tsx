import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { resetPasswordSchema, type ResetPasswordInput } from '@/schemas/auth.schema'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/constants/routes'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const ResetPasswordForm = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  const email = searchParams.get('email') || ''
  const otp = searchParams.get('otp') || ''

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      otp,
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (email) setValue('email', email)
    if (otp) setValue('otp', otp)
  }, [email, otp, setValue])

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setIsLoading(true)
      const payload = {
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      }
      await authService.resetPassword(payload)
      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.')
      navigate(ROUTES.LOGIN)
    } catch (error: any) {
      // Global toast handled in axios.ts
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Nhập mã OTP đã được gửi đến email và mật khẩu mới của bạn.
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
              disabled={isLoading || !!email}
              className={email ? "bg-muted" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="otp">Mã OTP (6 chữ số)</Label>
            <Input
              id="otp"
              type="text"
              maxLength={6}
              placeholder="123456"
              {...register('otp')}
              disabled={isLoading}
            />
            {errors.otp && (
              <p className="text-sm text-destructive">{errors.otp.message}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              {...register('newPassword')}
              disabled={isLoading}
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="confirmPassword">Nhập lại mật khẩu mới</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Đặt lại mật khẩu
          </Button>
        </div>
      </form>
    </div>
  )
}
