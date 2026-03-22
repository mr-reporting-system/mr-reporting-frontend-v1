import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, AlertCircle, ChevronDown,
  Link, Link2Off, Eye, PlusCircle, X, Check,
  Search, Stethoscope, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight
} from "lucide-react";
import api from "../../../services/api";

// ─── Table view modes ─────────────────────────────────────────────────────────
const VIEW = { NONE: "none", LINK: "link", MAPPED: "mapped" };

// ─── Items per page options ───────────────────────────────────────────────────
const PAGE_SIZES = [5, 10, 25, 50];

// ─── Column definitions ───────────────────────────────────────────────────────
const COLS = [
  { key: "sNo",               label: "S.No." },
  { key: "doctorName",        label: "Doctor Name" },
  { key: "doctorCode",        label: "Doctor Code" },
  { key: "specialization",    label: "Specialization" },
  { key: "category",          label: "Category" },
  { key: "mobile",            label: "Mobile" },
  { key: "crmStatus",         label: "CRM Status" },
  { key: "sponsorshipStatus", label: "Sponsorship Status" },
];

const getRowVal = (row, key, idx) => {
  switch (key) {
    case "sNo":               return idx + 1;
    case "doctorName":        return row.doctorName        || row.doctor_name  || row.name  || "—";
    case "doctorCode":        return row.doctorCode        || row.doctor_code  || row.code  || 0;
    case "specialization":     return row.specialization    || row.speciality   || "—";
    case "category":          return row.category                                           || "—";
    case "mobile":            return row.mobile            || row.phone                     || 0;
    case "crmStatus":         return row.crmStatus         || row.crm_status               || "Not Linked";
    case "sponsorshipStatus": return row.sponsorshipStatus || row.sponsorship_status        || "Not Submitted";
    default:                  return "—";
  }
};

const H = "h-[46px]"; // shared input height

