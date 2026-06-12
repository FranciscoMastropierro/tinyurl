import { ClickModel, type ClickDocument } from '../models/click.model.js';

export class ClickRepository {
  async create(data: Omit<ClickDocument, never>): Promise<ClickDocument> {
    return ClickModel.create(data);
  }

  async countByCode(code: string): Promise<number> {
    return ClickModel.countDocuments({ code });
  }

  async findLastByCode(code: string): Promise<ClickDocument | null> {
    return ClickModel.findOne({ code }).sort({ clickedAt: -1 }).lean();
  }
}
