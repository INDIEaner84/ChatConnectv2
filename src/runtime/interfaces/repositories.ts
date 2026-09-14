/**
 * Repository interface contracts for local storage abstractions.
 */

import {
  UserEntity,
  DeviceEntity,
  ContactEntity,
  RelationshipEntity,
  ConversationEntity,
  MessageEntity,
  GroupEntity,
  AttachmentEntity,
  SyncStateEntity,
  AppMetadataEntity,
} from '@/storage/types';

export interface IRepository<T, ID = string> {
  getById(id: ID): Promise<T | null>;
  getAll(): Promise<T[]>;
  save(item: T): Promise<void>;
  delete(id: ID): Promise<void>;
  count(): Promise<number>;
}

export * from './UserRepository';
export * from './DeviceRepository';
export * from './ContactRepository';

export interface IRelationshipRepository extends IRepository<RelationshipEntity> {
  getByPeerUserId(peerUserId: string): Promise<RelationshipEntity | null>;
  getByState(state: RelationshipEntity['state']): Promise<RelationshipEntity[]>;
}

export interface IConversationRepository extends IRepository<ConversationEntity> {
  getRecent(limit?: number): Promise<ConversationEntity[]>;
}

export interface IMessageRepository extends IRepository<MessageEntity> {
  getByConversationId(conversationId: string, limit?: number): Promise<MessageEntity[]>;
  getPendingMessages(): Promise<MessageEntity[]>;
  updateStatus(messageId: string, status: MessageEntity['status']): Promise<void>;
  getByIdempotency(id: string, syncHash?: string): Promise<MessageEntity | null>;
}

export interface IGroupRepository extends IRepository<GroupEntity> {
  getGroupsForUser(userId: string): Promise<GroupEntity[]>;
}

export interface IAttachmentRepository extends IRepository<AttachmentEntity> {
  getByHash(hash: string): Promise<AttachmentEntity | null>;
}

export interface ISyncStateRepository extends IRepository<SyncStateEntity> {
  getGlobalState(): Promise<SyncStateEntity>;
}

export interface IAppMetadataRepository {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  getAll(): Promise<Record<string, unknown>>;
}
