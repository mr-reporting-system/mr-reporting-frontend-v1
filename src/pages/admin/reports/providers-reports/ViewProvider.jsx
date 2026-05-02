import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, ChevronDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  FlaskConical, ArrowLeft, Search, X, User, Check,
  Calendar as CalendarIcon
} from "lucide-react";
import api from "../../../../services/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ─── Column definitions from Chemist__Stockist_Visit_Report.xlsx ─────────────
// S.No | State Name | Headquarter Name | Designation | Area Name | Employee Name
// Employee Code | Provider Type | Provider Name | Code | Address | Phone
// Status | Total Visit | Visit Dates | Product Name | POB | Order Qty
// Sample Qty | Discussion

export default function ChemistStockistVisitReport() {
  // ─── UI ──────────────────────────────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(true);
  const [viewMode,   setViewMode]   = useState("geographical"); // geographical | hierarchical

  // ─── Filter state ─────────────────────────────────────────────────────────
  const [selectType,             setSelectType]             = useState("");
  const [selectedStates,         setSelectedStates]         = useState([]);
  const [selectedReportOf,       setSelectedReportOf]       = useState([]); // chemist | stockist
  const [fromDate,               setFromDate]               = useState("");
  const [toDate,                 setToDate]                 = useState("");
  // Hierarchical only
  const [selectedDesignations, setSelectedDesignations] = useState([]);
  const [selectedEmployee,     setSelectedEmployee]     = useState("");

  // ─── Master data ─────────────────────────────────────────────────────────
  const [statesList,        setStatesList]        = useState([]);
  const [designationsList, setDesignationsList] = useState([]);
  const [employeesList,    setEmployeesList]    = useState([]);

  // ─── Table state ─────────────────────────────────────────────────────────
  const [tableData,    setTableData]    = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError,   setTableError]   = useState("");
  const [showTable,    setShowTable]    = useState(false);

  // ─── Drill-down (hierarchical employee click) ─────────────────────────────
  const [drillEmployee, setDrillEmployee] = useState(null);
  const [drillData,     setDrillData]     = useState([]);
  const [drillLoading,  setDrillLoading]  = useState(false);

  // ─── Pagination & search ─────────────────────────────────────────────────
  const [page,      setPage]      = useState(1);
  const [drillPage, setDrillPage] = useState(1);
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState("");

  // ─── Validation ──────────────────────────────────────────────────────────
  const [validationErr, setValidationErr] = useState("");

  // ─── Auth helper ─────────────────────────────────────────────────────────
  const getAuth = useCallback(() => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
  }), []);

  // ─── 1. States on mount ───────────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/masters/states", getAuth())
      .then(res => {
        const data = res.data?.data || res.data || [];
        setStatesList(
          Array.isArray(data)
            ? data.map(s => ({
                id:    String(s.id ?? s.stateId),
                label: s.state_name || s.stateName || s.name || "Unknown",
              }))
            : []
        );
      })
      .catch(err => console.error("Failed to load states", err));
  }, [getAuth]);

  // ─── 2. Designations on mount ────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/masters/designations", getAuth())
      .then(res => {
        const data = res.data?.data || res.data || [];
        setDesignationsList(
          Array.isArray(data)
            ? data.map(d => ({
                id:    String(d.id ?? d.designationId),
                label: d.designation_name || d.designationName || d.name || "Unknown",
              }))
            : []
        );
      })
      .catch(err => console.error("Failed to load designations", err));
  }, [getAuth]);

  // ─── 3. Employees when designations change (hierarchical) ─────────────────
  useEffect(() => {
    if (viewMode !== "hierarchical" || selectedDesignations.length === 0) {
      setEmployeesList([]);
      setSelectedEmployee("");
      return;
    }
    api.get(`/api/masters/employees?designationIds=${selectedDesignations.join(",")}`, getAuth())
      .then(res => {
        const data = res.data?.data || res.data || [];
        setEmployeesList(
          Array.isArray(data)
            ? data.map(e => ({
                id:    String(e.id ?? e.employeeId),
                label: e.employee_name || e.employeeName || e.name || "Unknown",
              }))
            : []
        );
      })
      .catch(err => console.error("Failed to load employees", err));
  }, [selectedDesignations, viewMode, getAuth]);

  // ─── Reset on mode switch ─────────────────────────────────────────────────
  const switchMode = (mode) => {
    setViewMode(mode);
    setSelectType("");
    setSelectedStates([]);
    setSelectedReportOf([]);
    setSelectedDesignations([]);
    setSelectedEmployee("");
    setFromDate(""); setToDate("");
    setShowTable(false); setTableData([]); setTableError("");
    setDrillEmployee(null); setDrillData([]);
    setValidationErr("");
    setSearch(""); setPage(1); setDrillPage(1);
  };

  // ─── Report Of options ────────────────────────────────────────────────────
  const REPORT_OF_OPTIONS = [
    { id: "Chemist",  label: "Chemist"  },
    { id: "Stockist", label: "Stockist" },
  ];

  // ─── Validate ────────────────────────────────────────────────────────────
  const validate = () => {
    if (!selectType) return "Type is required!!!";
    if (viewMode === "geographical") {
      if (selectType === "state" && selectedStates.length === 0) return "State is required!!!";
      if (selectedReportOf.length === 0) return "Get Report Of is required!!!";
    }
    if (viewMode === "hierarchical") {
      if (selectedDesignations.length === 0) return "Designation is required!!!";
      if (!selectedEmployee) return "Employee is required!!!";
      if (selectedReportOf.length === 0) return "Get Report Of is required!!!";
    }
    if (!fromDate) return "From Date is required!!!";
    if (!toDate)   return "To Date is required!!!";
    if (fromDate > toDate) return "From Date cannot be after To Date.";
    return "";
  };

  // ─── Build query params ───────────────────────────────────────────────────
  const buildParams = () => {
    const p = new URLSearchParams();
    p.append("mode",     viewMode);
    p.append("type",     selectType);
    p.append("fromDate", fromDate);
    p.append("toDate",   toDate);
    if (selectedReportOf.length)
      p.append("reportOf", selectedReportOf.join(","));
    if (viewMode === "geographical" && selectedStates.length)
      p.append("stateIds", selectedStates.join(","));
    if (viewMode === "hierarchical") {
      p.append("designationIds", selectedDesignations.join(","));
      p.append("employeeId",     selectedEmployee);
    }
    return p.toString();
  };

  // ─── View Report ─────────────────────────────────────────────────────────
  const handleViewReport = async () => {
    const err = validate();
    if (err) { setValidationErr(err); return; }
    setValidationErr("");
    setTableLoading(true);
    setShowTable(true);
    setTableData([]);
    setTableError("");
    setDrillEmployee(null);
    setDrillData([]);
    setPage(1); setSearch("");
    try {
      const res = await api.get(`/api/reports/chemist-stockist-visit?${buildParams()}`, getAuth());
      const data = res.data?.data || res.data || [];
      setTableData(Array.isArray(data) ? data : []);
    } catch (e) {
      setTableError(e.response?.data?.message || "Failed to load report. Please try again.");
    } finally {
      setTableLoading(false);
    }
  };

  // ─── Employee drill-down ─────────────────────────────────────────────────
  const handleEmployeeClick = async (row) => {
    setDrillEmployee(row);
    setDrillLoading(true);
    setDrillData([]);
    setDrillPage(1); setSearch("");
    try {
      const p = new URLSearchParams({
        employeeId: row.employeeId ?? row.employeeCode ?? "",
        fromDate,
        toDate,
        ...(selectedReportOf.length ? { reportOf: selectedReportOf.join(",") } : {}),
      });
      const res = await api.get(`/api/reports/chemist-stockist-visit/employee-detail?${p}`, getAuth());
      const data = res.data?.data || res.data || [];
      setDrillData(Array.isArray(data) ? data : []);
    } catch {
      setDrillData([]);
    } finally {
      setDrillLoading(false);
    }
  };

  // ─── Active data / pagination ─────────────────────────────────────────────
  const activeData    = drillEmployee ? drillData    : tableData;
  const activePage    = drillEmployee ? drillPage    : page;
  const setActivePage = drillEmployee ? setDrillPage : setPage;

  const filtered   = activeData.filter(r =>
    !search || Object.values(r).some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  // ─── Can generate? ────────────────────────────────────────────────────────
  const canGenerate = (() => {
    if (!selectType || !fromDate || !toDate || selectedReportOf.length === 0) return false;
    if (viewMode === "geographical" && selectType === "state" && selectedStates.length === 0) return false;
    if (viewMode === "hierarchical" && (!selectedEmployee || selectedDesignations.length === 0)) return false;
    return true;
  })();

  // ─── Table columns (from Excel) ───────────────────────────────────────────
  const TABLE_COLS = [
    { key: "sNo",             label: "S. No.",          center: true  },
    { key: "stateName",       label: "State Name"                     },
    { key: "headquarterName", label: "Headquarter Name"               },
    { key: "designation",     label: "Designation",     center: true  },
    { key: "areaName",        label: "Area Name"                      },
    { key: "employeeName",    label: "Employee Name",   clickable: true },
    { key: "employeeCode",    label: "Emp. Code",       center: true  },
    { key: "providerType",    label: "Provider Type",   center: true  },
    { key: "providerName",    label: "Provider Name"                  },
    { key: "code",            label: "Code",            center: true  },
    { key: "address",         label: "Address"                        },
    { key: "phone",           label: "Phone",           center: true  },
    { key: "status",          label: "Status",          center: true  },
    { key: "totalVisit",      label: "Total Visit",     center: true  },
    { key: "visitDates",      label: "Visit Dates"                    },
    { key: "productName",     label: "Product Name"                   },
    { key: "pob",             label: "POB",             center: true  },
    { key: "orderQty",        label: "Order Qty",       center: true  },
    { key: "sampleQty",       label: "Sample Qty",      center: true  },
    { key: "discussion",      label: "Discussion"                     },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ width:"100%", paddingBottom:48, fontFamily:"Inter,sans-serif" }}>

      {/* ══ FILTER CARD ════════════════════════════════════════════════════ */}
      <div style={{ background:"#fff", borderRadius:16, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", border:"1px solid #f3f4f6", overflow:"hidden", marginBottom: 20 }}>
        
        {/* Title row */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#eff6ff", border:"1px solid #dbeafe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <FlaskConical size={17} style={{ color:"#2563eb" }}/>
            </div>
            <div>
  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
    Chemist / Stockist Visit Report
  </h2>
  <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>
    Analyse chemist &amp; stockist visits by geography or hierarchy
  </p>
</div>
          </div>

          {/* Filter toggle */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase" }}>Filter</span>
            <button
              onClick={() => setFilterOpen(p => !p)}
              style={{
                position: "relative", width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", outline: "none",
                background: filterOpen ? "#2563eb" : "#d1d5db", transition: "background 0.2s"
              }}
            >
              <span style={{
                position: "absolute", top: 2, left: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 0.2s",
                transform: filterOpen ? "translateX(20px)" : "translateX(0)"
              }} />
            </button>
          </div>
        </div>

        {filterOpen && (
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Radio buttons */}
            <div style={{ display:"flex", alignItems:"center", gap:32 }}>
              {["geographical", "hierarchical"].map(mode => (
                <label
                  key={mode}
                  style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}
                  onClick={() => switchMode(mode)}
                >
                  <div style={{
                    width:16, height:16, borderRadius:"50%", border: viewMode===mode ? "2px solid #2563eb" : "2px solid #d1d5db",
                    display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s"
                  }}>
                    {viewMode===mode && <div style={{ width:8, height:8, borderRadius:"50%", background:"#2563eb" }}/>}
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, textTransform:"capitalize", color: viewMode===mode ? "#111827" : "#6b7280" }}>{mode}</span>
                </label>
              ))}
            </div>

            {/* ── Geographical Filters ─────────────────────────────────────── */}
            {viewMode === "geographical" && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 250px)", gap:16, alignItems:"start" }}>

                {/* Select Type */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <SingleDropdown
                    label="SELECT TYPE *"
                    value={selectType}
                    onSelect={v => {
                      setSelectType(v);
                      setSelectedStates([]);
                      setShowTable(false);
                      setValidationErr("");
                    }}
                    options={[
                      { value: "state",       label: "State"       },
                      { value: "headquarter", label: "Headquarter" },
                    ]}
                  />
                  {validationErr && !selectType && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#ef4444" }}>{validationErr}</span>
                  )}
                </div>

                {/* Select State (state type only) */}
                {selectType === "state" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <MultiDropdown
                      label="SELECT STATE *"
                      options={statesList}
                      selectedIds={selectedStates}
                      onChange={v => { setSelectedStates(v); setValidationErr(""); }}
                    />
                    {validationErr && selectType === "state" && selectedStates.length === 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#ef4444" }}>State is required!!!</span>
                    )}
                  </div>
                )}

                {/* Get Report Of — always visible once type chosen */}
                {selectType && (
                  <MultiDropdown
                    label="GET REPORT OF *"
                    options={REPORT_OF_OPTIONS}
                    selectedIds={selectedReportOf}
                    onChange={v => { setSelectedReportOf(v); setValidationErr(""); }}
                  />
                )}
                {/* From Date */}
                {selectType && (
                  <FDatePicker label="FROM DATE" value={fromDate} onChange={setFromDate} />
                )}

                {/* To Date */}
                {selectType && (
                  <FDatePicker label="TO DATE" value={toDate} onChange={setToDate} />
                )}
              </div>
            )}

            {/* ── Hierarchical Filters ─────────────────────────────────────── */}
            {viewMode === "hierarchical" && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, alignItems:"start" }}>

                {/* Type: fixed Employee Wise */}
                <SingleDropdown
                  label="SELECT TYPE *"
                  value={selectType || "employeeWise"}
                  onSelect={v => setSelectType(v)}
                  options={[{ value: "employeeWise", label: "Employee Wise" }]}
                />

                {/* Select Designation */}
                <MultiDropdown
                  label="SELECT DESIGNATION"
                  options={
                    designationsList.length
                      ? designationsList
                      : [
                          { id: "ASM", label: "ASM" },
                          { id: "MR",  label: "MR"  },
                          { id: "NSM", label: "NSM" },
                          { id: "RSM", label: "RSM" },
                          { id: "ZSM", label: "ZSM" },
                        ]
                  }
                  selectedIds={selectedDesignations}
                  onChange={v => { setSelectedDesignations(v); setSelectedEmployee(""); setValidationErr(""); }}
                />

                {/* Select Employee */}
                <SingleDropdown
                  label="SELECT EMPLOYEE *"
                  value={selectedEmployee}
                  onSelect={setSelectedEmployee}
                  options={employeesList}
                  disabled={selectedDesignations.length === 0}
                />

                {/* Get Report Of */}
                <MultiDropdown
                  label="GET REPORT OF *"
                  options={REPORT_OF_OPTIONS}
                  selectedIds={selectedReportOf}
                  onChange={v => { setSelectedReportOf(v); setValidationErr(""); }}
                />

                {/* From Date */}
                <FDatePicker label="FROM DATE" value={fromDate} onChange={setFromDate} />

                {/* To Date */}
                <FDatePicker label="TO DATE" value={toDate} onChange={setToDate} />
              </div>
            )}

            {/* Global validation error */}
            {validationErr && (
              <div style={{ display:"flex", alignItems:"center", gap:8, color:"#ef4444", fontSize:13, fontWeight:600 }}>
                <AlertCircle size={15} /> {validationErr}
              </div>
            )}

            {/* View Report button */}
            <div style={{ borderTop:"1px solid #f3f4f6", paddingTop:20, marginTop: 4 }}>
              <button
                onClick={handleViewReport}
                disabled={tableLoading}
                style={btnStyle("blue")}
              >
                {tableLoading ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> : <Check size={14} />}
                View Report
              </button>
            </div>

          </div>
        )}
      </div>

      {/* ══ RESULTS TABLE ═══════════════════════════════════════════════════ */}
      {showTable && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #f3f4f6", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>

          {/* Table header bar */}
          <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", background:"#f9fafb", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              {drillEmployee && (
                <button
                  onClick={() => { setDrillEmployee(null); setDrillData([]); setDrillPage(1); setSearch(""); }}
                  style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"none", cursor:"pointer", color:"#2563eb", fontSize:13, fontWeight:700 }}
                >
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              <h3 style={{ fontSize:14, fontWeight:700, color:"#111827", margin:0 }}>
                {drillEmployee
                  ? `Visit Details — ${drillEmployee.employeeName}`
                  : "Chemist / Stockist Visit Details"}
              </h3>
            </div>

            {/* Search */}
            <div style={{ position:"relative" }}>
              <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setActivePage(1); }}
                placeholder="Search records..."
                style={{ width:220, height:34, borderRadius:8, border:"1px solid #d1d5db", padding:"0 28px", fontSize:13, outline:"none", transition:"border 0.2s" }}
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setActivePage(1); }}
                  style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", cursor:"pointer", color:"#9ca3af" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", minWidth:"1500px", borderCollapse:"collapse", textAlign:"left", fontSize:13 }}>
              <thead style={{ background:"#f3f4f6", position:"sticky", top:0, zIndex:10 }}>
                <tr>
                  {TABLE_COLS.map((col, i) => (
                    <th
                      key={i}
                      style={{ padding:"12px 16px", fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.05em", fontSize:11, textAlign: col.center ? "center" : "left", borderBottom:"1px solid #e5e7eb" }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>

                {/* Loading */}
                {(tableLoading || drillLoading) && (
                  <tr>
                    <td colSpan={TABLE_COLS.length} style={{ padding:"64px 0", textAlign:"center" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                        <Loader2 size={28} style={{ color:"#2563eb", animation:"spin 1s linear infinite" }} />
                        <p style={{ fontSize:13, fontWeight:600, color:"#6b7280", margin:0 }}>Loading report data…</p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Error */}
                {!tableLoading && !drillLoading && tableError && (
                  <tr>
                    <td colSpan={TABLE_COLS.length} style={{ padding:"48px 0", textAlign:"center" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                        <AlertCircle size={24} style={{ color:"#f87171" }} />
                        <p style={{ fontSize:13, fontWeight:600, color:"#ef4444", margin:0 }}>{tableError}</p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Empty */}
                {!tableLoading && !drillLoading && !tableError && paged.length === 0 && (
                  <tr>
                    <td colSpan={TABLE_COLS.length} style={{ padding:"48px 0", textAlign:"center", fontSize:13, color:"#9ca3af", fontStyle:"italic" }}>
                      No records found
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!tableLoading && !drillLoading && !tableError && paged.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{ background: idx % 2 === 0 ? "#fff" : "#f9fafb", borderBottom:"1px solid #f3f4f6" }}
                  >
                    {TABLE_COLS.map((col, ci) => (
                      <td
                        key={ci}
                        style={{ padding:"10px 16px", textAlign: col.center ? "center" : "left", color:"#374151" }}
                      >
                        {/* Serial number */}
                        {col.key === "sNo" ? (
                          <span style={{ fontWeight:600, color:"#9ca3af" }}>
                            {(activePage - 1) * PAGE_SIZE + idx + 1}
                          </span>

                        /* Clickable employee name in hierarchical mode */
                        ) : col.key === "employeeName" && viewMode === "hierarchical" && !drillEmployee ? (
                          <button
                            onClick={() => handleEmployeeClick(row)}
                            style={{ display:"inline-flex", alignItems:"center", gap:4, background:"transparent", border:"none", cursor:"pointer", color:"#2563eb", fontWeight:700, textDecoration:"underline" }}
                          >
                            <User size={13} />
                            {row[col.key] ?? "—"}
                          </button>

                        /* Provider type badge */
                        ) : col.key === "providerType" ? (
                          <ProviderBadge value={row[col.key]} />

                        /* Status badge */
                        ) : col.key === "status" ? (
                          <StatusBadge value={row[col.key]} />

                        /* Default cell */
                        ) : (
                          <span style={{ fontWeight: ci <= 1 ? 600 : 400 }}>
                            {row[col.key] !== undefined && row[col.key] !== null && row[col.key] !== ""
                              ? String(row[col.key])
                              : <span style={{ color:"#d1d5db" }}>—</span>}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!tableLoading && !drillLoading && !tableError && filtered.length > 0 && (
            <div style={{ padding:"12px 20px", background:"#f9fafb", borderTop:"1px solid #f3f4f6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <p style={{ fontSize:12, fontWeight:600, color:"#6b7280", margin:0 }}>
                Showing {(activePage - 1) * PAGE_SIZE + 1}–{Math.min(activePage * PAGE_SIZE, filtered.length)} of {filtered.length} records
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <PagBtn onClick={() => setActivePage(1)} disabled={activePage === 1}><ChevronsLeft size={14} /></PagBtn>
                <PagBtn onClick={() => setActivePage(p => p - 1)} disabled={activePage === 1}><ChevronLeft size={14} /></PagBtn>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(activePage - 2, totalPages - 4)) + i;
                  return pg <= totalPages ? (
                    <PagBtn key={pg} onClick={() => setActivePage(pg)} active={pg === activePage}>{pg}</PagBtn>
                  ) : null;
                })}
                <PagBtn onClick={() => setActivePage(p => p + 1)} disabled={activePage === totalPages}><ChevronRight size={14} /></PagBtn>
                <PagBtn onClick={() => setActivePage(totalPages)} disabled={activePage === totalPages}><ChevronsRight size={14} /></PagBtn>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BUTTON STYLE HELPER
// ═══════════════════════════════════════════════════════════════
function btnStyle(color) {
  const map = { blue:{ bg:"#2563eb", hover:"#1d4ed8", shadow:"rgba(37,99,235,0.2)" }, red:{ bg:"#ef4444", hover:"#dc2626", shadow:"rgba(239,68,68,0.15)" } };
  return {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"8px 24px", borderRadius:9, border:"none", cursor:"pointer",
    fontSize:13, fontWeight:700, color:"#fff",
    background: map[color].bg,
    boxShadow: `0 2px 8px ${map[color].shadow}`,
    transition:"all 0.15s",
  };
}

// ═══════════════════════════════════════════════════════════════
// BADGE HELPERS
// ═══════════════════════════════════════════════════════════════
function ProviderBadge({ value }) {
  const v = String(value ?? "").toLowerCase();
  
  let bg = "#f3f4f6";
  let color = "#4b5563";
  let border = "#e5e7eb";

  if (v === "chemist") {
    bg = "#ecfdf5";
    color = "#047857";
    border = "#a7f3d0";
  } else if (v === "stockist") {
    bg = "#fffbeb";
    color = "#b45309";
    border = "#fde68a";
  } else if (v === "drug") {
    bg = "#faf5ff";
    color = "#7e22ce";
    border = "#e9d5ff";
  }

  return (
    <span style={{ padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:700, textTransform:"uppercase", background:bg, color:color, border:`1px solid ${border}` }}>
      {value ?? "—"}
    </span>
  );
}

function StatusBadge({ value }) {
  const v = String(value ?? "").toLowerCase();
  const isActive = v === "true" || v === "active" || v === "1";
  return isActive
    ? <span style={{ padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:700, textTransform:"uppercase", background:"#dcfce7", color:"#15803d", border:"1px solid #bbf7d0" }}>Active</span>
    : <span style={{ padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:700, textTransform:"uppercase", background:"#fee2e2", color:"#b91c1c", border:"1px solid #fecaca" }}>Inactive</span>;
}

// ═══════════════════════════════════════════════════════════════
// PAGINATION BUTTON
// ═══════════════════════════════════════════════════════════════
function PagBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:6, fontSize:12, fontWeight:700, transition:"all 0.15s", border:"none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: active ? "#2563eb" : disabled ? "transparent" : "#fff",
        color: active ? "#fff" : disabled ? "#9ca3af" : "#4b5563",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : disabled ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
        opacity: disabled ? 0.5 : 1
      }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// SINGLE DROPDOWN
// ═══════════════════════════════════════════════════════════════
function SingleDropdown({ label, value, onSelect, options=[], disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(()=>{
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[]);

  const selected = options.find(o => String(o.value ?? o.id)===String(value));
  const hasVal   = Boolean(value);
  const active   = open || hasVal;

  return (
    <div ref={ref} style={{ position:"relative", width:"100%", userSelect:"none", zIndex: open?100:1 }}>
      <div
        onClick={()=>{ if(!disabled) setOpen(!open); }}
        style={{
          width:"100%", height:38, borderRadius:8, padding:"0 36px 0 12px",
          fontSize:13, display:"flex", alignItems:"center", cursor: disabled?"not-allowed":"pointer",
          background: disabled?"#f9fafb":"#fff",
          border: open ? "1.5px solid #2563eb" : "1.5px solid #d1d5db",
          boxShadow: open ? "0 0 0 3px rgba(37,99,235,0.08)" : "none",
          transition:"all 0.15s", boxSizing:"border-box",
        }}
      >
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600, color: hasVal ? "#111827" : "transparent" }}>
          {selected?.label || " "}
        </span>
        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color: open?"#2563eb":"#9ca3af", display:"flex", alignItems:"center" }}>
          <ChevronDown size={15} style={{ transform: open?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s" }}/>
        </div>
      </div>

      {/* Floating label */}
      <label style={{
        position:"absolute", left:10, pointerEvents:"none", zIndex:11,
        transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
        top: active ? -9 : 10,
        fontSize: active ? 10 : 13,
        color: open ? "#2563eb" : active ? "#6b7280" : "#9ca3af",
        background: active ? "#fff" : "transparent",
        padding: active ? "0 4px" : "0",
      }}>
        {label}
      </label>

      {/* Dropdown */}
      {open && !disabled && (
        <div style={{
          position:"absolute", top:"calc(100% + 5px)", left:0, width:"100%", minWidth: 200,
          background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:10,
          boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:200, overflow:"hidden",
        }}>
          <ul style={{ maxHeight:200, overflowY:"auto", padding:"4px 0", margin:0, listStyle:"none" }}>
            {options.length===0 && <li style={{ padding:"10px 12px", fontSize:12, color:"#9ca3af", fontStyle:"italic" }}>No options</li>}
            {options.map(opt => {
              const optVal = String(opt.value ?? opt.id);
              return (
                <li key={optVal}
                  onMouseDown={e=>{ e.preventDefault(); onSelect(optVal); setOpen(false); }}
                  style={{
                    padding:"9px 12px", fontSize:13, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:8,
                    background: String(value)===optVal ? "#eff6ff" : "transparent",
                    color: String(value)===optVal ? "#2563eb" : "#374151",
                    fontWeight: String(value)===optVal ? 600 : 400,
                    transition:"background 0.1s",
                  }}
                  onMouseEnter={e=>{ if(String(value)!==optVal) e.currentTarget.style.background="#f9fafb"; }}
                  onMouseLeave={e=>{ if(String(value)!==optVal) e.currentTarget.style.background="transparent"; }}
                >
                  {String(value)===optVal && <Check size={12} style={{ color:"#2563eb", flexShrink:0 }}/>}
                  {opt.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MULTI DROPDOWN
// ═══════════════════════════════════════════════════════════════
function MultiDropdown({ label, options=[], selectedIds, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(()=>{
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[]);

  const toggle  = id => onChange(selectedIds.includes(id) ? selectedIds.filter(i=>i!==id) : [...selectedIds,id]);
  const selectAll = () => onChange(options.map(o => String(o.value ?? o.id)));
  const clearAll  = () => onChange([]);

  const hasVal  = selectedIds.length > 0;
  const active  = open || hasVal;
  const display = hasVal ? options.filter(o=>selectedIds.includes(String(o.value ?? o.id))).map(o=>o.label).join(", ") : "";

  return (
    <div ref={ref} style={{ position:"relative", width:"100%", userSelect:"none", zIndex: open?100:1 }}>
      <div
        onClick={()=>{ if(!disabled) setOpen(!open); }}
        style={{
          width:"100%", height:38, borderRadius:8, padding:"0 36px 0 12px",
          fontSize:13, display:"flex", alignItems:"center", cursor: disabled?"not-allowed":"pointer",
          background: disabled?"#f9fafb":"#fff",
          border: open ? "1.5px solid #2563eb" : "1.5px solid #d1d5db",
          boxShadow: open ? "0 0 0 3px rgba(37,99,235,0.08)" : "none",
          transition:"all 0.15s", boxSizing:"border-box",
        }}
      >
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600, color: hasVal ? "#111827" : "transparent" }}>
          {display || " "}
        </span>
        <div style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", color: open?"#2563eb":"#9ca3af", display:"flex", alignItems:"center", gap:2 }}>
          <ChevronDown size={14} style={{ transform: open?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s" }}/>
        </div>
      </div>

      <label style={{
        position:"absolute", left:10, pointerEvents:"none", zIndex:11,
        transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
        top: active ? -9 : 10,
        fontSize: active ? 10 : 13,
        color: open ? "#2563eb" : active ? "#6b7280" : "#9ca3af",
        background: active ? "#fff" : "transparent",
        padding: active ? "0 4px" : "0",
      }}>
        {label}
      </label>

      {open && !disabled && (
        <div style={{
          position:"absolute", top:"calc(100% + 5px)", left:0, width:"100%", minWidth: 200,
          background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:10,
          boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:200, overflow:"hidden",
        }}>
          {/* Action Buttons */}
          <div style={{ display:"flex", borderBottom:"1px solid #f3f4f6" }}>
            <button type="button" onMouseDown={e=>{e.preventDefault(); selectAll();}} style={{flex:1, padding:"8px", fontSize:11, fontWeight:700, color:"#fff", background:"#2563eb", border:"none", cursor:"pointer", transition:"opacity 0.2s"}} onMouseOver={e=>e.currentTarget.style.opacity=0.9} onMouseOut={e=>e.currentTarget.style.opacity=1}>Select All</button>
            <button type="button" onMouseDown={e=>{e.preventDefault(); clearAll();}} style={{flex:1, padding:"8px", fontSize:11, fontWeight:700, color:"#fff", background:"#ef4444", border:"none", cursor:"pointer", transition:"opacity 0.2s"}} onMouseOver={e=>e.currentTarget.style.opacity=0.9} onMouseOut={e=>e.currentTarget.style.opacity=1}>Deselect All</button>
          </div>
          <ul style={{ maxHeight:200, overflowY:"auto", padding:"4px 0", margin:0, listStyle:"none" }}>
            {options.length===0 && <li style={{ padding:"10px 12px", fontSize:12, color:"#9ca3af", fontStyle:"italic" }}>No options</li>}
            {options.map(opt => {
              const optVal = String(opt.value ?? opt.id);
              const sel = selectedIds.includes(optVal);
              return (
                <li key={optVal}
                  onMouseDown={e=>{ e.preventDefault(); toggle(optVal); }}
                  style={{
                    padding:"9px 12px", fontSize:13, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:8,
                    background: sel ? "#eff6ff" : "transparent",
                    transition:"background 0.1s",
                  }}
                  onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background="#f9fafb"; }}
                  onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background="transparent"; }}
                >
                  <div style={{
                    width:14, height:14, borderRadius:4, border: sel?"none":"1.5px solid #d1d5db",
                    background: sel?"#2563eb":"transparent",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  }}>
                    {sel && <Check size={9} style={{ color:"#fff" }}/>}
                  </div>
                  <span style={{ fontWeight: sel?600:400, color: sel?"#2563eb":"#374151" }}>{opt.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DATE PICKER (FIXED & MODERN)
// ═══════════════════════════════════════════════════════════════
function FDatePicker({ label, value, onChange, disabled }) {
  const [open,  setOpen]  = useState(false);
  const today  = new Date();
  const parsed = (value && !isNaN(Date.parse(value))) ? new Date(value + "T00:00:00") : today;
  const [view, setView]   = useState({ y: parsed.getFullYear(), m: parsed.getMonth() });
  const ref = useRef(null);

  useEffect(()=>{
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  const hasVal = Boolean(value);
  const active = open || hasVal;

  const prevMonth = () => setView(v => v.m===0 ? {y:v.y-1,m:11} : {y:v.y,m:v.m-1});
  const nextMonth = () => setView(v => v.m===11 ? {y:v.y+1,m:0} : {y:v.y,m:v.m+1});

  const selectDay = (day) => {
    const ds = `${view.y}-${String(view.m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    onChange(ds);
    setOpen(false);
  };

  const firstDow   = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m+1, 0).getDate();

  const displayVal = hasVal
  ? new Date(value + "T00:00:00").toLocaleDateString("en-IN")
  : "";

  const selStr = (d) => `${view.y}-${String(view.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  return (
    <div ref={ref} style={{ position:"relative", width:"100%", userSelect:"none", zIndex: open?100:1, marginTop: 4 }}>
      {/* Trigger */}
      <div
        onClick={()=>{ if(!disabled) setOpen(!open); }}
        style={{
          width:"100%", height:38, borderRadius:8, padding:"0 36px 0 12px",
          fontSize:13, display:"flex", alignItems:"center", cursor: disabled?"not-allowed":"pointer",
          background: disabled?"#f9fafb":"#fff",
          border: open ? "1.5px solid #2563eb" : "1.5px solid #d1d5db",
          boxShadow: open ? "0 0 0 3px rgba(37,99,235,0.08)" : "none",
          transition:"all 0.15s", boxSizing:"border-box",
        }}
      >
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600, color: hasVal?"#111827":"transparent" }}>
          {displayVal || " "}
        </span>
        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color: open?"#2563eb":"#9ca3af" }}>
          <CalendarIcon size={15}/>
        </div>
      </div>

      {/* Floating label */}
      <label style={{
        position:"absolute", left:10, pointerEvents:"none", zIndex:11,
        transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
        top: active ? -9 : 10,
        fontSize: active ? 10 : 13,
        color: open ? "#2563eb" : active ? "#6b7280" : "#9ca3af",
        background: active ? "#fff" : "transparent",
        padding: active ? "0 4px" : "0",
      }}>
        {label}
      </label>

      {/* Calendar dropdown */}
      {open && !disabled && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0,
          width:270, background:"#fff", borderRadius:14,
          border:"1.5px solid #e5e7eb",
          boxShadow:"0 12px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
          zIndex:200, overflow:"hidden",
        }}>
          {/* Month nav */}
          <div style={{ background:"#2563eb", padding:"14px 14px 10px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <button
              onMouseDown={e=>{ e.preventDefault(); e.stopPropagation(); prevMonth(); }}
              style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", flexShrink:0 }}
            >
              <ChevronLeft size={14}/>
            </button>
           <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Month Dropdown */}
              <select
                value={view.m}
                onChange={(e) => setView({ ...view, m: Number(e.target.value) })}
                style={{
                  background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
                  borderRadius: 6, padding: "2px 6px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", outline: "none"
                }}
              >
                {MONTHS.map((m, i) => <option key={i} value={i} style={{ color: "#000" }}>{m}</option>)}
              </select>

              {/* Year Dropdown */}
              <select
                value={view.y}
                onChange={(e) => setView({ ...view, y: Number(e.target.value) })}
                style={{
                  background: "rgba(255,255,255,0.15)", color: "#fff", border: "none",
                  borderRadius: 6, padding: "2px 6px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", outline: "none"
                }}
              >
                {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i).map((y) => (
                  <option key={y} value={y} style={{ color: "#000" }}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onMouseDown={e=>{ e.preventDefault(); e.stopPropagation(); nextMonth(); }}
              style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", flexShrink:0 }}
            >
              <ChevronRight size={14}/>
            </button>
          </div>

          {/* Day headers */}
          <div style={{ padding:"10px 12px 4px", background:"#f9fafb", borderBottom:"1px solid #f3f4f6" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, textAlign:"center" }}>
              {DAYS.map(d => (
                <div key={d} style={{ fontSize:10, fontWeight:700, color:"#9ca3af", padding:"2px 0" }}>{d}</div>
              ))}
            </div>
          </div>

          {/* Day grid */}
          <div style={{ padding:"8px 12px 12px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, textAlign:"center" }}>
              {/* empty cells for offset */}
              {Array.from({ length: firstDow }).map((_,i) => <div key={`e${i}`}/>)}

              {/* day cells */}
              {Array.from({ length: daysInMonth }).map((_,i) => {
                const d      = i + 1;
                const ds     = selStr(d);
                const isSel  = value === ds;
                const isToday = ds === todayStr;

                return (
                  <button key={d}
                    onMouseDown={e=>{ e.preventDefault(); e.stopPropagation(); selectDay(d); }}
                    style={{
                      width:"100%", aspectRatio:"1", borderRadius:"50%", border:"none",
                      fontSize:12, fontWeight: isSel||isToday ? 700 : 400,
                      cursor:"pointer", transition:"all 0.12s",
                      background: isSel ? "#2563eb" : isToday ? "#eff6ff" : "transparent",
                      color: isSel ? "#fff" : isToday ? "#2563eb" : "#374151",
                      boxShadow: isSel ? "0 2px 8px rgba(37,99,235,0.35)" : "none",
                      outline: isToday && !isSel ? "1.5px solid #bfdbfe" : "none",
                    }}
                    onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background="#eff6ff"; }}
                    onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background= isToday?"#eff6ff":"transparent"; }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}