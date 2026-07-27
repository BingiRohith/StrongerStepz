import { NextResponse } from "next/server";
import { ApiError } from "@/errors/ApiError";

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Consistent success envelope for every route handler. */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Consistent error envelope. Known `ApiError`s (and their subclasses —
 * ValidationError, NotFoundError, ConflictError, DatabaseError) carry their
 * own status code and machine-readable `code`; anything else is treated as
 * an unexpected failure and reported as a generic 500 so internals don't leak.
 *
 * `details` is only ever echoed back for `ValidationError` (Zod's `flatten()`
 * output — safe, client-facing field errors). Other `ApiError` subclasses
 * (notably `DatabaseError`) attach the raw driver/Mongoose error as `details`
 * for logging, which must never reach the client — that's server internals
 * (potentially including connection info or stack traces).
 */
export function apiError(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ApiError) {
    if (error.statusCode >= 500) {
      console.error(error);
    }
    const details = error.code === "VALIDATION_ERROR" ? error.details : undefined;
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message, details } },
      { status: error.statusCode }
    );
  }

  console.error(error);
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    { status: 500 }
  );
}

/** For routes/handlers that exist as scaffolding only — no implementation behind them yet. */
export function apiNotImplemented(message = "Not implemented yet"): NextResponse<ApiErrorBody> {
  return NextResponse.json({ success: false, error: { code: "NOT_IMPLEMENTED", message } }, { status: 501 });
}
