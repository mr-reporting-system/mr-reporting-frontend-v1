import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, CheckCircle2, ChevronDown,
  Trash2, Edit, X, Save, Search, Wallet, Check,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileSpreadsheet
} from "lucide-react";
import api from "../../../services/api";

const PAGE_SIZES = [10, 20, 50];
const INPUT_CLASS = "h-[38px]"; // ✅ Restored FareRateCard standard height

export default function StateWiseDA() {
  // ─── Master Data State ───────────────────────────────────────────────────────
  const [states, setStates] = useState([]);
  const [designations, setDesignations] = useState([]);

  // ─── Form State ──────────────────────────────────────────────────────────────
  const [selectedStateIds, setSelectedStateIds] = useState([]);
  const [selectedDesigIds, setSelectedDesigIds] = useState([]);
  const [formData, setFormData] = useState({
    hqDa: "",
    exDa: "",
    outDa: "",
    mobileAllowance: "",
    netAllowance: "",
    postageStationary: "",
    postageFreight: ""
  });

  // ─── Table & UI State ────────────────────────────────────────────────────────
  const [daList, setDaList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // ─── Helper for Auth Headers ─────────────────────────────────────────────────
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` }
  });

  // ─── Fetch Initial Data ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [stateRes, desigRes, daRes] = await Promise.all([
        api.get("/api/expense/daily-allowance/states", getAuthHeaders()),
        api.get("/api/expense/daily-allowance/designations", getAuthHeaders()),
        api.get("/api/expense/daily-allowance", getAuthHeaders()) 
      ]);

      const stateData = stateRes.data?.data || stateRes.data || [];
      const desigData = desigRes.data?.data || desigRes.data || [];
      const listData = daRes.data?.data || daRes.data || [];

      const normalizedStates = Array.isArray(stateData)
  ? stateData.map((s) => ({
      id: s.id ?? s.stateId,
      stateName: s.state_name || s.stateName || s.name || "Unknown"
    }))
  : [];

setStates(normalizedStates);
      setDesignations(Array.isArray(desigData) ? desigData : []);
      setDaList(Array.isArray(listData) ? listData : []);
    } catch (err) {
      setError("Failed to load initial data from server.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTable = async () => {
    try {
      const res = await api.get("/api/expense/daily-allowance", getAuthHeaders());
      const data = res.data?.data || res.data || [];
      setDaList(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Failed to refresh table", err); }
  };

  // ─── Form Handlers ───────────────────────────────────────────────────────────
  const handleInputChange = useCallback((field, value) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleSubmit = async () => {
    setError(""); setSuccessMsg("");

    if (selectedStateIds.length === 0) return setError("Please select at least one State.");
    if (selectedDesigIds.length === 0) return setError("Please select at least one Designation.");
    if (!formData.hqDa || !formData.exDa || !formData.outDa) {
      return setError("Please fill HQ DA, EX DA, and OUT DA.");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        stateIds: selectedStateIds.map(Number),
        designationIds: selectedDesigIds.map(Number),
        hqDa: Number(formData.hqDa) || 0,
        exDa: Number(formData.exDa) || 0,
        outDa: Number(formData.outDa) || 0,
        mobileAllowance: Number(formData.mobileAllowance) || 0,
        netAllowance: Number(formData.netAllowance) || 0,
        postageStationary: Number(formData.postageStationary) || 0,
        postageFreight: Number(formData.postageFreight) || 0
      };

      await api.post("/api/expense/daily-allowance", payload, getAuthHeaders());
      setSuccessMsg("Daily Allowance created successfully!");

      setSelectedStateIds([]);
      setSelectedDesigIds([]);
      setFormData({ hqDa: "", exDa: "", outDa: "", mobileAllowance: "", netAllowance: "", postageStationary: "", postageFreight: "" });

      setTimeout(() => setSuccessMsg(""), 3500);
      refreshTable();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Action Handlers (Edit/Delete) ───────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(`/api/expense/daily-allowance/${id}`, getAuthHeaders());
      setSuccessMsg("Record deleted successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
      refreshTable();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete record.");
    }
  };

  const openEditModal = (row) => {
    setEditData({ 
      ...row,
      postageStationary: row.postageStationary || "",
      postageFreight: row.postageFreight || "" 
    });
    setEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editData.hqDa || !editData.exDa || !editData.outDa) {
      return setError("HQ DA, EX DA, and OUT DA are required.");
    }
    
    try {
      const payload = {
        hqDa: Number(editData.hqDa) || 0,
        exDa: Number(editData.exDa) || 0,
        outDa: Number(editData.outDa) || 0,
        mobileAllowance: Number(editData.mobileAllowance) || 0,
        netAllowance: Number(editData.netAllowance) || 0,
        postageStationary: Number(editData.postageStationary) || 0,
        postageFreight: Number(editData.postageFreight) || 0
      };

      await api.put(`/api/expense/daily-allowance/${editData.id}`, payload, getAuthHeaders());
      setSuccessMsg("Record updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
      setEditModal(false);
      refreshTable();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update record.");
    }
  };

  const handleExportExcel = () => {
    const headers = "State,Designation,HQ DA,EX DA,OUT DA,Mobile Allowance,Net Allowance,Special Allowance\n";
    const csvData = filteredData.map(row => 
      `${row.stateName},${row.designationName},${row.hqDa},${row.exDa},${row.outDa},${row.mobileAllowance},${row.netAllowance},${row.specialAllowance}`
    ).join("\n");
    
    const blob = new Blob([headers + csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daily_allowance_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ─── Derived Data (Fixed Mapping for "Unknown" Bug) ────────────────────────
  // Robust checking for stateName, stateId, name, and id.
  const stateOpts = states.map((s) => ({
  id: String(s.id),
  label: s.stateName
})).filter((opt) => opt.id !== "");

  const desigOpts = designations.map(d => ({ 
    id: String(d.designationId || d.id || ""), 
    label: d.designationName || d.name || "Unknown" 
  })).filter(opt => opt.id !== "");

  const filteredData = daList.filter(row => 
    (row.stateName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (row.designationName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const goToPage = p => setCurrentPage(Math.min(Math.max(1, p), totalPages));

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-400 pb-12 font-sans">
      
      {/* ══ CREATION CARD (Restored FareRateCard Design) ═════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 rounded-t-xl" />
        
        <div className="px-6 sm:px-8 pt-5 pb-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Wallet size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Daily Allowance Form</h2>
            <p className="text-xs font-medium text-slate-400">Configure allowances per state and designation</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6 bg-slate-50/40">
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-sm font-medium">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2.5 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-100 text-sm font-medium">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          {/* Form Container */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 pt-8 relative transition-all hover:border-blue-200 shadow-sm">
            <div className="absolute -top-3 left-6 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-[11px] font-bold text-blue-600 shadow-sm uppercase tracking-widest flex items-center gap-1.5">
              Allowance Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <MultiDropdown label="SELECT STATE *" options={stateOpts} selectedIds={selectedStateIds} onChange={setSelectedStateIds} />
                <MultiDropdown label="SELECT DESIGNATION *" options={desigOpts} selectedIds={selectedDesigIds} onChange={setSelectedDesigIds} />
              </div>
              
              <FloatingInput label="ENTER HQ DA *" type="number" value={formData.hqDa} onChange={(e) => handleInputChange("hqDa", e.target.value)} />
              <FloatingInput label="ENTER EX DA *" type="number" value={formData.exDa} onChange={(e) => handleInputChange("exDa", e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
               <FloatingInput label="ENTER OUT DA *" type="number" value={formData.outDa} onChange={(e) => handleInputChange("outDa", e.target.value)} />
            </div>

            <div className="pt-6 pb-2 mt-4">
              <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2 inline-block">Fix Expense Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <FloatingInput label="MOBILE ALLOWANCE" type="number" value={formData.mobileAllowance} onChange={(e) => handleInputChange("mobileAllowance", e.target.value)} />
              <FloatingInput label="NET ALLOWANCES" type="number" value={formData.netAllowance} onChange={(e) => handleInputChange("netAllowance", e.target.value)} />
              <FloatingInput label="POSTAGE / STATIONARY" type="number" value={formData.postageStationary} onChange={(e) => handleInputChange("postageStationary", e.target.value)} />
              <FloatingInput label="POSTAGE / FREIGHT" type="number" value={formData.postageFreight} onChange={(e) => handleInputChange("postageFreight", e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Create Daily Allowance
            </button>
          </div>
        </div>
      </div>

      {/* ══ DATA TABLE ═════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 items-center bg-white">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-800">Existing Daily Allowances</h3>
            <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-md">
              {filteredData.length} Total
            </span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input type="text" placeholder="Search State, Designation..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 border-2 border-slate-200 focus:border-blue-500 rounded-lg pl-4 pr-9 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all" />
              <Search size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={handleExportExcel} className="h-10 px-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg flex items-center justify-center transition-colors shadow-sm" title="Export to Excel">
              <FileSpreadsheet size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[1200px]">
            <thead className="bg-blue-600 text-white text-[11px] uppercase tracking-wider font-semibold border-b border-blue-700">
              <tr>
                <th className="py-4 px-4 text-center w-12">#</th>
                <th className="py-4 px-4">State</th>
                <th className="py-4 px-4">Designation</th>
                <th className="py-4 px-4 text-right">HQ DA</th>
                <th className="py-4 px-4 text-right">EX DA</th>
                <th className="py-4 px-4 text-right">OUT DA</th>
                <th className="py-4 px-4 text-right">Mobile All.</th>
                <th className="py-4 px-4 text-right">Net All.</th>
                <th className="py-4 px-4 text-right">Special All.</th>
                <th className="py-4 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="10" className="py-16 text-center"><Loader2 className="animate-spin inline text-blue-500" size={32} /></td></tr>
              ) : pagedData.length === 0 ? (
                <tr><td colSpan="10" className="py-12 text-center text-slate-400 font-medium">No records found.</td></tr>
              ) : pagedData.map((row, i) => (
                <tr key={row.id} className="transition-colors hover:bg-blue-50/30 bg-white">
                  <td className="py-4 px-4 text-center text-slate-400 font-medium text-xs">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-4 px-4 font-bold text-slate-700 uppercase">{row.stateName || "—"}</td>
                  <td className="py-4 px-4 font-bold text-blue-600">{row.designationName || "—"}</td>
                  <td className="py-4 px-4 text-right font-mono font-semibold text-slate-800">₹{row.hqDa || 0}</td>
                  <td className="py-4 px-4 text-right font-mono font-semibold text-slate-800">₹{row.exDa || 0}</td>
                  <td className="py-4 px-4 text-right font-mono font-semibold text-slate-800">₹{row.outDa || 0}</td>
                  <td className="py-4 px-4 text-right text-slate-600">₹{row.mobileAllowance || 0}</td>
                  <td className="py-4 px-4 text-right text-slate-600">₹{row.netAllowance || 0}</td>
                  <td className="py-4 px-4 text-right text-slate-600">₹{row.specialAllowance || 0}</td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => openEditModal(row)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95" title="Edit"><Edit size={14}/></button>
                      <button onClick={() => handleDelete(row.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95" title="Delete"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">{pagedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * pageSize, filteredData.length)}</span> of <span className="font-bold text-slate-700">{filteredData.length}</span> entries
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">First</button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Prev</button>
            <div className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white rounded shadow-sm border border-blue-600">{currentPage}</div>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
            <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Last</button>
          </div>
        </div>
      </div>

      {/* ══ EDIT MODAL ════════════════════════════════════════════════════ */}
      {editModal && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider"><Edit size={16}/> Edit Daily Allowance</h3>
              <button onClick={() => setEditModal(false)} className="text-white/70 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-5 bg-white">
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">State</label>
                  <div className={`w-full ${INPUT_CLASS} rounded-lg border-2 border-slate-200 bg-slate-50 pl-4 flex items-center text-sm font-semibold text-slate-700 mt-1`}>{editData.stateName || "—"}</div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Designation</label>
                  <div className={`w-full ${INPUT_CLASS} rounded-lg border-2 border-slate-200 bg-slate-50 pl-4 flex items-center text-sm font-semibold text-slate-700 mt-1`}>{editData.designationName || "—"}</div>
                </div>
              </div>
              
              <FloatingInput label="HQ DA *" type="number" value={editData.hqDa} onChange={e => setEditData({...editData, hqDa: e.target.value})} />
              <FloatingInput label="EX DA *" type="number" value={editData.exDa} onChange={e => setEditData({...editData, exDa: e.target.value})} />
              <FloatingInput label="OUT DA *" type="number" value={editData.outDa} onChange={e => setEditData({...editData, outDa: e.target.value})} />
              
              <FloatingInput label="MOBILE ALLOWANCE" type="number" value={editData.mobileAllowance} onChange={e => setEditData({...editData, mobileAllowance: e.target.value})} />
              <FloatingInput label="NET ALLOWANCES" type="number" value={editData.netAllowance} onChange={e => setEditData({...editData, netAllowance: e.target.value})} />
              
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <FloatingInput label="POSTAGE / STATIONARY" type="number" value={editData.postageStationary} onChange={e => setEditData({...editData, postageStationary: e.target.value})} />
                <FloatingInput label="POSTAGE / FREIGHT" type="number" value={editData.postageFreight} onChange={e => setEditData({...editData, postageFreight: e.target.value})} />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditModal(false)} className="px-6 py-2.5 border-2 border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-white transition-all active:scale-95">Cancel</button>
              <button onClick={handleEditSubmit} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm shadow-blue-100 transition-all active:scale-95">
                <Save size={16}/> Update Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helper Components (Styled identically to FareRateCard for consistency)
// ═══════════════════════════════════════════════════════════════════

const FloatingInput = React.memo(({ label, type = "text", value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(value !== "" && value !== null);
  const labelPos = hasValue || isFocused ? "-top-[9px] text-[10px] bg-white px-1" : "top-[9px] text-sm bg-transparent";
  const labelColor = hasValue || isFocused ? "text-blue-600 font-bold" : "text-slate-400 font-semibold";
  const borderCls = hasValue ? isFocused ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400" : isFocused ? "border-slate-400 ring-2 ring-slate-100" : "border-slate-300";

  return (
    <div className="relative w-full select-none mt-1">
      <input type={type} value={value || ""} onChange={onChange} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
        className={`w-full ${INPUT_CLASS} rounded-lg border-2 bg-white pl-3.5 pr-4 transition-all focus:outline-none text-sm font-semibold text-slate-800 ${borderCls}`} />
      <label className={`absolute left-3 pointer-events-none z-10 transition-all duration-200 tracking-wide uppercase ${labelPos} ${labelColor}`}>
        {label}
      </label>
    </div>
  );
});

function MultiDropdown({ label, options = [], selectedIds, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const openMenu = () => {
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
    return () => { document.removeEventListener("mousedown", close); window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [isOpen]);

  const toggle = id => onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  const selectAll = () => onChange(options.map(o => o.id));
  const clearAll = () => onChange([]);

  const hasValue = selectedIds.length > 0;
  const displayText = hasValue ? options.filter(o => selectedIds.includes(o.id)).map(o => o.label).join(", ") : "";
  
  const borderCls = hasValue ? isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400" : isOpen ? "border-slate-400 ring-2 ring-slate-100" : "border-slate-300";
  const labelColor = hasValue ? "text-blue-600 font-bold" : isOpen ? "text-slate-500 font-bold" : "text-slate-400 font-semibold";
  const labelPos = hasValue || isOpen ? "-top-[9px] text-[10px] bg-white px-1.5" : "top-[9px] text-sm bg-transparent";

  return (
    <div className="relative w-full select-none mt-1">
      <div ref={ref} onClick={openMenu} className={`w-full ${INPUT_CLASS} rounded-lg border-2 bg-white pl-3.5 pr-10 flex items-center transition-all cursor-pointer ${borderCls}`}>
        <span className={`block truncate text-sm font-semibold flex-1 min-w-0 ${hasValue ? "text-slate-800" : "text-transparent"}`}>{displayText || " "}</span>
        <div className={`absolute right-3 flex items-center gap-1 pointer-events-none transition-transform duration-200 ${hasValue ? "text-blue-500" : "text-slate-400"} ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDown size={14} />
        </div>
      </div>
      <label className={`absolute left-3 pointer-events-none z-10 transition-all duration-200 tracking-wide uppercase ${labelPos} ${labelColor}`}>{label}</label>

      {isOpen && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div className="flex border-b border-slate-100">
            <button type="button" onMouseDown={e => { e.preventDefault(); selectAll(); }} className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors">Select All</button>
            <button type="button" onMouseDown={e => { e.preventDefault(); clearAll(); }} className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Clear All</button>
          </div>
          <ul className="py-1.5 max-h-52 overflow-y-auto">
            {options.map((opt, idx) => {
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
    <div ref={ref} style={{ position: "fixed", top, left, width, zIndex: 9999 }} className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      {children}
    </div>
  );
}