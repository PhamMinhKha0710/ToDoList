import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Project } from '@/types/project';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProjectItemProps {
  project: Project;
  viewMode: 'grid' | 'list';
}

export const ProjectItem = ({ project, viewMode }: ProjectItemProps) => {
  const isGrid = viewMode === 'grid';

  return (
    <Link to={`/projects/${project._id}`} className="block h-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl">
      <Card className={`h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 cursor-pointer overflow-hidden group ${isGrid ? 'flex flex-col' : 'flex flex-row items-center p-4 gap-6'}`}>
        
        {/* Content Area */}
        <div className={isGrid ? 'flex-1' : 'flex-1 flex items-center justify-between'}>
          <div className={isGrid ? '' : 'flex-1'}>
            <CardHeader className={isGrid ? '' : 'p-0 pb-2'}>
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                {project.name}
              </CardTitle>
              {project.description && (
                <CardDescription className={`mt-2 ${isGrid ? 'line-clamp-2' : 'line-clamp-1'} text-sm text-muted-foreground`}>
                  {project.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className={isGrid ? 'pt-0' : 'p-0'}>
              <div className="text-xs text-muted-foreground/80 mt-1">
                Created: {dayjs(project.createdAt).format('MMM D, YYYY')}
              </div>
            </CardContent>
          </div>

          {/* Members Area */}
          <div className={`${isGrid ? '' : 'w-48 flex justify-end'}`}>
            <CardFooter className={`${isGrid ? 'pt-4 border-t bg-muted/20' : 'p-0'} justify-between items-center`}>
              <div className="flex -space-x-2 overflow-hidden py-1">
                {project.members && project.members.slice(0, 5).map((member, i) => {
                  const user = typeof member.userId === 'object' ? member.userId : null;
                  const name = user?.displayName || user?.email || 'User';
                  const initials = name.substring(0, 2).toUpperCase();

                  return (
                    <Avatar key={i} className="inline-block border-2 border-background w-8 h-8 rounded-full overflow-hidden">
                      <AvatarImage src={user?.avatarUrl} alt={name} className="object-cover" />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
                    </Avatar>
                  );
                })}
                {project.members && project.members.length > 5 && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground z-10">
                    +{project.members.length - 5}
                  </div>
                )}
                {(!project.members || project.members.length === 0) && (
                  <div className="text-sm text-muted-foreground italic">No members</div>
                )}
              </div>
              
              {isGrid && (
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  {project.members?.length || 0} {project.members?.length === 1 ? 'member' : 'members'}
                </span>
              )}
            </CardFooter>
          </div>
        </div>

      </Card>
    </Link>
  );
};
