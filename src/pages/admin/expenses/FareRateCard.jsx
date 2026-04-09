import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, CheckCircle2, ChevronDown,
  Briefcase, Plus, Trash2, Edit, X, Save, Search,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MapPin
} from "lucide-react";
import api from "../../../services/api";

const PAGE_SIZES = [10, 20, 50];
const INPUT_CLASS = "h-[38px]";

const ALLOWANCE_OPTIONS = [
  { value: "KM Wise", label: "KM Wise" },
  { value: "Lumsum",  label: "Lumsum" }
];

const APPLICABLE_OPTIONS = [
  { value: "hq", label: "HQ" },
  { value: "ex", label: "EX" },
  { value: "out", label: "OUT" }
];

const DEFAULT_FORM = { 
  id: Date.now(), 
  fromDistance: "", 
  toDistance: "", 
  allowance: "", 
  applicableTo: "", 
  taPerKm: "", 
  frcCode: "", 
  description: "" 
};

export default function FareRateCard() {
  // ─── Master Data State ───────────────────────────────────────────────────────
  const [designations, setDesignations] = useState([]);
  
  // ─── Form State ──────────────────────────────────────────────────────────────
  const [selectedDesigIds, setSelectedDesigIds] = useState([]);
  const [forms, setForms] = useState([{ ...DEFAULT_FORM }]);

  // ─── Table & UI State ────────────────────────────────────────────────────────
  const [frcList, setFrcList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // ─── Fetch Initial Data ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // ✅ Updated to Shubham's GET endpoints
      const [desigRes, frcRes] = await Promise.all([
        api.get("/api/expense/frc/designations"),
        api.get("/api/expense/frc") 
      ]);
      
      const desigData = desigRes.data?.data || desigRes.data || [];
      setDesignations(Array.isArray(desigData) ? desigData : []);
      
      const frcData = frcRes.data?.data || frcRes.data || [];
      setFrcList(Array.isArray(frcData) ? frcData : []);
    } catch (err) {
      setError("Failed to load initial data from server.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTable = async () => {
    try {
      // ✅ Updated to Shubham's GET endpoint
      const res = await api.get("/api/expense/frc");
      const data = res.data?.data || res.data || [];
      setFrcList(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Failed to refresh table", err); }
  };

  // ─── Dynamic Form Handlers ───────────────────────────────────────────────────
  const addForm = () => {
    setForms(prev => [...prev, { ...DEFAULT_FORM, id: Date.now() + Math.random() }]);
  };

  const removeForm = (idToRemove) => {
    setForms(prev => prev.filter(f => f.id !== idToRemove));
  };

  const updateForm = useCallback((id, field, value) => {
    setForms(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  }, []);

  // ─── Submission Logic ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
  setError("");
  setSuccessMsg("");

  if (selectedDesigIds.length === 0) {
    return setError("Please select at least one Designation.");
  }

  for (let i = 0; i < forms.length; i++) {
    const f = forms[i];
    if (!f.fromDistance || !f.toDistance || !f.allowance || !f.applicableTo || !f.taPerKm || !f.frcCode) {
      return setError(`Please fill all required fields in Fare Rate Card #${i + 1}`);
    }
  }

  setIsSubmitting(true);
  try {
    const payload = {
      designationIds: selectedDesigIds.map(Number),
      rows: forms.map(({ id, ...form }) => ({
        fromDistance: Number(form.fromDistance),
        toDistance: Number(form.toDistance),
        allowanceType: form.allowance,
        applicableTo: form.applicableTo,
        fare: Number(form.taPerKm),
        frcCode: form.frcCode.trim(),
        description: form.description?.trim() || ""
      }))
    };

    await api.post("/api/expense/frc", payload);

    setSuccessMsg("Fare Rate Cards created successfully!");
    setForms([{ ...DEFAULT_FORM, id: Date.now() }]);
    setSelectedDesigIds([]);
    setTimeout(() => setSuccessMsg(""), 3500);
    refreshTable();
  } catch (err) {
    setError(err.response?.data?.message || "Failed to create Fare Rate Cards.");
  } finally {
    setIsSubmitting(false);
  }
};

  // ─── Action Handlers (Edit/Delete) ───────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      // ✅ Updated to Shubham's DELETE endpoint
      await api.delete(`/api/expense/frc/${id}`);
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
    allowance: row.allowanceType || "",
    applicableTo: row.applicableTo || "",
    taPerKm: row.fare || ""
  });
  setEditModal(true);
};

  const handleEditSubmit = async () => {
  if (!editData.fromDistance || !editData.toDistance || !editData.allowance || !editData.applicableTo || !editData.taPerKm || !editData.frcCode) {
    return setError("Please fill all required fields in the edit form.");
  }

  try {
    const payload = {
      fromDistance: Number(editData.fromDistance),
      toDistance: Number(editData.toDistance),
      allowanceType: editData.allowance,
      applicableTo: editData.applicableTo,
      fare: Number(editData.taPerKm),
      frcCode: editData.frcCode.trim(),
      description: editData.description?.trim() || ""
    };

    await api.put(`/api/expense/frc/${editData.id}`, payload);

    setSuccessMsg("Record updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3500);
    setEditModal(false);
    refreshTable();
  } catch (err) {
    setError(err.response?.data?.message || "Failed to update record.");
  }
};
  // ─── Derived Data ────────────────────────────────────────────────────────────
  const desigOpts = designations.map(d => ({ id: String(d.id), label: d.name || d.designationName || "Unknown" }));

  const filteredData = frcList.filter(row => 
    (row.designationName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (row.frcCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (row.applicableTo || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pagedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const goToPage = p => setCurrentPage(Math.min(Math.max(1, p), totalPages));

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-400 pb-12 font-sans">
      
      {/* ══ CREATION CARD ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 rounded-t-xl" />
        
        <div className="px-6 sm:px-8 pt-5 pb-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Briefcase size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Fare Rate Card Designation</h2>
            <p className="text-xs font-medium text-slate-400">Create multiple FRC rules per designation</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <MultiDropdown
                label="SELECT DESIGNATION *"
                icon={Briefcase}
                options={desigOpts}
                selectedIds={selectedDesigIds}
                onChange={setSelectedDesigIds}
              />
            </div>
          </div>

          <div className="space-y-6">
            {forms.map((form, index) => (
              <div key={form.id} className="relative bg-slate-50/40 rounded-xl border border-slate-200 p-6 pt-10 transition-all hover:border-blue-200">
                
                <div className="absolute -top-3 left-6 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-[11px] font-bold text-blue-600 shadow-sm uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={12} /> Fare Rate Form #{index + 1}
                </div>

                {forms.length > 1 && (
                  <button 
                    onClick={() => removeForm(form.id)} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg border border-transparent hover:border-red-100 transition-all duration-200"
                    title="Remove Form"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <FloatingInput label="FROM DISTANCE (KM) *" type="number" value={form.fromDistance} onChange={(e) => updateForm(form.id, "fromDistance", e.target.value)} />
                  <FloatingInput label="TO DISTANCE (KM) *" type="number" value={form.toDistance} onChange={(e) => updateForm(form.id, "toDistance", e.target.value)} />
                  <Dropdown label="ALLOWANCE TO BE GET *" options={ALLOWANCE_OPTIONS} value={form.allowance} onSelect={(val) => updateForm(form.id, "allowance", val)} />
                  <Dropdown label="SELECT APPLICABLE TO *" options={APPLICABLE_OPTIONS} value={form.applicableTo} onSelect={(val) => updateForm(form.id, "applicableTo", val)} />
                  
                  <FloatingInput label="ENTER TA PER KM *" type="number" value={form.taPerKm} onChange={(e) => updateForm(form.id, "taPerKm", e.target.value)} />
                  <FloatingInput label="ENTER FRC CODE *" value={form.frcCode} onChange={(e) => updateForm(form.id, "frcCode", e.target.value)} />
                  <div className="sm:col-span-2">
                    <FloatingInput label="ENTER DESCRIPTION" value={form.description} onChange={(e) => updateForm(form.id, "description", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button onClick={addForm} className="w-10 h-10 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-sm" title="Add another form">
              <Plus size={20} strokeWidth={2.5} />
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Create FRC
            </button>
          </div>
        </div>
      </div>

      {/* ══ DATA TABLE ═════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 items-center bg-white">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-800">Existing Fare Rate Cards</h3>
            <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-md">
              {filteredData.length} Total
            </span>
          </div>
          
          <div className="relative w-full sm:w-72">
            <input type="text" placeholder="Search FRC Code, Designation..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 border-2 border-slate-200 focus:border-blue-500 rounded-lg pl-4 pr-9 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all" />
            <Search size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[1000px]">
            <thead className="bg-blue-600 text-white text-[11px] uppercase tracking-wider font-semibold border-b border-blue-700">
              <tr>
                <th className="py-4 px-5 text-center w-12">#</th>
                <th className="py-4 px-5">Designation</th>
                <th className="py-4 px-5">From Dist</th>
                <th className="py-4 px-5">To Dist</th>
                <th className="py-4 px-5">Allowance</th>
                <th className="py-4 px-5 text-center">Applicable To</th>
                <th className="py-4 px-5 text-right">Fare (TA/KM)</th>
                <th className="py-4 px-5">FRC Code</th>
                <th className="py-4 px-5">Description</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="10" className="py-16 text-center"><Loader2 className="animate-spin inline text-blue-500" size={32} /></td></tr>
              ) : pagedData.length === 0 ? (
                <tr><td colSpan="10" className="py-12 text-center text-slate-400 font-medium">No Fare Rate Cards found.</td></tr>
              ) : pagedData.map((row, i) => (
                <tr key={row.id} className="transition-colors hover:bg-blue-50/30 bg-white">
                  <td className="py-4 px-5 text-center text-slate-400 font-medium text-xs">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="py-4 px-5 font-bold text-slate-700">{row.designationName || "—"}</td>
                  <td className="py-4 px-5 text-slate-600">{row.fromDistance} km</td>
                  <td className="py-4 px-5 text-slate-600">{row.toDistance} km</td>
                  <td className="py-4 px-5">
  <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-xs font-semibold text-slate-600">
    {row.allowanceType || "—"}
  </span>
</td>
                  <td className="py-4 px-5 text-center font-black uppercase text-blue-600">{row.applicableTo}</td>
                  <td className="py-4 px-5 text-right font-mono font-bold text-slate-800">
  {row.fare != null ? "₹" + row.fare : "—"}
</td>
                  <td className="py-4 px-5 font-semibold text-slate-700">{row.frcCode}</td>
                  <td className="py-4 px-5 text-slate-500 truncate max-w-[150px] text-xs">{row.description || "—"}</td>
                  <td className="py-4 px-5">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider"><Edit size={16}/> Edit Fare Rate Card</h3>
              <button onClick={() => setEditModal(false)} className="text-white/70 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5 bg-white">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Designation</label>
                <div className={`w-full ${INPUT_CLASS} rounded-lg border-2 border-slate-200 bg-slate-50 pl-4 flex items-center text-sm font-semibold text-slate-700 mt-1`}>
                  {editData.designationName || "—"}
                </div>
              </div>
              <FloatingInput label="FROM DISTANCE (KM) *" type="number" value={editData.fromDistance} onChange={e => setEditData({...editData, fromDistance: e.target.value})} />
              <FloatingInput label="TO DISTANCE (KM) *" type="number" value={editData.toDistance} onChange={e => setEditData({...editData, toDistance: e.target.value})} />
              <Dropdown label="ALLOWANCE TO BE GET *" options={ALLOWANCE_OPTIONS} value={editData.allowance} onSelect={v => setEditData({...editData, allowance: v})} />
              <Dropdown label="SELECT APPLICABLE TO *" options={APPLICABLE_OPTIONS} value={editData.applicableTo} onSelect={v => setEditData({...editData, applicableTo: v})} />
              <FloatingInput label="ENTER TA PER KM *" type="number" value={editData.taPerKm} onChange={e => setEditData({...editData, taPerKm: e.target.value})} />
              <FloatingInput label="ENTER FRC CODE *" value={editData.frcCode} onChange={e => setEditData({...editData, frcCode: e.target.value})} />
              <div className="sm:col-span-2">
                <FloatingInput label="ENTER DESCRIPTION" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
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
// Helper Components (Styled to perfectly match the sleek blue theme)
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
      <label className={`absolute left-3 pointer-events-none z-10 transition-all duration-200 tracking-wide ${labelPos} ${labelColor}`}>
        {label}
      </label>
    </div>
  );
});

function Dropdown({ label, value, onSelect, options = [], icon: Icon }) {
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

  const selected = options.find(o => String(o.value) === String(value));
  const hasValue = Boolean(value !== "" && value !== null && value !== undefined);
  
  const borderCls = hasValue ? isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400" : isOpen ? "border-slate-400 ring-2 ring-slate-100" : "border-slate-300";
  const labelColor = hasValue ? "text-blue-600 font-bold" : isOpen ? "text-slate-500 font-bold" : "text-slate-400 font-semibold";
  const labelPos = hasValue || isOpen ? "-top-[9px] text-[10px] bg-white px-1" : "top-[9px] text-sm bg-transparent";

  return (
    <div className="relative w-full select-none mt-1">
      <div ref={ref} onClick={openMenu} className={`w-full ${INPUT_CLASS} rounded-lg border-2 bg-white pl-3.5 pr-10 flex items-center transition-all cursor-pointer ${borderCls}`}>
        <span className={`truncate text-sm font-semibold flex-1 ${hasValue ? "text-slate-800" : "text-transparent"}`}>{selected?.label || " "}</span>
        <div className={`absolute right-3 flex items-center gap-1 pointer-events-none transition-transform duration-200 ${hasValue ? "text-blue-500" : "text-slate-400"} ${isOpen ? "rotate-180" : ""}`}>
          {Icon && <Icon size={14} className="opacity-70" />}
          <ChevronDown size={14} />
        </div>
      </div>
      <label className={`absolute left-3 pointer-events-none z-10 transition-all duration-200 tracking-wide ${labelPos} ${labelColor}`}>{label}</label>

      {isOpen && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <ul className="py-1.5 max-h-60 overflow-y-auto">
            {options.map((opt, i) => (
              <li key={i} onMouseDown={e => { e.preventDefault(); onSelect(opt.value); setIsOpen(false); }}
                className={`px-4 py-3 text-sm cursor-pointer font-semibold transition-colors ${String(value) === String(opt.value) ? "bg-blue-50 text-blue-600 border-l-[3px] border-blue-500" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 border-l-[3px] border-transparent"}`}>
                {opt.label}
              </li>
            ))}
          </ul>
        </Portal>
      )}
    </div>
  );
}

function MultiDropdown({ label, options = [], selectedIds, onChange, icon: Icon }) {
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
  const labelPos = hasValue || isOpen ? "-top-[9px] text-[10px] bg-white px-1" : "top-[9px] text-sm bg-transparent";

  return (
    <div className="relative w-full select-none mt-1">
      <div ref={ref} onClick={openMenu} className={`w-full ${INPUT_CLASS} rounded-lg border-2 bg-white pl-3.5 pr-10 flex items-center transition-all cursor-pointer ${borderCls}`}>
        <span className={`block truncate text-sm font-semibold flex-1 min-w-0 ${hasValue ? "text-slate-800" : "text-transparent"}`}>{displayText || " "}</span>
        <div className={`absolute right-3 flex items-center gap-1 pointer-events-none transition-transform duration-200 ${hasValue ? "text-blue-500" : "text-slate-400"} ${isOpen ? "rotate-180" : ""}`}>
          {Icon && <Icon size={14} className="opacity-70" />}
          <ChevronDown size={14} />
        </div>
      </div>
      <label className={`absolute left-3 pointer-events-none z-10 transition-all duration-200 tracking-wide ${labelPos} ${labelColor}`}>{label}</label>

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