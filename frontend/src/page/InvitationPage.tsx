import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import { Loader2, Users, AlertCircle, Plus } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { getErrorMessage } from "@/types/error";

const InvitationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projectInvitation", id],
    queryFn: () => projectService.getInvitationDetails(id!),
    enabled: !!id,
    retry: false,
  });

  const respondMutation = useMutation({
    mutationFn: (action: "accept" | "decline") =>
      projectService.respondToInvitation(id!, action),
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (action === "accept") {
        toast.success("Chào mừng bạn gia nhập dự án!");
        navigate(`/projects/${id}`);
      } else {
        toast.success("Đã từ chối lời mời.");
        navigate(ROUTES.PROJECTS);
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      navigate(ROUTES.PROJECTS);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm flex flex-col items-center border border-slate-100">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-slate-600 font-bold">Đang xác thực lời mời...</p>
        </div>
      </div>
    );
  }

  const project = response?.data.project;
  const owner = project?.owner;

  if (error || !project) {
    const errorMsg = getErrorMessage(error);
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
        <div className="max-w-md bg-white p-10 rounded-3xl shadow-xl border border-red-50">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3">
            Lỗi truy cập
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">{errorMsg}</p>
          <Button
            className="w-full h-12 rounded-xl font-bold bg-slate-800 hover:bg-slate-900 shadow-lg shadow-slate-200"
            onClick={() => navigate(ROUTES.PROJECTS)}
          >
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="max-w-[500px] w-full text-center space-y-8">
        {/* Avatar Connection */}
        <div className="flex items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-background shadow-sm overflow-hidden bg-muted">
              {owner?.avatarUrl ? (
                <img
                  src={owner.avatarUrl}
                  alt={owner.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-indigo-100 text-indigo-600">
                  {owner?.displayName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center border shadow-sm">
              <Plus className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>

          <Plus className="w-6 h-6 text-muted-foreground/30" />

          <div className="w-16 h-16 rounded-xl border-2 border-background shadow-sm overflow-hidden bg-muted">
            {project.imageUrl ? (
              <img
                src={project.imageUrl}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-xl font-bold text-white uppercase"
                style={{ backgroundColor: project.color || "#4f46e5" }}
              >
                {project.name?.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <p className="text-lg">
            <span className="font-semibold text-foreground">
              {owner?.displayName || "Một thành viên"}
            </span>{" "}
            mời bạn cộng tác vào{" "}
            <span className="font-semibold text-foreground">
              {project.name}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="px-8 h-10 bg-[#1f883d] hover:bg-[#1a7f37] text-white font-semibold rounded-md shadow-sm transition-colors border-[#1f883d]"
            onClick={() => respondMutation.mutate("accept")}
            disabled={respondMutation.isPending}
          >
            {respondMutation.isPending &&
            respondMutation.variables === "accept" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Chấp nhận lời mời"
            )}
          </Button>
          <Button
            variant="outline"
            className="px-8 h-10 bg-[#f6f8fa] hover:bg-[#f3f4f6] text-[#24292f] border-[#d0d7de] font-semibold rounded-md shadow-sm"
            onClick={() => respondMutation.mutate("decline")}
            disabled={respondMutation.isPending}
          >
            {respondMutation.isPending &&
            respondMutation.variables === "decline" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Từ chối"
            )}
          </Button>
        </div>

        {/* Info/Permissions Section */}
        <div className="pt-8 border-t text-left max-w-[400px] mx-auto space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  Chủ sở hữu của dự án có thể thấy:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Thông tin hồ sơ công khai của bạn</li>
                  <li>Các hoạt động của bạn trong dự án này</li>
                  <li>Trạng thái trực tuyến của bạn</li>
                  <li>Quyền truy cập của bạn đối với tài nguyên dự án</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic text-center">
            Bạn đang nhận được lời mời này vì{" "}
            {owner?.displayName || "một thành viên"} đã thêm email của bạn vào
            dự án.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-12 flex items-center justify-center gap-6 opacity-60 grayscale">
          {/* Add some dummy logos or app logo if available */}
          <p className="text-xs font-medium tracking-widest uppercase">
            ToDoList App &copy; 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;
