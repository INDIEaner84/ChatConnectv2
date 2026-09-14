export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  sourceDeviceId: string;
  targetDeviceId: string;
}

export interface WebRTCManager {
  connect(deviceId: string): Promise<void>;
  disconnect(): void;
  sendMessage(payload: any): void;
  onMessage(callback: (message: any) => void): void;
  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void;
  
  // Signaling Layer Preparation
  handleSignalingMessage(message: SignalingMessage): Promise<void>;
  onEmitSignal(callback: (message: SignalingMessage) => void): void;
}

export class DefaultWebRTCManager implements WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private targetDeviceId: string | null = null;
  private localDeviceId: string;

  private messageCallback: ((message: any) => void) | null = null;
  private stateCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  private signalEmitCallback: ((msg: SignalingMessage) => void) | null = null;

  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }
    ]
  };

  constructor(localDeviceId: string) {
    this.localDeviceId = localDeviceId;
  }

  private initializePeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    this.peerConnection.onconnectionstatechange = () => {
      if (this.stateCallback && this.peerConnection) {
        this.stateCallback(this.peerConnection.connectionState);
      }
    };

    // ICE Candidate gathering for signaling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.targetDeviceId && this.signalEmitCallback) {
        this.signalEmitCallback({
          type: 'ice-candidate',
          candidate: event.candidate,
          sourceDeviceId: this.localDeviceId,
          targetDeviceId: this.targetDeviceId
        });
      }
    };

    // Handle incoming data channels (if we are the answerer)
    this.peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;
    
    this.dataChannel.onopen = () => console.log(`DataChannel open with ${this.targetDeviceId}`);
    this.dataChannel.onclose = () => console.log(`DataChannel closed with ${this.targetDeviceId}`);
    
    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.messageCallback) this.messageCallback(data);
      } catch (err) {
        console.error("Failed to parse WebRTC message", err);
      }
    };
  }

  async connect(deviceId: string): Promise<void> {
    this.targetDeviceId = deviceId;
    this.initializePeerConnection();

    if (!this.peerConnection) return;

    // We are the initiator (offerer)
    const channel = this.peerConnection.createDataChannel("muscal-control", { ordered: true });
    this.setupDataChannel(channel);

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      if (this.signalEmitCallback) {
        this.signalEmitCallback({
          type: 'offer',
          sdp: offer,
          sourceDeviceId: this.localDeviceId,
          targetDeviceId: this.targetDeviceId
        });
      }
    } catch (error) {
      console.error("Error creating WebRTC offer", error);
    }
  }

  async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    if (!this.peerConnection && message.type === 'offer') {
      this.targetDeviceId = message.sourceDeviceId;
      this.initializePeerConnection();
    }

    if (!this.peerConnection) {
      console.warn("Received signaling message but PeerConnection is not initialized");
      return;
    }

    try {
      if (message.type === 'offer' && message.sdp) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        if (this.signalEmitCallback && this.targetDeviceId) {
          this.signalEmitCallback({
            type: 'answer',
            sdp: answer,
            sourceDeviceId: this.localDeviceId,
            targetDeviceId: this.targetDeviceId
          });
        }
      } else if (message.type === 'answer' && message.sdp) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
      } else if (message.type === 'ice-candidate' && message.candidate) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    } catch (error) {
      console.error(`Error handling signaling message (${message.type}):`, error);
    }
  }

  disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.targetDeviceId = null;
  }

  sendMessage(payload: any): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(JSON.stringify(payload));
    } else {
      console.warn("DataChannel not open");
    }
  }

  onMessage(callback: (message: any) => void): void {
    this.messageCallback = callback;
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void {
    this.stateCallback = callback;
  }

  onEmitSignal(callback: (message: SignalingMessage) => void): void {
    this.signalEmitCallback = callback;
  }
}
