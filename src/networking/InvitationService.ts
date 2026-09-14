/**
 * QR Peer Invitation & Verification Service for Chat Connect / MUSCAL.
 * Strictly adheres to zero-trust bootstrap standards:
 * - QR contains ONLY public identity, issuer device, expiration, and digital signature
 * - NEVER contains private keys, secret credentials, or session tokens
 * - Validates cryptographic signatures, expiration, replay attacks, and revoked states.
 */

import { AppConfig } from '@/core/config/appConfig';
import { SecurityError, ValidationError } from '@/core/errors/AppError';
import { logger } from '@/core/logging/Logger';
import { eventBus, AppEvents } from '@/core/events/EventBus';
import { identityService } from '@/identity/IdentityService';
import { contactRepository } from '@/storage/repositories/ContactRepository';
import { relationshipRepository } from '@/storage/repositories/RelationshipRepository';
import { appMetadataRepository } from '@/storage/repositories/AppMetadataRepository';
import { RelationshipEntity, RelationshipState, ContactEntity } from '@/storage/types';

export interface BootstrapInformation {
  displayName: string;
  avatar?: string;
  capabilities: string[];
  relayHints?: string[];
}

export interface InvitationPayload {
  invitationId: string;
  issuerUserId: string;
  issuerDeviceId: string;
  issuerPublicIdentity: string;
  protocolVersion: string;
  createdAt: number;
  expiresAt: number;
  bootstrapInformation: BootstrapInformation;
  signature?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  invitation?: InvitationPayload;
}

export class InvitationService {
  private processedInvitations = new Set<string>();

  /**
   * Generates a canonical string representation of an invitation payload for signing.
   */
  public getCanonicalString(inv: Omit<InvitationPayload, 'signature'>): string {
    return JSON.stringify({
      invitationId: inv.invitationId,
      issuerUserId: inv.issuerUserId,
      issuerDeviceId: inv.issuerDeviceId,
      issuerPublicIdentity: inv.issuerPublicIdentity,
      protocolVersion: inv.protocolVersion,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      bootstrapInformation: {
        displayName: inv.bootstrapInformation.displayName,
        avatar: inv.bootstrapInformation.avatar || '',
        capabilities: [...inv.bootstrapInformation.capabilities].sort(),
      },
    });
  }

  /**
   * Creates a signed peer invitation QR payload.
   */
  public async createInvitation(ttlSeconds: number = AppConfig.invitationTtlSeconds): Promise<{
    invitation: InvitationPayload;
    qrString: string;
  }> {
    const user = await identityService.getCurrentUser();
    const device = await identityService.getCurrentDevice();

    if (!user || !device) {
      throw new SecurityError('Cannot create invitation: Local user or device identity uninitialized');
    }

    const now = Date.now();
    const unsignedPayload: Omit<InvitationPayload, 'signature'> = {
      invitationId: 'inv_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      issuerUserId: user.id,
      issuerDeviceId: device.id,
      issuerPublicIdentity: user.publicIdentity,
      protocolVersion: AppConfig.protocolVersion,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
      bootstrapInformation: {
        displayName: user.displayName,
        avatar: user.avatar,
        capabilities: user.capabilities,
        relayHints: ['local-p2p', 'webrtc-mesh'],
      },
    };

    const canonical = this.getCanonicalString(unsignedPayload);
    const signature = await identityService.signPayload(canonical);

    const fullInvitation: InvitationPayload = {
      ...unsignedPayload,
      signature,
    };

    // Strict Security Assert: Check that fullInvitation contains no private keys
    const rawJson = JSON.stringify(fullInvitation);
    if (rawJson.includes('private') || rawJson.includes('secret') || rawJson.includes('"d":')) {
      throw new SecurityError('CRITICAL LEAK ATTEMPT: Private key detected in invitation generator');
    }

    // Prefix for easy QR detection: muscal-cc://invite?data=...
    const encodedData = btoa(encodeURIComponent(rawJson));
    const qrString = `chatconnect:invite:${encodedData}`;

    this.processedInvitations.add(fullInvitation.invitationId);
    eventBus.emit(AppEvents.INVITATION_CREATED, fullInvitation);
    logger.info('InvitationService', `Created signed invitation ${fullInvitation.invitationId} (expires in ${ttlSeconds}s)`);

    return {
      invitation: fullInvitation,
      qrString,
    };
  }

