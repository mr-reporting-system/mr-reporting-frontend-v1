import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, AlertCircle, CheckCircle2,
  ChevronDown, Check, Trash2, SlidersHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import api from "../../../services/api";

// ─── Page sizes ───────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 20, 50];

// ─── Request status options ───────────────────────────────────────────────────
// Used in Level 3 filter dropdown
const STATUS_OPTIONS = [
  { value: "PENDING",  label: "Pending By Manager"  },
  { value: "APPROVED", label: "Approved By Manager" },
];

const H = "h-[44px]";

// ─── Smart response parser ───────────────────────────────────────────────────
// Handles all common backend shapes:
//   { success, data: [...] }
//   { data: [...] }
//   { data: { content: [...] } }   ← Spring Boot Page
//   { rows: [...] }
//   { result: [...] }
//   [...] directly
function parseResponse(raw) {
  if (!raw) return [];
  // Direct array
  if (Array.isArray(raw)) return raw;
  // { data: [...] } or { data: { content: [...] } }
  if (raw.data) {
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data?.content)) return raw.data.content;
    if (Array.isArray(raw.data?.rows))    return raw.data.rows;
  }
  // { rows: [...] }
  if (Array.isArray(raw.rows))   return raw.rows;
  // { result: [...] }
  if (Array.isArray(raw.result)) return raw.result;
  // { content: [...] }  ← Spring Page directly
  if (Array.isArray(raw.content)) return raw.content;
  // Fallback — wrap object in array if it looks like a single record
  if (typeof raw === "object") return [];
  return [];
}

