import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    message: string;
    code?: string;
  };
};

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } satisfies ApiSuccessResponse<T>, {
    status,
  });
}

export function jsonError(
  message: string,
  status = 500,
  code?: string,
) {
  return NextResponse.json(
    {
      success: false,
      error: { message, code },
    } satisfies ApiErrorResponse,
    { status },
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonError(error.message, error.status, error.code);
  }

  console.error(error);
  return jsonError("Internal server error", 500, "INTERNAL_ERROR");
}
