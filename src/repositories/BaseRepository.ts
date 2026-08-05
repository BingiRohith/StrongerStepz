import type { ClientSession, Model, QueryFilter, UpdateQuery } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { ConflictError } from "@/errors/ConflictError";
import { DatabaseError } from "@/errors/DatabaseError";

/** True for a MongoDB duplicate-key error (E11000) — the shape Mongoose surfaces it in. */
function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

/**
 * Thin data-access layer shared by every model repository. Each method only
 * talks to MongoDB via Mongoose and translates low-level failures into
 * `DatabaseError`/`ConflictError` — no business rules live here. Services
 * (Phase 5) are where capacity checks, publish rules, etc. belong.
 */
export abstract class BaseRepository<T extends { _id: unknown }> {
  protected constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    await connectToDatabase();
    try {
      const doc = await this.model.create(data);
      return doc.toObject() as T;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError("A document with this value already exists", error);
      }
      throw new DatabaseError("Failed to create document", error);
    }
  }

  async findById(id: string): Promise<T | null> {
    await connectToDatabase();
    try {
      return await this.model.findById(id).lean<T>().exec();
    } catch (error) {
      throw new DatabaseError("Failed to find document by id", error);
    }
  }

  async findOne(filter: QueryFilter<T>): Promise<T | null> {
    await connectToDatabase();
    try {
      return await this.model.findOne(filter).lean<T>().exec();
    } catch (error) {
      throw new DatabaseError("Failed to find document", error);
    }
  }

  async findMany(filter: QueryFilter<T> = {}): Promise<T[]> {
    await connectToDatabase();
    try {
      return await this.model.find(filter).lean<T[]>().exec();
    } catch (error) {
      throw new DatabaseError("Failed to find documents", error);
    }
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    await connectToDatabase();
    try {
      return await this.model.findByIdAndUpdate(id, update, { returnDocument: "after" }).lean<T>().exec();
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError("A document with this value already exists", error);
      }
      throw new DatabaseError("Failed to update document", error);
    }
  }

  async deleteById(id: string, session?: ClientSession): Promise<T | null> {
    await connectToDatabase();
    try {
      return await this.model.findByIdAndDelete(id, { session }).lean<T>().exec();
    } catch (error) {
      throw new DatabaseError("Failed to delete document", error);
    }
  }

  /** Bulk delete by filter — used for cascading deletes (e.g. every Payment for a Registration). Optionally participates in a transaction via `session`. */
  async deleteMany(filter: QueryFilter<T>, session?: ClientSession): Promise<number> {
    await connectToDatabase();
    try {
      const result = await this.model.deleteMany(filter, { session }).exec();
      return result.deletedCount ?? 0;
    } catch (error) {
      throw new DatabaseError("Failed to delete documents", error);
    }
  }

  async count(filter: QueryFilter<T> = {}): Promise<number> {
    await connectToDatabase();
    try {
      return await this.model.countDocuments(filter).exec();
    } catch (error) {
      throw new DatabaseError("Failed to count documents", error);
    }
  }
}
