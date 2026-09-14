// MUSCAL Architecture Interfaces

export type ExecutionLayer = "LOCAL" | "SERVER" | "CLOUD";

export interface ModelResponse {
  content: string;
  model: string;
  provider: ExecutionLayer;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ModelProvider {
  name: string;
  layer: ExecutionLayer;
  isAvailable(): Promise<boolean>;
  generateContent(messages: Message[]): Promise<ModelResponse>;
}

export interface WebRTCDevice {
  id: string;
  name: string;
  type: string;
  platform: string;
  capabilities: string[];
  connectionState: "connected" | "disconnected" | "connecting";
  syncthingState?: "connected" | "syncing" | "offline";
  lastSeen: number;
}

export interface SyncthingConnector {
  getStatus(): Promise<{ connected: boolean; version?: string }>;
  getFolders(): Promise<any[]>;
}

export interface GoogleDriveConnector {
  isConnected(): boolean;
  authenticate(): Promise<void>;
  search(query: string): Promise<any[]>;
}

export interface DatabaseProvider {
  connect(): Promise<void>;
  query(sql: string, params: any[]): Promise<any>;
}

export interface RAG {
  ingest(content: string, metadata: any): Promise<void>;
  search(query: string): Promise<any[]>;
}

export interface DesktopAgent {
  isConnected(): boolean;
  executeTool(toolName: string, args: any): Promise<any>;
}

export interface ExecutionTraceEntry {
  id: string;
  timestamp: number;
  intent: string;
  model: string;
  plan: string;
  tool: string;
  arguments: any;
  action: string;
  observation: string;
  verification: string;
  result: string;
  latency: number;
  error?: string;
  layer: ExecutionLayer;
}
