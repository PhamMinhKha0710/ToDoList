import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageSquare, MoreVertical, Trash2, Edit2, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { commentService } from "@/services/comment.service";
import type { User } from "@/types/user";
import type { Comment } from "@/types/comment";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCommentsProps {
  taskId: string;
  currentUser: User | null;
  canInteract: boolean;  // From Role (Member/Admin/Owner = true, Viewer = false)
}

export const TaskComments = ({ taskId, currentUser, canInteract }: TaskCommentsProps) => {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(true); // Toggle visibility

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => commentService.getCommentsByTaskId(taskId),
    enabled: !!taskId && isExpanded, // Only fetch if expanded (optional, but good for perf)
  });

  const createMutation = useMutation({
    mutationFn: (content: string) => commentService.createComment({ taskId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      setNewComment("");
      // Gióng scroll về cuối (có thể dùng useRef)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi khi gửi bình luận");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => 
      commentService.updateComment(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      setEditingId(null);
      setEditContent("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi khi sửa bình luận");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => commentService.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      toast.success("Đã xóa bình luận");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi khi xóa bình luận");
    },
  });

  const handleCreate = () => {
    if (!newComment.trim() || !canInteract) return;
    createMutation.mutate(newComment.trim());
  };

  const handleUpdate = (id: string) => {
    if (!editContent.trim()) return;
    updateMutation.mutate({ id, content: editContent.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, isEditing = false, id?: string) => {
    if (e.key === "Enter" && !e.shiftKey) { // Đổi sang Enter để gửi, Shift+Enter để xuống dòng cho giống chat
      e.preventDefault();
      if (isEditing && id) handleUpdate(id);
      else handleCreate();
    }
  };

  const renderComment = (comment: Comment) => {
    const isAuthor = comment.authorId._id === currentUser?._id;
    const canModify = isAuthor;

    // Chế độ Edit
    if (editingId === comment._id) {
      return (
        <div key={comment._id} className={`flex w-full py-3 ${isAuthor ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex gap-3 items-end w-full max-w-[95%] ${isAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className="w-8 h-8 shrink-0 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center relative shadow-sm translate-y-[-2px]">
               {comment.authorId.avatarUrl ? (
                 <img src={comment.authorId.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-[11px] font-bold text-slate-500 uppercase">{comment.authorId.displayName?.charAt(0) || "U"}</span>
               )}
            </div>
            {/* Editor Bubble */}
            <div className={`flex-1 space-y-3 p-4 rounded-2xl border shadow-sm ${isAuthor ? 'bg-indigo-50/80 border-indigo-100 rounded-br-none' : 'bg-slate-50 border-slate-200 rounded-bl-none'}`}>
              <textarea
                className="w-full min-h-[80px] bg-white rounded-xl border border-slate-200 p-3 text-[14px] text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, true, comment._id)}
                autoFocus
              />
              <div className="flex items-center gap-2 justify-end">
                <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500 font-medium" onClick={() => setEditingId(null)}>Hủy</Button>
                <Button size="sm" className="h-7 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={() => handleUpdate(comment._id)} disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                  Lưu
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Chế độ hiển thị (Chat Bubbles)
    return (
      <div key={comment._id} className="w-full flex py-1" style={{ justifyContent: isAuthor ? 'flex-end' : 'flex-start' }}>
        <div className={`flex gap-3 items-end max-w-[85%] group ${isAuthor ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
          
          {/* Avatar (vẫn giữ flex-row-reverse để đảo vị trí) */}
          <div className={`w-8 h-8 shrink-0 rounded-full border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center relative translate-y-[-2px] ${isAuthor ? 'bg-indigo-100/50' : 'bg-slate-100'}`}>
             {comment.authorId.avatarUrl ? (
               <img src={comment.authorId.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               <span className={`text-[11px] font-bold uppercase ${isAuthor ? 'text-indigo-600' : 'text-slate-600'}`}>
                  {comment.authorId.displayName?.charAt(0) || "U"}
               </span>
             )}
          </div>
          
          {/* Content Wrapper */}
          <div className={`flex flex-col ${isAuthor ? 'items-end' : 'items-start'}`}>
            {/* Meta (Tên & Thời gian) */}
            <div className={`flex items-center gap-1.5 mb-1 px-1 opacity-80 ${isAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
               <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                 {isAuthor ? 'Bạn' : comment.authorId.displayName}
               </span>
               <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
               </span>
               {comment.createdAt !== comment.updatedAt && (
                  <span className="text-[9px] text-slate-400" title="Đã sửa">sửa</span>
               )}
            </div>
            
            {/* Bubble Container */}
            <div className={`relative group/bubble flex items-center gap-2 ${isAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Bubble */}
              <div className={`px-4 py-2.5 shadow-sm text-[14px] leading-relaxed break-words whitespace-pre-wrap ${
                isAuthor 
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-br-none border border-indigo-700' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-bl-none'
              }`}>
                {comment.content}
              </div>

              {/* Actions Button */}
              {canModify && (
                <div className={`opacity-0 group-hover/bubble:opacity-100 transition-opacity shrink-0`}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:bg-slate-200/50 rounded-full transition-colors">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isAuthor ? "end" : "start"} className="w-36">
                      <DropdownMenuItem className="cursor-pointer text-xs font-medium" onClick={() => { setEditingId(comment._id); setEditContent(comment.content); }}>
                        <Edit2 className="w-3.5 h-3.5 mr-2" /> Sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-xs font-medium text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => deleteMutation.mutate(comment._id)}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden">
      
      {/* Header / Toggle */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-12 flex items-center justify-between px-4 bg-white hover:bg-slate-50 transition-colors border-b border-slate-200 focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          <h3 className="text-[14px] font-bold text-slate-800">
            Thảo luận {comments.length > 0 && <span className="ml-1 text-[11px] font-bold text-white bg-indigo-500 px-1.5 py-0.5 rounded-full">{comments.length}</span>}
          </h3>
        </div>
        <div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="w-full flex flex-col items-stretch overflow-hidden">
          
          {/* Comment List */}
          <div className="flex-1 max-h-[500px] overflow-y-auto w-full custom-scrollbar p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-10 text-slate-400 font-medium">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải thảo luận...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                   <MessageSquare className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[14px] font-semibold text-slate-600">Chưa có thảo luận nào</p>
                <p className="text-[12px] text-slate-400 mt-1">Hãy là người đầu tiên bắt đầu cuộc trò chuyện!</p>
              </div>
            ) : (
              <div className="w-full flex flex-col space-y-2">
                {comments.map(renderComment)}
              </div>
            )}
          </div>

          {/* Input Area */}
          {canInteract ? (
            <div className="p-4 bg-white border-t border-slate-200 mt-auto">
              <div className="flex gap-3 items-end">
                 <div className="w-9 h-9 shrink-0 rounded-full border border-slate-200 shadow-sm overflow-hidden bg-slate-100 flex items-center justify-center relative">
                   {currentUser?.avatarUrl ? (
                     <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-[12px] font-bold text-slate-500 uppercase">{currentUser?.displayName?.charAt(0) || "U"}</span>
                   )}
                </div>
                <div className="flex-1 relative group bg-slate-50 rounded-2xl border border-slate-200 focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100/50 transition-all flex items-end p-1.5 pl-4 overflow-hidden shadow-sm">
                  <textarea 
                    className="w-full max-h-[150px] min-h-[38px] bg-transparent text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none py-2 placeholder:font-medium leading-relaxed custom-scrollbar"
                    style={{ height: newComment ? "auto" : "38px" }}
                    placeholder="Nhập tin nhắn... (Enter để gửi)"
                    value={newComment}
                    onChange={(e) => {
                       setNewComment(e.target.value);
                       // Auto adjust height roughly
                       e.target.style.height = "auto";
                       e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                    }}
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    disabled={createMutation.isPending}
                  />
                  <Button 
                     size="icon"
                     className="shrink-0 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-300 ml-2"
                     onClick={handleCreate}
                     disabled={!newComment.trim() || createMutation.isPending}
                  >
                     {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                  </Button>
                </div>
              </div>
              <div className="text-right mt-2 pr-1">
                 <span className="text-[10px] font-medium text-slate-400"><strong>Enter</strong> để gửi, <strong>Shift + Enter</strong> xuống dòng</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
              <span className="text-[13px] font-medium text-slate-400">Bạn không có quyền thảo luận trong dự án này.</span>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
