import type { User } from './user';

export interface Activity {
  _id: string;
  projectId: string;
  userId: User;
  action: string;
  entityType: string;
  entityId: string;
  detail: string; // JSON string
  createdAt: string;
}
