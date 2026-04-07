import {
  MessageSquare,
  User,
  Tag as TagIcon,
  CheckCircle2,
  Circle,
  Clock4,
  Image as ImageIcon,
  FileText,
  Flame,
  Gauge,
  ArrowDown,
  CalendarDays,
} from "lucide-react";
import dayjs from "dayjs";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { Task } from "@/types/task";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return {
        icon: Flame,
        text: 'KHẨN CẤP',
        classes: 'text-red-600 bg-red-50/40 border border-red-200 dark:bg-red-950/20 dark:border-red-800'
      };

    case 'high':
      return {
        icon: Flame,
        text: 'CAO',
        classes: 'text-orange-600 bg-orange-50/40 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
      };

    case 'normal':
      return {
        icon: Gauge,
        text: 'BÌNH THƯỜNG',
        classes: 'text-emerald-600 bg-emerald-50/40 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
      };

    case 'low':
      return {
        icon: ArrowDown,
        text: 'THẤP',
        classes: 'text-muted-foreground bg-muted/40 border border-border'
      };

    default:
      return {
        icon: Gauge,
        text: 'BÌNH THƯỜNG',
        classes: 'text-blue-600 bg-blue-50/40 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
      };
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "done":
      return {
        icon: CheckCircle2,
        classes: "bg-emerald-500/10 text-emerald-600",
        dotClass: "bg-emerald-500",
        label: "Hoàn thành",
      };
    case "in_progress":
      return {
        icon: Clock4,
        classes: "bg-sky-500/10 text-sky-600",
        dotClass: "bg-sky-500",
        label: "Đang làm",
      };
    default:
      return {
        icon: Circle,
        classes: "bg-muted text-muted-foreground",
        dotClass: "bg-muted-foreground/30",
        label: "Cần làm",
      };
  }
};

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const hasTags = task.tags && task.tags.length > 0;
  const commentCount = 0; // TBD: connect to backend

  const attachments = task.attachments || [];
  const imageAttachments = attachments.filter(
    (a) =>
      a.fileUrl.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) ||
      a.fileName.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i),
  );
  const fileAttachments = attachments.filter(
    (a) => !imageAttachments.includes(a),
  );

  const hasImages = imageAttachments.length > 0;
  const imageCount = imageAttachments.length;
  const assignees = task.assignees || [];

  const pConfig = getPriorityConfig(task.priority);
  const sConfig = getStatusConfig(task.status);
  const PriorityIcon = pConfig.icon;

  const isOverdue =
    task.dueDate && dayjs(task.dueDate).isBefore(dayjs().startOf("day"));

  const cardStyle = task.color
    ? { backgroundColor: task.color, opacity: 0.9 }
    : {};

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: { type: "task", task, columnId: task.columnId },
  });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ ...cardStyle, ...dndStyle }}
      className={`p-4 rounded-2xl shadow-sm border transition-all cursor-pointer group flex flex-col relative overflow-hidden bg-card
        ${isDragging 
          ? "opacity-30 border-dashed border-primary/50 grayscale-[0.5]" 
          : "hover:shadow-md hover:border-primary/40 border-border"
        }
      `}
    >
      {/* 1. Header (Social Style: Avatar + Name + Time + Status Dot) */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {assignees.length > 0 ? (
            <div className="flex -space-x-1.5 shrink-0">
              {assignees.slice(0, 2).map((assignee, idx) => (
                <div key={assignee._id || idx} className="w-6 h-6 rounded-full overflow-hidden border-2 border-card shadow-sm bg-muted z-10 relative">
                  {assignee.avatarUrl ? (
                    <img src={assignee.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted-foreground uppercase">
                      {(assignee.displayName || assignee.email || "U")[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-dashed border-border bg-muted flex items-center justify-center">
              <User className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex flex-col min-w-0">
            <span className="text-[12px] font-bold text-foreground truncate">
              {assignees.length > 0 ? (assignees[0].displayName || assignees[0].email) : "Chưa phân công"}
              {assignees.length > 1 && ` +${assignees.length - 1}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-medium text-muted-foreground">
            {formatDistanceToNow(new Date(task.updatedAt || task.createdAt || new Date()), { addSuffix: true, locale: vi })}
          </span>
          <div className={`w-2 h-2 rounded-full ${sConfig.dotClass}`} title={sConfig.label} />
        </div>
      </div>

      {/* 2. Body (Title + Description) */}
      <div className="flex flex-col gap-1.5 mb-3" onClick={() => onClick(task)}>
        <h4 className="text-[15px] font-bold text-foreground leading-snug break-words">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* 3. Media Grid */}
      {hasImages && (
        <div className="mb-3 rounded-xl border border-border overflow-hidden bg-muted shadow-sm" onClick={() => onClick(task)}>
          {imageCount === 1 && (
            <img src={imageAttachments[0].fileUrl} alt="attachment" className="w-full h-40 object-cover" />
          )}
          {imageCount === 2 && (
            <div className="grid grid-cols-2 gap-[2px]">
              <img src={imageAttachments[0].fileUrl} alt="attachment 1" className="w-full h-32 object-cover" />
              <img src={imageAttachments[1].fileUrl} alt="attachment 2" className="w-full h-32 object-cover" />
            </div>
          )}
          {imageCount === 3 && (
            <div className="grid grid-cols-2 gap-[2px]">
              <img src={imageAttachments[0].fileUrl} alt="attachment 1" className="w-full h-[178px] object-cover row-span-2" />
              <div className="grid grid-rows-2 gap-[2px]">
                <img src={imageAttachments[1].fileUrl} alt="attachment 2" className="w-full h-[88px] object-cover" />
                <img src={imageAttachments[2].fileUrl} alt="attachment 3" className="w-full h-[88px] object-cover" />
              </div>
            </div>
          )}
          {imageCount >= 4 && (
            <div className="grid grid-cols-2 gap-[2px]">
              <img src={imageAttachments[0].fileUrl} alt="attachment 1" className="w-full h-28 object-cover" />
              <img src={imageAttachments[1].fileUrl} alt="attachment 2" className="w-full h-28 object-cover" />
              <img src={imageAttachments[2].fileUrl} alt="attachment 3" className="w-full h-28 object-cover" />
              <div className="relative w-full h-28">
                <img src={imageAttachments[3].fileUrl} alt="attachment 4" className="w-full h-full object-cover" />
                {imageCount > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="text-white text-xl font-bold">+{imageCount - 3}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Footer (Micro-chips) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border" onClick={() => onClick(task)}>
        
        {/* Priority Chip */}
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm ${pConfig.classes}`}>
          <PriorityIcon className="w-3 h-3" />
          {pConfig.text}
        </div>

        {/* Due Date Chip */}
        {task.dueDate && (
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm ${isOverdue ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-card border border-border text-muted-foreground'}`}>
            <CalendarDays className="w-3 h-3" />
            {dayjs(task.dueDate).format("DD/MM")}
          </div>
        )}

        {/* Tag Chips */}
        {hasTags && task.tags!.slice(0, 1).map(tag => (
          <div key={tag.name} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: tag.color || "#8b5cf6" }}>
            <TagIcon className="w-2.5 h-2.5" />
            <span className="max-w-[60px] truncate">{tag.name}</span>
          </div>
        ))}
        {hasTags && task.tags!.length > 1 && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground shadow-sm border border-border">
            +{task.tags!.length - 1}
          </div>
        )}

        {/* Counters Box */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {imageCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors" title="Ảnh đính kèm">
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">{imageCount}</span>
            </div>
          )}
          {fileAttachments.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-amber-500 transition-colors" title="Tệp đính kèm khác">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">{fileAttachments.length}</span>
            </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors" title="Bình luận">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">{commentCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
