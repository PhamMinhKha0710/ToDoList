import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import type { Project } from "@/types/project";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { type AppAxiosError, getErrorMessage } from "@/types/error";
import { Loader2 } from "lucide-react";

const PRESET_COLORS = [
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProjectDialog = ({
  project,
  open,
  onOpenChange,
}: EditProjectDialogProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [imageUrl, setImageUrl] = useState(project.imageUrl || "");
  const [color, setColor] = useState(project.color || "#3b82f6");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setName(project.name);
    setDescription(project.description || "");
    setImageUrl(project.imageUrl || "");
    setColor(project.color || "#3b82f6");
    setSelectedFile(null);
  }, [project, open]);

  const updateMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      imageUrl?: string;
      color?: string;
      file?: File;
    }) => projectService.updateProject(project._id, data),
    onSuccess: () => {
      toast.success("Cập nhật thông tin dự án thành công!");
      queryClient.invalidateQueries({ queryKey: ["project", project._id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
    },
    onError: (error: AppAxiosError) => {
      toast.error(
        getErrorMessage(error) || "Có lỗi xảy ra khi cập nhật dự án",
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên dự án");
      return;
    }

    updateMutation.mutate({
      name,
      description,
      imageUrl: selectedFile ? undefined : imageUrl,
      file: selectedFile || undefined,
      color,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa dự án</DialogTitle>
          <DialogDescription>
            Thay đổi tên hoặc mô tả của dự án.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Tên dự án *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Mô tả chi tiết</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Màu sắc chủ đạo</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-primary scale-110" : "border-transparent hover:scale-105 shadow-sm"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
                <div
                  className="relative w-8 h-8 rounded-full overflow-hidden border border-border shadow-sm flex items-center justify-center bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  title="Màu tùy chỉnh"
                >
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-[-10px] w-12 h-12 cursor-pointer opacity-0"
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Ảnh đại diện nội bộ
              </Label>
              <div className="flex items-center gap-3">
                {selectedFile || imageUrl ? (
                  <div
                    className="h-10 w-10 shrink-0 rounded-lg bg-cover bg-center border relative group cursor-pointer"
                    style={{
                      backgroundImage: `url(${selectedFile ? URL.createObjectURL(selectedFile) : imageUrl})`,
                    }}
                    onClick={() =>
                      document
                        .getElementById("edit-project-avatar-upload")
                        ?.click()
                    }
                  >
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <span className="text-white text-[10px] font-medium">
                        Đổi
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      document
                        .getElementById("edit-project-avatar-upload")
                        ?.click()
                    }
                  >
                    {name ? name.substring(0, 2).toUpperCase() : "P"}
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="edit-project-avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document
                        .getElementById("edit-project-avatar-upload")
                        ?.click()
                    }
                    className="w-full text-xs"
                  >
                    Tải ảnh lên...
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
