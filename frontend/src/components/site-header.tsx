"use client"

import { SidebarIcon } from "lucide-react"

import { SearchForm } from "@/components/search-form"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

import { SiteHeaderProjectInfo } from "@/components/project-detail/SiteHeaderProjectInfo"
import { ProjectNavbarActions } from "@/components/project-detail/ProjectNavbarActions"
import { useKanbanStore } from "@/stores/kanban.store"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const { activeProject } = useKanbanStore()

  return (
    <header className="flex sticky top-0 z-50 w-full items-center border-b bg-background">
      <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        <div className="flex-1 flex items-center overflow-hidden">
          {activeProject ? (
            <SiteHeaderProjectInfo project={activeProject} />
          ) : (
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/projects">
                    Dự án
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {activeProject && (
            <div className="hidden md:flex items-center gap-2 mr-2 pr-2 border-r">
              <ProjectNavbarActions project={activeProject} />
            </div>
          )}
          <NotificationBell />
          <Separator orientation="vertical" className="h-4" />
          <SearchForm className="w-full sm:w-auto" />
        </div>
      </div>
    </header>
  );
}
