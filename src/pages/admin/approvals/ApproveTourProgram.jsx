import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, AlertCircle, ChevronDown, SlidersHorizontal,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MapPin, Calendar, User, Briefcase, ToggleRight,
  Check, X, FileSpreadsheet, CheckCircle2, ArrowRightLeft
} from "lucide-react";
import api from "../../../services/api";

// ─── Constants ──────────────────────────────────────────────────────────────
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

/* ─── Global styles from reference ────────────────────────────────────────── */
const STYLES = `
  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; margin-bottom: 24px; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:flex-end; border-radius:0 0 16px 16px; }
  .ucr-grid  { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:24px; }
  .ucr-gender-row{ display:flex; align-items:center; gap:20px; flex-wrap:wrap; margin-bottom: 24px; padding: 12px; background: #f9fafb; border-radius: 12px; border: 1px solid #f3f4f6; }
  
  @media(max-width:1200px){ .ucr-grid { grid-template-columns:repeat(3,1fr); } }
  @media(max-width:1024px){ .ucr-grid { grid-template-columns:repeat(2,1fr); gap:16px; } }
  @media(max-width:600px){ 
    .ucr-grid { grid-template-columns:1fr; gap:12px; }
    .ucr-body { padding:14px; }
    .ucr-submit-btn { width: 100%; justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const FH = 36; // Matching reference file input height

// ─── Logic Helpers ──────────────────────────────────────────────────────────
const boolStr = v => (v === true || v === "true" ? "Yes" : v === false || v === "false" ? "No" : String(v ?? "—"));

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

export default function ApproveTourProgram() {
  const [filterOpen, setFilterOpen] = useState(true);
  const [mode,       setMode]       = useState("geographical");

  const [states,       setStates]       = useState([]);
  const [districts,    setDistricts]    = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees,    setEmployees]    = useState([]);

  const [geoStateIds,   setGeoStateIds]   = useState([]);
  const [geoDistIds,    setGeoDistIds]    = useState([]);
  const [geoMonth,      setGeoMonth]      = useState("");
  const [geoYear,       setGeoYear]       = useState("");

  const [hierDesignation, setHierDesignation] = useState("");
  const [hierStatus,      setHierStatus]      = useState("");
  const [hierEmployeeIds, setHierEmployeeIds] = useState([]);
  const [hierMonth,       setHierMonth]       = useState("");
  const [hierYear,        setHierYear]        = useState("");

  const [tableData,    setTableData]    = useState([]);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [currentPage,  setCurrentPage]  = useState(1);
  const [tableVisible, setTableVisible] = useState(false);

  const [rejectPopup,  setRejectPopup]  = useState(false);
  const [rejectRow,    setRejectRow]    = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [isLoading,    setIsLoading]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    if (geoStateIds.length > 0) {
      fetchDistricts(geoStateIds);
      setGeoDistIds([]);
    } else {
      setDistricts([]);
      setGeoDistIds([]);
    }
  }, [geoStateIds]);

  useEffect(() => {
    if (hierDesignation && hierStatus !== "") {
      fetchEmployees(hierDesignation, hierStatus);
      setHierEmployeeIds([]);
    } else {
      setEmployees([]);
      setHierEmployeeIds([]);
    }
  }, [hierDesignation, hierStatus]);

  useEffect(() => {
    setTableVisible(false); setTableData([]);
    setSearchQuery(""); setCurrentPage(1); setError(""); setSuccessMsg("");
  }, [mode]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [sRes, dRes] = await Promise.all([
        api.get("/api/masters/states"),
        api.get("/api/masters/designations"),
      ]);
      if (sRes.data?.success) setStates(sRes.data.data || []);
      if (dRes.data?.success) setDesignations(dRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchDistricts = async (stateIds) => {
    try {
      const res = await api.get(`/api/masters/districts/by-states?stateIds=${stateIds.join(",")}`);
      if (res.data?.success) setDistricts(res.data.data || []);
      else setDistricts([]);
    } catch { setDistricts([]); }
  };

  const fetchEmployees = async (designationId, isActive) => {
    try {
      const res = await api.get(`/api/approvals/tour-program/employees?designationId=${designationId}&isActive=${isActive}`);
      if (res.data?.success) setEmployees(res.data.data || []);
      else setEmployees([]);
    } catch { setEmployees([]); }
  };

  const handleViewStatus = async () => {
    setError(""); setSuccessMsg("");
    if (mode === "geographical") {
      if (!geoStateIds.length || !geoDistIds.length || !geoMonth || !geoYear) return setError("Please fill all mandatory fields.");
    } else {
      if (!hierDesignation || !hierStatus || !hierEmployeeIds.length || !hierMonth || !hierYear) return setError("Please fill all mandatory fields.");
    }

    setIsLoading(true); setTableVisible(false);
    try {
      let res;
      if (mode === "geographical") {
        const p = new URLSearchParams({ month: geoMonth, year: geoYear });
        geoDistIds.forEach(id => p.append("districtIds", id));
        res = await api.get(`/api/approvals/tour-program/geographical?${p}`);
      } else {
        const p = new URLSearchParams({ designationId: hierDesignation, isActive: hierStatus, month: hierMonth, year: hierYear });
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

  const handleApprove = async (row) => {
    const id = row.id || row.tourProgramId;
    if (!id) return;
    setIsSubmitting(true); setError("");
    try {
      await api.put(`/api/approvals/tour-program/approve/${id}`);
      setSuccessMsg("Tour program approved successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
      handleViewStatus();
    } catch (err) { setError(err.response?.data?.message || "Approve failed."); }
    finally { setIsSubmitting(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    const id = rejectRow?.id || rejectRow?.tourProgramId;
    if (!id) return;
    setIsSubmitting(true); setError("");
    try {
      await api.put(`/api/approvals/tour-program/reject/${id}`, { rejectionMessage: rejectReason.trim() });
      setRejectPopup(false); setRejectReason(""); setRejectRow(null);
      setSuccessMsg("Tour program rejected.");
      setTimeout(() => setSuccessMsg(""), 3500);
      handleViewStatus();
    } catch (err) { setError(err.response?.data?.message || "Reject failed."); setRejectPopup(false); }
    finally { setIsSubmitting(false); }
  };

  const handleExport = () => {
    if (!filteredData.length) return;
    const header = TABLE_COLS.map(c => c.label).join(",");
    const rows   = filteredData.map(r => TABLE_COLS.map(c => `"${String(getVal(r, c.key)).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([`${header}\n${rows}`], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "tour_program.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredData = tableData.filter(row =>
    TABLE_COLS.some(c => String(getVal(row, c.key)).toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData  = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const goToPage   = p => setCurrentPage(Math.min(Math.max(1, p), totalPages));

  // Options
  const stateOpts = states.map(s => ({ id: String(s.id), label: s.state_name || s.stateName }));
  const distOpts  = districts.map(d => ({ id: String(d.id), label: d.district_name || d.districtName }));
  const desigOpts = designations.map(d => ({ id: String(d.id), label: d.name || d.designation_name }));
  const empOpts   = employees.map(e => ({ id: String(e.id), label: e.name || e.employee_name }));

  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {successMsg && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "10px 16px", color: "#16a34a", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <SlidersHorizontal size={17} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Approve Tour Program</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>Review and manage employee tour program approvals</p>
          </div>
          <div onClick={() => setFilterOpen(!filterOpen)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Filter</span>
            <div style={{ width: 34, height: 18, borderRadius: 20, background: filterOpen ? "#2563eb" : "#d1d5db", position: "relative", transition: "all 0.2s" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: filterOpen ? 19 : 3, transition: "all 0.2s" }} />
            </div>
          </div>
        </div>

        {filterOpen && (
          <div className="ucr-body">
            <div className="ucr-gender-row">
              <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0, marginRight: 8 }}>Selection Mode:</p>
              {[
                { value: "geographical", label: "Geographical" },
                { value: "hierarchical", label: "Hierarchical" },
              ].map(opt => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: mode === opt.value ? "2px solid #2563eb" : "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {mode === opt.value && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb" }} />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: mode === opt.value ? "#111827" : "#6b7280" }}>{opt.label}</span>
                  <input type="radio" checked={mode === opt.value} onChange={() => setMode(opt.value)} style={{ display: "none" }} />
                </label>
              ))}
            </div>

            <div className="ucr-grid">
              {mode === "geographical" ? (
                <>
                  <MultiSelectDropdown label="Select State *" options={stateOpts} selectedIds={geoStateIds} onChange={setGeoStateIds} icon={MapPin} />
                  <MultiSelectDropdown label="Select District *" options={distOpts} selectedIds={geoDistIds} onChange={setGeoDistIds} disabled={!geoStateIds.length} icon={MapPin} />
                  <FSelect label="Select Month *" value={geoMonth} onChange={(e) => setGeoMonth(e.target.value)} options={MONTHS.map(m => ({ id: m.value, label: m.label }))} icon={Calendar} />
                  <FSelect label="Select Year *" value={geoYear} onChange={(e) => setGeoYear(e.target.value)} options={YEARS.map(y => ({ id: y, label: String(y) }))} icon={Calendar} />
                </>
              ) : (
                <>
                  <FSelect label="Designation *" value={hierDesignation} onChange={(e) => { setHierDesignation(e.target.value); setHierStatus(""); setHierEmployeeIds([]); }} options={desigOpts} icon={Briefcase} />
                  <FSelect label="Status *" value={hierStatus} onChange={(e) => setHierStatus(e.target.value)} disabled={!hierDesignation} options={[{ id: "true", label: "Active" }, { id: "false", label: "Inactive" }]} icon={ToggleRight} />
                  <MultiSelectDropdown label="Select Employee *" options={empOpts} selectedIds={hierEmployeeIds} onChange={setHierEmployeeIds} disabled={!hierDesignation || !hierStatus} icon={User} />
                  <FSelect label="Month *" value={hierMonth} onChange={(e) => setHierMonth(e.target.value)} options={MONTHS.map(m => ({ id: m.value, label: m.label }))} icon={Calendar} />
                  <FSelect label="Year *" value={hierYear} onChange={(e) => setHierYear(e.target.value)} options={YEARS.map(y => ({ id: y, label: String(y) }))} icon={Calendar} />
                </>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleViewStatus} disabled={isLoading} className="ucr-submit-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 24px", borderRadius: 9, fontSize: 13, fontWeight: 700, border: "none", cursor: isLoading ? "not-allowed" : "pointer", background: "#2563eb", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.25)", opacity: isLoading ? 0.6 : 1 }}>
                {isLoading ? <Loader2 size={14} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Search size={14} />}
                View Status
              </button>
            </div>
          </div>
        )}
      </div>

      {tableVisible && (
        <div className="ucr-card">
          <div className="ucr-header">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", flex: 1, margin: 0 }}>Tour Program Details</h3>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <input type="text" placeholder="Search..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} style={{ height: 32, padding: "0 32px 0 12px", fontSize: 12, border: "1px solid #d1d5db", borderRadius: 8, width: 180, outline: "none" }} />
                <Search size={14} style={{ position: "absolute", right: 10, top: 9, color: "#9ca3af" }} />
              </div>
              <button onClick={handleExport} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="Export to CSV">
                <FileSpreadsheet size={16} />
              </button>
            </div>
          </div>
          <div className="ucr-body" style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7280", fontWeight: 700 }}>#</th>
                    {TABLE_COLS.map(col => <th key={col.key} style={{ padding: "12px 16px", textAlign: "left", color: "#6b7280", fontWeight: 700 }}>{col.label}</th>)}
                    <th style={{ padding: "12px 16px", textAlign: "center", color: "#6b7280", fontWeight: 700 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody style={{ background: "#fff" }}>
                  {pagedData.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 16px", color: "#6b7280" }}>{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                      {TABLE_COLS.map(col => {
                        const val = getVal(row, col.key);
                        return (
                          <td key={col.key} style={{ padding: "12px 16px", color: "#374151", whiteSpace: "nowrap" }}>
                            {col.key === "approved" ? (
                              <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: val === "Yes" ? "#f0fdf4" : "#f9fafb", color: val === "Yes" ? "#16a34a" : "#6b7280", border: `1px solid ${val === "Yes" ? "#bbf7d0" : "#f3f4f6"}` }}>{val}</span>
                            ) : val}
                          </td>
                        );
                      })}
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button onClick={() => handleApprove(row)} disabled={isSubmitting || getVal(row, "approved") === "Yes"} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: (isSubmitting || getVal(row, "approved") === "Yes") ? 0.5 : 1 }}>Approve</button>
                          <button onClick={() => { setRejectRow(row); setRejectPopup(true); }} disabled={isSubmitting} style={{ background: "#374151", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ucr-footer">
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => goToPage(1)} disabled={currentPage === 1} style={pagBtnStyle}>First</button>
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} style={pagBtnStyle}><ChevronLeft size={14}/></button>
                <span style={{ padding: "0 12px", display: "flex", alignItems: "center", fontSize: 12, fontWeight: 700, color: "#2563eb" }}>Page {currentPage} of {totalPages}</span>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} style={pagBtnStyle}><ChevronRight size={14}/></button>
                <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} style={pagBtnStyle}>Last</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectPopup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: 400, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Reject Tour Program</h3>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Provide a reason for rejection.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Type reason here..." style={{ width: "100%", height: 100, borderRadius: 8, border: "1px solid #d1d5db", padding: 12, fontSize: 13, outline: "none", marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setRejectPopup(false)} style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || isSubmitting} style={{ padding: "8px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: (!rejectReason.trim() || isSubmitting) ? 0.6 : 1 }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pagBtnStyle = { background: "#fff", border: "1px solid #f3f4f6", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" };

