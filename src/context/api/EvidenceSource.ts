/**
 * Evidence Source Contract.
 * Identifies the origin and credibility of ingested contextual data.
 */

export type EvidenceSourceType =
  | 'message'
  | 'file'
  | 'plugin'
  | 'user-input'
  | 'contact'
  | 'system';

export type SourceTrustLevel = 'verified' | 'unverified' | 'sandboxed';

export interface EvidenceSource {
  readonly sourceId: string;
  readonly type: EvidenceSourceType;
  readonly origin: string; // e.g., 'conversation:conv_123', 'plugin:weather', 'attachment:att_456'
  readonly label: string;
  readonly trustLevel: SourceTrustLevel;
  readonly createdAt: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
