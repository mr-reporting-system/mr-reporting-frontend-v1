import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, AlertCircle, ChevronDown, SlidersHorizontal,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MapPin, Calendar, User, Briefcase, ToggleRight,
  Check, X, FileSpreadsheet
} from "lucide-react";
import api from "../../../services/api";

// ─── Month options (number value for API, name for display) ──────────────────
const MONTHS = [
  { value: 1,  label: "January"   }, { value: 2,  label: "February"  },
  { value: 3,  label: "March"     }, { value: 4,  label: "April"     },
  { value: 5,  label: "May"       }, { value: 6,  label: "June"      },
  { value: 7,  label: "July"      }, { value: 8,  label: "August"    },
  { value: 9,  label: "September" }, { value: 10, label: "October"   },
  { value: 11, label: "November"  }, { value: 12, label: "December"  },
];

const YEARS     = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
const PAGE_SIZE = 10;

// ─── Table columns ────────────────────────────────────────────────────────────
const TABLE_COLS = [
  { key: "stateName",      label: "State Name" },
  { key: "hqName",         label: "Headquarter Name" },
  { key: "name",           label: "Name" },
  { key: "employeeCode",   label: "Employee Code" },
  { key: "division",       label: "Division" },
  { key: "designation",    label: "Designation" },
  { key: "submitted",      label: "Submitted" },
  { key: "submissionDate", label: "Submission Date" },
  { key: "approved",       label: "Approved" },
  { key: "approvedDate",   label: "Approved Date" },
  { key: "rejectionMsg",   label: "Rejection Message" },
];

const boolStr = v =>
  v === true  || v === "true"  ? "Yes" :
  v === false || v === "false" ? "No"  : String(v ?? "—");

const getVal = (row, key) => ({
  stateName:      row.stateName      || row.state_name      || row.state?.stateName      || "—",
  hqName:         row.hqName         || row.headquarterName || row.district?.districtName || "—",
  name:           row.name           || row.employeeName    || row.employee?.name         || "—",
  employeeCode:   row.employeeCode   || row.employee_code   || row.employee?.code         || "—",
  division:       row.division       || "—",
  designation:    row.designation    || row.designationName || row.employee?.designation?.name || "—",
  submitted:      row.submitted      != null ? boolStr(row.submitted)  : "—",
  submissionDate: row.submissionDate || row.submission_date || "—",
  approved:       row.approved       != null ? boolStr(row.approved)   : "—",
  approvedDate:   row.approvedDate   || row.approved_date   || "—",
  rejectionMsg:   row.rejectionMessage || row.rejectionMsg  || row.rejection_message || "—",
}[key] ?? "—");

const H = "h-[46px]"; // shared input height