// ─── Reference Style Dropdowns ──────────────────────────────────────────────
function FSelect({ label, value, onChange, disabled, options = [], icon: Icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = options.find(o => String(o.id) === String(value));
  const hasVal = Boolean(value);
  const active = open || hasVal;
  const borderColor = (open || (hasVal && !disabled)) ? "#2563eb" : "#d1d5db";

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <div onClick={() => !disabled && setOpen(!open)}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 34px 0 12px", fontSize: 13, display: "flex", alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f9fafb" : "#fff",
          border: `1.5px solid ${disabled ? "#d1d5db" : borderColor}`, transition: "all 0.15s", boxSizing: "border-box",
        }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: hasVal ? (disabled ? "#9ca3af" : "#111827") : "transparent" }}>
          {selected?.label || " "}
        </span>
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: open ? "#2563eb" : "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
          {Icon && <Icon size={14} />}
          <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        </div>
      </div>
      <label style={{
        position: "absolute", left: 10, pointerEvents: "none", zIndex: 11, transition: "all 0.15s", fontWeight: 600,
        top: active ? -9 : 10, fontSize: active ? 10 : 12, color: (open || (hasVal && !disabled)) ? "#2563eb" : "#9ca3af",
        background: active ? "#fff" : "transparent", padding: active ? "0 4px" : "0",
      }}>{label}</label>
      {open && !disabled && (
        <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, width: "100%", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
          <ul style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0", margin: 0, listStyle: "none" }}>
            {options.map(opt => (
              <li key={opt.id} onMouseDown={() => { onChange({ target: { value: String(opt.id) } }); setOpen(false); }}
                style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", background: String(value) === String(opt.id) ? "#eff6ff" : "transparent", color: String(value) === String(opt.id) ? "#2563eb" : "#374151", fontWeight: String(value) === String(opt.id) ? 600 : 400 }}>{opt.label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({ label, options, selectedIds, onChange, icon: Icon, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const hasVal = selectedIds.length > 0;
  const active = open || hasVal;
  const displayVal = hasVal ? options.filter(o => selectedIds.includes(o.id)).map(o => o.label).join(", ") : "";

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <div onClick={() => !disabled && setOpen(!open)}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 34px 0 12px", fontSize: 13, display: "flex", alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f9fafb" : "#fff", border: `1.5px solid ${open || hasVal ? "#2563eb" : "#d1d5db"}`, transition: "all 0.15s", boxSizing: "border-box",
        }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: hasVal ? "#111827" : "transparent" }}>{displayVal}</span>
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: open ? "#2563eb" : "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
          {Icon && <Icon size={14} />}
          <ChevronDown size={14} />
        </div>
      </div>
      <label style={{
        position: "absolute", left: 10, pointerEvents: "none", zIndex: 11, transition: "all 0.15s", fontWeight: 600,
        top: active ? -9 : 10, fontSize: active ? 10 : 12, color: (open || hasVal) ? "#2563eb" : "#9ca3af",
        background: active ? "#fff" : "transparent", padding: active ? "0 4px" : "0",
      }}>{label}</label>
      {open && !disabled && (
        <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, width: "100%", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
            <button style={{ flex: 1, padding: "8px", fontSize: 11, fontWeight: 700, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }} onMouseDown={(e) => { e.preventDefault(); onChange(options.map(o => o.id)); }}>Select All</button>
            <button style={{ flex: 1, padding: "8px", fontSize: 11, fontWeight: 700, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }} onMouseDown={(e) => { e.preventDefault(); onChange([]); }}>Clear</button>
          </div>
          <ul style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0", margin: 0, listStyle: "none" }}>
            {options.map(opt => (
              <li key={opt.id} onMouseDown={(e) => { e.preventDefault(); onChange(selectedIds.includes(opt.id) ? selectedIds.filter(i => i !== opt.id) : [...selectedIds, opt.id]); }}
                style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={selectedIds.includes(opt.id)} readOnly />
                <span style={{ color: selectedIds.includes(opt.id) ? "#2563eb" : "#374151", fontWeight: selectedIds.includes(opt.id) ? 600 : 400 }}>{opt.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}