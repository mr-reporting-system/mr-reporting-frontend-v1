import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, AlertCircle, ChevronDown, Check,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ClipboardX, ArrowLeft, Search, X, User,
  Calendar as CalendarIcon
} from "lucide-react";

import api from "../../../../services/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function MissedProviderReport() {
  const [filterOpen, setFilterOpen] = useState(true);
  const [viewMode,   setViewMode]   = useState("geographical");

  const [selectType,         setSelectType]         = useState("");
  const [providerRadio,      setProviderRadio]      = useState("doctor");
  const [selectedStatus,     setSelectedStatus]     = useState(["active"]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [fromDate,           setFromDate]           = useState("");
  const [toDate,             setToDate]             = useState("");

  const [selectedStates,     setSelectedStates]     = useState([]);
  const [selectedDistricts,  setSelectedDistricts]  = useState([]);
  const [selectedAreas,      setSelectedAreas]      = useState([]);

  const [selectedDesignations, setSelectedDesignations] = useState([]);
  const [selectedEmployees,    setSelectedEmployees]    = useState([]);

  const [statesList,        setStatesList]        = useState([]);
  const [districtsList,     setDistrictsList]     = useState([]);
  const [areasList,         setAreasList]         = useState([]);
  const [designationsList,  setDesignationsList]  = useState([]);
  const [employeesList,     setEmployeesList]     = useState([]);

  const [tableData,    setTableData]    = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError,   setTableError]   = useState("");
  const [showTable,    setShowTable]    = useState(false);

  const [drillEmployee, setDrillEmployee] = useState(null);
  const [drillData,     setDrillData]     = useState([]);
  const [drillLoading,  setDrillLoading]  = useState(false);

  const [page,      setPage]      = useState(1);
  const [drillPage, setDrillPage] = useState(1);
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState("");

  const [validationErr, setValidationErr] = useState("");

  const getAuth = useCallback(() => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
  }), []);

  useEffect(() => {
    api.get("/api/masters/states", getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setStatesList(Array.isArray(d) ? d.map(s => ({
          id: String(s.id ?? s.stateId),
          label: s.state_name || s.stateName || s.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("states", e));
  }, [getAuth]);

  useEffect(() => {
    api.get("/api/masters/designations", getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setDesignationsList(Array.isArray(d) ? d.map(x => ({
          id: String(x.id ?? x.designationId),
          label: x.designation_name || x.designationName || x.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("designations", e));
  }, [getAuth]);

  useEffect(() => {
    if (viewMode !== "geographical" || selectedStates.length === 0 || selectType === "state") {
      setDistrictsList([]); setSelectedDistricts([]); setAreasList([]); setSelectedAreas([]);
      return;
    }
    api.get(`/api/masters/districts?stateIds=${selectedStates.join(",")}`, getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setDistrictsList(Array.isArray(d) ? d.map(x => ({
          id: String(x.id ?? x.districtId),
          label: x.district_name || x.districtName || x.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("districts", e));
    setSelectedDistricts([]); setAreasList([]); setSelectedAreas([]);
  }, [selectedStates, selectType, viewMode, getAuth]);

  useEffect(() => {
    if (selectType !== "area" || selectedDistricts.length === 0) {
      setAreasList([]); setSelectedAreas([]);
      return;
    }
    api.get(`/api/masters/areas?districtIds=${selectedDistricts.join(",")}`, getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setAreasList(Array.isArray(d) ? d.map(x => ({
          id: String(x.id ?? x.areaId),
          label: x.area_name || x.areaName || x.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("areas", e));
    setSelectedAreas([]);
  }, [selectedDistricts, selectType, getAuth]);

  useEffect(() => {
    if (viewMode !== "hierarchical" || selectedDesignations.length === 0) {
      setEmployeesList([]); setSelectedEmployees([]);
      return;
    }
    api.get(`/api/masters/employees?designationIds=${selectedDesignations.join(",")}`, getAuth())
      .then(res => {
        const d = res.data?.data || res.data || [];
        setEmployeesList(Array.isArray(d) ? d.map(e => ({
          id: String(e.id ?? e.employeeId),
          label: e.employee_name || e.employeeName || e.name || "Unknown",
        })) : []);
      })
      .catch(e => console.error("employees", e));
    setSelectedEmployees([]);
  }, [selectedDesignations, viewMode, getAuth]);

  const switchMode = (mode) => {
    setViewMode(mode);
    setSelectType("");
    setSelectedStates([]); setSelectedDistricts([]); setSelectedAreas([]);
    setSelectedDesignations([]); setSelectedEmployees([]);
    setSelectedCategories([]);
    setSelectedStatus(["active"]);
    setFromDate(""); setToDate("");
    setShowTable(false); setTableData([]); setTableError("");
    setDrillEmployee(null); setDrillData([]);
    setValidationErr(""); setSearch("");
    setPage(1); setDrillPage(1);
  };

  const handleTypeChange = (v) => {
    setSelectType(v);
    setSelectedStates([]); setSelectedDistricts([]); setSelectedAreas([]);
    setShowTable(false); setValidationErr("");
  };

  const STATUS_OPTIONS = [
    { id: "active",   label: "Active"   },
    { id: "inactive", label: "InActive" },
  ];

  const CATEGORY_OPTIONS = [
    { id: "A",    label: "A"    },
    { id: "A+",   label: "A+"   },
    { id: "B",    label: "B"    },
    { id: "B+",   label: "B+"   },
    { id: "C",    label: "C"    },
    { id: "Core", label: "Core" },
    { id: "D",    label: "D"    },
  ];

  const validate = () => {
    if (!selectType) return "Type is required!!!";
    if (viewMode === "geographical") {
      if (selectedStates.length === 0) return "State is required!!!";
      if (selectType === "headquarter" && selectedDistricts.length === 0) return "Headquarter is required!!!";
      if (selectType === "area" && selectedAreas.length === 0) return "Area is required!!!";
    }
    if (viewMode === "hierarchical") {
      if (selectedDesignations.length === 0) return "Designation is required!!!";
      if (selectedEmployees.length === 0)    return "Employee is required!!!";
    }
    if (selectedStatus.length === 0) return "Status is required!!!";
    if (!fromDate) return "From Date is required!!!";
    if (!toDate)   return "To Date is required!!!";
    if (fromDate > toDate) return "From Date cannot be after To Date.";
    return "";
  };

  const buildParams = () => {
    const p = new URLSearchParams();
    p.append("mode",         viewMode);
    p.append("type",         selectType);
    p.append("providerType", providerRadio);
    p.append("fromDate",     fromDate);
    p.append("toDate",       toDate);
    p.append("status",       selectedStatus.join(","));
    if (selectedCategories.length) p.append("categories", selectedCategories.join(","));
    if (viewMode === "geographical") {
      if (selectedStates.length)    p.append("stateIds",    selectedStates.join(","));
      if (selectedDistricts.length) p.append("districtIds", selectedDistricts.join(","));
      if (selectedAreas.length)     p.append("areaIds",     selectedAreas.join(","));
    }
    if (viewMode === "hierarchical") {
      p.append("designationIds", selectedDesignations.join(","));
      p.append("employeeIds",    selectedEmployees.join(","));
    }
    return p.toString();
  };

  const handleViewReport = async () => {
    const err = validate();
    if (err) { setValidationErr(err); return; }
    setValidationErr("");
    setTableLoading(true);
    setShowTable(true);
    setTableData([]); setTableError("");
    setDrillEmployee(null); setDrillData([]);
    setPage(1); setSearch("");
    try {
      const res = await api.get(`/api/reports/missed-provider?${buildParams()}`, getAuth());
      const data = res.data?.data || res.data || [];
      setTableData(Array.isArray(data) ? data : []);
    } catch (e) {
      setTableError(e.response?.data?.message || "Failed to load report. Please try again.");
    } finally {
      setTableLoading(false);
    }
  };

  const handleEmployeeClick = async (row) => {
    setDrillEmployee(row);
    setDrillLoading(true);
    setDrillData([]);
    setDrillPage(1); setSearch("");
    try {
      const p = new URLSearchParams({
        employeeId:   row.employeeId ?? row.employeeCode ?? "",
        providerType: providerRadio,
        fromDate, toDate,
        status:       selectedStatus.join(","),
        ...(selectedCategories.length ? { categories: selectedCategories.join(",") } : {}),
      });
      const res = await api.get(`/api/reports/missed-provider/employee-detail?${p}`, getAuth());
      const data = res.data?.data || res.data || [];
      setDrillData(Array.isArray(data) ? data : []);
    } catch {
      setDrillData([]);
    } finally {
      setDrillLoading(false);
    }
  };

  const activeData    = drillEmployee ? drillData    : tableData;
  const activePage    = drillEmployee ? drillPage    : page;
  const setActivePage = drillEmployee ? setDrillPage : setPage;

  const filtered   = activeData.filter(r =>
    !search || Object.values(r).some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const DOCTOR_COLS = [
    { key: "sNo",               label: "S. No.",          center: true },
    { key: "state",             label: "State"                         },
    { key: "headquarter",       label: "Headquarter"                   },
    { key: "area",              label: "Area"                          },
    { key: "areaCurrentStatus", label: "Area Status",     center: true },
    { key: "designation",       label: "Designation",     center: true },
    { key: "employeeName",      label: "Employee Name",   clickable: true },
    { key: "employeeCode",      label: "Emp. Code",       center: true },
    { key: "doctorName",        label: "Doctor Name"                   },
    { key: "doctorCode",        label: "Doctor Code",     center: true },
    { key: "address",           label: "Address"                       },
    { key: "category",          label: "Category",        center: true },
    { key: "specialization",    label: "Specialization"                },
    { key: "degree",            label: "Degree",          center: true },
    { key: "mobileNumber",      label: "Mobile No.",      center: true },
    { key: "doctorCurrentStatus", label: "Doctor Status", center: true },
  ];

  const CHEMIST_COLS = [
    { key: "sNo",               label: "S. No.",            center: true },
    { key: "state",             label: "State"                           },
    { key: "headquarter",       label: "Headquarter"                     },
    { key: "area",              label: "Area"                            },
    { key: "areaCurrentStatus", label: "Area Status",       center: true },
    { key: "designation",       label: "Designation",       center: true },
    { key: "employeeName",      label: "Employee Name",     clickable: true },
    { key: "employeeCode",      label: "Emp. Code",         center: true },
    { key: "providerName",      label: "Provider Name"                   },
    { key: "providerCode",      label: "Provider Code",     center: true },
    { key: "providerType",      label: "Provider Type",     center: true },
    { key: "address",           label: "Address"                         },
    { key: "mobileNumber",      label: "Mobile No.",        center: true },
    { key: "providerCurrentStatus", label: "Provider Status", center: true },
  ];

  const TABLE_COLS = providerRadio === "doctor" ? DOCTOR_COLS : CHEMIST_COLS;

  const showStateFilter    = viewMode === "geographical" && Boolean(selectType);
  const showDistrictFilter = viewMode === "geographical" && (selectType === "headquarter" || selectType === "area");
  const showAreaFilter     = viewMode === "geographical" && selectType === "area";

  return (
    <div className="space-y-5 animate-in fade-in duration-400 pb-12 font-sans">

      {/* ══ FILTER CARD ════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        {/* Title row */}
        <div className="px-6 sm:px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
              <ClipboardX size={16} className="text-blue-600" />
            </div>
            <div>
  <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>
    Missed Provider Report
  </h2>
  <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>
    Track missed doctors, chemists &amp; stockists by geography or hierarchy
  </p>
</div>
          </div>

          {/* Filter toggle */}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Filter</span>
            <button
              onClick={() => setFilterOpen(p => !p)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${filterOpen ? "bg-blue-600" : "bg-slate-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${filterOpen ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="p-6 sm:p-8 space-y-6">

            {/* Radio buttons */}
            <div className="flex items-center gap-8">
              {["geographical", "hierarchical"].map(mode => (
                <label
                  key={mode}
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => switchMode(mode)}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${viewMode === mode ? "border-blue-600" : "border-slate-300 group-hover:border-blue-300"}`}>
                    {viewMode === mode && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, textTransform: "capitalize", color: viewMode === mode ? "#111827" : "#4b5563" }}>
                    {mode}
                  </span>
                </label>
              ))}
            </div>

            {/* ── Geographical Filters ─────────────────────────────────────── */}
            {viewMode === "geographical" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-6 items-start">
                  
                  <div className="space-y-1">
                    <SingleDropdown
                      label="SELECT TYPE *"
                      value={selectType}
                      onSelect={handleTypeChange}
                      options={[
                        { value: "state",       label: "State"       },
                        { value: "headquarter", label: "Headquarter" },
                        { value: "area",        label: "Area"        },
                      ]}
                    />
                    {validationErr && !selectType && (
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", paddingTop: 2 }}>{validationErr}</p>
                    )}
                  </div>

                  {showStateFilter && (
                    <div className="space-y-1">
                      <MultiDropdown
                        label="SELECT STATE *"
                        options={statesList}
                        selectedIds={selectedStates}
                        onChange={v => { setSelectedStates(v); setValidationErr(""); }}
                      />
                      {validationErr && selectType && selectedStates.length === 0 && (
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", paddingTop: 2 }}>State is required!!!</p>
                      )}
                    </div>
                  )}

                  {showDistrictFilter && (
                    <MultiDropdown
                      label={selectType === "area" ? "SELECT DISTRICT *" : "SELECT HEADQUARTER *"}
                      options={districtsList}
                      selectedIds={selectedDistricts}
                      onChange={v => { setSelectedDistricts(v); setValidationErr(""); }}
                      disabled={selectedStates.length === 0}
                    />
                  )}

                  {showAreaFilter && (
                    <MultiDropdown
                      label="SELECT AREA *"
                      options={areasList}
                      selectedIds={selectedAreas}
                      onChange={v => { setSelectedAreas(v); setValidationErr(""); }}
                      disabled={selectedDistricts.length === 0}
                    />
                  )}

                  {selectType && (
                    <MultiDropdown
                      label="SELECT STATUS *"
                      options={STATUS_OPTIONS}
                      selectedIds={selectedStatus}
                      onChange={v => { setSelectedStatus(v); setValidationErr(""); }}
                    />
                  )}

                  {selectType && <FDatePicker label="FROM DATE" value={fromDate} onChange={setFromDate} />}
                  {selectType && <FDatePicker label="TO DATE"   value={toDate}   onChange={setToDate}   />}

                  {selectType && providerRadio === "doctor" && (
                    <MultiDropdown
                      label="SELECT CATEGORY *"
                      options={CATEGORY_OPTIONS}
                      selectedIds={selectedCategories}
                      onChange={setSelectedCategories}
                    />
                  )}
                </div>

                {selectType && (
                  <ProviderRadio value={providerRadio} onChange={v => { setProviderRadio(v); setSelectedCategories([]); }} />
                )}
              </div>
            )}

            {/* ── Hierarchical Filters ─────────────────────────────────────── */}
            {viewMode === "hierarchical" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-6 items-start">
                  <SingleDropdown
                    label="SELECT TYPE *"
                    value={selectType || "employeeWise"}
                    onSelect={v => setSelectType(v)}
                    options={[{ value: "employeeWise", label: "Employee Wise" }]}
                  />
                  <MultiDropdown
                    label="SELECT DESIGNATION"
                    options={designationsList.length ? designationsList : [
                      { id: "ASM", label: "ASM" }, { id: "MR", label: "MR" },
                      { id: "NSM", label: "NSM" }, { id: "RSM", label: "RSM" },
                      { id: "ZSM", label: "ZSM" },
                    ]}
                    selectedIds={selectedDesignations}
                    onChange={v => { setSelectedDesignations(v); setValidationErr(""); }}
                  />
                  <MultiDropdown
                    label="SELECT EMPLOYEE *"
                    options={employeesList}
                    selectedIds={selectedEmployees}
                    onChange={v => { setSelectedEmployees(v); setValidationErr(""); }}
                    disabled={selectedDesignations.length === 0}
                  />
                  <MultiDropdown
                    label="SELECT STATUS *"
                    options={STATUS_OPTIONS}
                    selectedIds={selectedStatus}
                    onChange={v => { setSelectedStatus(v); setValidationErr(""); }}
                  />
                  {providerRadio === "doctor" && (
                    <MultiDropdown
                      label="SELECT CATEGORY *"
                      options={CATEGORY_OPTIONS}
                      selectedIds={selectedCategories}
                      onChange={setSelectedCategories}
                    />
                  )}
                  <FDatePicker label="FROM DATE" value={fromDate} onChange={setFromDate} />
                  <FDatePicker label="TO DATE"   value={toDate}   onChange={setToDate}   />
                </div>
                <ProviderRadio value={providerRadio} onChange={v => { setProviderRadio(v); setSelectedCategories([]); }} />
              </div>
            )}

            {/* Global validation error */}
            {validationErr && (
              <div className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 700, color: "#ef4444" }}>
                <AlertCircle size={13} /> {validationErr}
              </div>
            )}

            {/* View Report button */}
            <div className="flex justify-start pt-2 border-t border-slate-100 mt-2">
              <button
                onClick={handleViewReport}
                disabled={tableLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-bold transition-all shadow-md shadow-blue-200 active:scale-95"
                style={{ fontSize: 13 }}
              >
                {tableLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                View Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ TABLE SECTION ══════════════════════════════════════════════════ */}
      {showTable && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Table header */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div className="flex items-center gap-2">
              {drillEmployee && (
                <button
                  onClick={() => { setDrillEmployee(null); setDrillData([]); setDrillPage(1); setSearch(""); }}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 mr-1"
                  style={{ fontSize: 12, fontWeight: 700 }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                {drillEmployee ? `Missed Providers — ${drillEmployee.employeeName}` : "Missed Provider Details"}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af" }}>
                ({filtered.length} record{filtered.length !== 1 ? "s" : ""})
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setActivePage(1); }}
                placeholder="Search..."
                className="pl-8 pr-8 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ fontSize: 12, width: 180 }}
              />
              {search && (
                <button onClick={() => { setSearch(""); setActivePage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {(tableLoading || drillLoading) && (
            <div className="flex items-center justify-center py-16 gap-2" style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>
              <Loader2 size={18} className="animate-spin text-blue-500" />
              Loading data…
            </div>
          )}

          {/* Error */}
          {!tableLoading && !drillLoading && tableError && (
            <div className="flex items-center justify-center py-10 gap-2" style={{ color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
              <AlertCircle size={14} /> {tableError}
            </div>
          )}

          {/* Empty */}
          {!tableLoading && !drillLoading && !tableError && paged.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>No records found.</span>
            </div>
          )}

          {/* Table */}
          {!tableLoading && !drillLoading && !tableError && paged.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {TABLE_COLS.map(col => (
                      <th
                        key={col.key}
                        className="px-3 py-2 border-r border-slate-100 last:border-r-0 whitespace-nowrap"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#374151",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          textAlign: col.center ? "center" : "left",
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row, ri) => (
                    <tr
                      key={ri}
                      className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors bg-white"
                    >
                      {TABLE_COLS.map(col => {
                        const isEmployeeLink = col.key === "employeeName" && viewMode === "hierarchical" && !drillEmployee;
                        return (
                          <td
                            key={col.key}
                            className="px-3 py-2 border-r border-slate-100 last:border-r-0 whitespace-nowrap"
                            style={{
                              fontSize: 12,
                              fontWeight: isEmployeeLink ? 700 : 500,
                              color: isEmployeeLink ? "#2563eb" : "#374151",
                              textAlign: col.center ? "center" : "left",
                              cursor: isEmployeeLink ? "pointer" : "default",
                              textDecoration: isEmployeeLink ? "underline" : "none",
                            }}
                            onClick={isEmployeeLink ? () => handleEmployeeClick(row) : undefined}
                          >
                            {col.key === "sNo" ? (
                              (activePage - 1) * PAGE_SIZE + ri + 1
                            ) : col.key === "category" ? (
                              <CategoryBadge value={row[col.key]} />
                            ) : (col.key === "doctorCurrentStatus" || col.key === "providerCurrentStatus" || col.key === "areaCurrentStatus") ? (
                              <StatusBadge value={row[col.key]} />
                            ) : col.key === "providerType" ? (
                              <ProviderTypeBadge value={row[col.key]} />
                            ) : (
                              row[col.key] ?? "—"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!tableLoading && !drillLoading && !tableError && filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>
                Showing {(activePage - 1) * PAGE_SIZE + 1}–{Math.min(activePage * PAGE_SIZE, filtered.length)} of {filtered.length} records
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActivePage(1)}
                  disabled={activePage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ color: "#374151" }}
                >
                  <ChevronsLeft size={13} />
                </button>
                <button
                  onClick={() => setActivePage(p => p - 1)}
                  disabled={activePage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ color: "#374151" }}
                >
                  <ChevronLeft size={13} />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(activePage - 2, totalPages - 4)) + i;
                  return pg <= totalPages ? (
                    <button
                      key={pg}
                      onClick={() => setActivePage(pg)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 transition-colors hover:bg-blue-50"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: pg === activePage ? "#fff" : "#374151",
                        background: pg === activePage ? "#2563eb" : "#fff",
                        borderColor: pg === activePage ? "#2563eb" : "#e5e7eb"
                      }}
                    >
                      {pg}
                    </button>
                  ) : null;
                })}

                <button
                  onClick={() => setActivePage(p => p + 1)}
                  disabled={activePage === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ color: "#374151" }}
                >
                  <ChevronRight size={13} />
                </button>
                <button
                  onClick={() => setActivePage(totalPages)}
                  disabled={activePage === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ color: "#374151" }}
                >
                  <ChevronsRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROVIDER RADIO
// ═══════════════════════════════════════════════════════════════
function ProviderRadio({ value, onChange }) {
  return (
    <div className="flex items-center gap-8">
      {[{ val: "doctor", label: "Doctor" }, { val: "chemist", label: "Chemist / Stockist" }].map(opt => (
        <label key={opt.val} className="flex items-center gap-2 cursor-pointer group" onClick={() => onChange(opt.val)}>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${value === opt.val ? "border-blue-600" : "border-slate-300 group-hover:border-blue-300"}`}>
            {value === opt.val && <div className="w-2 h-2 rounded-full bg-blue-600" />}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: value === opt.val ? "#111827" : "#4b5563" }}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════════════════════════
function CategoryBadge({ value }) {
  const map = {
    "A+": "bg-purple-100 text-purple-700", "A": "bg-blue-100 text-blue-700",
    "B+": "bg-sky-100 text-sky-700",       "B": "bg-teal-100 text-teal-700",
    "C":  "bg-amber-100 text-amber-700",   "D": "bg-slate-100 text-slate-600",
    "Core": "bg-rose-100 text-rose-700",
  };
  return <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${map[String(value)] || "bg-slate-100 text-slate-500"}`}>{value ?? "—"}</span>;
}

function StatusBadge({ value }) {
  const v = String(value ?? "").toLowerCase();
  const isActive = v === "true" || v === "active" || v === "1";
  return isActive
    ? <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-green-100 text-green-700">Active</span>
    : <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-100 text-red-600">Inactive</span>;
}

function ProviderTypeBadge({ value }) {
  const v = String(value ?? "").toLowerCase();
  const cls = v === "chemist" ? "bg-emerald-100 text-emerald-700" : v === "stockist" ? "bg-amber-100 text-amber-700" : v === "drug" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600";
  return <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${cls}`}>{value ?? "—"}</span>;
}

/* ══════════════════════════════════════════════════════════════════════════════
   FLOATING LABEL COMPONENTS — perfectly matches reference image
   ══════════════════════════════════════════════════════════════════════════ */

/* ── SingleDropdown ────────────────────────────────────────────────────── */
function SingleDropdown({ label, value, onSelect, options = [], disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => String(o.value ?? o.id) === String(value));
  const hasVal = Boolean(value);
  const active = open || hasVal;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", marginTop: 8 }}>
      <div
        onClick={() => !disabled && setOpen(p => !p)}
        style={{
          width: "100%", height: 38, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px", border: open ? "1.5px solid #2563eb" : "1.5px solid #d1d5db", borderRadius: 8,
          background: disabled ? "#f9fafb" : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.2s"
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: hasVal ? "#111827" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {selected ? selected.label : " "}
        </span>
        <ChevronDown size={15} style={{ color: open ? "#2563eb" : "#9ca3af", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }} />
      </div>

      <label style={{
        position: "absolute", left: 10, pointerEvents: "none", zIndex: 11,
        top: active ? -8 : 10, fontSize: active ? 10 : 13,
        fontWeight: active ? 700 : 500, color: open ? "#2563eb" : active ? "#6b7280" : "#9ca3af",
        background: active ? "#fff" : "transparent", padding: active ? "0 4px" : "0",
        transition: "all 0.2s", textTransform: active ? "uppercase" : "none", letterSpacing: active ? "0.05em" : "normal"
      }}>
        {label}
      </label>

      {open && !disabled && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: 4, maxHeight: 200, overflowY: "auto",
        }}>
          {options.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 12, color: "#9ca3af", fontStyle: "italic", textAlign: "center" }}>No options</div>
          ) : (
            options.map(o => {
              const val = String(o.value ?? o.id);
              const isSelected = val === String(value);
              return (
                <div
                  key={val}
                  onClick={() => { onSelect(val); setOpen(false); }}
                  style={{
                    padding: "9px 12px", cursor: "pointer",
                    fontSize: 13, fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? "#2563eb" : "#374151",
                    background: isSelected ? "#eff6ff" : "transparent",
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "background 0.1s"
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  {isSelected && <Check size={13} style={{ color: "#2563eb", flexShrink: 0 }} />}
                  {o.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ── MultiDropdown ─────────────────────────────────────────────────────── */
function MultiDropdown({ label, options = [], selectedIds = [], onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id) => {
    const strId = String(id);
    onChange(selectedIds.includes(strId) ? selectedIds.filter(x => String(x) !== strId) : [...selectedIds, strId]);
  };
  const selectAll = () => onChange(options.map(o => String(o.value ?? o.id)));
  const clearAll  = () => onChange([]);

  const hasVal = selectedIds.length > 0;
  const active = open || hasVal;
  const displayLabel = hasVal
    ? options.filter(o => selectedIds.includes(String(o.value ?? o.id))).map(o => o.label).join(", ")
    : "";

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", marginTop: 8 }}>
      <div
        onClick={() => !disabled && setOpen(p => !p)}
        style={{
          width: "100%", height: 38, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px", border: open ? "1.5px solid #2563eb" : "1.5px solid #d1d5db", borderRadius: 8,
          background: disabled ? "#f9fafb" : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.2s"
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: hasVal ? "#111827" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {displayLabel || " "}
        </span>
        <ChevronDown size={15} style={{ color: open ? "#2563eb" : "#9ca3af", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }} />
      </div>

      <label style={{
        position: "absolute", left: 10, pointerEvents: "none", zIndex: 11,
        top: active ? -8 : 10, fontSize: active ? 10 : 13,
        fontWeight: active ? 700 : 500, color: open ? "#2563eb" : active ? "#6b7280" : "#9ca3af",
        background: active ? "#fff" : "transparent", padding: active ? "0 4px" : "0",
        transition: "all 0.2s", textTransform: active ? "uppercase" : "none", letterSpacing: active ? "0.05em" : "normal"
      }}>
        {label}
      </label>

      {open && !disabled && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: 4, overflow: "hidden", minWidth: 200
        }}>
          <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
            <button onClick={(e) => { e.preventDefault(); selectAll(); }} style={{ flex: 1, padding: "8px", fontSize: 11, fontWeight: 700, color: "#fff", background: "#2563eb", border: "none", cursor: "pointer", transition: "opacity 0.2s" }} onMouseOver={e=>e.currentTarget.style.opacity=0.9} onMouseOut={e=>e.currentTarget.style.opacity=1}>Select All</button>
            <button onClick={(e) => { e.preventDefault(); clearAll(); }} style={{ flex: 1, padding: "8px", fontSize: 11, fontWeight: 700, color: "#fff", background: "#ef4444", border: "none", cursor: "pointer", transition: "opacity 0.2s" }} onMouseOver={e=>e.currentTarget.style.opacity=0.9} onMouseOut={e=>e.currentTarget.style.opacity=1}>Deselect All</button>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
              <div style={{ padding: "10px 12px", fontSize: 12, color: "#9ca3af", fontStyle: "italic", textAlign: "center" }}>No options</div>
            ) : (
              options.map(o => {
                const val = String(o.value ?? o.id);
                const isSelected = selectedIds.includes(val);
                return (
                  <div
                    key={val}
                    onClick={() => toggle(val)}
                    style={{
                      padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                      fontSize: 13, fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? "#2563eb" : "#374151",
                      background: isSelected ? "#eff6ff" : "transparent",
                      transition: "background 0.1s"
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f9fafb"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{
                      width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                      border: isSelected ? "none" : "1.5px solid #d1d5db",
                      background: isSelected ? "#2563eb" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isSelected && <Check size={10} style={{ color: "#fff" }} />}
                    </div>
                    {o.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Custom FDatePicker ────────────────────────────────────────────────── */
function FDatePicker({ label, value, onChange, disabled }) {
  const [open,  setOpen]  = useState(false);
  const today  = new Date();
  const parsed = (value && !isNaN(Date.parse(value))) ? new Date(value + "T00:00:00") : today;
  const [view, setView]   = useState({ y: parsed.getFullYear(), m: parsed.getMonth() });
  const ref = useRef(null);

  // ✅ Close on outside click
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
  ? new Date(value + "T00:00:00").toLocaleDateString("en-GB")
  : "";

  const selStr = (d) => `${view.y}-${String(view.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  return (
    <div ref={ref} style={{ position:"relative", width:"100%", userSelect:"none", zIndex: open?100:1 }}>
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

      {/* ✅ Calendar dropdown — fixed with ChevronLeft / ChevronRight imported correctly */}
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
    onChange={(e) =>
      setView({ ...view, m: Number(e.target.value) })
    }
    style={{
      background: "rgba(255,255,255,0.15)",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      padding: "2px 6px",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      outline: "none"
    }}
  >
    {MONTHS.map((m, i) => (
      <option key={i} value={i} style={{ color: "#000" }}>
        {m}
      </option>
    ))}
  </select>

  {/* Year Dropdown */}
  <select
  value={view.y}
  onChange={(e) =>
    setView({ ...view, y: Number(e.target.value) })
  }
  style={{
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "2px 6px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    outline: "none"
  }}
>
  {Array.from({ length: 100 }, (_, i) =>
    new Date().getFullYear() - 50 + i
  ).map((y) => (
    <option key={y} value={y} style={{ color: "#000" }}>
      {y}
    </option>
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