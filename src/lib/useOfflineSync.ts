import { useEffect, useState } from "react";

// Simple offline sync hook for demo purposes
export function useOfflineSync<T>(key: string, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Load from localStorage if offline
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);
    if (!navigator.onLine) {
      const cached = localStorage.getItem(key);
      if (cached) setData(JSON.parse(cached));
    }
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [key]);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [key, data]);

  // Sync logic: when back online, push local changes to server
  useEffect(() => {
    if (!isOffline) {
      const serialized = JSON.stringify(data);
      if (lastSynced === serialized) return; // Don't re-sync if unchanged
      setSyncError(null);
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
      })
        .then(res => {
          if (!res.ok) throw new Error('Sync failed');
          setLastSynced(serialized);
        })
        .catch(err => {
          setSyncError(err.message || 'Sync error');
        });
    }
  }, [isOffline, data, lastSynced]);

  return { data, setData, isOffline, syncError };
}
