import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, ChevronDown, Check,
  BarChart3, FileSpreadsheet, Eye
} from "lucide-react";
import api from "../../../services/api";

// ─── Global responsive styles (from reference) ───────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; overflow-x: hidden; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; margin-bottom: 24px; min-width: 0; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:flex-end; border-radius:0 0 16px 16px; flex-wrap: wrap; gap: 12px; }

  .ucr-table-container {
    border: 1px solid #f3f4f6;
    border-radius: 12px;
    overflow-x: auto;
    background: #fff;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }
  .ucr-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1200px; }
  .ucr-table thead { background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
  .ucr-table th { padding: 12px 16px; text-align: center; font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  .ucr-table td { padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6; white-space: nowrap; text-align: center; }

  .ucr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; align-items: center; }

  @media(max-width:1024px){
    .ucr-grid, .ucr-grid-4, .ucr-grid-2 { grid-template-columns:repeat(2,1fr); gap:16px; }
    .hide-on-mobile { display: none; }
  }
  @media(max-width:768px){
    .ucr-grid, .ucr-grid-4, .ucr-grid-2 { grid-template-columns:1fr; gap:16px; }
    .ucr-body  { padding:16px; }
    .ucr-header { padding: 16px; } /* Keeping inline for mobile */
    .ucr-footer { justify-content: center; flex-direction: column; }
    .ucr-footer > button { width: 100%; justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const INPUT_CLASS = "h-[38px]";
const FH = 40;

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(CURRENT_YEAR - 1 + i),
  label: String(CURRENT_YEAR - 1 + i)
}));

// Mapped precisely to the backend's numeric string keys ("1", "2", etc.)
const MONTH_COLUMNS = [
  { key: "1", label: "Jan" }, { key: "2", label: "Feb" }, { key: "3", label: "March" },
  { key: "4", label: "April" }, { key: "5", label: "May" }, { key: "6", label: "June" },
  { key: "7", label: "July" }, { key: "8", label: "Aug" }, { key: "9", label: "Sep" },
  { key: "10", label: "Oct" }, { key: "11", label: "Nov" }, { key: "12", label: "Dec" }
];

