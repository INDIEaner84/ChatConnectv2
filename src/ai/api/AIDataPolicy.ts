/**
 * AI Data Policy contracts.
 * 
 * Regulates which data categories can be processed locally vs sent to remote models.
 * Remote models must NEVER receive localOnly data without policy clearance.
 */

export const AI_DATA_SENSITIVITIES = [
  'public',
  'private',
  'sensitive',
] as const;

export type AIDataSensitivity = (typeof AI_DATA_SENSITIVITIES)[number];

export const AI_DATA_SCOPES = [
  'localOnly',
  'remoteAllowed',
  'userApprovalRequired',
] as const;

export type AIDataScope = (typeof AI_DATA_SCOPES)[number];

export interface AIDataPolicy {
  readonly sensitivity: AIDataSensitivity;
  readonly scope: AIDataScope;
  readonly allowedRemoteProviders?: readonly string[];
  readonly userApprovedRemote?: boolean;
}

export const DEFAULT_LOCAL_ONLY_POLICY: AIDataPolicy = {
  sensitivity: 'private',
  scope: 'localOnly',
  userApprovedRemote: false,
};

export const DEFAULT_PUBLIC_POLICY: AIDataPolicy = {
  sensitivity: 'public',
  scope: 'remoteAllowed',
  userApprovedRemote: true,
};

/**
 * Validates whether the given data policy allows dispatch to a remote model provider.
 */
export function canDispatchToRemote(
  policy: AIDataPolicy,
  providerId: string
): { allowed: boolean; reason?: string } {
  if (policy.scope === 'localOnly') {
    return {
      allowed: false,
      reason: `Data policy strictly forbids remote transmission (scope is "localOnly")`,
    };
  }

  if (policy.sensitivity === 'sensitive' && !policy.userApprovedRemote) {
    return {
      allowed: false,
      reason: `Sensitive data requires explicit user approval before remote transmission`,
    };
  }

  if (policy.scope === 'userApprovalRequired' && !policy.userApprovedRemote) {
    return {
      allowed: false,
      reason: `Data scope requires explicit user approval before remote transmission`,
    };
  }

  if (
    policy.allowedRemoteProviders &&
    policy.allowedRemoteProviders.length > 0 &&
    !policy.allowedRemoteProviders.includes(providerId)
  ) {
    return {
      allowed: false,
      reason: `Provider "${providerId}" is not in the allowed remote providers whitelist`,
    };
  }

  return { allowed: true };
}
