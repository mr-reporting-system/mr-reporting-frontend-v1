import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Users,
  Save
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
    width: 100%;
  }
  .ucr-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 400px; }
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
    .ucr-footer { justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const FH = 40;

export default function UserStockistMapping() {
  // ─── App State ───────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Loading states for individual tables
  const [isLeftLoading, setIsLeftLoading] = useState(false);
  const [isRightLoading, setIsRightLoading] = useState(false);

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

  const PAGE_SIZES = [5, 10, 20];

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

  // ─── 2. Left Side Fetching Logic (Stockists) ─────────────────────────────────
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
    } else {
      setLeftDistricts([]);
    }
  }, [leftFilters.stateId, getAuthHeaders]);

  useEffect(() => {
    if (leftFilters.districtIds.length > 0) {
      setIsLeftLoading(true);
      
      const query = `districtIds=${leftFilters.districtIds.join(',')}`;
      
      api.get(`/api/masters/stockist-mappings/stockists?stateId=${leftFilters.stateId}&${query}`, getAuthHeaders())
        .then(res => {
          const data = res.data?.data || res.data || [];
          
          setStockists(Array.isArray(data) ? data.map(s => ({
            id: String(s.stockistId ?? s.id ?? s.partyId ?? s.providerId ?? ""), 
            headquarterName: s.headquarterName || s.hqName || "Unknown HQ",
            stockistName: s.providerName || s.stockistName || s.stockist_name || s.partyName || s.name || "Unknown"
          })).filter(s => s.id !== "") : []); 
          
          setLeftPage(1);
        }).catch(err => {
          console.error("Stockist fetch error", err);
          setStockists([]);
        }).finally(() => {
          setIsLeftLoading(false);
        });
    } else {
      setStockists([]);
      setSelectedStockistId(null);
    }
  }, [leftFilters.districtIds, leftFilters.stateId, getAuthHeaders]);

  // ─── 3. Right Side Fetching Logic (Employees) ────────────────────────────────
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
    } else {
      setRightDistricts([]);
    }
  }, [rightFilters.stateId, getAuthHeaders]);

  useEffect(() => {
    if (rightFilters.districtIds.length > 0) {
      setIsRightLoading(true);
      
      const query = `districtIds=${rightFilters.districtIds.join(',')}`;
      const stockistQuery = selectedStockistId ? `&stockistId=${selectedStockistId}` : "";
      
      api.get(`/api/masters/stockist-mappings/employees?stateId=${rightFilters.stateId}&${query}${stockistQuery}`, getAuthHeaders())
        .then(res => {
          const data = res.data?.data || res.data || [];
          const normalizedEmployees = [];
          const preSelectedIds = [];

          if (Array.isArray(data)) {
            data.forEach(e => {
              const id = String(e.employeeId ?? e.id ?? "");
              if (!id) return;
              
              const name = e.userName || e.employee_name || e.employeeName || e.name || "Unknown";
              const desig = e.designationName || e.designation_name || e.designation || "";
              
              normalizedEmployees.push({
                id,
                headquarterName: e.headquarterName || e.hqName || "Unknown HQ",
                employeeName: desig ? `${name}-(${desig})` : name
              });

              if (e.mapped) preSelectedIds.push(id);
            });
          }
          
          setEmployees(normalizedEmployees);
          setSelectedEmployeeIds(selectedStockistId ? preSelectedIds : []);
          setRightPage(1);
        }).catch(err => {
          console.error("Employee fetch error", err);
          setEmployees([]);
          setSelectedEmployeeIds([]);
        }).finally(() => {
          setIsRightLoading(false);
        });
    } else {
      setEmployees([]);
      setSelectedEmployeeIds([]);
    }
  }, [rightFilters.districtIds, rightFilters.stateId, selectedStockistId, getAuthHeaders]);

  // ─── 4. Handlers ─────────────────────────────────────────────────────────────
  const toggleEmployeeSelection = (id) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    );
  };

  const toggleAllEmployees = () => {
    if (selectedEmployeeIds.length === employees.length && employees.length > 0) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(employees.map(e => e.id));
    }
  };

  const handleMapSubmit = async () => {
    if (!selectedStockistId) return setError("Please select a Stockist to map.");

    setIsSubmitting(true);
    setError(""); setSuccessMsg("");

    try {
      const payload = {
        stockistId: Number(selectedStockistId),
        employeeIds: selectedEmployeeIds.map(Number)
      };

      await api.put("/api/masters/stockist-mappings/map", payload, getAuthHeaders());
      
      setSuccessMsg("Stockist mapped successfully!");
      setTimeout(() => {
        setSuccessMsg("");
      }, 4000);
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to map stockist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Pagination Logic ────────────────────────────────────────────────────────
  const leftTotalPages = Math.max(1, Math.ceil(stockists.length / leftPageSize));
  const pagedStockists = stockists.slice((leftPage - 1) * leftPageSize, leftPage * leftPageSize);
  const goToLeftPage = (page) => setLeftPage(Math.min(Math.max(1, page), leftTotalPages));

  const rightTotalPages = Math.max(1, Math.ceil(employees.length / rightPageSize));
  const pagedEmployees = employees.slice((rightPage - 1) * rightPageSize, rightPage * rightPageSize);
  const goToRightPage = (page) => setRightPage(Math.min(Math.max(1, page), rightTotalPages));

  const stateOpts = statesList.map(s => ({ id: String(s.id), value: String(s.id), label: s.stateName }));

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

      {/* Main Header / Card */}
      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={17} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>User-Stockist Mapping</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>
              Map stockists to employees across states and districts
            </p>
          </div>
        </div>

        <div className="ucr-body" style={{ padding: 0 }}>
          <div className="ucr-grid-2" style={{ margin: 0, gap: 0 }}>
            {/* Left Filter */}
            <div style={{ padding: 24, borderRight: "1px solid #f3f4f6" }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#4b5563", margin: 0, textTransform: "uppercase" }}>Filter For Stockist Selection</h3>
              </div>
              <div className="ucr-grid-2" style={{ marginBottom: 0 }}>
                <SingleDropdown 
                  label="SELECT STATE *" 
                  options={stateOpts} 
                  value={leftFilters.stateId} 
                  onSelect={(v) => setLeftFilters(prev => ({ ...prev, stateId: v }))} 
                />
                <MultiSelectDropdown 
                  label="SELECT DISTRICT *" 
                  options={leftDistricts} 
                  selectedIds={leftFilters.districtIds} 
                  onChange={(v) => setLeftFilters(prev => ({ ...prev, districtIds: v }))} 
                  disabled={!leftFilters.stateId} 
                />
              </div>
            </div>

            {/* Right Filter */}
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#4b5563", margin: 0, textTransform: "uppercase" }}>Filter For Employee Selection</h3>
              </div>
              <div className="ucr-grid-2" style={{ marginBottom: 0 }}>
                <SingleDropdown 
                  label="SELECT STATE *" 
                  options={stateOpts} 
                  value={rightFilters.stateId} 
                  onSelect={(v) => setRightFilters(prev => ({ ...prev, stateId: v }))} 
                />
                <MultiSelectDropdown 
                  label="SELECT DISTRICT *" 
                  options={rightDistricts} 
                  selectedIds={rightFilters.districtIds} 
                  onChange={(v) => setRightFilters(prev => ({ ...prev, districtIds: v }))} 
                  disabled={!rightFilters.stateId} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ucr-grid-2">
        {/* LEFT TABLE: Stockists */}
        {leftFilters.stateId && leftFilters.districtIds.length > 0 ? (
          <div className="ucr-card" style={{ marginBottom: 0, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div className="ucr-header" style={{ background: "#f9fafb" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Stockist's To Be Mapped</h3>
            </div>
            
            <div className="ucr-body" style={{ padding: 0, flex: 1, display: "flex", flexDirection: "column" }}>
              <div className="ucr-table-container" style={{ border: "none", borderRadius: 0, flex: 1 }}>
                <table className="ucr-table" style={{ minWidth: 400 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 60, textAlign: "center" }}>Select</th>
                      <th>Headquarter Name</th>
                      <th>Stockist Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLeftLoading ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: 40 }}>
                          <Loader2 style={{ animation: "ucr-spin 1s linear infinite", margin: "0 auto", color: "#2563eb" }} size={24} />
                        </td>
                      </tr>
                    ) : stockists.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                          No stockists found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      pagedStockists.map((row) => (
                        <tr 
                          key={row.id} 
                          onClick={() => setSelectedStockistId(row.id)}
                          style={{ 
                            cursor: "pointer", 
                            background: selectedStockistId === row.id ? "#eff6ff" : "transparent"
                          }}
                        >
                          <td style={{ textAlign: "center" }}>
                            <div style={{ 
                              width: 16, height: 16, borderRadius: "50%", margin: "0 auto",
                              border: selectedStockistId === row.id ? "5px solid #2563eb" : "2px solid #d1d5db",
                              background: "#fff"
                            }} />
                          </td>
                          <td style={{ fontWeight: 600 }}>{row.headquarterName}</td>
                          <td style={{ fontWeight: 600, color: "#2563eb" }}>{row.stockistName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {stockists.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f3f4f6", background: "#f9fafb", fontSize: 11, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ color: "#6b7280" }}>
                    Showing <span style={{ fontWeight: 700, color: "#374151" }}>{pagedStockists.length === 0 ? 0 : (leftPage - 1) * leftPageSize + 1}</span> to <span style={{ fontWeight: 700, color: "#374151" }}>{Math.min(leftPage * leftPageSize, stockists.length)}</span> of <span style={{ fontWeight: 700, color: "#374151" }}>{stockists.length}</span> entries
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <select
                      value={leftPageSize}
                      onChange={(e) => { setLeftPageSize(Number(e.target.value)); setLeftPage(1); }}
                      style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "2px 6px" }}
                    >
                      {PAGE_SIZES.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <button
                      onClick={() => goToLeftPage(leftPage - 1)} disabled={leftPage === 1}
                      style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyItems: "center", cursor: leftPage === 1 ? "not-allowed" : "pointer", opacity: leftPage === 1 ? 0.4 : 1 }}
                    ><ChevronLeft size={13} style={{ margin: "0 auto" }} /></button>
                    <button
                      onClick={() => goToLeftPage(leftPage + 1)} disabled={leftPage === leftTotalPages || leftTotalPages === 0}
                      style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyItems: "center", cursor: (leftPage === leftTotalPages || leftTotalPages === 0) ? "not-allowed" : "pointer", opacity: (leftPage === leftTotalPages || leftTotalPages === 0) ? 0.4 : 1 }}
                    ><ChevronRight size={13} style={{ margin: "0 auto" }} /></button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="ucr-footer" style={{ justifyContent: "flex-start", borderRadius: "0 0 16px 16px" }}>
              <button
                type="button"
                onClick={handleMapSubmit}
                disabled={isSubmitting || !selectedStockistId}
                style={{
                  height: 36, padding: "0 20px", borderRadius: 8, background: "#2563eb", color: "#fff",
                  fontSize: 13, fontWeight: 700, border: "none", cursor: (isSubmitting || !selectedStockistId) ? "not-allowed" : "pointer",
                  opacity: (isSubmitting || !selectedStockistId) ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8
                }}
              >
                {isSubmitting ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Save size={16} />}
                Map Stockiest's
              </button>
            </div>
          </div>
        ) : (
          <div /> // Empty placeholder to maintain grid alignment
        )}

        {/* RIGHT TABLE: Employees */}
        {rightFilters.stateId && rightFilters.districtIds.length > 0 ? (
          <div className="ucr-card" style={{ marginBottom: 0, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div className="ucr-header" style={{ background: "#f9fafb" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Employees List</h3>
            </div>
            
            <div className="ucr-body" style={{ padding: 0, flex: 1, display: "flex", flexDirection: "column" }}>
              <div className="ucr-table-container" style={{ border: "none", borderRadius: 0, flex: 1 }}>
                <table className="ucr-table" style={{ minWidth: 400 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 60, textAlign: "center", cursor: "pointer" }} onClick={toggleAllEmployees}>
                        <div style={{ 
                          width: 16, height: 16, borderRadius: 4, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                          border: selectedEmployeeIds.length === employees.length && employees.length > 0 ? "1px solid #2563eb" : "2px solid #d1d5db",
                          background: selectedEmployeeIds.length === employees.length && employees.length > 0 ? "#2563eb" : "#fff"
                        }}>
                          {selectedEmployeeIds.length === employees.length && employees.length > 0 && <Check size={12} style={{ color: "#fff" }} />}
                        </div>
                      </th>
                      <th>Headquarter Name</th>
                      <th>User Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isRightLoading ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: 40 }}>
                          <Loader2 style={{ animation: "ucr-spin 1s linear infinite", margin: "0 auto", color: "#2563eb" }} size={24} />
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                          No employees found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      pagedEmployees.map((row) => (
                        <tr 
                          key={row.id} 
                          onClick={() => toggleEmployeeSelection(row.id)}
                          style={{ 
                            cursor: "pointer", 
                            background: selectedEmployeeIds.includes(row.id) ? "#eff6ff" : "transparent"
                          }}
                        >
                          <td style={{ textAlign: "center" }}>
                            <div style={{ 
                              width: 16, height: 16, borderRadius: 4, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                              border: selectedEmployeeIds.includes(row.id) ? "1px solid #2563eb" : "2px solid #d1d5db",
                              background: selectedEmployeeIds.includes(row.id) ? "#2563eb" : "#fff"
                            }}>
                              {selectedEmployeeIds.includes(row.id) && <Check size={12} style={{ color: "#fff" }} />}
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{row.headquarterName}</td>
                          <td style={{ fontWeight: 600, color: "#374151" }}>{row.employeeName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {employees.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f3f4f6", background: "#f9fafb", fontSize: 11, flexWrap: "wrap", gap: 12, borderRadius: "0 0 16px 16px" }}>
                  <div style={{ color: "#6b7280" }}>
                    Showing <span style={{ fontWeight: 700, color: "#374151" }}>{pagedEmployees.length === 0 ? 0 : (rightPage - 1) * rightPageSize + 1}</span> to <span style={{ fontWeight: 700, color: "#374151" }}>{Math.min(rightPage * rightPageSize, employees.length)}</span> of <span style={{ fontWeight: 700, color: "#374151" }}>{employees.length}</span> entries
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <select
                      value={rightPageSize}
                      onChange={(e) => { setRightPageSize(Number(e.target.value)); setRightPage(1); }}
                      style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "2px 6px" }}
                    >
                      {PAGE_SIZES.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <button
                      onClick={() => goToRightPage(rightPage - 1)} disabled={rightPage === 1}
                      style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyItems: "center", cursor: rightPage === 1 ? "not-allowed" : "pointer", opacity: rightPage === 1 ? 0.4 : 1 }}
                    ><ChevronLeft size={13} style={{ margin: "0 auto" }} /></button>
                    <button
                      onClick={() => goToRightPage(rightPage + 1)} disabled={rightPage === rightTotalPages || rightTotalPages === 0}
                      style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyItems: "center", cursor: (rightPage === rightTotalPages || rightTotalPages === 0) ? "not-allowed" : "pointer", opacity: (rightPage === rightTotalPages || rightTotalPages === 0) ? 0.4 : 1 }}
                    ><ChevronRight size={13} style={{ margin: "0 auto" }} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div /> // Empty placeholder
        )}
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// UI Components
// ═══════════════════════════════════════════════════════════════════

function SingleDropdown({ label, options, value, onSelect, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const selectedOption = options.find((option) => String(option.value) === String(value));
  const active = isOpen || Boolean(value);

  const openMenu = () => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen(true);
  };

  return (
    <div className="relative w-full select-none mt-1">
      <div
        ref={ref}
        onClick={openMenu}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex",
          alignItems: "center", border: `1.5px solid ${active && !disabled ? "#2563eb" : "#d1d5db"}`,
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f3f4f6" : "#fff",
          transition: "border-color 0.2s"
        }}
      >
        <span style={{ flex: 1, fontWeight: 600, color: (Boolean(value) && !disabled) ? "#111827" : disabled && Boolean(value) ? "#6b7280" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {selectedOption?.label || " "}
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
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div style={{ maxHeight: 250, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
              <p style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", margin: 0, textAlign: "center", fontStyle: "italic" }}>No options available</p>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: "10px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
                    background: String(value) === String(opt.value) ? "#eff6ff" : "transparent",
                    color: String(value) === String(opt.value) ? "#2563eb" : "#374151"
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}

function MultiSelectDropdown({ label, options, selectedIds, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

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

  const openMenu = () => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen(true);
  };

  return (
    <div className="relative w-full select-none mt-1">
      <div
        ref={ref}
        onClick={openMenu}
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
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectAll();
              }}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#2563eb", border: "none", cursor: "pointer" }}
            >
              Select All
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                clearAll();
              }}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#ef4444", border: "none", cursor: "pointer" }}
            >
              Clear All
            </button>
          </div>

          <div style={{ maxHeight: 250, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
              <p style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", margin: 0, textAlign: "center", fontStyle: "italic" }}>No options available.</p>
            ) : (
              options.map((option) => {
                const optId = String(option.id || option.value);
                const isSelected = selectedIds.includes(optId);
                return (
                  <button
                    key={optId}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleValue(optId);
                    }}
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
        </Portal>
      )}
    </div>
  );
}

function Portal({ top, left, width, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const handleMouseDown = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
          onClose();
        }
      };
      document.addEventListener("mousedown", handleMouseDown);
      return () => document.removeEventListener("mousedown", handleMouseDown);
    }, 10);

    return () => clearTimeout(timer);
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
    <div
      ref={ref}
      style={{ position: "fixed", top, left, width, zIndex: 99999 }}
      className="dropdown-portal bg-white border border-[#e5e7eb] rounded-lg shadow-xl overflow-hidden"
    >
      {children}
    </div>
  );
}