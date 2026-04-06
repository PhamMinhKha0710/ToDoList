import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth.store";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { isEmojiUrl, getAvatarUrl } from "@/lib/utils";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="min-w-0 w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground min-w-0 w-full"
            >
              {isEmojiUrl(user.avatar) ? (
                <div className="h-8 w-8 rounded-md flex items-center justify-center bg-sidebar-accent text-sidebar-accent-foreground text-sm">
                  {user.avatar}
                </div>
              ) : (
                <Avatar className="h-8 w-8 rounded-md">
                  <AvatarImage src={getAvatarUrl(user.avatar)} alt={user.name} className="object-cover" />
                  <AvatarFallback className="rounded-md">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 w-0 min-w-0 overflow-hidden text-left text-sm leading-tight">
                <div className="truncate font-semibold">{user.name}</div>
                <div className="truncate text-xs">{user.email}</div>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  {isEmojiUrl(user.avatar) ? (
                    <div className="h-8 w-8 rounded-md flex items-center justify-center bg-sidebar-accent text-sidebar-accent-foreground text-sm">
                      {user.avatar}
                    </div>
                  ) : (
                    <Avatar className="h-8 w-8 rounded-md">
                      <AvatarImage src={getAvatarUrl(user.avatar)} alt={user.name} className="object-cover" />
                      <AvatarFallback className="rounded-md">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                <div className="flex-1 w-0 min-w-0 overflow-hidden text-left text-sm leading-tight">
                  <div className="truncate font-semibold">{user.name}</div>
                  <div className="truncate text-xs">{user.email}</div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)}>
                <BadgeCheck className="mr-2" />
                Profile Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:bg-red-500/10 focus:text-red-500 transition-colors"
            >
              <LogOut className="mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
