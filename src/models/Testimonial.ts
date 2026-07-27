import { Schema, model, models, type Model, type Types } from "mongoose";

export interface TestimonialDocument {
  _id: Types.ObjectId;
  name: string;
  message: string;
  photoUrl?: string;
  photoPublicId?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const testimonialSchema = new Schema<TestimonialDocument>(
  {
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    photoUrl: { type: String },
    photoPublicId: { type: String },
    isActive: { type: Boolean, required: true, default: true },
    displayOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Serves the public "active testimonials in display order" read.
testimonialSchema.index({ isActive: 1, displayOrder: 1 });

export const Testimonial: Model<TestimonialDocument> =
  (models.Testimonial as Model<TestimonialDocument>) || model<TestimonialDocument>("Testimonial", testimonialSchema);
