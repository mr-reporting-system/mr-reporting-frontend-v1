import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Loader2, AlertCircle, CheckCircle2, ChevronDown,
  Trash2, Edit, X, Save, Search, Wallet, Check,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileSpreadsheet, Edit2
} from "lucide-react";
import api from "../../../services/api";

// ─── Global responsive styles (from reference) ───────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; overflow-x: hidden; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; margin-bottom: 24px; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:flex-end; border-radius:0 0 16px 16px; flex-wrap: wrap; gap: 12px; }

  /* Responsive Table Scroll Logic */
  .ucr-table-container {
    border: 1px solid #f3f4f6;
    border-radius: 12px;
    overflow-x: auto;
    background: #fff;
    -webkit-overflow-scrolling: touch;
  }
  .ucr-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1200px; }
  .ucr-table thead { background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
  .ucr-table th { padding: 12px 16px; text-align: left; font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  .ucr-table td { padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }

  .ucr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:24px; }

  /* Responsive Col Spans */
  .col-span-2 { grid-column: span 2; }
  .col-span-4 { grid-column: span 4; }

  @media(max-width:1024px){
    .ucr-grid, .ucr-grid-4 { grid-template-columns:repeat(2,1fr); gap:16px; }
    .col-span-4 { grid-column: span 2; }
  }
  @media(max-width:768px){
    .ucr-grid, .ucr-grid-4 { grid-template-columns:1fr; gap:16px; }
    .col-span-2, .col-span-4 { grid-column: span 1 !important; }
    .ucr-body  { padding:16px; }
    .ucr-header { padding: 16px; flex-direction: column; align-items: flex-start; }
    .ucr-header > div { width: 100%; }
    .modal-close-btn { align-self: flex-end; margin-top: -30px; }
    .ucr-footer { justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const PAGE_SIZES = [10, 20, 50];
const FH = 40;

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

  // ─── Derived Data ────────────────────────────────────────────────────────────
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

  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>

      {/* Alerts */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {successMsg && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "10px 16px", color: "#16a34a", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Main Creation Card */}
      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={17} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Daily Allowance Form</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>
              Configure allowances per state and designation
            </p>
          </div>
        </div>

        <div className="ucr-body">
          <div style={{
            background: "#f9fafb",
            border: "1px solid #f3f4f6",
            borderRadius: 12,
            padding: "24px 20px 20px 20px",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -10, left: 16, background: "#fff", border: "1px solid #f3f4f6",
              padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "#2563eb", textTransform: "uppercase"
            }}>
              Allowance Details
            </div>

            <div className="ucr-grid-4">
              <div className="col-span-2">
                <MultiSelectDropdown
                  label="SELECT STATE *"
                  options={stateOpts}
                  selectedIds={selectedStateIds}
                  onChange={setSelectedStateIds}
                  disabled={isLoading}
                />
              </div>
              <div className="col-span-2">
                <MultiSelectDropdown
                  label="SELECT DESIGNATION *"
                  options={desigOpts}
                  selectedIds={selectedDesigIds}
                  onChange={setSelectedDesigIds}
                  disabled={isLoading}
                />
              </div>

              <FloatingInput label="ENTER HQ DA *" type="number" value={formData.hqDa} onChange={(e) => handleInputChange("hqDa", e.target.value)} />
              <FloatingInput label="ENTER EX DA *" type="number" value={formData.exDa} onChange={(e) => handleInputChange("exDa", e.target.value)} />
              <div className="col-span-2">
                 <FloatingInput label="ENTER OUT DA *" type="number" value={formData.outDa} onChange={(e) => handleInputChange("outDa", e.target.value)} />
              </div>
            </div>

            <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 8, marginBottom: 16, marginTop: 8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#4b5563", margin: 0, textTransform: "uppercase" }}>Fix Expense Details</h3>
            </div>

            <div className="ucr-grid-4" style={{ marginBottom: 0 }}>
              <FloatingInput label="MOBILE ALLOWANCE" type="number" value={formData.mobileAllowance} onChange={(e) => handleInputChange("mobileAllowance", e.target.value)} />
              <FloatingInput label="NET ALLOWANCES" type="number" value={formData.netAllowance} onChange={(e) => handleInputChange("netAllowance", e.target.value)} />
              <FloatingInput label="POSTAGE / STATIONARY" type="number" value={formData.postageStationary} onChange={(e) => handleInputChange("postageStationary", e.target.value)} />
              <FloatingInput label="POSTAGE / FREIGHT" type="number" value={formData.postageFreight} onChange={(e) => handleInputChange("postageFreight", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="ucr-footer" style={{ justifyContent: "flex-start" }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            style={{
              height: 40, padding: "0 24px", borderRadius: 8, background: "#2563eb", color: "#fff",
              fontSize: 13, fontWeight: 700, border: "none", cursor: (isSubmitting || isLoading) ? "not-allowed" : "pointer",
              opacity: (isSubmitting || isLoading) ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8
            }}
          >
            {isSubmitting ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Save size={16} />}
            Create Daily Allowance
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="ucr-card">
        <div className="ucr-header" style={{ justifyContent: "space-between", background: "#f9fafb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Existing Daily Allowances</h3>
            <span style={{ fontSize: 11, fontWeight: 700, background: "#f3f4f6", color: "#4b5563", padding: "4px 10px", borderRadius: 20, border: "1px solid #e5e7eb" }}>
              {filteredData.length} Total
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", width: "100%", maxWidth: 350 }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search State, Designation..."
                style={{
                  width: "100%", height: 36, borderRadius: 8, border: "1px solid #d1d5db",
                  padding: "0 32px 0 12px", fontSize: 13, outline: "none", color: "#111827"
                }}
              />
              <Search size={14} style={{ position: "absolute", right: 10, top: 11, color: "#9ca3af" }} />
            </div>
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
        </div>

        <div className="ucr-body" style={{ padding: 0 }}>
          <div className="ucr-table-container" style={{ border: "none", borderRadius: "0 0 16px 16px" }}>
            <table className="ucr-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>#</th>
                  <th>State</th>
                  <th>Designation</th>
                  <th style={{ textAlign: "right" }}>HQ DA</th>
                  <th style={{ textAlign: "right" }}>EX DA</th>
                  <th style={{ textAlign: "right" }}>OUT DA</th>
                  <th style={{ textAlign: "right" }}>Mobile All.</th>
                  <th style={{ textAlign: "right" }}>Net All.</th>
                  <th style={{ textAlign: "right" }}>Special All.</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: 40 }}>
                      <Loader2 style={{ animation: "ucr-spin 1s linear infinite", margin: "0 auto", color: "#2563eb" }} size={24} />
                    </td>
                  </tr>
                ) : pagedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                      No records found.
                    </td>
                  </tr>
                ) : (
                  pagedData.map((row, i) => (
                    <tr key={row.id}>
                      <td style={{ color: "#6b7280", textAlign: "center" }}>{(currentPage - 1) * pageSize + i + 1}</td>
                      <td style={{ fontWeight: 600, textTransform: "uppercase" }}>{row.stateName || "—"}</td>
                      <td style={{ fontWeight: 600, color: "#2563eb" }}>{row.designationName || "—"}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>₹{row.hqDa || 0}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>₹{row.exDa || 0}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>₹{row.outDa || 0}</td>
                      <td style={{ textAlign: "right" }}>₹{row.mobileAllowance || 0}</td>
                      <td style={{ textAlign: "right" }}>₹{row.netAllowance || 0}</td>
                      <td style={{ textAlign: "right" }}>₹{row.specialAllowance || 0}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", gap: 12 }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 4 }}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: 4 }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Footer Styled */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f3f4f6", background: "#f9fafb", fontSize: 11, flexWrap: "wrap", gap: 12 }}>
              <div style={{ color: "#6b7280" }}>
                Showing <span style={{ fontWeight: 700, color: "#374151" }}>{pagedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to <span style={{ fontWeight: 700, color: "#374151" }}>{Math.min(currentPage * pageSize, filteredData.length)}</span> of <span style={{ fontWeight: 700, color: "#374151" }}>{filteredData.length}</span> entries
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#6b7280", marginRight: 6 }}>Items per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "2px 6px" }}
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div style={{ width: 12 }} />
                <button
                  onClick={() => goToPage(1)} disabled={currentPage === 1}
                  style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, padding: "4px 8px", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1, fontWeight: 600 }}
                >First</button>
                <button
                  onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                  style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyItems: "center", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}
                ><ChevronLeft size={13} style={{ margin: "0 auto" }} /></button>
                <div style={{ background: "#2563eb", color: "#fff", border: "1px solid #2563eb", borderRadius: 4, padding: "4px 10px", fontWeight: 700 }}>
                  {currentPage}
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}
                  style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyItems: "center", cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer", opacity: (currentPage === totalPages || totalPages === 0) ? 0.4 : 1 }}
                ><ChevronRight size={13} style={{ margin: "0 auto" }} /></button>
                <button
                  onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
                  style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, padding: "4px 8px", cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer", opacity: (currentPage === totalPages || totalPages === 0) ? 0.4 : 1, fontWeight: 600 }}
                >Last</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal (Mobile Responsive) */}
      {editModal && editData && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000, background: "rgba(17, 24, 39, 0.4)",
          display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", padding: 16
        }}>
          <div className="ucr-card" style={{ 
            width: "100%", maxWidth: 800, margin: 0, overflow: "visible", 
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            <div className="ucr-header" style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Edit2 size={17} style={{ color: "#2563eb" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0, textTransform: "uppercase" }}>Edit Daily Allowance</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setEditModal(false);
                  setEditData(null);
                }}
                style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyItems: "center", padding: 4, borderRadius: 6 }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="ucr-body" style={{ overflowY: "auto", flex: 1 }}>
              <div className="ucr-grid-4" style={{ marginBottom: 0 }}>
                <div className="col-span-2">
                  <FloatingInput
                    label="STATE"
                    value={editData.stateName || "—"}
                    disabled
                  />
                </div>
                <div className="col-span-2">
                  <FloatingInput
                    label="DESIGNATION"
                    value={editData.designationName || "—"}
                    disabled
                  />
                </div>

                <FloatingInput
                  label="HQ DA *"
                  type="number"
                  value={editData.hqDa}
                  onChange={(e) => setEditData({ ...editData, hqDa: e.target.value })}
                />
                <FloatingInput
                  label="EX DA *"
                  type="number"
                  value={editData.exDa}
                  onChange={(e) => setEditData({ ...editData, exDa: e.target.value })}
                />
                <FloatingInput
                  label="OUT DA *"
                  type="number"
                  value={editData.outDa}
                  onChange={(e) => setEditData({ ...editData, outDa: e.target.value })}
                />
                
                <div className="col-span-4" style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 8, marginTop: 16, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#4b5563", margin: 0, textTransform: "uppercase" }}>Fix Expense Details</h3>
                </div>

                <FloatingInput
                  label="MOBILE ALLOWANCE"
                  type="number"
                  value={editData.mobileAllowance}
                  onChange={(e) => setEditData({ ...editData, mobileAllowance: e.target.value })}
                />
                <FloatingInput
                  label="NET ALLOWANCES"
                  type="number"
                  value={editData.netAllowance}
                  onChange={(e) => setEditData({ ...editData, netAllowance: e.target.value })}
                />
                <FloatingInput
                  label="POSTAGE / STATIONARY"
                  type="number"
                  value={editData.postageStationary}
                  onChange={(e) => setEditData({ ...editData, postageStationary: e.target.value })}
                />
                <FloatingInput
                  label="POSTAGE / FREIGHT"
                  type="number"
                  value={editData.postageFreight}
                  onChange={(e) => setEditData({ ...editData, postageFreight: e.target.value })}
                />
              </div>
            </div>

            <div className="ucr-footer" style={{ borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setEditModal(false);
                  setEditData(null);
                }}
                style={{
                  height: 38, padding: "0 20px", borderRadius: 8, background: "#fff",
                  border: "1px solid #d1d5db", color: "#4b5563", fontWeight: 600, fontSize: 13, cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                style={{
                  height: 38, padding: "0 20px", borderRadius: 8, background: "#2563eb", color: "#fff",
                  fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8
                }}
              >
                <Save size={16} /> Update Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// UI Components Restyled to match Reference Exactly
// ═══════════════════════════════════════════════════════════════════

function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== "" && value !== null && value !== undefined;
  const active = hasValue || isFocused;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13,
          border: `1.5px solid ${active && !disabled ? "#2563eb" : "#d1d5db"}`, outline: "none",
          fontWeight: 600, color: disabled ? "#6b7280" : "#111827",
          background: disabled ? "#f3f4f6" : "#fff",
          transition: "border-color 0.2s"
        }}
      />
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"),
          background: disabled ? (active ? "#f3f4f6" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}
      >
        {label}
      </label>
    </div>
  );
}

