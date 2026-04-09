import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, CheckCircle2, ChevronDown, Check,
  Target, Edit, Save
} from "lucide-react";
import api from "../../../services/api";

const INPUT_CLASS = "h-[38px]";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(CURRENT_YEAR - 1 + i),
  label: String(CURRENT_YEAR - 1 + i)
}));

// Exact month headers matching the UI image
const MONTH_COLUMNS = [
  { key: "jan", label: "Jan" }, { key: "feb", label: "Feb" }, { key: "mar", label: "March" },
  { key: "apr", label: "April" }, { key: "may", label: "May" }, { key: "jun", label: "June" },
  { key: "jul", label: "July" }, { key: "aug", label: "Aug" }, { key: "sep", label: "Sep" },
  { key: "oct", label: "Oct" }, { key: "nov", label: "Nov" }, { key: "dec", label: "Dec" }
];

export default function TargetModify() {
  // ─── UI State ────────────────────────────────────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [tableVisible, setTableVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ─── Filter State ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    stateId: "",
    districtIds: [],
    employeeIds: [],
    year: String(CURRENT_YEAR)
  });

  // ─── Master Data (Dropdowns) ─────────────────────────────────────────────────
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);

  // ─── Table Data State ────────────────────────────────────────────────────────
  const [targetData, setTargetData] = useState({
    jan: "", feb: "", mar: "", apr: "", may: "", jun: "",
    jul: "", aug: "", sep: "", oct: "", nov: "", dec: ""
  });

  // ─── Helper for Auth Headers ─────────────────────────────────────────────────
  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
  }), []);

  // ─── Data Fetching (Cascading Dropdowns with Normalization) ──────────────────
  
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

  // 2. Fetch Districts when State changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, districtIds: [], employeeIds: [] }));
    setDistricts([]); setEmployees([]);
    setTableVisible(false);
    
    if (filters.stateId) {
      const fetchDistricts = async () => {
        try {
          const res = await api.get(`/api/masters/districts?stateId=${filters.stateId}`, getAuthHeaders());
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
  }, [filters.stateId, getAuthHeaders]);

  // 3. Fetch Employees when District changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, employeeIds: [] }));
    setEmployees([]);
    setTableVisible(false);

    if (filters.districtIds.length > 0) {
      const fetchEmployees = async () => {
        try {
          const res = await api.get(`/api/masters/employees/filter?stateId=${filters.stateId}&districtIds=${filters.districtIds.join(',')}`, getAuthHeaders());
          const employeeData = res.data?.data || res.data || [];
          
          // ✅ Normalization to format name as "Name-(Designation)" as requested
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
  }, [filters.districtIds, filters.stateId, getAuthHeaders]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setTableVisible(false); 
  };

  const handleFetchTargetData = async () => {
    setError(""); setSuccessMsg("");
    
    if (!filters.stateId || filters.districtIds.length === 0 || filters.employeeIds.length === 0 || !filters.year) {
      return setError("Please select State, District, Employee, and Year to load existing targets.");
    }

    setIsLoading(true);
    try {
      // ⚠️ Replace with actual GET API to fetch existing target data
      const res = await api.get(`/api/targets?stateId=${filters.stateId}&districtIds=${filters.districtIds.join(',')}&employeeIds=${filters.employeeIds.join(',')}&year=${filters.year}`, getAuthHeaders());
      
      const fetchedData = res.data?.data || res.data || {};
      
      // Populate existing data or default to empty strings
      setTargetData({
        jan: fetchedData.jan ?? fetchedData.january ?? "",
        feb: fetchedData.feb ?? fetchedData.february ?? "",
        mar: fetchedData.mar ?? fetchedData.march ?? "",
        apr: fetchedData.apr ?? fetchedData.april ?? "",
        may: fetchedData.may ?? "",
        jun: fetchedData.jun ?? fetchedData.june ?? "",
        jul: fetchedData.jul ?? fetchedData.july ?? "",
        aug: fetchedData.aug ?? fetchedData.august ?? "",
        sep: fetchedData.sep ?? fetchedData.september ?? "",
        oct: fetchedData.oct ?? fetchedData.october ?? "",
        nov: fetchedData.nov ?? fetchedData.november ?? "",
        dec: fetchedData.dec ?? fetchedData.december ?? ""
      });

      setTableVisible(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch existing target data. Loading empty form.");
      
      // Fallback: Show empty form so they can still submit
      setTargetData({
        jan: "", feb: "", mar: "", apr: "", may: "", jun: "",
        jul: "", aug: "", sep: "", oct: "", nov: "", dec: ""
      });
      setTableVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableChange = (monthKey, value) => {
    // Allow only numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setTargetData(prev => ({ ...prev, [monthKey]: value }));
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError(""); setSuccessMsg("");

    try {
      const payload = {
        stateId: Number(filters.stateId),
        districtIds: filters.districtIds.map(Number),
        employeeIds: filters.employeeIds.map(Number),
        year: Number(filters.year),
        targets: {
          jan: Number(targetData.jan) || 0,
          feb: Number(targetData.feb) || 0,
          mar: Number(targetData.mar) || 0,
          apr: Number(targetData.apr) || 0,
          may: Number(targetData.may) || 0,
          jun: Number(targetData.jun) || 0,
          jul: Number(targetData.jul) || 0,
          aug: Number(targetData.aug) || 0,
          sep: Number(targetData.sep) || 0,
          oct: Number(targetData.oct) || 0,
          nov: Number(targetData.nov) || 0,
          dec: Number(targetData.dec) || 0,
        }
      };

      // ⚠️ Replace with actual backend API for Target Modification (PUT/POST)
      await api.put("/api/targets/modify", payload, getAuthHeaders());
      
      setSuccessMsg("Target modified successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        setTableVisible(false);
      }, 3500);
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to modify target data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Dropdown Options Mapping ────────────────────────────────────────────────
  const stateOpts = states.map(s => ({ value: s.id, label: s.stateName }));
  const distOpts = districts.map(d => ({ value: d.id, label: d.districtName }));
  const empOpts = employees.map(e => ({ value: e.id, label: e.employeeName }));

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-400 pb-12 font-sans">
      
      {/* Global Alerts */}
      {(error || successMsg) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-2">
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-sm font-bold">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2.5 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-100 text-sm font-bold">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}
        </div>
      )}

      {/* ══ FILTER SECTION ═════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 rounded-t-xl" />
        
        {/* Standardized Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
              <Target size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Target Modify</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Adjust and update existing monthly targets</p>
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
                <SingleDropdown label="SELECT STATE *" options={stateOpts} value={filters.stateId} onSelect={(v) => handleFilterChange("stateId", v)} />
              </div>
              <div className="md:col-span-1">
                <MultiDropdown label="SELECT DISTRICT *" options={distOpts} selectedIds={filters.districtIds} onChange={(v) => handleFilterChange("districtIds", v)} disabled={!filters.stateId} />
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
                  onClick={handleFetchTargetData} 
                  disabled={isLoading} 
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-8 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 w-full"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Edit size={16} />}
                  Modify Target
                </button>
              </div>
              <div className="md:col-span-2 hidden md:block mt-4"></div> {/* Spacer */}

            </div>
          </div>
        )}
      </div>

      {/* ══ TABLE SECTION (Target Modify Form) ══════════════════════════ */}
      {tableVisible && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
            <h3 className="text-base font-bold text-slate-800">Target Modify Form</h3>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm text-center border-collapse">
              <thead className="bg-blue-600 text-white text-[12px] font-bold">
                <tr>
                  {MONTH_COLUMNS.map((month, index) => (
                    <th key={month.key} className={`py-3 px-2 border-r border-blue-500 last:border-r-0 min-w-[90px] ${index === 0 ? 'rounded-tl-lg' : ''} ${index === 11 ? 'rounded-tr-lg' : ''}`}>
                      {month.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  {MONTH_COLUMNS.map((month) => (
                    <td key={month.key} className="py-3 px-2 border border-slate-200">
                      <TableInput 
                        value={targetData[month.key]} 
                        onChange={(val) => handleTableChange(month.key, val)} 
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-start rounded-b-xl">
            <button 
              onClick={handleFinalSubmit} 
              disabled={isSubmitting} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Modify
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════

function TableInput({ value, onChange }) {
  return (
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-[32px] text-center border border-slate-300 rounded text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white shadow-sm"
    />
  );
}

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

  const selected = options.find(o => String(o.value) === String(value));
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
            ) : options.map((opt, i) => (
              <li key={i} onMouseDown={e => { e.preventDefault(); onSelect(opt.value); setIsOpen(false); }}
                className={`px-4 py-2.5 text-sm cursor-pointer font-semibold transition-colors ${String(value) === String(opt.value) ? "bg-blue-50 text-blue-600 border-l-[3px] border-blue-500" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 border-l-[3px] border-transparent"}`}>
                {opt.label}
              </li>
            ))}
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
  const selectAll = () => onChange(options.map(o => o.value));
  const clearAll = () => onChange([]);

  const hasValue = selectedIds.length > 0;
  const displayText = hasValue ? options.filter(o => selectedIds.includes(o.value)).map(o => o.label).join(", ") : "";
  
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
              const isSel = selectedIds.includes(opt.value);
              return (
                <li key={opt.value ?? idx} onMouseDown={e => { e.preventDefault(); toggle(opt.value); }} className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-3 transition-colors ${isSel ? "bg-blue-50" : "hover:bg-slate-50"}`}>
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