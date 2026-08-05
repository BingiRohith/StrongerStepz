import mongoose, { Types } from "mongoose";
import { RegistrationRepository } from "@/repositories/RegistrationRepository";
import { WorkshopRepository } from "@/repositories/WorkshopRepository";
import { PaymentRepository } from "@/repositories/PaymentRepository";
import { QuestionnaireResponseRepository } from "@/repositories/QuestionnaireResponseRepository";
import { FeedbackResponseRepository } from "@/repositories/FeedbackResponseRepository";
import { RegistrationNumberGenerator } from "@/services/RegistrationNumberGenerator";
import { SUCCESSFUL_REGISTRATION_STATUSES, type RegistrationDocument } from "@/models/Registration";
import { NotFoundError } from "@/errors/NotFoundError";
import { ConflictError } from "@/errors/ConflictError";
import { connectToDatabase } from "@/lib/db/connect";
import type { CreateRegistrationInput, ListRegistrationsQuery } from "@/validators/registration.schema";

export interface RegistrationStats {
  /** Count of registrations in any status counted as a "successful registration" — see `SUCCESSFUL_REGISTRATION_STATUSES`. */
  registered: number;
  /** Count of registrations that have joined the WhatsApp community (clicked through post-download). */
  community: number;
}

/** True for the specific Mongo/Mongoose error transactions throw on a deployment without replica-set support (e.g. standalone `mongod`). */
function isTransactionsUnsupportedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.includes("This MongoDB deployment does not support retryable writes") ||
    message.includes("IllegalOperation")
  );
}

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

  /** Mirrors the `registrationLimit` capacity check in `register()` — backs the public "Limited Seats" CTA notice. `null` limit means unlimited seats. */
  async hasAvailableSeats(workshopId: string, registrationLimit: number | null | undefined): Promise<boolean> {
    if (registrationLimit == null) {
      return true;
    }
    const currentCount = await this.repository.countByWorkshop(workshopId);
    return currentCount < registrationLimit;
  }

  /** Backs the homepage "Registered Members" / "Joined WhatsApp & Accessed Tools" live stats bar — always a fresh count, never cached. */
  async getStats(): Promise<RegistrationStats> {
    const [registered, community] = await Promise.all([
      this.repository.count({ status: { $in: SUCCESSFUL_REGISTRATION_STATUSES } }),
      this.repository.count({ joinedCommunity: true }),
    ]);
    return { registered, community };
  }

  /** Idempotent: repeated calls (refresh, double-click) just re-set the same `true` — the stat above counts documents, not events. */
  async joinCommunity(id: string): Promise<void> {
    const updated = await this.repository.updateById(id, { joinedCommunity: true });
    if (!updated) {
      throw new NotFoundError(`Registration "${id}" not found`);
    }
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

  /**
   * Cascading delete: removes every Payment, QuestionnaireResponse, and
   * FeedbackResponse linked to this registration, then the registration
   * itself — no orphan records left behind. Uses a Mongo transaction when
   * the deployment supports one (any replica set, including every MongoDB
   * Atlas tier); falls back to sequential deletes otherwise. The fallback
   * still deletes the registration *last*, so a partial failure never
   * leaves it stranded without its (now-deleted) dependents, and every step
   * is a filter-based delete — safe to simply retry `delete()` again if it
   * fails partway.
   */
  async delete(id: string): Promise<void> {
    await this.getById(id);
    const registrationId = new Types.ObjectId(id);

    await connectToDatabase();
    const session = await mongoose.startSession();
    try {
      let transacted = false;
      try {
        await session.withTransaction(async () => {
          await this.paymentRepository.deleteMany({ registrationId }, session);
          await this.questionnaireResponseRepository.deleteMany({ registrationId }, session);
          await this.feedbackResponseRepository.deleteMany({ registrationId }, session);
          await this.repository.deleteById(id, session);
        });
        transacted = true;
      } catch (error) {
        if (!isTransactionsUnsupportedError(error)) {
          throw error;
        }
      }

      if (!transacted) {
        await this.paymentRepository.deleteMany({ registrationId });
        await this.questionnaireResponseRepository.deleteMany({ registrationId });
        await this.feedbackResponseRepository.deleteMany({ registrationId });
        await this.repository.deleteById(id);
      }
    } finally {
      await session.endSession();
    }
  }
}
