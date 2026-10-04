import type { ExtractedInvoice } from "./types.js";

/**
 * Provider-agnostic extraction interface. Swapping providers changes one file.
 */
export interface ExtractionProvider {
  /**
   * Extracts structured fields from a document buffer.
   * @param input - document bytes or text
   * @param mimeType - MIME type hint
   * @returns extracted invoice fields with per-field confidence
   */
  extract(input: Uint8Array | string, mimeType: string): Promise<ExtractedInvoice>;
}

export type { ExtractedInvoice };
