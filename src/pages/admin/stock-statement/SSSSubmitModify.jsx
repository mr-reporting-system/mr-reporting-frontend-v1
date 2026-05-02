import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, CheckCircle2, ChevronDown,
  Filter, Check, Save, FileSpreadsheet
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
  .ucr-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1000px; }
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
    .ucr-header > button { align-self: flex-end; margin-top: -30px; }
    .ucr-footer { justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const FH = 40;

// ─── Constants ───────────────────────────────────────────────────────────────
const MONTHS = [
  { value: "January", label: "January" }, { value: "February", label: "February" },
  { value: "March", label: "March" }, { value: "April", label: "April" },
  { value: "May", label: "May" }, { value: "June", label: "June" },
  { value: "July", label: "July" }, { value: "August", label: "August" },
  { value: "September", label: "September" }, { value: "October", label: "October" },
  { value: "November", label: "November" }, { value: "December", label: "December" }
];

// Helper to convert Month String to Number for the API
const monthToNumber = {
  "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
  "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => ({
  value: String(CURRENT_YEAR - 2 + i),
  label: String(CURRENT_YEAR - 2 + i)
}));

export default function SSSSubmitModify() {
  // ─── UI State ────────────────────────────────────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [tableVisible, setTableVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ─── Filter State ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    stateId: "",
    districtId: "",
    employeeId: "",
    stockistId: "",
    month: "",
    year: String(CURRENT_YEAR)
  });

  // ─── Master Data (Dropdowns) ─────────────────────────────────────────────────
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stockists, setStockists] = useState([]);

  // ─── Table Data State ────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);

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
          id: s.id ?? s.stateId,
          stateName: s.state_name || s.stateName || s.name || "Unknown"
        })) : [];
        setStates(normalizedStates);
      } catch (err) { console.error("Failed to load states", err); }
    };
    fetchStates();
  }, [getAuthHeaders]);

  // 2. Fetch Districts when State changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, districtId: "", employeeId: "", stockistId: "" }));
    setDistricts([]); setEmployees([]); setStockists([]);
    setTableVisible(false);
    
    if (filters.stateId) {
      const fetchDistricts = async () => {
        try {
          const res = await api.get(`/api/masters/districts?stateId=${filters.stateId}`, getAuthHeaders());
          const districtData = res.data?.data || res.data || [];
          const normalizedDistricts = Array.isArray(districtData) ? districtData.map((d) => ({
            id: d.id ?? d.districtId,
            districtName: d.district_name || d.districtName || d.name || "Unknown"
          })) : [];
          setDistricts(normalizedDistricts);
        } catch (err) { console.error("Failed to load districts", err); }
      };
      fetchDistricts();
    }
  }, [filters.stateId, getAuthHeaders]);

  // 3. Fetch Employees when District changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, employeeId: "", stockistId: "" }));
    setEmployees([]); setStockists([]);
    setTableVisible(false);

    if (filters.districtId) {
      const fetchEmployees = async () => {
        try {
          const res = await api.get(`/api/masters/employees/filter?stateId=${filters.stateId}&districtId=${filters.districtId}`, getAuthHeaders());
          const employeeData = res.data?.data || res.data || [];
          const normalizedEmployees = Array.isArray(employeeData) ? employeeData.map((e) => ({
            id: e.id ?? e.employeeId,
            employeeName: e.employee_name || e.employeeName || e.name || "Unknown"
          })) : [];
          setEmployees(normalizedEmployees);
        } catch (err) { console.error("Failed to load employees", err); }
      };
      fetchEmployees();
    }
  }, [filters.stateId, filters.districtId, getAuthHeaders]);

  // 4. Fetch Stockists when Employee changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, stockistId: "" }));
    setStockists([]);
    setTableVisible(false);

    if (filters.employeeId) {
      const fetchStockists = async () => {
        try {
          const res = await api.get(`/api/expense/sss/providers?employeeId=${filters.employeeId}&stateId=${filters.stateId}&districtId=${filters.districtId}`, getAuthHeaders());
          const stockistData = res.data?.data || res.data || [];
          
          const normalizedStockists = Array.isArray(stockistData)
            ? stockistData.map((s) => ({
                id: String(s.id ?? ""),
                stockistName: s.providerName || s.name || "Unknown",
                type: s.type || ""
              })).filter((s) => s.id !== "")
            : [];
          
          setStockists(normalizedStockists);
        } catch (err) { 
          console.error("Failed to load stockists", err); 
        }
      };
      fetchStockists();
    }
  }, [filters.employeeId, filters.stateId, filters.districtId, getAuthHeaders]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setTableVisible(false); 
  };

  const handleFilterSubmit = async () => {
    setError("");
    setSuccessMsg("");

    if (!filters.stateId || !filters.districtId || !filters.employeeId || !filters.stockistId || !filters.month || !filters.year) {
      return setError("Please select all filter fields before submitting.");
    }

    setIsLoading(true);
    try {
      const monthNum = monthToNumber[filters.month];

      const res = await api.get(
        `/api/expense/sss/form?providerId=${filters.stockistId}&stateId=${filters.stateId}&month=${monthNum}&year=${filters.year}`,
        getAuthHeaders()
      );

      const formData = res.data?.data || {};
      const fetchedProducts = Array.isArray(formData.rows) ? formData.rows : [];

      const formattedProducts = fetchedProducts.map((p) => ({
        ...p,
        opening: String(p.opening ?? 0),
        primarySale: String(p.primarySale ?? 0),
        salesReturn: String(p.salesReturn ?? 0),
        closing: String(p.closing ?? 0),
        secondarySale: String(p.secondarySale ?? 0),
        receipt: String(p.receipt ?? 0),
        scheme: String(p.scheme ?? 0),
        expiry: String(p.expiry ?? 0),
        breakage: String(p.breakage ?? 0),
        batchRecall: String(p.batchRecall ?? 0),
        batchNumber: p.batchNumber || null
      }));

      setProducts(formattedProducts);
      setTableVisible(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statement data.");
      setProducts([]);
      setTableVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableChange = (index, field, value) => {
    // Allow only numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      const updatedProducts = [...products];
      updatedProducts[index][field] = value;
      setProducts(updatedProducts);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      const monthNum = monthToNumber[filters.month];

      const payload = {
        providerId: Number(filters.stockistId),
        month: monthNum,
        year: Number(filters.year),
        rows: products.map((p) => ({
          productId: p.productId || p.id,
          opening: Number(p.opening) || 0,
          receipt: Number(p.receipt) || 0,
          primarySale: Number(p.primarySale) || 0,
          scheme: Number(p.scheme) || 0,
          salesReturn: Number(p.salesReturn) || 0,
          closing: Number(p.closing) || 0,
          expiry: Number(p.expiry) || 0,
          breakage: Number(p.breakage) || 0,
          batchRecall: Number(p.batchRecall) || 0,
          batchNumber: p.batchNumber || null,
          secondarySale: Number(p.secondarySale) || 0
        }))
      };

      await api.post("/api/expense/sss", payload, getAuthHeaders());

      setSuccessMsg("Stock-Sales & Statement submitted successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        setTableVisible(false);
        setProducts([]);
      }, 4000);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit statement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Robust Dropdown Options Mapping ─────────────────────────────────────────
  const stateOpts = states.map(s => ({ value: String(s.id), label: s.stateName })).filter(opt => opt.value !== "");
  const distOpts = districts.map(d => ({ value: String(d.id), label: d.districtName })).filter(opt => opt.value !== "");
  const empOpts = employees.map(e => ({ value: String(e.id), label: e.employeeName })).filter(opt => opt.value !== "");
  const stockOpts = stockists.map((s) => ({
    value: String(s.id),
    label: s.type ? `${s.stockistName} (${s.type})` : s.stockistName
  })).filter((opt) => opt.value !== "");

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

      {/* Filter Card */}
      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileSpreadsheet size={17} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Stock-Sales & Statement Filter</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>Submit or modify monthly stock and sales records</p>
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
              <FloatingDropdown label="SELECT STATE *" options={stateOpts} value={filters.stateId} onSelect={(v) => handleFilterChange("stateId", v)} />
              <FloatingDropdown label="SELECT DISTRICT *" options={distOpts} value={filters.districtId} onSelect={(v) => handleFilterChange("districtId", v)} disabled={!filters.stateId} />
              <FloatingDropdown label="SELECT EMPLOYEE *" options={empOpts} value={filters.employeeId} onSelect={(v) => handleFilterChange("employeeId", v)} disabled={!filters.districtId} />
              <FloatingDropdown label="SELECT STOCKIST *" options={stockOpts} value={filters.stockistId} onSelect={(v) => handleFilterChange("stockistId", v)} disabled={!filters.employeeId} />
              
              <FloatingDropdown label="SELECT MONTH *" options={MONTHS} value={filters.month} onSelect={(v) => handleFilterChange("month", v)} />
              <FloatingDropdown label="SELECT YEAR *" options={YEARS} value={filters.year} onSelect={(v) => handleFilterChange("year", v)} />
              
              <div className="col-span-2" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleFilterSubmit}
                  disabled={isLoading}
                  style={{
                    height: 40, padding: "0 24px", borderRadius: 8, background: "#2563eb", color: "#fff", width: "100%", maxWidth: 200,
                    fontSize: 13, fontWeight: 700, border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}
                >
                  {isLoading ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Check size={16} />}
                  Submit SSS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      {tableVisible && (
        <div className="ucr-card">
          <div className="ucr-header" style={{ justifyContent: "space-between", background: "#f9fafb" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Stock-Sales & Statement</h3>
          </div>

          <div className="ucr-body" style={{ padding: 0 }}>
            <div className="ucr-table-container" style={{ border: "none", borderRadius: "0 0 16px 16px" }}>
              <table className="ucr-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "center", width: 60 }}>S.No</th>
                    <th>Product Name</th>
                    <th style={{ textAlign: "right" }}>Net Rate</th>
                    <th style={{ textAlign: "center", width: 120 }}>Opening</th>
                    <th style={{ textAlign: "center", width: 120 }}>Primary</th>
                    <th style={{ textAlign: "center", width: 120 }}>Sales Return</th>
                    <th style={{ textAlign: "center", width: 120 }}>Closing</th>
                    <th style={{ textAlign: "center", width: 120 }}>Secondary Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                        No products found for this selection.
                      </td>
                    </tr>
                  ) : (
                    products.map((row, index) => (
                      <tr key={row.id || index}>
                        <td style={{ color: "#6b7280", textAlign: "center" }}>{index + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.productName || "—"}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>₹{Number(row.netRate).toFixed(2) || 0}</td>
                        <td style={{ padding: "8px 16px" }}>
                          <TableInput value={row.opening} onChange={(val) => handleTableChange(index, "opening", val)} />
                        </td>
                        <td style={{ padding: "8px 16px" }}>
                          <TableInput value={row.primarySale} onChange={(val) => handleTableChange(index, "primarySale", val)} />
                        </td>
                        <td style={{ padding: "8px 16px" }}>
                          <TableInput value={row.salesReturn} onChange={(val) => handleTableChange(index, "salesReturn", val)} />
                        </td>
                        <td style={{ padding: "8px 16px" }}>
                          <TableInput value={row.closing} onChange={(val) => handleTableChange(index, "closing", val)} />
                        </td>
                        <td style={{ padding: "8px 16px" }}>
                          <TableInput value={row.secondarySale} onChange={(val) => handleTableChange(index, "secondarySale", val)} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ucr-footer" style={{ justifyContent: "flex-start" }}>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting || products.length === 0}
              style={{
                height: 40, padding: "0 24px", borderRadius: 8, background: "#2563eb", color: "#fff",
                fontSize: 13, fontWeight: 700, border: "none", cursor: (isSubmitting || products.length === 0) ? "not-allowed" : "pointer",
                opacity: (isSubmitting || products.length === 0) ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8
              }}
            >
              {isSubmitting ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Save size={16} />}
              Submit Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// UI Components Restyled to match Reference Exactly
// ═══════════════════════════════════════════════════════════════════

function TableInput({ value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        width: "100%", height: 34, textAlign: "center", border: `1.5px solid ${isFocused ? "#2563eb" : "#d1d5db"}`,
        borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#111827", outline: "none",
        background: "#fff", transition: "0.2s"
      }}
    />
  );
}

function FloatingDropdown({ label, options, value, onSelect, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const selectedOption = options.find((option) => String(option.value) === String(value));
  const active = isOpen || Boolean(value);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
        <div
          style={{
            position: "absolute", top: "110%", left: 0, width: "100%", background: "#fff",
            border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden"
          }}
        >
          <div style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
              <p style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", margin: 0, textAlign: "center", fontStyle: "italic" }}>No options available</p>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => { onSelect(opt.value); setIsOpen(false); }}
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
        </div>
      )}
    </div>
  );
}