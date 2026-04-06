import axiosInstance from "@/lib/axios";
import type {
  Column,
} from "@/types/column";
import type {
  CreateColumnPayload,
  UpdateColumnPayload,
} from "@/schemas/column.schema";
import type { ApiResponse } from "@/types/api";

export const columnService = {
  getProjectColumns: async (projectId: string): Promise<Column[]> => {
    const response = await axiosInstance.get<
      ApiResponse<{ columns: Column[] }>
    >(`/columns/project/${projectId}`);

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

  reorderColumns: async (
    projectId: string,
    orderedColumnIds: string[],
  ): Promise<Column[]> => {
    const response = await axiosInstance.put<ApiResponse<{ columns: Column[] }>>(
      `/columns/project/${projectId}/reorder`,
      { orderedColumnIds },
    );
    return response.data.data.columns;
  },

  getColumnById: async (columnId: string): Promise<Column> => {
    const response = await axiosInstance.get<ApiResponse<{ column: Column }>>(
      `/columns/${columnId}`,
    );
    return response.data.data.column;
  },
};
