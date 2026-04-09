import { createElement, useMemo } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  RefreshCw,
  Search,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import DataGridSkeleton from "../../../components/admin/DataGridSkeleton";
import VirtualizedDataGrid from "../../../components/admin/VirtualizedDataGrid";
import useAdminUserDirectory from "../../../hooks/useAdminUserDirectory";
import {
  ADMIN_USER_ROLE_OPTIONS,
  ADMIN_USER_STATUS_OPTIONS,
} from "../../../services/adminUsers";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function RoleTag({ role }) {
  const roleStyles = {
    ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
    MANAGER: "bg-amber-100 text-amber-700 border-amber-200",
    MR: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
        roleStyles[role] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {role}
    </span>
  );
}

function StatusTag({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        status === "ACTIVE"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-200 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function SummaryCard({ label, value, icon, iconClasses }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`rounded-xl p-2 ${iconClasses}`}>
          {createElement(icon, { size: 18 })}
        </div>
      </div>
    </article>
  );
}

function PaginationButton({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export default function UserDirectory() {
  const {
    query,
    rows,
    pagination,
    summary,
    filterOptions,
    isLoading,
    isFetching,
    error,
    setSearch,
    setRole,
    setStatus,
    setStateFilter,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = useAdminUserDirectory();

  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        title: "User",
        sortable: true,
        width: "minmax(210px, 1.5fr)",
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{row.name || "--"}</p>
            <p className="truncate text-xs text-slate-500">{row.userCode || "No code"}</p>
          </div>
        ),
      },
      {
        key: "role",
        title: "Role",
        sortable: true,
        width: "minmax(120px, 0.7fr)",
        render: (row) => <RoleTag role={row.role} />,
      },
      {
        key: "mobile",
        title: "Contact",
        width: "minmax(190px, 1fr)",
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-700">{row.mobile || "--"}</p>
            <p className="truncate text-xs text-slate-500">{row.email || "No email"}</p>
          </div>
        ),
      },
      {
        key: "stateName",
        title: "Geography",
        sortable: true,
        width: "minmax(190px, 1fr)",
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-700">{row.stateName || "--"}</p>
            <p className="truncate text-xs text-slate-500">
              {[row.districtName, row.headquarterName].filter(Boolean).join(" | ") || "--"}
            </p>
          </div>
        ),
      },
      {
        key: "reportingManager",
        title: "Reporting To",
        width: "minmax(160px, 1fr)",
        render: (row) => (
          <p className="truncate text-sm text-slate-700">{row.reportingManager || "--"}</p>
        ),
      },
      {
        key: "lastActiveAt",
        title: "Last Active",
        sortable: true,
        width: "minmax(150px, 0.9fr)",
        render: (row) => (
          <p className="text-xs leading-relaxed text-slate-600">{formatDateTime(row.lastActiveAt)}</p>
        ),
      },
      {
        key: "status",
        title: "Status",
        sortable: true,
        width: "minmax(110px, 0.6fr)",
        render: (row) => <StatusTag status={row.status} />,
      },
    ],
    []
  );

  const startRecord =
    pagination.totalRecords === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endRecord = Math.min(pagination.totalRecords, pagination.page * pagination.pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800">User Directory</h1>
        <p className="text-sm text-slate-500">
          Server-first listing with debounced filters, cancellable requests, and virtualized rows.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Users"
          value={summary.totalUsers}
          icon={Users}
          iconClasses="bg-blue-100 text-blue-700"
        />
        <SummaryCard
          label="Active Users"
          value={summary.activeUsers}
          icon={UserCheck}
          iconClasses="bg-emerald-100 text-emerald-700"
        />
        <SummaryCard
          label="Managers"
          value={summary.managerUsers}
          icon={BriefcaseBusiness}
          iconClasses="bg-amber-100 text-amber-700"
        />
        <SummaryCard
          label="Inactive Users"
          value={summary.inactiveUsers}
          icon={UserMinus}
          iconClasses="bg-slate-200 text-slate-700"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative md:col-span-2 xl:col-span-2">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query.search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, code, email, or mobile"
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <select
            value={query.role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {ADMIN_USER_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={query.status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {ADMIN_USER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={query.stateId}
            onChange={(event) => setStateFilter(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All States</option>
            {filterOptions.states.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>

          <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <BadgeCheck size={14} />
            Sorted by {query.sortBy} ({query.sortDirection})
          </div>

          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <DataGridSkeleton />
      ) : (
        <VirtualizedDataGrid
          columns={tableColumns}
          rows={rows}
          height={500}
          rowHeight={64}
          sortBy={query.sortBy}
          sortDirection={query.sortDirection}
          onSort={setSort}
          isFetching={isFetching}
          emptyMessage="No users matched the current filters."
        />
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-600">
          Showing {startRecord} - {endRecord} of {pagination.totalRecords}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={query.pageSize}
            onChange={(event) => setPageSize(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {PAGE_SIZE_OPTIONS.map((pageSizeOption) => (
              <option key={pageSizeOption} value={pageSizeOption}>
                {pageSizeOption} / page
              </option>
            ))}
          </select>

          <PaginationButton
            label="Previous"
            onClick={() => setPage(query.page - 1)}
            disabled={query.page <= 1}
          />

          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
            Page {pagination.page} / {pagination.totalPages}
          </span>

          <PaginationButton
            label="Next"
            onClick={() => setPage(query.page + 1)}
            disabled={query.page >= pagination.totalPages}
          />
        </div>
      </section>
    </div>
  );
}
