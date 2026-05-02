import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, ChevronDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  TrendingUp, Search, X, Check, Download,
  Calendar as CalendarIcon
} from "lucide-react";
// Go up 4 levels: providers-reports -> reports -> admin -> pages -> src
import api from "../../../../services/api";

const INPUT_CLASS = "h-[38px]";

// ─── Columns from POB_Provider_Wise_Report.xlsx ───────────────────────────────
const TABLE_COLS = [
  { key: "sNo",             label: "S. No.",           center: true  },
  { key: "managerLevel2",   label: "Manager (Level-2)"                },
  { key: "managerLevel1",   label: "Manager (Level-1)"                },
  { key: "state",           label: "State"                            },
  { key: "headQuarter",     label: "HeadQuarter"                      },
  { key: "area",            label: "Area"                             },
  { key: "employeeCode",    label: "Employee Code",     center: true  },
  { key: "employeeName",    label: "Employee Name"                    },
  { key: "designation",     label: "Designation",       center: true  },
  { key: "managerName",     label: "Manager Name"                     },
  { key: "providerName",    label: "Provider Name"                    },
  { key: "additionDate",    label: "Addition Date",     center: true  },
  { key: "providerCode",    label: "Provider Code",     center: true  },
  { key: "providerType",    label: "Provider Type",     center: true  },
  { key: "specialization",  label: "Specialization"                   },
  { key: "category",        label: "Category",          center: true  },
  { key: "visitDate",       label: "Visit Date",        center: true  },
  { key: "productName",     label: "Product Name"                     },
  { key: "quantity",        label: "Quantity",          center: true  },
  { key: "orderValue",      label: "Order Value",       center: true  },
  { key: "scheme",          label: "Scheme",            center: true  },
  { key: "total",           label: "Total",             center: true  },
];

