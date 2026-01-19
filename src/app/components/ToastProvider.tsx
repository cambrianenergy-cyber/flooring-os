"use client";
import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext({
  show: (msg: string, type: "success" | "error" | "info" = "info") => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({ message: "", type: "info", visible: false });

  const show = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast.visible && (
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white transition-all
            ${toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-gray-800"}`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
