export interface ClickMetadata {
  ip?: string;
  userAgent?: string;
}

export interface ClickJobData extends ClickMetadata {
  code: string;
  clickedAt: string;
}
