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
import type { Task } from "@/types/task";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'urgent': return { icon: Flame, text: 'KHẨN CẤP', classes: 'text-red-600 bg-red-50' };
    case 'high': return { icon: Flame, text: 'CAO', classes: 'text-orange-600 bg-orange-50' };
    case 'normal': return { icon: Gauge, text: 'THƯỜNG', classes: 'text-emerald-600 bg-emerald-50' };
    case 'low': return { icon: ArrowDown, text: 'THẤP', classes: 'text-slate-600 bg-slate-50' };
    default: return { icon: Gauge, text: 'THƯỜNG', classes: 'text-blue-600 bg-blue-50' };
  }
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "done":
      return {
        icon: CheckCircle2,
        classes: "bg-green-100/80 text-green-700",
        label: "Done",
      };
    case "in_progress":
      return {
        icon: Clock4,
        classes: "bg-blue-100/80 text-blue-700",
        label: "In Progress",
      };
    default:
      return {
        icon: Circle,
        classes: "bg-slate-100/80 text-slate-600",
        label: "To Do",
      };
  }
};

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const hasTags = task.tags && task.tags.length > 0;

  // Dummy comment metadata - backend will provide this later
  const commentCount = 0;

  // Image Grid logic
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
  const StatusIcon = sConfig.icon;

  const isOverdue =
    task.dueDate && dayjs(task.dueDate).isBefore(dayjs().startOf("day"));

  // Determine card background style
  const cardStyle = task.color
    ? { backgroundColor: task.color }
    : { backgroundColor: "#ffffff" };

  // DnD sortable
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
      className={`p-4 rounded-2xl shadow-sm border transition-all cursor-pointer group flex flex-col relative overflow-hidden
        ${isDragging 
          ? "opacity-30 border-dashed border-primary/50 grayscale-[0.5]" 
          : "hover:shadow-md hover:border-primary/40 border-slate-200"
        }
      `}
    >
      {/* Header Side-by-Side */}
      <div className="flex gap-2 items-start">
        {/* Container for Side-by-Side Top Section */}
        <div className="flex justify-between gap-4 flex-1" onClick={() => onClick(task)}>
        {/* Left Side: Title, Date, Description */}
        <div className="flex-1 flex flex-col gap-2">
          <h4 className="text-[16px] font-bold text-slate-800 leading-tight break-words">
            {task.title}
          </h4>

          {task.dueDate && (
            <div
              className={`flex items-center gap-1.5 text-[14px] font-medium ${
                isOverdue ? "text-red-600" : "text-slate-500"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Hạn: {dayjs(task.dueDate).format("DD/MM/YYYY")}</span>
            </div>
          )}

          {task.description && (
            <p className="text-[13px] text-slate-610 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
          {/* Status Label */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold tracking-wide shadow-sm border border-black/5 ${sConfig.classes}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{sConfig.label}</span>
          </div>

          {/* Priority Label */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm border border-black/5 ${pConfig.classes}`}
          >
            <PriorityIcon className="w-3.5 h-3.5" />
            <span>{pConfig.text}</span>
          </div>
        </div>
        </div>{/* End flex justify-between (side-by-side) */}
      </div>{/* End flex gap-2 (drag-handle + content) */}

      {/* Tags (Below the side-by-side header) */}
      {hasTags && (
        <div className="flex flex-wrap gap-2 mt-3">
          {task.tags!.map((tag) => (
            <div
              key={tag.name}
              className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm"
              style={{ backgroundColor: tag.color || "#8b5cf6" }}
            >
              <TagIcon className="w-2.5 h-2.5" />
              {tag.name}
            </div>
          ))}
        </div>
      )}

      {/* Image Grid */}
      {hasImages && (
        <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm">
          {imageCount === 1 && (
            <img
              src={imageAttachments[0].fileUrl}
              alt="attachment"
              className="w-full h-40 object-cover"
            />
          )}
          {imageCount === 2 && (
            <div className="grid grid-cols-2 gap-[2px]">
              <img
                src={imageAttachments[0].fileUrl}
                alt="attachment 1"
                className="w-full h-32 object-cover"
              />
              <img
                src={imageAttachments[1].fileUrl}
                alt="attachment 2"
                className="w-full h-32 object-cover"
              />
            </div>
          )}
          {imageCount === 3 && (
            <div className="grid grid-cols-2 gap-[2px]">
              <img
                src={imageAttachments[0].fileUrl}
                alt="attachment 1"
                className="w-full h-[178px] object-cover row-span-2"
              />
              <div className="grid grid-rows-2 gap-[2px]">
                <img
                  src={imageAttachments[1].fileUrl}
                  alt="attachment 2"
                  className="w-full h-[88px] object-cover"
                />
                <img
                  src={imageAttachments[2].fileUrl}
                  alt="attachment 3"
                  className="w-full h-[88px] object-cover"
                />
              </div>
            </div>
          )}
          {imageCount >= 4 && (
            <div className="grid grid-cols-2 gap-[2px]">
              <img
                src={imageAttachments[0].fileUrl}
                alt="attachment 1"
                className="w-full h-28 object-cover"
              />
              <img
                src={imageAttachments[1].fileUrl}
                alt="attachment 2"
                className="w-full h-28 object-cover"
              />
              <img
                src={imageAttachments[2].fileUrl}
                alt="attachment 3"
                className="w-full h-28 object-cover"
              />
              <div className="relative w-full h-28">
                <img
                  src={imageAttachments[3].fileUrl}
                  alt="attachment 4"
                  className="w-full h-full object-cover"
                />
                {imageCount > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="text-white text-xl font-bold">
                      +{imageCount - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer: Assignees & Counters */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/50">
        {/* Assignees (Left side) */}
        <div className="flex items-center gap-2">
          {assignees.length > 0 ? (
            <div className="flex -space-x-2">
              {assignees.slice(0, 4).map((assignee, index) => (
                <div
                  key={assignee._id || index}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shadow-sm border-[1.5px] border-white overflow-hidden z-10 relative"
                  title={assignee.displayName || assignee.email || "User"}
                >
                  {assignee.avatarUrl ? (
                    <img
                      src={assignee.avatarUrl}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                      {(assignee.displayName || assignee.email || "U")[0]}
                    </span>
                  )}
                </div>
              ))}
              {assignees.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shadow-sm border-[1.5px] border-white z-0 relative">
                  <span className="text-[10px] font-bold text-slate-600">
                    +{assignees.length - 4}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div
              className="w-7 h-7 rounded-full bg-white border border-dashed border-slate-300 flex items-center justify-center shadow-sm"
              title="Chưa phân công"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
            </div>
          )}
        </div>

        {/* Counters (Right side) */}
        <div className="flex items-center gap-3">
          {imageCount > 0 && (
            <div
              className="flex items-center gap-1 text-blue-500"
              title="Ảnh đính kèm"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-[12px] font-bold">{imageCount}</span>
            </div>
          )}
          {fileAttachments.length > 0 && (
            <div
              className="flex items-center gap-1 text-amber-500"
              title="Tệp đính kèm khác"
            >
              <FileText className="w-4 h-4" />
              <span className="text-[12px] font-bold">
                {fileAttachments.length}
              </span>
            </div>
          )}
          {commentCount > 0 && (
            <div
              className="flex items-center gap-1 text-slate-500"
              title="Bình luận"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-[12px] font-bold">{commentCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
