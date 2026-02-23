export const AnalyticsSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* KPI Header Skeleton */}
    <div className="h-32 bg-gray-200 rounded-2xl w-full" />

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Registration Chart Skeleton */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[400px]">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6" />
        <div className="h-[300px] bg-gray-100 rounded-xl w-full" />
      </div>

      {/* Pie Chart Skeleton */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[400px]">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="flex justify-center items-center h-[280px]">
          <div className="h-40 w-40 rounded-full border-[20px] border-gray-100" />
        </div>
      </div>
    </div>
  </div>
);
