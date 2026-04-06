import { useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/activity.service";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, X, Info, Activity as ActivityIcon, 
  ArrowRight, Edit3, MessageSquare, UserPlus, 
  Trash2, Move, Plus, ChevronRight, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Activity } from "@/types/activity";

interface ProjectActivitySidebarProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const getActionStyles = (action: string) => {
  if (action.includes('CREATED') || action.includes('JOINED')) return { icon: Plus, color: 'text-green-500', bg: 'bg-green-500/10' };
  if (action.includes('UPDATED') || action.includes('REORDERED')) return { icon: Edit3, color: 'text-blue-500', bg: 'bg-blue-500/10' };
  if (action.includes('DELETED') || action.includes('REMOVED')) return { icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10' };
  if (action.includes('MOVED')) return { icon: Move, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
  if (action.includes('COMMENT')) return { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' };
  if (action.includes('INVITED')) return { icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
  return { icon: Settings, color: 'text-gray-500', bg: 'bg-gray-500/10' };
};

const formatValue = (key: string, value: any) => {
  if (value === null || value === undefined || value === "") return <span className="italic text-muted-foreground/60">Trống</span>;
  
  if (key === 'priority') {
    const colors: any = { low: 'bg-blue-100 text-blue-700 border-blue-200', medium: 'bg-yellow-100 text-yellow-700 border-yellow-200', high: 'bg-red-100 text-red-700 border-red-200' };
    return <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4.5 uppercase font-bold", colors[value] || "")}>{value}</Badge>;
  }
  
  if (key === 'status') {
    return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4.5 font-semibold bg-muted/50">{value}</Badge>;
  }

  if (key === 'color' && typeof value === 'string' && value.startsWith('#')) {
    return (
      <div className="flex items-center gap-1.5 bg-background border px-1.5 py-0.5 rounded-md shadow-xs">
        <div className="w-3.5 h-3.5 rounded-sm shadow-xs" style={{ backgroundColor: value }} />
        <span className="font-mono text-[10px] uppercase font-semibold">{value}</span>
      </div>
    );
  }

  // Handle Tag arrays
  if (key === 'tags' && Array.isArray(value)) {
    if (value.length === 0) return <span className="italic text-muted-foreground/60 text-[11px]">Không có thẻ</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((tag: any, i: number) => (
          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-sm border shadow-xs" style={{ backgroundColor: tag.color || '#fff' }}>
            {tag.name}
          </span>
        ))}
      </div>
    );
  }

  // Handle files
  if (key === 'attachments' && Array.isArray(value)) {
    const images = value.filter((a: any) => /\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl || a.url));
    return (
      <div className="flex flex-col gap-1">
        <span className="font-medium text-[11px] bg-accent px-1.5 py-0.5 rounded w-fit">{value.length} tệp</span>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {images.slice(0, 3).map((img: any, i: number) => (
              <div key={i} className="w-8 h-8 rounded border overflow-hidden shadow-xs">
                <img src={img.fileUrl || img.url} alt="file" className="w-full h-full object-cover" />
              </div>
            ))}
            {images.length > 3 && <div className="text-[9px] opacity-60 flex items-center">+{images.length - 3}</div>}
          </div>
        )}
      </div>
    );
  }

  if (Array.isArray(value)) return <span className="font-medium text-[11px] bg-accent px-1.5 py-0.5 rounded">{value.length} mục</span>;
  
  if (typeof value === 'object') return <span className="italic text-[10px] text-muted-foreground">Object data</span>;

  const strValue = String(value);
  if (strValue.length > 50) {
    return <span className="text-[11px] line-clamp-1 italic text-muted-foreground bg-muted/30 px-1 rounded">"{strValue}"</span>;
  }
  return <span className="font-semibold text-foreground text-[12px]">{strValue}</span>;
};

