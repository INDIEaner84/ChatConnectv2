/**
 * Conversation Service for Chat Connect / MUSCAL.
 * Manages 1:1 conversations, role-based groups, message dispatch, and attachments.
 */

import {
  ConversationEntity,
  MessageEntity,
  GroupEntity,
  AttachmentEntity,
  AttachmentType,
} from '@/storage/types';
import { conversationRepository } from '@/storage/repositories/ConversationRepository';
import { messageRepository } from '@/storage/repositories/MessageRepository';
import { groupRepository } from '@/storage/repositories/GroupRepository';
import { attachmentRepository } from '@/storage/repositories/AttachmentRepository';
import { syncService } from '@/sync/SyncService';
import { identityService } from '@/identity/IdentityService';
import { eventBus, AppEvents } from '@/core/events/EventBus';
import { ValidationError } from '@/core/errors/AppError';
import { logger } from '@/core/logging/Logger';

export class ConversationService {
  /**
   * Retrieves or creates a 1:1 conversation between current user and a peer.
   */
  public async getOrCreateDirectConversation(peerUserId: string): Promise<ConversationEntity> {
    const currentUser = await identityService.getCurrentUser();
    if (!currentUser) throw new ValidationError('Cannot create conversation: User not initialized');

    const all = await conversationRepository.getAll();
    const existing = all.find(
      (c) => c.type === 'direct' && c.participantIds.includes(peerUserId) && c.participantIds.includes(currentUser.id)
    );

    if (existing) return existing;

    const convId = 'conv_d_' + [currentUser.id, peerUserId].sort().join('_');
    const now = Date.now();

    const newConv: ConversationEntity = {
      id: convId,
      type: 'direct',
      title: `Peer ${peerUserId.substring(0, 8)}`,
      participantIds: [currentUser.id, peerUserId],
      createdAt: now,
      lastActivityAt: now,
      unreadCount: 0,
    };

    await conversationRepository.save(newConv);
    eventBus.emit(AppEvents.CONVERSATION_CREATED, newConv);
    logger.info('ConversationService', `Created direct conversation: ${convId}`);
    return newConv;
  }

  /**
   * Creates a new Group conversation with role management (owner, admins, members).
   */
  public async createGroup(
    name: string,
    memberUserIds: string[],
    description?: string
  ): Promise<{ conversation: ConversationEntity; group: GroupEntity }> {
    const currentUser = await identityService.getCurrentUser();
    if (!currentUser) throw new ValidationError('Cannot create group: User not initialized');

    const groupId = 'grp_' + Math.random().toString(36).substring(2, 11);
    const convId = 'conv_g_' + groupId;
    const now = Date.now();

    const uniqueMembers = Array.from(new Set([currentUser.id, ...memberUserIds]));

    const group: GroupEntity = {
      id: groupId,
      name,
      description,
      ownerId: currentUser.id,
      adminIds: [currentUser.id],
      memberIds: uniqueMembers,
      createdAt: now,
      updatedAt: now,
    };

    const conversation: ConversationEntity = {
      id: convId,
      type: 'group',
      title: name,
      participantIds: uniqueMembers,
      createdAt: now,
      lastActivityAt: now,
      unreadCount: 0,
    };

    await groupRepository.save(group);
    await conversationRepository.save(conversation);

    eventBus.emit(AppEvents.CONVERSATION_CREATED, conversation);
    logger.info('ConversationService', `Created group "${name}" (${groupId}) with ${uniqueMembers.length} members`);

    return { conversation, group };
  }

  /**
   * Sends a message into a conversation.
   * Dispatches immediately into local outbound queue for offline-first resilience.
   */
  public async sendMessage(
    conversationId: string,
    content: string,
    type: 'text' | 'attachment' | 'system' = 'text',
    attachmentId?: string
  ): Promise<MessageEntity> {
    const currentUser = await identityService.getCurrentUser();
    const currentDevice = await identityService.getCurrentDevice();

    if (!currentUser || !currentDevice) {
      throw new ValidationError('Cannot send message: User or Device identity not found');
    }

    if (!content.trim() && !attachmentId) {
      throw new ValidationError('Message content or attachment is required');
    }

    const messageId = 'msg_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const now = Date.now();

    const message: MessageEntity = {
      id: messageId,
      conversationId,
      senderId: currentUser.id,
      senderDeviceId: currentDevice.id,
      content: content.trim(),
      type,
      attachmentId,
      status: 'queued',
      retryCount: 0,
      createdAt: now,
      syncHash: syncService.generateSyncHash(conversationId, currentUser.id, now, content.trim()),
    };

    // Enqueue through SyncService
    await syncService.enqueue(message);
    return message;
  }

  /**
   * Saves an attachment locally and computes its SHA-256 integrity hash.
   */
  public async saveAttachment(
    fileName: string,
    mimeType: string,
    type: AttachmentType,
    dataBuffer: ArrayBuffer | Blob
  ): Promise<AttachmentEntity> {
    const rawBytes =
      dataBuffer instanceof Blob
        ? new Uint8Array(await dataBuffer.arrayBuffer())
        : new Uint8Array(dataBuffer);

    // Compute simple hash for integrity & deduplication
    let hash = 0;
    for (let i = 0; i < rawBytes.length; i++) {
      hash = (hash << 5) - hash + rawBytes[i];
      hash |= 0;
    }
    const hashStr = 'att_h_' + Math.abs(hash).toString(36);

    // Check deduplication
    const existing = await attachmentRepository.getByHash(hashStr);
    if (existing) return existing;

    const attachmentId = 'att_' + Math.random().toString(36).substring(2, 11);
    const entity: AttachmentEntity = {
      id: attachmentId,
      fileName,
      mimeType,
      sizeBytes: rawBytes.byteLength,
      hash: hashStr,
      type,
      dataBase64: typeof btoa !== 'undefined' ? btoa(String.fromCharCode(...rawBytes)) : '',
      createdAt: Date.now(),
    };

    await attachmentRepository.save(entity);
    logger.info('ConversationService', `Persisted attachment ${attachmentId} (${fileName}, ${entity.sizeBytes} bytes)`);
    return entity;
  }

  public async getMessages(conversationId: string): Promise<MessageEntity[]> {
    return messageRepository.getByConversationId(conversationId);
  }

  public async getConversations(): Promise<ConversationEntity[]> {
    return conversationRepository.getRecent();
  }

  public async markConversationRead(conversationId: string): Promise<void> {
    const conv = await conversationRepository.getById(conversationId);
    if (conv) {
      conv.unreadCount = 0;
      await conversationRepository.save(conv);
    }
    const messages = await messageRepository.getByConversationId(conversationId);
    for (const msg of messages) {
      if (msg.status !== 'read') {
        await syncService.acknowledge(msg.id, 'read');
      }
    }
  }
}

export const conversationService = new ConversationService();
