import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/constants/routes'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export const ProtectedRoute = () => {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-background">
        <SidebarTrigger className="m-4" />
        <Outlet />
      </main>
    </SidebarProvider>
  )
}
