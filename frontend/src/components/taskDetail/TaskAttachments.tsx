import { useRef } from "react";
import { Paperclip, UploadCloud, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
    } catch (error: any) {
      console.error("Local file processing failed:", error);
      toast.error("Lỗi khi xử lý file trên trình duyệt.");
    } finally {
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (urlToRemove: string) => {
    // If we're removing a local file, we should theoretically revoke object URL, 
    // but the browser handles it efficiently on reload. For immediate cleanup:
    const removingAttachment = attachments.find(a => a.url === urlToRemove);
    if (removingAttachment?.file) {
      URL.revokeObjectURL(urlToRemove);
    }
    onChange?.(attachments.filter((a) => a.url !== urlToRemove));
  };

  const isImage = (attachment: Attachment) => {
    if (attachment.file) {
      return attachment.file.type.startsWith('image/');
    }
    return attachment.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null;
  };

  return (
    <div className="space-y-4">
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

      {/* Attachments List */}
      {attachments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {attachments.map((attachment, idx) => {
            const imageType = isImage(attachment);
            return (
              <div
                key={idx}
                className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all relative overflow-hidden"
              >
                <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                  {imageType ? (
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
                    {imageType ? "Hình ảnh" : "Tài liệu"}
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
                      handleRemove(attachment.url);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !isEditing && (
          <span className="text-slate-400 italic bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 block text-[14px]">
            Chưa có tệp đính kèm nào.
          </span>
        )
      )}
    </div>
  );
};
