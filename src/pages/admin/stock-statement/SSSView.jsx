import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  Check,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import api from "../../../services/api";

// ─── Global responsive styles (from reference) ───────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; overflow-x: hidden; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; margin-bottom: 24px; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:flex-end; border-radius:0 0 16px 16px; flex-wrap: wrap; gap: 12px; }

  /* Responsive Table Scroll Logic */
  .ucr-table-container {
    border: 1px solid #f3f4f6;
    border-radius: 12px;
    overflow-x: auto;
    background: #fff;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }
  .ucr-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1000px; }
  .ucr-table thead { background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
  .ucr-table th { padding: 12px 16px; text-align: left; font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  .ucr-table td { padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }

  .ucr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:24px; }

  /* Responsive Col Spans */
  .col-span-2 { grid-column: span 2; }
  .col-span-4 { grid-column: span 4; }

  @media(max-width:1024px){
    .ucr-grid, .ucr-grid-4, .ucr-grid-2 { grid-template-columns:repeat(2,1fr); gap:16px; }
    .col-span-4 { grid-column: span 2; }
  }
  @media(max-width:768px){
    .ucr-grid, .ucr-grid-4, .ucr-grid-2 { grid-template-columns:1fr; gap:16px; }
    .col-span-2, .col-span-4 { grid-column: span 1 !important; }
    .ucr-body  { padding:16px; }
    .ucr-header { padding: 16px; flex-direction: column; align-items: flex-start; }
    .ucr-header > div { width: 100%; }
    .ucr-header > button { align-self: flex-end; margin-top: -30px; }
    .ucr-footer { justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const FH = 40;

const MONTHS = [
  { value: "January", label: "January" },
  { value: "February", label: "February" },
  { value: "March", label: "March" },
  { value: "April", label: "April" },
  { value: "May", label: "May" },
  { value: "June", label: "June" },
  { value: "July", label: "July" },
  { value: "August", label: "August" },
  { value: "September", label: "September" },
  { value: "October", label: "October" },
  { value: "November", label: "November" },
  { value: "December", label: "December" }
];

const monthToNumber = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12
};

const CURRENT_YEAR = new Date().getFullYear();

const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(CURRENT_YEAR - 2 + i),
  label: String(CURRENT_YEAR - 2 + i)
}));

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value) => `₹${toNumber(value).toFixed(2)}`;

const normalizeReportRow = (row = {}) => ({
  ...row,
  providerId: row.providerId ?? row.stockistId ?? row.partyId ?? null,
  partyName: row.partyName || row.stockistName || row.providerName || "-",
  productId: row.productId ?? row.id ?? null,
  productName: row.productName || "-",
  productCode: row.productCode || "",
  netRate: toNumber(row.netRate),
  opening: toNumber(row.opening),
  openingValue: toNumber(row.openingValue),
  receipt: toNumber(row.receipt ?? row.recipt),
  primarySale: toNumber(row.primarySale),
  primaryValue: toNumber(row.primaryValue),
  scheme: toNumber(row.scheme),
  total: toNumber(row.total),
  salesReturn: toNumber(row.salesReturn ?? row.return),
  returnValue: toNumber(row.returnValue),
  closing: toNumber(row.closing),
  closingValue: toNumber(row.closingValue),
  expiry: toNumber(row.expiry),
  expiryValue: toNumber(row.expiryValue),
  breakage: toNumber(row.breakage),
  breakageValue: toNumber(row.breakageValue),
  batchRecall: toNumber(row.batchRecall),
  batchRecallValue: toNumber(row.batchRecallValue),
  batchNumber: row.batchNumber || "-",
  secondarySale: toNumber(row.secondarySale ?? row.secSales),
  secondarySaleValue: toNumber(row.secondarySaleValue ?? row.secSalesValue)
});

