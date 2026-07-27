import { Schema, model, models, type Model, type Types } from "mongoose";

export type AdminRole = "superadmin" | "admin";

export interface AdminUserDocument {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  role: AdminRole;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema = new Schema<AdminUserDocument>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["superadmin", "admin"], required: true, default: "admin" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const AdminUser: Model<AdminUserDocument> =
  (models.AdminUser as Model<AdminUserDocument>) || model<AdminUserDocument>("AdminUser", adminUserSchema);
