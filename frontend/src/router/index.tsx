import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { ROUTES } from "@/constants/routes";

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
const AdminUsersPage = lazy(() => import("@/page/AdminUsersPage"));
const AdminProjectsPage = lazy(() => import("@/page/AdminProjectsPage"));
const InvitationPage = lazy(() => import("@/page/InvitationPage"));
const GoogleCallbackPage = lazy(() => import("@/page/GoogleCallbackPage"));

export const router = createBrowserRouter([
  // ─── Guest routes ──────────────────────────────────────────────────
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.REGISTER, element: <RegisterPage /> },
  { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
  { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
  { path: ROUTES.GOOGLE_CALLBACK, element: <GoogleCallbackPage /> },

  // ─── Protected routes ──────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <Navigate to={ROUTES.PROJECTS} replace /> },
      { path: ROUTES.PROJECTS, element: <ProjectsPage /> },
      { path: "/projects/:id/invite", element: <InvitationPage /> },
      { path: "/projects/:id", element: <ProjectDetailPage /> },
      { path: ROUTES.CALENDAR, element: <CalendarPage /> },
      { path: ROUTES.MY_TASKS, element: <PersonalTasksPage /> },
      { path: ROUTES.PROFILE, element: <ProfilePage /> },
    ],
  },

  // ─── Admin-only routes ─────────────────────────────────────────────
  {
    element: <AdminRoute />,
    children: [
      { path: ROUTES.ADMIN_USERS, element: <AdminUsersPage /> },
      { path: ROUTES.ADMIN_PROJECTS, element: <AdminProjectsPage /> },
    ],
  },

  // 404
  { path: "*", element: <Navigate to={ROUTES.PROJECTS} replace /> },
]);
