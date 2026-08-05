import { Schema, model, models, type Model, type Types } from "mongoose";

export interface RealLifeStoryDocument {
  _id: Types.ObjectId;
  name: string;
  age?: number;
  location?: string;
  title: string;
  storyDescription: string;
  beforeImageUrl?: string;
  beforeImagePublicId?: string;
  afterImageUrl?: string;
  afterImagePublicId?: string;
  highlightQuote?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const realLifeStorySchema = new Schema<RealLifeStoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 0 },
    location: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    storyDescription: { type: String, required: true },
    beforeImageUrl: { type: String },
    beforeImagePublicId: { type: String },
    afterImageUrl: { type: String },
    afterImagePublicId: { type: String },
    highlightQuote: { type: String, trim: true },
    isActive: { type: Boolean, required: true, default: true },
    displayOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Serves the public "active real life stories in display order" read.
realLifeStorySchema.index({ isActive: 1, displayOrder: 1 });

export const RealLifeStory: Model<RealLifeStoryDocument> =
  (models.RealLifeStory as Model<RealLifeStoryDocument>) ||
  model<RealLifeStoryDocument>("RealLifeStory", realLifeStorySchema);
