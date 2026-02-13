
export default function SkeletonPage() {
  return (
    <div className="animate-pulse p-8">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
      <div className="h-64 bg-gray-100 rounded" />
    </div>
  );
}