// ─────────────────────────────────────────────────────────────────────────────
export default function ApproveTourProgram() {
  const [filterOpen, setFilterOpen] = useState(true);
  const [mode,       setMode]       = useState("geographical");

  // ── Dropdown data ─────────────────────────────────────────────────────────
  const [states,       setStates]       = useState([]);
  const [districts,    setDistricts]    = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees,    setEmployees]    = useState([]);

  // ── Geographical filters ──────────────────────────────────────────────────
  // Fields: State(multi) → District(multi) → Month → Year
  const [geoStateIds,   setGeoStateIds]   = useState([]);
  const [geoDistIds,    setGeoDistIds]    = useState([]);
  const [geoMonth,      setGeoMonth]      = useState("");
  const [geoYear,       setGeoYear]       = useState("");

  // ── Hierarchical filters ──────────────────────────────────────────────────
  // Fields: Designation(one) → Status(one) → Employee(multi) → Month → Year
  const [hierDesignation, setHierDesignation] = useState("");
  const [hierStatus,      setHierStatus]      = useState("");   // "true" | "false" → isActive
  const [hierEmployeeIds, setHierEmployeeIds] = useState([]);
  const [hierMonth,       setHierMonth]       = useState("");
  const [hierYear,        setHierYear]        = useState("");

  // ── Table ─────────────────────────────────────────────────────────────────
  const [tableData,    setTableData]    = useState([]);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [currentPage,  setCurrentPage]  = useState(1);
  const [tableVisible, setTableVisible] = useState(false);

  // ── Reject popup ──────────────────────────────────────────────────────────
  const [rejectPopup,  setRejectPopup]  = useState(false);
  const [rejectRow,    setRejectRow]    = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // ── UI ────────────────────────────────────────────────────────────────────
  const [isLoading,    setIsLoading]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchInitialData(); }, []);

  // State selection → fetch districts
  // GET /api/masters/districts/by-states?stateIds=1,2
  useEffect(() => {
    if (geoStateIds.length > 0) {
      fetchDistricts(geoStateIds);
      setGeoDistIds([]);
    } else {
      setDistricts([]);
      setGeoDistIds([]);
    }
  }, [geoStateIds]);

  // Designation + Status → fetch employees
  // GET /api/approvals/tour-program/employees?designationId=3&isActive=true
  useEffect(() => {
    if (hierDesignation && hierStatus !== "") {
      fetchEmployees(hierDesignation, hierStatus);
      setHierEmployeeIds([]);
    } else {
      setEmployees([]);
      setHierEmployeeIds([]);
    }
  }, [hierDesignation, hierStatus]);

  // Reset table on mode change
  useEffect(() => {
    setTableVisible(false); setTableData([]);
    setSearchQuery(""); setCurrentPage(1); setError(""); setSuccessMsg("");
  }, [mode]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      // GET /api/masters/states
      // GET /api/masters/designations
      const [sRes, dRes] = await Promise.all([
        api.get("/api/masters/states"),
        api.get("/api/masters/designations"),
      ]);
      if (sRes.data?.success) setStates(sRes.data.data || []);
      if (dRes.data?.success) setDesignations(dRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  // GET /api/masters/districts/by-states?stateIds=1,2
  const fetchDistricts = async (stateIds) => {
    try {
      const res = await api.get(`/api/masters/districts/by-states?stateIds=${stateIds.join(",")}`);
      if (res.data?.success) setDistricts(res.data.data || []);
      else setDistricts([]);
    } catch { setDistricts([]); }
  };

  // GET /api/approvals/tour-program/employees?designationId=3&isActive=true
  const fetchEmployees = async (designationId, isActive) => {
    try {
      const res = await api.get(
        `/api/approvals/tour-program/employees?designationId=${designationId}&isActive=${isActive}`
      );
      if (res.data?.success) setEmployees(res.data.data || []);
      else setEmployees([]);
    } catch { setEmployees([]); }
  };

  // ── View Status ───────────────────────────────────────────────────────────
  const handleViewStatus = async () => {
    setError(""); setSuccessMsg("");

    if (mode === "geographical") {
      if (!geoStateIds.length) return setError("Please select at least one State.");
      if (!geoDistIds.length)  return setError("Please select at least one District.");
      if (!geoMonth)           return setError("Please select a Month.");
      if (!geoYear)            return setError("Please select a Year.");
    } else {
      if (!hierDesignation)        return setError("Please select a Designation.");
      if (!hierStatus)             return setError("Please select a Status.");
      if (!hierEmployeeIds.length) return setError("Please select at least one Employee.");
      if (!hierMonth)              return setError("Please select a Month.");
      if (!hierYear)               return setError("Please select a Year.");
    }

    setIsLoading(true); setTableVisible(false);
    try {
      let res;
      if (mode === "geographical") {
        // GET /api/approvals/tour-program/geographical?districtIds=1,2&month=2&year=2026
        const p = new URLSearchParams({ month: geoMonth, year: geoYear });
        geoDistIds.forEach(id => p.append("districtIds", id));
        res = await api.get(`/api/approvals/tour-program/geographical?${p}`);
      } else {
        // GET /api/approvals/tour-program/hierarchical?designationId=3&isActive=true&employeeIds=1,2&month=2&year=2026
        const p = new URLSearchParams({
          designationId: hierDesignation,
          isActive:      hierStatus,
          month:         hierMonth,
          year:          hierYear,
        });
        hierEmployeeIds.forEach(id => p.append("employeeIds", id));
        res = await api.get(`/api/approvals/tour-program/hierarchical?${p}`);
      }
      const data = res.data?.data || res.data || [];
      setTableData(Array.isArray(data) ? data : []);
      setTableVisible(true); setCurrentPage(1); setSearchQuery("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data.");
    } finally { setIsLoading(false); }
  };

  // ── Approve row ───────────────────────────────────────────────────────────
  // PUT /api/approvals/tour-program/approve/{tourProgramId}
  const handleApprove = async (row) => {
    const id = row.id || row.tourProgramId;
    if (!id) return;
    setIsSubmitting(true); setError("");
    try {
      await api.put(`/api/approvals/tour-program/approve/${id}`);
      setSuccessMsg("Tour program approved successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
      // Refresh table data
      await handleViewStatus();
    } catch (err) {
      setError(err.response?.data?.message || "Approve failed.");
    } finally { setIsSubmitting(false); }
  };

  // ── Open reject popup ─────────────────────────────────────────────────────
  const openRejectPopup = (row) => {
    setRejectRow(row);
    setRejectReason("");
    setRejectPopup(true);
  };

  // ── Reject row ────────────────────────────────────────────────────────────
  // PUT /api/approvals/tour-program/reject/{tourProgramId}
  // body: { "rejectionMessage": "..." }
  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    const id = rejectRow?.id || rejectRow?.tourProgramId;
    if (!id) return;
    setIsSubmitting(true); setError("");
    try {
      await api.put(`/api/approvals/tour-program/reject/${id}`, {
        rejectionMessage: rejectReason.trim()
      });
      setRejectPopup(false); setRejectReason(""); setRejectRow(null);
      setSuccessMsg("Tour program rejected.");
      setTimeout(() => setSuccessMsg(""), 3500);
      await handleViewStatus();
    } catch (err) {
      setError(err.response?.data?.message || "Reject failed.");
      setRejectPopup(false);
    } finally { setIsSubmitting(false); }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!filteredData.length) return;
    const header = TABLE_COLS.map(c => c.label).join(",");
    const rows   = filteredData.map(r =>
      TABLE_COLS.map(c => `"${String(getVal(r, c.key)).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob([`${header}\n${rows}`], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "tour_program.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  const filteredData = tableData.filter(row =>
    TABLE_COLS.some(c => String(getVal(row, c.key)).toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData  = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const goToPage   = p => setCurrentPage(Math.min(Math.max(1, p), totalPages));

  // ── Option arrays ─────────────────────────────────────────────────────────
  const stateOpts = states.map(s       => ({ id: String(s.id), label: s.state_name || s.stateName }));
  const distOpts  = districts.map(d    => ({ id: String(d.id), label: d.district_name || d.districtName }));
  const desigOpts = designations.map(d => ({ value: String(d.id), label: d.name || d.designation_name }));
  const empOpts   = employees.map(e    => ({ id: String(e.id), label: e.name || e.employee_name }));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-400 pb-12">

      {/* ══ FILTER CARD ════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-sky-400 rounded-t-xl" />

        {/* Header */}
        <div className={`px-6 sm:px-8 pt-5 pb-4 flex items-center justify-between
          ${filterOpen ? "border-b border-gray-100" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <SlidersHorizontal size={18} className="text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-gray-800">Approve Tour Program</h2>
          </div>
          {/* Filter toggle */}
          <button onClick={() => setFilterOpen(p => !p)}
            className="flex items-center gap-2 group" title="Toggle filter">
            <span className="text-sm font-semibold text-gray-500 group-hover:text-gray-700 transition-colors">
              Filter
            </span>
            <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-300
              ${filterOpen ? "bg-blue-500 justify-end" : "bg-gray-300 justify-start"}`}>
              <div className="w-5 h-5 bg-white rounded-full shadow-md" />
            </div>
          </button>
        </div>

        {filterOpen && (
          <div className="px-6 sm:px-8 py-6 pb-8 space-y-5">

            {/* Radio */}
            <div className="flex items-center gap-8">
              {[
                { value: "geographical", label: "Geographical" },
                { value: "hierarchical", label: "Hierarchical" },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center
                    transition-all flex-shrink-0
                    ${mode === opt.value ? "border-blue-500" : "border-gray-300 group-hover:border-blue-300"}`}>
                    {mode === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                  </div>
                  <input type="radio" className="sr-only" value={opt.value}
                    checked={mode === opt.value} onChange={() => setMode(opt.value)} />
                  <span className={`text-sm font-semibold transition-colors
                    ${mode === opt.value ? "text-gray-800" : "text-gray-500 group-hover:text-gray-700"}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Alert */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-sm">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg border border-emerald-100 text-sm">
                <Check size={15} className="flex-shrink-0" /> {successMsg}
              </div>
            )}

            {/* ════════ GEOGRAPHICAL ════════
                Fields: State(multi) | District(multi) | Month | Year | ViewStatus
            ════════════════════════════════ */}
            {mode === "geographical" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* State — multi */}
                  <MultiDropdown
                    label="SELECT STATE *"
                    icon={MapPin}
                    options={stateOpts}
                    selectedIds={geoStateIds}
                    onChange={setGeoStateIds}
                  />
                  {/* District — multi (loads after state selected) */}
                  <MultiDropdown
                    label="SELECT DISTRICT *"
                    icon={MapPin}
                    options={distOpts}
                    selectedIds={geoDistIds}
                    onChange={setGeoDistIds}
                    disabled={!geoStateIds.length}
                  />
                  {/* Month */}
                  <Dropdown
                    label="SELECT MONTH *"
                    value={geoMonth}
                    onSelect={setGeoMonth}
                    options={MONTHS.map(m => ({ value: m.value, label: m.label }))}
                    icon={Calendar}
                  />
                  {/* Year */}
                  <Dropdown
                    label="SELECT YEAR *"
                    value={geoYear}
                    onSelect={setGeoYear}
                    options={YEARS.map(y => ({ value: y, label: String(y) }))}
                    icon={Calendar}
                  />
                </div>
                <div className="flex justify-start">
                  <div className="w-full lg:w-1/4">
                    <ViewStatusBtn onClick={handleViewStatus} loading={isLoading} />
                  </div>
                </div>
              </div>
            )}

            {/* ════════ HIERARCHICAL ════════
                Row 1: Designation(one) | Status(one) | Employee(multi) | Month
                Row 2: Year | ViewStatus
            ════════════════════════════════ */}
            {mode === "hierarchical" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Designation — single */}
                  <Dropdown
                    label="SELECT DESIGNATION *"
                    value={hierDesignation}
                    onSelect={v => { setHierDesignation(v); setHierStatus(""); setHierEmployeeIds([]); }}
                    options={desigOpts}
                    icon={Briefcase}
                  />
                  {/* Status (isActive) — single */}
                  <Dropdown
                    label="SELECT STATUS *"
                    value={hierStatus}
                    onSelect={setHierStatus}
                    options={[
                      { value: "true",  label: "Active"   },
                      { value: "false", label: "Inactive" },
                    ]}
                    icon={ToggleRight}
                    disabled={!hierDesignation}
                  />
                  {/* Employee — multi (loads after designation + status) */}
                  <MultiDropdown
                    label="SELECT EMPLOYEE *"
                    icon={User}
                    options={empOpts}
                    selectedIds={hierEmployeeIds}
                    onChange={setHierEmployeeIds}
                    disabled={!hierDesignation || !hierStatus}
                  />
                  {/* Month */}
                  <Dropdown
                    label="SELECT MONTH *"
                    value={hierMonth}
                    onSelect={setHierMonth}
                    options={MONTHS.map(m => ({ value: m.value, label: m.label }))}
                    icon={Calendar}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
                  {/* Year */}
                  <Dropdown
                    label="SELECT YEAR *"
                    value={hierYear}
                    onSelect={setHierYear}
                    options={YEARS.map(y => ({ value: y, label: String(y) }))}
                    icon={Calendar}
                  />
                  <ViewStatusBtn onClick={handleViewStatus} loading={isLoading} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ TABLE ════════════════════════════════════════════════════ */}
      {tableVisible && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100
          animate-in slide-in-from-bottom-2 duration-300">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-sky-400 rounded-t-xl" />

          <div className="px-6 sm:px-8 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Tour Program Detail</h3>
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
              {filteredData.length} record{filteredData.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="px-6 sm:px-8 py-5 space-y-4">
            {/* Search + Export */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-56">
                <input type="text" placeholder="Search…" value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full border-2 border-gray-300 focus:border-blue-500 rounded-lg
                    pl-4 pr-9 py-[9px] text-sm text-gray-800 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                <Search size={15} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
              </div>
              <button onClick={handleExport} title="Export to CSV"
                className="w-9 h-9 flex items-center justify-center rounded-lg
                  bg-green-600 hover:bg-green-700 text-white transition-all active:scale-95 shadow-sm">
                <FileSpreadsheet size={17} />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm text-left" style={{ minWidth: 1200 }}>
                <thead className="bg-blue-600 text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap">#</th>
                    {TABLE_COLS.map(c => (
                      <th key={c.key} className="py-3.5 px-4 font-semibold whitespace-nowrap">{c.label}</th>
                    ))}
                    <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td colSpan={TABLE_COLS.length + 2} className="py-14 text-center">
                      <Loader2 className="animate-spin inline-block text-blue-500" size={28} />
                    </td></tr>
                  ) : pagedData.length === 0 ? (
                    <tr><td colSpan={TABLE_COLS.length + 2} className="py-14 text-center text-gray-400 text-sm">
                      No records found.
                    </td></tr>
                  ) : pagedData.map((row, i) => (
                    <tr key={row.id || i}
                      className={`transition-colors hover:bg-blue-50/20 ${i % 2 !== 0 ? "bg-gray-50/40" : "bg-white"}`}>
                      <td className="py-3.5 px-4 text-gray-500 text-xs">
                        {(currentPage - 1) * PAGE_SIZE + i + 1}
                      </td>
                      {TABLE_COLS.map(c => {
                        const val = getVal(row, c.key);
                        return (
                          <td key={c.key} className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                            {c.key === "approved"
                              ? <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                  ${val === "Yes"
                                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                                    : "bg-gray-100 text-gray-500"}`}>{val}</span>
                              : c.key === "submitted"
                                ? <span className="font-semibold text-gray-800">{val}</span>
                                : val}
                          </td>
                        );
                      })}
                      {/* Approve / Reject actions per row */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(row)}
                            disabled={isSubmitting || getVal(row, "approved") === "Yes"}
                            title="Approve"
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold
                              transition-all active:scale-95
                              ${getVal(row, "approved") === "Yes"
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"}`}
                          >
                            {isSubmitting ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectPopup(row)}
                            disabled={isSubmitting}
                            title="Reject"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold
                              bg-gray-700 hover:bg-gray-800 text-white shadow-sm transition-all active:scale-95
                              disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X size={11} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <PaginationBtn label="First"    icon={<ChevronsLeft  size={14} />}           onClick={() => goToPage(1)}               disabled={currentPage === 1} />
              <PaginationBtn label="Previous" icon={<ChevronLeft   size={14} />}           onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} />
              <span className="text-sm font-semibold px-4 py-2 rounded-lg bg-blue-50 text-blue-700">
                Page {currentPage} of {totalPages}
              </span>
              <PaginationBtn label="Next" iconRight icon={<ChevronRight  size={14} />} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} />
              <PaginationBtn label="Last" iconRight icon={<ChevronsRight size={14} />} onClick={() => goToPage(totalPages)}       disabled={currentPage === totalPages} />
            </div>
          </div>
        </div>
      )}

      {/* ══ REJECT POPUP ════════════════════════════════════════════ */}
      {rejectPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40
          backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden
            animate-in zoom-in-95 duration-150">
            <div className="px-6 pt-6 pb-3 text-center border-b border-gray-100">
              <div className="w-11 h-11 rounded-full bg-red-50 border-2 border-red-100
                flex items-center justify-center mx-auto mb-3">
                <X size={20} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Rejection Message</h3>
              <p className="text-xs text-gray-500 mt-1">Provide a reason for rejection.</p>
            </div>
            <div className="px-6 py-5">
              <textarea
                rows={5}
                placeholder="Type reason here…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-300 focus:border-blue-500
                  focus:ring-2 focus:ring-blue-100 px-4 py-3 text-sm text-gray-800
                  placeholder-gray-400 resize-none focus:outline-none transition-all"
              />
            </div>
            <div className="flex items-center justify-center gap-3 px-6 pb-6">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || isSubmitting}
                className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-blue-600
                  hover:bg-blue-700 text-white text-sm font-bold transition-all active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                OK
              </button>
              <button
                onClick={() => { setRejectPopup(false); setRejectReason(""); setRejectRow(null); }}
                className="px-8 py-2.5 rounded-lg border-2 border-gray-300 text-gray-600
                  hover:border-gray-400 text-sm font-bold transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Dropdown — single select, portal-positioned list
