import api from '@/lib/axios';
import type { ApiResponse } from '@/types/api';
import type { Project, ProjectStats } from '@/types/project';
import type { CreateProjectPayload, UpdateProjectPayload } from '@/schemas/project.schema';

export const projectService = {
  getProjectStats: async (projectId: string): Promise<ApiResponse<ProjectStats>> => {
    const response = await api.get(`/projects/${projectId}/stats`);
    return response.data;
  },

  getProjects: async (): Promise<ApiResponse<{ projects: Project[] }>> => {
    const response = await api.get('/projects');
    return response.data;
  },

  createProject: async (data: CreateProjectPayload & { 
    file?: File;
    members?: { userId: string; role: 'owner' | 'admin' | 'member' | 'viewer' }[];
  }): Promise<ApiResponse<{ project: Project }>> => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.color) formData.append('color', data.color);
    if (data.imageUrl) formData.append('imageUrl', data.imageUrl);
    if (data.file) formData.append('file', data.file);
    if (data.members) formData.append('members', JSON.stringify(data.members));

    const response = await api.post('/projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getProjectById: async (projectId: string): Promise<ApiResponse<{ project: Project }>> => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  updateProject: async (projectId: string, data: UpdateProjectPayload & { file?: File }): Promise<ApiResponse<{ project: Project }>> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.color) formData.append('color', data.color);
    if (data.imageUrl) formData.append('imageUrl', data.imageUrl);
    if (data.file) formData.append('file', data.file);

    const response = await api.put(`/projects/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteProject: async (projectId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },

  addMember: async (projectId: string, email: string, role?: string): Promise<ApiResponse<{ project: Project }>> => {
    const response = await api.post(`/projects/${projectId}/members`, { email, role });
    return response.data;
  },

  removeMember: async (projectId: string, memberId: string): Promise<ApiResponse<{ project: Project }>> => {
    const response = await api.delete(`/projects/${projectId}/members/${memberId}`);
    return response.data;
  },

  updateMemberRole: async (projectId: string, memberId: string, role: string): Promise<ApiResponse<{ project: Project }>> => {
    const response = await api.put(`/projects/${projectId}/members/${memberId}`, { role });
    return response.data;
  },

  getInvitationDetails: async (projectId: string): Promise<ApiResponse<{ project: Partial<Project> }>> => {
    const response = await api.get(`/projects/${projectId}/invitation`);
    return response.data;
  },

  respondToInvitation: async (projectId: string, action: 'accept' | 'decline'): Promise<ApiResponse<void>> => {
    const response = await api.post(`/projects/${projectId}/invitation/respond`, { action });
    return response.data;
  },

  getInviteCode: async (projectId: string): Promise<ApiResponse<{ inviteCode: string; expiresAt: string }>> => {
    const response = await api.get(`/projects/${projectId}/invite-code`);
    return response.data;
  },

  regenerateInviteCode: async (projectId: string): Promise<ApiResponse<{ inviteCode: string; expiresAt: string }>> => {
    const response = await api.post(`/projects/${projectId}/invite-code/regenerate`);
    return response.data;
  },

  deleteInviteCode: async (projectId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/projects/${projectId}/invite-code`);
    return response.data;
  },

  getProjectByInviteStatus: async (inviteCode: string): Promise<ApiResponse<{ project: any }>> => {
    const response = await api.get(`/projects/invite/code/${inviteCode}`);
    return response.data;
  },

  joinByInviteCode: async (inviteCode: string): Promise<ApiResponse<void>> => {
    const response = await api.post(`/projects/invite/code/${inviteCode}/join`);
    return response.data;
  },
};
