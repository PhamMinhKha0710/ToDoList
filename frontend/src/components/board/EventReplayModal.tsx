import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Activity } from '@/types/activity';
import { activityService } from '@/services/activity.service';
import { Loader2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

type SimTask = { 
    _id: string; 
    title: string;
    priority?: 'low' | 'medium' | 'high';
    color?: string;
    tags?: any[];
    status?: string;
    attachments?: { fileUrl: string; fileName: string }[];
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    description?: string;
    commentCount?: number;
    fileCount?: number;
    assignees?: any[];
    comments?: string[];
};

type SimColumn = { 
    _id: string; 
    title: string; 
    color?: string;
    tasks: SimTask[] 
};

interface EventReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const getActionText = (activity: Activity | null): { actionHtml: string, title?: string, subTitle?: string } => {
  if (!activity) return { actionHtml: '<span class="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Khởi tạo</span>', title: 'Trạng thái ban đầu', subTitle: 'Trước mọi thay đổi' };
  
  let detail: any = {};
  try {
    detail = activity.detail ? JSON.parse(activity.detail) : {};
  } catch (e) {}

  switch (activity.action) {
    case 'COLUMN_CREATED': return { actionHtml: `<span class="text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Tạo cột</span>`, title: `Thêm cột "${detail.title || ''}"` };
    case 'COLUMN_UPDATED': return { actionHtml: `<span class="text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Sửa cột</span>`, title: `Cập nhật cột "${detail.title || ''}"` };
    case 'COLUMN_DELETED': return { actionHtml: `<span class="text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Xóa cột</span>`, title: `Gỡ bỏ một cột` };
    case 'COLUMNS_REORDERED': return { actionHtml: `<span class="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Sắp xếp</span>`, title: `Thay đổi thứ tự cột` };
    case 'TASK_CREATED': return { actionHtml: `<span class="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Tạo task</span>`, title: `Thêm "${detail.title || ''}"` };
    case 'TASK_UPDATED': return { actionHtml: `<span class="text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Sửa task</span>`, title: `Cập nhật "${detail.taskTitle || ''}"` };
    case 'TASK_DELETED': return { actionHtml: `<span class="text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Xóa task</span>`, title: `Xóa "${detail.taskTitle || ''}"` };
    case 'TASK_MOVED': return { actionHtml: `<span class="text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Di chuyển</span>`, title: `Chuyển sang ${detail.destinationColumnTitle || 'cột khác'}` };
    case 'COMMENT_CREATED': return { actionHtml: `<span class="text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Bình luận</span>`, title: `Bình luận mới`, subTitle: detail.contentSnippet ? `"${detail.contentSnippet}..."` : '' };
    case 'MEMBER_INVITED': return { actionHtml: `<span class="text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Mời</span>`, title: `Mời ${detail.email || ''}` };
    case 'MEMBER_ROLE_UPDATED': return { actionHtml: `<span class="text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Phân quyền</span>`, title: `Đổi vai trò thành ${detail.newRole || ''}` };
    case 'MEMBER_JOINED': return { actionHtml: `<span class="text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Tham gia</span>`, title: `Gia nhập dự án` };
    default: return { actionHtml: `<span class="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">${activity.action}</span>`, title: activity.action };
  }
};

export function EventReplayModal({ isOpen, onClose, projectId }: EventReplayModalProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 is initial state, 1 is after event 0
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      loadActivities();
    } else {
      stopPlaying();
      setCurrentStep(0);
    }
  }, [isOpen, projectId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await activityService.getProjectActivities(projectId, 1000, 0);
      // Data is usually sorted by createdAt descending. We need chronological (ascending) order.
      const chronological = data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setActivities(chronological);
      setCurrentStep(chronological.length); // Start at the end
    } catch (e) {
      console.error('Failed to load activities', e);
    } finally {
      setLoading(false);
    }
  };

  const states = useMemo(() => {
    let currentColumns: SimColumn[] = [];
    const stepStates = [currentColumns];

    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        let detail: any = {};
        try {
            detail = activity.detail ? JSON.parse(activity.detail) : {};
        } catch (e) {}

        // Create a deep copy of current state to modify
        let nextColumns = currentColumns.map(col => ({
             ...col,
             tasks: [...col.tasks]
        }));

        switch (activity.action) {
            case 'COLUMN_CREATED':
                nextColumns.push({ 
                    _id: activity.entityId, 
                    title: detail.title || '', 
                    color: detail.color,
                    tasks: [] 
                });
                break;
            case 'COLUMN_UPDATED':
                {
                    const idxCol = nextColumns.findIndex(c => c._id === activity.entityId);
                    if(idxCol > -1) {
                        const newTitle = detail.differences?.title?.new || detail.title || nextColumns[idxCol].title;
                        const newColor = detail.differences?.color?.new || detail.color || nextColumns[idxCol].color;
                        nextColumns[idxCol] = { ...nextColumns[idxCol], title: newTitle, color: newColor };
                    }
                }
                break;
            case 'COLUMN_DELETED':
                nextColumns = nextColumns.filter(c => c._id !== activity.entityId);
                break;
            case 'COLUMNS_REORDERED':
                {
                    const newOrder = detail.newOrder || detail.orderedColumnIds || [];
                    if (newOrder.length > 0) {
                        nextColumns.sort((a, b) => {
                            const idxA = newOrder.indexOf(a._id);
                            const idxB = newOrder.indexOf(b._id);
                            return idxA - idxB;
                        });
                    }
                }
                break;
            case 'TASK_CREATED':
                 {
                     const targetColId = detail.columnId || (nextColumns.length > 0 ? nextColumns[0]._id : null);
                     if (targetColId) {
                         const targetColIdx = nextColumns.findIndex(c => c._id === targetColId);
                         if (targetColIdx > -1) {
                             nextColumns[targetColIdx].tasks.push({ 
                                 _id: activity.entityId, 
                                 title: detail.title || 'New Task',
                                 priority: detail.priority,
                                 color: detail.color,
                                 tags: detail.tags,
                                 status: detail.status,
                                 description: detail.descriptionSnippet,
                                 attachments: detail.attachments,
                                 startDate: detail.startDate,
                                 endDate: detail.endDate,
                                 dueDate: detail.dueDate,
                                 commentCount: detail.commentCount || 0,
                                 fileCount: detail.fileCount || 0,
                                 assignees: detail.assignees || []
                             });
                         }
                     }
                 }
                 break;
            case 'TASK_DELETED':
                 nextColumns = nextColumns.map(col => ({
                      ...col,
                      tasks: col.tasks.filter(t => t._id !== activity.entityId)
                 }));
                 break;
            case 'TASK_MOVED':
                 {
                     const { sourceColumnId, destinationColumnId, sourceTaskIds, destinationTaskIds } = detail;
                     
                     // Helper map to quickly find tasks
                     const taskMap: Record<string, SimTask> = {};
                     nextColumns.forEach(c => c.tasks.forEach(t => (taskMap[t._id] = t)));

                     if (sourceTaskIds && destinationTaskIds) {
                         nextColumns = nextColumns.map(col => {
                             if (col._id === sourceColumnId) {
                                 const updatedTasks = sourceTaskIds.map((id: string) => taskMap[id]).filter(Boolean);
                                 return { ...col, tasks: updatedTasks };
                             }
                             if (col._id === destinationColumnId) {
                                 const updatedTasks = destinationTaskIds.map((id: string) => taskMap[id]).filter(Boolean);
                                 return { ...col, tasks: updatedTasks };
                             }
                             return col;
                         });
                     } else {
                         // Fallback logic for old logs
                         let movedTask: SimTask | null = null;
                         nextColumns = nextColumns.map(col => {
                             const existingIdx = col.tasks.findIndex(t => t._id === activity.entityId);
                             if (existingIdx > -1) {
                                 movedTask = col.tasks[existingIdx];
                                 col.tasks.splice(existingIdx, 1);
                             }
                             return col;
                         });
                         if (movedTask && destinationColumnId) {
                             const destCol = nextColumns.find(c => c._id === destinationColumnId);
                             if (destCol) destCol.tasks.push(movedTask);
                         }
                     }
                 }
                 break;
            // update task could change title
            case 'TASK_UPDATED':
                nextColumns = nextColumns.map(col => ({
                    ...col,
                    tasks: col.tasks.map(t => {
                        if (t._id === activity.entityId) {
                            const updatedTask = { ...t };
                            if (detail.differences) {
                                Object.keys(detail.differences).forEach(key => {
                                    (updatedTask as any)[key] = detail.differences[key].new;
                                });
                            } else {
                                updatedTask.title = detail.title || t.title;
                            }
                            return updatedTask;
                        }
                        return t;
                    })
                }));
                break;
            case 'COMMENT_CREATED':
                nextColumns = nextColumns.map(col => ({
                    ...col,
                    tasks: col.tasks.map(t => {
                        if (t._id === detail.taskId) {
                            return { 
                                ...t, 
                                commentCount: (t.commentCount || 0) + 1,
                                comments: [...(t.comments || []), detail.contentSnippet].filter(Boolean)
                            };
                        }
                        return t;
                    })
                }));
                break;
            case 'COMMENT_DELETED':
                nextColumns = nextColumns.map(col => ({
                    ...col,
                    tasks: col.tasks.map(t => {
                        if (t._id === detail.taskId) {
                            return { ...t, commentCount: Math.max(0, (t.commentCount || 0) - 1) };
                        }
                        return t;
                    })
                }));
                break;
            case 'FILE_ATTACHED':
                nextColumns = nextColumns.map(col => ({
                    ...col,
                    tasks: col.tasks.map(t => {
                        if (t._id === activity.entityId) {
                            const newAttachment = { fileName: detail.fileName, fileUrl: detail.fileUrl };
                            return { 
                                ...t, 
                                attachments: [...(t.attachments || []), newAttachment],
                                fileCount: (t.fileCount || 0) + 1
                            };
                        }
                        return t;
                    })
                }));
                break;
            case 'FILE_REMOVED':
                nextColumns = nextColumns.map(col => ({
                    ...col,
                    tasks: col.tasks.map(t => {
                        if (t._id === activity.entityId) {
                            return { 
                                ...t, 
                                attachments: (t.attachments || []).filter(a => a.fileName !== detail.fileName),
                                fileCount: Math.max(0, (t.fileCount || 0) - 1)
                            };
                        }
                        return t;
                    })
                }));
                break;
        }

        stepStates.push(nextColumns);
        currentColumns = nextColumns;
    }

    return stepStates;
  }, [activities]);

  const maxStep = activities.length;

  const currentBoardState = states[currentStep] || [];

  const handleStepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentStep(Number(e.target.value));
  };

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, maxStep));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const togglePlay = () => {
    if (isPlaying) {
      stopPlaying();
    } else {
      if (currentStep >= maxStep) setCurrentStep(0);
      setIsPlaying(true);
      playIntervalRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= maxStep - 1) {
             stopPlaying();
             return maxStep;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopPlaying = () => {
    setIsPlaying(false);
    if(playIntervalRef.current) clearInterval(playIntervalRef.current);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[1200px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b border-border shadow-sm shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl text-primary">
             🎬 Event Replay <span className="text-sm font-normal text-muted-foreground bg-accent px-2 py-0.5 rounded-full">{activities.length} sự kiện</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Simulation View Area */}
          <div className="flex-1 p-6 overflow-auto bg-accent/20">
             {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
             ) : (
                <div className="flex gap-4 items-start h-full pb-4">
                  {currentBoardState.map((col, idx) => (
                    <div 
                      key={idx} 
                      className="w-72 flex-shrink-0 bg-background rounded-lg shadow-sm border-t-4 border-border p-3 flex flex-col max-h-full transition-all duration-300"
                      style={{ borderTopColor: col.color || 'transparent' }}
                    >
                       <h3 className="font-bold text-sm mb-3 px-1 truncate flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: col.color || '#ccc' }} />
                           <span className="flex-1">{col.title}</span>
                           <span className="text-[10px] bg-accent/50 text-muted-foreground border rounded-full px-2 py-0.5 ml-auto font-bold">{col.tasks.length}</span>
                       </h3>
                       <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                          {col.tasks.map((task, tIdx) => {
                             const priorityColors = {
                               low: 'bg-blue-100 text-blue-700 border-blue-200',
                               medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                               high: 'bg-red-100 text-red-700 border-red-200'
                             };

                             const coverImage = task.attachments?.find(a => /\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl));

                             return (
                               <div 
                                 key={tIdx} 
                                 className={`relative rounded-lg border border-border shadow-sm hover:shadow-md transition-all group overflow-hidden ${task.color ? 'text-white' : 'bg-background text-foreground'}`}
                                 style={{ backgroundColor: task.color || 'var(--background)' }}
                               >
                                 {/* Task Image Cover */}
                                 {coverImage && (
                                   <div className="w-full h-32 overflow-hidden border-b border-white/10 relative group-hover:opacity-100 opacity-90 transition-opacity">
                                      <img 
                                        src={coverImage.fileUrl} 
                                        alt={coverImage.fileName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                      />
                                   </div>
                                 )}

                                 <div className="p-3 relative">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                            {/* Status Badge */}
                                            {task.status && (
                                              <div className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shadow-xs ${task.color ? 'bg-white/20 text-white border-white/10' : 'bg-muted text-muted-foreground border-border'}`}>
                                                  {task.status}
                                              </div>
                                            )}
                                            {/* Priority Badge */}
                                            {task.priority && (
                                              <div className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase border tracking-wider shadow-xs ${task.color ? 'bg-black/20 text-white border-white/20' : priorityColors[task.priority]}`}>
                                                  {task.priority}
                                              </div>
                                            )}
                                            {/* Date Timeline Indicator */}
                                            {(task.startDate || task.endDate || task.dueDate) && (
                                              <div className={`text-[9px] px-1.5 py-1 rounded flex flex-col gap-0.5 border shadow-xs ml-auto ${task.color ? 'bg-black/20 text-white border-white/10' : 'text-orange-700 bg-orange-50 border-orange-200'}`}>
                                                  {task.startDate && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="opacity-70" title="Bắt đầu">🎬</span>
                                                      <span>{new Date(task.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                                                    </div>
                                                  )}
                                                  {task.endDate && (
                                                    <div className="flex items-center gap-1">
                                                      <span className="opacity-70" title="Kết thúc">🏁</span>
                                                      <span>{new Date(task.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                                                    </div>
                                                  )}
                                                  {task.dueDate && (
                                                    <div className="flex items-center gap-1 font-bold">
                                                      <span className="opacity-70" title="Hạn chót">🕒</span>
                                                      <span>{new Date(task.dueDate).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                                                    </div>
                                                  )}
                                              </div>
                                            )}
                                        </div>

                                        <h4 className={`font-bold text-[13px] leading-tight break-words ${task.color ? 'text-white drop-shadow-sm' : 'text-foreground'}`}>
                                            {task.title || 'Untitled task'}
                                        </h4>

                                        {/* Attachment Gallery (Images) */}
                                        {task.attachments && task.attachments.filter(a => /\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl)).length > 1 && (
                                          <div className="grid grid-cols-4 gap-1 mt-2">
                                            {task.attachments
                                              .filter(a => /\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl))
                                              .slice(0, 4)
                                              .map((a, i) => (
                                                <div key={i} className="aspect-square rounded border border-white/20 overflow-hidden shadow-xs">
                                                  <img src={a.fileUrl} alt={a.fileName} className="w-full h-full object-cover" />
                                                </div>
                                              ))
                                            }
                                            {task.attachments.filter(a => /\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl)).length > 4 && (
                                              <div className={`aspect-square rounded border border-white/20 flex items-center justify-center text-[10px] font-bold ${task.color ? 'bg-white/20' : 'bg-muted'}`}>
                                                +{task.attachments.filter(a => /\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl)).length - 4}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Other Attachments (Non-images) */}
                                        {task.attachments && task.attachments.some(a => !/\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl)) && (
                                          <div className={`flex flex-col gap-1 mt-2 ${task.color ? 'bg-black/10' : 'bg-accent/30'} p-2 rounded-md border ${task.color ? 'border-white/10' : 'border-border/50'}`}>
                                            <div className="text-[9px] font-bold uppercase opacity-60 mb-1">Tài liệu:</div>
                                            {task.attachments.filter(a => !/\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl)).slice(0, 3).map((a, i) => (
                                              <div key={i} className="flex items-center gap-1.5 text-[10px] truncate group/file">
                                                <span className="shrink-0">📄</span>
                                                <span className="truncate flex-1">{a.fileName || 'file'}</span>
                                              </div>
                                            ))}
                                            {task.attachments.filter(a => !/\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl)).length > 3 && (
                                              <div className="text-[9px] opacity-60 pl-1 font-semibold italic">...và {task.attachments.filter(a => !/\.(jpg|jpeg|png|gif)$/i.test(a.fileUrl)).length - 3} tệp khác</div>
                                            )}
                                          </div>
                                        )}

                                        {/* Stats Row: Attachments Total */}
                                        {((task.attachments?.length || 0) > 0 || (task.fileCount || 0) > 0) && (
                                          <div className="flex items-center gap-2 mt-1 px-0.5">
                                             <div className={`flex items-center gap-1 text-[10px] font-bold ${task.color ? 'text-white/90' : 'text-muted-foreground'}`}>
                                               <span>📎</span>
                                               <span>{(task.fileCount || 0) || task.attachments?.length} đính kèm tổng cộng</span>
                                             </div>
                                          </div>
                                        )}

                                        {/* Latest Comments */}
                                        {task.comments && task.comments.length > 0 && (
                                          <div className={`flex flex-col gap-1 mt-1 pt-1 border-t ${task.color ? 'border-white/20' : 'border-border/50'}`}>
                                            <div className={`text-[10px] font-bold mb-0.5 flex items-center gap-1 opacity-80 ${task.color ? 'text-white' : 'text-primary'}`}>
                                              <span>💬 {task.commentCount || task.comments.length} Bình luận:</span>
                                            </div>
                                            {task.comments.slice(-2).map((c, i) => (
                                              <div key={i} className={`text-[10px] italic line-clamp-1 border-l-2 pl-1.5 py-0.5 rounded-r ${task.color ? 'border-white/40 bg-white/10 text-white/90' : 'border-primary/30 bg-accent/50 text-muted-foreground'}`}>
                                                "{c}"
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Assignees (Names or Bubbles) */}
                                        {task.assignees && task.assignees.length > 0 && (
                                          <div className="flex -space-x-1 overflow-hidden mt-1 pt-1">
                                            {task.assignees.slice(0, 3).map((u: any, i: number) => (
                                              <div 
                                                key={i} 
                                                title={u.displayName || u.email}
                                                className={`w-5 h-5 rounded-full border flex items-center justify-center text-[8px] font-bold shrink-0 shadow-sm ${task.color ? 'bg-white/20 border-white text-white drop-shadow' : 'bg-background border-border text-foreground'}`}
                                              >
                                                {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                                              </div>
                                            ))}
                                            {task.assignees.length > 3 && (
                                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[7px] font-bold shrink-0 shadow-sm ${task.color ? 'bg-white/20 border-white/40 text-white' : 'bg-muted border-background text-muted-foreground'}`}>
                                                +{task.assignees.length - 3}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Tag Chips */}
                                        {task.tags && task.tags.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-1">
                                              {task.tags.map((tag: any, index: number) => (
                                                 <span 
                                                   key={index} 
                                                   className={`text-[9px] px-1.5 py-0.5 rounded border border-black/5 flex items-center gap-1 shadow-xs font-semibold drop-shadow-xs ${task.color ? 'bg-black/10 text-white' : ''}`}
                                                   style={{ backgroundColor: task.color ? 'rgba(255,255,255,0.2)' : (tag.color || '#f0f0f0'), color: task.color ? 'white' : '#1a1a1a' }}
                                                 >
                                                   {tag.name}
                                                 </span>
                                              ))}
                                          </div>
                                        )}
                                    </div>
                                 </div>
                               </div>
                             );
                          })}
                          {col.tasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 px-4 opacity-30 border border-dashed rounded-lg bg-accent/5">
                                <span className="text-xl">🎐</span>
                                <p className="text-[10px] mt-1 font-medium">Bản tin trống</p>
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
                  {currentBoardState.length === 0 && (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                          <div className="text-4xl mb-2">📭</div>
                          <p>Bảng thiết kế trống</p>
                      </div>
                  )}
                </div>
             )}
          </div>

           {/* Sidebar: Event List */}
           <div className="w-80 border-l border-border bg-background flex flex-col">
              <div className="p-3 font-semibold border-b text-sm text-muted-foreground uppercase tracking-wider">
                  Danh sách sự kiện
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1" id="replay-events">
                 <div
                    onClick={() => setCurrentStep(0)}
                    className={`p-3 text-sm rounded-md cursor-pointer transition-colors border ${currentStep === 0 ? 'bg-primary/10 border-primary shadow-sm' : 'hover:bg-accent border-transparent'}`}
                 >
                     <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                        <span className="font-medium text-primary">Trạng thái ban đầu</span>
                     </div>
                     <span className="text-xs text-muted-foreground">Trước mọi thay đổi</span>
                 </div>

                 {activities.map((act, index) => {
                     const stepNum = index + 1;
                     const isCurrent = currentStep === stepNum;
                     const info = getActionText(act);
                     const email = act.userId?.email || 'Unknown';
                     const time = format(new Date(act.createdAt), 'HH:mm dd-MM');

                     return (
                        <div
                           key={act._id}
                           onClick={() => setCurrentStep(stepNum)}
                           className={`p-3 text-sm rounded-md cursor-pointer transition-colors border ${isCurrent ? 'bg-primary/10 border-primary shadow-sm' : 'hover:bg-accent border-transparent'}`}
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                               <div dangerouslySetInnerHTML={{ __html: info.actionHtml }} />
                               <span className="text-[10px] text-muted-foreground">#{stepNum}</span>
                            </div>
                            <div className="font-medium mt-1 truncate">{info.title}</div>
                            {info.subTitle && <div className="text-xs mt-0.5 truncate">{info.subTitle}</div>}
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                                <span className="w-4 h-4 flex items-center justify-center bg-primary text-primary-foreground rounded-full leading-none font-bold">
                                   {email[0]?.toUpperCase() || '?'}
                                </span>
                                <span className="truncate">{time} - {email}</span>
                            </div>
                        </div>
                     );
                 })}
              </div>
           </div>
        </div>

        {/* Timeline Footer Controls */}
        <div className="h-16 border-t border-border bg-background flex items-center px-6 gap-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative">
            <span className="text-xs font-medium w-16 whitespace-nowrap">Bước {currentStep} / {maxStep}</span>
            <input
               type="range"
               min={0}
               max={maxStep}
               value={currentStep}
               onChange={handleStepChange}
               className="flex-1 h-2 bg-accent rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-xs text-muted-foreground w-12 text-right">{maxStep > 0 ? Math.round((currentStep / maxStep) * 100) : 0}%</span>

            <div className="flex items-center gap-2 ml-4">
                <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentStep === 0} className="w-8 h-8">
                   <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="default" size="icon" onClick={togglePlay} className={`w-10 h-10 rounded-full shadow-md transition-transform ${isPlaying ? 'scale-95' : 'hover:scale-105'}`}>
                   {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
                <Button variant="outline" size="icon" onClick={handleNext} disabled={currentStep === maxStep} className="w-8 h-8">
                   <SkipForward className="w-4 h-4" />
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