// ═══════════════════════════════════════════════════════════════════
function Dropdown({ label, value, onSelect, options = [], icon: Icon, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos,    setPos]    = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const openMenu = () => {
    if (disabled) return;
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  const selected = options.find(o => String(o.value) === String(value));
  const hasValue = Boolean(value !== "" && value !== null && value !== undefined);
  const canOpen  = !disabled;

  const borderCls = disabled
    ? "border-gray-200 bg-gray-50"
    : hasValue
      ? isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400"
      : isOpen ? "border-gray-400 ring-2 ring-gray-100" : "border-gray-300";

  const labelColor = disabled ? "text-gray-300"
    : hasValue ? "text-blue-500"
    : isOpen   ? "text-gray-500"
    : "text-gray-400";

  const labelPos = hasValue || isOpen ? "-top-2.5 text-[11px]" : "top-[14px] text-sm";

  return (
    <div className="relative w-full">
      <div ref={ref} onClick={openMenu}
        className={`w-full ${H} rounded-lg border-2 bg-white pl-4 pr-10
          flex items-center transition-all
          ${canOpen ? "cursor-pointer" : "cursor-not-allowed"} ${borderCls}`}>
        <span className={`truncate text-sm font-medium flex-1 ${hasValue ? "text-gray-900" : "text-transparent"}`}>
          {selected?.label || " "}
        </span>
        <div className={`absolute right-3 flex items-center gap-1 pointer-events-none
          ${hasValue ? "text-blue-400" : disabled ? "text-gray-300" : "text-gray-400"}`}>
          {Icon && <Icon size={14} className="opacity-70" />}
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>
      <label className={`absolute left-3 px-1 bg-white pointer-events-none z-10
        transition-all duration-200 font-semibold ${labelPos} ${labelColor}`}>
        {label}
      </label>

      {isOpen && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          {options.length === 0
            ? <div className="px-4 py-3 text-sm text-gray-400 italic text-center">No options available</div>
            : <ul className="py-1.5 max-h-60 overflow-y-auto">
                {options.map((opt, i) => (
                  <li key={i}
                    onMouseDown={e => { e.preventDefault(); onSelect(opt.value); setIsOpen(false); }}
                    className={`px-4 py-3 text-sm cursor-pointer font-medium transition-colors
                      ${String(value) === String(opt.value)
                        ? "bg-blue-50 text-blue-600 font-semibold border-l-[3px] border-blue-500"
                        : "text-gray-700 hover:bg-blue-500 hover:text-white border-l-[3px] border-transparent"
                      }`}>
                    {opt.label}
                  </li>
                ))}
              </ul>
          }
        </Portal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MultiDropdown — multi select, portal-positioned list
// ═══════════════════════════════════════════════════════════════════
function MultiDropdown({ label, options = [], selectedIds, onChange, icon: Icon, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos,    setPos]    = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const openMenu = () => {
    if (disabled) return;
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  const toggle    = id => onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  const selectAll = ()  => onChange(options.map(o => o.id));
  const clearAll  = ()  => onChange([]);

  const hasValue    = selectedIds.length > 0;
  const displayText = hasValue
    ? options.filter(o => selectedIds.includes(o.id)).map(o => o.label).join(", ")
    : "";

  const borderCls = disabled
    ? "border-gray-200 bg-gray-50"
    : hasValue
      ? isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400"
      : isOpen ? "border-gray-400 ring-2 ring-gray-100" : "border-gray-300";

  const labelColor = disabled ? "text-gray-300"
    : hasValue ? "text-blue-500"
    : isOpen   ? "text-gray-500"
    : "text-gray-400";

  const labelPos = hasValue || isOpen ? "-top-2.5 text-[11px]" : "top-[14px] text-sm";

  return (
    <div className="relative w-full">
      <div ref={ref} onClick={openMenu}
        className={`w-full ${H} rounded-lg border-2 bg-white pl-4 pr-10
          flex items-center transition-all
          ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${borderCls}`}>
        <span className={`block truncate text-sm font-medium flex-1 min-w-0
          ${hasValue ? "text-gray-900" : "text-transparent"}`}>
          {displayText || " "}
        </span>
        <div className={`absolute right-3 flex items-center gap-1 pointer-events-none
          ${hasValue ? "text-blue-400" : disabled ? "text-gray-300" : "text-gray-400"}`}>
          {Icon && <Icon size={14} className="opacity-70" />}
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>
      <label className={`absolute left-3 px-1 bg-white pointer-events-none z-10
        transition-all duration-200 font-semibold ${labelPos} ${labelColor}`}>
        {label}
      </label>

      {isOpen && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div className="flex border-b border-gray-100">
            <button type="button" onMouseDown={e => { e.preventDefault(); selectAll(); }}
              className="flex-1 py-2 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors">
              Select All
            </button>
            <button type="button" onMouseDown={e => { e.preventDefault(); clearAll(); }}
              className="flex-1 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
              Clear All
            </button>
          </div>
          {options.length === 0
            ? <div className="px-4 py-3 text-sm text-gray-400 italic text-center">No options available</div>
            : <ul className="py-1.5 max-h-52 overflow-y-auto">
                {options.map((opt, idx) => {
                  const isSel = selectedIds.includes(opt.id);
                  return (
                    <li key={opt.id ?? idx}
                      onMouseDown={e => { e.preventDefault(); toggle(opt.id); }}
                      className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-3 transition-colors
                        ${isSel ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                        transition-all ${isSel ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                        {isSel && (
                          <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className={`font-medium ${isSel ? "text-blue-600" : "text-gray-700"}`}>{opt.label}</span>
                    </li>
                  );
                })}
              </ul>
          }
        </Portal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Portal — fixed-positioned, escapes all overflow clipping
// ═══════════════════════════════════════════════════════════════════
function Portal({ top, left, width, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
    }, 10);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div ref={ref}
      style={{ position: "fixed", top, left, width, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden
        animate-in fade-in zoom-in-95 duration-100">
      {children}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ViewStatusBtn({ onClick, loading }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className={`w-full ${H} flex items-center justify-center gap-2 px-6 rounded-lg
        bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold
        transition-all active:scale-95 shadow-sm shadow-blue-200
        disabled:opacity-60 disabled:cursor-not-allowed`}>
      {loading
        ? <Loader2 size={15} className="animate-spin" />
        : <span className="text-base font-bold leading-none">✓</span>}
      View Status
    </button>
  );
}

function PaginationBtn({ label, icon, iconRight, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
        border-2 transition-all active:scale-95
        ${disabled
          ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400"
        }`}>
      {!iconRight && icon}{label}{iconRight && icon}
    </button>
  );
}