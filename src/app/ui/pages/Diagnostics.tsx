import React, { useEffect, useState } from 'react';
import { APP_VERSION_METADATA } from '@/core/versioning/version';
import { useOnlineStatus } from '@/app/ui/hooks/useOnlineStatus';
import { usePWAInstall } from '@/app/ui/hooks/usePWAInstall';
import { localDb } from '@/storage/IndexedDBDatabase';
import { userRepository } from '@/storage/repositories/UserRepository';
import { deviceRepository } from '@/storage/repositories/DeviceRepository';
import { messageRepository } from '@/storage/repositories/MessageRepository';
import { syncStateRepository } from '@/storage/repositories/SyncStateRepository';
import { logger, LogEntry } from '@/core/logging/Logger';
import { Activity, ShieldCheck, Database, HardDrive, Wifi, Radio, GitBranch, Cpu, RefreshCw, Trash2 } from 'lucide-react';

export const Diagnostics: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isInstalled, isInstallable } = usePWAInstall();
  const [swStatus, setSwStatus] = useState<string>('Checking...');
  const [dbStatus, setDbStatus] = useState<Record<string, number>>({});
  const [identityInfo, setIdentityInfo] = useState<{ userId?: string; displayName?: string; hasKey?: boolean }>({});
  const [deviceInfo, setDeviceInfo] = useState<{ deviceId?: string; deviceName?: string }>({});
  const [syncQueueCount, setSyncQueueCount] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  const refreshDiagnostics = async () => {
    // 1. Service worker status
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          const active = registrations.find((r) => r.active);
          setSwStatus(active ? 'Active & Running' : 'Registered (Waiting/Installing)');
        } else {
          setSwStatus('Supported, Not Yet Registered');
        }
      } catch {
        setSwStatus('Error Querying Service Worker');
      }
    } else {
      setSwStatus('Not Supported by Browser');
    }

    // 2. Storage counts
    try {
      const users = await localDb.count('users');
      const devices = await localDb.count('devices');
      const contacts = await localDb.count('contacts');
      const relationships = await localDb.count('relationships');
      const conversations = await localDb.count('conversations');
      const messages = await localDb.count('messages');
      const attachments = await localDb.count('attachments');

      setDbStatus({
        users,
        devices,
        contacts,
        relationships,
        conversations,
        messages,
        attachments,
      });
    } catch {
      setDbStatus({ error: -1 });
    }

    // 3. Current identity
    const user = await userRepository.getCurrentUser();
    if (user) {
      setIdentityInfo({
        userId: user.id,
        displayName: user.displayName,
        hasKey: Boolean(user.publicIdentity),
      });
    } else {
      setIdentityInfo({});
    }

    // 4. Device ID
    const device = await deviceRepository.getCurrentDevice();
    if (device) {
      setDeviceInfo({
        deviceId: device.id,
        deviceName: device.deviceName,
      });
    }

    // 5. Sync queue
    const pending = await messageRepository.getPendingMessages();
    setSyncQueueCount(pending.length);

    // 6. Logs (already sanitized)
    setLogs(logger.getLogs().slice(-50).reverse());
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    refreshDiagnostics();
    const unsubscribe = logger.subscribe(() => {
      setLogs(logger.getLogs().slice(-50).reverse());
    });
    const interval = setInterval(refreshDiagnostics, 5000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleClearLogs = () => {
    logger.clear();
    setLogs([]);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-sky-500" />
            Developer Diagnostics & System Health
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry, storage state, and cryptographic isolation inspection (Zero secrets exposed).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Refreshed: {lastRefreshed}</span>
          <button
            onClick={refreshDiagnostics}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Grid of Diagnostic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Version & Build */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-sky-500" />
              Runtime Version
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
              {APP_VERSION_METADATA.version}
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{APP_VERSION_METADATA.phase}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>Branch:</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">{APP_VERSION_METADATA.gitBranch}</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Commit Anchor:</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">{APP_VERSION_METADATA.lastStableCommit}</span>
          </div>
        </div>

        {/* PWA & Service Worker */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-500" />
              PWA & Service Worker
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
              isInstalled ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
            }`}>
              {isInstalled ? 'Installed PWA' : isInstallable ? 'Installable' : 'Browser Web'}
            </span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-200 font-mono truncate">{swStatus}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>Connectivity:</span>
            <span className={`font-semibold ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Protocol:</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">{APP_VERSION_METADATA.protocolVersion}</span>
          </div>
        </div>

        {/* Identity & Device */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Identity Status
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {identityInfo.userId ? 'Initialized' : 'Uninitialized'}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
            {identityInfo.userId ? `User: ${identityInfo.displayName} (${identityInfo.userId.slice(0, 8)}...)` : 'No user configured'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>Device ID:</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">
              {deviceInfo.deviceId ? `${deviceInfo.deviceId.slice(0, 10)}...` : 'Pending'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Key Isolation:</span>
            <span className="text-emerald-500 font-semibold">WebCrypto KeyStore (Protected)</span>
          </div>
        </div>

        {/* Sync & Queue */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-500" />
              Sync & Queue State
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
              syncQueueCount > 0 ? 'bg-amber-100 dark:bg-amber-950 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
            }`}>
              {syncQueueCount > 0 ? `${syncQueueCount} Queued` : 'Synced'}
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {syncQueueCount} Pending Outbound Messages
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>Storage Engine:</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">
              {localDb.isUsingFallback() ? 'In-Memory Fallback' : 'IndexedDB (Local)'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Total Messages:</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">{dbStatus.messages ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Storage Store Breakdown */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-sky-500" />
          IndexedDB Object Store Entity Registry
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-2">
          {Object.entries(dbStatus).map(([name, count]) => (
            <div key={name} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{count}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Structured Security-Sanitized Audit Log */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-500" />
            Security & System Audit Stream ({logs.length} events, zero secrets)
          </h2>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
        <div className="h-64 overflow-y-auto rounded-xl bg-slate-950 p-3 font-mono text-xs text-slate-300 space-y-1.5 border border-slate-800">
          {logs.length === 0 ? (
            <div className="text-slate-500 text-center py-8">No log events recorded.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="leading-relaxed flex items-start gap-2 text-[11px]">
                <span className="text-slate-500 flex-shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span
                  className={`font-bold flex-shrink-0 ${
                    log.level === 'ERROR'
                      ? 'text-red-400'
                      : log.level === 'WARN'
                      ? 'text-amber-400'
                      : log.level === 'INFO'
                      ? 'text-sky-400'
                      : 'text-slate-400'
                  }`}
                >
                  [{log.level}]
                </span>
                <span className="text-indigo-400 flex-shrink-0">[{log.context}]</span>
                <span className="text-slate-200 flex-1">{log.message}</span>
                {log.meta && (
                  <span className="text-slate-500 truncate max-w-xs">{JSON.stringify(log.meta)}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
