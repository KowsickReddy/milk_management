export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="card">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th><Skeleton className="h-4 w-20" /></th>
              <th><Skeleton className="h-4 w-20" /></th>
              <th><Skeleton className="h-4 w-20" /></th>
              <th><Skeleton className="h-4 w-20" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td><Skeleton className="h-10 w-32" /></td>
                <td><Skeleton className="h-10 w-24" /></td>
                <td><Skeleton className="h-10 w-24" /></td>
                <td><Skeleton className="h-10 w-20" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card">
      <Skeleton className="h-4 w-16 mb-2" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-20 mt-2" />
    </div>
  );
}