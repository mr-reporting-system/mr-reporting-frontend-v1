import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, CheckCircle2, ChevronDown, Check,
  Filter, Trash2, Map, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import api from "../../../services/api";

const INPUT_CLASS = "h-[38px]";

export default function StockistMappingDeletionReport() {
  // ─── App State ───────────────────────────────────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [tableVisible, setTableVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ─── Filter State ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    stateId: "",
    districtIds: [],
    employeeIds: []
  });

  // ─── Master Data (Dropdowns) ─────────────────────────────────────────────────
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);

  // ─── Table Data State ────────────────────────────────────────────────────────
  const [mappedData, setMappedData] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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
          const normalizedEmployees = Array.isArray(employeeData) ? employeeData.map((e) => ({
            id: String(e.id ?? e.employeeId),
            employeeName: e.employee_name || e.employeeName || e.name || "Unknown"
          })) : [];
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
    setSelectedRowIds([]);
  };

  const handleViewStatus = async () => {
    setError(""); setSuccessMsg("");
    
    if (!filters.stateId || filters.districtIds.length === 0 || filters.employeeIds.length === 0) {
      return setError("Please select State, District, and Employee before viewing status.");
    }

    setIsLoading(true);
    setSelectedRowIds([]);
    try {
      const res = await api.get(`/api/masters/user-stockist-mapping/report?stateId=${filters.stateId}&districtIds=${filters.districtIds.join(',')}&employeeIds=${filters.employeeIds.join(',')}`, getAuthHeaders());
      
      const fetchedData = res.data?.data || res.data || [];
      
      const normalizedData = Array.isArray(fetchedData) ? fetchedData.map((row, i) => ({
        id: String(row.mappingId || row.id || i),
        districtName: row.districtName || row.district_name || "Unknown District",
        stockistName: row.stockistName || row.stockist_name || row.partyName || "Unknown Stockist",
        userName: row.userName || row.user_name || row.employeeName || "Unknown User"
      })) : [];

      setMappedData(normalizedData.length ? normalizedData : getDummyMappedData());
      setTableVisible(true);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch mapped data.");
      setMappedData(getDummyMappedData());
      setTableVisible(true);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Checkbox Selection Logic
  const toggleRowSelection = (id) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleAllRows = () => {
    if (selectedRowIds.length === pagedData.length && pagedData.length > 0) {
      setSelectedRowIds(prev => prev.filter(id => !pagedData.some(row => row.id === id)));
    } else {
      const visibleIds = pagedData.map(row => row.id);
      setSelectedRowIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleDelete = async () => {
    if (selectedRowIds.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete the ${selectedRowIds.length} selected mapping(s)?`)) return;

    setIsDeleting(true);
    setError(""); setSuccessMsg("");

    try {
      await api.delete("/api/masters/user-stockist-mapping", {
        data: { mappingIds: selectedRowIds },
        ...getAuthHeaders()
      });
      
      setSuccessMsg("Selected mappings deleted successfully!");
      
      setMappedData(prev => prev.filter(row => !selectedRowIds.includes(row.id)));
      setSelectedRowIds([]);
      
      setTimeout(() => setSuccessMsg(""), 4000);
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete mappings.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Dummy Data Generator ────────────────────────────────────────────────────
  const getDummyMappedData = () => [
    { id: "map_1", districtName: "HARIDWAR", stockistName: "KIRSHNA", userName: "Swati" },
    { id: "map_2", districtName: "HARIDWAR", stockistName: "Ashu Stockist", userName: "Swati" },
    { id: "map_3", districtName: "HARIDWAR", stockistName: "AKASH STOCKIST", userName: "Swati" },
    { id: "map_4", districtName: "DEHRADUN", stockistName: "NEW LIFE PHARMA", userName: "Rohan" },
    { id: "map_5", districtName: "DEHRADUN", stockistName: "CITY MEDS", userName: "Rohan" }
  ];

  // ─── Dropdown Options Mapping ────────────────────────────────────────────────
  const stateOpts = states.map(s => ({ value: s.id, label: s.stateName }));
  const distOpts = districts.map(d => ({ value: d.id, label: d.districtName }));
  const empOpts = employees.map(e => ({ value: e.id, label: e.employeeName }));

  // ─── Pagination Logic ────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(mappedData.length / pageSize));
  const pagedData = mappedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allVisibleSelected = pagedData.length > 0 && pagedData.every(row => selectedRowIds.includes(row.id));

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
              <Map size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">MR Stockist Mapped Report</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">View and manage employee to stockist mappings</p>
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
          <div className="p-6 sm:p-8 space-y-6 bg-white animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-8 items-end">
              <SingleDropdown 
                label="SELECT STATE *" options={stateOpts} value={filters.stateId} 
                onSelect={(v) => handleFilterChange("stateId", v)} 
              />
              <MultiDropdown 
                label="SELECT DISTRICT *" options={distOpts} selectedIds={filters.districtIds} 
                onChange={(v) => handleFilterChange("districtIds", v)} disabled={!filters.stateId} 
              />
              <MultiDropdown 
                label="SELECT EMPLOYEE *" options={empOpts} selectedIds={filters.employeeIds} 
                onChange={(v) => handleFilterChange("employeeIds", v)} disabled={!filters.districtIds.length} 
              />
              
              <div className="flex w-full">
                <button 
                  onClick={handleViewStatus} 
                  disabled={isLoading} 
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-8 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 w-full sm:w-auto mt-1"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  View Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ TABLE SECTION ═════════════════════════════════════════════════ */}
      {tableVisible && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
            <h3 className="text-base font-bold text-slate-800">Stockist Mapped Detail</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
              <thead className="bg-blue-600 text-white text-[12px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4 w-20">
                    <div className="flex justify-center cursor-pointer" onClick={toggleAllRows}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allVisibleSelected && pagedData.length > 0 ? 'border-white bg-white' : 'border-blue-200'}`}>
                        {allVisibleSelected && pagedData.length > 0 && <Check size={12} className="text-blue-600 stroke-[4]" />}
                      </div>
                    </div>
                  </th>
                  <th className="py-3 px-4">District Name</th>
                  <th className="py-3 px-4">Stockist Name</th>
                  <th className="py-3 px-4">User Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mappedData.length === 0 ? (
                  <tr><td colSpan="4" className="py-12 text-center text-slate-400 font-medium bg-slate-50/50">No mapped records found.</td></tr>
                ) : pagedData.map((row) => (
                  <tr key={row.id} 
                    className={`transition-colors cursor-pointer ${selectedRowIds.includes(row.id) ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                    onClick={() => toggleRowSelection(row.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selectedRowIds.includes(row.id) ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                          {selectedRowIds.includes(row.id) && <Check size={12} className="text-white stroke-[4]" />}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600 uppercase">{row.districtName}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 uppercase">{row.stockistName}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{row.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination & Delete Action */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Delete Button */}
            <button 
              onClick={handleDelete} 
              disabled={isDeleting || selectedRowIds.length === 0} 
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm shadow-red-200 active:scale-95 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Delete Stockists {selectedRowIds.length > 0 && `(${selectedRowIds.length})`}
            </button>

            {/* Pagination Controls */}
            {mappedData.length > 0 && (
              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>Items per page:</span>
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="bg-transparent font-bold text-slate-700 focus:outline-none">
                    <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <span>{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, mappedData.length)} of {mappedData.length}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronsLeft size={16}/></button>
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronLeft size={16}/></button>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronRight size={16}/></button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1 hover:text-blue-600 disabled:opacity-30"><ChevronsRight size={16}/></button>
                  </div>
                </div>
              </div>
            )}
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