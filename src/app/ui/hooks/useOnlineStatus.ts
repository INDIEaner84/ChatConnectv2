import { useEffect, useState } from 'react';
import { eventBus, AppEvents } from '@/core/events/EventBus';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      eventBus.emit(AppEvents.NETWORK_ONLINE);
    };

    const handleOffline = () => {
      setIsOnline(false);
      eventBus.emit(AppEvents.NETWORK_OFFLINE);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
