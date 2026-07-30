import { Types } from "mongoose";
import { RegistrationRepository } from "@/repositories/RegistrationRepository";
import { WorkshopRepository } from "@/repositories/WorkshopRepository";
import { PaymentRepository } from "@/repositories/PaymentRepository";
import { QuestionnaireResponseRepository } from "@/repositories/QuestionnaireResponseRepository";
import { FeedbackResponseRepository } from "@/repositories/FeedbackResponseRepository";
import { RegistrationNumberGenerator } from "@/services/RegistrationNumberGenerator";
import type { RegistrationDocument } from "@/models/Registration";
import { NotFoundError } from "@/errors/NotFoundError";
import { ConflictError } from "@/errors/ConflictError";
import type { CreateRegistrationInput, ListRegistrationsQuery } from "@/validators/registration.schema";

/**
 * Business-logic layer for registrations. This is where the rules from the
 * Phase 6 spec actually live — everything below `register()`'s first line
 * is a rule, not plumbing:
 *   1. the workshop must exist
 *   2. the workshop must be published and within its registration window
 *   3. the same mobile number can't register twice for the same workshop
 *   4. a workshop's `registrationLimit` (if set) can't be exceeded
 *   5. every registration gets a human-readable registration number
 *   6. new registrations default to "pending_payment"
 */
export class RegistrationService {
  constructor(
    protected readonly repository: RegistrationRepository = new RegistrationRepository(),
    protected readonly workshopRepository: WorkshopRepository = new WorkshopRepository(),
    protected readonly numberGenerator: RegistrationNumberGenerator = new RegistrationNumberGenerator(),
    protected readonly paymentRepository: PaymentRepository = new PaymentRepository(),
    protected readonly questionnaireResponseRepository: QuestionnaireResponseRepository = new QuestionnaireResponseRepository(),
    protected readonly feedbackResponseRepository: FeedbackResponseRepository = new FeedbackResponseRepository()
  ) {}

  async list(query: ListRegistrationsQuery = {}): Promise<RegistrationDocument[]> {
    const filter: Partial<Pick<RegistrationDocument, "workshopId" | "status" | "paymentStatus" | "joinedCommunity">> =
      {};
    if (query.workshopId) filter.workshopId = new Types.ObjectId(query.workshopId);
    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.joinedCommunity !== undefined) filter.joinedCommunity = query.joinedCommunity;
    return this.repository.findMany(filter);
  }

  async getById(id: string): Promise<RegistrationDocument> {
    const registration = await this.repository.findById(id);
    if (!registration) {
      throw new NotFoundError(`Registration "${id}" not found`);
    }
    return registration;
  }

  async register(input: CreateRegistrationInput): Promise<RegistrationDocument> {
    const workshop = await this.workshopRepository.findById(input.workshopId);
    if (!workshop) {
      throw new NotFoundError(`Workshop "${input.workshopId}" not found`);
    }

    if (workshop.status !== "published") {
      throw new ConflictError("This workshop is not open for registration");
    }

    const now = new Date();
    if (workshop.registrationOpenDate && now < workshop.registrationOpenDate) {
      throw new ConflictError("Registration for this workshop has not opened yet");
    }
    if (workshop.registrationCloseDate && now > workshop.registrationCloseDate) {
      throw new ConflictError("Registration for this workshop has closed");
    }

    const existing = await this.repository.findByWorkshopAndPhone(input.workshopId, input.phone);
    if (existing) {
      throw new ConflictError("This mobile number has already registered for this workshop");
    }

    if (workshop.registrationLimit != null) {
      const currentCount = await this.repository.countByWorkshop(input.workshopId);
      if (currentCount >= workshop.registrationLimit) {
        throw new ConflictError("This workshop has reached its registration limit");
      }
    }

    const registrationNumber = await this.numberGenerator.generate();

    // Free workshops have no payment step, so the registration is confirmed
    // immediately ("₹0 payment / automatic success"); paid workshops stay
    // "pending_payment" until PaymentService marks them paid.
    return this.repository.create({
      workshopId: workshop._id,
      registrationNumber,
      name: input.name,
      email: input.email,
      phone: input.phone,
      age: input.age,
      gender: input.gender,
      city: input.city,
      preferredLanguage: input.preferredLanguage,
      source: input.source ?? "landing-page",
      status: workshop.price > 0 ? "pending_payment" : "confirmed",
    });
  }

  /** Blocks deletion (rather than cascading) whenever a Payment, QuestionnaireResponse, or FeedbackResponse still references this registration. */
  async delete(id: string): Promise<void> {
    await this.getById(id);

    const [paymentCount, questionnaireResponse, feedbackResponseCount] = await Promise.all([
      this.paymentRepository.count({ registrationId: new Types.ObjectId(id) }),
      this.questionnaireResponseRepository.findByRegistrationId(id),
      this.feedbackResponseRepository.count({ registrationId: new Types.ObjectId(id) }),
    ]);

    const blockers: string[] = [];
    if (paymentCount > 0) blockers.push("payment record");
    if (questionnaireResponse) blockers.push("questionnaire response");
    if (feedbackResponseCount > 0) blockers.push("feedback response");

    if (blockers.length > 0) {
      throw new ConflictError(
        `Cannot delete this registration because it has an associated ${blockers.join(", ")}. Remove those records first.`
      );
    }

    await this.repository.deleteById(id);
  }
}
