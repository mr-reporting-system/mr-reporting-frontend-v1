export default function DataGridSkeleton({ rowCount = 8 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-6 gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`skeleton-header-${index}`}
            className="h-3 animate-pulse rounded bg-slate-200"
          />
        ))}
      </div>

      <div className="space-y-2 p-3">
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div key={`skeleton-row-${rowIndex}`} className="grid grid-cols-6 gap-2 px-1 py-2">
            {Array.from({ length: 6 }).map((__, cellIndex) => (
              <div
                key={`skeleton-cell-${rowIndex}-${cellIndex}`}
                className="h-4 animate-pulse rounded bg-slate-100"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
