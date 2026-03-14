import { useState, useEffect, useRef } from "react";
import type { Task } from "@/types/task";
import type { UpdateTaskPayload } from "@/schemas/task.schema";
import { taskService } from "@/services/task.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Edit2, Trash2, CheckCircle2, Clock, Flag, User as UserIcon, Palette, MessageSquare, X, Plus, Loader2 } from 'lucide-react';
import { useKanbanStore } from "@/stores/kanban.store";
import { toast } from "sonner";
import { DeleteTaskConfirmModal } from './DeleteTaskConfirmModal';
import { TaskAttachments } from "./TaskAttachments";
import { TaskTags } from "./TaskTags";

interface TaskDetailModalProps {
  task: Task;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#14b8a6', '#84cc16', '#f97316', '#6b7280'];

const priorityLabels: Record<string, string> = {
  urgent: 'Khẩn cấp',
  high: 'Cao',
  normal: 'Thường',
  low: 'Thấp',
};

const statusLabels: Record<string, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
};

import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/user";

export const TaskDetailModal = ({ task, projectId, open, onOpenChange }: TaskDetailModalProps) => {
  const queryClient = useQueryClient();
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);

  const [searchAssignee, setSearchAssignee] = useState("");
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setIsAssigneeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { members: projectMembers } = useKanbanStore();
  const { user: currentUser } = useAuthStore();

  const currentMember = projectMembers.find(
    (m) => (m.userId as User)._id === currentUser?._id
  );
  
  const isProjectManager = currentMember?.role === "owner" || currentMember?.role === "admin";
  const isViewer = currentMember?.role === "viewer";
  const isTaskCreator = task.creatorId === currentUser?._id;
  const isAssignee = task.assigneeIds?.includes(currentUser?._id || "");

  // Quyền chỉnh sửa cấu trúc (Title, Desc, Meta): Manager HOẶC Người tạo ra task HOẶC Người được gán
  const canEditMeta = isProjectManager || isTaskCreator || isAssignee;
  // Quyền xóa: Manager HOẶC Người tạo ra task (Assignee thường không được xóa)
  const canDelete = isProjectManager || isTaskCreator;
  // Quyền vào chế độ Sửa (để upload file, đổi meta nếu có quyền): Mọi thành viên trừ Viewer
  const canEnterEditMode = !isViewer;
  // Quyền tương tác (Comment): Mọi thành viên trừ Viewer
  const canInteract = !isViewer;

  // Initialize edited defaults from props
  useEffect(() => {
    if (task && open) {
      setEditedTask({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        color: task.color,
        dueDate: task.dueDate,
        tags: task.tags || [],
        assignees: (task.assigneeIds || []) as any,
      });
      setIsEditing(false);
      setDeletedAttachmentIds([]);
      
      // Load true attachments from backend
      import('@/services/attachment.service').then(({ attachmentService }) => {
        attachmentService.getTaskAttachments(task._id).then(atts => {
          // Map backend format to UI format
          const mappedAtts = atts.map(a => ({
            ...a,
            name: a.fileName,
            url: a.fileUrl
          }));
          // Also store it inside editedTask.attachments so UI references can read it
          // (though technically separate, UI still expects it there)
          setEditedTask(prev => ({ ...prev, attachments: mappedAtts as any }));
        }).catch(err => {
          console.error("Lỗi khi fetch attachments:", err);
          toast.error("Không thể tải danh sách file đính kèm.");
        });
      });
    }
  }, [task, open]);

  const updateTaskMutation = useMutation({
    mutationFn: (payload: UpdateTaskPayload) => taskService.updateTask(task._id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const { deleteTask: storeDeleteTask } = useKanbanStore();

  const deleteTaskMutation = useMutation({
    mutationFn: () => taskService.deleteTask(task._id),
    onSuccess: () => {
      storeDeleteTask(task.columnId, task._id);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onOpenChange(false);
    },
  });

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleSave = (field: keyof UpdateTaskPayload, value: any) => {
    if (field === 'attachments') {
      // Find what was deleted
      const oldList = editedTask.attachments || [];
      const newList = value;
      // If a file was removed from the list and it has an _id (meaning it's on server), track its ID to delete later
      const removedFiles = oldList.filter((oldNode: any) => oldNode._id && !newList.some((newNode: any) => newNode._id === oldNode._id));
      if (removedFiles.length > 0) {
        setDeletedAttachmentIds(prev => [...prev, ...removedFiles.map((f: any) => f._id)]);
      }
      setEditedTask((prev) => ({ ...prev, attachments: value }));
      return;
    }

    setEditedTask((prev) => ({ ...prev, [field]: value }));
    updateTaskMutation.mutate({ [field]: value });
  };

  const handleFinishEditing = async () => {
    const currentAttachments = editedTask.attachments || [];
    const hasNewFiles = currentAttachments.some((a: any) => a.file);
    const hasDeletedFiles = deletedAttachmentIds.length > 0;

    // If no attachments to process, just toggle off
    if (!hasNewFiles && !hasDeletedFiles) {
      setIsEditing(false);
      return;
    }

    try {
      setIsUploadingFiles(true);
      const { attachmentService } = await import('@/services/attachment.service');

      // 1. Delete removed files
      if (hasDeletedFiles) {
        await Promise.all(
          deletedAttachmentIds.map(id => attachmentService.deleteAttachment(id).catch(err => console.error("Del err", err)))
        );
      }

      // 2. Upload new files
      if (hasNewFiles) {
        await Promise.all(
          currentAttachments.map(async (attachment: any) => {
            if (attachment.file) {
              try {
                await attachmentService.uploadAttachment(task._id, attachment.file);
              } catch (error) {
                console.error("Failed to upload file", attachment.name, error);
                throw new Error(`Lỗi khi tải lên file: ${attachment.name}`);
              }
            }
          })
        );
      }

      // 3. Refetch the updated attachments list
      const freshAtts = await attachmentService.getTaskAttachments(task._id);
      const mappedAtts = freshAtts.map(a => ({
        ...a,
        name: a.fileName,
        url: a.fileUrl
      }));
      setEditedTask((prev) => ({ ...prev, attachments: mappedAtts as any }));
      setDeletedAttachmentIds([]);

      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi xử lý file đính kèm");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleDiscardEditing = () => {
    // Revert everything
    setEditedTask({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      color: task.color,
      dueDate: task.dueDate,
      tags: task.tags || [],
      assignees: (task.assigneeIds || []) as any,
    });
    // Revoke any temporary blob URLs created
    if (currentAttachments) {
      currentAttachments.forEach((a: any) => {
        if (a.file && a.url.startsWith('blob:')) {
            URL.revokeObjectURL(a.url);
        }
      });
    }
    setIsEditing(false);
  };

  const currentStatus = editedTask.status || task.status;
  const currentPriority = editedTask.priority || task.priority;
  const currentColor = editedTask.color || task.color;
  const currentTags = editedTask.tags || task.tags || [];
  const currentAttachments = editedTask.attachments || task.attachments || [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && isEditing) {
        handleDiscardEditing();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className=" [&>button]:hidden max-w-[900px] h-[88vh] p-0 overflow-hidden flex flex-col bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] outline-none border-0 [&>button]:hidden">
        
        {/* Header Section */}
        <div className="flex items-start justify-between px-8 py-6 bg-slate-50/50 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-5 w-full">
            {/* Status Icon Indicator */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-colors ${
              currentStatus === 'done' ? 'bg-green-50 text-green-600 border-green-100' : 
              currentStatus === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
              'bg-white text-slate-400 border-slate-200'
            }`}>
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            
            <div className="flex flex-col gap-2.5 flex-1 min-w-0 pr-4">
              {isEditing ? (
                <input 
                  type="text"
                  value={editedTask.title || ""}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  disabled={!canEditMeta}
                  onBlur={(e) => {
                    if (e.target.value.trim() !== task.title && e.target.value.trim() !== "") {
                      handleSave('title', e.target.value.trim());
                    } else if (e.target.value.trim() === "") {
                      setEditedTask({ ...editedTask, title: task.title });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  className="text-2xl font-black text-slate-800 tracking-tight leading-none bg-white border border-slate-300 focus:border-indigo-400 px-3 py-1.5 focus:ring-4 focus:ring-indigo-50 w-full outline-none rounded-lg transition-all -ml-3"
                />
              ) : (
                <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-0.5">
                  {editedTask.title || task.title}
                </DialogTitle>
              )}
              
              <div className="flex items-center gap-2 mt-1">
                 <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    currentStatus === 'done' ? 'bg-green-50 text-green-700 border-green-200/50' : 
                    currentStatus === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200/50' : 
                    'bg-slate-50 text-slate-600 border-slate-200'
                 }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {statusLabels[currentStatus] || 'Không xác định'}
                 </div>
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold transition-colors">
                    <Flag className={`w-3.5 h-3.5 fill-current transition-colors ${
                      currentPriority === 'urgent' ? 'text-red-500' :
                      currentPriority === 'high' ? 'text-orange-500' :
                      currentPriority === 'normal' ? 'text-blue-500' : 'text-slate-400'
                    }`} />
                    {priorityLabels[currentPriority] || 'Thường'}
                 </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {isEditing && (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleDiscardEditing}
                disabled={isUploadingFiles}
                className="h-10 px-4 font-bold border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                Hủy
              </Button>
            )}
            
            {canEnterEditMode && (
              <Button 
                variant={isEditing ? "default" : "outline"}
                size="sm" 
                onClick={() => isEditing ? handleFinishEditing() : setIsEditing(true)}
                disabled={isUploadingFiles}
                className={`h-10 px-4 font-bold rounded-xl transition-all shadow-sm ${
                  isEditing ? "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50" : "text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {isUploadingFiles ? (
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isEditing ? (
                   <CheckCircle2 className="w-4 h-4 mr-2" /> 
                ) : (
                   <Edit2 className="w-4 h-4 mr-2" />
                )}
                {isUploadingFiles ? "Đang xử lý..." : isEditing ? "Hoàn tất" : "Sửa"}
              </Button>
            )}

            {!isEditing && canDelete && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDelete}
                disabled={deleteTaskMutation.isPending}
                className="h-10 px-4 font-bold text-red-600 border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteTaskMutation.isPending ? "Đang xóa..." : "Xóa"}
              </Button>
            )}
            <DialogClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={isUploadingFiles}
                onClick={() => {
                  if (isEditing) handleDiscardEditing();
                }}
                className="h-10 w-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl ml-1 transition-colors disabled:opacity-50"
              >
                 <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 overflow-hidden relative bg-white">
          
          {/* Main Content (Left Column) */}
          <div className="flex-[2.2] overflow-y-auto px-8 py-8 space-y-10">
            
            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                Mô tả
              </h3>
              {isEditing ? (
                <textarea 
                  value={editedTask.description || ""}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  disabled={!canEditMeta}
                  onBlur={(e) => {
                    if (e.target.value !== (task.description || "")) {
                        handleSave('description', e.target.value);
                    }
                  }}
                  className={`w-full text-[15px] text-slate-700 leading-relaxed bg-white border border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 rounded-xl p-4 transition-all min-h-[120px] resize-none outline-none placeholder:italic placeholder:text-slate-400 ${!canEditMeta ? 'opacity-70 cursor-not-allowed' : ''}`}
                  placeholder={canEditMeta ? "Thêm mô tả chi tiết cho công việc này..." : "Bạn không có quyền sửa mô tả."}
                />
              ) : (
                <div className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {editedTask.description ? (
                    editedTask.description
                  ) : (
                    <span className="text-slate-400 italic bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 block">
                      Chưa có mô tả chi tiết cho công việc này.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <TaskAttachments 
              attachments={currentAttachments as any}
              onChange={(newAttachments) => handleSave('attachments', newAttachments)}
              isEditing={isEditing}
            />
            {/* Comments */}
            <div className="space-y-6 pt-6 border-t border-slate-100 pb-10">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                 <MessageSquare className="w-4 h-4" /> Trao đổi & Bình luận
              </h3>
              
              <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <MessageSquare className="w-8 h-8 text-slate-300 mb-3" />
                <span className="text-sm font-semibold text-slate-400">Chưa có bình luận nào</span>
                <span className="text-xs text-slate-400 mt-1">Hãy là người đầu tiên trao đổi về công việc này</span>
              </div>

              {canInteract ? (
                <div className="flex gap-4 items-start pt-2">
                   <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm border-2 border-white">
                      {currentUser?.displayName?.[0] || currentUser?.email?.[0] || "U"}
                   </div>
                   <div className="flex-1 relative group">
                     <textarea 
                       className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-white p-4 pr-14 text-[15px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all resize-none shadow-sm"
                       placeholder="Viết bình luận hoặc cập nhật tiến độ... (Ctrl+Enter để gửi)"
                     />
                     <button className="absolute bottom-3 right-3 w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors group-focus-within:bg-indigo-50 group-focus-within:text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                     </button>
                   </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">
                  <span className="text-sm text-slate-400 italic">Tính năng bình luận chỉ dành cho thành viên của dự án.</span>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Metadata (Right Column) */}
          <div className="flex-1 min-w-[320px] max-w-[360px] bg-slate-50/80 border-l border-slate-100 overflow-y-auto px-8 py-8 space-y-8">
            
            {/* Status */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Trạng thái</h4>
              {isEditing ? (
                <select 
                  value={currentStatus || ''}
                  disabled={!canEditMeta}
                  onChange={(e) => handleSave('status', e.target.value)}
                  className={`w-full appearance-none outline-none flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-bold shadow-sm hover:border-indigo-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-colors cursor-pointer ${!canEditMeta ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    <option value="todo">Cần làm</option>
                    <option value="in_progress">Đang làm</option>
                    <option value="done">Hoàn thành</option>
                </select>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold shadow-sm w-full">
                   <div className={`w-2 h-2 rounded-full ${
                      currentStatus === 'done' ? 'bg-green-500' : 
                      currentStatus === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'
                   }`} />
                   {statusLabels[currentStatus] || 'Chưa rõ'}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> Độ ưu tiên</h4>
              {isEditing ? (
                <select 
                  value={currentPriority || ''}
                  disabled={!canEditMeta}
                  onChange={(e) => handleSave('priority', e.target.value)}
                  className={`w-full appearance-none outline-none flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-bold shadow-sm hover:border-indigo-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-colors cursor-pointer ${!canEditMeta ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    <option value="urgent">Khẩn cấp</option>
                    <option value="high">Cao</option>
                    <option value="normal">Thường</option>
                    <option value="low">Thấp</option>
                </select>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold shadow-sm w-full">
                   <Flag className={`w-4 h-4 fill-current ${
                      currentPriority === 'urgent' ? 'text-red-500' :
                      currentPriority === 'high' ? 'text-orange-500' :
                      currentPriority === 'normal' ? 'text-blue-500' : 'text-slate-400'
                   }`} />
                   {priorityLabels[currentPriority] || 'Thường'}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Hạn chót</h4>
              {isEditing ? (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 shadow-sm w-full relative transition-all">
                  <input 
                    type="date"
                    disabled={!canEditMeta}
                    value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const newDate = e.target.value ? new Date(e.target.value).toISOString() : null;
                      handleSave('dueDate', newDate);
                    }}
                    className={`w-full text-[14px] font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 focus:outline-none cursor-pointer ${!canEditMeta ? 'cursor-not-allowed' : ''}`}
                  />
                  {editedTask.dueDate && canEditMeta && (
                    <button 
                      onClick={() => handleSave('dueDate', null)}
                      className="absolute right-3 text-slate-400 hover:text-red-500 transition-colors bg-white flex items-center justify-center"
                      title="Xóa ngày"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm w-full">
                  {editedTask.dueDate ? (
                    <span className="text-[14px] font-bold text-slate-700">
                      {new Date(editedTask.dueDate).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-[14px] font-medium text-slate-400 italic">Không có hạn chót</span>
                  )}
                </div>
              )}
            </div>

            {/* Assignee */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" /> Người thực hiện</h4>
              <div className="flex flex-wrap gap-2">
                {(editedTask.assignees as unknown as string[])?.map((assigneeId) => {
                  const member = projectMembers.find((m: any) => (m.userId as any)._id === assigneeId)?.userId as any;
                  if (!member) return null;
                  return (
                    <div key={assigneeId as string} className="flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm px-2 py-1 rounded-full text-xs font-bold text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                        {member.avatarUrl ? <img src={member.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <UserIcon className="w-3 h-3 text-slate-500"/>}
                      </div>
                      <span className="truncate max-w-[100px]">{member.displayName || member.email}</span>
                      {isEditing && (
                        <button type="button" onClick={() => handleSave('assignees', (editedTask.assignees as unknown as string[])?.filter((id) => id !== assigneeId))} className="text-slate-400 hover:text-red-500 ml-0.5">
                          <X className="w-3 h-3"/>
                        </button>
                      )}
                    </div>
                  );
                })}
                {(!editedTask.assignees || (editedTask.assignees as unknown as string[]).length === 0) && !isEditing && (
                  <span className="text-sm font-medium text-slate-400 italic">Chưa giao việc</span>
                )}
                
                {isEditing && canEditMeta && (
                  <div className="relative ml-auto" ref={assigneeRef}>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 px-2 text-slate-500 hover:bg-slate-50 text-xs gap-1 border border-dashed border-slate-300 flex items-center justify-center font-bold"
                      onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm người
                    </Button>

                    {isAssigneeOpen && (
                      <div className="absolute top-full mt-1.5 right-0 w-[240px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in-0 slide-in-from-top-2">
                        <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                           <input 
                             placeholder="Tìm kiếm thành viên..." 
                             value={searchAssignee}
                             onChange={(e) => setSearchAssignee(e.target.value)}
                             className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                             autoFocus
                           />
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
                          {(() => {
                            const currentAssignees = (editedTask.assignees as unknown as string[]) || [];
                            const filtered = projectMembers.filter((m: any) => {
                              const member = m.userId;
                              if (currentAssignees.includes(member._id)) return false;
                              const term = searchAssignee.toLowerCase();
                              return (member.displayName || "").toLowerCase().includes(term) || (member.email || "").toLowerCase().includes(term);
                            });

                            if (filtered.length === 0) {
                              return <div className="p-4 text-[13px] text-slate-500 text-center italic">Không tìm thấy thành viên</div>;
                            }

                            return filtered.map((memberWrap: any) => {
                              const member = memberWrap.userId;
                              return (
                                <div 
                                  key={member._id}
                                  className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                  onClick={() => {
                                    handleSave('assignees', [...currentAssignees, member._id]);
                                    setSearchAssignee("");
                                  }}
                                >
                                  <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0 border border-slate-300/50">
                                    {member.avatarUrl ? <img src={member.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <UserIcon className="w-3.5 h-3.5 text-slate-400"/>}
                                  </div>
                                  <div className="flex flex-col text-left overflow-hidden">
                                    <span className="text-[13px] font-bold text-slate-700 truncate">{member.displayName || member.email.split('@')[0]}</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Color Tag */}
            <div className="space-y-3.5 pt-2">
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Màu thẻ nhận diện</h4>
              
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                {isEditing && canEditMeta && (
                  <div className="flex flex-wrap gap-2.5 mb-5">
                    {PRESET_COLORS.map((c, i) => (
                      <div 
                        key={`${c}-${i}`}
                        onClick={() => handleSave('color', c)}
                        className={`w-8 h-8 rounded-xl cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md ${currentColor === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110 shadow-sm' : 'border border-black/10'}`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                    <div className="relative w-8 h-8 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition-all text-slate-400 hover:text-slate-600 outline-none" title="Màu tự chọn">
                      <input 
                        type="color" 
                        value={currentColor || '#ec4899'}
                        onChange={(e) => handleSave('color', e.target.value)}
                        className="absolute inset-[-5px] w-12 h-12 cursor-pointer opacity-0 z-10"
                      />
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                )}
                <div className={`flex items-center gap-3 ${isEditing ? 'pt-3 border-t border-slate-100' : ''}`}>
                  {isEditing && <span className="text-[13px] font-bold text-slate-500">Mã màu:</span>}
                  <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-4 h-4 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: currentColor || '#ec4899' }} />
                    <span className="text-xs font-mono font-semibold text-slate-600 uppercase">{currentColor || '#ec4899'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags List */}
            <TaskTags 
              tags={currentTags as any}
              isEditing={isEditing && canEditMeta}
              onTagsChange={(newTags) => handleSave('tags', newTags)}
            />
            
          </div>
        </div>
      </DialogContent>

      <DeleteTaskConfirmModal
        taskTitle={task.title}
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={() => deleteTaskMutation.mutate()}
        isPending={deleteTaskMutation.isPending}
      />
    </Dialog>
  );
};
