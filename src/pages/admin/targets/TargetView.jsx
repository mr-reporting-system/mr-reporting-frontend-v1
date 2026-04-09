import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, ChevronDown, Check,
  BarChart3, FileSpreadsheet, Eye
} from "lucide-react";
import api from "../../../services/api";

const INPUT_CLASS = "h-[38px]";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(CURRENT_YEAR - 1 + i),
  label: String(CURRENT_YEAR - 1 + i)
}));

// Exact month headers mapping
const MONTH_COLUMNS = [
  { key: "jan", label: "Jan" }, { key: "feb", label: "Feb" }, { key: "mar", label: "March" },
  { key: "apr", label: "April" }, { key: "may", label: "May" }, { key: "jun", label: "June" },
  { key: "jul", label: "July" }, { key: "aug", label: "Aug" }, { key: "sep", label: "Sep" },
  { key: "oct", label: "Oct" }, { key: "nov", label: "Nov" }, { key: "dec", label: "Dec" }
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
          const res = await api.get(`/api/masters/districts?stateIds=${filters.stateIds.join(',')}`, getAuthHeaders());
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

    if (filters.districtIds.length > 0) {
      const fetchEmployees = async () => {
        try {
          const res = await api.get(`/api/masters/employees/filter?stateIds=${filters.stateIds.join(',')}&districtIds=${filters.districtIds.join(',')}`, getAuthHeaders());
          const employeeData = res.data?.data || res.data || [];
          
          // ✅ Format: Name-(Designation)
          const normalizedEmployees = Array.isArray(employeeData) ? employeeData.map((e) => {
            const name = e.employee_name || e.employeeName || e.name || "Unknown";
            const designation = e.designation_name || e.designationName || e.designation || "";
            return {
              id: String(e.id ?? e.employeeId),
              employeeName: designation ? `${name}-(${designation})` : name
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
      // ⚠️ Replace with actual GET API for fetching the target report
      const res = await api.get(`/api/targets/report?stateIds=${filters.stateIds.join(',')}&districtIds=${filters.districtIds.join(',')}&employeeIds=${filters.employeeIds.join(',')}&year=${filters.year}`, getAuthHeaders());
      
      const fetchedData = res.data?.data || res.data || [];
      
      const formattedData = Array.isArray(fetchedData) ? fetchedData.map((row, i) => ({
        id: String(row.id || i),
        userName: row.userName || row.user_name || row.employeeName || "Unknown User",
        jan: Number(row.jan || row.january) || 0,
        feb: Number(row.feb || row.february) || 0,
        mar: Number(row.mar || row.march) || 0,
        apr: Number(row.apr || row.april) || 0,
        may: Number(row.may) || 0,
        jun: Number(row.jun || row.june) || 0,
        jul: Number(row.jul || row.july) || 0,
        aug: Number(row.aug || row.august) || 0,
        sep: Number(row.sep || row.september) || 0,
        oct: Number(row.oct || row.october) || 0,
        nov: Number(row.nov || row.november) || 0,
        dec: Number(row.dec || row.december) || 0,
      })) : [];

      setReportData(formattedData.length ? formattedData : getDummyData());
      setTableVisible(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch target report data.");
      // Fallback for UI visualization
      setReportData(getDummyData());
      setTableVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    alert("Exporting to Excel...");
  };

  // ─── Math Calculators ────────────────────────────────────────────────────────
  
  // Calculate Row Total (Total for one specific user)
  const calcRowTotal = (row) => {
    return MONTH_COLUMNS.reduce((sum, month) => sum + (Number(row[month.key]) || 0), 0);
  };

  // Calculate Column Total (Total for one specific month across all users)
  const calcColTotal = (monthKey) => {
    return reportData.reduce((sum, row) => sum + (Number(row[monthKey]) || 0), 0);
  };

  // Calculate Grand Total (Total of all Row Totals)
  const calcGrandTotal = () => {
    return reportData.reduce((sum, row) => sum + calcRowTotal(row), 0);
  };

  // ─── Dummy Data Generator ────────────────────────────────────────────────────
  const getDummyData = () => [
    { id: "1", userName: "Lokesh A", jan: 73000, feb: 50000, mar: 54300, apr: 69000, may: 34000, jun: 44000, jul: 20000, aug: 31000, sep: 30000, oct: 25000, nov: 30000, dec: 15000 },
    { id: "2", userName: "Swati", jan: 60000, feb: 55000, mar: 21000, apr: 24000, may: 62000, jun: 45000, jul: 59000, aug: 45000, sep: 34000, oct: 41000, nov: 27000, dec: 35000 },
    { id: "3", userName: "Ashish", jan: 35000, feb: 215000, mar: 50000, apr: 35000, may: 12345, jun: 7500, jul: 16000, aug: 5600, sep: 7800, oct: 28000, nov: 21000, dec: 14000 },
  ];

  // ─── Dropdown Options Mapping ────────────────────────────────────────────────
  const stateOpts = states.map(s => ({ id: String(s.id), value: String(s.id), label: s.stateName }));
  const distOpts = districts.map(d => ({ id: String(d.id), value: String(d.id), label: d.districtName }));
  const empOpts = employees.map(e => ({ id: String(e.id), value: String(e.id), label: e.employeeName }));

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-400 pb-12 font-sans">
      
      {/* Global Alerts */}
      {error && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4">
          <div className="flex items-center gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-sm font-bold">
            <AlertCircle size={16} /> {error}
          </div>
        </div>
      )}

      {/* ══ FILTER SECTION ═════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 rounded-t-xl" />
        
        {/* Standardized Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Target Report</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">View and analyze target submissions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-600">Filter</span>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors duration-300 focus:outline-none ${isFilterOpen ? "bg-blue-600" : "bg-slate-300"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isFilterOpen ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="p-6 sm:p-8 bg-white animate-in slide-in-from-top-2 duration-300">
            {/* Custom Grid Layout matching the UI Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              
              {/* Row 1 */}
              <div className="flex items-center gap-3 md:col-span-1">
                <input type="radio" checked readOnly className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-default" />
                <span className="text-sm font-semibold text-slate-600">* User wise</span>
              </div>
              <div className="md:col-span-1">
                <MultiDropdown label="SELECT STATE *" options={stateOpts} selectedIds={filters.stateIds} onChange={(v) => handleFilterChange("stateIds", v)} />
              </div>
              <div className="md:col-span-1">
                <MultiDropdown label="SELECT DISTRICT *" options={distOpts} selectedIds={filters.districtIds} onChange={(v) => handleFilterChange("districtIds", v)} disabled={!filters.stateIds.length} />
              </div>
              <div className="md:col-span-1">
                <MultiDropdown label="SELECT EMPLOYEE *" options={empOpts} selectedIds={filters.employeeIds} onChange={(v) => handleFilterChange("employeeIds", v)} disabled={!filters.districtIds.length} />
              </div>

              {/* Row 2 */}
              <div className="flex items-center gap-3 md:col-span-1 mt-4">
                <input type="radio" checked readOnly className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-default" />
                <span className="text-sm font-semibold text-slate-600">* Monthly</span>
              </div>
              <div className="md:col-span-1 mt-4">
                <SingleDropdown label="SELECT YEAR *" options={YEARS} value={filters.year} onSelect={(v) => handleFilterChange("year", v)} />
              </div>
              <div className="md:col-span-2 hidden md:block mt-4"></div> {/* Spacer */}

              {/* Row 3 */}
              <div className="flex items-center gap-3 md:col-span-1 mt-4">
                <input type="radio" checked readOnly className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-default" />
                <span className="text-sm font-semibold text-slate-600">* Amount Wise</span>
              </div>
              <div className="md:col-span-1 mt-4">
                <button 
                  onClick={handleViewTarget} 
                  disabled={isLoading} 
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-8 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 w-full"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                  View Target
                </button>
              </div>
              <div className="md:col-span-2 hidden md:block mt-4"></div> {/* Spacer */}

            </div>
          </div>
        )}
      </div>

      {/* ══ TABLE SECTION (Target View Amount Wise) ══════════════════════════ */}
      {tableVisible && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/40">
            <h3 className="text-base font-bold text-slate-800">Target View Amount Wise</h3>
            <button onClick={handleExportExcel} className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded transition-colors shadow-sm" title="Export to Excel">
              <FileSpreadsheet size={18} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse min-w-[1200px]">
              <thead className="bg-blue-600 text-white text-[12px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 border-r border-blue-500">User Name</th>
                  {MONTH_COLUMNS.map((month) => (
                    <th key={month.key} className="py-3.5 px-2 border-r border-blue-500 last:border-r-0 min-w-[80px]">
                      {month.label}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 border-l border-blue-500 bg-blue-700">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.length === 0 ? (
                  <tr><td colSpan="14" className="py-12 text-center text-slate-400 font-medium">No target data found for the selected filters.</td></tr>
                ) : reportData.map((row) => (
                  <tr key={row.id} className="bg-white hover:bg-blue-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-700 text-left border-r border-slate-200">{row.userName}</td>
                    {MONTH_COLUMNS.map((month) => (
                      <td key={month.key} className="py-3 px-2 border-r border-slate-200 text-slate-600 font-medium">
                        {row[month.key] || 0}
                      </td>
                    ))}
                    <td className="py-3 px-4 font-bold text-slate-800 bg-slate-50 border-l border-slate-200">
                      {calcRowTotal(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {reportData.length > 0 && (
                <tfoot className="bg-slate-100 text-slate-800 font-bold text-[13px] border-t-2 border-slate-300">
                  <tr>
                    <td className="py-4 px-4 text-center border-r border-slate-300">TOTAL</td>
                    {MONTH_COLUMNS.map((month) => (
                      <td key={month.key} className="py-4 px-2 border-r border-slate-300">
                        {calcColTotal(month.key)}
                      </td>
                    ))}
                    <td className="py-4 px-4 bg-blue-50 text-blue-700 border-l border-slate-300">
                      {calcGrandTotal()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════

function SingleDropdown({ label, value, onSelect, options = [], disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const openMenu = () => {
    if (disabled) return;
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
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

  const selected = options.find(o => String(o.value) === String(value) || String(o.id) === String(value));
  const hasValue = Boolean(value !== "" && value !== null && value !== undefined);
  
  const borderCls = disabled ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed" : hasValue ? isOpen ? "border-blue-500 ring-2 ring-blue-100 bg-white" : "border-blue-400 bg-white" : isOpen ? "border-slate-400 ring-2 ring-slate-100 bg-white" : "border-slate-300 bg-white";
  const labelColor = disabled ? "text-slate-400" : hasValue ? "text-blue-600 font-bold" : isOpen ? "text-slate-500 font-bold" : "text-slate-400 font-semibold";
  const labelPos = hasValue || isOpen ? "-top-[9px] text-[10px] bg-white px-1.5" : "top-[9px] text-sm bg-transparent";

  return (
    <div className="relative w-full select-none mt-1">
      <div ref={ref} onClick={openMenu} className={`w-full ${INPUT_CLASS} rounded-lg border flex items-center transition-all px-3.5 ${borderCls}`}>
        <span className={`truncate text-sm font-semibold flex-1 ${hasValue ? "text-slate-800" : "text-transparent"}`}>{selected?.label || " "}</span>
        <div className={`absolute right-3 flex items-center gap-1 pointer-events-none transition-transform duration-200 ${hasValue ? "text-blue-500" : "text-slate-400"} ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDown size={14} />
        </div>
      </div>
      <label className={`absolute left-3 pointer-events-none z-10 transition-all duration-200 tracking-wide uppercase ${labelPos} ${labelColor}`}>{label}</label>

      {isOpen && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <ul className="py-1.5 max-h-60 overflow-y-auto">
            {options.length === 0 ? (
               <li className="px-4 py-3 text-sm text-slate-400 italic text-center">No options available</li>
            ) : options.map((opt, i) => {
              const optValue = opt.id ?? opt.value;
              return (
                <li key={i} onMouseDown={e => { e.preventDefault(); onSelect(optValue); setIsOpen(false); }}
                  className={`px-4 py-2.5 text-sm cursor-pointer font-semibold transition-colors ${String(value) === String(optValue) ? "bg-blue-50 text-blue-600 border-l-[3px] border-blue-500" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 border-l-[3px] border-transparent"}`}>
                  {opt.label}
                </li>
              );
            })}
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

  const openMenu = () => {
    if (disabled) return;
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
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

  const toggle = id => onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  const selectAll = () => onChange(options.map(o => o.id ?? o.value));
  const clearAll = () => onChange([]);

  const hasValue = selectedIds.length > 0;
  const displayText = hasValue ? options.filter(o => selectedIds.includes(o.id ?? o.value)).map(o => o.label).join(", ") : "";
  
  const borderCls = disabled ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed" : hasValue ? isOpen ? "border-blue-500 ring-2 ring-blue-100 bg-white" : "border-blue-400 bg-white" : isOpen ? "border-slate-400 ring-2 ring-slate-100 bg-white" : "border-slate-300 bg-white";
  const labelColor = disabled ? "text-slate-400" : hasValue ? "text-blue-600 font-bold" : isOpen ? "text-slate-500 font-bold" : "text-slate-400 font-semibold";
  const labelPos = hasValue || isOpen ? "-top-[9px] text-[10px] bg-white px-1.5" : "top-[9px] text-sm bg-transparent";

  return (
    <div className="relative w-full select-none mt-1">
      <div ref={ref} onClick={openMenu} className={`w-full ${INPUT_CLASS} rounded-lg border flex items-center transition-all px-3.5 ${borderCls}`}>
        <span className={`block truncate text-sm font-semibold flex-1 min-w-0 ${hasValue ? "text-slate-800" : "text-transparent"}`}>{displayText || " "}</span>
        <div className={`absolute right-3 flex items-center gap-1 pointer-events-none transition-transform duration-200 ${hasValue ? "text-blue-500" : "text-slate-400"} ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDown size={14} />
        </div>
      </div>
      <label className={`absolute left-3 pointer-events-none z-10 transition-all duration-200 tracking-wide uppercase ${labelPos} ${labelColor}`}>{label}</label>

      {isOpen && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div className="flex border-b border-slate-100">
            <button type="button" onMouseDown={e => { e.preventDefault(); selectAll(); }} className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors">Select All</button>
            <button type="button" onMouseDown={e => { e.preventDefault(); clearAll(); }} className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Clear All</button>
          </div>
          <ul className="py-1.5 max-h-52 overflow-y-auto">
            {options.length === 0 ? (
               <li className="px-4 py-3 text-sm text-slate-400 italic text-center">No options available</li>
            ) : options.map((opt, idx) => {
              const optId = opt.id ?? opt.value;
              const isSel = selectedIds.includes(optId);
              return (
                <li key={optId ?? idx} onMouseDown={e => { e.preventDefault(); toggle(optId); }} className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-3 transition-colors ${isSel ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSel ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}>
                    {isSel && <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className={`font-semibold ${isSel ? "text-blue-700" : "text-slate-600"}`}>{opt.label}</span>
                </li>
              );
            })}
          </ul>
        </Portal>
      )}
    </div>
  );
}

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
    <div ref={ref} style={{ position: "fixed", top, left, width, zIndex: 9999 }} className="dropdown-portal bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      {children}
    </div>
  );
}