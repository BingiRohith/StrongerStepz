import { ApiError } from "@/errors/ApiError";

/** Thrown on a uniqueness clash — e.g. a duplicate MongoDB key (E11000), same email registering twice for one workshop. */
export class ConflictError extends ApiError {
  constructor(message = "Resource conflict", details?: unknown) {
    super(message, 409, "CONFLICT", details);
    this.name = "ConflictError";
  }
}
