import axiosInstance from '@/lib/axios';
import type { Activity } from '@/types/activity';

export const activityService = {
  getProjectActivities: async (projectId: string, limit = 50, offset = 0) => {
    const res = await axiosInstance.get(`/activities/project/${projectId}`, {
      params: { limit, offset }
    });
    return res.data.data.activities as Activity[];
  },
  
  getTaskActivities: async (taskId: string, limit = 50, offset = 0) => {
    const res = await axiosInstance.get(`/activities/task/${taskId}`, {
      params: { limit, offset }
    });
    return res.data.data.activities as Activity[];
  }
};
