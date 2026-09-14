/**
 * WebRTCConnectionManager Service
 * Hooks into the Firestore SignalingService to handle WebRTC peer-to-peer negotiation,
 * local audio/video stream capture, remote media tracks, and data channel events.
 */

import { SignalingService } from "./SignalingService";
import { SignalingMessage } from "./WebRTCManager";
import { auditLogger } from "./AuditLogger";
import { useMuscalStore } from "@/store/useMuscalStore";

export interface DataChannelMessage {
  type: "CHAT" | "TELEMETRY" | "RAG_SYNC" | "HEARTBEAT" | "MEDIA_CONTROL";
  payload: any;
  timestamp: number;
  senderDeviceId: string;
}

export type WebRTCState = "disconnected" | "connecting" | "connected" | "failed" | "closed";

export class WebRTCConnectionManager {
  private static instance: WebRTCConnectionManager;

  private localDeviceId: string;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private signalingService: SignalingService;

  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private targetDeviceId: string | null = null;

  private connectionState: WebRTCState = "disconnected";
  private stateListeners: Set<(state: WebRTCState) => void> = new Set();
  private messageListeners: Set<(msg: DataChannelMessage) => void> = new Set();
  private streamListeners: Set<(stream: MediaStream | null, isLocal: boolean) => void> = new Set();

  private readonly iceServers: RTCConfiguration = {
    iceServers: [
      { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }
    ]
  };

