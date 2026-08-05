import { Types } from "mongoose";
import { FeedbackResponseRepository } from "@/repositories/FeedbackResponseRepository";
import { FeedbackFormRepository } from "@/repositories/FeedbackFormRepository";
import { RegistrationRepository } from "@/repositories/RegistrationRepository";
import type { FeedbackResponseDocument, FeedbackAnswer } from "@/models/FeedbackResponse";
import type { FeedbackFormField } from "@/models/FeedbackForm";
import { NotFoundError } from "@/errors/NotFoundError";
import { ValidationError } from "@/errors/ValidationError";
import type { PaginatedResult } from "@/types/pagination";
import type {
  ListFeedbackResponsesQuery,
  SubmitFeedbackResponseEnvelopeInput,
} from "@/validators/feedbackResponse.schema";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

/**
 * Validates one submitted answer against its field definition. Unlike every
 * other module, this schema isn't a static Zod object — it's the
 * `FeedbackForm` document's `fields[]`, which is admin-authored data, not
 * code (§9). Returns an error message, or `null` if the answer is valid.
 */
function validateAnswer(field: FeedbackFormField, value: unknown): string | null {
  if (field.required && isEmpty(value)) {
    return `${field.label} is required`;
  }
  if (isEmpty(value)) {
    return null;
  }

  switch (field.type) {
    case "single_select":
      if (typeof value !== "string" || !field.options?.includes(value)) {
        return `${field.label} must be one of the provided options`;
      }
      return null;
    case "multi_select":
      if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && field.options?.includes(item))) {
        return `${field.label} must be a list of the provided options`;
      }
      return null;
    case "rating":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return `${field.label} must be a number`;
      }
      return null;
    case "boolean":
      if (typeof value !== "boolean") {
        return `${field.label} must be true or false`;
      }
      return null;
    case "text":
    case "textarea":
    default:
      if (typeof value !== "string") {
        return `${field.label} must be text`;
      }
      return null;
  }
}

/**
 * Business-logic layer for feedback submissions. The route only validates
 * the envelope shape (which form, which keys/values); this service loads
 * the referenced `FeedbackForm` and checks the answers against its `fields[]`
 * by hand, matching Zod's `.flatten()` error shape so `apiError()` and the
 * admin form's existing fieldErrors-mapping logic both work unmodified.
 */
export class FeedbackResponseService {
  constructor(
    protected readonly repository: FeedbackResponseRepository = new FeedbackResponseRepository(),
    protected readonly formRepository: FeedbackFormRepository = new FeedbackFormRepository(),
    protected readonly registrationRepository: RegistrationRepository = new RegistrationRepository()
  ) {}

  async submit(input: SubmitFeedbackResponseEnvelopeInput): Promise<FeedbackResponseDocument> {
    const form = await this.formRepository.findById(input.formId);
    if (!form || !form.isActive) {
      throw new NotFoundError(`Feedback form "${input.formId}" not found`);
    }

    const fieldsByKey = new Map(form.fields.map((field) => [field.key, field]));
    const answersByKey = new Map(input.answers.map((answer) => [answer.fieldKey, answer.value]));
    const fieldErrors: Record<string, string[]> = {};

    for (const field of form.fields) {
      const error = validateAnswer(field, answersByKey.get(field.key));
      if (error) {
        fieldErrors[field.key] = [error];
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidationError("Validation failed", { fieldErrors });
    }

    // Snapshot each field's current label alongside its answer — a later
    // edit/removal of the form field must never change how this submission
    // renders (§3/§9 of the plan).
    const answers: FeedbackAnswer[] = input.answers.map((answer) => ({
      fieldKey: answer.fieldKey,
      label: fieldsByKey.get(answer.fieldKey)?.label,
      value: answer.value,
    }));

    const registration = input.registrationId ? await this.registrationRepository.findById(input.registrationId) : null;

    return this.repository.create({
      formId: new Types.ObjectId(input.formId),
      registrationId: input.registrationId ? new Types.ObjectId(input.registrationId) : undefined,
      workshopId: registration?.workshopId,
      answers,
    });
  }

  /** Real skip/limit pagination — this collection is unbounded and append-only (§11 risk note). */
  async list(query: ListFeedbackResponsesQuery = {}): Promise<PaginatedResult<FeedbackResponseDocument>> {
    const filter: Partial<Pick<FeedbackResponseDocument, "formId" | "workshopId">> = {};
    if (query.formId) filter.formId = new Types.ObjectId(query.formId);
    if (query.workshopId) filter.workshopId = new Types.ObjectId(query.workshopId);
    return this.repository.findPaginated(filter, query.page ?? DEFAULT_PAGE, query.limit ?? DEFAULT_LIMIT);
  }

  /** Unbounded read for the future .xlsx export route (columns derived from the form's fields[] at export time). */
  async listAll(formId?: string, workshopId?: string): Promise<FeedbackResponseDocument[]> {
    const filter: Partial<Pick<FeedbackResponseDocument, "formId" | "workshopId">> = {};
    if (formId) filter.formId = new Types.ObjectId(formId);
    if (workshopId) filter.workshopId = new Types.ObjectId(workshopId);
    return this.repository.findMany(filter);
  }

  async getById(id: string): Promise<FeedbackResponseDocument> {
    const response = await this.repository.findById(id);
    if (!response) {
      throw new NotFoundError(`Feedback response "${id}" not found`);
    }
    return response;
  }
}
