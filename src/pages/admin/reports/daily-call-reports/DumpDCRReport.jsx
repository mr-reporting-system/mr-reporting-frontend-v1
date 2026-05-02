import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, ChevronDown, FileSpreadsheet,
  Printer, Download, Check, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Database
} from "lucide-react";
import api from "../../../../services/api";

const INPUT_CLASS = "h-[38px]";

export default function DumpDCRReport() {
  // ─── UI State ────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("filter"); // 'filter' | 'excel'
  const [tableVisible, setTableVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── Filter State ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    stateId: "", // Single Select
    districtIds: [], // Multi Select
    employeeIds: [], // Multi Select
    fromDate: "",
    toDate: ""
  });

  // ─── Master Data (Dropdowns) ─────────────────────────────────────────────────
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);

  // ─── Report Data State ───────────────────────────────────────────────────────
  const [reportData, setReportData] = useState([]);

  // ─── Helper for Auth Headers ─────────────────────────────────────────────────
  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
  }), []);

  // ─── Data Fetching ───────────────────────────────────────────────────────────
  
  // 1. Fetch States on Mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await api.get("/api/masters/states", getAuthHeaders());
        const stateData = res.data?.data || res.data || [];
        setStates(Array.isArray(stateData) ? stateData.map(s => ({
          id: String(s.id ?? s.stateId), label: s.state_name || s.stateName || s.name || "Unknown"
        })).filter(opt => opt.id !== "") : []);
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
      api.get(`/api/masters/districts?stateId=${filters.stateId}`, getAuthHeaders())
        .then(res => {
          const data = res.data?.data || res.data || [];
          setDistricts(Array.isArray(data) ? data.map(d => ({
            id: String(d.id ?? d.districtId), label: d.district_name || d.districtName || d.name || "Unknown"
          })) : []);
        }).catch(err => console.error(err));
    }
  }, [filters.stateId, getAuthHeaders]);

  // 3. Fetch Employees when Districts change
  useEffect(() => {
    setFilters(prev => ({ ...prev, employeeIds: [] }));
    setEmployees([]);
    setTableVisible(false);

    if (filters.districtIds.length > 0) {
      // Mocking the employee fetch based on district (Replace with actual endpoint if needed)
      const query = filters.districtIds.map(id => `districtIds=${id}`).join('&');
      api.get(`/api/masters/employees/by-districts?${query}`, getAuthHeaders())
        .then(res => {
          const data = res.data?.data || res.data || [];
          setEmployees(Array.isArray(data) ? data.map(e => ({
            id: String(e.id ?? e.employeeId), label: e.employee_name || e.employeeName || e.name || "Unknown"
          })) : []);
        }).catch(err => console.error(err));
    }
  }, [filters.districtIds, getAuthHeaders]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setTableVisible(false);
  };

  const handleViewStatus = async () => {
    setError("");
    
    if (!filters.stateId) return setError("Please select a State.");
    if (filters.districtIds.length === 0) return setError("Please select at least one District.");
    if (filters.employeeIds.length === 0) return setError("Please select at least one Employee.");
    if (!filters.fromDate || !filters.toDate) return setError("Please select From and To dates.");

    setIsLoading(true);
    try {
      // ⚠️ Simulate API Call for Report Data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // DUMMY DATA matching your screenshot exactly
      const dummyData = [
        {
          id: 1, state: "UTTAR PRADESH", hq: "BAREILLY", empName: "Lokesh A", empCode: "01", date: "06-04-2026",
          dayStart: "6 Apr, 2026 10:36:55 AM", dayEnd: "6 Apr, 2026 12:00:00 AM", managerName: "Praveen", managerJw: "---",
          providerCode: "50", providerType: "RMP", providerName: "DR. SHEETAL JAIN", providerStatus: "Listed",
          areas: "ABC (LOKESH)", pob: "0.00", address: "---", workingAddress: "No 102-103, DLF Qutab Plaza, DLF City Phase-1, Gurugram, Haryana 122002, India",
          timeIn: "06 Apr 2026, 11:08 AM", timeOut: "06 Apr 2026, 11:08 AM", category: "SuperCore",
          specialization: "Gastroenterologist", workingStatus: "Working", battery: "95", fakeLocation: "No", remarks: "okay"
        },
        {
          id: 2, state: "UTTAR PRADESH", hq: "BAREILLY", empName: "Lokesh A", empCode: "01", date: "06-04-2026",
          dayStart: "6 Apr, 2026 10:36:55 AM", dayEnd: "6 Apr, 2026 12:00:00 AM", managerName: "Praveen", managerJw: "---",
          providerCode: "0", providerType: "RMP", providerName: "DR. SHYAM", providerStatus: "Listed",
          areas: "TILHAR (LOKESH)", pob: "0.00", address: "---", workingAddress: "Arjan Garh, National Highway 236, Aya Nagar, New Delhi",
          timeIn: "06 Apr 2026, 11:10 AM", timeOut: "06 Apr 2026, 11:10 AM", category: "A",
          specialization: "Critical Care", workingStatus: "Working", battery: "95", fakeLocation: "No", remarks: "ytrewq"
        }
      ];

      setReportData(dummyData);
      setTableVisible(true);
    } catch (err) {
      setError(err.message || "Failed to fetch report data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateExcel = async () => {
    setError("");
    if (!filters.stateId || filters.districtIds.length === 0 || filters.employeeIds.length === 0 || !filters.fromDate || !filters.toDate) {
      return setError("Please fill all filters before generating Excel.");
    }

    setIsLoading(true);
    try {
      // Simulate Excel Generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("Excel file generated and downloaded successfully!");
    } catch (err) {
      setError("Failed to generate Excel.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-400 pb-12 font-sans">
      
      {error && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 flex items-center gap-2.5 text-red-600 text-sm font-bold">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ══ TOP HEADER & FILTER SECTION ══════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 rounded-t-xl" />
        
        {/* Header & Mode Toggle */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
              <Database size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Dump DCR Report</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Extract complete daily call report dumps</p>
            </div>
          </div>

          {/* Filter vs Excel Toggle */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
            <span className={`text-sm font-bold transition-colors cursor-pointer ${mode === 'filter' ? 'text-blue-600' : 'text-slate-400'}`} onClick={() => setMode('filter')}>
              Filter
            </span>
            <button 
              onClick={() => { setMode(mode === 'filter' ? 'excel' : 'filter'); setTableVisible(false); }}
              className="relative w-12 h-6 rounded-full bg-slate-200 focus:outline-none transition-colors duration-300"
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${mode === 'excel' ? 'translate-x-7 bg-blue-600' : 'translate-x-1 bg-white'}`}></div>
            </button>
            <span className={`text-sm font-bold transition-colors cursor-pointer ${mode === 'excel' ? 'text-blue-600' : 'text-slate-400'}`} onClick={() => setMode('excel')}>
              Excel
            </span>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="p-6 sm:p-8 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-end">
            
            <div className="lg:col-span-1">
              <SingleDropdown label="SELECT STATE *" options={states} value={filters.stateId} onSelect={v => handleFilterChange("stateId", v)} />
            </div>
            
            <div className="lg:col-span-1">
              <MultiDropdown label="SELECT DISTRICT *" options={districts} selectedIds={filters.districtIds} onChange={v => handleFilterChange("districtIds", v)} disabled={!filters.stateId} />
            </div>
            
            <div className="lg:col-span-1">
              <MultiDropdown label="SELECT EMPLOYEE *" options={employees} selectedIds={filters.employeeIds} onChange={v => handleFilterChange("employeeIds", v)} disabled={!filters.districtIds.length} />
            </div>
            
            <div className="lg:col-span-1">
              <ModernDatePicker label="FROM DATE *" value={filters.fromDate} onChange={v => handleFilterChange("fromDate", v)} />
            </div>
            
            <div className="lg:col-span-1">
              <ModernDatePicker label="TO DATE *" value={filters.toDate} onChange={v => handleFilterChange("toDate", v)} />
            </div>

            {/* Action Button */}
            <div className="md:col-span-3 lg:col-span-5 flex mt-2">
              {mode === 'filter' ? (
                <button 
                  onClick={handleViewStatus} 
                  disabled={isLoading} 
                  className={`flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white ${INPUT_CLASS} px-8 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 focus:outline-none`}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  View Status
                </button>
              ) : (
                <button 
                  onClick={handleGenerateExcel} 
                  disabled={isLoading} 
                  className={`flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white ${INPUT_CLASS} px-8 rounded-lg text-sm font-bold transition-all shadow-md shadow-emerald-200 active:scale-95 disabled:opacity-50 focus:outline-none`}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Generate Excel
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ══ PRIMARY REPORT TABLE ════════════════════════════════════════════ */}
      {tableVisible && mode === 'filter' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <h3 className="text-base font-bold text-slate-800">DCR Consolidate Dump Details</h3>
            <div className="flex items-center gap-2">
              <button className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded shadow-sm transition-colors border border-blue-200 hover:border-blue-600"><Printer size={18}/></button>
              <button className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded shadow-sm transition-colors border border-emerald-200 hover:border-emerald-600"><FileSpreadsheet size={18}/></button>
            </div>
          </div>

          {/* 100% Loaded Progress Bar mimicking screenshot */}
          <div className="w-full bg-slate-100 h-1 relative">
            <div className="absolute top-0 left-0 h-full bg-blue-500 w-full"></div>
          </div>
          <div className="w-full text-center text-[10px] font-bold text-slate-400 py-1 bg-slate-50 border-b border-slate-200">
            100% loaded
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            {/* Extremely wide table layout matching screenshot */}
            <table className="w-full text-xs text-center border-collapse min-w-[3000px]">
              <thead className="bg-blue-600 text-white font-bold tracking-wider uppercase">
                <tr>
                  <th className="py-3 px-3 border-r border-blue-500">SNo</th>
                  <th className="py-3 px-3 border-r border-blue-500">State</th>
                  <th className="py-3 px-3 border-r border-blue-500">HQ</th>
                  <th className="py-3 px-3 border-r border-blue-500">EmployeeName</th>
                  <th className="py-3 px-3 border-r border-blue-500">EmployeeCode</th>
                  <th className="py-3 px-3 border-r border-blue-500">Date</th>
                  <th className="py-3 px-3 border-r border-blue-500">DayStart</th>
                  <th className="py-3 px-3 border-r border-blue-500">DayEnd</th>
                  <th className="py-3 px-3 border-r border-blue-500">Manager Name</th>
                  <th className="py-3 px-3 border-r border-blue-500">Manager JW</th>
                  <th className="py-3 px-3 border-r border-blue-500">Provider Code</th>
                  <th className="py-3 px-3 border-r border-blue-500">Provider Type</th>
                  <th className="py-3 px-3 border-r border-blue-500">Provider Name</th>
                  <th className="py-3 px-3 border-r border-blue-500">Provider Status</th>
                  <th className="py-3 px-3 border-r border-blue-500">Areas</th>
                  <th className="py-3 px-3 border-r border-blue-500">POB</th>
                  <th className="py-3 px-3 border-r border-blue-500 w-48">Address</th>
                  <th className="py-3 px-3 border-r border-blue-500 w-64">Working Address</th>
                  <th className="py-3 px-3 border-r border-blue-500">TimeIn</th>
                  <th className="py-3 px-3 border-r border-blue-500">TimeOut</th>
                  <th className="py-3 px-3 border-r border-blue-500">Category</th>
                  <th className="py-3 px-3 border-r border-blue-500">Specialization</th>
                  <th className="py-3 px-3 border-r border-blue-500">Working Status</th>
                  <th className="py-3 px-3 border-r border-blue-500">Battery Percentage</th>
                  <th className="py-3 px-3 border-r border-blue-500">Fake Location</th>
                  <th className="py-3 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.length === 0 ? (
                  <tr><td colSpan="26" className="py-12 text-slate-500 font-medium">No records found.</td></tr>
                ) : reportData.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50 transition-colors bg-white">
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.id}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.state}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.hq}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-800 font-bold">{row.empName}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.empCode}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-blue-600 font-bold whitespace-nowrap">{row.date}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600 max-w-[120px]">{row.dayStart}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600 max-w-[120px]">{row.dayEnd}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.managerName}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-400">{row.managerJw}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600 font-mono">{row.providerCode}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.providerType}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-800 font-semibold">{row.providerName}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-emerald-600 font-semibold">{row.providerStatus}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600 whitespace-nowrap">{row.areas}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600 font-mono">{row.pob}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-400">{row.address}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600 text-left line-clamp-3">{row.workingAddress}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.timeIn}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.timeOut}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.category}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.specialization}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.workingStatus}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{row.battery}</td>
                    <td className="py-3 px-3 border-r border-slate-200 text-emerald-600">{row.fakeLocation}</td>
                    <td className="py-3 px-3 text-slate-600">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-2">
             <button className="px-3 py-1 bg-slate-200 text-slate-500 rounded text-xs font-bold shadow-sm cursor-not-allowed">First</button>
             <button className="px-3 py-1 bg-slate-200 text-slate-500 rounded text-xs font-bold shadow-sm cursor-not-allowed">Previous</button>
             <span className="text-xs font-semibold text-slate-600 mx-2">Page 1 of 1</span>
             <button className="px-3 py-1 bg-slate-200 text-slate-500 rounded text-xs font-bold shadow-sm cursor-not-allowed">Next</button>
             <button className="px-3 py-1 bg-slate-200 text-slate-500 rounded text-xs font-bold shadow-sm cursor-not-allowed">Last</button>
          </div>
        </div>
      )}
      
      {/* CSS for custom scrollbar embedded directly */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 8px; border: 2px solid #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}} />

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

// ✅ Custom Modern Tailwind Date Picker from previous module
function ModernDatePicker({ label, value, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };
  
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (day) => {
    const selected = new Date(year, month, day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, '0');
    const dd = String(selected.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
    setIsFocused(false);
  };

  const displayValue = value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "";

  return (
    <div className={`relative w-full select-none mt-1 ${disabled ? 'opacity-80' : ''}`} ref={containerRef}>
      <label className={`absolute left-3 transition-all duration-200 pointer-events-none font-bold uppercase tracking-wider z-10
        ${isOpen || isFocused || value ? '-top-[9px] text-[10px] bg-white px-1.5 text-blue-600' : 'top-[9px] text-sm text-slate-400 group-hover:text-slate-700'}
        ${disabled && !value ? 'top-[9px] text-sm text-slate-400' : ''}
      `}>
        {label}
      </label>
      
      <div 
        onClick={() => { if (!disabled) { setIsOpen(!isOpen); setIsFocused(true); } }}
        className={`relative flex items-center px-3.5 h-[38px] rounded-lg border transition-colors cursor-pointer
        ${disabled ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : isOpen || isFocused ? 'bg-white border-blue-500 ring-2 ring-blue-100' : 'bg-white border-slate-300'}
      `}>
        <div className={`w-full bg-transparent text-sm font-semibold focus:outline-none flex items-center
          ${disabled ? 'text-slate-500' : 'text-slate-800'}
        `}>
          {displayValue}
        </div>
        
        <div className={`ml-2 transition-colors ${isOpen || isFocused ? 'text-blue-500' : disabled ? 'text-slate-300' : 'text-slate-400'}`}>
          <CalendarIcon size={16} />
        </div>
      </div>
      
      {isOpen && !disabled && (
        <Portal top={containerRef.current?.getBoundingClientRect().bottom + window.scrollY + 4} left={containerRef.current?.getBoundingClientRect().left + window.scrollX} width={260} onClose={() => setIsOpen(false)}>
          <div className="p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-slate-800">
                {monthNames[month]} {year}
              </span>
              <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {blanksArray.map(b => <div key={`blank-${b}`} className="w-8 h-8"></div>)}
              {daysArray.map(day => {
                const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = value === currentDateStr;
                return (
                  <button
                    key={day}
                    onClick={(e) => { e.stopPropagation(); handleDateSelect(day); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all
                      ${isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'}
                    `}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
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
    <div ref={ref} style={{ position: "absolute", top, left, width, zIndex: 9999 }} className="dropdown-portal bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      {children}
    </div>
  );
}