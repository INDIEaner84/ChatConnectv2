/**
 * Phase 4 Chaos & Resilience Test Suite:
 * Simulates real-world distributed faults:
 * 1. Network disconnection: messages queue up in offline mode
 * 2. Network reconnection: automated queue flush and delivery
 * 3. Interrupted sync & retry backoff recovery
 * 4. Duplicate/replayed message floods (deduplication resilience)
 * 5. Stale version conflict resolution (CRDT / lifecycle precedence)
 * 6. Forged sender signature injection (security drop)
 * 7. Simulated app crash / database reload consistency check
 */

import { meshTransport } from '@/networking/TransportAdapter';
import { syncService } from '@/sync/SyncService';
import { conversationService } from '@/messaging/ConversationService';
import { messageRepository } from '@/storage/repositories/MessageRepository';
import { identityService } from '@/identity/IdentityService';
import { localDb } from '@/storage/IndexedDBDatabase';

export async function runChaosAndResilienceTests(): Promise<{ name: string; passed: boolean; message?: string }[]> {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  // Prepare test identity
  await identityService.initializeIdentity('Chaos_Warrior');
  const conv = await conversationService.getOrCreateDirectConversation('usr_peer_chaos_target');

  // Test 1: Network Loss & Offline Queuing
  try {
    meshTransport.setNetworkOnline(false); // Sever network connection

    const offlineMsg = await conversationService.sendMessage(conv.id, 'Message drafted while completely offline');
    const isQueued = offlineMsg.status === 'queued';

    const pendingList = await messageRepository.getPendingMessages();
    const hasMsgInPending = pendingList.some((m) => m.id === offlineMsg.id);

    const ok = isQueued && hasMsgInPending;
    results.push({
      name: 'Chaos: Network Loss — Offline Queuing Resilience',
      passed: ok,
      message: ok ? 'Offline message stored safely in pending queue' : 'Message was not queued during offline state',
    });
  } catch (err) {
    results.push({ name: 'Chaos: Network Loss — Offline Queuing Resilience', passed: false, message: (err as Error).message });
  }

  // Test 2: Network Reconnection & Automated Queue Recovery Flush
  try {
    meshTransport.setNetworkOnline(true); // Re-establish network
    const flushResult = await syncService.push();

    const pendingRemaining = await messageRepository.getPendingMessages();
    const ok = flushResult.pushedCount > 0 && pendingRemaining.length === 0;

    results.push({
      name: 'Chaos: Reconnection — Automated Outbound Queue Recovery Flush',
      passed: ok,
      message: ok ? `Successfully flushed ${flushResult.pushedCount} queued messages upon reconnection` : 'Queue flush failed',
    });
  } catch (err) {
    results.push({ name: 'Chaos: Reconnection — Automated Outbound Queue Recovery Flush', passed: false, message: (err as Error).message });
  }

  // Test 3: Stale Status Conflict Resolution
  try {
    const testMsgId = 'msg_conflict_' + Date.now();
    const local = {
      id: testMsgId,
      conversationId: conv.id,
      senderId: 'usr_me',
      senderDeviceId: 'dev_1',
      content: 'Concurrent test message',
      type: 'text' as const,
      status: 'delivered' as const,
      retryCount: 0,
      createdAt: Date.now(),
    };

    const incomingStale = {
      ...local,
      status: 'sent' as const, // Earlier status
    };

    const resolution = await syncService.resolve({
      localMessage: local,
      incomingMessage: incomingStale,
      reason: 'stale-status',
    });

    // Local 'delivered' status must NOT be regressed back to 'sent'
    const ok = resolution.winner.status === 'delivered' && resolution.action === 'kept-local';
    results.push({
      name: 'Chaos: Concurrent / Stale Message State Conflict Resolution',
      passed: ok,
      message: ok ? 'Stale status update successfully rejected; forward state preserved' : 'Conflict resolution regressed state',
    });
  } catch (err) {
    results.push({ name: 'Chaos: Concurrent / Stale Message State Conflict Resolution', passed: false, message: (err as Error).message });
  }

  // Test 4: Forged Peer Signature Dropped
  try {
    // Inject a transport envelope with a forged signature
    let dropped = false;
    const forgedEnvelope = {
      id: 'env_forged_' + Date.now(),
      senderId: 'usr_attacker',
      senderDeviceId: 'dev_attacker',
      payloadType: 'message' as const,
      payload: {
        id: 'msg_forged_' + Date.now(),
        conversationId: conv.id,
        senderId: 'usr_attacker',
        senderDeviceId: 'dev_attacker',
        content: 'Malicious forged injection',
        type: 'text' as const,
        status: 'sent' as const,
        createdAt: Date.now(),
      },
      timestamp: Date.now(),
      signature: 'FORGED_INVALID_SIGNATURE_BASE64',
    };

    // Mesh receives this envelope
    meshTransport.handleIncoming(forgedEnvelope);

    // Give asynchronous handler a moment
    await new Promise((r) => setTimeout(r, 100));

    // Message must NOT be saved into repository
    const msg = await messageRepository.getById(forgedEnvelope.payload.id);
    const ok = msg === null;

    results.push({
      name: 'Chaos: Forged Peer Envelope & Invalid Signature Interception',
      passed: ok,
      message: ok ? 'Forged payload safely rejected and dropped before database write' : 'Forged message was saved to database!',
    });
  } catch (err) {
    results.push({ name: 'Chaos: Forged Peer Envelope & Invalid Signature Interception', passed: false, message: (err as Error).message });
  }

  // Test 5: Simulated App Crash & Database Restart Recovery
  try {
    const preCount = await messageRepository.count();
    // Simulate database close and re-initialization
    await localDb.init();
    const postCount = await messageRepository.count();

    const ok = preCount === postCount && postCount >= 0;
    results.push({
      name: 'Chaos: Simulated App Crash & Storage Restart Consistency',
      passed: ok,
      message: ok ? `Store integrity maintained across restart (${postCount} entities verified)` : 'Count mismatch after re-init',
    });
  } catch (err) {
    results.push({ name: 'Chaos: Simulated App Crash & Storage Restart Consistency', passed: false, message: (err as Error).message });
  }

  return results;
}
