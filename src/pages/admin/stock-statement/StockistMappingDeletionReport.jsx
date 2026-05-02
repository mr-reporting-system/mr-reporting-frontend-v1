import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, CheckCircle2, ChevronDown, Check,
  Map, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import api from "../../../services/api";

// ─── Global responsive styles (from reference) ───────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; overflow-x: hidden; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; margin-bottom: 24px; min-width: 0; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:space-between; border-radius:0 0 16px 16px; flex-wrap: wrap; gap: 12px; }

  /* Responsive Table Scroll Logic */
  .ucr-table-container {
    border: 1px solid #f3f4f6;
    border-radius: 12px;
    overflow-x: auto;
    background: #fff;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }
  .ucr-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 600px; }
  .ucr-table thead { background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
  .ucr-table th { padding: 12px 16px; text-align: left; font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  .ucr-table td { padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }

  .ucr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:24px; }

  /* Responsive Col Spans */
  .col-span-2 { grid-column: span 2; }
  .col-span-4 { grid-column: span 4; }

  @media(max-width:1024px){
    .ucr-grid, .ucr-grid-4, .ucr-grid-2 { grid-template-columns:repeat(2,1fr); gap:16px; }
    .col-span-4 { grid-column: span 2; }
  }
  @media(max-width:768px){
    .ucr-grid, .ucr-grid-4, .ucr-grid-2 { grid-template-columns:1fr; gap:16px; }
    .col-span-2, .col-span-4 { grid-column: span 1 !important; }
    .ucr-body  { padding:16px; }
    .ucr-header { padding: 16px; flex-direction: column; align-items: flex-start; }
    .ucr-header > div { width: 100%; }
    .ucr-header > button { align-self: flex-end; margin-top: -30px; }
    .ucr-footer { justify-content: center; flex-direction: column; }
    .ucr-footer > div, .ucr-footer > button { width: 100%; justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const FH = 40;
const PAGE_SIZES = [5, 10, 20, 50];

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
          const query = filters.districtIds.map(id => `districtIds=${id}`).join('&');
          const res = await api.get(`/api/masters/employees/by-districts?${query}`, getAuthHeaders());
          
          const employeeData = res.data?.data || res.data || [];
          const normalizedEmployees = Array.isArray(employeeData) ? employeeData.map((e) => ({
            id: String(e.id ?? e.employeeId),
            employeeName: e.employee_name || e.employeeName || e.userName || e.name || "Unknown"
          })) : [];
          setEmployees(normalizedEmployees.filter(opt => opt.id !== ""));
        } catch (err) { console.error("Failed to load employees", err); }
      };
      fetchEmployees();
    }
  }, [filters.districtIds, getAuthHeaders]);

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
      const payload = {
        stateIds: [Number(filters.stateId)],
        districtIds: filters.districtIds.map(Number),
        employeeIds: filters.employeeIds.map(Number)
      };

      const res = await api.post(`/api/masters/stockist-mapping-report/view`, payload, getAuthHeaders());
      
      const fetchedData = res.data?.data?.rows || [];
      
      const normalizedData = Array.isArray(fetchedData) ? fetchedData.map((row, i) => ({
        id: String(row.mappingId || row.id || i),
        districtName: row.stockistDistrictName || row.employeeDistrictName || "Unknown District",
        stockistName: row.stockistName || row.partyName || "Unknown Stockist",
        userName: row.userName || row.employeeName || "Unknown User"
      })) : [];

      setMappedData(normalizedData);
      setTableVisible(true);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch mapped data.");
      setMappedData([]);
      setTableVisible(true);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  };

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
      const payload = {
        mappingIds: selectedRowIds.map(Number)
      };

      await api.post("/api/masters/stockist-mapping-report/delete", payload, getAuthHeaders());
      
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

  // ─── Dropdown Options Mapping ─────────────────────────────────────────
  const stateOpts = states.map(s => ({ id: String(s.id), value: String(s.id), label: s.stateName }));
  const distOpts = districts.map(d => ({ id: String(d.id), value: String(d.id), label: d.districtName }));
  const empOpts = employees.map(e => ({ id: String(e.id), value: String(e.id), label: e.employeeName }));

  // ─── Pagination Logic ────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(mappedData.length / pageSize));
  const pagedData = mappedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allVisibleSelected = pagedData.length > 0 && pagedData.every(row => selectedRowIds.includes(row.id));

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
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

      {/* ══ FILTER SECTION ═════════════════════════════════════════════════ */}
      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Map size={17} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>MR Stockist Mapped Report</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>
              View and manage employee to stockist mappings
            </p>
          </div>
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>FILTER</span>
              <div style={{ width: 34, height: 18, borderRadius: 20, background: isFilterOpen ? "#2563eb" : "#d1d5db", position: "relative", cursor: "pointer", transition: "0.2s" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: isFilterOpen ? 18 : 2, transition: "0.2s" }} />
              </div>
            </div>
          </button>
        </div>

        {isFilterOpen && (
          <div className="ucr-body">
            <div className="ucr-grid-4">
              <SingleDropdown 
                label="SELECT STATE *" 
                options={stateOpts} 
                value={filters.stateId} 
                onSelect={(v) => handleFilterChange("stateId", v)} 
              />
              <MultiDropdown 
                label="SELECT DISTRICT *" 
                options={distOpts} 
                selectedIds={filters.districtIds} 
                onChange={(v) => handleFilterChange("districtIds", v)} 
                disabled={!filters.stateId} 
              />
              <MultiDropdown 
                label="SELECT EMPLOYEE *" 
                options={empOpts} 
                selectedIds={filters.employeeIds} 
                onChange={(v) => handleFilterChange("employeeIds", v)} 
                disabled={!filters.districtIds.length} 
              />
              
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button 
                  onClick={handleViewStatus} 
                  disabled={isLoading} 
                  style={{
                    height: FH, width: "100%", padding: "0 24px", borderRadius: 8, background: "#2563eb", color: "#fff",
                    fontSize: 13, fontWeight: 700, border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}
                >
                  {isLoading ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Check size={16} />}
                  View Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ TABLE SECTION ═════════════════════════════════════════════════ */}
      {tableVisible && (
        <div className="ucr-card animate-in slide-in-from-bottom-4 duration-500">
          <div className="ucr-header" style={{ background: "#f9fafb" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Stockist Mapped Detail</h3>
          </div>

          <div className="ucr-body" style={{ padding: 0 }}>
            <div className="ucr-table-container" style={{ border: "none", borderRadius: "0 0 16px 16px" }}>
              <table className="ucr-table">
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: "center", cursor: "pointer" }} onClick={toggleAllRows}>
                      <div style={{ 
                        width: 16, height: 16, borderRadius: 4, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                        border: allVisibleSelected && pagedData.length > 0 ? "1px solid #2563eb" : "2px solid #d1d5db",
                        background: allVisibleSelected && pagedData.length > 0 ? "#2563eb" : "#fff"
                      }}>
                        {allVisibleSelected && pagedData.length > 0 && <Check size={12} style={{ color: "#fff" }} />}
                      </div>
                    </th>
                    <th>District Name</th>
                    <th>Stockist Name</th>
                    <th>User Name</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedData.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                        No mapped records found.
                      </td>
                    </tr>
                  ) : (
                    pagedData.map((row) => (
                      <tr 
                        key={row.id} 
                        onClick={() => toggleRowSelection(row.id)}
                        style={{ 
                          cursor: "pointer", 
                          background: selectedRowIds.includes(row.id) ? "#eff6ff" : "transparent"
                        }}
                      >
                        <td style={{ textAlign: "center" }}>
                          <div style={{ 
                            width: 16, height: 16, borderRadius: 4, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                            border: selectedRowIds.includes(row.id) ? "1px solid #2563eb" : "2px solid #d1d5db",
                            background: selectedRowIds.includes(row.id) ? "#2563eb" : "#fff"
                          }}>
                            {selectedRowIds.includes(row.id) && <Check size={12} style={{ color: "#fff" }} />}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: "#4b5563" }}>{row.districtName}</td>
                        <td style={{ fontWeight: 700, color: "#111827", textTransform: "uppercase" }}>{row.stockistName}</td>
                        <td style={{ fontWeight: 600, color: "#6b7280" }}>{row.userName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ucr-footer" style={{ borderTop: "1px solid #f3f4f6" }}>
            <button 
              onClick={handleDelete} 
              disabled={isDeleting || selectedRowIds.length === 0} 
              style={{
                height: 38, padding: "0 20px", borderRadius: 8, background: "#ef4444", color: "#fff",
                fontSize: 13, fontWeight: 700, border: "none", cursor: (isDeleting || selectedRowIds.length === 0) ? "not-allowed" : "pointer",
                opacity: (isDeleting || selectedRowIds.length === 0) ? 0.5 : 1, display: "flex", alignItems: "center", gap: 8
              }}
            >
              {isDeleting ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Trash2 size={16} />}
              Delete Stockists {selectedRowIds.length > 0 && `(${selectedRowIds.length})`}
            </button>

            {mappedData.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <div style={{ color: "#6b7280", fontSize: 11 }}>
                  Showing <span style={{ fontWeight: 700, color: "#374151" }}>{(currentPage - 1) * pageSize + 1}</span> to <span style={{ fontWeight: 700, color: "#374151" }}>{Math.min(currentPage * pageSize, mappedData.length)}</span> of <span style={{ fontWeight: 700, color: "#374151" }}>{mappedData.length}</span> entries
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#6b7280", marginRight: 6, fontSize: 11 }}>Items per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}
                  >
                    {PAGE_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div style={{ width: 12 }} />
                  <button
                    onClick={() => goToPage(1)} disabled={currentPage === 1}
                    style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, padding: "4px 8px", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1, fontWeight: 600, fontSize: 11 }}
                  >First</button>
                  <button
                    onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                    style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyItems: "center", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}
                  ><ChevronLeft size={13} style={{ margin: "0 auto" }} /></button>
                  <div style={{ background: "#2563eb", color: "#fff", border: "1px solid #2563eb", borderRadius: 4, padding: "4px 10px", fontWeight: 700, fontSize: 11 }}>
                    {currentPage}
                  </div>
                  <button
                    onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}
                    style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyItems: "center", cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer", opacity: (currentPage === totalPages || totalPages === 0) ? 0.4 : 1 }}
                  ><ChevronRight size={13} style={{ margin: "0 auto" }} /></button>
                  <button
                    onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
                    style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, padding: "4px 8px", cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer", opacity: (currentPage === totalPages || totalPages === 0) ? 0.4 : 1, fontWeight: 600, fontSize: 11 }}
                  >Last</button>
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
    if (r) setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    setIsOpen(true);
  };

  const selected = options.find(o => String(o.value) === String(value) || String(o.id) === String(value));
  const hasValue = Boolean(value !== "" && value !== null && value !== undefined);
  
  return (
    <div className="relative w-full select-none mt-1">
      <div ref={ref} onClick={openMenu} style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex",
          alignItems: "center", border: `1.5px solid ${hasValue && !disabled ? (isOpen ? "#2563eb" : "#2563eb") : (isOpen ? "#d1d5db" : "#d1d5db")}`,
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f3f4f6" : "#fff",
          transition: "border-color 0.2s"
        }}>
        <span style={{ flex: 1, fontWeight: 600, color: disabled ? "#6b7280" : (hasValue ? "#111827" : "transparent"), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {selected?.label || " "}
        </span>
        <ChevronDown size={14} style={{ color: "#9ca3af", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s", flexShrink: 0 }} />
      </div>
      <label style={{
          position: "absolute", left: 10, top: (hasValue || isOpen) ? -9 : 12, fontSize: (hasValue || isOpen) ? 10 : 12,
          fontWeight: 600, color: disabled ? "#9ca3af" : ((hasValue || isOpen) ? "#2563eb" : "#9ca3af"), background: disabled ? ((hasValue || isOpen) ? "#f3f4f6" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}>
        {label}
      </label>

      {isOpen && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div style={{ maxHeight: 250, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
               <p style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", margin: 0, textAlign: "center", fontStyle: "italic" }}>No options available</p>
            ) : options.map((opt, i) => {
              const optValue = opt.id ?? opt.value;
              return (
                <div key={i} onMouseDown={e => { e.preventDefault(); onSelect(optValue); setIsOpen(false); }}
                  style={{
                    padding: "10px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
                    background: String(value) === String(optValue) ? "#eff6ff" : "transparent",
                    color: String(value) === String(optValue) ? "#2563eb" : "#374151"
                  }}>
                  {opt.label}
                </div>
              );
            })}
          </div>
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
    if (r) setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    setIsOpen(true);
  };

  const toggle = id => onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  const selectAll = () => onChange(options.map(o => String(o.id ?? o.value)));
  const clearAll = () => onChange([]);

  const hasValue = selectedIds.length > 0;
  const displayText = hasValue ? options.filter(o => selectedIds.includes(String(o.id ?? o.value))).map(o => o.label).join(", ") : "";
  
  return (
    <div className="relative w-full select-none mt-1">
      <div ref={ref} onClick={openMenu} style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex",
          alignItems: "center", border: `1.5px solid ${hasValue && !disabled ? (isOpen ? "#2563eb" : "#2563eb") : (isOpen ? "#d1d5db" : "#d1d5db")}`,
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f3f4f6" : "#fff",
          transition: "border-color 0.2s"
        }}>
        <span style={{ flex: 1, fontWeight: 600, color: disabled ? "#6b7280" : (hasValue ? "#111827" : "transparent"), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {displayText || " "}
        </span>
        <ChevronDown size={14} style={{ color: "#9ca3af", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s", flexShrink: 0 }} />
      </div>
      <label style={{
          position: "absolute", left: 10, top: (hasValue || isOpen) ? -9 : 12, fontSize: (hasValue || isOpen) ? 10 : 12,
          fontWeight: 600, color: disabled ? "#9ca3af" : ((hasValue || isOpen) ? "#2563eb" : "#9ca3af"), background: disabled ? ((hasValue || isOpen) ? "#f3f4f6" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}>
        {label}
      </label>

      {isOpen && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
            <button type="button" onMouseDown={e => { e.preventDefault(); selectAll(); }} style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#2563eb", border: "none", cursor: "pointer" }}>Select All</button>
            <button type="button" onMouseDown={e => { e.preventDefault(); clearAll(); }} style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#ef4444", border: "none", cursor: "pointer" }}>Clear All</button>
          </div>
          <div style={{ maxHeight: 250, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
               <p style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", margin: 0, textAlign: "center", fontStyle: "italic" }}>No options available</p>
            ) : options.map((opt, idx) => {
              const optId = String(opt.id ?? opt.value);
              const isSel = selectedIds.includes(optId);
              return (
                <div key={idx} onMouseDown={e => { e.preventDefault(); toggle(optId); }} 
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 10, background: isSel ? "#eff6ff" : "transparent",
                    color: isSel ? "#2563eb" : "#4b5563", border: "none", cursor: "pointer"
                  }}>
                  <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      border: isSel ? "2px solid #2563eb" : "2px solid #d1d5db", background: isSel ? "#2563eb" : "#fff"
                    }}>
                    {isSel && <svg viewBox="0 0 10 8" style={{ width: 10, height: 8 }} fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontWeight: 600 }}>{opt.label}</span>
                </div>
              );
            })}
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
  
  useEffect(() => {
    const handleScroll = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      onClose();
    };
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);
  
  return (
    <div ref={ref} style={{ position: "fixed", top, left, width, zIndex: 99999 }} className="dropdown-portal bg-white border border-[#e5e7eb] rounded-lg shadow-xl overflow-hidden">
      {children}
    </div>
  );
}