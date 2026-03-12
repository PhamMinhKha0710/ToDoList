import type { User } from './user';

export interface ProjectMember {
  userId: string | User;
  role: 'owner' | 'member';
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  members: ProjectMember[];
  columnOrder: string[];
  createdAt: string;
  updatedAt: string;
}
