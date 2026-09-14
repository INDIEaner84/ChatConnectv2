/**
 * Storage entity models for Chat Connect IndexedDB repositories.
 */

export interface UserEntity {
  id: string; // UserID
  displayName: string;
  avatar: string;
  publicIdentity: string; // Base64 public key or serialized public identity
  capabilities: string[];
  privacySettings: {
    allowQrDiscovery: boolean;
    shareOnlineStatus: boolean;
    allowDirectInvites: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export interface DeviceEntity {
  id: string; // DeviceID
  userId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'pwa-standalone';
  capabilities: string[];
  metadata: {
    userAgent: string;
    platform: string;
    isStandalone: boolean;
    registeredAt: number;
    lastSeenAt: number;
  };
}

export interface ContactEntity {
  id: string; // Contact/Peer UserID
  displayName: string;
  avatar?: string;
  publicIdentity: string;
  deviceIds: string[];
  establishedAt: number;
  lastActiveAt?: number;
  alias?: string;
}

export type RelationshipState = 'pending' | 'accepted' | 'blocked' | 'revoked';

export interface RelationshipEntity {
  id: string; // RelationshipID
  peerUserId: string;
  peerDeviceId: string;
  peerPublicIdentity: string;
  state: RelationshipState;
  initiatedByUs: boolean;
  invitationId?: string;
  createdAt: number;
  updatedAt: number;
  verifiedAt?: number;
}

export type ConversationType = 'direct' | 'group';

export interface ConversationEntity {
  id: string; // ConversationID
  type: ConversationType;
  title: string;
  participantIds: string[]; // UserIDs
  lastMessageId?: string;
  lastMessagePreview?: string;
  lastActivityAt: number;
  unreadCount: number;
  isPinned?: boolean;
  createdAt: number;
}

export type MessageLifecycleState = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageEntity {
  id: string; // MessageID (client UUID, idempotent)
  conversationId: string;
  senderId: string; // UserID
  senderDeviceId: string; // DeviceID
  recipientId?: string; // direct peer UserID
  content: string;
  type: 'text' | 'attachment' | 'system';
  attachmentId?: string;
  status: MessageLifecycleState;
  createdAt: number;
  deliveredAt?: number;
  readAt?: number;
  retryCount: number;
  syncHash?: string; // For deduplication and integrity
}

export interface GroupEntity {
  id: string; // GroupID
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string; // UserID
  adminIds: string[];
  memberIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type AttachmentType = 'image' | 'audio' | 'video' | 'document' | 'file';

export interface AttachmentEntity {
  id: string; // AttachmentID
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  type: AttachmentType;
  dataBase64?: string; // Stored securely in IndexedDB
  hash: string; // SHA-256 for integrity verification
  folderPath?: string; // e.g. "/documents/rag-sources", "/media/images", "/mesh-sync"
  syncState?: 'synced' | 'local_only' | 'p2p_mesh' | 'syncing';
  createdAt: number;
}

export interface SyncStateEntity {
  id: string; // e.g. "global", or per conversation/peer
  lastSyncTimestamp: number;
  pendingQueueCount: number;
  status: 'idle' | 'syncing' | 'failed' | 'paused';
  lastError?: string;
  syncedMessageCount: number;
}

export interface AppMetadataEntity {
  key: string; // e.g. 'schema_version', 'app_state', 'last_backup'
  value: unknown;
  updatedAt: number;
}
