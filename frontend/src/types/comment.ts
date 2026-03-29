import type { User } from './user';

export interface Comment {
  _id: string;
  taskId: string;
  authorId: User; // Populated from backend
  content: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentPayload {
  taskId: string;
  content: string;
  parentId?: string | null;
  mentions?: string[];
}

export interface UpdateCommentPayload {
  content: string;
}
