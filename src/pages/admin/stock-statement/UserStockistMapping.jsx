import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, CheckCircle2, ChevronDown, Check,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users
} from "lucide-react";
import api from "../../../services/api";

const INPUT_CLASS = "h-[38px]";

export default function UserStockistMapping() {
  // ─── App State ───────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ─── Master State (Common) ───────────────────────────────────────────────────
  const [statesList, setStatesList] = useState([]);

  // ─── Left Side State (Stockist Mapping) ──────────────────────────────────────
  const [leftFilters, setLeftFilters] = useState({ stateId: "", districtIds: [] });
  const [leftDistricts, setLeftDistricts] = useState([]);
  const [stockists, setStockists] = useState([]);
  const [selectedStockistId, setSelectedStockistId] = useState(null);
  
  const [leftPage, setLeftPage] = useState(1);
  const [leftPageSize, setLeftPageSize] = useState(5);

  // ─── Right Side State (Employee Selection) ───────────────────────────────────
  const [rightFilters, setRightFilters] = useState({ stateId: "", districtIds: [] });
  const [rightDistricts, setRightDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  
  const [rightPage, setRightPage] = useState(1);
  const [rightPageSize, setRightPageSize] = useState(5);

  // ─── Helper for Auth Headers ─────────────────────────────────────────────────
  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
  }), []);

  // ─── 1. Fetch States on Mount ────────────────────────────────────────────────
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await api.get("/api/masters/states", getAuthHeaders());
        const stateData = res.data?.data || res.data || [];
        const normalizedStates = Array.isArray(stateData) ? stateData.map((s) => ({
          id: String(s.id ?? s.stateId),
          stateName: s.state_name || s.stateName || s.name || "Unknown"
        })) : [];
        setStatesList(normalizedStates.filter(opt => opt.id !== ""));
      } catch (err) { console.error("Failed to load states", err); }
    };
    fetchStates();
  }, [getAuthHeaders]);

  // ─── 2. Left Side Fetching Logic ─────────────────────────────────────────────
  useEffect(() => {
    if (leftFilters.stateId) {
      setLeftFilters(prev => ({ ...prev, districtIds: [] }));
      api.get(`/api/masters/districts?stateId=${leftFilters.stateId}`, getAuthHeaders())
        .then(res => {
          const data = res.data?.data || res.data || [];
          setLeftDistricts(Array.isArray(data) ? data.map(d => ({
            id: String(d.id ?? d.districtId), label: d.district_name || d.districtName || d.name || "Unknown"
          })) : []);
        }).catch(err => console.error(err));
    }
  }, [leftFilters.stateId, getAuthHeaders]);

  useEffect(() => {
    if (leftFilters.districtIds.length > 0) {
      api.get(`/api/masters/stockists?stateId=${leftFilters.stateId}&districtIds=${leftFilters.districtIds.join(',')}`, getAuthHeaders())
        .then(res => {
          const data = res.data?.data || res.data || [];
          setStockists(Array.isArray(data) ? data.map(s => ({
            id: String(s.id ?? s.stockistId ?? s.partyId), 
            headquarterName: s.headquarterName || s.hqName || "Unknown HQ",
            stockistName: s.stockist_name || s.stockistName || s.partyName || s.name || "Unknown"
          })) : getDummyStockists()); 
          setLeftPage(1);
        }).catch(() => setStockists(getDummyStockists()));
    } else {
      setStockists([]);
      setSelectedStockistId(null);
    }
  }, [leftFilters.districtIds, leftFilters.stateId, getAuthHeaders]);

  // ─── 3. Right Side Fetching Logic ────────────────────────────────────────────
  useEffect(() => {
    if (rightFilters.stateId) {
      setRightFilters(prev => ({ ...prev, districtIds: [] }));
      api.get(`/api/masters/districts?stateId=${rightFilters.stateId}`, getAuthHeaders())
        .then(res => {
          const data = res.data?.data || res.data || [];
          setRightDistricts(Array.isArray(data) ? data.map(d => ({
            id: String(d.id ?? d.districtId), label: d.district_name || d.districtName || d.name || "Unknown"
          })) : []);
        }).catch(err => console.error(err));
    }
  }, [rightFilters.stateId, getAuthHeaders]);

  useEffect(() => {
    if (rightFilters.districtIds.length > 0) {
      api.get(`/api/masters/employees/filter?stateId=${rightFilters.stateId}&districtId=${rightFilters.districtIds.join(',')}`, getAuthHeaders())
        .then(res => {
          const data = res.data?.data || res.data || [];
          setEmployees(Array.isArray(data) ? data.map(e => ({
            id: String(e.id ?? e.employeeId),
            headquarterName: e.headquarterName || e.hqName || "Unknown HQ",
            employeeName: e.employee_name || e.employeeName || e.name || "Unknown"
          })) : getDummyEmployees()); 
          setRightPage(1);
        }).catch(() => setEmployees(getDummyEmployees()));
    } else {
      setEmployees([]);
      setSelectedEmployeeIds([]);
    }
  }, [rightFilters.districtIds, rightFilters.stateId, getAuthHeaders]);

  // ─── 4. Handlers ─────────────────────────────────────────────────────────────
  const toggleEmployeeSelection = (id) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    );
  };

  const toggleAllEmployees = () => {
    if (selectedEmployeeIds.length === employees.length) setSelectedEmployeeIds([]);
    else setSelectedEmployeeIds(employees.map(e => e.id));
  };

  const handleMapSubmit = async () => {
    if (!selectedStockistId) return setError("Please select a Stockist to map.");
    if (selectedEmployeeIds.length === 0) return setError("Please select at least one Employee to map.");

    setIsSubmitting(true);
    setError(""); setSuccessMsg("");

    try {
      const payload = {
        stockistId: Number(selectedStockistId),
        employeeIds: selectedEmployeeIds.map(Number)
      };

      await api.post("/api/masters/user-stockist-mapping", payload, getAuthHeaders());
      
      setSuccessMsg("Stockist mapped to selected employees successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        setSelectedStockistId(null);
        setSelectedEmployeeIds([]);
      }, 4000);
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to map stockist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Dummy Data Generators ───────────────────────────────────────────────────
  const getDummyStockists = () => [
    { id: "1", headquarterName: "HARIDWAR", stockistName: "SWATI STOCKIST" },
    { id: "2", headquarterName: "HARIDWAR", stockistName: "KIRSHNA" },
    { id: "3", headquarterName: "HARIDWAR", stockistName: "AKASH STOCKIST" },
    { id: "4", headquarterName: "HARIDWAR", stockistName: "Ashu Stockist" }
  ];

  const getDummyEmployees = () => [
    { id: "1", headquarterName: "HARIDWAR", employeeName: "Swati" },
    { id: "2", headquarterName: "HARIDWAR", employeeName: "Rohan" },
    { id: "3", headquarterName: "DEHRADUN", employeeName: "Amit" }
  ];

  // ─── Pagination Logic ────────────────────────────────────────────────────────
  const leftTotalPages = Math.max(1, Math.ceil(stockists.length / leftPageSize));
  const pagedStockists = stockists.slice((leftPage - 1) * leftPageSize, leftPage * leftPageSize);

  const rightTotalPages = Math.max(1, Math.ceil(employees.length / rightPageSize));
  const pagedEmployees = employees.slice((rightPage - 1) * rightPageSize, rightPage * rightPageSize);

  const stateOpts = statesList.map(s => ({ value: s.id, label: s.stateName }));

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
            <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg border border-emerald-100 text-sm font-bold">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}
        </div>
      )}

      {/* ══ TOP FILTERS SECTION ═════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 rounded-t-xl" />
        
        {/* ✅ New Standardized Header Design */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/40">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">User-Stockist Mapping</h2>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Map stockists to employees across states and districts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Left Filter: Stockist */}
          <div className="p-6 sm:p-8 space-y-6 bg-white">
            <h3 className="text-sm font-bold text-slate-600">Filter For Stockist Selection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SingleDropdown 
                label="SELECT STATE *" options={stateOpts} value={leftFilters.stateId} 
                onSelect={(v) => setLeftFilters(prev => ({ ...prev, stateId: v }))} 
              />
              <MultiDropdown 
                label="SELECT DISTRICT *" options={leftDistricts} selectedIds={leftFilters.districtIds} 
                onChange={(v) => setLeftFilters(prev => ({ ...prev, districtIds: v }))} 
                disabled={!leftFilters.stateId} 
              />
            </div>
          </div>

          {/* Right Filter: Employee */}
          <div className="p-6 sm:p-8 space-y-6 bg-white">
            <h3 className="text-sm font-bold text-slate-600">Filter For Employee Selection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SingleDropdown 
                label="SELECT STATE *" options={stateOpts} value={rightFilters.stateId} 
                onSelect={(v) => setRightFilters(prev => ({ ...prev, stateId: v }))} 
              />
              <MultiDropdown 
                label="SELECT DISTRICT *" options={rightDistricts} selectedIds={rightFilters.districtIds} 
                onChange={(v) => setRightFilters(prev => ({ ...prev, districtIds: v }))} 
                disabled={!rightFilters.stateId} 
              />
            </div>
          </div>

        </div>
      </div>

      {/* ══ BOTTOM TABLES SECTION ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Table: Stockists */}
        {stockists.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-500">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
              <h3 className="text-base font-bold text-slate-800">Stockist's To Be Mapped</h3>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-blue-600 text-white text-[12px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4 w-20">Select</th>
                    <th className="py-3 px-4 text-left">Headquarter Name</th>
                    <th className="py-3 px-4 text-left">Stockist Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedStockists.map((row) => (
                    <tr key={row.id} 
                      className={`transition-colors cursor-pointer ${selectedStockistId === row.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                      onClick={() => setSelectedStockistId(row.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${selectedStockistId === row.id ? 'border-blue-600' : 'border-slate-300'}`}>
                            {selectedStockistId === row.id && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-left font-semibold text-slate-600 uppercase">{row.headquarterName}</td>
                      <td className="py-3 px-4 text-left font-bold text-slate-700 uppercase">{row.stockistName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Left Pagination */}
            <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Items per page:</span>
                <select value={leftPageSize} onChange={e => { setLeftPageSize(Number(e.target.value)); setLeftPage(1); }} className="bg-transparent font-bold text-slate-700 focus:outline-none">
                  <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                </select>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span>{(leftPage - 1) * leftPageSize + 1} - {Math.min(leftPage * leftPageSize, stockists.length)} of {stockists.length}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setLeftPage(1)} disabled={leftPage === 1} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronsLeft size={16}/></button>
                  <button onClick={() => setLeftPage(p => p - 1)} disabled={leftPage === 1} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronLeft size={16}/></button>
                  <button onClick={() => setLeftPage(p => p + 1)} disabled={leftPage === leftTotalPages} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronRight size={16}/></button>
                  <button onClick={() => setLeftPage(leftTotalPages)} disabled={leftPage === leftTotalPages} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronsRight size={16}/></button>
                </div>
              </div>
            </div>

            {/* Map Action Button */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button 
                onClick={handleMapSubmit} 
                disabled={isSubmitting || !selectedStockistId || selectedEmployeeIds.length === 0} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-emerald-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Map Stockiest's
              </button>
            </div>
          </div>
        )}

        {/* Right Table: Employees */}
        {employees.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-700">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
              <h3 className="text-base font-bold text-slate-800">Employees List</h3>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-blue-600 text-white text-[12px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4 w-20">
                      <div className="flex justify-center cursor-pointer" onClick={toggleAllEmployees}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selectedEmployeeIds.length === employees.length ? 'border-white bg-white' : 'border-blue-200'}`}>
                          {selectedEmployeeIds.length === employees.length && <Check size={12} className="text-blue-600 stroke-[4]" />}
                        </div>
                      </div>
                    </th>
                    <th className="py-3 px-4 text-left">Headquarter Name</th>
                    <th className="py-3 px-4 text-left">User Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedEmployees.map((row) => (
                    <tr key={row.id} 
                      className={`transition-colors cursor-pointer ${selectedEmployeeIds.includes(row.id) ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                      onClick={() => toggleEmployeeSelection(row.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selectedEmployeeIds.includes(row.id) ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                            {selectedEmployeeIds.includes(row.id) && <Check size={12} className="text-white stroke-[4]" />}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-left font-semibold text-slate-600 uppercase">{row.headquarterName}</td>
                      <td className="py-3 px-4 text-left font-bold text-slate-700">{row.employeeName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right Pagination */}
            <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Items per page:</span>
                <select value={rightPageSize} onChange={e => { setRightPageSize(Number(e.target.value)); setRightPage(1); }} className="bg-transparent font-bold text-slate-700 focus:outline-none">
                  <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                </select>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span>{(rightPage - 1) * rightPageSize + 1} - {Math.min(rightPage * rightPageSize, employees.length)} of {employees.length}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setRightPage(1)} disabled={rightPage === 1} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronsLeft size={16}/></button>
                  <button onClick={() => setRightPage(p => p - 1)} disabled={rightPage === 1} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronLeft size={16}/></button>
                  <button onClick={() => setRightPage(p => p + 1)} disabled={rightPage === rightTotalPages} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronRight size={16}/></button>
                  <button onClick={() => setRightPage(rightTotalPages)} disabled={rightPage === rightTotalPages} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronsRight size={16}/></button>
                </div>
              </div>
            </div>
            
            {/* Empty space to align bottom edges with Left Table's map button visually */}
            <div className="h-[68px] bg-slate-50 border-t border-slate-200"></div>
          </div>
        )}

      </div>
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
  const selectAll = () => onChange(options.map(o => o.id));
  const clearAll = () => onChange([]);

  const hasValue = selectedIds.length > 0;
  const displayText = hasValue ? options.filter(o => selectedIds.includes(o.id)).map(o => o.label).join(", ") : "";
  
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
              const isSel = selectedIds.includes(opt.id);
              return (
                <li key={opt.id ?? idx} onMouseDown={e => { e.preventDefault(); toggle(opt.id); }} className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-3 transition-colors ${isSel ? "bg-blue-50" : "hover:bg-slate-50"}`}>
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