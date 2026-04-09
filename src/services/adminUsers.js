import api from "./api";

export const ADMIN_USER_ROLE_OPTIONS = [
  { value: "ALL", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "MR", label: "MR" },
];

export const ADMIN_USER_STATUS_OPTIONS = [
  { value: "ALL", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const FALLBACK_CACHE_TTL_MS = 60_000;
const MANAGER_DESIGNATIONS = ["ASM", "RSM", "ZSM", "NSM", "MANAGER"];
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

let fallbackCache = {
  fetchedAt: 0,
  rows: [],
};

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value, fallbackValue = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallbackValue;
}

function normalizeRole(record = {}) {
  const explicitRole = String(
    record.role ??
      record.userRole ??
      record.user_type ??
      record.type ??
      ""
  )
    .trim()
    .toUpperCase();

  if (explicitRole === "ADMIN" || explicitRole === "MR" || explicitRole === "MANAGER") {
    return explicitRole;
  }

  const designationText = String(
    record.designation?.name ??
      record.designation?.designation_name ??
      record.designationName ??
      record.designation ??
      ""
  )
    .trim()
    .toUpperCase();

  if (designationText === "MR") {
    return "MR";
  }
  if (designationText.includes("ADMIN")) {
    return "ADMIN";
  }
  if (MANAGER_DESIGNATIONS.some((label) => designationText.includes(label))) {
    return "MANAGER";
  }

  return "MR";
}

function normalizeStatus(record = {}) {
  if (typeof record.isActive === "boolean") {
    return record.isActive ? "ACTIVE" : "INACTIVE";
  }

  const rawStatus = String(record.status ?? record.userStatus ?? record.activeStatus ?? "")
    .trim()
    .toUpperCase();

  if (!rawStatus) {
    return "ACTIVE";
  }
  if (["ACTIVE", "ENABLED", "1", "TRUE"].includes(rawStatus)) {
    return "ACTIVE";
  }

  return "INACTIVE";
}

function normalizeUserRecord(record = {}, index = 0) {
  const role = normalizeRole(record);
  const state = record.state ?? {};
  const district = record.district ?? {};
  const area = record.area ?? record.headquarter ?? {};
  const reportingManager = record.reportingManager ?? record.manager ?? {};

  const stateId = record.stateId ?? state.id ?? "";
  const stateName = String(
    record.stateName ?? state.state_name ?? state.name ?? record.state_name ?? ""
  ).trim();

  return {
    id: record.id ?? record.userId ?? record.employeeId ?? record._id ?? `user-${index}`,
    userCode: String(record.userCode ?? record.employeeCode ?? record.code ?? "").trim(),
    name: String(record.name ?? record.fullName ?? record.employeeName ?? "").trim(),
    email: String(record.email ?? "").trim(),
    mobile: String(record.mobile ?? record.phone ?? record.contactNumber ?? "").trim(),
    role,
    designation: String(
      record.designation?.name ??
        record.designation?.designation_name ??
        record.designationName ??
        ""
    ).trim(),
    reportingManager: String(
      reportingManager.name ??
        record.reportingManagerName ??
        record.managerName ??
        record.reportingTo ??
        ""
    ).trim(),
    stateId: String(stateId).trim(),
    stateName,
    districtName: String(
      record.districtName ?? district.district_name ?? district.name ?? ""
    ).trim(),
    headquarterName: String(
      record.headquarterName ?? area.area_name ?? area.name ?? area.headquarter_name ?? ""
    ).trim(),
    lastActiveAt:
      record.lastActiveAt ??
      record.lastSeenAt ??
      record.updatedAt ??
      record.modifiedAt ??
      record.lastLoginAt ??
      null,
    joinedAt: record.joinedAt ?? record.createdAt ?? null,
    status: normalizeStatus(record),
  };
}

function normalizeStateOptions(input) {
  const mappedStates = toArray(input)
    .map((state) => ({
      value: String(state.id ?? state.stateId ?? state.value ?? state.name ?? "").trim(),
      label: String(
        state.state_name ?? state.name ?? state.label ?? state.value ?? ""
      ).trim(),
    }))
    .filter((state) => state.value && state.label);

  const deduped = new Map();
  mappedStates.forEach((state) => {
    if (!deduped.has(state.value)) {
      deduped.set(state.value, state);
    }
  });

  return Array.from(deduped.values()).sort((left, right) =>
    collator.compare(left.label, right.label)
  );
}

function buildSummary(rows) {
  const summary = {
    totalUsers: rows.length,
    activeUsers: 0,
    inactiveUsers: 0,
    managerUsers: 0,
    mrUsers: 0,
    adminUsers: 0,
  };

  rows.forEach((row) => {
    if (row.status === "ACTIVE") {
      summary.activeUsers += 1;
    } else {
      summary.inactiveUsers += 1;
    }

    if (row.role === "MANAGER") {
      summary.managerUsers += 1;
    } else if (row.role === "MR") {
      summary.mrUsers += 1;
    } else if (row.role === "ADMIN") {
      summary.adminUsers += 1;
    }
  });

  return summary;
}

function resolveRowCollection(payload) {
  const rowCandidates = [
    payload.records,
    payload.rows,
    payload.items,
    payload.users,
    payload.employees,
    payload.list,
    payload.results,
  ];

  const firstCollection = rowCandidates.find(Array.isArray);
  if (firstCollection) {
    return firstCollection;
  }

  return Array.isArray(payload) ? payload : [];
}

function mapPrimaryResponse(responseData, query) {
  const rootPayload = responseData?.data ?? responseData ?? {};
  const payload = rootPayload?.data ?? rootPayload ?? {};
  const rawRows = resolveRowCollection(payload);
  const normalizedRows = rawRows.map((row, index) => normalizeUserRecord(row, index));

  const pagination = payload.pagination ?? payload.meta ?? {};
  const page = toNumber(pagination.page ?? pagination.currentPage ?? query.page, query.page);
  const pageSize = toNumber(
    pagination.limit ?? pagination.pageSize ?? query.pageSize,
    query.pageSize
  );
  const totalRecords = toNumber(
    pagination.totalRecords ?? pagination.total ?? normalizedRows.length,
    normalizedRows.length
  );
  const totalPages = Math.max(
    1,
    toNumber(pagination.totalPages ?? Math.ceil(totalRecords / pageSize), 1)
  );

  const derivedSummary = buildSummary(normalizedRows);
  const sourceSummary = payload.summary ?? payload.stats ?? {};
  const summary = {
    totalUsers: toNumber(sourceSummary.totalUsers, derivedSummary.totalUsers),
    activeUsers: toNumber(sourceSummary.activeUsers, derivedSummary.activeUsers),
    inactiveUsers: toNumber(sourceSummary.inactiveUsers, derivedSummary.inactiveUsers),
    managerUsers: toNumber(sourceSummary.managerUsers, derivedSummary.managerUsers),
    mrUsers: toNumber(sourceSummary.mrUsers, derivedSummary.mrUsers),
    adminUsers: toNumber(sourceSummary.adminUsers, derivedSummary.adminUsers),
  };

  const filterPayload = payload.filterOptions ?? payload.filters ?? {};
  const states = normalizeStateOptions(filterPayload.states ?? payload.states ?? []);

  return {
    rows: normalizedRows,
    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages,
    },
    summary,
    filterOptions: { states },
  };
}

