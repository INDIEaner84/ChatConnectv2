/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cyberpunk & Akira Aesthetic Nickname Engine
 * Provides rich, evocative node aliases instead of generic "Peer (id...)",
 * and supports custom user-defined peer nickname overrides with persistent storage.
 */

const CYBERPUNK_PREFIXES = [
  "Ghost Runner",
  "Cyber Phantom",
  "Neo Weaver",
  "Tetsuo",
  "Kanon Vector",
  "Cipher Valkyrie",
  "Aegis Sentinel",
  "Chronos Probe",
  "Sol Horizon",
  "Vortex Echo",
  "Zero Drifter",
  "Quantum Shard",
  "Pulse Stalker",
  "Laser Geist",
  "Neural Nomad",
  "Akira Unit",
  "Titan Cortex",
  "Specter Node"
];

const CYBERPUNK_ROLES = [
  "Core Operator",
  "Mesh Infiltrator",
  "Signal Scout",
  "Vector Analyst",
  "Crypt Sentinel",
  "Kernel Runner",
  "Edge Pilot"
];

class NicknameEngine {
  private customNicknames: Map<string, string> = new Map();

  constructor() {
    this.loadOverrides();
  }

  private loadOverrides() {
    try {
      const stored = localStorage.getItem("muscal_peer_nicknames");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.customNicknames = new Map(Object.entries(parsed));
      }
    } catch (e) {
      console.warn("Failed to parse custom nicknames from storage", e);
    }
  }

  private saveOverrides() {
    try {
      const obj = Object.fromEntries(this.customNicknames.entries());
      localStorage.setItem("muscal_peer_nicknames", JSON.stringify(obj));
    } catch (e) {
      console.warn("Failed to persist custom nicknames", e);
    }
  }

  /**
   * Deterministically generate or retrieve nickname for any peer ID
   */
  public getNickname(peerId: string): string {
    return this.generateDeterministicAlias(peerId);
  }

  /**
   * Deterministically generate a cool cyberpunk alias for any peer ID
   */
  public generateDeterministicAlias(peerId: string): string {
    if (!peerId) return "Unknown Node";
    
    // Check for user-defined nickname override first
    if (this.customNicknames.has(peerId)) {
      return this.customNicknames.get(peerId)!;
    }

    let hash = 0;
    for (let i = 0; i < peerId.length; i++) {
      hash = (hash << 5) - hash + peerId.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    const prefix = CYBERPUNK_PREFIXES[absHash % CYBERPUNK_PREFIXES.length];
    const hexSuffix = peerId.replace(/[^a-fA-F0-9]/g, "").slice(-4).toUpperCase() || (absHash % 1000).toString(16).toUpperCase().padStart(3, "0");

    return `${prefix} #${hexSuffix}`;
  }

  /**
   * Get role descriptor based on peer hash
   */
  public getRoleDescriptor(peerId: string): string {
    let hash = 0;
    for (let i = 0; i < peerId.length; i++) {
      hash = (hash << 3) - hash + peerId.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    return CYBERPUNK_ROLES[absHash % CYBERPUNK_ROLES.length];
  }

  /**
   * Set a custom nickname for a peer ID
   */
  public setCustomNickname(peerId: string, nickname: string) {
    if (!nickname.trim()) {
      this.customNicknames.delete(peerId);
    } else {
      this.customNicknames.set(peerId, nickname.trim());
    }
    this.saveOverrides();
  }

  /**
   * Get custom nickname if exists
   */
  public getCustomNickname(peerId: string): string | null {
    return this.customNicknames.get(peerId) || null;
  }
}

export const nicknameEngine = new NicknameEngine();
