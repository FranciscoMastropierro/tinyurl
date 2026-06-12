import { UrlModel, type UrlDocument } from '../models/url.model.js';

export class UrlRepository {
  async create(data: Pick<UrlDocument, 'code' | 'originalUrl'>): Promise<UrlDocument> {
    return UrlModel.create(data);
  }

  async findByCode(code: string): Promise<UrlDocument | null> {
    return UrlModel.findOne({ code }).lean();
  }
}
