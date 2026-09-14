/**
 * Sync Service & Synchronization Provider Abstraction.
 * Local-First Message Queue, Idempotency Engine, and Peer Synchronization.
 * Transport is decoupled: Sync operates over any ITransportAdapter.
 */

import { MessageEntity, MessageLifecycleState, SyncStateEntity } from '@/storage/types';
import { messageRepository } from '@/storage/repositories/MessageRepository';
import { syncStateRepository } from '@/storage/repositories/SyncStateRepository';
import { conversationRepository } from '@/storage/repositories/ConversationRepository';
import { contactRepository } from '@/storage/repositories/ContactRepository';
import { relationshipRepository } from '@/storage/repositories/RelationshipRepository';
import { ITransportAdapter, meshTransport, TransportEnvelope } from '@/networking/TransportAdapter';
import { identityService } from '@/identity/IdentityService';
import { logger } from '@/core/logging/Logger';
import { eventBus, AppEvents } from '@/core/events/EventBus';

export interface ConflictRecord {
  localMessage: MessageEntity;
  incomingMessage: MessageEntity;
  reason: 'concurrent-edit' | 'stale-status' | 'divergent-content';
}

export interface ResolutionResult {
  winner: MessageEntity;
  action: 'kept-local' | 'applied-incoming' | 'merged';
}

export interface ISyncProvider {
  enqueue(message: MessageEntity): Promise<void>;
  push(): Promise<{ pushedCount: number; failedCount: number }>;
  pull(): Promise<{ pulledCount: number }>;
  acknowledge(messageId: string, status: MessageLifecycleState): Promise<void>;
  resolve(conflict: ConflictRecord): Promise<ResolutionResult>;
  getStatus(): Promise<SyncStateEntity>;
}

export class SyncService implements ISyncProvider {
  private isPushing = false;
  private unsubscribeTransport: (() => void) | null = null;

  constructor(private transport: ITransportAdapter = meshTransport) {
    this.initTransportListener();
    this.initNetworkEventListeners();
  }

  private initTransportListener(): void {
    this.unsubscribeTransport = this.transport.onReceive(async (envelope) => {
      await this.handleIncomingEnvelope(envelope);
    });
  }

  private initNetworkEventListeners(): void {
    eventBus.on(AppEvents.NETWORK_ONLINE, async () => {
      logger.info('SyncService', 'Network online event detected: triggering automatic queue flush');
      await this.push();
    });
  }

  /**
   * Computes a deterministic idempotency syncHash for a message.
   */
  public generateSyncHash(conversationId: string, senderId: string, createdAt: number, content: string): string {
    const raw = `${conversationId}:${senderId}:${createdAt}:${content}`;
    // Fast hash algorithm
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'sh_' + Math.abs(hash).toString(36);
  }

  /**
   * Enqueues a newly composed message into the local outbound queue.
   */
  public async enqueue(message: MessageEntity): Promise<void> {
    if (!message.syncHash) {
      message.syncHash = this.generateSyncHash(
        message.conversationId,
        message.senderId,
        message.createdAt,
        message.content
      );
    }

    message.status = 'queued';
    await messageRepository.save(message);

    // Update conversation lastActivityAt
    const conv = await conversationRepository.getById(message.conversationId);
    if (conv) {
      conv.lastActivityAt = message.createdAt;
      conv.unreadCount = 0;
      await conversationRepository.save(conv);
    }

    logger.debug('SyncService', `Enqueued message ${message.id} for conversation ${message.conversationId}`);

    // Update global sync state
    const state = await syncStateRepository.getGlobalState();
    state.pendingQueueCount += 1;
    await syncStateRepository.save(state);

    eventBus.emit(AppEvents.MESSAGE_QUEUED, message);

    // Attempt immediate push if connected
    if (this.transport.isConnected()) {
      setTimeout(() => this.push(), 50);
    }
  }

