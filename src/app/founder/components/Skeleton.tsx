import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ width = "100%", height = 20, className = "" }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    style={{ width, height }}
  />
);

export default Skeleton;
