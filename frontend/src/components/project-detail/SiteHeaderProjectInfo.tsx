import { useNavigate } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import type { Project } from "@/types/project";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface SiteHeaderProjectInfoProps {
  project: Project;
}

export function SiteHeaderProjectInfo({ project }: SiteHeaderProjectInfoProps) {
  const navigate = useNavigate();
  
  const initials = project.name.substring(0, 2).toUpperCase();
  const accentColor = project.color || "#3b82f6";

  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink 
              href="/projects"
              onClick={(e) => {
                e.preventDefault();
                navigate("/projects");
              }}
              className="flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              <span>Dự án</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block">
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 rounded-sm border shadow-sm shrink-0">
                <AvatarImage
                  src={project.imageUrl}
                  alt={project.name}
                  className="object-cover"
                />
                <AvatarFallback
                  className="rounded-sm text-white text-[10px] font-bold"
                  style={{ backgroundColor: accentColor }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <BreadcrumbPage className="font-semibold truncate max-w-[150px] sm:max-w-[250px]">
                {project.name}
              </BreadcrumbPage>
            </div>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
