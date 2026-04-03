import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth.store";

// Pages — lazy import để tối ưu bundle size
import { lazy } from "react";

const LoginPage = lazy(() => import("@/page/LoginPage"));
const RegisterPage = lazy(() => import("@/page/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/page/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/page/ResetPasswordPage"));
const ProjectsPage = lazy(() => import("@/page/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("@/page/ProjectDetailPage"));
const CalendarPage = lazy(() => import("@/page/CalendarPage"));
const PersonalTasksPage = lazy(() => import("@/page/PersonalTasksPage"));
const ProfilePage = lazy(() => import("@/page/ProfilePage"));
const AdminUsersPage = lazy(() => import("@/page/admin/AdminUsersPage"));
const AdminProjectsPage = lazy(() => import("@/page/admin/AdminProjectsPage"));
const AdminDashboardPage = lazy(() => import("@/page/admin/AdminDashboardPage"));

const RoleRedirect = () => {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (user.role === "admin") return <Navigate to={ROUTES.ADMIN} replace />;
  return <Navigate to={ROUTES.PROJECTS} replace />;
};
const InvitationPage = lazy(() => import("@/page/InvitationPage"));
const TaskDetailPage = lazy(() => import("@/page/TaskDetailPage"));

export const router = createBrowserRouter([
  // ─── Guest routes ──────────────────────────────────────────────────
  { path: ROUTES.HOME, element: <RoleRedirect /> },
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.REGISTER, element: <RegisterPage /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
  { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },

  // ─── Protected routes ──────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: ROUTES.PROJECTS, element: <ProjectsPage /> },
      { path: "/projects/:id/invite", element: <InvitationPage /> },
      { path: "/projects/:id", element: <ProjectDetailPage /> },
      { path: ROUTES.CALENDAR, element: <CalendarPage /> },
      { path: "/tasks/:id", element: <TaskDetailPage /> },
      { path: ROUTES.MY_TASKS, element: <PersonalTasksPage /> },
      { path: ROUTES.PROFILE, element: <ProfilePage /> },
    ],
  },

  // ─── Admin-only routes ─────────────────────────────────────────────
  {
    element: <AdminRoute />,
    children: [
      { path: ROUTES.ADMIN, element: <AdminDashboardPage /> },
      { path: ROUTES.ADMIN_USERS, element: <AdminUsersPage /> },
      { path: ROUTES.ADMIN_PROJECTS, element: <AdminProjectsPage /> },
    ],
  },

  // 404
  { path: "*", element: <Navigate to={ROUTES.PROJECTS} replace /> },
]);