  private constructor() {
    // Generate or retrieve persistent local device identifier
    let storedId = localStorage.getItem("muscal_device_id");
    if (!storedId) {
      storedId = `dev-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("muscal_device_id", storedId);
    }
    this.localDeviceId = storedId;

    // Initialize signaling service over Firestore
    this.signalingService = new SignalingService(this.localDeviceId);
    this.setupSignaling();
  }

  public static getInstance(): WebRTCConnectionManager {
    if (!WebRTCConnectionManager.instance) {
      WebRTCConnectionManager.instance = new WebRTCConnectionManager();
    }
    return WebRTCConnectionManager.instance;
  }

  public getLocalDeviceId(): string {
    return this.localDeviceId;
  }

  public getConnectionState(): WebRTCState {
    return this.connectionState;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  private setConnectionState(newState: WebRTCState) {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      auditLogger.log({
        category: "WEBRTC",
        severity: newState === "failed" ? "ERROR" : "INFO",
        action: "CONNECTION_STATE_CHANGED",
        description: `WebRTC peer state transitioned to ${newState.toUpperCase()}`,
        actor: "WEBRTC",
        metadata: { state: newState, targetDeviceId: this.targetDeviceId }
      });

      if (this.targetDeviceId) {
        const store = useMuscalStore.getState();
        store.updateDeviceState(
          this.targetDeviceId,
          newState === "connected" ? "connected" : newState === "connecting" ? "connecting" : "disconnected"
        );
      }

      this.stateListeners.forEach((cb) => cb(newState));
    }
  }

  /**
   * Subscribes to Firestore-based signaling offers, answers, and ICE candidates.
   */
  private setupSignaling() {
    this.signalingService.onMessage(async (message: SignalingMessage) => {
      try {
        auditLogger.log({
          category: "WEBRTC",
          severity: "INFO",
          action: "SIGNALING_MESSAGE_RECEIVED",
          description: `Received ${message.type.toUpperCase()} from ${message.sourceDeviceId}`,
          actor: "PEER",
          metadata: { type: message.type, source: message.sourceDeviceId }
        });

        if (message.type === "offer") {
          await this.handleOffer(message);
        } else if (message.type === "answer") {
          await this.handleAnswer(message);
        } else if (message.type === "ice-candidate") {
          await this.handleIceCandidate(message);
        }
      } catch (err: any) {
        console.error("Error processing signaling message:", err);
        auditLogger.log({
          category: "WEBRTC",
          severity: "ERROR",
          action: "SIGNALING_PROCESSING_FAILED",
          description: `Failed to process ${message.type}: ${err.message}`,
          actor: "WEBRTC"
        });
      }
    });

    this.signalingService.startListening();
  }

  private initPeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.peerConnection = new RTCPeerConnection(this.iceServers);

    this.peerConnection.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState;
      if (state === "connected") this.setConnectionState("connected");
      else if (state === "connecting") this.setConnectionState("connecting");
      else if (state === "failed") this.setConnectionState("failed");
      else if (state === "closed" || state === "disconnected") this.setConnectionState("disconnected");
    };

    // Relay local ICE candidates to remote peer via Firestore signaling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.targetDeviceId) {
        this.signalingService.sendSignal({
          type: "ice-candidate",
          candidate: event.candidate.toJSON(),
          sourceDeviceId: this.localDeviceId,
          targetDeviceId: this.targetDeviceId
        });
      }
    };

    // Handle remote media tracks (Audio / Video streams)
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        this.remoteStream = new MediaStream([event.track]);
      }
      auditLogger.log({
        category: "WEBRTC",
        severity: "INFO",
        action: "REMOTE_MEDIA_TRACK_RECEIVED",
        description: `Received remote ${event.track.kind} track from peer`,
        actor: "PEER",
        metadata: { kind: event.track.kind }
      });
      this.streamListeners.forEach(cb => cb(this.remoteStream, false));
    };

    // Attach local media stream tracks if already captured
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming DataChannel when answering
    this.peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;

    this.dataChannel.onopen = () => {
      this.setConnectionState("connected");
      auditLogger.log({
        category: "WEBRTC",
        severity: "INFO",
        action: "DATA_CHANNEL_OPENED",
        description: `P2P DataChannel established (${channel.label}) with peer`,
        actor: "WEBRTC",
        metadata: { channel: channel.label }
      });

      // Send initial handshake ping
      this.sendData({
        type: "HEARTBEAT",
        payload: { status: "ready", client: "MUSCAL WebRTC Manager" }
      });
    };

    this.dataChannel.onclose = () => {
      this.setConnectionState("disconnected");
      auditLogger.log({
        category: "WEBRTC",
        severity: "WARN",
        action: "DATA_CHANNEL_CLOSED",
        description: "P2P DataChannel closed",
        actor: "WEBRTC"
      });
    };

    this.dataChannel.onerror = (err) => {
      auditLogger.log({
        category: "WEBRTC",
        severity: "ERROR",
        action: "DATA_CHANNEL_ERROR",
        description: `DataChannel error occurred: ${err}`,
        actor: "WEBRTC"
      });
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const parsed: DataChannelMessage = JSON.parse(event.data);
        this.messageListeners.forEach(cb => cb(parsed));
      } catch {
        console.warn("Received non-JSON data channel message:", event.data);
      }
    };
  }

  /**
   * Initiates connection to a target peer device.
   */
  public async connectToPeer(targetDeviceId: string): Promise<void> {
    this.targetDeviceId = targetDeviceId;
    this.setConnectionState("connecting");
    this.initPeerConnection();

    if (!this.peerConnection) return;

    // Create reliable ordered data channel
    const channel = this.peerConnection.createDataChannel("muscal-p2p", { ordered: true });
    this.setupDataChannel(channel);

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      await this.signalingService.sendSignal({
        type: "offer",
        sdp: offer,
        sourceDeviceId: this.localDeviceId,
        targetDeviceId: targetDeviceId
      });

      auditLogger.log({
        category: "WEBRTC",
        severity: "INFO",
        action: "OFFER_DISPATCHED",
        description: `WebRTC offer generated and dispatched to ${targetDeviceId}`,
        actor: "WEBRTC"
      });
    } catch (err: any) {
      this.setConnectionState("failed");
      throw err;
    }
  }

  private async handleOffer(message: SignalingMessage) {
    this.targetDeviceId = message.sourceDeviceId;
    this.setConnectionState("connecting");
    this.initPeerConnection();

    if (!this.peerConnection || !message.sdp) return;

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await this.signalingService.sendSignal({
      type: "answer",
      sdp: answer,
      sourceDeviceId: this.localDeviceId,
      targetDeviceId: message.sourceDeviceId
    });

    auditLogger.log({
      category: "WEBRTC",
      severity: "INFO",
      action: "ANSWER_DISPATCHED",
      description: `Answered WebRTC offer from ${message.sourceDeviceId}`,
      actor: "WEBRTC"
    });
  }

  private async handleAnswer(message: SignalingMessage) {
    if (this.peerConnection && message.sdp) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
      auditLogger.log({
        category: "WEBRTC",
        severity: "INFO",
        action: "REMOTE_DESCRIPTION_SET",
        description: `Remote description set from answerer ${message.sourceDeviceId}`,
        actor: "WEBRTC"
      });
    }
  }

  private async handleIceCandidate(message: SignalingMessage) {
    if (this.peerConnection && message.candidate) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  }

  /**
   * Local Audio/Video Stream Capture
   */
  public async captureLocalStream(constraints: MediaStreamConstraints = { audio: true, video: false }): Promise<MediaStream | null> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.localStream = stream;

        // If peer connection exists, attach tracks
        if (this.peerConnection) {
          stream.getTracks().forEach((track) => {
            this.peerConnection?.addTrack(track, stream);
          });
        }

        auditLogger.log({
          category: "WEBRTC",
          severity: "INFO",
          action: "MEDIA_STREAM_CAPTURED",
          description: `Captured local media stream (Audio: ${!!constraints.audio}, Video: ${!!constraints.video})`,
          actor: "USER",
          metadata: { tracks: stream.getTracks().map(t => t.kind) }
        });

        this.streamListeners.forEach(cb => cb(this.localStream, true));
        return stream;
      }
    } catch (err: any) {
      auditLogger.log({
        category: "WEBRTC",
        severity: "WARN",
        action: "MEDIA_CAPTURE_FALLBACK",
        description: `Could not access media devices (${err.name || err.message}). Fallback to virtual synthesizer stream.`,
        actor: "SYSTEM",
        metadata: { error: String(err) }
      });

      // Graceful synthetic audio context fallback for sandboxed/headless environments
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();
        this.localStream = dest.stream;
        this.streamListeners.forEach(cb => cb(this.localStream, true));
        return dest.stream;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Screen Capture Stream
   */
  public async captureScreen(): Promise<MediaStream | null> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        this.localStream = stream;
        if (this.peerConnection) {
          stream.getTracks().forEach((track) => {
            this.peerConnection?.addTrack(track, stream);
          });
        }
        auditLogger.log({
          category: "WEBRTC",
          severity: "INFO",
          action: "SCREEN_CAPTURE_STARTED",
          description: "Screen sharing stream captured and bound to WebRTC pipeline.",
          actor: "USER"
        });
        this.streamListeners.forEach(cb => cb(this.localStream, true));
        return stream;
      }
    } catch (err) {
      console.warn("Screen capture failed:", err);
    }
    return null;
  }

  /**
   * Stops local media tracks
   */
  public stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
      this.streamListeners.forEach(cb => cb(null, true));
      auditLogger.log({
        category: "WEBRTC",
        severity: "INFO",
        action: "MEDIA_STREAM_STOPPED",
        description: "Local media stream tracks stopped.",
        actor: "USER"
      });
    }
  }

  /**
   * Sends a structured data packet through the established P2P data channel.
   */
  public sendData(message: Omit<DataChannelMessage, "timestamp" | "senderDeviceId">): boolean {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      const payload: DataChannelMessage = {
        ...message,
        timestamp: Date.now(),
        senderDeviceId: this.localDeviceId
      };
      this.dataChannel.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  public disconnect(): void {
    this.stopLocalStream();
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.targetDeviceId = null;
    this.setConnectionState("disconnected");
  }

  public onStateChange(cb: (state: WebRTCState) => void): () => void {
    this.stateListeners.add(cb);
    cb(this.connectionState);
    return () => this.stateListeners.delete(cb);
  }

  public onMessage(cb: (msg: DataChannelMessage) => void): () => void {
    this.messageListeners.add(cb);
    return () => this.messageListeners.delete(cb);
  }

  public onStream(cb: (stream: MediaStream | null, isLocal: boolean) => void): () => void {
    this.streamListeners.add(cb);
    return () => this.streamListeners.delete(cb);
  }
}

export const webrtcConnectionManager = WebRTCConnectionManager.getInstance();