function buildPrimaryParams(query) {
  const params = {
    page: query.page,
    limit: query.pageSize,
    search: query.search || undefined,
    role: query.role !== "ALL" ? query.role : undefined,
    status: query.status !== "ALL" ? query.status : undefined,
    stateId: query.stateId || undefined,
    sortBy: query.sortBy || undefined,
    sortDirection: query.sortDirection || undefined,
  };

  Object.keys(params).forEach((key) => {
    if (params[key] === undefined || params[key] === "") {
      delete params[key];
    }
  });

  return params;
}

function getComparableValue(row, sortBy) {
  if (sortBy === "role") {
    return row.role;
  }
  if (sortBy === "status") {
    return row.status;
  }
  if (sortBy === "stateName") {
    return row.stateName;
  }
  if (sortBy === "lastActiveAt") {
    return row.lastActiveAt ? new Date(row.lastActiveAt).getTime() : 0;
  }
  if (sortBy === "userCode") {
    return row.userCode;
  }
  return row.name;
}

function sortRows(rows, sortBy, sortDirection) {
  const safeSortBy = sortBy || "name";
  const safeDirection = sortDirection === "desc" ? "desc" : "asc";
  const sortedRows = [...rows].sort((left, right) => {
    const leftValue = getComparableValue(left, safeSortBy);
    const rightValue = getComparableValue(right, safeSortBy);

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue - rightValue;
    }
    return collator.compare(String(leftValue ?? ""), String(rightValue ?? ""));
  });

  return safeDirection === "asc" ? sortedRows : sortedRows.reverse();
}

