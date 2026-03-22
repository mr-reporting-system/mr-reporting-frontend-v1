import React, { useState, useEffect, useRef } from "react";
import { Loader2, MapPin, CheckCircle2, AlertCircle, ChevronDown, Check, Trash2, Search, FileSpreadsheet } from "lucide-react";
import api from "../../../services/api";

export default function HierarchyManagement() {
  // ── UI State ──
  const [activeTab, setActiveTab] = useState("Update Hierarchy");
  const [error, setError] = useState("");
  const [popup, setPopup] = useState({ isOpen: false, message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  const [filterToggle, setFilterToggle] = useState(true);

  // ── Common Dropdown Data ──
  const [states, setStates] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [districts, setDistricts] = useState([]); // 🌟 NEW: To hold districts for Headquarter mapping

  // ==========================================
  // 🟢 UPDATE HIERARCHY STATES
  // ==========================================
  const [selectedStateIds, setSelectedStateIds] = useState([]);
  const [selectedDesignationId, setSelectedDesignationId] = useState("");
  const [employees, setEmployees] = useState([]); 
  const [managers, setManagers] = useState([]);   
  const [tablesVisible, setTablesVisible] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState("");

  // ==========================================
  // 🔴 DELETE HIERARCHY STATES
  // ==========================================
  const [delSelectedStateIds, setDelSelectedStateIds] = useState([]);
  const [delSelectedDesignationIds, setDelSelectedDesignationIds] = useState([]);
  const [delSelectedEmployeeIds, setDelSelectedEmployeeIds] = useState([]);
  const [delEmployees, setDelEmployees] = useState([]);
  
  // Delete Table States
  const [delHierarchyData, setDelHierarchyData] = useState([]);
  const [delTableVisible, setDelTableVisible] = useState(false);
  const [delSearchQuery, setDelSearchQuery] = useState("");
  const [delSelectedRows, setDelSelectedRows] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Initial Fetch ──
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [stRes, desRes] = await Promise.all([
        api.get("/api/masters/states"),
        api.get("/api/masters/designations") // Standard designations endpoint
      ]);
      const stData = stRes.data?.data || stRes.data || [];
      const desData = desRes.data?.data || desRes.data || [];
      
      setStates(Array.isArray(stData) ? stData : []);
      setDesignations(Array.isArray(desData) ? desData : []);
    } catch (err) {
      console.error("Failed to load dropdowns", err);
    }
  };

  // ── Fetch Districts (Headquarters) based on selected states ──
  useEffect(() => {
    const fetchDistricts = async () => {
      if (delSelectedStateIds.length === 0) {
        setDistricts([]);
        return;
      }
      try {
        // Fetch districts for all selected states concurrently
        const promises = delSelectedStateIds.map(stateId => 
          api.get(`/api/masters/districts/all?stateId=${stateId}`)
        );
        const responses = await Promise.all(promises);
        
        // Combine all districts into a single array
        const combinedDistricts = responses.flatMap(res => res.data?.data || res.data || []);
        setDistricts(combinedDistricts);
      } catch (err) {
        console.error("Failed to fetch districts", err);
      }
    };
    fetchDistricts();
  }, [delSelectedStateIds]);

  // ── Delete Hierarchy: Fetch Employees Dropdown ──
  useEffect(() => {
    if (delSelectedStateIds.length > 0 && delSelectedDesignationIds.length > 0) {
      fetchDeleteEmployees();
    } else {
      // ⚛️ Clears the employee list and selection if states/designations are deselected
      setDelEmployees([]);
      setDelSelectedEmployeeIds([]);
    }
  }, [delSelectedStateIds, delSelectedDesignationIds]);

  const fetchDeleteEmployees = async () => {
    try {
      const stateIdsString = delSelectedStateIds.join(',');
      const desigIdsString = delSelectedDesignationIds.join(',');
      
      const res = await api.get(`/api/masters/employees/filter-multi?stateIds=${stateIdsString}&designationIds=${desigIdsString}`);
      setDelEmployees(res.data?.data || res.data || []);
    } catch (e) {
      setDelEmployees([]);
    }
  };

  // ── Handlers: Update Hierarchy ──
  const handleGetEmployees = async () => {
    if (selectedStateIds.length === 0 || !selectedDesignationId) return;
    
    setError("");
    setIsLoading(true);
    setSelectedEmployeeIds([]);
    setSelectedManagerId("");

    const selectedDesigObj = designations.find(d => d.id.toString() === selectedDesignationId.toString());
    const designationLevel = selectedDesigObj?.level || "";
    const stateIdsString = selectedStateIds.join(',');

    try {
      const empRes = await api.get(`/api/masters/employees/hierarchy/employees?stateIds=${stateIdsString}&designationId=${selectedDesignationId}`);
      const empData = empRes.data?.data || empRes.data || [];
      setEmployees(Array.isArray(empData) ? empData : []);

      const mgrRes = await api.get(`/api/masters/employees/hierarchy/managers?stateIds=${stateIdsString}&level=${designationLevel}`);
      const mgrData = mgrRes.data?.data || mgrRes.data || [];
      setManagers(Array.isArray(mgrData) ? mgrData : []);
      
      setTablesVisible(true);
    } catch (err) {
      setError("Failed to load employees and managers.");
      setTablesVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapHierarchy = async () => {
    if (selectedEmployeeIds.length === 0 || !selectedManagerId) return;
    
    setError("");
    setIsMapping(true);

    try {
      const res = await api.put("/api/masters/employees/hierarchy/map", {
        employeeIds: selectedEmployeeIds,
        managerId: parseInt(selectedManagerId)
      });

      if (res.data?.success || res.status === 200) {
        setPopup({ isOpen: true, message: "Hierarchy Mapped Successfully!" });
        handleGetEmployees(); 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to map hierarchy.");
    } finally {
      setIsMapping(false);
    }
  };

  // ── Handlers: Delete Hierarchy ──
  const handleGetDeleteDetails = async () => {
    if (delSelectedEmployeeIds.length === 0) return;
    
    setError("");
    setIsLoading(true);
    setDelSelectedRows([]);

    try {
      // POST request to fetch MRs for deletion
      const res = await api.post("/api/masters/employees/hierarchy/mrs-for-deletion", {
        employeeIds: delSelectedEmployeeIds
      });
      const data = res.data?.data || res.data || [];
      setDelHierarchyData(Array.isArray(data) ? data : []);
      setDelTableVisible(true);
    } catch (err) {
      setError("Failed to load hierarchy details for selected employees.");
      setDelTableVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHierarchy = async () => {
    if (delSelectedRows.length === 0) return;
    
    setError("");
    setIsDeleting(true);

    try {
      // PUT request to remove the manager mapping
      const res = await api.put("/api/masters/employees/hierarchy/remove", { 
        employeeIds: delSelectedRows 
      });
      
      if (res.data?.success || res.status === 200) {
        setPopup({ isOpen: true, message: "Hierarchy Removed Successfully!" });
        setDelSelectedRows([]);
        handleGetDeleteDetails(); // Refresh table
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove hierarchy.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Checkbox Handlers: Update Hierarchy ──
  const toggleEmployeeRow = (id) => setSelectedEmployeeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAllEmployees = (e) => setSelectedEmployeeIds(e.target.checked ? employees.map(emp => emp.id) : []);

  // ── Checkbox Handlers: Delete Hierarchy ──
  const toggleDelRow = (id) => setDelSelectedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAllDelRows = (e, filteredData) => setDelSelectedRows(e.target.checked ? filteredData.map(item => item.id) : []);

  const handleTabChange = (val) => {
    setActiveTab(val);
    setError("");
    setTablesVisible(false);
    setDelTableVisible(false);
    setDelSelectedRows([]);
  };

  // 🌟 NEW: Helper function to resolve District/Headquarter Name
  const getDistrictName = (item) => {
    // 1. Fallback if the backend already mapped it to strings
    if (item.headquarter?.hq_name) return item.headquarter.hq_name;
    if (item.headquarter && typeof item.headquarter === 'string') return item.headquarter;
    if (item.hq_name) return item.hq_name;
    if (item.district?.district_name) return item.district.district_name;
    
    // 2. Map using the districtId and the fetched districts state
    const dId = item.districtId || item.district_id;
    if (dId) {
      const match = districts.find(d => d.id === dId);
      if (match) return match.district_name || match.name;
    }
    
    return "—";
  };

  // Frontend Filter Logic for Delete Table
  const filteredDelData = delHierarchyData.filter(item => {
    const empName = item.name || item.employee_name || "";
    const mgrName = item.reportingManager?.name || item.manager_name || "";
    const empCode = item.userCode || item.emp_code || "";
    
    return empName.toLowerCase().includes(delSearchQuery.toLowerCase()) ||
           mgrName.toLowerCase().includes(delSearchQuery.toLowerCase()) ||
           empCode.toLowerCase().includes(delSearchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-8 px-2 sm:px-0">
      
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        
        {/* ── TOP HEADER & FILTER TOGGLE ── */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-lg font-bold text-gray-800">Hierarchy Management</h2>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilterToggle(!filterToggle)}
              className={`w-10 h-5 rounded-full relative transition-colors ${filterToggle ? 'bg-blue-500/90' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${filterToggle ? 'left-5' : 'left-1'}`} />
            </button>
            <span className="text-sm font-semibold text-gray-600">Filter</span>
          </div>
        </div>

        {/* ── RADIO BUTTON TABS ── */}
        <div className="flex flex-wrap items-center gap-6 p-3 mb-6 bg-gray-50/50 rounded-lg border border-gray-100">
          {["Update Hierarchy", "Delete Hierarchy"].map(tab => (
            <label key={tab} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="hierarchyTab"
                value={tab}
                checked={activeTab === tab}
                onChange={() => handleTabChange(tab)}
                className="w-4 h-4 rounded-full border-gray-300 text-blue-500 focus:ring-blue-400 cursor-pointer"
              />
              <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab ? "text-blue-600/80" : "text-gray-500 group-hover:text-gray-700"
              }`}>
                {tab}
              </span>
            </label>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-3 py-2 text-sm rounded-md mb-4 border border-red-100 flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* ── DYNAMIC FILTERS ── */}
        {filterToggle && (
          <div className="animate-in fade-in duration-300">
            
            {/* 🟢 UPDATE HIERARCHY FORM */}
            {activeTab === "Update Hierarchy" && (
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3">
                  <MultiSelectDropdown label="SELECT STATE *" options={states} selectedIds={selectedStateIds} onChange={(newIds) => { setSelectedStateIds(newIds); setTablesVisible(false); }} />
                </div>
                <div className="w-full md:w-1/3">
                  <CustomBlueSelect label="SELECT DESIGNATION" value={selectedDesignationId} onChange={(e) => { setSelectedDesignationId(e.target.value); setTablesVisible(false); }} >
                    <option value=""></option>
                    {designations.map(d => <option key={d.id} value={d.id}>{d.designation_name || d.name}</option>)}
                  </CustomBlueSelect>
                </div>
                <button 
                  onClick={handleGetEmployees} disabled={selectedStateIds.length === 0 || !selectedDesignationId || isLoading}
                  className={`px-8 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 
                    ${(selectedStateIds.length > 0 && selectedDesignationId) ? 'bg-blue-500/90 hover:bg-blue-600/90 text-white shadow-sm active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />} Get Employee
                </button>
              </div>
            )}

            {/* 🔴 DELETE HIERARCHY FORM */}
            {activeTab === "Delete Hierarchy" && (
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/4">
                  <MultiSelectDropdown label="SELECT STATE *" options={states} selectedIds={delSelectedStateIds} onChange={(newIds) => { setDelSelectedStateIds(newIds); setDelTableVisible(false); }} />
                </div>
                <div className="w-full md:w-1/4">
                  <MultiSelectDropdown label="SELECT DESIGNATION *" options={designations} selectedIds={delSelectedDesignationIds} onChange={(newIds) => { setDelSelectedDesignationIds(newIds); setDelTableVisible(false); }} />
                </div>
                <div className="w-full md:w-1/4">
                  <MultiSelectDropdown label="SELECT EMPLOYEE *" options={delEmployees} selectedIds={delSelectedEmployeeIds} onChange={(newIds) => { setDelSelectedEmployeeIds(newIds); setDelTableVisible(false); }} disabled={delSelectedStateIds.length === 0 || delSelectedDesignationIds.length === 0} />
                </div>
                <button 
                  onClick={handleGetDeleteDetails}
                  disabled={delSelectedEmployeeIds.length === 0 || isLoading}
                  className={`px-8 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 
                    ${(delSelectedEmployeeIds.length > 0) ? 'bg-blue-500/90 hover:bg-blue-600/90 text-white shadow-sm active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />} Get Details
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* ── UPDATE HIERARCHY TABLES ── */}
      {/* ========================================== */}
      {activeTab === "Update Hierarchy" && tablesVisible && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 duration-300">
          {/* LEFT TABLE: Employees */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Employee List</h3>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-blue-500/90 text-white sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="w-12 py-3 px-4 text-center">
                      <input type="checkbox" onChange={toggleAllEmployees} checked={employees.length > 0 && selectedEmployeeIds.length === employees.length} className="w-3.5 h-3.5 rounded text-blue-800 cursor-pointer border-white focus:ring-white" />
                    </th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Name</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">State</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Designation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.length === 0 && <tr><td colSpan="4" className="py-12 text-center text-gray-400">No employees found.</td></tr>}
                  {employees.map(emp => (
                    <tr key={emp.id} className={`transition-colors hover:bg-blue-50/30 ${selectedEmployeeIds.includes(emp.id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="w-12 py-3 px-4 text-center">
                        <input type="checkbox" checked={selectedEmployeeIds.includes(emp.id)} onChange={() => toggleEmployeeRow(emp.id)} className="w-3.5 h-3.5 rounded text-blue-500 cursor-pointer border-gray-300" />
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">{emp.name || emp.employee_name || "—"}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{emp.state?.state_name || emp.state_name || emp.state || "—"}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{emp.designation?.name || emp.designation?.designation_name || emp.designation_name || emp.designation || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 border-t border-gray-100 p-3 text-center">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{selectedEmployeeIds.length} Employee(s) Selected</span>
            </div>
          </div>

          {/* RIGHT TABLE: Managers */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Managers List</h3>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar p-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-blue-500/90 text-white sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="w-16 py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider">Select</th>
                      <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Name</th>
                      <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">State</th>
                      <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Designation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {managers.length === 0 && <tr><td colSpan="4" className="py-12 text-center text-gray-400">No managers available.</td></tr>}
                    {managers.map(mgr => {
                      const displayName = `${mgr.name || mgr.employee_name || "—"} - ${mgr.designation?.name || mgr.designation?.designation_name || mgr.designation_name || "Manager"}`;
                      return (
                        <tr key={mgr.id} onClick={() => setSelectedManagerId(mgr.id)} className={`transition-colors cursor-pointer border-l-4 ${selectedManagerId === mgr.id ? 'bg-blue-50 border-blue-500' : 'border-transparent hover:bg-gray-50'}`}>
                          <td className="w-16 py-3 px-4 text-center">
                            <input type="radio" name="managerSelect" checked={selectedManagerId === mgr.id} onChange={() => setSelectedManagerId(mgr.id)} className="w-3.5 h-3.5 text-blue-500 cursor-pointer border-gray-300 focus:ring-blue-500" />
                          </td>
                          <td className="py-3 px-4 text-gray-700 font-medium">{displayName}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{mgr.state?.state_name || mgr.state_name || mgr.state || "—"}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{mgr.designation?.name || mgr.designation?.designation_name || mgr.designation_name || mgr.designation || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <button 
                onClick={handleMapHierarchy} disabled={selectedEmployeeIds.length === 0 || !selectedManagerId || isMapping}
                className={`px-6 py-3 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto
                  ${(selectedEmployeeIds.length > 0 && selectedManagerId) ? 'bg-blue-500/90 hover:bg-blue-600/90 text-white shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {isMapping ? <Loader2 size={16} className="animate-spin" /> : "Map Hierarchy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ── DELETE HIERARCHY TABLE ── */}
      {/* ========================================== */}
      {activeTab === "Delete Hierarchy" && delTableVisible && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-500 text-white rounded-t-xl">
             <h3 className="font-bold text-sm tracking-wide">Manager Hierarchy List</h3>
          </div>

          <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 border-b border-gray-100">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="SEARCH..."
                value={delSearchQuery}
                onChange={(e) => setDelSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            
            
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-blue-500 text-white sticky top-0">
                <tr>
                  <th className="w-12 py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      onChange={(e) => toggleAllDelRows(e, filteredDelData)} 
                      checked={filteredDelData.length > 0 && delSelectedRows.length === filteredDelData.length} 
                      className="w-3.5 h-3.5 rounded text-teal-800 cursor-pointer border-white focus:ring-white" 
                    />
                  </th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">S.N.</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">State</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Headquarter</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Employee Name</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Emp Code</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Designation</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Manager Name</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Manager Designation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredDelData.length === 0 ? (
                  <tr><td colSpan="9" className="py-12 text-center text-gray-400">No hierarchy records found.</td></tr>
                ) : (
                  filteredDelData.map((item, index) => (
                    <tr key={item.id} className={`transition-colors hover:bg-teal-50/30 ${delSelectedRows.includes(item.id) ? 'bg-teal-50/50' : ''}`}>
                      <td className="py-3 px-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={delSelectedRows.includes(item.id)} 
                          onChange={() => toggleDelRow(item.id)} 
                          className="w-3.5 h-3.5 rounded text-teal-500 cursor-pointer border-gray-300 focus:ring-teal-500" 
                        />
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{index + 1}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{item.state?.state_name || item.state_name || item.state || "—"}</td>
                      
                      {/* 🌟 FIXED: Mapped Headquarter name dynamically */}
                      <td className="py-3 px-4 text-gray-600 text-xs">{getDistrictName(item)}</td>
                      
                      <td className="py-3 px-4 text-gray-800 font-medium">{item.name || item.employee_name || "—"}</td>
                      <td className="py-3 px-4 text-blue-600 font-bold text-xs">{item.userCode || item.emp_code || "—"}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{item.designation?.name || item.designation?.designation_name || item.designation_name || item.designation || "—"}</td>
                      <td className="py-3 px-4 text-teal-600 font-medium">{item.reportingManager?.name || item.manager_name || "—"}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{item.reportingManager?.designation?.name || item.reportingManager?.designation?.designation_name || item.manager_designation || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-5 border-t border-gray-100 bg-gray-50">
            <button 
              onClick={handleDeleteHierarchy}
              disabled={delSelectedRows.length === 0 || isDeleting}
              className={`px-6 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 
                ${(delSelectedRows.length > 0) ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
              Delete ({delSelectedRows.length})
            </button>
          </div>

        </div>
      )}

      {/* 🌟 SUCCESS POPUP 🌟 */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full mx-4 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 border-2 border-blue-100 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-blue-500/80" strokeWidth={3} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-6">{popup.message}</h3>
            <button onClick={() => setPopup({ isOpen: false, message: "" })} className="bg-blue-500/90 hover:bg-blue-600/90 text-white w-full py-2.5 rounded-lg font-bold shadow-sm transition-all active:scale-95">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable Components ───

function CustomBlueSelect({ label, value, onChange, disabled, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const options = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return null;
    return { value: child.props.value, label: child.props.children };
  }).filter(Boolean);
  const selectedOption = options.find(opt => opt.value == value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full group select-none">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full rounded-md border px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-all relative z-10
          ${disabled ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : 'border-gray-300 bg-white hover:border-blue-400/60'}
          ${isOpen ? '!border-blue-500/80 ring-2 ring-blue-50' : ''}`}
      >
        <span className={`block truncate ${selectedOption?.value ? 'text-gray-900' : 'text-transparent'}`}>
          {selectedOption?.label || " "}
        </span>
        <ChevronDown size={16} className={`${disabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-blue-400/80'} ${isOpen ? '!text-blue-500/80 rotate-180' : ''} transition-transform`} />
      </div>
      <label className={`absolute left-2.5 px-1 transition-all duration-200 pointer-events-none z-20
          ${value || isOpen ? '-top-2 text-[10px] font-bold text-blue-500/80 bg-white' : 'top-3 text-sm text-gray-400 bg-transparent'}
          ${disabled && '!text-gray-300'}`}>
        {label}
      </label>
      {isOpen && !disabled && (
        <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-md shadow-lg z-[110] max-h-52 overflow-y-auto">
          <ul className="py-1">
            {options.map((opt, idx) => opt.value !== "" && (
              <li key={idx} onClick={() => { onChange({ target: { value: opt.value } }); setIsOpen(false); }} className={`px-3 py-2.5 text-xs cursor-pointer transition-colors ${value == opt.value ? 'bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-500/80' : 'text-gray-600 hover:bg-blue-500 hover:text-white'}`}>
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({ label, options, selectedIds, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = selectedIds.length > 0 
    ? options.filter(o => selectedIds.includes(o.id)).map(o => o.state_name || o.designation_name || o.name || o.employee_name).join(", ")
    : "";

  return (
    <div ref={dropdownRef} className="relative w-full group select-none">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full rounded-md border px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-all relative z-10
          ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 bg-white hover:border-blue-400/60'}
          ${isOpen ? '!border-blue-500/80 ring-2 ring-blue-50' : ''}`}
      >
        <span className={`block truncate ${displayValue ? 'text-gray-900' : 'text-transparent'}`}>
          {displayValue || " "}
        </span>
        <div className={`flex items-center transition-colors duration-200 ${disabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-blue-400/80'} ${isOpen ? '!text-blue-500/80' : ''}`}>
          <MapPin size={16} strokeWidth={2} className="mr-1.5 opacity-60" />
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      <label className={`absolute left-2.5 px-1 transition-all duration-200 pointer-events-none z-20
          ${displayValue || isOpen ? '-top-2 text-[10px] font-bold text-blue-500/80 bg-white' : 'top-3 text-sm text-gray-400 bg-transparent'}
          ${disabled && '!text-gray-400'}`}>
        {label}
      </label>
      {isOpen && !disabled && (
        <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-md shadow-xl z-[110] overflow-hidden flex flex-col">
          <div className="flex border-b border-gray-200">
            <button onClick={(e) => { e.stopPropagation(); onChange(options.map(o => o.id)); }} className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 text-center">Select All</button>
            <button onClick={(e) => { e.stopPropagation(); onChange([]); }} className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 text-center">Deselect All</button>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1 custom-scrollbar">
            {options.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              return (
                <li key={opt.id} onClick={(e) => { 
                  e.stopPropagation(); 
                  onChange(isSelected ? selectedIds.filter(id => id !== opt.id) : [...selectedIds, opt.id]); 
                }} className="px-3 py-2.5 text-xs cursor-pointer hover:bg-blue-50 flex items-center gap-3">
                  <input type="checkbox" checked={isSelected} readOnly className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 pointer-events-none" />
                  <span className={`${isSelected ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                    {opt.state_name || opt.designation_name || opt.name || opt.employee_name}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}