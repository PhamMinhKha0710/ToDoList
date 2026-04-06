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
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface PriorityDistribution {
  name: string;
  value: number;
  color: string;
}

export interface MemberDistribution {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  taskCount: number;
  completedCount: number;
}

export interface ProjectStats {
  summary: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    memberCount: number;
  };
  statusDistribution: StatusDistribution[];
  priorityDistribution: PriorityDistribution[];
  memberDistribution: MemberDistribution[];
}