const calculateFrontEndTotals = (rows) => {
  const totals = {
    partyName: "TOTAL",
    productName: "",
    netRate: 0,
    opening: 0,
    openingValue: 0,
    receipt: 0,
    primarySale: 0,
    primaryValue: 0,
    scheme: 0,
    total: 0,
    salesReturn: 0,
    returnValue: 0,
    closing: 0,
    closingValue: 0,
    expiry: 0,
    expiryValue: 0,
    breakage: 0,
    breakageValue: 0,
    batchRecall: 0,
    batchRecallValue: 0,
    batchNumber: "--",
    secondarySale: 0,
    secondarySaleValue: 0
  };

  rows.forEach((row) => {
    totals.opening += row.opening;
    totals.openingValue += row.openingValue;
    totals.receipt += row.receipt;
    totals.primarySale += row.primarySale;
    totals.primaryValue += row.primaryValue;
    totals.scheme += row.scheme;
    totals.total += row.total;
    totals.salesReturn += row.salesReturn;
    totals.returnValue += row.returnValue;
    totals.closing += row.closing;
    totals.closingValue += row.closingValue;
    totals.expiry += row.expiry;
    totals.expiryValue += row.expiryValue;
    totals.breakage += row.breakage;
    totals.breakageValue += row.breakageValue;
    totals.batchRecall += row.batchRecall;
    totals.batchRecallValue += row.batchRecallValue;
    totals.secondarySale += row.secondarySale;
    totals.secondarySaleValue += row.secondarySaleValue;
  });

  return totals;
};

const buildSummaryRows = (rows, selectedProviderCount) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = String(row.productId ?? row.productCode ?? row.productName);

    if (!grouped.has(key)) {
      grouped.set(key, {
        productId: row.productId,
        partyName: selectedProviderCount > 1 ? "Multiple Parties" : row.partyName,
        productName: row.productName,
        netRate: row.netRate,
        secondarySale: row.secondarySale,
        secondarySaleValue: row.secondarySaleValue
      });
      return;
    }

    const existing = grouped.get(key);
    existing.secondarySale += row.secondarySale;
    existing.secondarySaleValue += row.secondarySaleValue;
  });

  return Array.from(grouped.values());
};

const getTop5Rows = (rows) =>
  [...rows]
    .sort((a, b) => {
      if (b.secondarySale !== a.secondarySale) {
        return b.secondarySale - a.secondarySale;
      }
      return b.secondarySaleValue - a.secondarySaleValue;
    })
    .slice(0, 5);

const getBottom5Rows = (rows) =>
  [...rows]
    .sort((a, b) => {
      if (a.secondarySale !== b.secondarySale) {
        return a.secondarySale - b.secondarySale;
      }
      return a.secondarySaleValue - b.secondarySaleValue;
    })
    .slice(0, 5);

