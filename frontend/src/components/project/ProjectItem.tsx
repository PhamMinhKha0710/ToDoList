import { Link } from "react-router-dom";
import dayjs from "dayjs";
import type { Project } from "@/types/project";
import type { User } from "@/types/user";
import { useAuthStore } from "@/stores/auth.store";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      className="block h-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl group"
    >
      <Card
        className="h-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-border cursor-pointer overflow-hidden flex flex-col border-l-4"
        style={{ borderLeftColor: accentColor }}
      >
        {/* Content Area */}
        <div
          className={`pl-4 ${isGrid ? "flex-1 flex flex-col" : "flex-1 flex flex-row items-center p-4 gap-6"}`}
        >
          <div
            className={`${isGrid ? "flex-1 pt-4 pb-2 pr-4" : "flex-1 flex items-center gap-4"}`}
          >
            <div
              className={`flex ${isGrid ? "flex-col items-start gap-3" : "items-center gap-4"} mb-2`}
            >
              {/* Project Icon */}
              <Avatar
                className={`${isGrid ? "h-12 w-12" : "h-10 w-10"} rounded-lg border shadow-sm`}
              >
                <AvatarImage
                  src={project.imageUrl}
                  alt={project.name}
                  className="object-cover"
                />
                <AvatarFallback
                  className="rounded-lg text-white font-bold"
                  style={{ backgroundColor: accentColor }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Title & Description */}
              <div>
                <CardTitle className="text-base font-semibold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                  {project.name}
                </CardTitle>
                <CardDescription
                  className={`mt-0.5 ${isGrid ? "line-clamp-2" : "line-clamp-1"} text-sm text-muted-foreground`}
                >
                  {project.description || "Company-managed project"}
                </CardDescription>
              </div>
            </div>

            <CardContent className={isGrid ? "pt-0 px-0" : "p-0 ml-14"}>
              <div className="text-xs text-muted-foreground/80 mt-1">
                Updated {dayjs(project.updatedAt).format("MMM D, YYYY")}
              </div>
            </CardContent>
          </div>

          {/* Members Area */}
          <div
            className={`${isGrid ? "pr-4 w-full" : "w-48 flex justify-end"}`}
          >
            <CardFooter
              className={`${isGrid ? "pb-4 pt-3 border-t px-0" : "p-0"} justify-between items-center w-full`}
            >
              <div className="flex -space-x-2 overflow-hidden py-1">
                {project.members &&
                  project.members.slice(0, 5).map((member, i) => {
                    const user =
                      typeof member.userId === "object" ? member.userId : null;
                    const name = user?.displayName || user?.email || "User";
                    const userInitials = name.substring(0, 2).toUpperCase();

                    return (
                      <Avatar
                        key={i}
                        className="inline-block border-2 border-background w-7 h-7 rounded-full overflow-hidden"
                      >
                        <AvatarImage
                          src={user?.avatarUrl}
                          alt={name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                {project.members && project.members.length > 5 && (
                  <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground z-10">
                    +{project.members.length - 5}
                  </div>
                )}
                {(!project.members || project.members.length === 0) && (
                  <div className="text-sm text-muted-foreground italic">
                    No members
                  </div>
                )}
              </div>

              {isGrid && (
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {project.members?.length || 0}{" "}
                  {project.members?.length === 1 ? "member" : "members"}
                </span>
              )}
            </CardFooter>
          </div>
        </div>
      </Card>
    </Link>
  );
};
