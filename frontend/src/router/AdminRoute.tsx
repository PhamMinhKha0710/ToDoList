import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/constants/routes'

export const AdminRoute = () => {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  if (user.role !== 'admin') return <Navigate to={ROUTES.PROJECTS} replace />
  return <Outlet />
}
