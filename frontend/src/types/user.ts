export interface User {
  _id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: "user" | "admin";
  isActive: boolean;
}
