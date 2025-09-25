import type { Prisma } from "./generated/prisma";

/**
 * Type-safe source metadata for cached answers
 */
export interface SourceMetadata {
  title: string;
  url: string;
  snippet?: string;
}

/**
 * Type-safe JSON value for Prisma sources field
 */
export type SourcesJson = SourceMetadata[] | Prisma.JsonValue;

/**
 * Cache result with proper typing
 */
export interface CachedAnswerResult {
  answer: string;
  sources: SourcesJson;
  hitCount: number;
  originalQuestion: string;
  isStale?: boolean;
  model: string;
  promptVersion: string;
  retrieverVersion: string;
}
