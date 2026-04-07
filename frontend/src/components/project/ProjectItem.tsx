import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";
import type { User } from "@/types/user";
import { useAuthStore } from "@/stores/auth.store";
import {
  Card,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ProjectItemProps {
  project: Project;
  viewMode: "grid" | "list";
}

export const ProjectItem = ({ project, viewMode }: ProjectItemProps) => {
  const { user: currentUser } = useAuthStore();
  const isGrid = viewMode === "grid";
  const accentColor = project.color || "#3b82f6";
  const initials = project.name.substring(0, 2).toUpperCase();

  // Tìm status của user hiện tại
  const member = project.members.find(
    (m) => (typeof m.userId === "string" ? m.userId : (m.userId as User)._id) === currentUser?._id
  );
  const isPending = member?.status === "pending";
  const targetUrl = isPending ? `/projects/${project._id}/invite` : `/projects/${project._id}`;

  return (
    <Link
      to={targetUrl}
      className={`block h-full outline-none group ${isGrid ? "perspective-1000" : ""}`}
    >
      <Card
        className={cn(
          "h-full transition-all duration-500 cursor-pointer overflow-hidden flex flex-col relative border border-border shadow-sm",
          isGrid
            ? "hover:shadow-2xl hover:-translate-y-2 hover:rotate-x-1 hover:border-primary/50"
            : "hover:shadow-xl hover:translate-x-2 hover:border-primary/50",
          "bg-card/40 dark:bg-card/40 backdrop-blur-xl"
        )}
      >
        {/* Accent Top Bar / Side Bar Glow */}
        <div
          className={cn(
            "absolute transition-all duration-500",
            isGrid ? "top-0 left-0 right-0 h-1.5" : "top-0 left-0 bottom-0 w-1.5"
          )}
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 0 20px ${accentColor}40`
          }}
        />

        {/* Content Area */}
        <div
          className={cn(
            "relative z-10",
            isGrid ? "p-6 flex-1 flex flex-col" : "p-4 flex-1 flex flex-row items-center gap-6"
          )}
        >
          <div
            className={cn(
              isGrid ? "flex-1 flex flex-row items-center gap-5" : "flex-1 flex items-center gap-6"
            )}
          >
            {/* Project Icon */}
            <div className="relative group/icon">
              <div
                className="absolute inset-0 blur-lg opacity-20 group-hover/icon:opacity-40 transition-opacity duration-500 rounded-2xl"
                style={{ backgroundColor: accentColor }}
              />
              <Avatar
                className={cn(
                  isGrid ? "h-16 w-16" : "h-12 w-12",
                  "rounded-2xl border-2 border-background shadow-lg flex-shrink-0 relative z-10 transition-transform duration-500 group-hover:scale-110 bg-background"
                )}
              >
                <AvatarImage
                  src={project.imageUrl}
                  alt={project.name}
                  className="object-cover"
                />
                <AvatarFallback
                  className="rounded-2xl text-white text-xl font-bold"
                  style={{ backgroundColor: accentColor }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Title, Description & Date */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors truncate">
                  {project.name}
                </CardTitle>
                {isPending && (
                  <Badge variant="secondary" className="px-2 py-0 text-[10px] uppercase font-bold bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50">
                    Pending
                  </Badge>
                )}
              </div>
              <CardDescription
                className={cn(
                  "mt-1 text-sm font-medium text-muted-foreground/80 leading-relaxed",
                  isGrid ? "line-clamp-2" : "line-clamp-1"
                )}
              >
                {project.description || "Không có mô tả."}
              </CardDescription>
              {!isGrid && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    Updated {dayjs(project.updatedAt).format("HH:mm DD/MM/YYYY")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grid View Date & Footer */}
          {isGrid && (
            <div className="mt-6 flex flex-col gap-4 w-full">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
                Hoạt động gần đây {dayjs(project.updatedAt).format("HH:mm DD/MM/YYYY")}
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-border/50 to-transparent" />

              <div className="flex justify-between items-center w-full">
                <div className="flex items-center overflow-hidden py-1">
                  {project.members &&
                    project.members.slice(0, 4).map((member, i) => {
                      const user = typeof member.userId === "object" ? member.userId : null;
                      const name = user?.displayName || user?.email || "User";
                      const userInitials = name.substring(0, 2).toUpperCase();

                      return (
                        <div key={i} className="group/avatar relative">
                          <Avatar
                            className="inline-block border-2 border-background w-7 h-7 rounded-full overflow-hidden shadow-sm transition-all duration-300 group-hover/avatar:-translate-y-1 group-hover/avatar:scale-110"
                            style={{
                              zIndex: 10 - i,
                              marginLeft: i > 0 ? "-0.625rem" : "0"
                            }}
                          >
                            <AvatarImage
                              src={user?.avatarUrl}
                              alt={name}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      );
                    })}
                  {project.members && project.members.length > 4 && (
                    <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-background bg-muted text-[10px] font-bold text-muted-foreground shadow-sm relative z-0 -ml-2.5">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary/10 rounded-full group-hover:bg-primary/10 transition-colors">
                  <Users className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {project.members?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* List View Members Stack */}
          {!isGrid && (
            <div className="flex items-center gap-6 shrink-0">
              <div className="flex -space-x-2 overflow-hidden">
                {project.members?.slice(0, 3).map((m, i) => (
                  <Avatar key={i} className="w-8 h-8 border-2 border-background rounded-full ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    <AvatarImage src={typeof m.userId === 'object' ? m.userId.avatarUrl : ''} />
                    <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">{(typeof m.userId === 'object' ? (m.userId.displayName || m.userId.email) : 'U').substring(0, 2)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/5 text-[10px] font-bold text-primary border border-primary/20">
                {project.members?.length}
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default ProjectItem;
