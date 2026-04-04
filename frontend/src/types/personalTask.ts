export interface SubTask {
  _id: string;
  title: string;
  status: 'todo' | 'done';
  color?: string;
  position: number;
  createdAt: string;
}

export interface PersonalTask {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  color?: string;
  subTasks: SubTask[];
  createdAt: string;
  updatedAt: string;
}

export type PersonalTaskPriority = PersonalTask['priority'];
export type PersonalTaskStatus = PersonalTask['status'];

export interface CreatePersonalTaskInput {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  priority?: PersonalTaskPriority;
  status?: PersonalTaskStatus;
  color?: string;
}

export interface UpdatePersonalTaskInput extends Partial<CreatePersonalTaskInput> {
  subTasks?: SubTask[];
}
