import { ApiError } from "@/errors/ApiError";

/** Thrown when a Zod schema (or any input check) rejects the payload. */
export class ValidationError extends ApiError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}
