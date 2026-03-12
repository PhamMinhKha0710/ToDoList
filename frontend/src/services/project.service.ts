import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { Project } from '@/types/project';

export const projectService = {
  getProjects: async (): Promise<ApiResponse<{ projects: Project[] }>> => {
    const response = await api.get('/projects');
    return response.data;
  },

  createProject: async (data: { 
    name: string; 
    description?: string; 
    members?: { userId: string; role: 'owner' | 'member' }[];
  }): Promise<ApiResponse<{ project: Project }>> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  getProjectById: async (projectId: string): Promise<ApiResponse<{ project: Project }>> => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  updateProject: async (projectId: string, data: { name?: string; description?: string }): Promise<ApiResponse<{ project: Project }>> => {
    const response = await api.put(`/projects/${projectId}`, data);
    return response.data;
  },

  deleteProject: async (projectId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },

  addMember: async (projectId: string, email: string): Promise<ApiResponse<{ project: Project }>> => {
    const response = await api.post(`/projects/${projectId}/members`, { email });
    return response.data;
  },

  removeMember: async (projectId: string, memberId: string): Promise<ApiResponse<{ project: Project }>> => {
    const response = await api.delete(`/projects/${projectId}/members/${memberId}`);
    return response.data;
  },

  updateMemberRole: async (projectId: string, memberId: string, role: 'owner' | 'member'): Promise<ApiResponse<{ project: Project }>> => {
    const response = await api.put(`/projects/${projectId}/members/${memberId}`, { role });
    return response.data;
  },
};