const DiffContent = ({ differences }: { differences: any }) => {
  if (!differences || Object.keys(differences).length === 0) return null;

  const fieldLabels: any = {
    title: 'Tiêu đề',
    description: 'Mô tả',
    status: 'Trạng thái',
    priority: 'Độ ưu tiên',
    color: 'Màu sắc',
    role: 'Vai trò',
    startDate: 'Thời gian bắt đầu',
    endDate: 'Thời gian kết thúc',
    dueDate: 'Hạn chót',
    assignees: 'Người thực hiện',
    content: 'Nội dung'
  };

  return (
    <div className="mt-2.5 space-y-2 pl-3 border-l-2 border-primary/20">
      {Object.entries(differences).map(([key, diff]: [string, any]) => {
        // Special rendering for assignees added/removed
        if (key === 'assignees' && (diff.added || diff.removed)) {
          return (
            <div key={key} className="space-y-1">
              <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{fieldLabels[key]}:</span>
              {diff.added?.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded flex items-center gap-0.5"><Plus className="h-2.5 w-2.5" /> Thêm:</span>
                  {diff.added.map((u: any) => <span key={u.id} className="text-[11px] font-medium">{u.name}</span>).reduce((prev: any, curr: any) => [prev, ", ", curr])}
                </div>
              )}
              {diff.removed?.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-red-600 bg-red-50 px-1 rounded flex items-center gap-0.5"><Trash2 className="h-2.5 w-2.5" /> Gỡ:</span>
                  {diff.removed.map((u: any) => <span key={u.id} className="text-[11px] font-medium">{u.name}</span>).reduce((prev: any, curr: any) => [prev, ", ", curr])}
                </div>
              )}
            </div>
          );
        }

        return (
          <div key={key} className="flex flex-col gap-1 p-2 rounded-md bg-accent/20 hover:bg-accent/40 transition-colors border border-border/30">
            <span className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">{fieldLabels[key] || key}:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="opacity-60 line-through scale-90 origin-left grayscale-[0.5] decoration-2">
                {formatValue(key, diff.old)}
              </div>
              <div className="flex items-center bg-background rounded-full p-0.5 shadow-sm">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="scale-105 transition-transform drop-shadow-sm">
                {formatValue(key, diff.new)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ActivityItem = ({ activity }: { activity: Activity }) => {
  let detail: any = {};
  try {
    detail = activity.detail ? JSON.parse(activity.detail) : {};
  } catch (e) {}

  const { icon: Icon, color, bg } = getActionStyles(activity.action);

  const renderDescription = () => {
    switch (activity.action) {
      case "COLUMN_CREATED": return (
        <div className="flex flex-col gap-1">
          <span>đã tạo cột mới <span className="font-semibold text-primary">"{detail.title}"</span></span>
          {detail.color && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-3 h-3 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: detail.color }} />
              <span className="text-[10px] text-muted-foreground font-medium">Màu: {detail.color}</span>
            </div>
          )}
        </div>
      );
      case "COLUMN_UPDATED": return `đã cập nhật cột "${detail.title}"`;
      case "COLUMN_DELETED": return (
        <div className="flex flex-col gap-1.5 p-1">
          <span>đã xóa cột <span className="font-semibold text-destructive">"{detail.title || 'một cột'}"</span></span>
          {detail.tasksInColumn && detail.tasksInColumn.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 border-dashed rounded-md p-2 mt-1">
              <div className="text-[10px] uppercase font-bold text-destructive/70 mb-1 flex items-center gap-1">
                <span>⚠️ {detail.tasksRemovedCount} công việc đã bị gỡ theo cột:</span>
              </div>
              <div className="flex flex-col gap-1">
                {detail.tasksInColumn.map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground group">
                    <div className="w-1 h-1 rounded-full bg-destructive/30" />
                    <span className="truncate flex-1 font-medium">{t.title}</span>
                    {t.priority && <span className="text-[9px] opacity-60 uppercase">{t.priority}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
      case "COLUMNS_REORDERED": return (
        <div className="flex flex-col gap-1">
          <span>đã sắp xếp lại thứ tự các cột</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Info className="h-3 w-3 text-blue-400" />
            <span className="text-[10px] text-muted-foreground">Kéo thả để thay đổi vị trí ưu tiên</span>
          </div>
        </div>
      );
      case "TASK_CREATED": return (
        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-foreground">đã thêm công việc mới: <span className="text-primary font-bold">"{detail.title}"</span></span>
          <div className="text-[12px] text-muted-foreground">vào cột <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px]">{detail.columnTitle}</Badge></div>
          <div className="flex flex-wrap gap-1.5 mt-0.5 items-center">
            {detail.color && (
              <div className="w-3.5 h-3.5 rounded-sm border border-black/5 flex items-center justify-center shadow-xs" style={{ backgroundColor: detail.color }}>
                <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              </div>
            )}
            {formatValue('status', detail.status)}
            {formatValue('priority', detail.priority)}
            {detail.creatorName && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 gap-1 border-primary/20 bg-primary/5 text-primary/80"><span className="opacity-60 italic">Bởi:</span> {detail.creatorName}</Badge>}
            {detail.fileCount > 0 && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">{detail.fileCount} tệp đính kèm</Badge>}
            {detail.dueDate && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-orange-100/50 text-orange-700 border-none shrink-0">Hạn: {format(new Date(detail.dueDate), "dd/MM/yyyy")}</Badge>}
          </div>

          {/* Inline Image Previews */}
          {detail.attachments && detail.attachments.some((a: any) => /\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl)) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {detail.attachments
                .filter((a: any) => /\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl))
                .slice(0, 4)
                .map((a: any, i: number) => (
                  <div key={i} className="w-10 h-10 rounded border overflow-hidden shadow-xs relative group-hover:scale-105 transition-transform">
                    <img src={a.fileUrl} alt={a.fileName} className="w-full h-full object-cover" />
                  </div>
                ))
              }
              {detail.attachments.filter((a: any) => /\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl)).length > 4 && (
                <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  +{detail.attachments.filter((a: any) => /\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl)).length - 4}
                </div>
              )}
            </div>
          )}

          {/* Inline File List */}
          {detail.attachments && detail.attachments.some((a: any) => !/\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl)) && (
            <div className="flex flex-col gap-0.5 mt-1 opacity-80">
              {detail.attachments
                .filter((a: any) => !/\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl))
                .slice(0, 2)
                .map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                    <span className="shrink-0 text-[8px]">📄</span>
                    <span className="truncate">{a.fileName}</span>
                  </div>
                ))
              }
            </div>
          )}

          {detail.descriptionSnippet && <p className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded border border-dashed line-clamp-2 mt-1 italic">"{detail.descriptionSnippet}"</p>}
        </div>
      );
      case "TASK_UPDATED": return `đã chỉnh sửa công việc "${detail.taskTitle}"`;
      case "TASK_DELETED": return (
        <div className="flex flex-col gap-1.5 border-l-2 border-red-500/20 pl-2 ml-1">
          <span>đã xóa công việc <span className="font-semibold text-red-500/80 line-through decoration-2">"{detail.taskTitle}"</span> từ cột "{detail.columnTitle || 'một cột'}"</span>
          {(detail.fullSnapshot || detail.status) && (
            <div className="flex flex-wrap gap-1.5 mt-0.5 opacity-60 grayscale-[0.5]">
              {formatValue('status', detail.status || detail.fullSnapshot?.status)}
              {formatValue('priority', detail.priority || detail.fullSnapshot?.priority)}
              {detail.fullSnapshot?.color && (
                <div className="w-3 h-3 rounded-sm border border-black/10" style={{ backgroundColor: detail.fullSnapshot.color }} />
              )}
            </div>
          )}
          {detail.fullSnapshot && (
              <div className="text-[9px] text-muted-foreground bg-accent/30 px-1 py-0.5 rounded w-fit border border-accent">Snapshot saved ✓</div>
          )}
        </div>
      );
      case "TASK_MOVED": return (
        <span>
          đã chuyển công việc <span className="font-semibold text-primary">"{detail.taskTitle}"</span> từ 
          <Badge variant="outline" className="mx-1">{detail.sourceColumnTitle}</Badge> sang 
          <Badge variant="outline" className="mx-1">{detail.destinationColumnTitle}</Badge>
        </span>
      );
      case "FILE_ATTACHED": return (
        <div className="flex flex-col gap-1.5">
          <span>đã đính kèm tệp <span className="font-semibold text-primary">"{detail.fileName}"</span> vào công việc "{detail.taskTitle}"</span>
          {detail.isImage && detail.fileUrl && (
            <div className="w-20 h-20 rounded-md border overflow-hidden mt-1 shadow-sm hover:scale-105 transition-transform cursor-pointer">
              <img src={detail.fileUrl} alt={detail.fileName} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      );
      case "FILE_REMOVED": return (
        <div className="flex flex-col gap-1.5">
          <span>đã gỡ tệp <span className="font-semibold text-destructive">"{detail.fileName}"</span> khỏi công việc "{detail.taskTitle}"</span>
        </div>
      );
      case "COMMENT_CREATED": return (
        <div className="flex flex-col gap-1.5">
          <span>đã bình luận vào công việc <span className="font-semibold text-primary">"{detail.taskTitle}"</span></span>
          {detail.contentSnippet && <div className="text-[11px] italic text-muted-foreground border-l-2 border-primary/20 pl-2 mt-1 bg-accent/30 py-1 pr-1 rounded-r">"{detail.contentSnippet}..."</div>}
        </div>
      );
      case "COMMENT_UPDATED": return (
        <div className="flex flex-col gap-1.5">
          <span>đã chỉnh sửa bình luận trong công việc <span className="font-semibold text-primary">"{detail.taskTitle}"</span></span>
          <DiffContent differences={detail.differences} />
        </div>
      );
      case "COMMENT_DELETED": return (
        <div className="flex flex-col gap-1.5 border-l-2 border-red-500/20 pl-2 ml-1">
          <span>đã xóa bình luận khỏi công việc <span className="font-semibold text-destructive">"{detail.taskTitle}"</span></span>
          {detail.oldContentSnippet && (
            <div className="bg-destructive/10 border border-destructive/20 p-2 mt-1 rounded text-[11px] italic font-medium">"{detail.oldContentSnippet}..."</div>
          )}
        </div>
      );
      case "PROJECT_UPDATED": return (
        <div className="flex flex-col gap-1.5">
          <span>đã thay đổi cài đặt/thông tin chung của Dự án</span>
          <DiffContent differences={detail.differences} />
        </div>
      );
      case "MEMBER_INVITED": return `đã mời ${detail.email} với vai trò ${detail.role}`;
      case "MEMBER_ROLE_UPDATED": return <span>đã đổi vai trò: <Badge className="mx-1">{detail.oldRole}</Badge> <ArrowRight className="inline h-3 w-3 mx-1" /> <Badge className="mx-1">{detail.newRole}</Badge></span>;
      default: return `đã thực hiện hành động ${activity.action}`;
    }
  };

  return (
    <div className="group relative flex gap-4 pb-8 last:pb-0">
      {/* Timeline Line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-muted group-last:hidden" />
      
      {/* Action Icon */}
      <div className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm", bg)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>

      <div className="flex flex-col gap-1.5 pt-0.5">
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5 border shadow-xs">
            <AvatarImage src={activity.userId?.avatarUrl} />
            <AvatarFallback className="text-[8px] bg-primary/5">
              {(activity.userId?.displayName || activity.userId?.email || "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold text-foreground">
            {activity.userId?.displayName || activity.userId?.email?.split("@")[0]}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {format(new Date(activity.createdAt), "HH:mm", { locale: vi })}
          </span>
        </div>

        <div className="text-[13px] text-muted-foreground leading-relaxed">
          {renderDescription()}
        </div>

        {detail.differences && <DiffContent differences={detail.differences} />}
      </div>
    </div>
  );
};

export const ProjectActivitySidebar = ({
  projectId,
  isOpen,
  onClose,
}: ProjectActivitySidebarProps) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", projectId],
    queryFn: () => activityService.getProjectActivities(projectId, 50, 0),
    enabled: isOpen && !!projectId,
  });

  // Group by date
  const groupedActivities = activities?.reduce((groups: any, activity) => {
    const date = format(new Date(activity.createdAt), "dd MMMM, yyyy", { locale: vi });
    if (!groups[date]) groups[date] = [];
    groups[date].push(activity);
    return groups;
  }, {});

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 h-full w-96 bg-background border-l shadow-2xl z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b bg-muted/30 backdrop-blur-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <ActivityIcon className="h-5 w-5 text-primary" />
            </div>
            <span>Dòng thời gian</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium mt-0.5 ml-1">
            Theo dõi mọi thay đổi trong dự án
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full hover:bg-background hover:shadow-sm">
          <X className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
              <span className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải lịch sử...</span>
            </div>
          ) : !activities || activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-16 w-16 bg-muted/40 rounded-full flex items-center justify-center mb-4">
                <Info className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Chưa có hoạt động nào</h3>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
                Mọi hành động của bạn và đồng đội sẽ được ghi lại tại đây.
              </p>
            </div>
          ) : (
            Object.entries(groupedActivities).map(([date, items]: [string, any]) => (
              <div key={date} className="mb-8 last:mb-0">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50 bg-muted/30 px-2 py-0.5 rounded-md">
                    {date}
                  </span>
                  <div className="h-[1px] flex-1 bg-muted/50" />
                </div>
                <div className="pl-1">
                  {items.map((activity: Activity) => (
                    <ActivityItem key={activity._id} activity={activity} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
