import React, { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit2,
  Loader2,
  Send,
  ChevronDown,
  ChevronUp,
  Reply,
  X,
  AtSign,
} from "lucide-react";
import { useKanbanStore } from "@/stores/kanban.store";
import { toast } from "sonner";
import { commentService } from "@/services/comment.service";
import type { User } from "@/types/user";
import type { Comment } from "@/types/comment";
import { type AppAxiosError, getErrorMessage } from "@/types/error";
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
  canInteract: boolean;
}

const MAX_REPLY_DEPTH = 4;

type CommentNode = Comment & { children: CommentNode[]; depth: number };

export const TaskComments = ({
  taskId,
  currentUser,
  canInteract,
}: TaskCommentsProps) => {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const { members: projectMembers } = useKanbanStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(
    new Set(),
  );
  const [expandedContentIds, setExpandedContentIds] = useState<Set<string>>(
    new Set(),
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const CHAR_LIMIT = 200;

  const toggleReplies = (commentId: string) => {
    setExpandedReplyIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const toggleContent = (commentId: string) => {
    setExpandedContentIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => commentService.getCommentsByTaskId(taskId),
    enabled: !!taskId && isExpanded,
  });

  const commentTree = useMemo(() => {
    const map = new Map<string, CommentNode>();
    const roots: CommentNode[] = [];

    // Init map
    comments.forEach((c) => map.set(c._id, { ...c, children: [], depth: 0 }));

    // Build tree
    comments.forEach((c) => {
      const node = map.get(c._id)!;
      if (c.parentId && map.has(c.parentId)) {
        const parent = map.get(c.parentId)!;
        node.depth = parent.depth + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [comments]);

  const createMutation = useMutation({
    mutationFn: (content: string) =>
      commentService.createComment({
        taskId,
        content,
        parentId: replyingTo?.id || null,
        mentions: mentions.length > 0 ? mentions : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      if (replyingTo) {
        setExpandedReplyIds((prev) => new Set(prev).add(replyingTo.id));
      }
      setNewComment("");
      setReplyingTo(null);
      setMentions([]);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Lỗi khi gửi bình luận");
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
    onError: (error: AppAxiosError) => {
      toast.error(getErrorMessage(error) || "Lỗi khi sửa bình luận");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => commentService.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      toast.success("Đã xóa bình luận");
    },
    onError: (error: AppAxiosError) => {
      toast.error(getErrorMessage(error) || "Lỗi khi xóa bình luận");
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

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    isEditing = false,
    id?: string,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isEditing && id) handleUpdate(id);
      else handleCreate();
    }
  };

  const handleReplyClick = (commentId: string, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderCommentNode = (node: CommentNode) => {
    const isAuthor = node.authorId._id === currentUser?._id;
    const canModify = isAuthor;
    const isEditing = editingId === node._id;

    return (
      <div key={node._id} className="w-full mb-1">
        {isEditing ? (
          <div className="flex gap-2 items-start w-full py-2">
            <div className="w-8 h-8 shrink-0 rounded-full border border-border shadow-sm overflow-hidden flex items-center justify-center bg-muted z-10">
              {node.authorId.avatarUrl ? (
                <img
                  src={node.authorId.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  {node.authorId.displayName?.charAt(0) || "U"}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2 bg-muted p-3 rounded-xl border border-border">
              <textarea
                className="w-full min-h-[60px] bg-card rounded-lg border border-border p-2 text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, true, node._id)}
                autoFocus
              />
              <div className="flex items-center gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setEditingId(null)}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => handleUpdate(node._id)}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  )}
                  Lưu
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 items-start py-1 w-full group">
            {/* Avatar */}
            <div className="w-8 h-8 shrink-0 rounded-full border border-border shadow-sm overflow-hidden flex items-center justify-center bg-muted z-10">
              {node.authorId.avatarUrl ? (
                <img
                  src={node.authorId.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  {node.authorId.displayName?.charAt(0) || "U"}
                </span>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-start min-w-0">
              <div className="flex items-start gap-1 max-w-full">
                {/* Bubble (Facebook Style) */}
                <div className="bg-muted/70 px-3 py-2 rounded-2xl rounded-tl-sm text-[14px] text-foreground break-words whitespace-pre-wrap flex flex-col">
                  <span className="text-[12px] font-bold text-foreground mb-0.5">
                    {isAuthor
                      ? "Bạn"
                      : node.authorId.displayName || "Người dùng"}
                  </span>
                  <span>
                    {node.content.length > CHAR_LIMIT &&
                    !expandedContentIds.has(node._id)
                      ? `${node.content.substring(0, CHAR_LIMIT)}...`
                      : node.content}
                  </span>
                  {node.content.length > CHAR_LIMIT && (
                    <button
                      onClick={() => toggleContent(node._id)}
                      className="text-left text-[12px] font-bold text-primary hover:text-primary/80 mt-1 transition-colors"
                    >
                      {expandedContentIds.has(node._id) ? "Ẩn bớt" : "Xem thêm"}
                    </button>
                  )}
                </div>

                {/* Actions Menu (3 dots) */}
                {canModify && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:bg-muted rounded-full"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-36">
                        <DropdownMenuItem
                          className="cursor-pointer text-xs font-medium"
                          onClick={() => {
                            setEditingId(node._id);
                            setEditContent(node.content);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-2" /> Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-xs font-medium text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => deleteMutation.mutate(node._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {/* Reply / Time row */}
              <div className="flex items-center gap-3 mt-0.5 ml-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {formatDistanceToNow(new Date(node.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                  {node.createdAt !== node.updatedAt && " (đã sửa)"}
                </span>
                {canInteract && node.depth < MAX_REPLY_DEPTH && (
                  <button
                    onClick={() =>
                      handleReplyClick(
                        node._id,
                        node.authorId.displayName || "Người dùng",
                      )
                    }
                    className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Trả lời
                  </button>
                )}
              </div>

              {/* Toggle Replies Button */}
              {node.children.length > 0 && (
                <button
                  onClick={() => toggleReplies(node._id)}
                  className="flex items-center gap-1.5 mt-2 ml-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  {expandedReplyIds.has(node._id)
                    ? `Ẩn ${node.children.length} câu trả lời`
                    : `Xem ${node.children.length} câu trả lời`}
                </button>
              )}

              {/* Replies (Children) */}
              {node.children.length > 0 && expandedReplyIds.has(node._id) && (
                <div className="w-full mt-2 relative before:absolute before:inset-y-0 before:-left-[24px] before:w-px before:bg-border ml-2">
                  <div className="w-full pl-2">
                    {node.children.map(renderCommentNode)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-muted shadow-sm overflow-hidden flex flex-col">
      {/* Header / Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-12 flex items-center justify-between px-4 bg-card hover:bg-muted transition-colors border-b border-border focus:outline-none shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-[14px] font-bold text-foreground">
            Thảo luận{" "}
            {comments.length > 0 && (
              <span className="ml-1 text-[11px] font-bold text-primary-foreground bg-primary px-1.5 py-0.5 rounded-full">
                {comments.length}
              </span>
            )}
          </h3>
        </div>
        <div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
          {/* Comment List */}
          <div className="flex-1 overflow-y-auto w-full custom-scrollbar p-4 relative min-h-[150px] max-h-[500px]">
            {isLoading ? (
              <div className="absolute inset-0 flex justify-center items-center text-muted-foreground font-medium bg-background/80 z-10">
                <Loader2 className="w-6 h-6 animate-spin mr-2 text-primary" />{" "}
                Đang tải thảo luận...
              </div>
            ) : commentTree.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center py-12">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3 shadow-sm border border-border">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-[14px] font-semibold text-foreground">
                  Chưa có bình luận nào
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Hãy là người đầu tiên bắt đầu trò chuyện!
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col">
                {commentTree.map(renderCommentNode)}
              </div>
            )}
          </div>

          {/* Input Area */}
          {canInteract ? (
            <div className="p-4 bg-muted border-t border-border shrink-0">
              {replyingTo && (
                <div className="flex items-center justify-between bg-primary/10 px-3 py-1.5 rounded-t-xl border border-b-0 border-primary/20 mb-[-1px] relative z-0">
                  <span className="text-[12px] font-medium text-primary flex items-center">
                    <Reply className="w-3.5 h-3.5 mr-1.5" />
                    Đang trả lời <strong>{replyingTo.name}</strong>
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-primary/20 rounded-full text-primary transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex gap-3 items-end relative z-10">
                <div className="w-9 h-9 shrink-0 rounded-full border border-border shadow-sm overflow-hidden bg-muted flex items-center justify-center relative mb-1">
                  {currentUser?.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[12px] font-bold text-muted-foreground uppercase">
                      {currentUser?.displayName?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div
                  className={`flex-1 relative group bg-card border border-border focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all flex items-end p-1.5 pl-4 overflow-hidden shadow-sm ${replyingTo ? "rounded-b-2xl rounded-tr-2xl" : "rounded-2xl"}`}
                >
                  <textarea
                    ref={inputRef}
                    className="w-full max-h-[150px] min-h-[38px] bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none resize-none py-2 placeholder:font-medium leading-relaxed custom-scrollbar"
                    style={{ height: newComment ? "auto" : "38px" }}
                    placeholder={
                      replyingTo
                        ? `Viết câu trả lời...`
                        : "Viết bình luận mới..."
                    }
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                    }}
                    onKeyDown={(e) => handleKeyDown(e, false)}
                    disabled={createMutation.isPending}
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 w-9 h-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-primary transition-colors ml-2 mb-0.5"
                        disabled={createMutation.isPending}
                        type="button"
                        title="Nhắc đến ai đó"
                      >
                        <AtSign className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 max-h-60 overflow-y-auto">
                      {projectMembers.map((m: any) => {
                        const user = m.userId as User;
                        if (!user || user._id === currentUser?._id) return null;
                        return (
                          <DropdownMenuItem
                            key={user._id}
                            className="cursor-pointer"
                            onClick={() => {
                              const mentionStr = `@${user.displayName || user.email} `;
                              setNewComment(prev => prev + mentionStr);
                              setMentions(prev => [...new Set([...prev, user._id])]);
                              if (inputRef.current) inputRef.current.focus();
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                                {user.avatarUrl ? (
                                  <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                    {user.displayName?.charAt(0) || "U"}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-foreground">{user.displayName || user.email}</span>
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                      {projectMembers.filter((m: any) => m.userId && m.userId._id !== currentUser?._id).length === 0 && (
                        <div className="p-2 text-sm text-center text-muted-foreground italic">Không có thành viên khác</div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    size="icon"
                    className="shrink-0 w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-sm disabled:opacity-50 disabled:bg-muted ml-1 mb-0.5"
                    onClick={handleCreate}
                    disabled={!newComment.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 ml-0.5" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="text-right mt-2 pr-1">
                <span className="text-[10px] font-medium text-muted-foreground">
                  <strong>Enter</strong> để gửi, <strong>Shift + Enter</strong>{" "}
                  xuống dòng
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted border-t border-border text-center shrink-0">
              <span className="text-[13px] font-medium text-muted-foreground">
                Bạn không có quyền thảo luận trong dự án này.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
