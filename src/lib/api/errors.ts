export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number = 500,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string, code?: string) {
    return new ApiError(message, 400, code);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Forbidden", code?: string) {
    return new ApiError(message, 403, code ?? "FORBIDDEN");
  }

  static notFound(message = "Not found") {
    return new ApiError(message, 404, "NOT_FOUND");
  }

  static conflict(message: string, code?: string) {
    return new ApiError(message, 409, code);
  }
}
