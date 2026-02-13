import React from "react";

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  className = "",
}) => (
  <div className={`animate-pulse bg-white rounded-lg shadow p-4 ${className}`}>
    {[...Array(lines)].map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-gray-200 rounded mb-2 ${i === lines - 1 ? "w-1/2" : "w-full"}`}
      />
    ))}
  </div>
);

export default SkeletonCard;
