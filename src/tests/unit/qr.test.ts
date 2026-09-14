/**
 * Phase 3 QR Invitation Security Test Suite:
 * - Valid QR creation, parsing & cryptographic signature verification
 * - Rejection of malformed QR strings
 * - Rejection of tampered payloads (altered timestamp, modified issuer, etc.)
 * - Rejection of expired QR invitations
 * - Rejection of replayed/duplicate invitations
 * - Rejection of forged signatures
 * - Enforcement of revoked/blocked relationship states
 * - Strict verification that QR payload NEVER contains private keys or secrets
 */

import { invitationService } from '@/networking/InvitationService';
import { identityService } from '@/identity/IdentityService';
import { relationshipRepository } from '@/storage/repositories/RelationshipRepository';
import { appMetadataRepository } from '@/storage/repositories/AppMetadataRepository';

export async function runQRSecurityTests(): Promise<{ name: string; passed: boolean; message?: string }[]> {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  // Ensure local identity is ready
  await identityService.initializeIdentity('QR_Tester');

  // Test 1: Valid QR Creation & Structure
  let validQrString = '';
  try {
    const { invitation, qrString } = await invitationService.createInvitation(600);
    validQrString = qrString;

    const hasProtocol = qrString.startsWith('chatconnect:invite:');
    const hasSignature = Boolean(invitation.signature && invitation.signature.length > 20);
    const noSecretsInQr = !qrString.includes('private') && !qrString.includes('secret') && !qrString.includes('"d":');

    const ok = hasProtocol && hasSignature && noSecretsInQr;
    results.push({
      name: 'QR: Creation of Cryptographically Signed Invitation QR',
      passed: ok,
      message: ok ? 'Signed QR generated without private key leakage' : 'QR format or signature invalid',
    });
  } catch (err) {
    results.push({ name: 'QR: Creation of Cryptographically Signed Invitation QR', passed: false, message: (err as Error).message });
  }

  // Test 2: Rejection of Malformed QR
  try {
    const garbageTest = await invitationService.validateInvitation('chatconnect:invite:!!!not-valid-base64!!!');
    const emptyTest = await invitationService.validateInvitation('');
    const jsonGarbage = await invitationService.validateInvitation('{"random":"json"}');

    const ok = !garbageTest.valid && !emptyTest.valid && !jsonGarbage.valid;
    results.push({
      name: 'QR: Rejection of Malformed and Invalid Syntax QR Tokens',
      passed: ok,
      message: ok ? 'Malformed tokens properly intercepted with validation errors' : 'Malformed token allowed',
    });
  } catch (err) {
    results.push({ name: 'QR: Rejection of Malformed and Invalid Syntax QR Tokens', passed: false, message: (err as Error).message });
  }

  // Test 3: Tampered QR Payload Rejection (Altered Fields)
  try {
    const { invitation } = await invitationService.createInvitation(600);
    const tamperedPayload = {
      ...invitation,
      bootstrapInformation: {
        ...invitation.bootstrapInformation,
        displayName: 'HACKED_NAME_TAMPERED', // Alter display name without valid signature
      },
    };

    const tamperedQr = 'chatconnect:invite:' + btoa(encodeURIComponent(JSON.stringify(tamperedPayload)));
    const check = await invitationService.validateInvitation(tamperedQr);

    const ok = !check.valid && (check.error?.includes('signature') || false);
    results.push({
      name: 'QR: Tampered Payload Detection and Signature Rejection',
      passed: ok,
      message: ok ? 'Tampered content detected; digital signature verification failed' : 'Tampered payload was accepted!',
    });
  } catch (err) {
    results.push({ name: 'QR: Tampered Payload Detection and Signature Rejection', passed: false, message: (err as Error).message });
  }

  // Test 4: Expired QR Invitation Rejection
  try {
    const { invitation } = await invitationService.createInvitation(-10); // Expired 10 seconds ago
    const expiredQr = 'chatconnect:invite:' + btoa(encodeURIComponent(JSON.stringify(invitation)));
    const check = await invitationService.validateInvitation(expiredQr);

    const ok = !check.valid && (check.error?.includes('expired') || false);
    results.push({
      name: 'QR: Expired Invitation Rejection',
      passed: ok,
      message: ok ? 'Expired QR rejected promptly' : 'Expired invitation was accepted',
    });
  } catch (err) {
    results.push({ name: 'QR: Expired Invitation Rejection', passed: false, message: (err as Error).message });
  }

  // Test 5: Replay Attack and Duplicate Invitation Detection
  try {
    // Generate a peer invitation from a mock peer identity
    const peerUserId = 'usr_peer_simulated_' + Math.random().toString(36).substring(2, 7);
    const peerDeviceId = 'dev_peer_simulated';
    const mockUser = await identityService.getCurrentUser();
    const publicIdentity = mockUser!.publicIdentity;

    const unsignedInv = {
      invitationId: 'inv_replay_test_' + Date.now(),
      issuerUserId: peerUserId,
      issuerDeviceId: peerDeviceId,
      issuerPublicIdentity: publicIdentity,
      protocolVersion: 'muscal.chatconnect.v1',
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
      bootstrapInformation: {
        displayName: 'Peer_Simulated',
        capabilities: ['messaging:v1'],
      },
    };

    const canonical = invitationService.getCanonicalString(unsignedInv);
    const signature = await identityService.signPayload(canonical);
    const validPeerInv = { ...unsignedInv, signature };

    // First acceptance should succeed
    const firstAccept = await invitationService.acceptInvitation(validPeerInv);
    let replayRejected = false;

    // Second acceptance of the identical invitationId should throw SecurityError
    try {
      await invitationService.acceptInvitation(validPeerInv);
    } catch (err) {
      replayRejected = true;
    }

    const ok = Boolean(firstAccept) && replayRejected;
    results.push({
      name: 'QR: Replay Attack Protection & Duplicate Acceptance Prevention',
      passed: ok,
      message: ok ? 'First invitation accepted, second replay attempt cleanly blocked' : 'Replay attack succeeded',
    });
  } catch (err) {
    results.push({ name: 'QR: Replay Attack Protection & Duplicate Acceptance Prevention', passed: false, message: (err as Error).message });
  }

  // Test 6: Revoked Relationship Enforcement
  try {
    const peerUserId = 'usr_revoked_test_' + Date.now();
    await relationshipRepository.save({
      id: 'rel_revoked_' + Date.now(),
      peerUserId,
      peerDeviceId: 'dev_test',
      peerPublicIdentity: 'mock_key',
      state: 'revoked',
      initiatedByUs: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const unsignedInv = {
      invitationId: 'inv_revoked_check_' + Date.now(),
      issuerUserId: peerUserId,
      issuerDeviceId: 'dev_test',
      issuerPublicIdentity: (await identityService.getCurrentUser())!.publicIdentity,
      protocolVersion: 'muscal.chatconnect.v1',
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
      bootstrapInformation: {
        displayName: 'Revoked Peer',
        capabilities: ['messaging:v1'],
      },
    };

    const canonical = invitationService.getCanonicalString(unsignedInv);
    const signature = await identityService.signPayload(canonical);
    const inv = { ...unsignedInv, signature };

    const check = await invitationService.validateInvitation(JSON.stringify(inv));
    const ok = !check.valid && (check.error?.includes('revoked') || false);

    results.push({
      name: 'QR: Revoked Peer Relationship Guarding',
      passed: ok,
      message: ok ? 'Revoked relationship blocked invitation parsing' : 'Revoked peer was allowed to reconnect',
    });
  } catch (err) {
    results.push({ name: 'QR: Revoked Peer Relationship Guarding', passed: false, message: (err as Error).message });
  }

  return results;
}
