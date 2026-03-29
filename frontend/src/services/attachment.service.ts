import api from '@/lib/axios';

// Giả sử Attachment interface đã có trong @/types/task
// Nếu chưa, hãy định nghĩa lại ở nơi sử dụng
import type { Attachment } from '@/types/task';

export const attachmentService = {
  /**
   * Tải một file đính kèm lên cho một task cụ thể
   * POST /api/v1/attachments/task/:taskId
   */
  uploadAttachment: async (taskId: string, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ success: boolean; data: { attachment: Attachment }; message: string }>(
      `/attachments/task/${taskId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    // axios interceptor might unwrap response, but based on common structure:
    const resData: any = response.data;
    if (resData.data && resData.data.attachment) {
      return resData.data.attachment;
    }
    if (resData.attachment) {
      return resData.attachment;
    }

    throw new Error('Không nhận được thông tin đính kèm từ server');
  },

  /**
   * Lấy danh sách file đính kèm của một task
   * GET /api/v1/attachments/task/:taskId
   */
  getTaskAttachments: async (taskId: string): Promise<Attachment[]> => {
    const response = await api.get<{ success: boolean; data: { attachments: Attachment[] }; message: string }>(
      `/attachments/task/${taskId}`
    );
    
    const resData: any = response.data;
    if (resData.data && resData.data.attachments) {
      return resData.data.attachments;
    }
    if (resData.attachments) {
      return resData.attachments;
    }

    return [];
  },

  /**
   * Xóa một file đính kèm
   * DELETE /api/v1/attachments/:attachmentId
   */
  deleteAttachment: async (attachmentId: string): Promise<void> => {
    await api.delete(`/attachments/${attachmentId}`);
  }
};
