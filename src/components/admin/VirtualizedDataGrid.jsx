import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function SortIndicator({ isSorted, direction }) {
  if (!isSorted) {
    return <ChevronDown size={14} className="text-slate-300" />;
  }
  return direction === "asc" ? (
    <ChevronUp size={14} className="text-blue-600" />
  ) : (
    <ChevronDown size={14} className="text-blue-600" />
  );
}

export default function VirtualizedDataGrid({
  columns,
  rows,
  height = 520,
  rowHeight = 64,
  overscan = 6,
  sortBy,
  sortDirection,
  onSort,
  isFetching = false,
  emptyMessage = "No records found.",
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const gridTemplateColumns = useMemo(
    () => columns.map((column) => column.width || "minmax(160px, 1fr)").join(" "),
    [columns]
  );

  const totalHeight = rows.length * rowHeight;
  const viewportCount = Math.ceil(height / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(rows.length, startIndex + viewportCount + overscan * 2);
  const visibleRows = rows.slice(startIndex, endIndex);
  const topPaddingHeight = startIndex * rowHeight;
  const bottomPaddingHeight = Math.max(
    0,
    totalHeight - topPaddingHeight - visibleRows.length * rowHeight
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className="grid border-b border-slate-200 bg-slate-50/80 px-2 py-2"
        style={{ gridTemplateColumns }}
      >
        {columns.map((column) => {
          const isSorted = sortBy === column.key;
          const canSort = Boolean(column.sortable && onSort);

          return (
            <div key={column.key} className="px-2">
              {canSort ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  onClick={() => onSort(column.key)}
                >
                  <span className="truncate">{column.title}</span>
                  <SortIndicator isSorted={isSorted} direction={sortDirection} />
                </button>
              ) : (
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {column.title}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="overflow-y-auto"
        style={{ height }}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          <>
            {topPaddingHeight > 0 ? <div style={{ height: topPaddingHeight }} /> : null}

            {visibleRows.map((row, rowIndex) => (
              <div
                key={row.id ?? `${startIndex + rowIndex}`}
                className="grid border-b border-slate-100 px-2 transition-colors hover:bg-blue-50/40"
                style={{ gridTemplateColumns, minHeight: rowHeight }}
              >
                {columns.map((column) => {
                  const rawValue = row[column.key];
                  const cellContent = column.render ? column.render(row) : rawValue;

                  return (
                    <div
                      key={`${row.id ?? startIndex + rowIndex}-${column.key}`}
                      className={`flex items-center px-2 py-3 text-sm text-slate-700 ${
                        column.cellClassName || ""
                      }`}
                    >
                      {cellContent}
                    </div>
                  );
                })}
              </div>
            ))}

            {bottomPaddingHeight > 0 ? <div style={{ height: bottomPaddingHeight }} /> : null}
          </>
        )}
      </div>

      {isFetching && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          Updating results...
        </div>
      )}
    </div>
  );
}
