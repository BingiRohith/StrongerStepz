import { Schema, model, models, type Model, type Types } from "mongoose";

/** Site-wide key/value config (contact email, footer text, etc.) editable without a code deploy. */
export interface SettingsDocument {
  _id: Types.ObjectId;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<SettingsDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Settings: Model<SettingsDocument> =
  (models.Settings as Model<SettingsDocument>) || model<SettingsDocument>("Settings", settingsSchema);
