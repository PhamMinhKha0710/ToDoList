import * as React from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  CheckSquare,
  FolderKanban,
  Home,
  Settings,
  Shield,
  Users,
  PieChart,
} from "lucide-react";

import { NavUser } from "@/components/layout/navigation/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/constants/routes";

const mainNav = [
  { title: "Tổng quan", url: ROUTES.HOME, icon: Home },
  { title: "Công việc cá nhân", url: ROUTES.MY_TASKS, icon: CheckSquare },
  { title: "Dự án", url: ROUTES.PROJECTS, icon: FolderKanban },
  { title: "Lịch", url: ROUTES.CALENDAR, icon: CalendarDays },
  { title: "Cài đặt", url: ROUTES.PROFILE, icon: Settings },
];

const adminNav = [
  { title: "Bảng điều khiển", url: ROUTES.ADMIN, icon: PieChart },
  { title: "Người dùng", url: ROUTES.ADMIN_USERS, icon: Users },
  { title: "Dự án (Admin)", url: ROUTES.ADMIN_PROJECTS, icon: Shield },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const authUser = useAuthStore((state) => state.user);
  const isAdmin = authUser?.role === "admin";

  const userProfile = authUser
    ? {
        name: authUser.displayName || authUser.email.split("@")[0],
        email: authUser.email,
        avatar: authUser.avatarUrl || "",
      }
    : { name: "Khách", email: "guest@example.com", avatar: "" };

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              asChild
            >
              <NavLink to={ROUTES.HOME}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <CheckSquare className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">To Do App</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Quản lý công việc
                  </span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : ""
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : ""
                        }
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userProfile} />
      </SidebarFooter>
    </Sidebar>
  );
}