export default function SpecialityDoctorReport() {
  // ─── UI ────────────────────────────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(true);

  // ─── Filter state ──────────────────────────────────────────────────────────
  const [selectedState,    setSelectedState]    = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [fromDate,         setFromDate]         = useState("");
  const [toDate,           setToDate]           = useState("");

  // ─── Master data ───────────────────────────────────────────────────────────
  const [statesList,     setStatesList]     = useState([]);
  const [districtsList,  setDistrictsList]  = useState([]);
  const [employeesList,  setEmployeesList]  = useState([]);

  // ─── Table state ───────────────────────────────────────────────────────────
  const [tableData,    setTableData]    = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError,   setTableError]   = useState("");
  const [showTable,    setShowTable]    = useState(false);

  // ─── Pagination & search ───────────────────────────────────────────────────
  const [page,   setPage]   = useState(1);
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState("");

  // ─── Validation ────────────────────────────────────────────────────────────
  const [validationErr, setValidationErr] = useState("");

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const getAuth = useCallback(() => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
  }), []);

  // ─── 1. States on mount ────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/masters/states", getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setStatesList(Array.isArray(d) ? d.map(s => ({
          value: String(s.id ?? s.stateId),
          label: s.state_name || s.stateName || s.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("states", e));
  }, [getAuth]);

  // ─── 2. Districts when state changes ──────────────────────────────────────
  useEffect(() => {
    if (!selectedState) {
      setDistrictsList([]); setSelectedDistrict("");
      setEmployeesList([]); setSelectedEmployee("");
      return;
    }
    api.get(`/api/masters/districts?stateId=${selectedState}`, getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setDistrictsList(Array.isArray(d) ? d.map(x => ({
          value: String(x.id ?? x.districtId),
          label: x.district_name || x.districtName || x.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("districts", e));
    setSelectedDistrict("");
    setEmployeesList([]); setSelectedEmployee("");
  }, [selectedState, getAuth]);

  // ─── 3. Employees when district changes ───────────────────────────────────
  useEffect(() => {
    if (!selectedDistrict) {
      setEmployeesList([]); setSelectedEmployee("");
      return;
    }
    api.get(`/api/masters/employees?stateId=${selectedState}&districtId=${selectedDistrict}`, getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setEmployeesList(Array.isArray(d) ? d.map(e => ({
          value: String(e.id ?? e.employeeId),
          label: e.employee_name || e.employeeName || e.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("employees", e));
    setSelectedEmployee("");
  }, [selectedDistrict, selectedState, getAuth]);

  // ─── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (!selectedState)    return "State is required!!!";
    if (!selectedDistrict) return "District is required!!!";
    if (!selectedEmployee) return "Employee is required!!!";
    if (!fromDate)         return "From Date is required!!!";
    if (!toDate)           return "To Date is required!!!";
    if (fromDate > toDate) return "From Date cannot be after To Date.";
    return "";
  };

  // ─── View Status ──────────────────────────────────────────────────────────
  const handleViewStatus = async () => {
    const err = validate();
    if (err) { setValidationErr(err); return; }
    setValidationErr("");
    setTableLoading(true);
    setShowTable(true);
    setTableData([]); setTableError("");
    setPage(1); setSearch("");
    try {
      const p = new URLSearchParams({
        stateId:    selectedState,
        districtId: selectedDistrict,
        employeeId: selectedEmployee,
        fromDate,
        toDate,
      });
      const res = await api.get(`/api/reports/employee-wise-pob?${p}`, getAuth());
      const data = res.data?.data || res.data || [];
      setTableData(Array.isArray(data) ? data : []);
    } catch (e) {
      setTableError(e.response?.data?.message || "Failed to load report. Please try again.");
    } finally {
      setTableLoading(false);
    }
  };

  // ─── CSV Download ──────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!tableData.length) return;
    const headers = TABLE_COLS.filter(c => c.key !== "sNo").map(c => c.label);
    const rows    = tableData.map(r =>
      TABLE_COLS.filter(c => c.key !== "sNo").map(c => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`)
    );
    const csv  = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "Speciality_Doctor_Report.csv";
    a.click();
  };

  const filtered   = tableData.filter(r =>
    !search || Object.values(r).some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5 animate-in fade-in duration-400 pb-12 font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Speciality Doctor Report</h2>
              <p className="text-[11px] text-slate-500">POB analysis with employee and provider specialization</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter</span>
            <button
              onClick={() => setFilterOpen(p => !p)}
              className={`relative w-10 h-5 rounded-full transition-colors ${filterOpen ? "bg-blue-600" : "bg-slate-200"}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${filterOpen ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
              <div className="space-y-1">
                <SingleDropdown label="SELECT STATE *" value={selectedState} onSelect={v => { setSelectedState(v); setValidationErr(""); }} options={statesList} />
                {validationErr === "State is required!!!" && <p className="text-red-500 text-[10px] font-semibold px-1">Required!</p>}
              </div>

              <div className="space-y-1">
                <SingleDropdown label="SELECT DISTRICT *" value={selectedDistrict} onSelect={v => { setSelectedDistrict(v); setValidationErr(""); }} options={districtsList} disabled={!selectedState} />
                {validationErr === "District is required!!!" && <p className="text-red-500 text-[10px] font-semibold px-1">Required!</p>}
              </div>

              <div className="space-y-1">
                <SingleDropdown label="SELECT EMPLOYEE *" value={selectedEmployee} onSelect={v => { setSelectedEmployee(v); setValidationErr(""); }} options={employeesList} disabled={!selectedDistrict} />
                {validationErr === "Employee is required!!!" && <p className="text-red-500 text-[10px] font-semibold px-1">Required!</p>}
              </div>

              <DateInput label="FROM DATE" value={fromDate} onChange={v => { setFromDate(v); setValidationErr(""); }} />
              <DateInput label="TO DATE" value={toDate} onChange={v => { setToDate(v); setValidationErr(""); }} />
            </div>

            {validationErr && !validationErr.includes("required!!!") && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-semibold bg-red-50 p-2 rounded-lg border border-red-100">
                <AlertCircle size={14} /> {validationErr}
              </div>
            )}

            <button
              onClick={handleViewStatus}
              disabled={tableLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-blue-100 shadow-lg transition-all active:scale-95"
            >
              {tableLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              View Report
            </button>
          </div>
        )}
      </div>

      {showTable && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-sm font-bold text-slate-800">Speciality Details</h3>
            <div className="flex items-center gap-3">
              {!tableLoading && !tableError && tableData.length > 0 && (
                <button onClick={handleDownload} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-emerald-200 transition-all">
                  <Download size={13} /> Export CSV
                </button>
              )}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search speciality..."
                  className="pl-9 pr-8 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 w-48 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse" style={{ minWidth: "1800px" }}>
              <thead className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  {TABLE_COLS.map((col, i) => (
                    <th key={i} className={`py-4 px-4 border-b border-slate-100 ${col.center ? "text-center" : "text-left"}`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tableLoading ? (
                  <tr><td colSpan={TABLE_COLS.length} className="py-20 text-center"><Loader2 size={30} className="animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : tableError ? (
                  <tr><td colSpan={TABLE_COLS.length} className="py-12 text-center text-red-500 font-semibold"><AlertCircle size={24} className="mx-auto mb-2" />{tableError}</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={TABLE_COLS.length} className="py-14 text-center text-slate-400 italic">No records found</td></tr>
                ) : paged.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    {TABLE_COLS.map((col, ci) => (
                      <td key={ci} className={`py-3.5 px-4 border-b border-slate-50 ${col.center ? "text-center" : ""}`}>
                        {col.key === "sNo" ? <span className="text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</span> :
                         col.key === "providerType" ? <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">{row[col.key]}</span> :
                         <span className={ci <= 1 ? "font-semibold text-slate-700" : "text-slate-600"}>{row[col.key] || "—"}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!tableLoading && !tableError && filtered.length > 0 && (
            <div className="px-6 py-4 flex items-center justify-between bg-slate-50/30 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <PagBtn onClick={() => setPage(1)} disabled={page === 1} icon={<ChevronsLeft size={14}/>} />
                <PagBtn onClick={() => setPage(p => p - 1)} disabled={page === 1} icon={<ChevronLeft size={14}/>} />
                <span className="px-4 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-md">{page}</span>
                <PagBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages} icon={<ChevronRight size={14}/>} />
                <PagBtn onClick={() => setPage(totalPages)} disabled={page === totalPages} icon={<ChevronsRight size={14}/>} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SingleDropdown({ label, value, onSelect, options = [], disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const openMenu = () => { if (!disabled) { const r = ref.current?.getBoundingClientRect(); setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width }); setIsOpen(true); } };
  useEffect(() => {
    if (!isOpen) return;
    const close = e => { if (!e.target?.closest?.(".dropdown-portal")) setIsOpen(false); };
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [isOpen]);

  const selected = options.find(o => String(o.value ?? o.id) === String(value));
  return (
    <div className="relative w-full">
      <div ref={ref} onClick={openMenu} className={`w-full ${INPUT_CLASS} rounded-xl border flex items-center px-3 cursor-pointer transition-all ${disabled ? "bg-slate-50 border-slate-200 cursor-not-allowed" : "bg-white border-slate-200 hover:border-blue-300"}`}>
        <span className={`truncate text-xs flex-1 ${value ? "text-slate-800 font-semibold" : "text-slate-400"}`}>{selected?.label || label}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>
      {isOpen && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <ul className="py-1 max-h-48 overflow-y-auto">
            {options.length === 0 ? <li className="px-4 py-2 text-xs text-slate-400 italic">No options</li> : 
             options.map((opt, i) => (
              <li key={i} onMouseDown={e => { e.preventDefault(); onSelect(String(opt.value ?? opt.id)); setIsOpen(false); }} className="px-4 py-2 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer font-medium">{opt.label}</li>
            ))}
          </ul>
        </Portal>
      )}
    </div>
  );
}

function DateInput({ label, value, onChange }) {
  const ref = useRef(null);
  return (
    <div className="relative w-full group">
      <div onClick={() => ref.current?.showPicker?.()} className={`w-full ${INPUT_CLASS} rounded-xl border border-slate-200 bg-white flex items-center px-3 cursor-pointer transition-all group-hover:border-blue-300`}>
        <span className={`text-xs flex-1 ${value ? "text-slate-800 font-semibold" : "text-slate-400"}`}>{value || label}</span>
        <CalendarIcon size={14} className="text-slate-400" />
      </div>
      <input ref={ref} type="date" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
    </div>
  );
}

function PagBtn({ onClick, disabled, icon }) {
  return (
    <button onClick={onClick} disabled={disabled} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm">
      {icon}
    </button>
  );
}

function Portal({ top, left, width, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: "fixed", top, left, width, zIndex: 9999 }} className="dropdown-portal bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden animate-in zoom-in-95 duration-150">
      {children}
    </div>
  );
}