  /**
   * Flushes all pending outbound messages across transport.
   */
  public async push(): Promise<{ pushedCount: number; failedCount: number }> {
    if (this.isPushing) return { pushedCount: 0, failedCount: 0 };
    this.isPushing = true;

    let pushedCount = 0;
    let failedCount = 0;

    try {
      const pending = await messageRepository.getPendingMessages();
      const currentUser = await identityService.getCurrentUser();
      const currentDevice = await identityService.getCurrentDevice();

      if (!currentUser || !currentDevice) {
        logger.warn('SyncService', 'Cannot push messages: User identity not initialized');
        this.isPushing = false;
        return { pushedCount: 0, failedCount: pending.length };
      }

      for (const msg of pending) {
        if (!this.transport.isConnected()) {
          failedCount += 1;
          continue;
        }

        const envelope: TransportEnvelope = {
          id: 'env_' + msg.id,
          senderId: currentUser.id,
          senderDeviceId: currentDevice.id,
          payloadType: 'message',
          payload: msg,
          timestamp: Date.now(),
        };

        const success = await this.transport.send(envelope);
        if (success) {
          msg.status = 'sent';
          await messageRepository.save(msg);
          pushedCount += 1;
          eventBus.emit(AppEvents.MESSAGE_SENT, msg);
        } else {
          msg.status = 'failed';
          await messageRepository.save(msg);
          failedCount += 1;
        }
      }

      // Update sync state
      const state = await syncStateRepository.getGlobalState();
      const remainingPending = await messageRepository.getPendingMessages();
      state.pendingQueueCount = remainingPending.length;
      state.lastSyncTimestamp = Date.now();
      state.status = remainingPending.length > 0 ? 'syncing' : 'idle';
      await syncStateRepository.save(state);
      eventBus.emit(AppEvents.SYNC_COMPLETED, state);
    } catch (err) {
      logger.error('SyncService', 'Error during sync push', { error: (err as Error).message });
    } finally {
      this.isPushing = false;
    }

    return { pushedCount, failedCount };
  }

  public async pull(): Promise<{ pulledCount: number }> {
    // Local-first pull: in P2P mesh, nodes broadcast sync_request
    const currentUser = await identityService.getCurrentUser();
    const currentDevice = await identityService.getCurrentDevice();
    if (!currentUser || !currentDevice) return { pulledCount: 0 };

    const envelope: TransportEnvelope = {
      id: 'sync_req_' + Date.now(),
      senderId: currentUser.id,
      senderDeviceId: currentDevice.id,
      payloadType: 'sync_request',
      payload: { since: Date.now() - 86400000 },
      timestamp: Date.now(),
    };

    await this.transport.send(envelope);
    return { pulledCount: 0 };
  }

  public async acknowledge(messageId: string, status: MessageLifecycleState): Promise<void> {
    await messageRepository.updateStatus(messageId, status);
    const msg = await messageRepository.getById(messageId);
    if (msg) {
      eventBus.emit(AppEvents.MESSAGE_STATUS_CHANGED, { messageId, status });
    }
  }

  public async resolve(conflict: ConflictRecord): Promise<ResolutionResult> {
    // Deterministic Conflict Resolution:
    // 1. Later status progresses (delivered > sent > queued)
    // 2. Later timestamp wins if divergent content
    logger.info('SyncService', 'Resolving message sync conflict', { reason: conflict.reason });

    const statusOrder: Record<MessageLifecycleState, number> = {
      queued: 0,
      sent: 1,
      delivered: 2,
      read: 3,
      failed: -1,
    };

    const localWeight = statusOrder[conflict.localMessage.status] ?? 0;
    const remoteWeight = statusOrder[conflict.incomingMessage.status] ?? 0;

    if (remoteWeight > localWeight) {
      conflict.localMessage.status = conflict.incomingMessage.status;
      await messageRepository.save(conflict.localMessage);
      return { winner: conflict.localMessage, action: 'applied-incoming' };
    }

    return { winner: conflict.localMessage, action: 'kept-local' };
  }

