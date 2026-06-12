import mongoose, { Schema } from 'mongoose';

export interface UrlDocument {
  code: string;
  originalUrl: string;
  createdAt: Date;
}

const urlSchema = new Schema<UrlDocument>(
  {
    code: { type: String, required: true, unique: true, index: true },
    originalUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const UrlModel = mongoose.model<UrlDocument>('Url', urlSchema);
