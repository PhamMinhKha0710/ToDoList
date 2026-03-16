import { useRef, useState, useEffect } from "react";
import { Paperclip, UploadCloud, FileText, X, Image as ImageIcon, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/types/error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { Attachment as BaseAttachment } from "@/types/task";

// Kế thừa BaseAttachment cho trạng thái UI tạm thời
export interface Attachment extends Partial<BaseAttachment> {
  name: string;      // Tương đương fileName nhưng UI đang xài `name`
  url: string;       // Tương đương fileUrl nhưng UI đang xài `url`
  file?: File;       // Cờ đánh dấu file local chuẩn bị upload
}

interface TaskAttachmentsProps {
  attachments?: Attachment[];
  onChange?: (attachments: Attachment[]) => void;
  isEditing?: boolean;
}

export const TaskAttachments = ({
  attachments = [],
  onChange,
  isEditing = true,
}: TaskAttachmentsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImages, setShowImages] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (e.g., 10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File quá lớn. Tối đa 10MB.");
      return;
    }

    // Check if duplicate name exists (optional but good practice)
    if (attachments.some(a => a.name === file.name)) {
      toast.error("File đã tồn tại trong danh sách.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      // Create a temporary object URL for preview
      const previewUrl = URL.createObjectURL(file);
      const newAttachment: Attachment = { 
        name: file.name, 
        url: previewUrl,
        file: file 
      };
      
      onChange?.([...attachments, newAttachment]);
    } catch (error: unknown) {
      console.error("Local file processing failed:", error);
      toast.error(getErrorMessage(error) || "Lỗi khi xử lý file trên trình duyệt.");
    } finally {
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (urlToRemove: string) => {
    const removingAttachment = attachments.find(a => a.url === urlToRemove);
    if (removingAttachment?.file) {
      URL.revokeObjectURL(urlToRemove);
    }
    onChange?.(attachments.filter((a) => a.url !== urlToRemove));
  };

  const isImageFile = (attachment: Attachment) => {
    if (attachment.file) {
      return attachment.file.type.startsWith('image/');
    }
    return attachment.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null;
  };

  const imageAttachments = attachments.filter(isImageFile);
  const fileAttachments = attachments.filter(a => !isImageFile(a));

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (previewIndex === null) return;
    setPreviewIndex((previewIndex + 1) % imageAttachments.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (previewIndex === null) return;
    setPreviewIndex((previewIndex - 1 + imageAttachments.length) % imageAttachments.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewIndex === null) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") setPreviewIndex(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, imageAttachments.length]);

  const AttachmentItem = ({ attachment, type, index }: { attachment: Attachment, type: 'image' | 'file', index?: number }) => (
    <div 
      className={`group flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all relative overflow-hidden ${type === 'image' ? 'cursor-zoom-in' : ''}`}
      onClick={() => {
        if (type === 'image' && index !== undefined) {
          setPreviewIndex(index);
        }
      }}
    >
      <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
        {type === 'image' ? (
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileText className="w-5 h-5 text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <a
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className="text-[13px] font-bold text-slate-700 truncate block hover:text-indigo-600 hover:underline"
          title={attachment.name}
        >
          {attachment.name}
        </a>
        <span className="text-[11px] text-slate-400 font-medium">
          {type === 'image' ? "Hình ảnh" : "Tài liệu"}
        </span>
      </div>

      {isEditing && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 backdrop-blur-sm text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleRemove(attachment.url!);
          }}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Paperclip className="w-4 h-4" /> Tệp đính kèm ({attachments.length})
        </h3>
      </div>

      {/* Upload Zone */}
      {isEditing && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all duration-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt" 
          />
          <div className="w-10 h-10 bg-white rounded-full shadow-sm text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:text-indigo-500 group-hover:shadow-md transition-all duration-300">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-[14px] text-slate-500 font-medium">
            Bấm để{" "}
            <span className="text-indigo-600 font-bold">chọn file</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Hỗ trợ Hình ảnh, PDF, Word, Excel, ZIP (Tối đa 10MB)
          </p>
        </div>
      )}

      {/* Sections Wrapper */}
      <div className="space-y-4">
        {/* Image Section */}
        {imageAttachments.length > 0 && (
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer group/header"
              onClick={() => setShowImages(!showImages)}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[13px] font-bold text-slate-600">Hình ảnh ({imageAttachments.length})</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-400 group-hover/header:text-slate-600 transition-colors">
                {showImages ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            
            {showImages && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {imageAttachments.map((att, idx) => (
                  <AttachmentItem key={idx} attachment={att} type="image" index={idx} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Other Files Section */}
        {fileAttachments.length > 0 && (
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer group/header"
              onClick={() => setShowFiles(!showFiles)}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span className="text-[13px] font-bold text-slate-600">Tài liệu ({fileAttachments.length})</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-400 group-hover/header:text-slate-600 transition-colors">
                {showFiles ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {showFiles && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {fileAttachments.map((att, idx) => (
                  <AttachmentItem key={idx} attachment={att} type="file" />
                ))}
              </div>
            )}
          </div>
        )}

        {attachments.length === 0 && !isEditing && (
          <span className="text-slate-400 italic bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 block text-[14px]">
            Chưa có tệp đính kèm nào.
          </span>
        )}
      </div>

      {/* Image Preview Modal - Super-Pro Distilled Aesthetic */}
      <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] p-0 overflow-hidden bg-transparent border-none shadow-none flex flex-col items-center justify-center outline-none w-screen h-screen">
          {/* Pro Darkened Glass Backdrop */}
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-[40px] -z-10" />

          {/* Distilled Top Navigation */}
          <div className="absolute top-0 left-0 right-0 z-50 p-8 flex items-center justify-between pointer-events-none">
            <div className="flex flex-col gap-1 pointer-events-auto">
              <h2 className="text-[12px] font-bold text-neutral-500 uppercase tracking-[0.2em]">
                Project Gallery
              </h2>
              <p className="text-[15px] font-medium text-neutral-200 truncate max-w-[200px] sm:max-w-xl">
                {previewIndex !== null && imageAttachments[previewIndex]?.name}
              </p>
            </div>
            
            <div className="flex items-center gap-6 pointer-events-auto">
              <button 
                className="group flex items-center gap-2 text-neutral-400 hover:text-white transition-all duration-300"
                onClick={() => {
                  if (previewIndex !== null) {
                    const link = document.createElement('a');
                    link.href = imageAttachments[previewIndex].url;
                    link.download = imageAttachments[previewIndex].name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
              >
                <span className="text-[11px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">Download</span>
                <Download className="w-5 h-5 stroke-[1.25]" />
              </button>
              
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800/50 hover:bg-neutral-100 hover:text-neutral-950 transition-all duration-500 text-neutral-400"
                onClick={() => setPreviewIndex(null)}
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>
          </div>

          {/* High-End Gallery Space */}
          <div className="relative w-full h-full flex items-center justify-center group/pro px-4">
            {/* Minimal Artist Navigation */}
            {imageAttachments.length > 1 && (
              <>
                <button
                  className="absolute left-10 z-50 p-6 text-neutral-600 hover:text-white transition-all duration-500 active:scale-75"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="w-12 h-12 stroke-[0.5]" />
                </button>

                <button
                  className="absolute right-10 z-50 p-6 text-neutral-600 hover:text-white transition-all duration-500 active:scale-75"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-12 h-12 stroke-[0.5]" />
                </button>
              </>
            )}

            {/* Hero Image - Maximum presentation */}
            {previewIndex !== null && (
              <div className="relative max-w-full max-h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-1000 cubic-bezier(0.16, 1, 0.3, 1)">
                 <img
                  src={imageAttachments[previewIndex].url}
                  alt="Preview"
                  className="max-w-full max-h-[75vh] object-contain shadow-[0_100px_200px_-50px_rgba(0,0,0,0.9)] rounded-[4px]"
                />
                
                {/* Minimalist Pager Control */}
                <div className="absolute -bottom-24 flex flex-col items-center gap-4">
                  <div className="h-[2px] w-48 bg-neutral-800 relative overflow-hidden rounded-full">
                    <div 
                      className="absolute h-full bg-white transition-all duration-700 ease-out"
                      style={{ 
                        width: `${((previewIndex + 1) / imageAttachments.length) * 100}%`,
                        left: 0
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[14px] font-mono font-medium text-white tracking-widest">
                      {String(previewIndex + 1).padStart(2, '0')}
                    </span>
                    <div className="w-[1px] h-3 bg-neutral-700 mx-1" />
                    <span className="text-[12px] font-mono font-medium text-neutral-500">
                      {String(imageAttachments.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