export default function STPApprove() {
  const [filterOpen, setFilterOpen] = useState(true);

  // ── Level 1: Geography summary ────────────────────────────────────────────
  const [stateData,     setStateData]     = useState([]);
  const [stateLoading,  setStateLoading]  = useState(false);
  const [statePage,     setStatePage]     = useState(1);
  const [statePageSize, setStatePageSize] = useState(20);

  // ── Level 2: Employee summary ─────────────────────────────────────────────
  const [selectedState, setSelectedState] = useState(null);
  const [empData,       setEmpData]       = useState([]);
  const [empLoading,    setEmpLoading]    = useState(false);
  const [empPage,       setEmpPage]       = useState(1);
  const [empPageSize,   setEmpPageSize]   = useState(20);

  // ── Level 3: STP details ──────────────────────────────────────────────────
  const [selectedEmp,     setSelectedEmp]     = useState(null);
  const [requestStatus,   setRequestStatus]   = useState("");  // "PENDING" | "APPROVED"
  const [stpData,         setStpData]         = useState([]);
  const [stpLoading,      setStpLoading]      = useState(false);
  const [stpPage,         setStpPage]         = useState(1);
  const [stpPageSize,     setStpPageSize]     = useState(20);
  const [checkedIds,      setCheckedIds]      = useState([]);
  const [stpVisible,      setStpVisible]      = useState(false);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");

  // ── On mount: load geography summary ─────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    fetchGeographySummary(controller.signal);
    return () => controller.abort(); // cleanup on unmount / StrictMode re-run
  }, []);

  // When employee + status both selected → auto-fetch STP details
  useEffect(() => {
    if (selectedEmp && requestStatus) {
      fetchSTPDetails(selectedEmp, requestStatus);
    } else {
      setStpData([]); setStpVisible(false); setCheckedIds([]);
    }
  }, [selectedEmp, requestStatus]);

  // ── Level 1: GET /api/approvals/stp/geography-summary ────────────────────
  const fetchGeographySummary = async (signal) => {
    setStateLoading(true); setError("");
    try {
      const res = await api.get("/api/approvals/stp/geography-summary", { signal });
      const parsed = parseResponse(res.data);
      setStateData(parsed);
    } catch (err) {
      // Ignore abort errors (React StrictMode double-invoke in dev)
      if (err?.code === "ERR_CANCELED" || err?.name === "AbortError" || err?.name === "CanceledError") return;
      setError(err.response?.data?.message || "Failed to load STP summary.");
    } finally { setStateLoading(false); }
  };

  // ── Level 2: GET /api/approvals/stp/employee-summary?districtId=5 ────────
  const handleStateClick = async (row) => {
    setSelectedState(row);
    setSelectedEmp(null);
    setRequestStatus("");
    setStpData([]); setStpVisible(false); setCheckedIds([]);
    setEmpPage(1); setEmpLoading(true); setError("");
    try {
      const districtId = row.districtId || row.district_id || row.id;
      const res  = await api.get(`/api/approvals/stp/employee-summary?districtId=${districtId}`);
      console.log("[STP] employee-summary raw:", res.data);
      setEmpData(parseResponse(res.data));
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "AbortError" || err?.name === "CanceledError") return;
      setError(err.response?.data?.message || "Failed to load employees.");
    } finally { setEmpLoading(false); }
  };

  // ── Level 3: Click employee → show status dropdown ────────────────────────
  const handleEmpClick = (emp) => {
    setSelectedEmp(emp);
    setRequestStatus("");
    setStpData([]); setStpVisible(false); setCheckedIds([]);
    setStpPage(1); setError("");
  };

  // ── Level 3: GET /api/approvals/stp/details?employeeId=12&requestStatus=PENDING ──
  const fetchSTPDetails = async (emp, status) => {
    setStpLoading(true); setError("");
    setCheckedIds([]); setStpPage(1);
    try {
      const empId = emp.employeeId || emp.id;
      const res  = await api.get(
        `/api/approvals/stp/details?employeeId=${empId}&requestStatus=${status}`
      );
      console.log("[STP] details raw:", res.data);
      setStpData(parseResponse(res.data));
      setStpVisible(true);
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "AbortError" || err?.name === "CanceledError") return;
      setError(err.response?.data?.message || "Failed to load STP details.");
    } finally { setStpLoading(false); }
  };

  // ── Approve STP: POST /api/approvals/stp/approve  body: [1,2,3] ──────────
  const handleApproveSTP = async () => {
    if (!checkedIds.length) return setError("Please select at least one record.");
    setIsSubmitting(true); setError("");
    try {
      const res = await api.post("/api/approvals/stp/approve", checkedIds);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        setSuccessMsg(`${checkedIds.length} STP record(s) approved successfully!`);
        setTimeout(() => setSuccessMsg(""), 3500);
        setCheckedIds([]);
        await fetchSTPDetails(selectedEmp, requestStatus);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Approve failed.");
    } finally { setIsSubmitting(false); }
  };

  // ── Delete STP: DELETE /api/approvals/stp/delete  body: [1,2,3] ──────────
  const handleDeleteSTP = async () => {
    if (!checkedIds.length) return setError("Please select at least one record.");
    setIsSubmitting(true); setError("");
    try {
      const res = await api.delete("/api/approvals/stp/delete", { data: checkedIds });
      if (res.data?.success || res.status === 200 || res.status === 204) {
        setSuccessMsg(`${checkedIds.length} STP record(s) deleted successfully!`);
        setTimeout(() => setSuccessMsg(""), 3500);
        setCheckedIds([]);
        await fetchSTPDetails(selectedEmp, requestStatus);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed.");
    } finally { setIsSubmitting(false); }
  };

  // ── Checkbox ──────────────────────────────────────────────────────────────
  const toggleCheck = id  => setCheckedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const toggleAll   = ids => setCheckedIds(p => p.length === ids.length ? [] : ids);

  // ── Pagination helpers ────────────────────────────────────────────────────
  const paged = (data, page, size) => data.slice((page - 1) * size, page * size);

  const stateRows = paged(stateData, statePage, statePageSize);
  const empRows   = paged(empData,   empPage,   empPageSize);
  const stpRows   = paged(stpData,   stpPage,   stpPageSize);
  const allStpIds = stpRows.map(r => r.id);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-400 pb-12">

      {/* ══ PAGE HEADER ════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-sky-400 rounded-t-xl" />
        <div className="px-6 sm:px-8 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <SlidersHorizontal size={18} className="text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-gray-800">Employee STP Approval</h2>
          </div>
          <button onClick={() => setFilterOpen(p => !p)}
            className="flex items-center gap-2 group">
            <span className="text-sm font-semibold text-gray-500 group-hover:text-gray-700 transition-colors">
              Filter
            </span>
            <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-300
              ${filterOpen ? "bg-blue-500 justify-end" : "bg-gray-300 justify-start"}`}>
              <div className="w-5 h-5 bg-white rounded-full shadow-md" />
            </div>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-sm">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg border border-emerald-100 text-sm">
          <CheckCircle2 size={15} className="flex-shrink-0" /> {successMsg}
        </div>
      )}

      {/* ══ LEVEL 1: GEOGRAPHY SUMMARY ═════════════════════════════ */}
      {filterOpen && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-blue-600 text-white text-xs uppercase tracking-wider">
                <tr>
                  <Th>S.No. ↑</Th>
                  <Th>State ↑</Th>
                  <Th>Headquarter ↑</Th>
                  <Th center>Approval Request Emp Count ↑</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stateLoading ? (
                  <tr><td colSpan={4} className="py-14 text-center">
                    <Loader2 className="animate-spin inline-block text-blue-500" size={28} />
                  </td></tr>
                ) : stateRows.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-gray-400 text-sm">
                    No data found.
                  </td></tr>
                ) : stateRows.map((row, i) => (
                  <tr key={i}
                    className={`transition-colors ${i % 2 !== 0 ? "bg-gray-50/40" : "bg-white"}
                      ${selectedState?.districtId === row.districtId ? "bg-blue-50/30" : ""}`}>
                    <Td>{(statePage - 1) * statePageSize + i + 1}</Td>
                    <Td>
                      {/* ✅ State name clickable */}
                      <button
                        onClick={() => handleStateClick(row)}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {row.stateName || row.state_name || "—"}
                      </button>
                    </Td>
                    <Td>{row.headquarterName || row.hqName || row.district_name || "—"}</Td>
                    <Td center>
                      <span className="font-semibold text-gray-800">
                        {row.approvalRequestEmpCount ?? row.empCount ?? row.count ?? "—"}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationFooter
            data={stateData} page={statePage} pageSize={statePageSize}
            setPage={setStatePage} setPageSize={setStatePageSize}
          />
        </div>
      )}

      {/* ══ LEVEL 2: EMPLOYEE SUMMARY ══════════════════════════════ */}
      {selectedState && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
          animate-in slide-in-from-bottom-2 duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-blue-600 text-white text-xs uppercase tracking-wider">
                <tr>
                  <Th>S.No. ↑</Th>
                  <Th>State ↑</Th>
                  <Th>Headquarter ↑</Th>
                  <Th>Name ↑</Th>
                  <Th>Designation ↑</Th>
                  <Th center>Total STP approval Request ↑</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {empLoading ? (
                  <tr><td colSpan={6} className="py-14 text-center">
                    <Loader2 className="animate-spin inline-block text-blue-500" size={28} />
                  </td></tr>
                ) : empRows.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">
                    No employees found.
                  </td></tr>
                ) : empRows.map((row, i) => {
                  const empId = row.employeeId || row.id;
                  const selId = selectedEmp?.employeeId || selectedEmp?.id;
                  return (
                    <tr key={i}
                      className={`transition-colors ${i % 2 !== 0 ? "bg-gray-50/40" : "bg-white"}
                        ${selId === empId ? "bg-blue-50/30" : ""}`}>
                      <Td>{(empPage - 1) * empPageSize + i + 1}</Td>
                      <Td>{row.stateName      || row.state_name      || "—"}</Td>
                      <Td>{row.headquarterName || row.hqName          || "—"}</Td>
                      <Td>
                        {/* ✅ Employee name clickable */}
                        <button
                          onClick={() => handleEmpClick(row)}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {row.name || row.employeeName || "—"}
                        </button>
                      </Td>
                      <Td>{row.designation    || row.designationName || "—"}</Td>
                      <Td center>
                        <span className="font-semibold text-gray-800">
                          {row.totalSTPRequests ?? row.total_stp_requests ?? "—"}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationFooter
            data={empData} page={empPage} pageSize={empPageSize}
            setPage={setEmpPage} setPageSize={setEmpPageSize}
          />
        </div>
      )}

      {/* ══ LEVEL 3: STATUS FILTER + STP DETAILS ══════════════════ */}
      {selectedEmp && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100
          animate-in slide-in-from-bottom-2 duration-300">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-sky-400 rounded-t-xl" />

          {/* ── Single status dropdown ── */}
          <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <InlineSelect
                label="SELECT STATUS *"
                value={requestStatus}
                onChange={setRequestStatus}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          {/* ── STP detail table ── */}
          {(stpVisible || stpLoading) && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left" style={{ minWidth: 860 }}>
                <thead className="bg-blue-600 text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">
                      <IndeterminateCheckbox
                        checked={allStpIds.length > 0 && allStpIds.every(id => checkedIds.includes(id))}
                        indeterminate={allStpIds.some(id => checkedIds.includes(id)) && !allStpIds.every(id => checkedIds.includes(id))}
                        onChange={() => toggleAll(allStpIds)}
                        light
                      />
                    </th>
                    <Th>S.No. ↑</Th>
                    <Th>From Area ↑</Th>
                    <Th>To Area ↑</Th>
                    <Th>Activity ↑</Th>
                    <Th>Type ↑</Th>
                    <Th>Distance ↑</Th>
                    <Th>Freq Visit ↑</Th>
                    <Th>Approved By Mgr ↑</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stpLoading ? (
                    <tr><td colSpan={9} className="py-14 text-center">
                      <Loader2 className="animate-spin inline-block text-blue-500" size={28} />
                    </td></tr>
                  ) : stpRows.length === 0 ? (
                    <tr><td colSpan={9} className="py-10 text-center text-gray-400 text-sm">
                      No STP records found.
                    </td></tr>
                  ) : stpRows.map((row, i) => {
                    const checked = checkedIds.includes(row.id);
                    const approvedByMgr = row.approvedByMgr ?? row.approved_by_mgr;
                    return (
                      <tr key={row.id || i}
                        onClick={() => toggleCheck(row.id)}
                        className={`cursor-pointer transition-colors
                          ${checked
                            ? "bg-blue-50/70"
                            : i % 2 !== 0 ? "bg-gray-50/40 hover:bg-blue-50/30" : "bg-white hover:bg-blue-50/20"
                          }`}>
                        <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={checked} onChange={() => toggleCheck(row.id)}
                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                        </td>
                        <Td>{(stpPage - 1) * stpPageSize + i + 1}</Td>
                        <Td>{row.fromArea  || row.from_area  || "—"}</Td>
                        <Td>{row.toArea    || row.to_area    || "—"}</Td>
                        <Td>{row.activity                    || "—"}</Td>
                        <Td>{row.type                        || "—"}</Td>
                        <Td>{row.distance ?? "—"}</Td>
                        <Td>{(row.freqVisit || row.freq_visit) ?? "—"}</Td>
                        <Td>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                            ${approvedByMgr === true || approvedByMgr === "Yes"
                              ? "bg-blue-50 text-blue-600 border border-blue-200"
                              : "bg-gray-100 text-gray-500"}`}>
                            {approvedByMgr === true || approvedByMgr === "Yes" ? "Yes" : "No"}
                          </span>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Bottom: Buttons + Pagination ── */}
          {stpVisible && (
            <div className="px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center
              justify-between gap-4 border-t border-gray-100">
              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleApproveSTP}
                  disabled={!checkedIds.length || isSubmitting}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold
                    transition-all active:scale-95
                    ${checkedIds.length
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Approve STP
                </button>
                <button
                  onClick={handleDeleteSTP}
                  disabled={!checkedIds.length || isSubmitting}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold
                    transition-all active:scale-95
                    ${checkedIds.length
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete STP
                </button>
                {checkedIds.length > 0 && (
                  <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1
                    rounded-full border border-blue-100">
                    {checkedIds.length} selected
                  </span>
                )}
              </div>
              {/* Pagination */}
              <PaginationFooter
                data={stpData} page={stpPage} pageSize={stpPageSize}
                setPage={setStpPage} setPageSize={setStpPageSize}
                inline
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// InlineSelect — portal-positioned dropdown
// ═══════════════════════════════════════════════════════════════════
function InlineSelect({ label, value, onChange, options = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos,    setPos]    = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const open = () => {
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

  const selected  = options.find(o => o.value === value);
  const hasValue  = Boolean(value);
  const labelPos  = hasValue || isOpen ? "-top-2.5 text-[11px]" : "top-[13px] text-sm";
  const labelClr  = hasValue ? "text-blue-500" : isOpen ? "text-gray-500" : "text-gray-400";
  const borderCls = hasValue
    ? isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400"
    : isOpen ? "border-gray-400 ring-2 ring-gray-100" : "border-gray-300";

  return (
    <div className="relative w-full select-none">
      <div ref={ref} onClick={open}
        className={`w-full ${H} rounded-lg border-2 bg-white pl-4 pr-9 flex items-center
          cursor-pointer transition-all ${borderCls}`}>
        <span className={`truncate text-sm font-medium flex-1 ${hasValue ? "text-gray-900" : "text-transparent"}`}>
          {selected?.label || " "}
        </span>
        <ChevronDown size={14} className={`absolute right-3 pointer-events-none transition-transform duration-200
          ${hasValue ? "text-blue-400" : "text-gray-400"} ${isOpen ? "rotate-180" : ""}`} />
      </div>
      <label className={`absolute left-3 px-1 bg-white pointer-events-none z-10
        transition-all duration-200 font-semibold ${labelPos} ${labelClr}`}>
        {label}
      </label>

      {isOpen && (
        <div style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden
            animate-in fade-in zoom-in-95 duration-100">
          <ul className="py-1.5 max-h-60 overflow-y-auto">
            {options.map((opt, i) => (
              <li key={i}
                onMouseDown={e => { e.preventDefault(); onChange(opt.value); setIsOpen(false); }}
                className={`px-4 py-3 text-sm cursor-pointer font-medium transition-colors
                  ${value === opt.value
                    ? "bg-blue-50 text-blue-600 font-semibold border-l-[3px] border-blue-500"
                    : "text-gray-700 hover:bg-blue-500 hover:text-white border-l-[3px] border-transparent"
                  }`}>
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Table helpers ────────────────────────────────────────────────────────────
function Th({ children, center }) {
  return (
    <th className={`py-3.5 px-4 font-semibold whitespace-nowrap text-xs uppercase tracking-wider
      ${center ? "text-center" : "text-left"}`}>
      {children}
    </th>
  );
}
function Td({ children, center }) {
  return (
    <td className={`py-3.5 px-4 text-gray-700 whitespace-nowrap ${center ? "text-center" : ""}`}>
      {children}
    </td>
  );
}

// ─── IndeterminateCheckbox ────────────────────────────────────────────────────
function IndeterminateCheckbox({ checked, indeterminate, onChange, light }) {
  return (
    <div onClick={e => { e.stopPropagation(); onChange(); }}
      className={`w-[17px] h-[17px] rounded border-2 flex items-center justify-center
        cursor-pointer transition-all mx-auto
        ${checked || indeterminate
          ? light ? "border-white bg-white" : "border-blue-500 bg-blue-500"
          : light ? "border-white/60 bg-transparent hover:border-white" : "border-gray-300 bg-white hover:border-blue-400"
        }`}>
      {indeterminate && !checked
        ? <div className={`w-2 h-0.5 rounded-full ${light ? "bg-blue-500" : "bg-white"}`} />
        : checked
          ? <svg viewBox="0 0 12 10" className={`w-2.5 h-2 ${light ? "text-blue-500" : "text-white"}`} fill="none">
              <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          : null
      }
    </div>
  );
}

// ─── PaginationFooter ─────────────────────────────────────────────────────────
function PaginationFooter({ data, page, pageSize, setPage, setPageSize, inline }) {
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const go   = p => setPage(Math.min(Math.max(1, p), totalPages));
  const from = data.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, data.length);

  return (
    <div className={`flex flex-wrap items-center justify-end gap-3 px-4 py-3
      ${!inline ? "border-t border-gray-100" : ""} text-xs text-gray-500`}>
      <div className="flex items-center gap-1.5">
        <span>Items per page:</span>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-700
            focus:outline-none focus:border-blue-400">
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <span className="whitespace-nowrap">{from} – {to} of {data.length}</span>
      <div className="flex items-center gap-1">
        <NavBtn icon={<ChevronsLeft  size={13} />} onClick={() => go(1)}        disabled={page === 1} />
        <NavBtn icon={<ChevronLeft   size={13} />} onClick={() => go(page - 1)} disabled={page === 1} />
        <NavBtn icon={<ChevronRight  size={13} />} onClick={() => go(page + 1)} disabled={page === totalPages} />
        <NavBtn icon={<ChevronsRight size={13} />} onClick={() => go(totalPages)} disabled={page === totalPages} />
      </div>
    </div>
  );
}

function NavBtn({ icon, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-6 h-6 flex items-center justify-center rounded border transition-all
        ${disabled
          ? "border-gray-200 text-gray-300 cursor-not-allowed"
          : "border-gray-300 text-gray-600 hover:bg-gray-100 active:scale-95"
        }`}>
      {icon}
    </button>
  );
}