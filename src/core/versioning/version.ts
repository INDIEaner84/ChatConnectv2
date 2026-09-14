/**
 * Version and release metadata for Chat Connect / MUSCAL Runtime.
 */

export interface VersionInfo {
  version: string;
  phase: string;
  phaseCode: string;
  releaseName: string;
  protocolVersion: string;
  buildTime: string;
  gitBranch: string;
  lastStableCommit: string;
  isPWA: boolean;
}

export const APP_VERSION_METADATA: VersionInfo = {
  version: 'v0.5.0-plugins',
  phase: 'Phase 5: Extension Architecture Foundation',
  phaseCode: 'phase-5-plugins',
  releaseName: 'Chat Connect Plugin Contracts, Capability Model & UI Extension Points',
  protocolVersion: 'muscal.chatconnect.v1',
  buildTime: new Date().toISOString(),
  gitBranch: 'develop',
  lastStableCommit: 'phase-5-plugins',
  isPWA: true,
};

export function getVersionString(): string {
  return `${APP_VERSION_METADATA.version} (${APP_VERSION_METADATA.phaseCode})`;
}
