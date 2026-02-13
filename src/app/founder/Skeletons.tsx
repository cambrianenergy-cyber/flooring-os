
export function SkeletonPage() {
  return (
    <div className="animate-pulse p-8">
      <div className="h-8 w-1/3 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="h-6 w-1/4 bg-gray-200 rounded mb-4" />
      <div className="h-64 bg-gray-200 rounded mb-8" />
      <div className="h-6 w-1/4 bg-gray-200 rounded mb-4" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  );
}

export function InlineSkeleton({ height = 48 }: { height?: number }) {
  return (
    <div
      className="animate-pulse bg-gray-200 rounded w-full mb-2"
      style={{ height }}
    />
  );
}
