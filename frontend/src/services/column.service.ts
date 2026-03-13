import axiosInstance from "@/lib/axios";
import type {
  Column,
  CreateColumnPayload,
  UpdateColumnPayload,
} from "@/types/column";
import type { ApiResponse } from "@/types/api";

export const columnService = {
  getProjectColumns: async (projectId: string): Promise<Column[]> => {
    const response = await axiosInstance.get<
      ApiResponse<{ columns: Column[] }>
    >(`/columns/project/${projectId}`);

    console.log("response: ", response);
    console.log("response.data: ", response.data);
    console.log("response.data.data: ", response.data.data);

    return response.data.data.columns;
  },

  createColumn: async (data: CreateColumnPayload): Promise<Column> => {
    const response = await axiosInstance.post<ApiResponse<Column>>(
      "/columns",
      data,
    );
    return response.data.data;
  },

  updateColumn: async (
    columnId: string,
    data: UpdateColumnPayload,
  ): Promise<Column> => {
    const response = await axiosInstance.put<ApiResponse<Column>>(
      `/columns/${columnId}`,
      data,
    );
    return response.data.data;
  },

  deleteColumn: async (columnId: string): Promise<void> => {
    await axiosInstance.delete(`/columns/${columnId}`);
  },
};
