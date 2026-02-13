import React from "react";

interface ErrorStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
  >
    {icon && <div className="mb-4 text-4xl text-red-300">{icon}</div>}
    <h3 className="text-lg font-semibold text-red-700 mb-2">{title}</h3>
    {description && <p className="text-gray-500 mb-4">{description}</p>}
    {actionLabel && onAction && (
      <button
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default ErrorState;
