import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'

import { forgotPasswordSchema, type ForgotPasswordInput } from '@/schemas/auth.schema'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/constants/routes'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const ForgotPasswordForm = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setIsLoading(true)
      await authService.forgotPassword(data.email)
      toast.success('Yêu cầu đã được gửi. Vui lòng kiểm tra email của bạn.')
      navigate(`${ROUTES.RESET_PASSWORD}?email=${encodeURIComponent(data.email)}`)
    } catch (error: any) {
      // Global toast handled in axios.ts
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Quên mật khẩu?</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Nhập email của bạn để nhận mã OTP khôi phục mật khẩu.
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi yêu cầu
          </Button>

          <Button variant="ghost" className="w-full" asChild>
            <Link to={ROUTES.LOGIN} className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
