import type { User } from './user';

export interface ProjectMember {
  userId: string | User;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending';
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  color?: string;
  members: ProjectMember[];
  columnOrder: string[];
  owner?: User;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}
