import React from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  ctaLabel,
  onCtaClick,
  icon,
  className = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
  >
    {icon && <div className="mb-4 text-4xl text-gray-300">{icon}</div>}
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    {description && <p className="text-gray-500 mb-4">{description}</p>}
    {ctaLabel && onCtaClick && (
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={onCtaClick}
      >
        {ctaLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