  /**
   * Decodes and strictly validates an incoming QR string or token.
   */
  public async validateInvitation(qrString: string): Promise<ValidationResult> {
    if (!qrString || typeof qrString !== 'string') {
      return { valid: false, error: 'Malformed invitation: empty or non-string QR' };
    }

    let rawJson: string;
    try {
      if (qrString.startsWith('chatconnect:invite:')) {
        const base64Part = qrString.replace('chatconnect:invite:', '');
        rawJson = decodeURIComponent(atob(base64Part));
      } else if (qrString.trim().startsWith('{')) {
        rawJson = qrString.trim();
      } else {
        rawJson = decodeURIComponent(atob(qrString));
      }
    } catch (err) {
      return { valid: false, error: `Malformed invitation format: failed to parse base64/URI` };
    }

    let payload: InvitationPayload;
    try {
      payload = JSON.parse(rawJson);
    } catch {
      return { valid: false, error: 'Malformed invitation payload: invalid JSON' };
    }

    // 1. Structural validation
    if (
      !payload.invitationId ||
      !payload.issuerUserId ||
      !payload.issuerDeviceId ||
      !payload.issuerPublicIdentity ||
      !payload.createdAt ||
      !payload.expiresAt ||
      !payload.signature ||
      !payload.bootstrapInformation
    ) {
      return { valid: false, error: 'Malformed invitation: missing mandatory fields' };
    }

    // 2. Cryptographic Digital Signature Verification FIRST
    const unsignedPart: Omit<InvitationPayload, 'signature'> = {
      invitationId: payload.invitationId,
      issuerUserId: payload.issuerUserId,
      issuerDeviceId: payload.issuerDeviceId,
      issuerPublicIdentity: payload.issuerPublicIdentity,
      protocolVersion: payload.protocolVersion,
      createdAt: payload.createdAt,
      expiresAt: payload.expiresAt,
      bootstrapInformation: payload.bootstrapInformation,
    };

    const canonical = this.getCanonicalString(unsignedPart);
    const isSignatureValid = await identityService.verifyPeerIdentity(
      payload.issuerPublicIdentity,
      canonical,
      payload.signature
    );

    if (!isSignatureValid) {
      return { valid: false, error: 'Cryptographic signature verification failed: tampered invitation or forged identity' };
    }

    // 3. Protocol version check
    if (payload.protocolVersion !== AppConfig.protocolVersion) {
      return {
        valid: false,
        error: `Incompatible protocol version: expected "${AppConfig.protocolVersion}", got "${payload.protocolVersion}"`,
      };
    }

    // 4. Expiration verification
    const now = Date.now();
    if (now > payload.expiresAt) {
      return {
        valid: false,
        error: `Invitation has expired (${Math.round((now - payload.expiresAt) / 1000)} seconds ago)`,
      };
    }

    // 5. Issuer self-check (cannot pair with oneself)
    const currentUser = await identityService.getCurrentUser();
    if (currentUser && payload.issuerUserId === currentUser.id) {
      return { valid: false, error: 'Self-pairing rejected: Cannot accept an invitation created by this device' };
    }

    // 6. Existing Relationship check (check for blocked or revoked status)
    const existingRelationship = await relationshipRepository.getByPeerUserId(payload.issuerUserId);
    if (existingRelationship) {
      if (existingRelationship.state === 'blocked') {
        return { valid: false, error: 'Relationship with this peer is blocked' };
      }
      if (existingRelationship.state === 'revoked') {
        return { valid: false, error: 'Relationship with this peer was revoked' };
      }
    }

    return {
      valid: true,
      invitation: payload,
    };
  }

  /**
   * Accepts a validated invitation, saving peer contact and establishing relationship.
   */
  public async acceptInvitation(invitation: InvitationPayload): Promise<RelationshipEntity> {
    const validation = await this.validateInvitation(JSON.stringify(invitation));
    if (!validation.valid || !validation.invitation) {
      throw new ValidationError(`Cannot accept invalid invitation: ${validation.error}`);
    }

    // Replay attack / duplicate invitation check
    const usedKey = `inv_used_${invitation.invitationId}`;
    const alreadyProcessed = await appMetadataRepository.get<boolean>(usedKey);
    if (alreadyProcessed) {
      throw new SecurityError(`Duplicate/Replayed invitation rejected: ${invitation.invitationId}`);
    }

    const peerUserId = invitation.issuerUserId;
    const now = Date.now();

    // 1. Store or update Contact
    const contact: ContactEntity = {
      id: peerUserId,
      displayName: invitation.bootstrapInformation.displayName || 'Peer_' + peerUserId.substring(4, 8),
      avatar: invitation.bootstrapInformation.avatar,
      publicIdentity: invitation.issuerPublicIdentity,
      deviceIds: [invitation.issuerDeviceId],
      establishedAt: now,
      lastActiveAt: now,
    };
    await contactRepository.save(contact);

    // 2. Establish Relationship
    let relationship = await relationshipRepository.getByPeerUserId(peerUserId);
    if (!relationship) {
      relationship = {
        id: 'rel_' + Math.random().toString(36).substring(2, 11),
        peerUserId,
        peerDeviceId: invitation.issuerDeviceId,
        peerPublicIdentity: invitation.issuerPublicIdentity,
        state: 'accepted',
        initiatedByUs: false,
        invitationId: invitation.invitationId,
        createdAt: now,
        updatedAt: now,
        verifiedAt: now,
      };
    } else {
      relationship.state = 'accepted';
      relationship.updatedAt = now;
      relationship.verifiedAt = now;
      relationship.peerDeviceId = invitation.issuerDeviceId;
      relationship.peerPublicIdentity = invitation.issuerPublicIdentity;
    }

    await relationshipRepository.save(relationship);
    await appMetadataRepository.set(usedKey, true);

    eventBus.emit(AppEvents.INVITATION_ACCEPTED, { invitation, relationship, contact });
    eventBus.emit(AppEvents.RELATIONSHIP_CHANGED, relationship);
    logger.info('InvitationService', `Successfully established accepted relationship with peer ${peerUserId}`);

    return relationship;
  }

  /**
   * Updates state of a relationship (pending, accepted, blocked, revoked).
   */
  public async updateRelationshipState(peerUserId: string, state: RelationshipState): Promise<RelationshipEntity> {
    const relationship = await relationshipRepository.getByPeerUserId(peerUserId);
    if (!relationship) {
      throw new ValidationError(`No relationship found for peer ${peerUserId}`);
    }

    relationship.state = state;
    relationship.updatedAt = Date.now();
    await relationshipRepository.save(relationship);

    eventBus.emit(AppEvents.RELATIONSHIP_CHANGED, relationship);
    logger.info('InvitationService', `Updated relationship with ${peerUserId} to state: ${state}`);
    return relationship;
  }
}

export const invitationService = new InvitationService();
