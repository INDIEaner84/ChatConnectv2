export interface WebRTCManager {
  connect(deviceId: string): Promise<void>;
  disconnect(): void;
  sendMessage(payload: any): void;
  onMessage(callback: (message: any) => void): void;
  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void;
}

export class MuscalWebRTCManager implements WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private targetDeviceId: string | null = null;

  private messageCallback: ((message: any) => void) | null = null;
  private stateCallback: ((state: RTCPeerConnectionState) => void) | null = null;

  // Configuration for STUN/TURN servers
  // In production, TURN credentials should be fetched dynamically from the backend securely.
  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302"
        ]
      },
      // Placeholder for TURN server (Required for restrictive NATs/Firewalls)
      /*
      {
        urls: "turn:turn.example.com:3478",
        username: "placeholder_user",
        credential: "placeholder_password"
      }
      */
    ]
  };

  async connect(deviceId: string): Promise<void> {
    this.targetDeviceId = deviceId;
    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    this.peerConnection.onconnectionstatechange = () => {
      if (this.stateCallback && this.peerConnection) {
        this.stateCallback(this.peerConnection.connectionState);
      }
    };

    // Set up data channel for the MUSCAL protocol
    this.dataChannel = this.peerConnection.createDataChannel("muscal-control", {
      ordered: true
    });

    this.dataChannel.onopen = () => {
      console.log(`WebRTC DataChannel opened with device: ${deviceId}`);
    };

    this.dataChannel.onclose = () => {
      console.log(`WebRTC DataChannel closed with device: ${deviceId}`);
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.messageCallback) {
          this.messageCallback(data);
        }
      } catch (err) {
        console.error("Failed to parse incoming WebRTC message", err);
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      // Handle data channel created by the remote peer
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (this.messageCallback) {
            this.messageCallback(data);
          }
        } catch (err) {
          console.error("Failed to parse incoming WebRTC message", err);
        }
      };
    };

    // Note: WebRTC Signaling logic (Offer, Answer, ICE Candidate exchange) 
    // will be integrated here in the next phase via a signaling server.
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
      console.warn("Cannot send message: WebRTC DataChannel is not open");
    }
  }

  onMessage(callback: (message: any) => void): void {
    this.messageCallback = callback;
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void {
    this.stateCallback = callback;
  }
}