const escapeCsv = (value) => {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export default function SSSView() {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [tableVisible, setTableVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZES = [10, 20, 50];

  const [filters, setFilters] = useState({
    stateIds: [],
    districtIds: [],
    employeeIds: [],
    stockistIds: [],
    month: "",
    year: String(CURRENT_YEAR)
  });

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stockists, setStockists] = useState([]);

  const [top5Data, setTop5Data] = useState([]);
  const [bottom5Data, setBottom5Data] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [reportTotals, setReportTotals] = useState(null);

  const getAuthHeaders = useCallback(
    () => ({
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`
      }
    }),
    []
  );

  const clearReportData = useCallback(() => {
    setTableVisible(false);
    setTop5Data([]);
    setBottom5Data([]);
    setReportData([]);
    setReportTotals(null);
    setCurrentPage(1);
    setError("");
  }, []);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await api.get("/api/expense/sss-view/states", getAuthHeaders());
        const stateData = res.data?.data || res.data || [];

        const normalizedStates = Array.isArray(stateData)
          ? stateData.map((s) => ({
              id: String(s.id ?? s.stateId ?? ""),
              stateName: s.name || s.state_name || s.stateName || "Unknown"
            })).filter((s) => s.id !== "")
          : [];

        setStates(normalizedStates);
      } catch (err) {
        console.error("Failed to load states", err);
      }
    };

    fetchStates();
  }, [getAuthHeaders]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      districtIds: [],
      employeeIds: [],
      stockistIds: []
    }));
    setDistricts([]);
    setEmployees([]);
    setStockists([]);
    clearReportData();

    if (filters.stateIds.length > 0) {
      const fetchDistricts = async () => {
        try {
          const query = filters.stateIds.map((id) => `stateIds=${id}`).join("&");
          const res = await api.get(`/api/expense/sss-view/districts?${query}`, getAuthHeaders());
          const districtData = res.data?.data || res.data || [];

          const normalizedDistricts = Array.isArray(districtData)
            ? districtData.map((d) => ({
                id: String(d.id ?? d.districtId ?? ""),
                districtName: d.name || d.district_name || d.districtName || "Unknown"
              })).filter((d) => d.id !== "")
            : [];

          setDistricts(normalizedDistricts);
        } catch (err) {
          console.error("Failed to load districts", err);
        }
      };

      fetchDistricts();
    }
  }, [filters.stateIds, getAuthHeaders, clearReportData]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      employeeIds: [],
      stockistIds: []
    }));
    setEmployees([]);
    setStockists([]);
    clearReportData();

    if (filters.districtIds.length > 0) {
      const fetchEmployees = async () => {
        try {
          const query = filters.districtIds.map((id) => `districtIds=${id}`).join("&");
          const res = await api.get(`/api/expense/sss-view/employees?${query}`, getAuthHeaders());
          const employeeData = res.data?.data || res.data || [];

          const normalizedEmployees = Array.isArray(employeeData)
            ? employeeData.map((e) => ({
                id: String(e.id ?? e.employeeId ?? ""),
                employeeName: e.name || e.employee_name || e.employeeName || "Unknown"
              })).filter((e) => e.id !== "")
            : [];

          setEmployees(normalizedEmployees);
        } catch (err) {
          console.error("Failed to load employees", err);
        }
      };

      fetchEmployees();
    }
  }, [filters.districtIds, getAuthHeaders, clearReportData]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      stockistIds: []
    }));
    setStockists([]);
    clearReportData();

    if (filters.employeeIds.length > 0) {
      const fetchStockists = async () => {
        try {
          const query = filters.employeeIds.map((id) => `employeeIds=${id}`).join("&");
          const res = await api.get(`/api/expense/sss-view/providers?${query}`, getAuthHeaders());
          const stockistData = res.data?.data || res.data || [];

          const normalizedStockists = Array.isArray(stockistData)
            ? stockistData.map((s) => ({
                id: String(s.id ?? s.providerId ?? s.stockistId ?? ""),
                stockistName: s.name || s.providerName || s.stockistName || "Unknown",
                type: s.type || ""
              })).filter((s) => s.id !== "")
            : [];

          setStockists(normalizedStockists);
        } catch (err) {
          console.error("Failed to load stockists", err);
        }
      };

      fetchStockists();
    }
  }, [filters.employeeIds, getAuthHeaders, clearReportData]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    clearReportData();
  };

  const handleViewStatus = async () => {
    setError("");

    if (
      !filters.stateIds.length ||
      !filters.districtIds.length ||
      !filters.employeeIds.length ||
      !filters.stockistIds.length ||
      !filters.month ||
      !filters.year
    ) {
      return setError("Please select all filter fields before viewing status.");
    }

    setIsLoading(true);
    try {
      const payload = {
        stateIds: filters.stateIds.map(Number),
        districtIds: filters.districtIds.map(Number),
        employeeIds: filters.employeeIds.map(Number),
        providerIds: filters.stockistIds.map(Number),
        month: monthToNumber[filters.month],
        year: Number(filters.year)
      };

      const res = await api.post("/api/expense/sss-view/report", payload, getAuthHeaders());

      const responseData = res.data?.data || {};
      const rawRows = Array.isArray(responseData.rows)
        ? responseData.rows.map(normalizeReportRow)
        : [];

      const totals = responseData.totals
        ? normalizeReportRow(responseData.totals)
        : calculateFrontEndTotals(rawRows);

      const summaryRows = buildSummaryRows(rawRows, filters.stockistIds.length);

      setTop5Data(getTop5Rows(summaryRows));
      setBottom5Data(getBottom5Rows(summaryRows));
      setReportData(rawRows);
      setReportTotals(totals);
      setCurrentPage(1);
      setTableVisible(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statement data.");
      setTop5Data([]);
      setBottom5Data([]);
      setReportData([]);
      setReportTotals(null);
      setCurrentPage(1);
      setTableVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportData.length) {
      return;
    }

    const headers = [
      "Party Name",
      "Product Name",
      "Net Rate",
      "Opening",
      "Opening Value",
      "Receipt",
      "Primary Sale",
      "Primary Value",
      "Scheme",
      "Total",
      "Return",
      "Return Value",
      "Closing",
      "Closing Value",
      "Expiry",
      "Expiry Value",
      "Breakage",
      "Breakage Value",
      "BatchRecall",
      "BatchRecall Value",
      "Batch Number",
      "Secondary Sale",
      "Secondary Sale Value"
    ];

    const rows = reportData.map((row) => [
      row.partyName,
      row.productName,
      row.netRate,
      row.opening,
      row.openingValue,
      row.receipt,
      row.primarySale,
      row.primaryValue,
      row.scheme,
      row.total,
      row.salesReturn,
      row.returnValue,
      row.closing,
      row.closingValue,
      row.expiry,
      row.expiryValue,
      row.breakage,
      row.breakageValue,
      row.batchRecall,
      row.batchRecallValue,
      row.batchNumber,
      row.secondarySale,
      row.secondarySaleValue
    ]);

    if (reportTotals) {
      rows.push([
        "TOTAL",
        "",
        "",
        reportTotals.opening,
        reportTotals.openingValue,
        reportTotals.receipt,
        reportTotals.primarySale,
        reportTotals.primaryValue,
        reportTotals.scheme,
        reportTotals.total,
        reportTotals.salesReturn,
        reportTotals.returnValue,
        reportTotals.closing,
        reportTotals.closingValue,
        reportTotals.expiry,
        reportTotals.expiryValue,
        reportTotals.breakage,
        reportTotals.breakageValue,
        reportTotals.batchRecall,
        reportTotals.batchRecallValue,
        "--",
        reportTotals.secondarySale,
        reportTotals.secondarySaleValue
      ]);
    }

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sss_consolidate_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const totalValue = (key) => {
    if (reportTotals) {
      return toNumber(reportTotals[key]);
    }
    return reportData.reduce((sum, row) => sum + toNumber(row[key]), 0);
  };

  const stateOpts = states
    .map((s) => ({
      id: String(s.id),
      value: String(s.id),
      label: s.stateName
    }))
    .filter((opt) => opt.value !== "");

  const distOpts = districts
    .map((d) => ({
      id: String(d.id),
      value: String(d.id),
      label: d.districtName
    }))
    .filter((opt) => opt.value !== "");

  const empOpts = employees
    .map((e) => ({
      id: String(e.id),
      value: String(e.id),
      label: e.employeeName
    }))
    .filter((opt) => opt.value !== "");

  const stockOpts = stockists
    .map((s) => ({
      id: String(s.id),
      value: String(s.id),
      label: s.type ? `${s.stockistName} (${s.type})` : s.stockistName
    }))
    .filter((opt) => opt.value !== "");

  const totalPages = Math.max(1, Math.ceil(reportData.length / pageSize));
  const pagedData = reportData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>

      {/* Alerts */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileSpreadsheet size={17} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>SSS Consolidate Summary</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>
              View aggregated stock and sales records
            </p>
          </div>
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>FILTER</span>
              <div style={{ width: 34, height: 18, borderRadius: 20, background: isFilterOpen ? "#2563eb" : "#d1d5db", position: "relative", cursor: "pointer", transition: "0.2s" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: isFilterOpen ? 18 : 2, transition: "0.2s" }} />
              </div>
            </div>
          </button>
        </div>

        {isFilterOpen && (
          <div className="ucr-body">
            <div className="ucr-grid-4">
              <MultiSelectDropdown
                label="SELECT STATE *"
                options={stateOpts}
                selectedIds={filters.stateIds}
                onChange={(v) => handleFilterChange("stateIds", v)}
              />

              <MultiSelectDropdown
                label="SELECT DISTRICT *"
                options={distOpts}
                selectedIds={filters.districtIds}
                onChange={(v) => handleFilterChange("districtIds", v)}
                disabled={!filters.stateIds.length}
              />

              <MultiSelectDropdown
                label="SELECT EMPLOYEE *"
                options={empOpts}
                selectedIds={filters.employeeIds}
                onChange={(v) => handleFilterChange("employeeIds", v)}
                disabled={!filters.districtIds.length}
              />

              <FloatingDropdown
                label="SELECT MONTH *"
                options={MONTHS}
                value={filters.month}
                onSelect={(v) => handleFilterChange("month", v)}
              />

              <div className="col-span-4 ucr-grid-4" style={{ marginBottom: 0, padding: 0 }}>
                <FloatingDropdown
                  label="SELECT YEAR *"
                  options={YEARS}
                  value={filters.year}
                  onSelect={(v) => handleFilterChange("year", v)}
                />

                <MultiSelectDropdown
                  label="SELECT STOCKIST *"
                  options={stockOpts}
                  selectedIds={filters.stockistIds}
                  onChange={(v) => handleFilterChange("stockistIds", v)}
                  disabled={!filters.employeeIds.length}
                />

                <div className="col-span-2" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleViewStatus}
                    disabled={isLoading}
                    style={{
                      height: 40, padding: "0 24px", borderRadius: 8, background: "#2563eb", color: "#fff",
                      fontSize: 13, fontWeight: 700, border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 180, justifyContent: "center"
                    }}
                  >
                    {isLoading ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Check size={16} />}
                    View Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {tableVisible && (
        <div className="ucr-grid-2 animate-in slide-in-from-bottom-4 duration-500">
          <div className="ucr-card" style={{ marginBottom: 0, minWidth: 0 }}>
            <div className="ucr-header" style={{ background: "#f9fafb" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Top 5 Selling Products</h3>
            </div>
            <div className="ucr-body" style={{ padding: 0 }}>
              <div className="ucr-table-container" style={{ border: "none", borderRadius: "0 0 16px 16px" }}>
                <table className="ucr-table" style={{ minWidth: 600 }}>
                  <thead>
                    <tr>
                      <th>Party Name</th>
                      <th>Product Name</th>
                      <th style={{ textAlign: "right" }}>Net Rate</th>
                      <th style={{ textAlign: "right" }}>Sec. Sales</th>
                      <th style={{ textAlign: "right" }}>Sec. Sales Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5Data.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                          No data available
                        </td>
                      </tr>
                    ) : (
                      top5Data.map((row, i) => (
                        <tr key={`${row.productId}-${i}`}>
                          <td style={{ fontWeight: 600 }}>{row.partyName}</td>
                          <td style={{ fontWeight: 600 }}>{row.productName}</td>
                          <td style={{ textAlign: "right" }}>{formatCurrency(row.netRate)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>{row.secondarySale}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCurrency(row.secondarySaleValue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="ucr-card" style={{ marginBottom: 0, minWidth: 0 }}>
            <div className="ucr-header" style={{ background: "#f9fafb" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Bottom 5 Selling Products</h3>
            </div>
            <div className="ucr-body" style={{ padding: 0 }}>
              <div className="ucr-table-container" style={{ border: "none", borderRadius: "0 0 16px 16px" }}>
                <table className="ucr-table" style={{ minWidth: 600 }}>
                  <thead>
                    <tr>
                      <th>Party Name</th>
                      <th>Product Name</th>
                      <th style={{ textAlign: "right" }}>Net Rate</th>
                      <th style={{ textAlign: "right" }}>Sec. Sales</th>
                      <th style={{ textAlign: "right" }}>Sec. Sales Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bottom5Data.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                          No data available
                        </td>
                      </tr>
                    ) : (
                      bottom5Data.map((row, i) => (
                        <tr key={`${row.productId}-${i}`}>
                          <td style={{ fontWeight: 600 }}>{row.partyName}</td>
                          <td style={{ fontWeight: 600 }}>{row.productName}</td>
                          <td style={{ textAlign: "right" }}>{formatCurrency(row.netRate)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>{row.secondarySale}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCurrency(row.secondarySaleValue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {tableVisible && (
        <div className="ucr-card" style={{ minWidth: 0 }}>
          <div className="ucr-header" style={{ justifyContent: "space-between", background: "#f9fafb" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>SSS Consolidate Report</h3>
            <button
              onClick={handleExportExcel}
              style={{
                height: 36, width: 36, borderRadius: 8, background: "#ecfdf5", border: "1px solid #a7f3d0",
                color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
              }}
              title="Export to Excel"
            >
              <FileSpreadsheet size={16} />
            </button>
          </div>

          <div className="ucr-body" style={{ padding: 0 }}>
            <div className="ucr-table-container" style={{ border: "none", borderRadius: "0 0 16px 16px" }}>
              <table className="ucr-table" style={{ minWidth: 2000 }}>
                <thead>
                  <tr>
                    <th style={{ borderRight: "1px solid #f3f4f6" }}>Party Name</th>
                    <th style={{ borderRight: "1px solid #f3f4f6" }}>Product Name</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Net Rate</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Opening</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Opening Value</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Receipt</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Primary Sale</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Primary Value</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Scheme</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Total</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Return</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Return Value</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Closing</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Closing Value</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Expiry</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Expiry Value</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Breakage</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>Breakage Value</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>BatchRecall</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>BatchRecall Value</th>
                    <th style={{ textAlign: "center", borderRight: "1px solid #f3f4f6" }}>Batch Number</th>
                    <th style={{ textAlign: "right" }}>Secondary Sale</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedData.length === 0 ? (
                    <tr>
                      <td colSpan={22} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                        No report data found.
                      </td>
                    </tr>
                  ) : (
                    pagedData.map((row, index) => (
                      <tr key={`${row.providerId ?? "p"}-${row.productId ?? "prd"}-${index}`}>
                        <td style={{ fontWeight: 600, borderRight: "1px solid #f3f4f6" }}>{row.partyName}</td>
                        <td style={{ fontWeight: 600, borderRight: "1px solid #f3f4f6" }}>{row.productName}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{formatCurrency(row.netRate)}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{row.opening}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6", fontWeight: 700 }}>{formatCurrency(row.openingValue)}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{row.receipt}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{row.primarySale}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6", fontWeight: 700 }}>{formatCurrency(row.primaryValue)}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{row.scheme}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{row.total}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{row.salesReturn}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6", fontWeight: 700 }}>{formatCurrency(row.returnValue)}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{row.closing}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6", fontWeight: 700 }}>{formatCurrency(row.closingValue)}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{row.expiry}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6", fontWeight: 700 }}>{formatCurrency(row.expiryValue)}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{row.breakage}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6", fontWeight: 700 }}>{formatCurrency(row.breakageValue)}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{row.batchRecall}</td>
                        <td style={{ textAlign: "right", borderRight: "1px solid #f3f4f6", fontWeight: 700 }}>{formatCurrency(row.batchRecallValue)}</td>
                        <td style={{ textAlign: "center", borderRight: "1px solid #f3f4f6" }}>{row.batchNumber}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{row.secondarySale}</td>
                      </tr>
                    ))
                  )}
                </tbody>

                {reportData.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#2563eb" }}>
                      <td colSpan={2} style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textTransform: "uppercase", borderRight: "1px solid rgba(255,255,255,0.2)" }}>Total</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>--</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{totalValue("opening")}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{formatCurrency(totalValue("openingValue"))}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{totalValue("receipt")}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{totalValue("primarySale")}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{formatCurrency(totalValue("primaryValue"))}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{totalValue("scheme")}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{totalValue("total")}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{totalValue("salesReturn")}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{formatCurrency(totalValue("returnValue"))}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{totalValue("closing")}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{formatCurrency(totalValue("closingValue"))}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{totalValue("expiry")}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{formatCurrency(totalValue("expiryValue"))}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{totalValue("breakage")}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{formatCurrency(totalValue("breakageValue"))}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{totalValue("batchRecall")}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.2)" }}>{formatCurrency(totalValue("batchRecallValue"))}</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.2)" }}>--</td>
                      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 11, textAlign: "right" }}>{totalValue("secondarySale")}</td>
                    </tr>
                  </tfoot>
                )}
              </table>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f3f4f6", background: "#f9fafb", fontSize: 11, flexWrap: "wrap", gap: 12 }}>
                <div style={{ color: "#6b7280" }}>
                  Showing <span style={{ fontWeight: 700, color: "#374151" }}>{pagedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to <span style={{ fontWeight: 700, color: "#374151" }}>{Math.min(currentPage * pageSize, reportData.length)}</span> of <span style={{ fontWeight: 700, color: "#374151" }}>{reportData.length}</span> entries
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#6b7280", marginRight: 6 }}>Items per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "2px 6px" }}
                  >
                    {PAGE_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div style={{ width: 12 }} />
                  <button
                    onClick={() => goToPage(1)} disabled={currentPage === 1}
                    style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, padding: "4px 8px", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1, fontWeight: 600 }}
                  >First</button>
                  <button
                    onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                    style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyItems: "center", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}
                  ><ChevronLeft size={13} style={{ margin: "0 auto" }} /></button>
                  <div style={{ background: "#2563eb", color: "#fff", border: "1px solid #2563eb", borderRadius: 4, padding: "4px 10px", fontWeight: 700 }}>
                    {currentPage}
                  </div>
                  <button
                    onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}
                    style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyItems: "center", cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer", opacity: (currentPage === totalPages || totalPages === 0) ? 0.4 : 1 }}
                  ><ChevronRight size={13} style={{ margin: "0 auto" }} /></button>
                  <button
                    onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
                    style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, padding: "4px 8px", cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer", opacity: (currentPage === totalPages || totalPages === 0) ? 0.4 : 1, fontWeight: 600 }}
                  >Last</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// UI Components Restyled to match Reference Exactly
// ═══════════════════════════════════════════════════════════════════

function FloatingDropdown({ label, options, value, onSelect, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const selectedOption = options.find((option) => String(option.value) === String(value));
  const active = isOpen || Boolean(value);

  const openMenu = () => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen(true);
  };

  return (
    <div className="relative w-full select-none mt-1">
      <div
        ref={ref}
        onClick={openMenu}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex",
          alignItems: "center", border: `1.5px solid ${active && !disabled ? "#2563eb" : "#d1d5db"}`,
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f3f4f6" : "#fff",
          transition: "border-color 0.2s"
        }}
      >
        <span style={{ flex: 1, fontWeight: 600, color: (Boolean(value) && !disabled) ? "#111827" : disabled && Boolean(value) ? "#6b7280" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {selectedOption?.label || " "}
        </span>
        <ChevronDown size={14} style={{ color: "#9ca3af", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s", flexShrink: 0 }} />
      </div>
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"), background: disabled ? (active ? "#f3f4f6" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}
      >
        {label}
      </label>

      {isOpen && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div style={{ maxHeight: 250, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
              <p style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", margin: 0, textAlign: "center", fontStyle: "italic" }}>No options available</p>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: "10px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
                    background: String(value) === String(opt.value) ? "#eff6ff" : "transparent",
                    color: String(value) === String(opt.value) ? "#2563eb" : "#374151"
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}

function MultiSelectDropdown({ label, options, selectedIds, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const toggleValue = (value) => {
    if (selectedIds.includes(value)) {
      onChange(selectedIds.filter((item) => item !== value));
      return;
    }
    onChange([...selectedIds, value]);
  };

  const selectAll = () => onChange(options.map((option) => option.id || option.value));
  const clearAll = () => onChange([]);

  const selectedLabel = options
    .filter((option) => selectedIds.includes(option.id || option.value))
    .map((option) => option.label)
    .join(", ");

  const hasValue = selectedIds.length > 0;
  const active = isOpen || hasValue;

  const openMenu = () => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen(true);
  };

  return (
    <div className="relative w-full select-none mt-1">
      <div
        ref={ref}
        onClick={openMenu}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex",
          alignItems: "center", border: `1.5px solid ${active && !disabled ? "#2563eb" : "#d1d5db"}`,
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f3f4f6" : "#fff",
          transition: "border-color 0.2s"
        }}
      >
        <span style={{ flex: 1, fontWeight: 600, color: hasValue ? "#111827" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {selectedLabel || " "}
        </span>
        <ChevronDown size={14} style={{ color: "#9ca3af", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s", flexShrink: 0 }} />
      </div>
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"), background: disabled ? (active ? "#f3f4f6" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}
      >
        {label}
      </label>

      {isOpen && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectAll();
              }}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#2563eb", border: "none", cursor: "pointer" }}
            >
              Select All
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                clearAll();
              }}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#ef4444", border: "none", cursor: "pointer" }}
            >
              Clear All
            </button>
          </div>

          <div style={{ maxHeight: 250, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
              <p style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", margin: 0, textAlign: "center", fontStyle: "italic" }}>No options available.</p>
            ) : (
              options.map((option) => {
                const optId = String(option.id || option.value);
                const isSelected = selectedIds.includes(optId);
                return (
                  <button
                    key={optId}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleValue(optId);
                    }}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 13, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 10, background: isSelected ? "#eff6ff" : "transparent",
                      color: isSelected ? "#2563eb" : "#4b5563", border: "none", cursor: "pointer"
                    }}
                  >
                    <span
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        border: isSelected ? "2px solid #2563eb" : "2px solid #d1d5db", background: isSelected ? "#2563eb" : "#fff"
                      }}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 10 8" style={{ width: 10, height: 8 }} fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}

function Portal({ top, left, width, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const handleMouseDown = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
          onClose();
        }
      };
      document.addEventListener("mousedown", handleMouseDown);
      return () => document.removeEventListener("mousedown", handleMouseDown);
    }, 10);

    return () => clearTimeout(timer);
  }, [onClose]);

  useEffect(() => {
    const handleScroll = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      onClose();
    };
    
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", onClose);
    
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top, left, width, zIndex: 99999 }}
      className="dropdown-portal bg-white border border-[#e5e7eb] rounded-lg shadow-xl overflow-hidden"
    >
      {children}
    </div>
  );
}