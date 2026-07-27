import type { NextRequest, NextResponse } from "next/server";
import { apiError, type ApiErrorBody, type ApiSuccessBody } from "@/api/response";

type RouteHandler = (request: NextRequest) => Promise<NextResponse<ApiSuccessBody<unknown> | ApiErrorBody>>;

/**
 * Wraps a route handler so any thrown error — `ApiError` subclasses or
 * anything unexpected — is caught once and turned into the standard error
 * envelope, instead of every handler needing its own try/catch.
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      return apiError(error);
    }
  };
}

type RouteContext<P> = { params: Promise<P> };
type ParamsRouteHandler<P> = (
  request: NextRequest,
  context: RouteContext<P>
) => Promise<NextResponse<ApiSuccessBody<unknown> | ApiErrorBody>>;

/** Same as `withErrorHandling`, for dynamic routes ([id], [slug], …) whose handler also receives `{ params }`. */
export function withParamsErrorHandling<P>(handler: ParamsRouteHandler<P>): ParamsRouteHandler<P> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return apiError(error);
    }
  };
}
