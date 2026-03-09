export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  projects: {
    all: () => ['projects'],
    detail: (id: string) => ['projects', id],
    members: (id: string) => ['projects', id, 'members'],
    activity: (id: string) => ['projects', id, 'activity'],
  },
  columns: {
    byProject: (projectId: string) => ['columns', projectId],
  },
  tasks: {
    byColumn: (columnId: string) => ['tasks', columnId],
    detail: (id: string) => ['tasks', id],
  },
  comments: {
    byTask: (taskId: string) => ['comments', taskId],
  },
  attachments: {
    byTask: (taskId: string) => ['attachments', taskId],
  },
  notifications: {
    all: () => ['notifications'],
  },
  personalTasks: {
    all: () => ['personal-tasks'],
    detail: (id: string) => ['personal-tasks', id],
  },
  users: {
    search: (q: string) => ['users', 'search', q],
  },
} as const
