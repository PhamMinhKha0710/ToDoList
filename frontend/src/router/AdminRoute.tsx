import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES } from '@/constants/routes'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import React from 'react'

export const AdminRoute = () => {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  if (user.role !== 'admin') return <Navigate to={ROUTES.PROJECTS} replace />
  
  return (
    <SidebarProvider style={{ '--sidebar-width': '16rem' } as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full min-h-0">
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto overflow-x-hidden text-slate-800">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
