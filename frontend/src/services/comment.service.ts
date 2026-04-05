import axiosInstance from '@/lib/axios';
import type { Comment, CreateCommentPayload, UpdateCommentPayload } from '@/types/comment';

export const commentService = {
  getCommentsByTaskId: async (taskId: string): Promise<Comment[]> => {
    const { data } = await axiosInstance.get(`/comments/task/${taskId}`);
    return data.data.comments;
  },

  createComment: async (payload: CreateCommentPayload): Promise<Comment> => {
    const { data } = await axiosInstance.post('/comments', payload);
    return data.data.comment;
  },

  updateComment: async (commentId: string, payload: UpdateCommentPayload): Promise<Comment> => {
    const { data } = await axiosInstance.put(`/comments/${commentId}`, payload);
    return data.data.comment;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await axiosInstance.delete(`/comments/${commentId}`);
  },
};
