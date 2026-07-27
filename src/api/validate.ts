import type { ZodType } from "zod";
import { ValidationError } from "@/errors/ValidationError";

/** Parses `data` against `schema`, throwing a `ValidationError` (caught by `withErrorHandling`) on failure. */
export function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Validation failed", result.error.flatten());
  }
  return result.data;
}
