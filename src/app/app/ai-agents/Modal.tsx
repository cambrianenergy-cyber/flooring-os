import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay bg-opacity-60">
      <div className="bg-surface rounded-lg shadow-lg max-w-lg w-full p-6 relative border-soft">
        <button
          className="absolute top-2 right-2 text-muted hover:text-primary text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-primary">{title}</h2>
        {children}
      </div>
    </div>
  );
}
