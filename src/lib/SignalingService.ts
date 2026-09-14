import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { SignalingMessage } from './WebRTCManager';

export class SignalingService {
  private localDeviceId: string;
  private unsubscribe: (() => void) | null = null;
  private onMessageCallback: ((msg: SignalingMessage) => void) | null = null;

  constructor(localDeviceId: string) {
    this.localDeviceId = localDeviceId;
  }

  onMessage(callback: (msg: SignalingMessage) => void) {
    this.onMessageCallback = callback;
  }

  async startListening() {
    if (this.unsubscribe) return;

    const signalsRef = collection(db, 'signals');
    const q = query(
      signalsRef, 
      where('targetDeviceId', '==', this.localDeviceId)
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          // Parse the document data
          const data = change.doc.data();
          const message: SignalingMessage = {
            type: data.type,
            sourceDeviceId: data.sourceDeviceId,
            targetDeviceId: data.targetDeviceId,
          };
          
          if (data.sdp) {
            // Need to parse stringified JSON if it was stored that way, or just assign
            message.sdp = typeof data.sdp === 'string' ? JSON.parse(data.sdp) : data.sdp;
          }
          if (data.candidate) {
            message.candidate = typeof data.candidate === 'string' ? JSON.parse(data.candidate) : data.candidate;
          }

          if (this.onMessageCallback) {
            this.onMessageCallback(message);
          }
          // Clean up the processed signal to keep the DB clean
          deleteDoc(change.doc.ref).catch(err => console.error('Error deleting signal:', err));
        }
      });
    }, (error) => {
      console.error('SignalingService onSnapshot error:', error);
    });
  }

  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  async sendSignal(message: SignalingMessage) {
    try {
      const signalsRef = collection(db, 'signals');
      
      // Firestore sometimes struggles with complex nested objects like RTCSessionDescription
      // So we stringify them for safe transport
      const payload: any = {
        type: message.type,
        sourceDeviceId: message.sourceDeviceId,
        targetDeviceId: message.targetDeviceId,
        createdAt: serverTimestamp()
      };
      
      if (message.sdp) {
        payload.sdp = JSON.stringify(message.sdp);
      }
      if (message.candidate) {
        payload.candidate = JSON.stringify(message.candidate);
      }

      await addDoc(signalsRef, payload);
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  }
}
