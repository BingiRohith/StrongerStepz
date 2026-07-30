import { Types } from "mongoose";
import { QuestionnaireResponseRepository } from "@/repositories/QuestionnaireResponseRepository";
import { RegistrationRepository } from "@/repositories/RegistrationRepository";
import type { QuestionnaireResponseDocument } from "@/models/QuestionnaireResponse";
import { NotFoundError } from "@/errors/NotFoundError";
import { ConflictError } from "@/errors/ConflictError";
import type { PaginatedResult } from "@/types/pagination";
import type {
  CreateQuestionnaireResponseInput,
  ListQuestionnaireResponsesQuery,
} from "@/validators/questionnaireResponse.schema";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Business-logic layer for questionnaire responses. `registrationId` is
 * required + a normal (non-unique) index on the model — the "one submission
 * per registration" rule is enforced here via `findByRegistrationId()`
 * rather than a unique Mongo index, so it stays easy to relax later.
 */
export class QuestionnaireResponseService {
  constructor(
    protected readonly repository: QuestionnaireResponseRepository = new QuestionnaireResponseRepository(),
    protected readonly registrationRepository: RegistrationRepository = new RegistrationRepository()
  ) {}

  async submit(input: CreateQuestionnaireResponseInput): Promise<QuestionnaireResponseDocument> {
    const registration = await this.registrationRepository.findById(input.registrationId);
    if (!registration) {
      throw new NotFoundError(`Registration "${input.registrationId}" not found`);
    }

    // Blocks a paid registrant from submitting before payment is verified —
    // free registrations are confirmed immediately at registration time.
    if (registration.status !== "confirmed") {
      throw new ConflictError("This registration is not confirmed yet. Please complete payment first.");
    }

    const existing = await this.repository.findByRegistrationId(input.registrationId);
    if (existing) {
      throw new ConflictError("This registration has already submitted the questionnaire");
    }

    return this.repository.create({
      registrationId: new Types.ObjectId(input.registrationId),
      question1Answer: input.question1Answer,
      question1OtherText: input.question1OtherText,
      question2Answer: input.question2Answer,
      question2OtherText: input.question2OtherText,
      question3Answer: input.question3Answer,
    });
  }

  /** Real skip/limit pagination — this collection is unbounded and append-only (§11 risk note). */
  async list(query: ListQuestionnaireResponsesQuery = {}): Promise<PaginatedResult<QuestionnaireResponseDocument>> {
    const filter: Partial<Pick<QuestionnaireResponseDocument, "registrationId">> = {};
    if (query.registrationId) filter.registrationId = new Types.ObjectId(query.registrationId);
    return this.repository.findPaginated(filter, query.page ?? DEFAULT_PAGE, query.limit ?? DEFAULT_LIMIT);
  }

  /** Unbounded read for the future .xlsx export route — mirrors how `RegistrationService.list()` feeds `buildRegistrationsWorkbook`. */
  async listAll(registrationId?: string): Promise<QuestionnaireResponseDocument[]> {
    const filter: Partial<Pick<QuestionnaireResponseDocument, "registrationId">> = {};
    if (registrationId) filter.registrationId = new Types.ObjectId(registrationId);
    return this.repository.findMany(filter);
  }

  async getById(id: string): Promise<QuestionnaireResponseDocument> {
    const response = await this.repository.findById(id);
    if (!response) {
      throw new NotFoundError(`Questionnaire response "${id}" not found`);
    }
    return response;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError(`Questionnaire response "${id}" not found`);
    }
  }
}
