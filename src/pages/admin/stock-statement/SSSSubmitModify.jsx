import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, CheckCircle2, ChevronDown,
  Filter, Check, Save, FileSpreadsheet
} from "lucide-react";
import api from "../../../services/api";

const INPUT_CLASS = "h-[38px]";

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
          // ✅ Updated exact endpoint provided by Shubham (using providers with employeeId, stateId, and districtId)
          const res = await api.get(`/api/expense/sss/providers?employeeId=${filters.employeeId}&stateId=${filters.stateId}&districtId=${filters.districtId}`, getAuthHeaders());
          const stockistData = res.data?.data || res.data || [];
          
          // ✅ Highly robust normalization to catch ANY stockist name variation
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
    <div className="space-y-6 animate-in fade-in duration-400 pb-12 font-sans">
      
      {/* ══ FILTER SECTION ═════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 rounded-t-xl" />
        
        {/* ✅ New Standardized Header Design */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
              <FileSpreadsheet size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Stock-Sales & Statement Filter</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Submit or modify monthly stock and sales records</p>
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
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-sm font-bold">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 gap-y-8">
              <SingleDropdown label="SELECT STATE *" options={stateOpts} value={filters.stateId} onSelect={(v) => handleFilterChange("stateId", v)} />
              <SingleDropdown label="SELECT DISTRICT *" options={distOpts} value={filters.districtId} onSelect={(v) => handleFilterChange("districtId", v)} disabled={!filters.stateId} />
              <SingleDropdown label="SELECT EMPLOYEE *" options={empOpts} value={filters.employeeId} onSelect={(v) => handleFilterChange("employeeId", v)} disabled={!filters.districtId} />
              <SingleDropdown label="SELECT STOCKIST *" options={stockOpts} value={filters.stockistId} onSelect={(v) => handleFilterChange("stockistId", v)} disabled={!filters.employeeId} />
              
              <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
                <SingleDropdown label="SELECT MONTH *" options={MONTHS} value={filters.month} onSelect={(v) => handleFilterChange("month", v)} />
                <SingleDropdown label="SELECT YEAR *" options={YEARS} value={filters.year} onSelect={(v) => handleFilterChange("year", v)} />
                
                <div className="lg:col-span-2 flex items-end">
                  <button 
                    onClick={handleFilterSubmit} 
                    disabled={isLoading} 
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-8 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 w-full sm:w-auto mt-1"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Submit SSS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ TABLE SECTION ═════════════════════════════════════════════════ */}
      {tableVisible && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <h3 className="text-base font-bold text-slate-800">Stock-Sales & Statement</h3>
            {successMsg && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full border border-emerald-200 text-xs font-bold animate-pulse">
                <CheckCircle2 size={14} /> {successMsg}
              </div>
            )}
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm text-left min-w-[1000px] border-collapse">
              <thead className="bg-blue-600 text-white text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4 text-center rounded-tl-lg">S.No</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-right">Net Rate</th>
                  <th className="py-3 px-4 text-center">Opening</th>
                  <th className="py-3 px-4 text-center">Primary</th>
                  <th className="py-3 px-4 text-center">Sales Return</th>
                  <th className="py-3 px-4 text-center">Closing</th>
                  <th className="py-3 px-4 text-center rounded-tr-lg">Secondary Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr><td colSpan="8" className="py-12 text-center text-slate-400 font-medium bg-slate-50/50">No products found for this selection.</td></tr>
                ) : products.map((row, index) => (
                  <tr key={row.id || index} className="transition-colors hover:bg-blue-50/30">
                    <td className="py-2.5 px-4 text-center text-slate-500 font-medium text-xs">{index + 1}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-700">{row.productName || "—"}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">₹{Number(row.netRate).toFixed(2) || 0}</td>
                    
                    {/* Editable Cells */}
                    <td className="py-2.5 px-4">
                      <TableInput value={row.opening} onChange={(val) => handleTableChange(index, "opening", val)} />
                    </td>
                    <td className="py-2.5 px-4">
                      <TableInput value={row.primarySale} onChange={(val) => handleTableChange(index, "primarySale", val)} />
                    </td>
                    <td className="py-2.5 px-4">
                      <TableInput value={row.salesReturn} onChange={(val) => handleTableChange(index, "salesReturn", val)} />
                    </td>
                    <td className="py-2.5 px-4">
                      <TableInput value={row.closing} onChange={(val) => handleTableChange(index, "closing", val)} />
                    </td>
                    <td className="py-2.5 px-4">
                      <TableInput value={row.secondarySale} onChange={(val) => handleTableChange(index, "secondarySale", val)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-start rounded-b-xl">
            <button 
              onClick={handleFinalSubmit} 
              disabled={isSubmitting || products.length === 0} 
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-[38px] px-8 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 w-full sm:w-auto mt-1"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Submit Data
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════

function TableInput({ value, onChange }) {
  return (
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-[32px] text-center border border-slate-300 rounded text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
    />
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

    const handleScroll = (e) => {
      if (e.target?.closest && e.target.closest('.dropdown-portal')) return;
      setIsOpen(false);
    };

    const handleResize = () => setIsOpen(false);

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => { 
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
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