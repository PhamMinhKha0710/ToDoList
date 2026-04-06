export interface User {
  _id: string;
  email: string;
  fullName?: string;
  displayName?: string;
  avatarUrl?: string;
  role: "user" | "admin";
  is2FAEnabled?: boolean;
  isActive: boolean;
}
