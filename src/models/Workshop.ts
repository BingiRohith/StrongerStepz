import { Schema, model, models, type Model, type Types } from "mongoose";

export type WorkshopStatus = "draft" | "published" | "disabled" | "archived";

export interface WorkshopDoctor {
  name: string;
}

export interface WorkshopAgendaItem {
  icon: string;
  text: string;
}

export interface WorkshopFaqItem {
  question: string;
  answer: string;
}

export interface WorkshopDocument {
  _id: Types.ObjectId;
  title: string;
  subtitle: string;
  description: string;
  bannerImage: string;
  date: Date;
  time: string;
  duration: string;
  price: number;
  originalPrice?: number;
  doctors: WorkshopDoctor[];
  benefits: string[];
  agenda: WorkshopAgendaItem[];
  faq: WorkshopFaqItem[];
  zoomLink?: string;
  whatsappCommunityLink?: string;
  registrationLimit?: number | null;
  registrationOpenDate?: Date;
  registrationCloseDate?: Date;
  status: WorkshopStatus;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<WorkshopDoctor>({ name: { type: String, required: true, trim: true } }, { _id: false });

const agendaItemSchema = new Schema<WorkshopAgendaItem>(
  {
    icon: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const faqItemSchema = new Schema<WorkshopFaqItem>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const workshopSchema = new Schema<WorkshopDocument>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    bannerImage: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    originalPrice: { type: Number },
    doctors: { type: [doctorSchema], default: [] },
    benefits: { type: [String], default: [] },
    agenda: { type: [agendaItemSchema], default: [] },
    faq: { type: [faqItemSchema], default: [] },
    zoomLink: { type: String },
    whatsappCommunityLink: { type: String },
    registrationLimit: { type: Number, default: null },
    registrationOpenDate: { type: Date },
    registrationCloseDate: { type: Date },
    status: {
      type: String,
      enum: ["draft", "published", "disabled", "archived"],
      required: true,
      default: "draft",
    },
    featured: { type: Boolean, required: true, default: false },
    seoTitle: { type: String, required: true, trim: true },
    seoDescription: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  },
  { timestamps: true }
);

// Serves both "list published workshops" and "get the one active/featured workshop".
workshopSchema.index({ status: 1, featured: 1, date: -1 });

export const Workshop: Model<WorkshopDocument> =
  (models.Workshop as Model<WorkshopDocument>) || model<WorkshopDocument>("Workshop", workshopSchema);
