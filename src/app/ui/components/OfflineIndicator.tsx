import React from 'react';
import { useOnlineStatus } from '@/app/ui/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-status-banner"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 text-slate-950 dark:text-slate-900 px-3.5 py-2 text-xs font-semibold shadow-xl backdrop-blur-sm border border-amber-400/60 animate-bounce"
    >
      <WifiOff className="w-4 h-4" />
      <span>Offline Mode — Operating local-first with cached data</span>
    </div>
  );
};
