import { AxiosError } from "axios";

export interface ApiErrorResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
}

/**
 * Custom Axios Error type that includes the backend's standard error response structure
 */
export type AppAxiosError = AxiosError<ApiErrorResponse>;

/**
 * Helper to safely extract an error message from a caught error
 */
export const getErrorMessage = (error: unknown): string => {
  const axiosError = error as AppAxiosError;
  return (
    axiosError.response?.data?.message ||
    (error as Error).message ||
    "Đã có lỗi xảy ra."
  );
};
