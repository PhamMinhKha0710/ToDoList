import type { Task } from "@/types/task";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Paperclip, CheckCircle2, Clock, Flag, User, Palette, Tag, UploadCloud, MessageSquare, X, Plus } from 'lucide-react';

interface TaskDetailModalProps {
  task: Task;
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

export const TaskDetailModal = ({ task, open, onOpenChange }: TaskDetailModalProps) => {
  const hasImages = false; 

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] h-[88vh] p-0 overflow-hidden flex flex-col bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] outline-none border-0">
        
        {/* Header Section */}
        <div className="flex items-start justify-between px-8 py-6 bg-slate-50/50 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-5">
            {/* Status Icon Indicator */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
              task.status === 'done' ? 'bg-green-50 text-green-600 border-green-100' : 
              task.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
              'bg-white text-slate-400 border-slate-200'
            }`}>
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            
            <div className="flex flex-col gap-2.5">
              <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-0.5">
                {task.title}
              </DialogTitle>
              
              <div className="flex items-center gap-2">
                 <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    task.status === 'done' ? 'bg-green-50 text-green-700 border-green-200/50' : 
                    task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200/50' : 
                    'bg-slate-50 text-slate-600 border-slate-200'
                 }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {statusLabels[task.status] || 'Không xác định'}
                 </div>
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold">
                    <Flag className={`w-3.5 h-3.5 fill-current ${
                      task.priority === 'urgent' ? 'text-red-500' :
                      task.priority === 'high' ? 'text-orange-500' :
                      task.priority === 'normal' ? 'text-blue-500' : 'text-slate-400'
                    }`} />
                    {priorityLabels[task.priority] || 'Thường'}
                 </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-10 px-4 font-bold text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors shadow-sm">
              <Edit2 className="w-4 h-4 mr-2" />
              Sửa
            </Button>
            <Button variant="outline" size="sm" className="h-10 px-4 font-bold text-red-600 border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors shadow-sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-10 w-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl ml-1 transition-colors">
               <X className="w-5 h-5" />
            </Button>
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
              {task.description ? (
                <div className="text-[15px] text-slate-700 leading-relaxed">
                  {task.description}
                </div>
              ) : (
                <div className="text-[15px] text-slate-400 italic bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
                  Chưa có mô tả chi tiết cho công việc này.
                </div>
              )}
            </div>

             {/* Attachments Upload Zone */}
             <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> Tệp đính kèm
              </h3>
              <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all duration-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer group">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:text-indigo-500 group-hover:shadow-md transition-all duration-300">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-[15px] text-slate-500 font-medium">Kéo thả file vào đây hoặc <span className="text-indigo-600 font-bold">duyệt qua máy tính</span></p>
                <p className="text-xs text-slate-400 mt-1">Hỗ trợ PDF, PNG, JPG, DOCX (Tối đa 10MB)</p>
              </div>
            </div>

            {hasImages && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    Hình ảnh đính kèm
                  </h3>
                </div>
              </div>
            )}
            
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

              <div className="flex gap-4 items-start pt-2">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm border-2 border-white">
                    U
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
            </div>

          </div>

          {/* Sidebar Metadata (Right Column) */}
          <div className="flex-1 min-w-[320px] max-w-[360px] bg-slate-50/80 border-l border-slate-100 overflow-y-auto px-8 py-8 space-y-8">
            
            {/* Status */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Trạng thái</h4>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-sm font-bold shadow-sm w-full">
                 <div className={`w-2 h-2 rounded-full ${
                    task.status === 'done' ? 'bg-green-500' : 
                    task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'
                 }`} />
                 {statusLabels[task.status] || 'Chưa rõ'}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> Độ ưu tiên</h4>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-sm font-bold shadow-sm w-full">
                 <Flag className={`w-4 h-4 fill-current ${
                    task.priority === 'urgent' ? 'text-red-500' :
                    task.priority === 'high' ? 'text-orange-500' :
                    task.priority === 'normal' ? 'text-blue-500' : 'text-slate-400'
                 }`} />
                 {priorityLabels[task.priority] || 'Thường'}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Hạn chót</h4>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm w-full">
                {task.dueDate ? (
                  <span className="text-[14px] font-bold text-slate-700">
                    {new Date(task.dueDate).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                ) : (
                  <span className="text-[14px] font-medium text-slate-400 italic">Không có hạn chót</span>
                )}
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Người phụ trách</h4>
              <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors w-full cursor-pointer group">
                <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 group-hover:border-indigo-200 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[14px] font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">Chọn người phụ trách</span>
              </div>
            </div>

            {/* Color Tag */}
            <div className="space-y-3.5 pt-2">
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Màu thẻ nhận diện</h4>
              
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap gap-2.5 mb-5">
                  {PRESET_COLORS.map((c, i) => (
                     <div 
                     key={`${c}-${i}`}
                     className={`w-8 h-8 rounded-xl cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md ${task.color === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110 shadow-sm' : 'border border-black/10'}`}
                     style={{ backgroundColor: c }}
                     title={c}
                   />
                  ))}
                  <div className="w-8 h-8 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition-all text-slate-400 hover:text-slate-600">
                     <Plus className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <span className="text-[13px] font-bold text-slate-500">Mã màu:</span>
                  <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-4 h-4 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: task.color || '#ec4899' }} />
                    <span className="text-xs font-mono font-semibold text-slate-600 uppercase">{task.color || '#ec4899'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags List */}
            <div className="space-y-3.5 pt-2">
              <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Phân loại (Tags)</h4>
              <div className="flex flex-wrap gap-2">
                 {task.tags?.map(tag => (
                   <div key={tag.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700 text-[13px] font-bold">
                     {tag.name}
                     <button className="text-slate-400 hover:text-red-500 transition-colors ml-1">
                       <X className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 ))}
                 <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 bg-transparent text-slate-500 text-[13px] font-bold hover:bg-slate-100 hover:text-slate-800 transition-colors">
                   <Plus className="w-4 h-4" /> Thêm Tag
                 </button>
              </div>
            </div>
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
