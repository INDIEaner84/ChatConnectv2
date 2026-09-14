/**
 * Device Capability Model for AI & Runtime Model Selection.
 * Describes client hardware resources, compute accelerators, and operating constraints.
 */

export interface DeviceComputeProfile {
  readonly cpuCores: number;
  readonly hasWebGPU: boolean;
  readonly hasWASM: boolean;
  readonly hasNPU: boolean;
  readonly ramMb: number;
  readonly availableStorageMb: number;
  readonly concurrencyLimit: number;
}

export interface DeviceRuntimeEnvironment {
  readonly isBatteryPowered: boolean;
  readonly batteryLevel?: number; // 0.0 to 1.0
  readonly isLowPowerMode: boolean;
  readonly networkType: 'wifi' | 'cellular' | 'ethernet' | 'offline' | 'unknown';
  readonly isMeteredConnection: boolean;
}

export interface DeviceCapabilityProfile {
  readonly compute: DeviceComputeProfile;
  readonly environment: DeviceRuntimeEnvironment;
  readonly platform: 'browser' | 'worker' | 'node' | 'hybrid';
  readonly userAllowsBackgroundCompute: boolean;
}

/**
 * Creates a baseline default capability profile for the current browser/runtime.
 */
export function detectDeviceCapabilityProfile(): DeviceCapabilityProfile {
  const isBrowser = typeof window !== 'undefined';
  const nav = isBrowser ? navigator : null;

  const cores = nav?.hardwareConcurrency || 4;
  // Estimate device memory if available in Chrome/Edge, fallback to 4096MB
  const ramMb = (nav && 'deviceMemory' in nav ? (nav as { deviceMemory?: number }).deviceMemory || 4 : 4) * 1024;

  const hasWASM = typeof WebAssembly !== 'undefined';
  const hasWebGPU = isBrowser && 'gpu' in nav;

  return {
    compute: {
      cpuCores: cores,
      hasWebGPU,
      hasWASM,
      hasNPU: false,
      ramMb,
      availableStorageMb: 2048,
      concurrencyLimit: Math.max(1, Math.min(cores - 1, 4)),
    },
    environment: {
      isBatteryPowered: false,
      batteryLevel: 1.0,
      isLowPowerMode: false,
      networkType: isBrowser && nav?.onLine === false ? 'offline' : 'wifi',
      isMeteredConnection: false,
    },
    platform: isBrowser ? 'browser' : 'hybrid',
    userAllowsBackgroundCompute: true,
  };
}
