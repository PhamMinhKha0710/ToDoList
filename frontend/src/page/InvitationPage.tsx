import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import { Loader2, Users, AlertCircle } from "lucide-react";
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
        toast.success("Bạn đã chấp nhận lời mời tham gia dự án!");
        navigate(`/projects/${id}`);
      } else {
        toast.success("Bạn đã từ chối lời mời.");
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
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Đang tải thông tin lời mời...</p>
      </div>
    );
  }

  const project = response?.data.project;
  console.log("project: ", project);

  if (error || !project) {
    const errorMsg = getErrorMessage(error);
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Lỗi truy cập</h2>
        <p className="text-muted-foreground mb-6">{errorMsg}</p>
        <Button onClick={() => navigate(ROUTES.PROJECTS)}>
          Quay lại danh sách dự án
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-muted/30 p-4">
      <div className="max-w-md w-full bg-background rounded-xl shadow-lg border overflow-hidden">
        {project.imageUrl && (
          <div className="h-32 w-full bg-muted relative">
            <img
              src={project.imageUrl}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8 text-center">
          {!project.imageUrl && (
            <div
              className="h-20 w-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-sm"
              style={{ backgroundColor: project.color || "#3b82f6" }}
            >
              {project.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Lời mời tham gia dự án
          </h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Bạn đã được mời tham gia vào dự án{" "}
            <strong className="text-foreground">{project.name}</strong>.
            {project.description && (
              <span className="block mt-2 italic text-muted-foreground/80">
                "{project.description}"
              </span>
            )}
          </p>

          <div className="space-y-3 pt-2 border-t">
            <Button
              className="w-full text-md h-11"
              onClick={() => respondMutation.mutate("accept")}
              disabled={respondMutation.isPending}
            >
              {respondMutation.isPending &&
                respondMutation.variables === "accept" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
              Chấp nhận tham gia
            </Button>
            <Button
              variant="outline"
              className="w-full text-md h-11"
              onClick={() => respondMutation.mutate("decline")}
              disabled={respondMutation.isPending}
            >
              {respondMutation.isPending &&
                respondMutation.variables === "decline" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
              Từ chối lời mời
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;
