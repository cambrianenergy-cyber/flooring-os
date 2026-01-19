import { useEffect, useState } from "react";

// Simple offline sync hook for demo purposes
export function useOfflineSync<T>(key: string, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [isOffline, setIsOffline] = useState(false);

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

  // Sync logic: when back online, push local changes to server (placeholder)
  useEffect(() => {
    if (!isOffline) {
      // TODO: Implement sync to backend
      // Example: fetch('/api/sync', { method: 'POST', body: JSON.stringify(data) })
    }
  }, [isOffline, data]);

  return { data, setData, isOffline };
}
