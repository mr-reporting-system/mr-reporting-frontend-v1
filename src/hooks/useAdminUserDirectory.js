import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useDebouncedValue from "./useDebouncedValue";
import { fetchAdminUsers } from "../services/adminUsers";

const CACHE_TTL_MS = 30_000;

const INITIAL_QUERY = {
  page: 1,
  pageSize: 25,
  search: "",
  role: "ALL",
  status: "ALL",
  stateId: "",
  sortBy: "name",
  sortDirection: "asc",
};

const INITIAL_DIRECTORY_DATA = {
  rows: [],
  pagination: {
    page: 1,
    pageSize: 25,
    totalRecords: 0,
    totalPages: 1,
  },
  summary: {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    managerUsers: 0,
    mrUsers: 0,
    adminUsers: 0,
  },
  filterOptions: {
    states: [],
  },
};

function clampPage(pageNumber) {
  const numericPage = Number(pageNumber);
  if (!Number.isFinite(numericPage) || numericPage < 1) {
    return 1;
  }
  return Math.floor(numericPage);
}

function clampPageSize(pageSize) {
  const numericPageSize = Number(pageSize);
  if (!Number.isFinite(numericPageSize) || numericPageSize < 1) {
    return 25;
  }
  return Math.floor(numericPageSize);
}

function getQueryCacheKey(query) {
  return JSON.stringify(query);
}

function isCancelledError(error) {
  return error?.code === "ERR_CANCELED" || error?.name === "CanceledError";
}

export default function useAdminUserDirectory() {
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [directoryData, setDirectoryData] = useState(INITIAL_DIRECTORY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const debouncedSearch = useDebouncedValue(query.search, 350);
  const abortControllerRef = useRef(null);
  const latestRequestRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const cacheRef = useRef(new Map());

  const requestQuery = useMemo(
    () => ({
      ...query,
      search: debouncedSearch.trim(),
    }),
    [query, debouncedSearch]
  );

  const queryCacheKey = useMemo(() => getQueryCacheKey(requestQuery), [requestQuery]);

  const setSearch = useCallback((searchText) => {
    setQuery((previousQuery) => ({
      ...previousQuery,
      search: searchText,
      page: 1,
    }));
  }, []);

  const setRole = useCallback((role) => {
    setQuery((previousQuery) => ({
      ...previousQuery,
      role,
      page: 1,
    }));
  }, []);

  const setStatus = useCallback((status) => {
    setQuery((previousQuery) => ({
      ...previousQuery,
      status,
      page: 1,
    }));
  }, []);

  const setStateFilter = useCallback((stateId) => {
    setQuery((previousQuery) => ({
      ...previousQuery,
      stateId,
      page: 1,
    }));
  }, []);

  const setPage = useCallback((pageNumber) => {
    setQuery((previousQuery) => ({
      ...previousQuery,
      page: clampPage(pageNumber),
    }));
  }, []);

  const setPageSize = useCallback((pageSize) => {
    setQuery((previousQuery) => ({
      ...previousQuery,
      pageSize: clampPageSize(pageSize),
      page: 1,
    }));
  }, []);

  const setSort = useCallback((columnKey) => {
    setQuery((previousQuery) => {
      const isSameColumn = previousQuery.sortBy === columnKey;
      const nextDirection =
        isSameColumn && previousQuery.sortDirection === "asc" ? "desc" : "asc";

      return {
        ...previousQuery,
        sortBy: columnKey,
        sortDirection: nextDirection,
        page: 1,
      };
    });
  }, []);

  const refresh = useCallback(() => {
    cacheRef.current.clear();
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const cachedQuery = cacheRef.current.get(queryCacheKey);
    const isCacheValid =
      cachedQuery && Date.now() - cachedQuery.fetchedAt <= CACHE_TTL_MS;

    if (isCacheValid) {
      setDirectoryData(cachedQuery.data);
      setError("");
      hasLoadedOnceRef.current = true;
      setIsLoading(false);
      setIsFetching(false);
      return;
    }

    const currentRequestId = latestRequestRef.current + 1;
    latestRequestRef.current = currentRequestId;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    } else {
      setIsFetching(true);
    }

    setError("");

    fetchAdminUsers(requestQuery, { signal: controller.signal })
      .then((response) => {
        if (currentRequestId !== latestRequestRef.current) {
          return;
        }

        cacheRef.current.set(queryCacheKey, {
          data: response,
          fetchedAt: Date.now(),
        });

        setDirectoryData(response);
        hasLoadedOnceRef.current = true;
      })
      .catch((fetchError) => {
        if (currentRequestId !== latestRequestRef.current || isCancelledError(fetchError)) {
          return;
        }

        setError(fetchError?.response?.data?.message || "Failed to load admin users.");
      })
      .finally(() => {
        if (currentRequestId !== latestRequestRef.current) {
          return;
        }
        setIsLoading(false);
        setIsFetching(false);
      });

    return () => {
      controller.abort();
    };
  }, [queryCacheKey, requestQuery, reloadToken]);

  return {
    query,
    rows: directoryData.rows,
    pagination: directoryData.pagination,
    summary: directoryData.summary,
    filterOptions: directoryData.filterOptions,
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
  };
}