function MultiSelectDropdown({ label, options, selectedIds, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleValue = (value) => {
    if (selectedIds.includes(value)) {
      onChange(selectedIds.filter((item) => item !== value));
      return;
    }
    onChange([...selectedIds, value]);
  };

  const selectAll = () => onChange(options.map((option) => option.id || option.value));
  const clearAll = () => onChange([]);

  const selectedLabel = options
    .filter((option) => selectedIds.includes(option.id || option.value))
    .map((option) => option.label)
    .join(", ");

  const hasValue = selectedIds.length > 0;
  const active = isOpen || hasValue;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
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
        <div
          style={{
            position: "absolute", top: "110%", left: 0, width: "100%", background: "#fff",
            border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden"
          }}
        >
          <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
            <button
              type="button"
              onClick={selectAll}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#2563eb", border: "none", cursor: "pointer" }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#ef4444", border: "none", cursor: "pointer" }}
            >
              Clear All
            </button>
          </div>

          <div style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
              <p style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", margin: 0 }}>No options available.</p>
            ) : (
              options.map((option) => {
                const isSelected = selectedIds.includes(option.id || option.value);
                return (
                  <button
                    key={option.id || option.value}
                    type="button"
                    onClick={() => toggleValue(option.id || option.value)}
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
        </div>
      )}
    </div>
  );
}