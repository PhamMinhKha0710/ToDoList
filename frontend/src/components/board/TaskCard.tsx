import { Flag, Clock, MessageSquare, Paperclip, User } from "lucide-react";
import type { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

const priorityColors: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  normal: '#3b82f6',
  low: '#6b7280',
};

const priorityLabels: Record<string, string> = {
  urgent: 'KHẨN CẤP',
  high: 'CAO',
  normal: 'THƯỜNG',
  low: 'THẤP',
};

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const borderColor = priorityColors[task.priority] || '#3b82f6';
  
  // Conditionally render tags
  const hasTags = task.tags && task.tags.length > 0;
  
  // Later, if backend supports attachments/comments, use these:
  const commentCount = 0; 
  const attachmentCount = 0;
  
  // We only show footer if there is a due date, assignees, tags, or count > 0
  const hasFooter = task.dueDate || (task.assignees && task.assignees.length > 0) || commentCount > 0 || attachmentCount > 0;

  return (
    <div 
      onClick={() => onClick(task)}
      className="rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col bg-white"
      style={{ 
        backgroundColor: task.color || '#ffffff',
        borderLeft: `5px solid ${borderColor}`
      }}
    >
      <div className="p-3.5 flex flex-col gap-3">
        {/* Header: Priority & Status Icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/5 text-black/70">
            <Flag className="h-3 w-3 fill-current" />
            <span className="text-[10px] font-bold uppercase tracking-wide">{priorityLabels[task.priority]}</span>
          </div>
          {task.status === 'done' ? (
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
          ) : task.status === 'in_progress' ? (
             <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className="text-[15px] font-semibold text-slate-800 leading-snug line-clamp-3">
          {task.title}
        </h4>
        
        {/* Tags */}
        {hasTags && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {task.tags!.slice(0, task.tags!.length > 4 ? 3 : task.tags!.length).map(tag => (
              <div key={tag.name} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-slate-200 shadow-sm text-[11px] font-bold text-slate-600 bg-white">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color || '#ec4899' }} />
                {tag.name}
              </div>
            ))}
            {task.tags!.length > 4 && (
              <div className="flex items-center px-2 py-0.5 rounded-md border border-slate-200 shadow-sm text-[11px] font-bold text-slate-500 bg-slate-50">
                +{task.tags!.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Date & User */}
      {hasFooter && (
        <div className="px-3.5 py-2.5 border-t border-black/5 bg-black/[0.02] flex items-center justify-between mt-auto">
          
          <div className="flex items-center gap-3">
            {/* Due Date */}
            {task.dueDate && (() => {
               const isOverdue = new Date(task.dueDate!).getTime() < new Date().setHours(0, 0, 0, 0);
               return (
                 <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md transition-colors ${
                   isOverdue ? 'text-red-500 bg-red-50' : 'text-emerald-600 bg-emerald-50'
                 }`}>
                   <Clock className="w-3.5 h-3.5" />
                   {new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                 </div>
               );
            })()}
            
            {/* Attachments / Comments (Hidden if 0) */}
            <div className="flex items-center gap-2.5 text-slate-400">
               {attachmentCount > 0 && (
                 <div className="flex items-center gap-1">
                   <Paperclip className="w-3.5 h-3.5" />
                   <span className="text-[11px] font-bold">{attachmentCount}</span>
                 </div>
               )}
               {commentCount > 0 && (
                 <div className="flex items-center gap-1">
                   <MessageSquare className="w-3.5 h-3.5" />
                   <span className="text-[11px] font-bold">{commentCount}</span>
                 </div>
               )}
            </div>
          </div>
          
          {/* Assignees */}
          <div className="flex items-center justify-end flex-wrap">
            {task.assignees && task.assignees.length > 0 ? (
              <div className="flex -space-x-2 overflow-hidden">
                {task.assignees.slice(0, 3).map((assignee, index) => (
                  <div key={assignee._id || index} className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shadow-sm border-2 border-white overflow-hidden ring-1 ring-black/5" title={assignee.displayName || assignee.email || 'User'}>
                    {assignee.avatarUrl ? (
                       <img src={assignee.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                       <span className="text-[10px] font-extrabold text-slate-500 uppercase">{(assignee.displayName || assignee.email || 'U')[0]}</span>
                    )}
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shadow-sm border-2 border-white ring-1 ring-black/5 z-0">
                    <span className="text-[9px] font-bold text-slate-600">+{task.assignees.length - 3}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center ring-1 ring-black/5" title="Chưa phân công">
                 <User className="w-3 h-3 text-slate-400" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
