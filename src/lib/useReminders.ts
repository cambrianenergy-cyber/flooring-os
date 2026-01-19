import { useEffect } from "react";

// Simple reminder/notification hook
export function useReminders(reminders: { message: string; time: Date }[], onNotify?: (msg: string) => void) {
  useEffect(() => {
    const timers: NodeJS.Timeout[] = reminders.map(reminder => {
      const delay = reminder.time.getTime() - Date.now();
      if (delay > 0) {
        return setTimeout(() => {
          if (onNotify) onNotify(reminder.message);
          window.dispatchEvent(new CustomEvent("toast", { detail: { type: "info", message: reminder.message } }));
        }, delay);
      }
      return null;
    }).filter(Boolean) as NodeJS.Timeout[];
    return () => timers.forEach(clearTimeout);
  }, [reminders, onNotify]);
}
