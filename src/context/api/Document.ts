/**
 * Raw Document Contract.
 * Immutable representation of ingested raw content with cryptographic hashing and versioning.
 * Original data is strictly preserved.
 */

export interface RawDocumentMetadata {
  readonly title?: string;
  readonly author?: string;
  readonly timestamp?: number;
  readonly tags?: readonly string[];
  readonly custom?: Readonly<Record<string, unknown>>;
}

export interface RawDocument {
  readonly documentId: string;
  readonly sourceId: string;
  readonly content: string;
  readonly contentHash: string;
  readonly mimeType: string;
  readonly size: number; // in bytes
  readonly originalMetadata: RawDocumentMetadata;
  readonly storageReference?: string;
  readonly createdAt: number;
  readonly processingVersion: string;
}

export const CURRENT_DOCUMENT_PROCESSING_VERSION = '1.0.0';

/**
 * Creates a deterministic SHA-256 or numeric hash for raw document content.
 */
export async function computeContentHash(content: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  // Pure JS fallback FNV-1a 64-bit style hash
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'h_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