export default function TargetView() {
  // ─── UI State ────────────────────────────────────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [tableVisible, setTableVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── Filter State (Multi-Selects for State, District, Employee) ──────────────
  const [filters, setFilters] = useState({
    stateIds: [],
    districtIds: [],
    employeeIds: [],
    year: String(CURRENT_YEAR)
  });

  // ─── Master Data (Dropdowns) ─────────────────────────────────────────────────
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);

  // ─── Table Data State ────────────────────────────────────────────────────────
  const [reportData, setReportData] = useState([]);
  const [monthTotals, setMonthTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);

  // ─── Helper for Auth Headers ─────────────────────────────────────────────────
  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
  }), []);

  // ─── Data Fetching (Cascading Multi-Select Dropdowns) ────────────────────────
  
  // 1. Fetch States on Mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await api.get("/api/masters/states", getAuthHeaders());
        const stateData = res.data?.data || res.data || [];
        const normalizedStates = Array.isArray(stateData) ? stateData.map((s) => ({
          id: String(s.id ?? s.stateId),
          stateName: s.state_name || s.stateName || s.name || "Unknown"
        })) : [];
        setStates(normalizedStates.filter(opt => opt.id !== ""));
      } catch (err) { console.error("Failed to load states", err); }
    };
    fetchStates();
  }, [getAuthHeaders]);

  // 2. Fetch Districts when States change
  useEffect(() => {
    setFilters(prev => ({ ...prev, districtIds: [], employeeIds: [] }));
    setDistricts([]); setEmployees([]);
    setTableVisible(false);
    
    if (filters.stateIds.length > 0) {
      const fetchDistricts = async () => {
        try {
          const query = filters.stateIds.map(id => `stateIds=${id}`).join('&');
          const res = await api.get(`/api/masters/districts/by-states?${query}`, getAuthHeaders());
          
          const districtData = res.data?.data || res.data || [];
          const normalizedDistricts = Array.isArray(districtData) ? districtData.map((d) => ({
            id: String(d.id ?? d.districtId),
            districtName: d.district_name || d.districtName || d.name || "Unknown"
          })) : [];
          setDistricts(normalizedDistricts.filter(opt => opt.id !== ""));
        } catch (err) { console.error("Failed to load districts", err); }
      };
      fetchDistricts();
    }
  }, [filters.stateIds, getAuthHeaders]);

  // 3. Fetch Employees when Districts change
  useEffect(() => {
    setFilters(prev => ({ ...prev, employeeIds: [] }));
    setEmployees([]);
    setTableVisible(false);

    if (filters.districtIds.length > 0 && filters.stateIds.length > 0) {
      const fetchEmployees = async () => {
        try {
          const stateQuery = filters.stateIds.map(id => `stateIds=${id}`).join('&');
          const districtQuery = filters.districtIds.map(id => `districtIds=${id}`).join('&');
          
          const res = await api.get(`/api/target/submission/employees/by-filters?${stateQuery}&${districtQuery}`, getAuthHeaders());
          const employeeData = res.data?.data || res.data || [];
          
          const normalizedEmployees = Array.isArray(employeeData) ? employeeData.map((e) => {
            const name = e.name || e.employee_name || e.employeeName || "Unknown";
            const type = e.type || e.designation_name || e.designationName || e.designation || "";
            return {
              id: String(e.id ?? e.employeeId),
              employeeName: type ? `${name}-(${type})` : name
            };
          }) : [];
          setEmployees(normalizedEmployees.filter(opt => opt.id !== ""));
        } catch (err) { console.error("Failed to load employees", err); }
      };
      fetchEmployees();
    }
  }, [filters.districtIds, filters.stateIds, getAuthHeaders]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setTableVisible(false); 
  };

  const handleViewTarget = async () => {
    setError("");
    
    if (filters.stateIds.length === 0 || filters.districtIds.length === 0 || filters.employeeIds.length === 0 || !filters.year) {
      return setError("Please select State, District, Employee, and Year to view targets.");
    }

    setIsLoading(true);
    try {
      const payload = {
        stateIds: filters.stateIds.map(Number),
        districtIds: filters.districtIds.map(Number),
        employeeIds: filters.employeeIds.map(Number),
        year: Number(filters.year)
      };

      const res = await api.post(`/api/target/submission/report`, payload, getAuthHeaders());
      
      const reportResponse = res.data?.data || {};
      
      setReportData(reportResponse.rows || []);
      setMonthTotals(reportResponse.monthTotals || {});
      setGrandTotal(reportResponse.grandTotal || 0);
      
      setTableVisible(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch target report data.");
      setReportData([]);
      setMonthTotals({});
      setGrandTotal(0);
      setTableVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportData.length) return;
    
    const headers = ["User Name", ...MONTH_COLUMNS.map(m => m.label), "TOTAL"];
    
    const rows = reportData.map(row => [
      row.employeeName,
      ...MONTH_COLUMNS.map(month => row.monthlyTargets?.[month.key] || 0),
      row.total || 0
    ]);

    rows.push([
      "TOTAL",
      ...MONTH_COLUMNS.map(month => monthTotals?.[month.key] || 0),
      grandTotal || 0
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `target_report_${filters.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // ─── Dropdown Options Mapping ────────────────────────────────────────────────
  const stateOpts = states.map(s => ({ id: String(s.id), value: String(s.id), label: s.stateName }));
  const distOpts = districts.map(d => ({ id: String(d.id), value: String(d.id), label: d.districtName }));
  const empOpts = employees.map(e => ({ id: String(e.id), value: String(e.id), label: e.employeeName }));

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>
      
      {/* Global Alerts */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ══ FILTER SECTION ═════════════════════════════════════════════════ */}
      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={17} style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Target Report</h2>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>View and analyze target submissions</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>FILTER</span>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)} 
              style={{ 
                width: 34, height: 18, borderRadius: 20, background: isFilterOpen ? "#2563eb" : "#d1d5db", 
                position: "relative", cursor: "pointer", transition: "0.2s", border: "none" 
              }}
            >
              <div style={{ 
                width: 14, height: 14, borderRadius: "50%", background: "#fff", 
                position: "absolute", top: 2, left: isFilterOpen ? 18 : 2, transition: "0.2s" 
              }} />
            </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="ucr-body">
            <div className="ucr-grid-4">
              
              {/* Row 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "4px solid #2563eb", background: "#fff" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#4b5563" }}>* User wise</span>
              </div>
              <MultiSelectDropdown label="SELECT STATE *" options={stateOpts} selectedIds={filters.stateIds} onChange={(v) => handleFilterChange("stateIds", v)} />
              <MultiSelectDropdown label="SELECT DISTRICT *" options={distOpts} selectedIds={filters.districtIds} onChange={(v) => handleFilterChange("districtIds", v)} disabled={!filters.stateIds.length} />
              <MultiSelectDropdown label="SELECT EMPLOYEE *" options={empOpts} selectedIds={filters.employeeIds} onChange={(v) => handleFilterChange("employeeIds", v)} disabled={!filters.districtIds.length} />

              {/* Row 2 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "4px solid #2563eb", background: "#fff" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#4b5563" }}>* Monthly</span>
              </div>
              <SingleDropdown label="SELECT YEAR *" options={YEARS} value={filters.year} onSelect={(v) => handleFilterChange("year", v)} />
              <div style={{ gridColumn: "span 2" }} className="hide-on-mobile"></div>

              {/* Row 3 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "4px solid #2563eb", background: "#fff" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#4b5563" }}>* Amount Wise</span>
              </div>
              <div>
                <button 
                  onClick={handleViewTarget} 
                  disabled={isLoading} 
                  style={{
                    height: 40, width: "100%", borderRadius: 8, background: "#2563eb", color: "#fff",
                    fontSize: 13, fontWeight: 700, border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}
                >
                  {isLoading ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Eye size={16} />}
                  View Target
                </button>
              </div>
              <div style={{ gridColumn: "span 2" }} className="hide-on-mobile"></div>

            </div>
          </div>
        )}
      </div>

      {/* ══ TABLE SECTION (Target View Amount Wise) ══════════════════════════ */}
      {tableVisible && (
        <div className="ucr-card animate-in slide-in-from-bottom-4 duration-500">
          <div className="ucr-header" style={{ background: "#f9fafb" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Target View Amount Wise</h3>
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
              <table className="ucr-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderRight: "1px solid #f3f4f6" }}>User Name</th>
                    {MONTH_COLUMNS.map((month) => (
                      <th key={month.key} style={{ minWidth: 80, borderRight: "1px solid #f3f4f6" }}>
                        {month.label}
                      </th>
                    ))}
                    <th style={{ background: "#1d4ed8", color: "#fff" }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={14} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                        No target data found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((row) => (
                      <tr key={row.employeeId}>
                        <td style={{ fontWeight: 700, color: "#374151", textAlign: "left", borderRight: "1px solid #f3f4f6" }}>{row.employeeName}</td>
                        
                        {MONTH_COLUMNS.map((month) => (
                          <td key={month.key} style={{ fontWeight: 600, borderRight: "1px solid #f3f4f6" }}>
                            {row.monthlyTargets?.[month.key] || 0}
                          </td>
                        ))}
                        
                        <td style={{ fontWeight: 700, color: "#111827", background: "#f9fafb" }}>
                          {row.total || 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {reportData.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#f3f4f6" }}>
                      <td style={{ fontWeight: 700, color: "#111827", textAlign: "center", padding: "14px 16px", borderRight: "1px solid #e5e7eb" }}>TOTAL</td>
                      
                      {MONTH_COLUMNS.map((month) => (
                        <td key={month.key} style={{ fontWeight: 700, color: "#111827", padding: "14px 16px", borderRight: "1px solid #e5e7eb" }}>
                          {monthTotals?.[month.key] || 0}
                        </td>
                      ))}
                      
                      <td style={{ fontWeight: 700, color: "#1d4ed8", background: "#eff6ff", padding: "14px 16px" }}>
                        {grandTotal || 0}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════

function SingleDropdown({ label, options, value, onSelect, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const selectedOption = options.find((option) => String(option.id ?? option.value) === String(value));
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

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = (e) => { if (e.target?.closest && e.target.closest('.dropdown-portal')) return; setIsOpen(false); };
    const handleResize = () => setIsOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("scroll", handleScroll, true); window.removeEventListener("resize", handleResize); };
  }, [isOpen]);

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
                  key={opt.id ?? opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(opt.id ?? opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: "10px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
                    background: String(value) === String(opt.id ?? opt.value) ? "#eff6ff" : "transparent",
                    color: String(value) === String(opt.id ?? opt.value) ? "#2563eb" : "#374151"
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
      onChange(selectedIds.filter((item) => String(item) !== String(value)));
      return;
    }
    onChange([...selectedIds, String(value)]);
  };

  const selectAll = () => onChange(options.map((option) => String(option.id || option.value)));
  const clearAll = () => onChange([]);

  const selectedLabel = options
    .filter((option) => selectedIds.includes(String(option.id || option.value)))
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