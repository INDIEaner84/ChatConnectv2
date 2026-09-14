/**
 * Application configuration for Chat Connect Local-First Runtime.
 */

export const AppConfig = {
  appName: 'Chat Connect',
  databaseName: 'ChatConnectLocalDB',
  databaseVersion: 1,
  protocolVersion: 'muscal.chatconnect.v1',
  invitationTtlSeconds: 300, // 5 minutes default QR expiration
  maxAttachmentSizeBytes: 15 * 1024 * 1024, // 15MB local attachment cap
  syncRetryIntervalMs: 3000,
  maxSyncRetries: 5,
  crypto: {
    asymmetricAlgorithm: 'ECDSA',
    namedCurve: 'P-256',
    hash: 'SHA-256',
  },
} as const;
