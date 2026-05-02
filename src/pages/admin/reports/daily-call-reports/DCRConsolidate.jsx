import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, ChevronDown, Filter, FileSpreadsheet,
  Printer, Download, Eye, CalendarDays, ClipboardList, Check
} from "lucide-react";
import api from "../../../../services/api";

const INPUT_CLASS = "h-[38px]";

export default function DCRConsolidate() {
  // ─── UI State ────────────────────────────────────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [tableVisible, setTableVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── Filter State ────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState("Geographical"); // Geographical | Hierarchical
  const [filters, setFilters] = useState({
    geoType: "State", // State | Headquarter
    hierType: "Employee Wise", // Employee Wise
    stateIds: [],
    districtIds: [],
    status: "Active",
    designationIds: [],
    employeeIds: [],
    fromDate: "",
    toDate: ""
  });

  // ─── Master Data (Dropdowns) ─────────────────────────────────────────────────
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);

  // ─── Report Data State ───────────────────────────────────────────────────────
  const [reportData, setReportData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // ─── Drill-down (Secondary Table) State ──────────────────────────────────────
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // ─── Helper for Auth Headers ─────────────────────────────────────────────────
  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
  }), []);

  // ─── Data Fetching ───────────────────────────────────────────────────────────
  
  // 1. Fetch States & Designations on Mount
  useEffect(() => {
    const fetchInitialMasters = async () => {
      try {
        const [stateRes, desigRes] = await Promise.all([
          api.get("/api/masters/states", getAuthHeaders()),
          api.get("/api/masters/designations/hierarchy", getAuthHeaders()) // ✅ Updated to hierarchy endpoint
        ]);
        
        const stateData = stateRes.data?.data || stateRes.data || [];
        setStates(Array.isArray(stateData) ? stateData.map(s => ({
          id: String(s.id ?? s.stateId), label: s.state_name || s.stateName || s.name || "Unknown"
        })).filter(opt => opt.id !== "") : []);

        const desigData = desigRes.data?.data || desigRes.data || [];
        setDesignations(Array.isArray(desigData) ? desigData.map(d => ({
          id: String(d.id ?? d.designationId), label: d.designation_name || d.designationName || d.name || "Unknown"
        })).filter(opt => opt.id !== "") : []);
      } catch (err) { console.error("Failed to load initial masters", err); }
    };
    fetchInitialMasters();
  }, [getAuthHeaders]);

  // 2. Fetch Districts (Geographical Mode)
  useEffect(() => {
    if (viewMode === "Geographical" && filters.geoType === "Headquarter" && filters.stateIds.length > 0) {
      const query = filters.stateIds.map(id => `stateIds=${id}`).join('&');
      // ✅ Updated API to /by-states
      api.get(`/api/masters/districts/by-states?${query}`, getAuthHeaders())
        .then(res => {
          const data = res.data?.data || res.data || [];
          setDistricts(Array.isArray(data) ? data.map(d => ({
            id: String(d.id ?? d.districtId), label: d.district_name || d.districtName || d.name || "Unknown"
          })) : []);
        }).catch(err => console.error(err));
    } else {
      setDistricts([]);
    }
  }, [filters.stateIds, filters.geoType, viewMode, getAuthHeaders]);

  // 3. Fetch Employees (Hierarchical Mode)
  useEffect(() => {
    if (viewMode === "Hierarchical" && filters.designationIds.length > 0) {
      const query = filters.designationIds.map(id => `designationIds=${id}`).join('&');
      // TODO: Replace with the new Employee API once provided by the backend
      api.get(`/api/masters/employees/filter?${query}`, getAuthHeaders())
        .then(res => {
          const data = res.data?.data || res.data || [];
          setEmployees(Array.isArray(data) ? data.map(e => {
            const name = e.employee_name || e.employeeName || e.name || "Unknown";
            const desig = e.designation_name || e.designationName || e.designation || "";
            return { id: String(e.id ?? e.employeeId), label: desig ? `${name}-(${desig})` : name };
          }) : []);
        }).catch(err => console.error(err));
    } else {
      setEmployees([]);
    }
  }, [filters.designationIds, viewMode, getAuthHeaders]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setTableVisible(false);
    setSelectedEmployee(null);
  };

  const handleGenerateReport = async () => {
    setError("");
    setSelectedEmployee(null);
    setDetailData(null);

    // Validation
    if (!filters.fromDate || !filters.toDate) return setError("Please select From Date and To Date.");
    if (viewMode === "Geographical") {
      if (filters.stateIds.length === 0) return setError("Please select at least one State.");
      if (filters.geoType === "Headquarter" && filters.districtIds.length === 0) return setError("Please select at least one District.");
    } else {
      if (filters.designationIds.length === 0) return setError("Please select at least one Designation.");
      if (filters.employeeIds.length === 0) return setError("Please select at least one Employee.");
    }

    setIsLoading(true);
    try {
      const payload = {
        filterMode: viewMode.toUpperCase(),
        scopeType: viewMode === "Geographical" ? filters.geoType : filters.hierType,
        status: filters.status,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      };

      if (viewMode === "Geographical") {
        payload.stateIds = filters.stateIds.map(Number);
        payload.districtIds = filters.districtIds.map(Number);
      } else {
        payload.designationIds = filters.designationIds.map(Number);
        payload.employeeIds = filters.employeeIds.map(Number);
      }

      const res = await api.post(`/api/report-analysis/dcr-consolidate/summary`, payload, getAuthHeaders());
      
      const fetchedData = res.data?.data || res.data || [];
      const dataRows = Array.isArray(fetchedData) ? fetchedData : fetchedData.rows || [];
      
      const normalizedData = dataRows.map((row, i) => ({
        id: String(row.id || row.employeeId || i),
        headquarter: row.headquarter || row.headquarterName || "Unknown",
        empCode: row.empCode || row.employeeCode || "-",
        employeeName: row.employeeName || row.userName || "Unknown",
        managerName: row.managerName || row.manager || "-",
        designation: row.designation || row.designationName || "-",
        doj: row.doj || row.dateOfJoining || "---",
        doc: row.doc || row.dateOfConfirmation || "---",
        mobile: row.mobile || row.mobileNo || "-",
        lastDcr: row.lastDcr || row.lastSubmittedDcr || "-",
        totalDcr: Number(row.totalDcr) || 0,
        docCalls: Number(row.docCalls || row.inPersonDoctorCallCount) || 0,
        docPob: Number(row.docPob || row.doctorPob) || 0,
        chemCalls: Number(row.chemCalls || row.chemistMetCount) || 0,
        stockCalls: Number(row.stockCalls || row.stockistMetCount) || 0,
        totalMet: Number(row.totalMet || row.totalProviderMet) || 0,
        totalPob: Number(row.totalPob) || 0
      }));

      setReportData(normalizedData);
      setTableVisible(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch report data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeClick = async (emp) => {
    setSelectedEmployee(emp);
    setDetailData(null);
    setIsDetailLoading(true);
    
    try {
      const res = await api.get(`/api/report-analysis/dcr-consolidate/detail/${emp.id}?fromDate=${filters.fromDate}&toDate=${filters.toDate}`, getAuthHeaders());
      const data = res.data?.data || res.data || {};
      
      setDetailData({
        attendance: data.attendance || [],
        calls: data.calls || [],
        logs: data.logs || []
      });

      setTimeout(() => {
        document.getElementById('drilldown-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err) {
      console.error("Failed to load details", err);
      setDetailData({ attendance: [], calls: [], logs: [] });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const filteredReportData = reportData.filter(row => 
    row.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    row.headquarter.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.empCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-400 pb-12 font-sans">
      
      {error && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 flex items-center gap-2.5 text-red-600 text-sm font-bold">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ══ FILTER SECTION ═════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 rounded-t-xl" />
        
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
              <ClipboardList size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">DCR Consolidate Summary</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Generate daily call reports by geography or hierarchy</p>
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
            
            <div className="flex items-center gap-6 mb-8 pb-4 border-b border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${viewMode === 'Geographical' ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                  {viewMode === 'Geographical' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <span className={`text-sm font-bold ${viewMode === 'Geographical' ? 'text-slate-800' : 'text-slate-500'}`}>Geographical</span>
                <input type="radio" className="hidden" checked={viewMode === 'Geographical'} onChange={() => { setViewMode('Geographical'); setFilters(prev => ({...prev, stateIds: [], districtIds: []})); }} />
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${viewMode === 'Hierarchical' ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                  {viewMode === 'Hierarchical' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <span className={`text-sm font-bold ${viewMode === 'Hierarchical' ? 'text-slate-800' : 'text-slate-500'}`}>Hierarchical</span>
                <input type="radio" className="hidden" checked={viewMode === 'Hierarchical'} onChange={() => { setViewMode('Hierarchical'); setFilters(prev => ({...prev, designationIds: [], employeeIds: []})); }} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-8">
              
              {viewMode === "Geographical" && (
                <>
                  <SingleDropdown label="SELECT TYPE *" options={[{value:"State", label:"State"}, {value:"Headquarter", label:"Headquarter"}]} value={filters.geoType} onSelect={v => handleFilterChange("geoType", v)} />
                  <MultiDropdown label="SELECT STATE *" options={states} selectedIds={filters.stateIds} onChange={v => handleFilterChange("stateIds", v)} />
                  {filters.geoType === "Headquarter" && (
                    <MultiDropdown label="SELECT DISTRICT *" options={districts} selectedIds={filters.districtIds} onChange={v => handleFilterChange("districtIds", v)} disabled={!filters.stateIds.length} />
                  )}
                  <SingleDropdown label="SELECT STATUS *" options={[{value:"Active", label:"Active"}, {value:"Inactive", label:"Inactive"}]} value={filters.status} onSelect={v => handleFilterChange("status", v)} />
                </>
              )}

              {viewMode === "Hierarchical" && (
                <>
                  <SingleDropdown label="SELECT TYPE *" options={[{value:"Employee Wise", label:"Employee Wise"}]} value={filters.hierType} onSelect={v => handleFilterChange("hierType", v)} />
                  <SingleDropdown label="SELECT STATUS *" options={[{value:"Active", label:"Active"}, {value:"Inactive", label:"Inactive"}]} value={filters.status} onSelect={v => handleFilterChange("status", v)} />
                  <MultiDropdown label="SELECT DESIGNATION *" options={designations} selectedIds={filters.designationIds} onChange={v => handleFilterChange("designationIds", v)} />
                  <MultiDropdown label="SELECT EMPLOYEE *" options={employees} selectedIds={filters.employeeIds} onChange={v => handleFilterChange("employeeIds", v)} disabled={!filters.designationIds.length} />
                </>
              )}

              <DateInput label="FROM DATE *" value={filters.fromDate} onChange={v => handleFilterChange("fromDate", v)} />
              <DateInput label="TO DATE *" value={filters.toDate} onChange={v => handleFilterChange("toDate", v)} />
              
              <div className="md:col-span-3 lg:col-span-4 flex mt-2">
                <button 
                  onClick={handleGenerateReport} 
                  disabled={isLoading} 
                  className={`flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white ${INPUT_CLASS} px-8 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50`}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ PRIMARY REPORT TABLE ════════════════════════════════════════════ */}
      {tableVisible && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
            <h3 className="text-base font-bold text-slate-800">DCR Consolidate Report</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <button className="h-[34px] px-4 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-1.5"><FileSpreadsheet size={14}/> CSV</button>
                <button className="h-[34px] px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-1.5"><Printer size={14}/> Print</button>
                <button className="h-[34px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-1.5"><Download size={14}/> Excel</button>
              </div>
              <input 
                type="text" placeholder="Search Records..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[34px] px-3 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse min-w-[2000px]">
              <thead className="bg-blue-600 text-white text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4 border-r border-blue-500">S.No.</th>
                  <th className="py-3 px-4 border-r border-blue-500">Headquarter</th>
                  <th className="py-3 px-4 border-r border-blue-500">Employee Code</th>
                  <th className="py-3 px-4 border-r border-blue-500">Employee Name</th>
                  <th className="py-3 px-4 border-r border-blue-500">Manager Name</th>
                  <th className="py-3 px-4 border-r border-blue-500">Designation</th>
                  <th className="py-3 px-4 border-r border-blue-500">Date Of Joining</th>
                  <th className="py-3 px-4 border-r border-blue-500">Date Of Confirmation</th>
                  <th className="py-3 px-4 border-r border-blue-500">Mobile</th>
                  <th className="py-3 px-4 border-r border-blue-500">Last Submitted DCR</th>
                  <th className="py-3 px-4 border-r border-blue-500">Total DCR</th>
                  <th className="py-3 px-4 border-r border-blue-500">In Person Doctor Call Count</th>
                  <th className="py-3 px-4 border-r border-blue-500">Doctor POB</th>
                  <th className="py-3 px-4 border-r border-blue-500">Chemist Met Count</th>
                  <th className="py-3 px-4 border-r border-blue-500">Stockist Met Count</th>
                  <th className="py-3 px-4 border-r border-blue-500">Total Provider Met</th>
                  <th className="py-3 px-4 border-r border-blue-500">Total POB</th>
                  <th className="py-3 px-4">View DCR Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReportData.length === 0 ? (
                  <tr><td colSpan="18" className="py-12 text-slate-500 font-medium">No records found.</td></tr>
                ) : filteredReportData.map((row, i) => (
                  <tr key={row.id} className={`transition-colors ${selectedEmployee?.id === row.id ? 'bg-blue-50' : 'hover:bg-slate-50 bg-white'}`}>
                    <td className="py-2.5 px-4 text-slate-500 border-r border-slate-200">{i + 1}</td>
                    <td className="py-2.5 px-4 text-slate-700 font-semibold border-r border-slate-200">{row.headquarter}</td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200">{row.empCode}</td>
                    <td className="py-2.5 px-4 border-r border-slate-200">
                      <button onClick={() => handleEmployeeClick(row)} className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none">
                        {row.employeeName}
                      </button>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200">{row.managerName}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-semibold border-r border-slate-200">{row.designation}</td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200">{row.doj}</td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200">{row.doc}</td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200">{row.mobile}</td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200">{row.lastDcr}</td>
                    <td className="py-2.5 px-4 text-slate-800 font-bold border-r border-slate-200">{row.totalDcr}</td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200">{row.docCalls}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono border-r border-slate-200">{Number(row.docPob).toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200">{row.chemCalls}</td>
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200">{row.stockCalls}</td>
                    <td className="py-2.5 px-4 text-slate-800 font-bold border-r border-slate-200">{row.totalMet}</td>
                    <td className="py-2.5 px-4 text-blue-700 font-mono font-bold border-r border-slate-200">{Number(row.totalPob).toFixed(2)}</td>
                    <td className="py-2.5 px-4">
                      <button onClick={() => handleEmployeeClick(row)} className="flex items-center justify-center gap-1.5 text-red-500 hover:text-red-700 font-bold text-xs transition-colors mx-auto focus:outline-none">
                        <Eye size={14}/> View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Showing {filteredReportData.length > 0 ? 1 : 0} to {filteredReportData.length} of {filteredReportData.length} entries
          </div>
        </div>
      )}

      {/* ══ SECONDARY TABLE (Drill-down DCR Date Wise Report) ═══════════════ */}
      {selectedEmployee && (
        <div id="drilldown-section" className="bg-white rounded-xl shadow-md border border-blue-200 overflow-hidden animate-in slide-in-from-bottom-8 duration-700 mt-8">
          
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <h3 className="text-base font-bold text-slate-800">DCR Date Wise Report <span className="text-blue-600 ml-2">({selectedEmployee.employeeName})</span></h3>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded"><div className="w-3 h-3 bg-red-100 border border-red-300 rounded-sm"></div> Deviated</span>
              <button className="w-8 h-8 rounded border border-blue-200 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-colors"><Printer size={16}/></button>
              <button className="w-8 h-8 rounded border border-emerald-200 text-emerald-600 flex items-center justify-center hover:bg-emerald-50 transition-colors"><FileSpreadsheet size={16}/></button>
            </div>
          </div>

          {isDetailLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : detailData ? (
            <>
              <div className="bg-amber-300 text-amber-900 font-bold text-xs uppercase tracking-widest py-2 text-center shadow-inner">
                DCR Delayed Status
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-slate-50">
                
                {/* Left: Attendance Details */}
                <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4 border-r border-blue-500">Attendance Details</th>
                        <th className="py-2.5 px-4 w-24 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailData.attendance?.length > 0 ? detailData.attendance.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-4 text-slate-600 font-medium border-r border-slate-100">{item.label || item.name}</td>
                          <td className="py-2 px-4 text-slate-800 font-bold text-center bg-slate-50/50">{item.total || item.value || 0}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="2" className="py-4 text-center text-slate-400">No attendance data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Right: Call Details */}
                <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4 border-r border-blue-500">Call Details</th>
                        <th className="py-2.5 px-4 w-24 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailData.calls?.length > 0 ? detailData.calls.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-4 text-slate-600 font-medium border-r border-slate-100">{item.label || item.name}</td>
                          <td className="py-2 px-4 text-slate-800 font-bold font-mono text-center bg-slate-50/50">{item.total || item.value || 0}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="2" className="py-4 text-center text-slate-400">No call data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Massive Daily Log Table */}
              <div className="overflow-x-auto p-4 bg-white border-t border-slate-200">
                <table className="w-full text-xs text-center border-collapse min-w-[2800px]">
                  <thead className="bg-blue-600 text-white font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-3 border-r border-blue-500">S.No.</th>
                      <th className="py-3 px-3 border-r border-blue-500">Date</th>
                      <th className="py-3 px-3 border-r border-blue-500">Name</th>
                      <th className="py-3 px-3 border-r border-blue-500">Manager Name</th>
                      <th className="py-3 px-3 border-r border-blue-500">Working Status</th>
                      <th className="py-3 px-3 border-r border-blue-500">Reported From</th>
                      <th className="py-3 px-3 border-r border-blue-500">Day Start</th>
                      <th className="py-3 px-3 border-r border-blue-500">Day End</th>
                      <th className="py-3 px-3 border-r border-blue-500">First Call Time</th>
                      <th className="py-3 px-3 border-r border-blue-500">Last Call Time</th>
                      <th className="py-3 px-3 border-r border-blue-500">Area</th>
                      <th className="py-3 px-3 border-r border-blue-500">Joint Work With</th>
                      <th className="py-3 px-3 border-r border-blue-500">Total Providers Met</th>
                      <th className="py-3 px-3 border-r border-blue-500">Listed DoctorMet</th>
                      <th className="py-3 px-3 border-r border-blue-500">UnListed DoctorMet</th>
                      <th className="py-3 px-3 border-r border-blue-500">Total DoctorMet</th>
                      <th className="py-3 px-3 border-r border-blue-500">Listed Doctor POB</th>
                      <th className="py-3 px-3 border-r border-blue-500">UnListed Doctor POB</th>
                      <th className="py-3 px-3 border-r border-blue-500">Total Doctor POB</th>
                      <th className="py-3 px-3 border-r border-blue-500">Listed Chemist Met</th>
                      <th className="py-3 px-3">UnListed Chemist Met</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {detailData.logs?.length > 0 ? detailData.logs.map((log, idx) => (
                      <tr key={idx} className={`hover:bg-blue-50 transition-colors ${log.deviated ? 'bg-red-50/50' : ''}`}>
                        <td className="py-3 px-3 border-r border-slate-200 text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3 border-r border-slate-200 text-blue-600 font-bold whitespace-nowrap">{log.date}</td>
                        <td className="py-3 px-3 border-r border-slate-200 text-slate-700 font-medium">{log.name || log.employeeName}</td>
                        <td className="py-3 px-3 border-r border-slate-200 text-slate-600">{log.manager || log.managerName}</td>
                        <td className={`py-3 px-3 border-r border-slate-200 font-bold ${log.status === 'Leave' ? 'text-red-500' : 'text-slate-600'}`}>{log.status || log.workingStatus}</td>
                        <td className="py-3 px-3 border-r border-slate-200 text-slate-500">{log.reportFrom || log.reportedFrom}</td>
                        <td className="py-3 px-3 border-r border-slate-200 text-slate-600 whitespace-nowrap">{log.start || log.dayStart}</td>
                        <td className="py-3 px-3 border-r border-slate-200 text-slate-600 whitespace-nowrap">{log.end || log.dayEnd}</td>
                        <td className="py-3 px-3 border-r border-slate-200">{log.firstCall || log.firstCallTime}</td>
                        <td className="py-3 px-3 border-r border-slate-200">{log.lastCall || log.lastCallTime}</td>
                        <td className="py-3 px-3 border-r border-slate-200">{log.area}</td>
                        <td className="py-3 px-3 border-r border-slate-200">{log.jointWork || log.jointWorkWith}</td>
                        <td className="py-3 px-3 border-r border-slate-200 font-bold">{log.totalProv || log.totalProvidersMet || 0}</td>
                        <td className="py-3 px-3 border-r border-slate-200">{log.listDoc || log.listedDoctorMet || 0}</td>
                        <td className="py-3 px-3 border-r border-slate-200">{log.unlistDoc || log.unlistedDoctorMet || 0}</td>
                        <td className="py-3 px-3 border-r border-slate-200">{log.totDoc || log.totalDoctorMet || 0}</td>
                        <td className="py-3 px-3 border-r border-slate-200 font-mono">{Number(log.listDocPob || log.listedDoctorPob || 0).toFixed(2)}</td>
                        <td className="py-3 px-3 border-r border-slate-200 font-mono">{Number(log.unlistDocPob || log.unlistedDoctorPob || 0).toFixed(2)}</td>
                        <td className="py-3 px-3 border-r border-slate-200 font-mono">{Number(log.totDocPob || log.totalDoctorPob || 0).toFixed(2)}</td>
                        <td className="py-3 px-3 border-r border-slate-200">{log.listChem || log.listedChemistMet || 0}</td>
                        <td className="py-3 px-3">{log.unlistChem || log.unlistedChemistMet || 0}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="21" className="py-8 text-slate-500 font-medium">No log details available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

        </div>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════

function DateInput({ label, value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(value);
  const labelPos = hasValue || isFocused ? "-top-[9px] text-[10px] bg-white px-1.5" : "top-[9px] text-sm bg-transparent";
  const labelColor = hasValue || isFocused ? "text-blue-600 font-bold" : "text-slate-400 font-semibold";
  const borderCls = hasValue ? isFocused ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400" : isFocused ? "border-slate-400 ring-2 ring-slate-100" : "border-slate-300";

  return (
    <div className="relative w-full mt-1">
      <div className={`relative w-full ${INPUT_CLASS} rounded-lg border bg-white transition-all ${borderCls}`}>
        <input 
          type="date" value={value} 
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
          className={`w-full h-full bg-transparent px-3.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-0 ${!hasValue ? 'text-transparent' : ''}`}
        />
        {!hasValue && !isFocused && <CalendarDays size={16} className="absolute right-3.5 top-[10px] text-slate-400 pointer-events-none" />}
      </div>
      <label className={`absolute left-3 pointer-events-none z-10 transition-all duration-200 tracking-wide uppercase ${labelPos} ${labelColor}`}>
        {label}
      </label>
    </div>
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