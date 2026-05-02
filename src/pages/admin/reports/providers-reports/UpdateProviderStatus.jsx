import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, ChevronDown, Check,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  UserCheck, Search, X, ArrowLeft, Download
} from "lucide-react";

import api from "../../../../services/api";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Table columns ────────────────────────────────────────────────────────────
const TABLE_COLS = [
  { key: "sNo", label: "S. No.", center: true },
  { key: "stateName", label: "State Name" },
  { key: "districtName", label: "District / Headquarter" },
  { key: "areaName", label: "Area Name" },
  { key: "employeeName", label: "Employee Name" },
  { key: "providerName", label: "Provider Name" },
  { key: "providerCode", label: "Provider Code", center: true },
  { key: "category", label: "Category", center: true },
  { key: "specialization", label: "Specialization" },
  { key: "status", label: "Status", center: true },
];

export default function UpdateProviderStatus() {
  // ─── UI State ──────────────────────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(true);

  // ─── Filter State ──────────────────────────────────────────────────────────
  const [providerRadio, setProviderRadio] = useState("doctor"); // doctor | chemist
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [statusVal, setStatusVal] = useState("");

  // ─── Master Data ───────────────────────────────────────────────────────────
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [areasList, setAreasList] = useState([]);

  // ─── Table State ───────────────────────────────────────────────────────────
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState("");
  const [showTable, setShowTable] = useState(false);

  // ─── Pagination & search ───────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState("");

  // ─── Validation ────────────────────────────────────────────────────────────
  const [validationErrs, setValidationErrs] = useState({});

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const getAuth = useCallback(() => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
  }), []);

  // ─── 1. Fetch States & Employees on Mount ──────────────────────────────────
  useEffect(() => {
    api.get("/api/masters/states", getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setStatesList(Array.isArray(d) ? d.map(s => ({
          id: String(s.id ?? s.stateId),
          label: s.state_name || s.stateName || s.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("states error", e));

    api.get("/api/masters/employees", getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setEmployeesList(Array.isArray(d) ? d.map(e => ({
          id: String(e.id ?? e.employeeId),
          label: e.employee_name || e.employeeName || e.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("employees error", e));
  }, [getAuth]);

  // ─── 2. Fetch Districts when State changes ─────────────────────────────────
  useEffect(() => {
    if (!stateId) { setDistrictsList([]); setDistrictId(""); setAreasList([]); setAreaId(""); return; }
    api.get(`/api/masters/districts?stateIds=${stateId}`, getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setDistrictsList(Array.isArray(d) ? d.map(x => ({
          id: String(x.id ?? x.districtId),
          label: x.district_name || x.districtName || x.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("districts error", e));
    setDistrictId("");
  }, [stateId, getAuth]);

  // ─── 3. Fetch Areas when District changes ──────────────────────────────────
  useEffect(() => {
    if (!districtId) { setAreasList([]); setAreaId(""); return; }
    api.get(`/api/masters/areas?districtIds=${districtId}`, getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setAreasList(Array.isArray(d) ? d.map(x => ({
          id: String(x.id ?? x.areaId),
          label: x.area_name || x.areaName || x.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("areas error", e));
    setAreaId("");
  }, [districtId, getAuth]);

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!stateId) errs.state = "State is required!!!";
    if (!districtId) errs.district = "Headquarter is required";
    if (!employeeId) errs.employee = "Employee name is required!!!";
    return errs;
  };

  const handleFieldChange = (field, setter, val) => {
    setter(val);
    if (validationErrs[field]) {
      setValidationErrs(prev => ({ ...prev, [field]: null }));
    }
  };

  // ─── View Report ───────────────────────────────────────────────────────────
  const handleViewReport = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setValidationErrs(errs);
      return;
    }
    setValidationErrs({});
    setTableLoading(true);
    setShowTable(true);
    setTableData([]);
    setTableError("");
    setPage(1);
    setSearch("");
    try {
      const p = new URLSearchParams();
      p.append("providerType", providerRadio);
      if (stateId) p.append("stateId", stateId);
      if (districtId) p.append("districtId", districtId);
      if (employeeId) p.append("employeeId", employeeId);
      if (areaId) p.append("areaId", areaId);
      if (statusVal) p.append("status", statusVal);

      const res = await api.get(`/api/reports/provider-status?${p.toString()}`, getAuth());
      const data = res.data?.data || res.data || [];
      setTableData(Array.isArray(data) ? data : []);
    } catch (e) {
      setTableError(e.response?.data?.message || "Failed to load report. Please try again.");
    } finally {
      setTableLoading(false);
    }
  };

  // ─── CSV Download ──────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!tableData.length) return;
    const headers = TABLE_COLS.filter(c => c.key !== "sNo").map(c => c.label);
    const rows = tableData.map((r, i) =>
      TABLE_COLS.filter(c => c.key !== "sNo").map(c => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`)
    );
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Update_Provider_Status_${providerRadio}.csv`;
    a.click();
  };

  // ─── Filtered + Paged ──────────────────────────────────────────────────────
  const filtered = tableData.filter(r =>
    !search || Object.values(r).some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const STATUS_OPTIONS = [
    { value: "Active", label: "Active" },
    { value: "Pending For Approval", label: "Pending For Approval" },
    { value: "Pending For Deletion", label: "Pending For Deletion" },
    { value: "InActive", label: "InActive" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-400 pb-12 font-sans">
      {/* ══ FILTER CARD ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        {/* Title row */}
        <div className="px-6 sm:px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
              <UserCheck size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Update Provider Status</h2>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>Filter providers to view or update their approval status</p>
            </div>
          </div>
          {/* Filter toggle */}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Filter</span>
            <button
              onClick={() => setFilterOpen(p => !p)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${filterOpen ? "bg-blue-600" : "bg-slate-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${filterOpen ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="p-6 sm:p-8 space-y-6">
            <ProviderRadio value={providerRadio} onChange={setProviderRadio} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-6 items-start mt-4">
              {/* Select State */}
              <div className="space-y-1">
                <SingleDropdown
                  label="SELECT STATE *"
                  value={stateId}
                  onSelect={v => handleFieldChange("state", setStateId, v)}
                  options={statesList}
                />
                {validationErrs.state && (
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", paddingTop: 2 }}>{validationErrs.state}</p>
                )}
              </div>

              {/* Select District */}
              <div className="space-y-1">
                <SingleDropdown
                  label="SELECT DISTRICT *"
                  value={districtId}
                  onSelect={v => handleFieldChange("district", setDistrictId, v)}
                  options={districtsList}
                  disabled={!stateId}
                />
                {validationErrs.district && (
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", paddingTop: 2 }}>{validationErrs.district}</p>
                )}
              </div>

              {/* Select Employee */}
              <div className="space-y-1">
                <SingleDropdown
                  label="SELECT EMPLOYEE *"
                  value={employeeId}
                  onSelect={v => handleFieldChange("employee", setEmployeeId, v)}
                  options={employeesList}
                />
                {validationErrs.employee && (
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", paddingTop: 2 }}>{validationErrs.employee}</p>
                )}
              </div>

              <SingleDropdown label="SELECT AREA" value={areaId} onSelect={setAreaId} options={areasList} disabled={!districtId} />
              <SingleDropdown label="SELECT STATUS" value={statusVal} onSelect={setStatusVal} options={STATUS_OPTIONS} />
            </div>

            {/* View Report button */}
            <div className="flex justify-start pt-2 border-t border-slate-100 mt-2">
              <button
                onClick={handleViewReport}
                disabled={tableLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-bold transition-all shadow-md shadow-blue-200 active:scale-95"
                style={{ fontSize: 13 }}
              >
                {tableLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                View Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ RESULTS TABLE ════════════════════════════════════════════════════ */}
      {showTable && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-slate-50/40 gap-3">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Provider Status Details</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af" }}>({filtered.length} record{filtered.length !== 1 ? "s" : ""})</span>
            </div>
            <div className="flex items-center gap-3">
              {!tableLoading && !tableError && tableData.length > 0 && (
                <button onClick={handleDownload} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-bold transition-all" style={{ fontSize: 11 }}>
                  <Download size={12} /> Excel
                </button>
              )}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="pl-8 pr-8 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ fontSize: 12, width: 180 }} />
                {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={12} /></button>}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {TABLE_COLS.map(col => (
                    <th key={col.key} className="px-3 py-2 border-r border-slate-100 last:border-r-0 whitespace-nowrap" style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: col.center ? "center" : "left" }}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableLoading && (
                  <tr>
                    <td colSpan={TABLE_COLS.length} className="py-16 text-center">
                      <div className="flex items-center justify-center gap-2" style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>
                        <Loader2 size={18} className="animate-spin text-blue-500" /> Loading data…
                      </div>
                    </td>
                  </tr>
                )}
                {!tableLoading && tableError && (
                  <tr><td colSpan={TABLE_COLS.length} className="py-10 text-center text-red-500 font-bold" style={{ fontSize: 12 }}>{tableError}</td></tr>
                )}
                {!tableLoading && !tableError && paged.length === 0 && (
                  <tr><td colSpan={TABLE_COLS.length} className="py-16 text-center text-slate-400 font-semibold" style={{ fontSize: 12 }}>No records found.</td></tr>
                )}
                {!tableLoading && !tableError && paged.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors bg-white">
                    {TABLE_COLS.map(col => (
                      <td key={col.key} className="px-3 py-2 border-r border-slate-100 last:border-r-0 whitespace-nowrap" style={{ fontSize: 12, fontWeight: 500, color: "#374151", textAlign: col.center ? "center" : "left" }}>
                        {col.key === "sNo" ? (page - 1) * PAGE_SIZE + idx + 1
                          : col.key === "status" ? <StatusBadge value={row[col.key]} />
                          : col.key === "category" ? <CategoryBadge value={row[col.key]} />
                          : row[col.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!tableLoading && !tableError && filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} records</span>
              <div className="flex items-center gap-1">
                <PagBtn onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft size={13} /></PagBtn>
                <PagBtn onClick={() => setPage(p => p - 1)} disabled={page === 1}><ChevronLeft size={13} /></PagBtn>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return pg <= totalPages ? <PagBtn key={pg} active={pg === page} onClick={() => setPage(pg)}>{pg}</PagBtn> : null;
                })}
                <PagBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages}><ChevronRight size={13} /></PagBtn>
                <PagBtn onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight size={13} /></PagBtn>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared UI Components ───────────────────────────────────────────────────

function ProviderRadio({ value, onChange }) {
  return (
    <div className="flex items-center gap-8">
      {[{ val: "doctor", label: "Doctor" }, { val: "chemist", label: "Chemist / Stockist" }].map(opt => (
        <label key={opt.val} className="flex items-center gap-2 cursor-pointer group" onClick={() => onChange(opt.val)}>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${value === opt.val ? "border-blue-600" : "border-slate-300 group-hover:border-blue-300"}`}>
            {value === opt.val && <div className="w-2 h-2 rounded-full bg-blue-600" />}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: value === opt.val ? "#111827" : "#4b5563" }}>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function StatusBadge({ value }) {
  const v = String(value ?? "").toLowerCase();
  const cls = v.includes("active") && !v.includes("inactive") ? "bg-green-100 text-green-700" : v.includes("inactive") ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700";
  return <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${cls}`}>{value}</span>;
}

function CategoryBadge({ value }) {
  const map = { "A+": "bg-purple-100 text-purple-700", "A": "bg-blue-100 text-blue-700", "B+": "bg-sky-100 text-sky-700", "B": "bg-teal-100 text-teal-700", "C": "bg-amber-100 text-amber-700", "D": "bg-slate-100 text-slate-600", "Core": "bg-rose-100 text-rose-700" };
  return <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${map[String(value)] || "bg-slate-100 text-slate-500"}`}>{value ?? "—"}</span>;
}

function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 transition-colors" style={{ fontSize: 11, fontWeight: 600, color: active ? "#fff" : "#374151", background: active ? "#2563eb" : "#fff", borderColor: active ? "#2563eb" : "#e5e7eb", opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>{children}</button>
  );
}

function SingleDropdown({ label, value, onSelect, options = [], disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const selected = options.find(o => String(o.id) === String(value));
  const active = open || Boolean(value);
  return (
    <div ref={ref} className="relative w-full mt-2">
      <div onClick={() => !disabled && setOpen(!open)} className="w-full h-[38px] flex items-center justify-between px-3 border rounded-lg transition-all" style={{ border: open ? "1.5px solid #2563eb" : "1.5px solid #d1d5db", background: disabled ? "#f9fafb" : "#fff", cursor: disabled ? "not-allowed" : "pointer" }}>
        <span className="truncate text-[13px] font-semibold" style={{ color: value ? "#111827" : "transparent" }}>{selected?.label || " "}</span>
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180 text-blue-600" : "text-slate-400"}`} />
      </div>
      <label className="absolute left-2.5 px-1 transition-all pointer-events-none" style={{ top: active ? -8 : 10, fontSize: active ? 10 : 13, fontWeight: active ? 700 : 500, color: open ? "#2563eb" : "#6b7280", background: active ? "#fff" : "transparent", textTransform: active ? "uppercase" : "none" }}>{label}</label>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {options.length === 0 ? <div className="p-3 text-center text-slate-400 italic text-xs">No options</div> : options.map(o => (
            <div key={o.id} onClick={() => { onSelect(o.id); setOpen(false); }} className="px-3 py-2 text-[13px] cursor-pointer hover:bg-blue-50 flex items-center gap-2 transition-colors">
              {String(o.id) === String(value) && <Check size={13} className="text-blue-600" />}
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Portal({ top, left, width, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "fixed", top, left, width, zIndex: 9999 }} className="bg-white border border-slate-200 shadow-xl overflow-hidden rounded-lg animate-in fade-in zoom-in-95 duration-100">
      {children}
    </div>
  );
}