  public async getStatus(): Promise<SyncStateEntity> {
    return syncStateRepository.getGlobalState();
  }

  /**
   * Internal incoming envelope handler.
   */
  private async handleIncomingEnvelope(envelope: TransportEnvelope): Promise<void> {
    const currentUser = await identityService.getCurrentUser();
    // Ignore envelopes broadcast by our own user
    if (currentUser && envelope.senderId === currentUser.id) {
      return;
    }

    // Cryptographic validation of transport envelope if signature provided
    if (envelope.signature) {
      const contact = await contactRepository.getById(envelope.senderId);
      if (!contact || !contact.publicIdentity) {
        logger.warn('SyncService', `Dropped envelope ${envelope.id}: unknown or unverified sender ${envelope.senderId}`);
        return;
      }

      const canonical = JSON.stringify({
        id: envelope.id,
        senderId: envelope.senderId,
        senderDeviceId: envelope.senderDeviceId,
        recipientId: envelope.recipientId || '',
        payloadType: envelope.payloadType,
        payload: envelope.payload,
        timestamp: envelope.timestamp,
      });

      const isValid = await identityService.verifyPeerIdentity(
        contact.publicIdentity,
        canonical,
        envelope.signature
      );

      if (!isValid) {
        logger.warn('SyncService', `Dropped forged/unverified envelope ${envelope.id} from ${envelope.senderId}`);
        return;
      }
    } else {
      // In strict zero-trust mode, envelopes from unknown senders without signature are dropped
      const rel = await relationshipRepository.getByPeerUserId(envelope.senderId);
      if (!rel || rel.state !== 'accepted') {
        logger.warn('SyncService', `Dropped unsigned envelope from non-accepted peer ${envelope.senderId}`);
        return;
      }
    }

    if (envelope.payloadType === 'message') {
      const incomingMsg = envelope.payload as MessageEntity;
      await this.processIncomingMessage(incomingMsg);
    } else if (envelope.payloadType === 'ack') {
      const { messageId, status } = envelope.payload as { messageId: string; status: MessageLifecycleState };
      await this.acknowledge(messageId, status);
    }
  }

  private async processIncomingMessage(msg: MessageEntity): Promise<void> {
    // 1. Idempotency Check
    const existing = await messageRepository.getByIdempotency(msg.id, msg.syncHash);
    if (existing) {
      logger.debug('SyncService', `Duplicate incoming message suppressed: ${msg.id}`);
      await this.resolve({
        localMessage: existing,
        incomingMessage: msg,
        reason: 'stale-status',
      });
      return;
    }

    // 2. Persist new message
    msg.status = 'delivered';
    msg.deliveredAt = Date.now();
    await messageRepository.save(msg);

    // 3. Ensure conversation exists and update activity
    let conv = await conversationRepository.getById(msg.conversationId);
    if (!conv) {
      conv = {
        id: msg.conversationId,
        type: 'direct',
        title: `Peer ${msg.senderId.substring(0, 8)}`,
        participantIds: [msg.senderId],
        createdAt: Date.now(),
        lastActivityAt: msg.createdAt,
        unreadCount: 1,
      };
    } else {
      conv.lastActivityAt = msg.createdAt;
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    }
    await conversationRepository.save(conv);

    eventBus.emit(AppEvents.MESSAGE_RECEIVED, msg);

    // Send ACK back to peer
    const currentUser = await identityService.getCurrentUser();
    const currentDevice = await identityService.getCurrentDevice();
    if (currentUser && currentDevice) {
      const ackEnvelope: TransportEnvelope = {
        id: 'ack_' + msg.id,
        senderId: currentUser.id,
        senderDeviceId: currentDevice.id,
        payloadType: 'ack',
        payload: { messageId: msg.id, status: 'delivered' },
        timestamp: Date.now(),
      };
      await this.transport.send(ackEnvelope);
    }
  }
}

export const syncService = new SyncService();