function applyFallbackQuery(rows, query) {
  const safeSearch = (query.search || "").trim().toLowerCase();
  let filteredRows = [...rows];

  if (safeSearch) {
    filteredRows = filteredRows.filter((row) =>
      [row.name, row.email, row.mobile, row.userCode]
        .join(" ")
        .toLowerCase()
        .includes(safeSearch)
    );
  }

  if (query.role !== "ALL") {
    filteredRows = filteredRows.filter((row) => row.role === query.role);
  }

  if (query.status !== "ALL") {
    filteredRows = filteredRows.filter((row) => row.status === query.status);
  }

  if (query.stateId) {
    const token = String(query.stateId).trim().toLowerCase();
    filteredRows = filteredRows.filter(
      (row) =>
        row.stateId.toLowerCase() === token ||
        row.stateName.toLowerCase() === token
    );
  }

  const sortedRows = sortRows(filteredRows, query.sortBy, query.sortDirection);
  const page = Math.max(1, toNumber(query.page, 1));
  const pageSize = Math.max(1, toNumber(query.pageSize, 25));
  const offset = (page - 1) * pageSize;
  const pageRows = sortedRows.slice(offset, offset + pageSize);

  const stateOptions = normalizeStateOptions(
    rows.map((row) => ({ id: row.stateId, state_name: row.stateName }))
  );

  return {
    rows: pageRows,
    pagination: {
      page,
      pageSize,
      totalRecords: sortedRows.length,
      totalPages: Math.max(1, Math.ceil(sortedRows.length / pageSize)),
    },
    summary: buildSummary(sortedRows),
    filterOptions: { states: stateOptions },
  };
}

async function fetchFallbackRows(signal) {
  const now = Date.now();
  const isCacheFresh =
    fallbackCache.rows.length > 0 && now - fallbackCache.fetchedAt < FALLBACK_CACHE_TTL_MS;

  if (isCacheFresh) {
    return fallbackCache.rows;
  }

  const response = await api.get("/api/masters/employees", { signal });
  const payload = response?.data?.data ?? response?.data ?? [];
  const rows = toArray(payload).map((row, index) => normalizeUserRecord(row, index));

  fallbackCache = {
    rows,
    fetchedAt: now,
  };

  return rows;
}

function isCancelledError(error) {
  return error?.code === "ERR_CANCELED" || error?.name === "CanceledError";
}

function shouldUseFallback(error) {
  if (!error) {
    return false;
  }

  const statusCode = error?.response?.status;
  return statusCode === 404 || statusCode === 405 || statusCode === 501;
}

export function clearAdminUsersFallbackCache() {
  fallbackCache = { rows: [], fetchedAt: 0 };
}

export async function fetchAdminUsers(query, options = {}) {
  const { signal } = options;

  try {
    const response = await api.get("/api/admin/users", {
      params: buildPrimaryParams(query),
      signal,
    });

    return mapPrimaryResponse(response, query);
  } catch (error) {
    if (isCancelledError(error)) {
      throw error;
    }
    if (!shouldUseFallback(error)) {
      throw error;
    }

    const fallbackRows = await fetchFallbackRows(signal);
    return applyFallbackQuery(fallbackRows, query);
  }
}
