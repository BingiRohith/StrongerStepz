import { ApiError } from "@/errors/ApiError";

/** Thrown when a request has no valid admin session — missing/expired/invalid JWT. */
export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required", details?: unknown) {
    super(message, 401, "UNAUTHORIZED", details);
    this.name = "UnauthorizedError";
  }
}
