import { Counter } from "@/models/Counter";
import { connectToDatabase } from "@/lib/db/connect";
import { DatabaseError } from "@/errors/DatabaseError";

const PREFIX = "SS";

/**
 * Produces human-readable registration numbers like `SS-2026-000001` — the
 * public-facing identifier registrants and admins use instead of a Mongo
 * ObjectId. One counter document per calendar year, incremented atomically
 * via `$inc` so concurrent registrations can never collide, and the
 * sequence naturally restarts at 1 each new year.
 */
export class RegistrationNumberGenerator {
  async generate(now: Date = new Date()): Promise<string> {
    await connectToDatabase();
    const year = now.getUTCFullYear();
    const key = `registration-${year}`;

    let counter: { _id: string; seq: number } | null;
    try {
      counter = await Counter.findByIdAndUpdate(key, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" })
        .lean<{ _id: string; seq: number }>()
        .exec();
    } catch (error) {
      throw new DatabaseError("Failed to generate registration number", error);
    }

    if (!counter) {
      throw new DatabaseError("Registration number counter increment returned no document");
    }

    return `${PREFIX}-${year}-${String(counter.seq).padStart(6, "0")}`;
  }
}
