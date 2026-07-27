/**
 * Base class for every error the backend deliberately throws. `src/api/response.ts`
 * checks `instanceof ApiError` to turn a thrown error into a consistent JSON
 * shape with the right HTTP status — anything that isn't an `ApiError` falls
 * back to a generic 500 so internals never leak to a client.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