// ─────────────────────────────────────────────────────────────────────────────
export default function CRMDoctorMapping() {
  // ── Dropdown data ─────────────────────────────────────────────────────────
  const [states,       setStates]       = useState([]);
  const [districts,    setDistricts]    = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees,    setEmployees]    = useState([]);

  // ── Filter state ──────────────────────────────────────────────────────────
  // State — multi select
  const [selectedStateIds, setSelectedStateIds] = useState([]);
  // District — multi select
  const [selectedDistIds,  setSelectedDistIds]  = useState([]);
  // Designation — multi select
  const [selectedDesigIds, setSelectedDesigIds] = useState([]);
  // Employee — single select
  const [selectedEmpId,    setSelectedEmpId]    = useState("");

  // ── Cards ─────────────────────────────────────────────────────────────────
  const [linkedCount,  setLinkedCount]  = useState(null);  // null = not loaded
  const [cardsVisible, setCardsVisible] = useState(false);

  // ── Table ─────────────────────────────────────────────────────────────────
  const [activeView,  setActiveView]  = useState(VIEW.NONE);
  const [tableData,   setTableData]   = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkedIds,  setCheckedIds]  = useState([]);
  const [pageSize,    setPageSize]    = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [isLoading,    setIsLoading]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState("");
  const [popup,        setPopup]        = useState({ open: false, message: "", success: true });

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchInitialData(); }, []);

  // State → Districts: GET /api/masters/districts/by-states?stateIds=1,2
  useEffect(() => {
    if (selectedStateIds.length > 0) {
      fetchDistricts(selectedStateIds);
      setSelectedDistIds([]);
    } else {
      setDistricts([]);
      setSelectedDistIds([]);
    }
  }, [selectedStateIds]);

  // Districts + Designation → Employees (BOTH required)
  // GET /api/masters/employees/crm-filter?districtIds=1,2&designationIds=3
  useEffect(() => {
    if (selectedDistIds.length > 0 && selectedDesigIds.length > 0) {
      fetchEmployees(selectedDistIds, selectedDesigIds);
      setSelectedEmpId("");
    } else {
      setEmployees([]);
      setSelectedEmpId("");
    }
  }, [selectedDistIds, selectedDesigIds]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [sRes, dRes] = await Promise.all([
        api.get("/api/masters/states"),
        api.get("/api/masters/designations"),
      ]);
      if (sRes.data?.success) setStates(sRes.data.data || []);
      if (dRes.data?.success) setDesignations(dRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // GET /api/masters/districts/by-states?stateIds=1,2
  const fetchDistricts = async (stateIds) => {
    try {
      const res = await api.get(`/api/masters/districts/by-states?stateIds=${stateIds.join(",")}`);
      if (res.data?.success) setDistricts(res.data.data || []);
      else setDistricts([]);
    } catch {
      setDistricts([]);
    }
  };

  // GET /api/masters/employees/crm-filter?districtIds=1,2&designationIds=3
  const fetchEmployees = async (distIds, desigIds) => {
    try {
      const res = await api.get(
        `/api/masters/employees/crm-filter?districtIds=${distIds.join(",")}&designationIds=${desigIds.join(",")}`
      );
      if (res.data?.success) setEmployees(res.data.data || []);
      else setEmployees([]);
    } catch {
      setEmployees([]);
    }
  };

  // ── View button ───────────────────────────────────────────────────────────
  const handleView = async () => {
    setError("");
    if (!selectedStateIds.length) return setError("Please select at least one State.");
    if (!selectedDistIds.length)  return setError("Please select at least one District.");
    if (!selectedEmpId)           return setError("Please select an Employee.");

    setIsLoading(true);
    setCardsVisible(false);
    setActiveView(VIEW.NONE);
    setTableData([]);
    setCheckedIds([]);

    try {
      const res = await api.get(`/api/masters/crm/doctors/count?employeeId=${selectedEmpId}`);
      const count = res.data?.data?.count ?? res.data?.count ?? res.data?.data ?? 0;
      setLinkedCount(Number(count));
      setCardsVisible(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load CRM summary.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Link Doctors table (unlinked) ─────────────────────────────────────────
  const handleLoadLinkTable = async () => {
    setIsLoading(true);
    setActiveView(VIEW.NONE);
    setTableData([]);
    setCheckedIds([]);
    setSearchQuery("");
    setCurrentPage(1);
    try {
      const res = await api.get(
        `/api/masters/crm/doctors?employeeId=${selectedEmpId}&crmStatus=Not+Linked`
      );
      const data = res.data?.data || res.data || [];
      setTableData(Array.isArray(data) ? data : []);
      setActiveView(VIEW.LINK);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load doctors.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Mapped Doctors table (linked) ─────────────────────────────────────────
  const handleLoadMappedTable = async () => {
    setIsLoading(true);
    setActiveView(VIEW.NONE);
    setTableData([]);
    setCheckedIds([]);
    setSearchQuery("");
    setCurrentPage(1);
    try {
      const res = await api.get(
        `/api/masters/crm/doctors?employeeId=${selectedEmpId}&crmStatus=Linked`
      );
      const data = res.data?.data || res.data || [];
      setTableData(Array.isArray(data) ? data : []);
      setActiveView(VIEW.MAPPED);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load mapped doctors.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Link With CRM ─────────────────────────────────────────────────────────
  const handleLinkWithCRM = async () => {
    if (!checkedIds.length) return setError("Please select at least one doctor.");
    setIsSubmitting(true);
    setError("");
    try {
      const res = await api.put(
        `/api/masters/crm/doctors/link?employeeId=${selectedEmpId}`,
        checkedIds
      );
      if (res.data?.success || res.status === 200 || res.status === 201) {
        const newCount = (linkedCount || 0) + checkedIds.length;
        setLinkedCount(newCount);
        setPopup({
          open: true,
          message: `${checkedIds.length} doctor(s) linked with CRM successfully!`,
          success: true
        });
        setCheckedIds([]);
        await handleLoadLinkTable();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to link doctors.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Unlink With CRM ───────────────────────────────────────────────────────
  const handleUnlinkWithCRM = async () => {
    if (!checkedIds.length) return setError("Please select at least one doctor.");
    setIsSubmitting(true);
    setError("");
    try {
      const res = await api.put(
        `/api/masters/crm/doctors/unlink?employeeId=${selectedEmpId}`,
        checkedIds
      );
      if (res.data?.success || res.status === 200 || res.status === 201) {
        const newCount = Math.max(0, (linkedCount || 0) - checkedIds.length);
        setLinkedCount(newCount);
        setPopup({
          open: true,
          message: `${checkedIds.length} doctor(s) unlinked from CRM successfully!`,
          success: true
        });
        setCheckedIds([]);
        await handleLoadMappedTable();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unlink doctors.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Checkbox ──────────────────────────────────────────────────────────────
  const toggleCheck = id => setCheckedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const toggleAll   = ids => setCheckedIds(p => p.length === ids.length ? [] : ids);

  // ── Filtered + paginated ──────────────────────────────────────────────────
  const filteredData = tableData.filter(row =>
    COLS.some((c, i) => String(getRowVal(row, c.key, i)).toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pagedData  = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const goToPage   = p => setCurrentPage(Math.min(Math.max(1, p), totalPages));
  const allPageIds = pagedData.map(r => r.id);

  // ── Option arrays ─────────────────────────────────────────────────────────
  const stateOpts = states.map(s => ({ id: String(s.id), label: s.state_name || s.stateName }));
  const distOpts  = districts.map(d => ({ id: String(d.id), label: d.district_name || d.districtName }));
  const desigOpts = designations.map(d => ({ id: String(d.id), label: d.name || d.designation_name }));
  const empOpts   = employees.map(e => ({ value: String(e.id), label: e.name || e.employee_name }));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-400 pb-12">

      {/* FILTER CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-sky-400 rounded-t-xl" />

        <div className="px-6 sm:px-8 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Stethoscope size={18} className="text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-gray-800">CRM Doctor Mapping</h2>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6 pb-8 space-y-5">

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-sm">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Row 1 — State(multi) | District(multi) | Designation(multi) | Employee(single) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MultiDropdown
              label="SELECT STATE *"
              options={stateOpts}
              selectedIds={selectedStateIds}
              onChange={ids => { setSelectedStateIds(ids); }}
            />
            <MultiDropdown
              label="SELECT DISTRICT *"
              options={distOpts}
              selectedIds={selectedDistIds}
              onChange={setSelectedDistIds}
              disabled={!selectedStateIds.length}
            />
            <MultiDropdown
              label="SELECT DESIGNATION"
              options={desigOpts}
              selectedIds={selectedDesigIds}
              onChange={setSelectedDesigIds}
            />
            <Dropdown
              label="SELECT EMPLOYEE *"
              value={selectedEmpId}
              onSelect={setSelectedEmpId}
              options={empOpts}
              disabled={!employees.length}
            />
          </div>

          {/* Row 2 — View button */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
            <button
              onClick={handleView}
              disabled={isLoading}
              className={`${H} flex items-center justify-center gap-2 px-6 rounded-lg
                bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold
                transition-all active:scale-95 shadow-sm shadow-blue-200
                disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isLoading && !cardsVisible
                ? <Loader2 size={15} className="animate-spin" />
                : <Eye size={16} />}
              View
            </button>
          </div>
        </div>
      </div>

      {/* TWO CARDS */}
      {cardsVisible && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in slide-in-from-bottom-2 duration-300">

          {/* Left — Link Doctors */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="flex-1 flex items-center justify-center py-14 px-6">
              <p className="text-gray-400 text-base font-medium">Link Doctors With CRM</p>
            </div>
            <button
              onClick={handleLoadLinkTable}
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold
                flex items-center justify-center gap-2 transition-all active:scale-[0.99]
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && activeView === VIEW.LINK
                ? <Loader2 size={15} className="animate-spin" />
                : <PlusCircle size={16} />}
              + Link Doctors
            </button>
          </div>

          {/* Right — Linked count + View Mapped */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="flex-1 flex items-center justify-center py-14 px-6">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black text-blue-600">{linkedCount ?? 0}</span>
                <span className="text-gray-500 text-base font-medium">CRM Linked Doctors</span>
              </div>
            </div>
            <button
              onClick={handleLoadMappedTable}
              disabled={isLoading || linkedCount === 0}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold
                flex items-center justify-center gap-2 transition-all active:scale-[0.99]
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && activeView === VIEW.MAPPED
                ? <Loader2 size={15} className="animate-spin" />
                : <Eye size={16} />}
              View Mapped Doctors
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      {(activeView === VIEW.LINK || activeView === VIEW.MAPPED) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
          animate-in slide-in-from-bottom-2 duration-300">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-sky-400 rounded-t-xl" />

          <div className="px-6 sm:px-8 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">CRM Provider Details</h3>
            {checkedIds.length > 0 && (
              <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">
                {checkedIds.length} selected
              </span>
            )}
          </div>

          <div className="px-6 sm:px-8 py-5 space-y-4">

            {/* Search */}
            <div className="relative w-56">
              <input
                type="text"
                placeholder="SEARCH CLIENT"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full border-2 border-gray-300 focus:border-blue-500 rounded-lg
                  pl-4 pr-9 py-2 text-sm text-gray-800 placeholder-gray-400 uppercase tracking-wide
                  focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Search size={15} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm text-left" style={{ minWidth: 900 }}>
                <thead className="bg-blue-600 text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">
                      <IndeterminateCheckbox
                        checked={allPageIds.length > 0 && allPageIds.every(id => checkedIds.includes(id))}
                        indeterminate={allPageIds.some(id => checkedIds.includes(id)) && !allPageIds.every(id => checkedIds.includes(id))}
                        onChange={() => toggleAll(allPageIds)}
                        light
                      />
                    </th>
                    {COLS.map(c => (
                      <th key={c.key} className="py-3.5 px-4 font-semibold whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={COLS.length + 1} className="py-14 text-center">
                        <Loader2 className="animate-spin inline-block text-blue-500" size={28} />
                      </td>
                    </tr>
                  ) : pagedData.length === 0 ? (
                    <tr>
                      <td colSpan={COLS.length + 1} className="py-14 text-center text-gray-400 text-sm">
                        No records found.
                      </td>
                    </tr>
                  ) : pagedData.map((row, i) => {
                    const globalIdx = (currentPage - 1) * pageSize + i;
                    const checked   = checkedIds.includes(row.id);
                    return (
                      <tr
                        key={row.id}
                        onClick={() => toggleCheck(row.id)}
                        className={`cursor-pointer transition-colors
                          ${checked
                            ? "bg-blue-50/70"
                            : i % 2 !== 0 ? "bg-gray-50/40 hover:bg-blue-50/30" : "bg-white hover:bg-blue-50/20"
                          }`}
                      >
                        <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheck(row.id)}
                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                          />
                        </td>
                        {COLS.map(c => {
                          const val = getRowVal(row, c.key, globalIdx);
                          return (
                            <td key={c.key} className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                              {c.key === "crmStatus" ? (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                  ${val === "Linked"
                                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                                    : "bg-gray-100 text-gray-500"
                                  }`}>{val}</span>
                              ) : c.key === "sponsorshipStatus" ? (
                                <span className={`text-xs font-semibold
                                  ${val === "Approved"     ? "text-emerald-600"
                                  : val === "Not Approved" ? "text-orange-500"
                                  : "text-gray-400"}`}>{val}</span>
                              ) : val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer: action btn + pagination */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">

              {/* Action button */}
              <div>
                {activeView === VIEW.LINK && (
                  <button
                    onClick={handleLinkWithCRM}
                    disabled={!checkedIds.length || isSubmitting}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold
                      transition-all active:scale-95
                      ${checkedIds.length
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                  >
                    {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Link size={15} />}
                    Link With CRM
                  </button>
                )}
                {activeView === VIEW.MAPPED && (
                  <button
                    onClick={handleUnlinkWithCRM}
                    disabled={!checkedIds.length || isSubmitting}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold
                      transition-all active:scale-95
                      ${checkedIds.length
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-200"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                  >
                    {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Link2Off size={15} />}
                    Unlink With CRM
                  </button>
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="whitespace-nowrap">Items per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-700
                      focus:outline-none focus:border-blue-400"
                  >
                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {filteredData.length === 0
                    ? "0 – 0 of 0"
                    : `${(currentPage - 1) * pageSize + 1} – ${Math.min(currentPage * pageSize, filteredData.length)} of ${filteredData.length}`}
                </span>
                <div className="flex items-center gap-1">
                  <NavBtn icon={<ChevronsLeft  size={14} />} onClick={() => goToPage(1)}               disabled={currentPage === 1} />
                  <NavBtn icon={<ChevronLeft   size={14} />} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} />
                  <NavBtn icon={<ChevronRight  size={14} />} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} />
                  <NavBtn icon={<ChevronsRight size={14} />} onClick={() => goToPage(totalPages)}       disabled={currentPage === totalPages} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {popup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm
          animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-xs w-full mx-4 flex flex-col items-center
            animate-in zoom-in-95 duration-150">
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center mb-5
              ${popup.success ? "border-blue-100 bg-blue-50" : "border-red-100 bg-red-50"}`}>
              {popup.success
                ? <Check size={32} className="text-blue-500" strokeWidth={3} />
                : <X    size={32} className="text-red-500"  strokeWidth={3} />
              }
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-6">{popup.message}</h3>
            <button
              onClick={() => setPopup({ open: false, message: "", success: true })}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-lg font-bold
                transition-all active:scale-95">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Dropdown — single select, portal-positioned list
// ═══════════════════════════════════════════════════════════════════
function Dropdown({ label, value, onSelect, options = [], disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos,    setPos]    = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const open = () => {
    if (disabled || !options.length) return;
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
  const hasValue = Boolean(value);

  const borderCls = disabled
    ? "border-gray-200 bg-gray-50"
    : hasValue
      ? isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400"
      : isOpen ? "border-gray-400 ring-2 ring-gray-100" : "border-gray-300";

  const labelColor = disabled ? "text-gray-300" : hasValue ? "text-blue-500" : isOpen ? "text-gray-500" : "text-gray-400";
  const labelPos   = hasValue || isOpen ? "-top-2.5 text-[11px]" : "top-[14px] text-sm";

  return (
    <div className="relative w-full">
      <div
        ref={ref}
        onClick={open}
        className={`w-full ${H} rounded-lg border-2 bg-white pl-4 pr-9 flex items-center transition-all
          ${!disabled && options.length ? "cursor-pointer" : "cursor-not-allowed"} ${borderCls}`}
      >
        <span className={`truncate text-sm font-medium flex-1 ${hasValue ? "text-gray-900" : "text-transparent"}`}>
          {selected?.label || " "}
        </span>
        <ChevronDown size={14} className={`absolute right-3 pointer-events-none transition-transform
          ${hasValue ? "text-blue-400" : disabled ? "text-gray-300" : "text-gray-400"}
          ${isOpen ? "rotate-180" : ""}`} />
      </div>
      <label className={`absolute left-3 px-1 bg-white pointer-events-none z-10
        transition-all duration-200 font-semibold ${labelPos} ${labelColor}`}>{label}</label>

      {isOpen && !disabled && options.length > 0 && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <ul className="py-1.5 max-h-60 overflow-y-auto">
            {options.map((opt, i) => (
              <li
                key={i}
                onMouseDown={e => { e.preventDefault(); onSelect(opt.value); setIsOpen(false); }}
                className={`px-4 py-3 text-sm cursor-pointer font-medium transition-colors
                  ${String(value) === String(opt.value)
                    ? "bg-blue-50 text-blue-600 font-semibold border-l-[3px] border-blue-500"
                    : "text-gray-700 hover:bg-blue-500 hover:text-white border-l-[3px] border-transparent"
                  }`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </Portal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MultiDropdown — multi select, portal-positioned list
// ═══════════════════════════════════════════════════════════════════
function MultiDropdown({ label, options = [], selectedIds, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos,    setPos]    = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const open = () => {
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

  const labelColor = disabled ? "text-gray-300" : hasValue ? "text-blue-500" : isOpen ? "text-gray-500" : "text-gray-400";
  const labelPos   = hasValue || isOpen ? "-top-2.5 text-[11px]" : "top-[14px] text-sm";

  return (
    <div className="relative w-full">
      <div
        ref={ref}
        onClick={open}
        className={`w-full ${H} rounded-lg border-2 bg-white pl-4 pr-9 flex items-center transition-all
          ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${borderCls}`}
      >
        <span className={`block truncate text-sm font-medium flex-1 min-w-0 ${hasValue ? "text-gray-900" : "text-transparent"}`}>
          {displayText || " "}
        </span>
        <ChevronDown size={14} className={`absolute right-3 pointer-events-none transition-transform
          ${hasValue ? "text-blue-400" : disabled ? "text-gray-300" : "text-gray-400"}
          ${isOpen ? "rotate-180" : ""}`} />
      </div>
      <label className={`absolute left-3 px-1 bg-white pointer-events-none z-10
        transition-all duration-200 font-semibold ${labelPos} ${labelColor}`}>{label}</label>

      {isOpen && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); selectAll(); }}
              className="flex-1 py-2 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              Select All
            </button>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); clearAll(); }}
              className="flex-1 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              Clear All
            </button>
          </div>
          <ul className="py-1.5 max-h-52 overflow-y-auto">
            {options.length === 0
              ? <li className="px-4 py-3 text-sm text-gray-400 text-center italic">No options available</li>
              : options.map(opt => {
                  const isSel = selectedIds.includes(opt.id);
                  return (
                    <li
                      key={opt.id}
                      onMouseDown={e => { e.preventDefault(); toggle(opt.id); }}
                      className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-3 transition-colors
                        ${isSel ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    >
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
                })
            }
          </ul>
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
    <div
      ref={ref}
      style={{ position: "fixed", top, left, width, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden
        animate-in fade-in zoom-in-95 duration-100"
    >
      {children}
    </div>
  );
}

// ─── IndeterminateCheckbox ────────────────────────────────────────────────────
function IndeterminateCheckbox({ checked, indeterminate, onChange, light }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onChange(); }}
      className={`w-[17px] h-[17px] rounded border-2 flex items-center justify-center
        cursor-pointer transition-all mx-auto
        ${checked || indeterminate
          ? light ? "border-white bg-white" : "border-blue-500 bg-blue-500"
          : light ? "border-white/60 bg-transparent hover:border-white" : "border-gray-300 bg-white hover:border-blue-400"
        }`}
    >
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

// ─── NavBtn ───────────────────────────────────────────────────────────────────
function NavBtn({ icon, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 flex items-center justify-center rounded border transition-all
        ${disabled
          ? "border-gray-200 text-gray-300 cursor-not-allowed"
          : "border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 active:scale-95"
        }`}
    >
      {icon}
    </button>
  );
}