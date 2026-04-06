import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type {
  PersonalTask,
  CreatePersonalTaskInput,
  UpdatePersonalTaskInput,
  SubTask,
} from "@/types/personalTask";

/** MongoDB ObjectId hex string — invalid ids (e.g. temp-*) must be omitted so the server can assign new ones */
const MONGO_OBJECT_ID_HEX = /^[0-9a-fA-F]{24}$/;

function sanitizeSubTasksForApi(subTasks: SubTask[]): Array<Omit<SubTask, "_id"> & { _id?: string }> {
  return subTasks.map((s) => {
    if (s._id && MONGO_OBJECT_ID_HEX.test(s._id)) {
      return s;
    }
    const { _id, ...rest } = s;
    void _id;
    return rest;
  });
}

function sanitizePersonalTaskUpdatePayload(data: UpdatePersonalTaskInput): UpdatePersonalTaskInput {
  if (!data.subTasks?.length) return data;
  return { ...data, subTasks: sanitizeSubTasksForApi(data.subTasks) as SubTask[] };
}

export const personalTaskService = {
  createPersonalTask: async (data: CreatePersonalTaskInput): Promise<PersonalTask> => {
    const response = await axiosInstance.post<ApiResponse<{ task: PersonalTask }>>(
      "/personal-tasks",
      data
    );
    return response.data.data.task;
  },

  getPersonalTasks: async (): Promise<PersonalTask[]> => {
    const response = await axiosInstance.get<ApiResponse<{ tasks: PersonalTask[] }>>(
      "/personal-tasks"
    );
    return response.data.data.tasks;
  },

  getPersonalTaskById: async (taskId: string): Promise<PersonalTask> => {
    const response = await axiosInstance.get<ApiResponse<{ task: PersonalTask }>>(
      `/personal-tasks/${taskId}`
    );
    return response.data.data.task;
  },

  updatePersonalTask: async (
    taskId: string,
    data: UpdatePersonalTaskInput
  ): Promise<PersonalTask> => {
    const body = sanitizePersonalTaskUpdatePayload(data);
    const response = await axiosInstance.put<ApiResponse<{ task: PersonalTask }>>(
      `/personal-tasks/${taskId}`,
      body
    );
    return response.data.data.task;
  },

  deletePersonalTask: async (taskId: string): Promise<void> => {
    await axiosInstance.delete(`/personal-tasks/${taskId}`);
  },
};
