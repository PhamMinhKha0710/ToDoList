import api from '@/lib/axios';

export const uploadService = {
  /**
   * Tải một file lên server (chỉ hỗ trợ hình ảnh trong backend hiện tại)
   * @param file File cần upload
   * @returns URL public của file đã upload
   */
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ success: boolean; data: { imageUrl: string }; message: string }>(
      '/upload', 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    // Axios response wrapper -> then our API response structure
    // Sometimes it's response.data, sometimes response.data.data
    const resData: any = response.data;
    if (resData.data && resData.data.imageUrl) {
      return resData.data.imageUrl;
    }
    if (resData.imageUrl) {
      return resData.imageUrl;
    }
    
    throw new Error('Không lấy được URL ảnh từ server');
  },
};
