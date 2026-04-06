import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Users, ShieldCheck, ArrowRight, Layout } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { getErrorMessage } from "@/types/error";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const JoinProjectPage = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projectInvite", inviteCode],
    queryFn: () => projectService.getProjectByInviteStatus(inviteCode!),
    enabled: !!inviteCode,
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: () => projectService.joinByInviteCode(inviteCode!),
    onSuccess: () => {
      toast.success("Tham gia dự án thành công!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (response?.data?.project?._id) {
        navigate(`/projects/${response.data.project._id}`);
      } else {
        navigate("/projects");
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Đang kiểm tra mã mời...</p>
        </div>
      </div>
    );
  }

  if (error || !response?.data?.project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card rounded-3xl p-10 shadow-xl border border-border text-center space-y-6">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            < ShieldCheck className="h-10 w-10 text-destructive opacity-50" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Liên kết không hợp lệ</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mã mời này đã hết hạn hoặc không tồn tại. Vui lòng liên hệ quản trị viên dự án để nhận mã mới.
            </p>
          </div>
          <Button 
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate("/projects")}
          >
            Về trang chủ của tôi
          </Button>
        </div>
      </div>
    );
  }

  const project = response.data.project;
  const owner = project.owner;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="max-w-[480px] w-full bg-card rounded-[2rem] shadow-2xl shadow-primary/5 border border-border overflow-hidden">
        {/* Header/Cover color */}
        <div 
          className="h-24 w-full opacity-80"
          style={{ backgroundColor: project.color || '#4f46e5' }}
        />
        
        <div className="px-8 pb-10 -mt-12">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Project Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-card shadow-xl flex items-center justify-center overflow-hidden border-4 border-card">
                {project.imageUrl ? (
                  <img src={project.imageUrl} className="w-full h-full object-cover" alt={project.name} />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                    style={{ backgroundColor: project.color || '#4f46e5' }}
                  >
                    {project.name?.[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-2 border-white">
                < ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-foreground tracking-tight">{project.name}</h1>
              <p className="text-muted-foreground text-sm line-clamp-2 max-w-[320px] mx-auto">
                {project.description || "Không có mô tả dự án."}
              </p>
            </div>

            {/* Stats/Owner */}
            <div className="flex items-center gap-6 py-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Chủ dự án</span>
                <div className="flex items-center gap-2">
                   <Avatar className="h-6 w-6">
                     <AvatarImage src={owner?.avatarUrl} />
                     <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">{owner?.displayName?.[0]}</AvatarFallback>
                   </Avatar>
                   <span className="text-sm font-semibold text-foreground/80">{owner?.displayName || "Member"}</span>
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Thành viên</span>
                <div className="flex items-center gap-1 text-foreground/80">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-bold">{project.memberCount || 1}</span>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="w-full space-y-4 pt-4">
              <Button 
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 group"
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
              >
                {joinMutation.isPending ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    Tham gia dự án <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              <button 
                className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
                onClick={() => navigate("/projects")}
              >
                Từ chối và quay lại
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-muted/50 p-6 flex flex-col items-center border-t border-border gap-3">
           <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Layout className="h-3 w-3" /> ToDoList Workspace
           </div>
           <p className="text-[10px] text-muted-foreground text-center max-w-[280px]">
             Bằng cách tham gia, bạn đồng ý chia sẻ các hoạt động của mình trong dự án này với các thành viên khác.
           </p>
        </div>
      </div>
    </div>
  );
};

export default JoinProjectPage;
