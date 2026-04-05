import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  History,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectNavbarActions } from "./ProjectNavbarActions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectHeaderProps {
  project: Project;
  onToggleActivity: () => void;
  onToggleReplay: () => void;
}

export const ProjectHeader = ({ project, onToggleActivity, onToggleReplay }: ProjectHeaderProps) => {
  const navigate = useNavigate();

  // State for collapse
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(`project_header_collapsed_${project._id}`);
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem(`project_header_collapsed_${project._id}`, String(isCollapsed));
  }, [isCollapsed, project._id]);

  const initials = project.name.substring(0, 2).toUpperCase();
  const accentColor = project.color || "#3b82f6";

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="relative group">
      <div 
        className={cn(
          "flex flex-col gap-4 mb-6 border-b transition-all duration-300 ease-in-out overflow-hidden pb-4",
          isCollapsed ? "h-[64px] pb-2 pt-1 mb-2" : "h-auto pt-2"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/projects")}
              className={cn("transition-all", isCollapsed ? "h-8 w-8" : "h-10 w-10")}
            >
              <ArrowLeft className={cn(isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
            </Button>
            
            <div className="flex items-center gap-4">
              {!isCollapsed && (
                <Avatar className="h-14 w-14 rounded-lg border shadow-sm shrink-0 transition-all">
                  <AvatarImage
                    src={project.imageUrl}
                    alt={project.name}
                    className="object-cover"
                  />
                  <AvatarFallback
                    className="rounded-lg text-white text-xl font-bold"
                    style={{ backgroundColor: accentColor }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div>
                <h1 className={cn(
                  "font-bold tracking-tight transition-all",
                  isCollapsed ? "text-lg" : "text-2xl"
                )}>
                  {project.name}
                </h1>
                {!isCollapsed && project.description && (
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl line-clamp-1">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TooltipProvider>
              <div className="flex items-center gap-2 bg-accent/30 p-1 rounded-lg border border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" onClick={onToggleReplay}>
                      <Film className="h-4 w-4 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Phát lại sự kiện (Replay)</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" onClick={onToggleActivity}>
                      <History className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Lịch sử hoạt động</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <div className="h-6 w-px bg-border mx-1" />
            <ProjectNavbarActions project={project} />
          </div>
        </div>
      </div>

      {/* Toggle Button - Floating at bottom center of the border */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="icon"
          className="h-6 w-12 rounded-full border shadow-sm hover:h-7 hover:w-14 transition-all bg-background/80 backdrop-blur-sm"
          onClick={toggleCollapse}
          title={isCollapsed ? "Hiện chi tiết" : "Thu gọn"}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
};
