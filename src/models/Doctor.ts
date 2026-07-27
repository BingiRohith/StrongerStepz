import { Schema, model, models, type Model, type Types } from "mongoose";

export interface DoctorDocument {
  _id: Types.ObjectId;
  name: string;
  qualification: string;
  experience: string;
  description: string;
  photoUrl?: string;
  photoPublicId?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<DoctorDocument>(
  {
    name: { type: String, required: true, trim: true },
    qualification: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    photoUrl: { type: String },
    photoPublicId: { type: String },
    isActive: { type: Boolean, required: true, default: true },
    displayOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Serves the public "active doctors in display order" read.
doctorSchema.index({ isActive: 1, displayOrder: 1 });

export const Doctor: Model<DoctorDocument> =
  (models.Doctor as Model<DoctorDocument>) || model<DoctorDocument>("Doctor", doctorSchema);
