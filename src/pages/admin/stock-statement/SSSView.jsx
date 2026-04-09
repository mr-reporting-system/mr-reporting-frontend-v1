import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  Check,
  FileSpreadsheet
} from "lucide-react";
import api from "../../../services/api";

const INPUT_CLASS = "h-[38px]";

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
  const [pageSize] = useState(10);

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
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6 animate-in fade-in duration-400 pb-12 font-sans">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 rounded-t-xl" />

        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
              <FileSpreadsheet size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">SSS Consolidate Summary</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                View aggregated stock and sales records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-600">Filter</span>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors duration-300 focus:outline-none ${
                isFilterOpen ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  isFilterOpen ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="p-6 sm:p-8 space-y-6 bg-white animate-in slide-in-from-top-2 duration-300">
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-sm font-bold">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 gap-y-8">
              <MultiDropdown
                label="SELECT STATE *"
                options={stateOpts}
                selectedIds={filters.stateIds}
                onChange={(v) => handleFilterChange("stateIds", v)}
              />

              <MultiDropdown
                label="SELECT DISTRICT *"
                options={distOpts}
                selectedIds={filters.districtIds}
                onChange={(v) => handleFilterChange("districtIds", v)}
                disabled={!filters.stateIds.length}
              />

              <MultiDropdown
                label="SELECT EMPLOYEE *"
                options={empOpts}
                selectedIds={filters.employeeIds}
                onChange={(v) => handleFilterChange("employeeIds", v)}
                disabled={!filters.districtIds.length}
              />

              <SingleDropdown
                label="SELECT MONTH *"
                options={MONTHS}
                value={filters.month}
                onSelect={(v) => handleFilterChange("month", v)}
              />

              <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
                <SingleDropdown
                  label="SELECT YEAR *"
                  options={YEARS}
                  value={filters.year}
                  onSelect={(v) => handleFilterChange("year", v)}
                />

                <MultiDropdown
                  label="SELECT STOCKIST *"
                  options={stockOpts}
                  selectedIds={filters.stockistIds}
                  onChange={(v) => handleFilterChange("stockistIds", v)}
                  disabled={!filters.employeeIds.length}
                />

                <div className="lg:col-span-2 flex items-end">
                  <button
                    onClick={handleViewStatus}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-8 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 w-full sm:w-auto mt-1"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    View Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {tableVisible && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
              <h3 className="text-sm font-bold text-slate-800">Top 5 Selling Products</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center">
                <thead className="bg-blue-600 text-white text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Party Name</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Net Rate</th>
                    <th className="py-3 px-4">Sec. Sales</th>
                    <th className="py-3 px-4">Sec. Sales Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {top5Data.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-slate-400 italic">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    top5Data.map((row, i) => (
                      <tr key={`${row.productId}-${i}`} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-700">{row.partyName}</td>
                        <td className="py-2.5 px-4 text-slate-600">{row.productName}</td>
                        <td className="py-2.5 px-4 font-mono">{formatCurrency(row.netRate)}</td>
                        <td className="py-2.5 px-4">{row.secondarySale}</td>
                        <td className="py-2.5 px-4 font-mono">{formatCurrency(row.secondarySaleValue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
              <h3 className="text-sm font-bold text-slate-800">Bottom 5 Selling Products</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center">
                <thead className="bg-blue-600 text-white text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Party Name</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Net Rate</th>
                    <th className="py-3 px-4">Sec. Sales</th>
                    <th className="py-3 px-4">Sec. Sales Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bottom5Data.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-slate-400 italic">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    bottom5Data.map((row, i) => (
                      <tr key={`${row.productId}-${i}`} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-700">{row.partyName}</td>
                        <td className="py-2.5 px-4 text-slate-600">{row.productName}</td>
                        <td className="py-2.5 px-4 font-mono">{formatCurrency(row.netRate)}</td>
                        <td className="py-2.5 px-4">{row.secondarySale}</td>
                        <td className="py-2.5 px-4 font-mono">{formatCurrency(row.secondarySaleValue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tableVisible && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <h3 className="text-base font-bold text-slate-800">SSS Consolidate Report</h3>
            <button
              onClick={handleExportExcel}
              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded transition-colors shadow-sm"
              title="Export to Excel"
            >
              <FileSpreadsheet size={18} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[2000px] border-collapse">
              <thead className="bg-blue-600 text-white text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-3 border-r border-blue-500">Party Name</th>
                  <th className="py-3 px-3 border-r border-blue-500">Product Name</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Net Rate</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Opening</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Opening Value</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Receipt</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Primary Sale</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Primary Value</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Scheme</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Total</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Return</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Return Value</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Closing</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Closing Value</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Expiry</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Expiry Value</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Breakage</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">Breakage Value</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">BatchRecall</th>
                  <th className="py-3 px-3 text-right border-r border-blue-500">BatchRecall Value</th>
                  <th className="py-3 px-3 text-center border-r border-blue-500">Batch Number</th>
                  <th className="py-3 px-3 text-right">Secondary Sale</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {pagedData.length === 0 ? (
                  <tr>
                    <td colSpan="22" className="py-12 text-center text-slate-400 font-medium">
                      No report data found.
                    </td>
                  </tr>
                ) : (
                  pagedData.map((row, index) => (
                    <tr
                      key={`${row.providerId ?? "p"}-${row.productId ?? "prd"}-${index}`}
                      className="transition-colors hover:bg-blue-50/30"
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-800 border-r border-slate-100">
                        {row.partyName}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 border-r border-slate-100">
                        {row.productName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 border-r border-slate-100">
                        {formatCurrency(row.netRate)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-r border-slate-100">
                        {row.opening}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 border-r border-slate-100">
                        {formatCurrency(row.openingValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-r border-slate-100">
                        {row.receipt}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-r border-slate-100">
                        {row.primarySale}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 border-r border-slate-100">
                        {formatCurrency(row.primaryValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-r border-slate-100">
                        {row.scheme}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-r border-slate-100">
                        {row.total}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-r border-slate-100">
                        {row.salesReturn}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 border-r border-slate-100">
                        {formatCurrency(row.returnValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-r border-slate-100">
                        {row.closing}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 border-r border-slate-100">
                        {formatCurrency(row.closingValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-r border-slate-100">
                        {row.expiry}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 border-r border-slate-100">
                        {formatCurrency(row.expiryValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-r border-slate-100">
                        {row.breakage}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 border-r border-slate-100">
                        {formatCurrency(row.breakageValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 border-r border-slate-100">
                        {row.batchRecall}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 border-r border-slate-100">
                        {formatCurrency(row.batchRecallValue)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 border-r border-slate-100">
                        {row.batchNumber}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{row.secondarySale}</td>
                    </tr>
                  ))
                )}
              </tbody>

              {reportData.length > 0 && (
                <tfoot className="bg-blue-600 text-white font-bold text-[11px]">
                  <tr>
                    <td className="py-3 px-3 border-r border-blue-500 uppercase tracking-wider" colSpan={2}>
                      Total
                    </td>
                    <td className="py-3 px-3 text-right border-r border-blue-500 font-mono">--</td>
                    <td className="py-3 px-3 text-right border-r border-blue-500">{totalValue("opening")}</td>
                    <td className="py-3 px-3 text-right border-r border-blue-500 font-mono">
                      {formatCurrency(totalValue("openingValue"))}
                    </td>
                    <td className="py-3 px-3 text-right border-r border-blue-500">{totalValue("receipt")}</td>
                    <td className="py-3 px-3 text-right border-r border-blue-500">{totalValue("primarySale")}</td>
                    <td className="py-3 px-3 text-right border-r border-blue-500 font-mono">
                      {formatCurrency(totalValue("primaryValue"))}
                    </td>
                    <td className="py-3 px-3 text-right border-r border-blue-500">{totalValue("scheme")}</td>
                    <td className="py-3 px-3 text-right border-r border-blue-500">{totalValue("total")}</td>
                    <td className="py-3 px-3 text-right border-r border-blue-500">{totalValue("salesReturn")}</td>
                    <td className="py-3 px-3 text-right border-r border-blue-500 font-mono">
                      {formatCurrency(totalValue("returnValue"))}
                    </td>
                    <td className="py-3 px-3 text-right border-r border-blue-500">{totalValue("closing")}</td>
                    <td className="py-3 px-3 text-right border-r border-blue-500 font-mono">
                      {formatCurrency(totalValue("closingValue"))}
                    </td>
                    <td className="py-3 px-3 text-right border-r border-blue-500">{totalValue("expiry")}</td>
                    <td className="py-3 px-3 text-right border-r border-blue-500 font-mono">
                      {formatCurrency(totalValue("expiryValue"))}
                    </td>
                    <td className="py-3 px-3 text-right border-r border-blue-500">{totalValue("breakage")}</td>
                    <td className="py-3 px-3 text-right border-r border-blue-500 font-mono">
                      {formatCurrency(totalValue("breakageValue"))}
                    </td>
                    <td className="py-3 px-3 text-right border-r border-blue-500">{totalValue("batchRecall")}</td>
                    <td className="py-3 px-3 text-right border-r border-blue-500 font-mono">
                      {formatCurrency(totalValue("batchRecallValue"))}
                    </td>
                    <td className="py-3 px-3 text-center border-r border-blue-500">--</td>
                    <td className="py-3 px-3 text-right">{totalValue("secondarySale")}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-50/50 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-medium">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {pagedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-700">
                {Math.min(currentPage * pageSize, reportData.length)}
              </span>{" "}
              of <span className="font-bold text-slate-700">{reportData.length}</span> entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                First
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <div className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white rounded shadow-sm border border-blue-600">
                {currentPage}
              </div>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SingleDropdown({ label, value, onSelect, options = [], disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const openMenu = () => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e) => {
      if (e.target?.closest && e.target.closest(".dropdown-portal")) return;
      setIsOpen(false);
    };

    const handleResize = () => setIsOpen(false);

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const selected = options.find(
    (option) => String(option.value ?? option.id) === String(value)
  );

  const hasValue = Boolean(value !== "" && value !== null && value !== undefined);

  const borderCls = disabled
    ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
    : hasValue
      ? isOpen
        ? "border-blue-500 ring-2 ring-blue-100 bg-white"
        : "border-blue-400 bg-white"
      : isOpen
        ? "border-slate-400 ring-2 ring-slate-100 bg-white"
        : "border-slate-300 bg-white";

  const labelColor = disabled
    ? "text-slate-400"
    : hasValue
      ? "text-blue-600 font-bold"
      : isOpen
        ? "text-slate-500 font-bold"
        : "text-slate-400 font-semibold";

  const labelPos =
    hasValue || isOpen
      ? "-top-[9px] text-[10px] bg-white px-1.5"
      : "top-[9px] text-sm bg-transparent";

  return (
    <div className="relative w-full select-none mt-1">
      <div
        ref={ref}
        onClick={openMenu}
        className={`w-full ${INPUT_CLASS} rounded-lg border flex items-center transition-all px-3.5 ${borderCls}`}
      >
        <span className={`truncate text-sm font-semibold flex-1 ${hasValue ? "text-slate-800" : "text-transparent"}`}>
          {selected?.label || " "}
        </span>
        <div className={`absolute right-3 flex items-center gap-1 pointer-events-none transition-transform duration-200 ${hasValue ? "text-blue-500" : "text-slate-400"} ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDown size={14} />
        </div>
      </div>

      <label className={`absolute left-3 pointer-events-none z-10 transition-all duration-200 tracking-wide uppercase ${labelPos} ${labelColor}`}>
        {label}
      </label>

      {isOpen && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <ul className="py-1.5 max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-400 italic text-center">No options available</li>
            ) : (
              options.map((opt, i) => {
                const optValue = String(opt.id ?? opt.value);
                return (
                  <li
                    key={`${optValue}-${i}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(optValue);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm cursor-pointer font-semibold transition-colors ${String(value) === optValue ? "bg-blue-50 text-blue-600 border-l-[3px] border-blue-500" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 border-l-[3px] border-transparent"}`}
                  >
                    {opt.label}
                  </li>
                );
              })
            )}
          </ul>
        </Portal>
      )}
    </div>
  );
}

function MultiDropdown({ label, options = [], selectedIds, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const isSelected = (id) => selectedIds.some((item) => String(item) === String(id));

  const openMenu = () => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e) => {
      if (e.target?.closest && e.target.closest(".dropdown-portal")) return;
      setIsOpen(false);
    };

    const handleResize = () => setIsOpen(false);

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const toggle = (id) => {
    const stringId = String(id);
    onChange(
      isSelected(stringId)
        ? selectedIds.filter((item) => String(item) !== stringId)
        : [...selectedIds, stringId]
    );
  };

  const selectAll = () => onChange(options.map((opt) => String(opt.id ?? opt.value)));
  const clearAll = () => onChange([]);

  const hasValue = selectedIds.length > 0;
  const displayText = hasValue
    ? options
        .filter((opt) => isSelected(opt.id ?? opt.value))
        .map((opt) => opt.label)
        .join(", ")
    : "";

  const borderCls = disabled
    ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
    : hasValue
      ? isOpen
        ? "border-blue-500 ring-2 ring-blue-100 bg-white"
        : "border-blue-400 bg-white"
      : isOpen
        ? "border-slate-400 ring-2 ring-slate-100 bg-white"
        : "border-slate-300 bg-white";

  const labelColor = disabled
    ? "text-slate-400"
    : hasValue
      ? "text-blue-600 font-bold"
      : isOpen
        ? "text-slate-500 font-bold"
        : "text-slate-400 font-semibold";

  const labelPos =
    hasValue || isOpen
      ? "-top-[9px] text-[10px] bg-white px-1.5"
      : "top-[9px] text-sm bg-transparent";

  return (
    <div className="relative w-full select-none mt-1">
      <div
        ref={ref}
        onClick={openMenu}
        className={`w-full ${INPUT_CLASS} rounded-lg border flex items-center transition-all px-3.5 ${borderCls}`}
      >
        <span className={`block truncate text-sm font-semibold flex-1 min-w-0 ${hasValue ? "text-slate-800" : "text-transparent"}`}>
          {displayText || " "}
        </span>
        <div className={`absolute right-3 flex items-center gap-1 pointer-events-none transition-transform duration-200 ${hasValue ? "text-blue-500" : "text-slate-400"} ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDown size={14} />
        </div>
      </div>

      <label className={`absolute left-3 pointer-events-none z-10 transition-all duration-200 tracking-wide uppercase ${labelPos} ${labelColor}`}>
        {label}
      </label>

      {isOpen && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectAll();
              }}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Select All
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                clearAll();
              }}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              Clear All
            </button>
          </div>

          <ul className="py-1.5 max-h-52 overflow-y-auto">
            {options.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-400 italic text-center">No options available</li>
            ) : (
              options.map((opt, idx) => {
                const optId = String(opt.id ?? opt.value);
                const selected = isSelected(optId);

                return (
                  <li
                    key={`${optId}-${idx}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggle(optId);
                    }}
                    className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-3 transition-colors ${selected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                      {selected && (
                        <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                          <path
                            d="M1 4l2.5 2.5L9 1"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className={`font-semibold ${selected ? "text-blue-700" : "text-slate-600"}`}>
                      {opt.label}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
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

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top, left, width, zIndex: 9999 }}
      className="dropdown-portal bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      {children}
    </div>
  );
}