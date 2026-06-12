import mongoose, { Schema } from 'mongoose';

export interface ClickDocument {
  code: string;
  clickedAt: Date;
  ip?: string;
  userAgent?: string;
}

const clickSchema = new Schema<ClickDocument>(
  {
    code: { type: String, required: true, index: true },
    clickedAt: { type: Date, required: true, default: Date.now },
    ip: { type: String },
    userAgent: { type: String },
  },
  { versionKey: false },
);

export const ClickModel = mongoose.model<ClickDocument>('Click', clickSchema);
