export type ApiResponse<T = undefined> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}
