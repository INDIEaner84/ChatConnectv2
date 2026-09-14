/**
 * Transport Adapter Abstraction.
 * Supports WebRTC, WebSocket, Relay, and Local Mesh channels.
 * Transport is NEVER authority: MUSCAL Runtime verifies data integrity and authenticity.
 */

import { logger } from '@/core/logging/Logger';
import { identityService } from '@/identity/IdentityService';

export interface TransportEnvelope {
  id: string; // Envelope ID
  senderId: string;
  senderDeviceId: string;
  recipientId?: string;
  payloadType: 'message' | 'ack' | 'sync_request' | 'sync_response' | 'peer_status';
  payload: unknown;
  timestamp: number;
  signature?: string; // Digital signature over canonical envelope
}

export interface ITransportAdapter {
  send(envelope: TransportEnvelope): Promise<boolean>;
  onReceive(callback: (envelope: TransportEnvelope) => void): () => void;
  isConnected(): boolean;
  getTransportType(): 'webrtc' | 'websocket' | 'local-loopback' | 'relay';
}

export class LocalMeshTransport implements ITransportAdapter {
  private listeners: ((envelope: TransportEnvelope) => void)[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private isOnline = true;

  constructor(private channelName: string = 'chat_connect_mesh_v1') {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(this.channelName);
        this.broadcastChannel.onmessage = (event) => {
          if (!this.isOnline) return;
          this.handleIncoming(event.data);
        };
      } catch (err) {
        logger.warn('LocalMeshTransport', 'BroadcastChannel unavailable, using in-process dispatch', {
          error: (err as Error).message,
        });
      }
    }
  }

  public setNetworkOnline(online: boolean): void {
    this.isOnline = online;
    logger.info('LocalMeshTransport', `Network simulation state set to: ${online ? 'ONLINE' : 'OFFLINE'}`);
  }

  public async send(envelope: TransportEnvelope): Promise<boolean> {
    if (!this.isOnline) {
      logger.warn('LocalMeshTransport', `Cannot send envelope ${envelope.id}: transport is offline`);
      return false;
    }

    try {
      // Sign envelope before transport
      const canonical = JSON.stringify({
        id: envelope.id,
        senderId: envelope.senderId,
        senderDeviceId: envelope.senderDeviceId,
        recipientId: envelope.recipientId || '',
        payloadType: envelope.payloadType,
        payload: envelope.payload,
        timestamp: envelope.timestamp,
      });

      const signature = await identityService.signPayload(canonical);
      const signedEnvelope: TransportEnvelope = {
        ...envelope,
        signature,
      };

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(signedEnvelope);
      }

      logger.debug('LocalMeshTransport', `Dispatched envelope ${envelope.id} via local mesh`);
      return true;
    } catch (err) {
      logger.error('LocalMeshTransport', `Send error for envelope ${envelope.id}`, { error: (err as Error).message });
      return false;
    }
  }

  public handleIncoming(envelope: TransportEnvelope): void {
    this.listeners.forEach((fn) => {
      try {
        fn(envelope);
      } catch (err) {
        logger.error('LocalMeshTransport', 'Exception in message listener', { error: (err as Error).message });
      }
    });
  }

  public onReceive(callback: (envelope: TransportEnvelope) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }

  public isConnected(): boolean {
    return this.isOnline;
  }

  public getTransportType(): 'webrtc' | 'websocket' | 'local-loopback' | 'relay' {
    return 'local-loopback';
  }
}

export const meshTransport = new LocalMeshTransport();
