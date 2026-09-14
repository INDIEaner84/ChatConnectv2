/**
 * Phase 4 Acceptance Test Suite: Messenger Core
 * Covers 1:1 direct conversations, group hierarchy, message lifecycle progression,
 * idempotency deduplication, and attachment hashing.
 */

import { conversationService } from '@/messaging/ConversationService';
import { syncService } from '@/sync/SyncService';
import { messageRepository } from '@/storage/repositories/MessageRepository';
import { identityService } from '@/identity/IdentityService';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export async function runMessengerCoreTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Ensure local identity is ready
  await identityService.initializeIdentity('Messenger_Tester');

  // Test 1: 1:1 Conversation Creation
  let testConvId = '';
  try {
    const peerUserId = 'usr_peer_test_' + Date.now();
    const conv = await conversationService.getOrCreateDirectConversation(peerUserId);
    testConvId = conv.id;

    const ok = conv.type === 'direct' && conv.participantIds.includes(peerUserId);
    results.push({
      name: 'Messenger: 1:1 Direct Conversation Initialization',
      passed: ok,
      message: ok ? `Direct conversation ${conv.id} created` : 'Conversation structure invalid',
    });
  } catch (err) {
    results.push({ name: 'Messenger: 1:1 Direct Conversation Initialization', passed: false, message: (err as Error).message });
  }

  // Test 2: Group Creation & Role Hierarchy (Owner, Admin, Member)
  try {
    const currentUser = await identityService.getCurrentUser();
    const members = ['usr_peer_1', 'usr_peer_2'];
    const { conversation, group } = await conversationService.createGroup('Engineering Core', members, 'Core group');

    const hasOwner = group.ownerId === currentUser?.id;
    const hasMember = group.memberIds.includes('usr_peer_1');
    const ok = conversation.type === 'group' && hasOwner && hasMember && group.memberIds.length === 3;

    results.push({
      name: 'Messenger: Group Conversation & Role Hierarchy Enforcement',
      passed: ok,
      message: ok ? `Group ${group.id} created with Owner/Member role boundaries` : 'Group roles failed',
    });
  } catch (err) {
    results.push({ name: 'Messenger: Group Conversation & Role Hierarchy Enforcement', passed: false, message: (err as Error).message });
  }

  // Test 3: Message Dispatch & Lifecycle Progression (queued -> sent -> delivered -> read)
  try {
    const message = await conversationService.sendMessage(testConvId, 'Hello, decentralized world!');
    const initialQueued = message.status === 'queued';

    // Progress status to sent
    await syncService.acknowledge(message.id, 'sent');
    const sentMsg = await messageRepository.getById(message.id);

    // Progress to delivered
    await syncService.acknowledge(message.id, 'delivered');
    const deliveredMsg = await messageRepository.getById(message.id);

    // Progress to read
    await syncService.acknowledge(message.id, 'read');
    const readMsg = await messageRepository.getById(message.id);

    const ok =
      initialQueued &&
      sentMsg?.status === 'sent' &&
      deliveredMsg?.status === 'delivered' &&
      readMsg?.status === 'read' &&
      Boolean(readMsg?.readAt);

    results.push({
      name: 'Messenger: Message Dispatch & Lifecycle Progression (queued -> sent -> delivered -> read)',
      passed: ok,
      message: ok ? 'Message traversed full lifecycle correctly' : 'Lifecycle progression failed',
    });
  } catch (err) {
    results.push({ name: 'Messenger: Message Dispatch & Lifecycle Progression (queued -> sent -> delivered -> read)', passed: false, message: (err as Error).message });
  }

  // Test 4: Idempotency & Duplicate Suppression
  try {
    const initialCount = await messageRepository.count();
    const currentUser = await identityService.getCurrentUser();

    // Create an identical message payload twice
    const msgId = 'msg_idempotent_test_' + Date.now();
    const syncHash = syncService.generateSyncHash(testConvId, currentUser!.id, 1700000000, 'Duplicate content');

    const msgPayload = {
      id: msgId,
      conversationId: testConvId,
      senderId: currentUser!.id,
      senderDeviceId: 'dev_test',
      content: 'Duplicate content',
      type: 'text' as const,
      status: 'sent' as const,
      retryCount: 0,
      createdAt: 1700000000,
      syncHash,
    };

    // Save twice
    await messageRepository.save(msgPayload);
    await messageRepository.save(msgPayload);

    const countAfterTwoSaves = await messageRepository.count();
    const ok = countAfterTwoSaves === initialCount + 1;

    results.push({
      name: 'Messenger: Idempotency & Duplicate Message Suppression',
      passed: ok,
      message: ok ? 'Duplicate message save safely merged without creating extra entity' : 'Duplicate message was inserted twice',
    });
  } catch (err) {
    results.push({ name: 'Messenger: Idempotency & Duplicate Message Suppression', passed: false, message: (err as Error).message });
  }

  // Test 5: Attachment Storage & Hash Deduplication
  try {
    const testData = new TextEncoder().encode('Simulated binary image file content');
    const blob1 = new Blob([testData]);
    const blob2 = new Blob([testData]);
    const att1 = await conversationService.saveAttachment('photo.png', 'image/png', 'image', blob1);
    const att2 = await conversationService.saveAttachment('photo_duplicate.png', 'image/png', 'image', blob2);

    const ok = att1.id === att2.id && att1.hash === att2.hash && att1.type === 'image';
    results.push({
      name: 'Messenger: Attachment Metadata, Binary Storage & Hash Deduplication',
      passed: ok,
      message: ok ? `Attachment deduplicated by content hash (${att1.hash})` : 'Attachment deduplication failed',
    });
  } catch (err) {
    results.push({ name: 'Messenger: Attachment Metadata, Binary Storage & Hash Deduplication', passed: false, message: (err as Error).message });
  }

  return results;
}
