import { ApiError } from "@/errors/ApiError";

/** Thrown when MongoDB/Mongoose itself fails — connection issues, an unexpected query error, etc. */
export class DatabaseError extends ApiError {
  constructor(message = "Database operation failed", details?: unknown) {
    super(message, 500, "DATABASE_ERROR", details);
    this.name = "DatabaseError";
  }
}
