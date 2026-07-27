import { ApiError } from "@/errors/ApiError";

/** Thrown when a lookup by id/slug/key finds nothing. */
export class NotFoundError extends ApiError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, 404, "NOT_FOUND", details);
    this.name = "NotFoundError";
  }
}
