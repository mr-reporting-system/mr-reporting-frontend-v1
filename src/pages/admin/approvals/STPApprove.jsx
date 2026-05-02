import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Check,
  Trash2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import api from "../../../services/api";

// ─── Global responsive styles ─────────────────────────────────────────────────
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
  .ucr-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 800px; }
  .ucr-table thead { background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
  .ucr-table th { padding: 12px 16px; text-align: left; font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  .ucr-table td { padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }

  .ucr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:24px; }

  @media(max-width:1024px){
    .ucr-grid  { grid-template-columns:repeat(2,1fr); gap:16px; }
  }
  @media(max-width:600px){
    .ucr-grid  { grid-template-columns:1fr; gap:12px; }
    .ucr-body  { padding:14px; }
    .ucr-header { padding: 12px 16px; }
    .ucr-footer { justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

// ─── Field height ─────────────────────────────────────────────────────────────
const FH = 40;

// ─── Page sizes ───────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 20, 50];

// ─── Request status options ───────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending By Manager" },
  { value: "APPROVED", label: "Approved By Manager" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function toCamelCaseKey(key) {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function normalizeValue(value) {
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const obj = {};
    Object.entries(value).forEach(([key, val]) => {
      obj[toCamelCaseKey(key)] = normalizeValue(val);
    });
    return obj;
  }
  return value;
}

function parseResponse(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(normalizeValue);
  if (raw.data) {
    if (Array.isArray(raw.data)) return raw.data.map(normalizeValue);
    if (Array.isArray(raw.data?.content)) return raw.data.content.map(normalizeValue);
    if (Array.isArray(raw.data?.rows)) return raw.data.rows.map(normalizeValue);
    const inner = raw.data.content || raw.data.rows || raw.data.result;
    if (Array.isArray(inner)) return inner.map(normalizeValue);
  }
  return [];
}

function getVal(row, keys, fallback = "—") {
  for (const key of keys) {
    const val = row?.[key];
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return fallback;
}

function getRecordId(row) {
  return (
    row?.stpId ??
    row?.id ??
    row?.detailId ??
    row?.routeId ??
    row?.stp_detail_id ??
    null
  );
}

function getRequestApprovedValue(row) {
  const direct = getVal(
    row,
    ["approvedByMgr", "approved_by_mgr", "approvedByManager", "approvedBy"],
    ""
  );
  if (direct === true || direct === "Yes" || direct === "YES" || direct === "APPROVED") return "Yes";
  if (direct === false || direct === "No" || direct === "NO" || direct === "PENDING") return "No";
  return getVal(row, ["requestStatus", "request_status"], "") === "APPROVED" ? "Yes" : "No";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function STPApprove() {
  const [filterOpen, setFilterOpen] = useState(true);

  // ── Level 1: Geography summary ────────────────────────────────────────────
  const [stateData, setStateData] = useState([]);
  const [stateLoading, setStateLoading] = useState(false);
  const [statePage, setStatePage] = useState(1);
  const [statePageSize, setStatePageSize] = useState(20);

  // ── Level 2: Employee summary ─────────────────────────────────────────────
  const [selectedState, setSelectedState] = useState(null);
  const [empData, setEmpData] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empPage, setEmpPage] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(20);

  // ── Level 3: STP details ──────────────────────────────────────────────────
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [requestStatus, setRequestStatus] = useState("");
  const [stpData, setStpData] = useState([]);
  const [stpLoading, setStpLoading] = useState(false);
  const [stpPage, setStpPage] = useState(1);
  const [stpPageSize, setStpPageSize] = useState(20);
  const [checkedIds, setCheckedIds] = useState([]);
  const [stpVisible, setStpVisible] = useState(false);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── On mount: load geography summary ─────────────────────────────────────
  useEffect(() => {
    fetchGeographySummary();
  }, []);

  // When employee + status both selected → auto-fetch STP details
  useEffect(() => {
    if (selectedEmp && requestStatus) {
      fetchSTPDetails(selectedEmp, requestStatus);
    } else {
      setStpData([]);
      setStpVisible(false);
      setCheckedIds([]);
    }
  }, [selectedEmp, requestStatus]);

  // ── Level 1: GET /api/approvals/stp/geography-summary ────────────────────
  const fetchGeographySummary = async () => {
    setStateLoading(true);
    setError("");
    try {
      const res = await api.get("/api/approvals/stp/geography-summary");
      setStateData(parseResponse(res.data));
    } catch (err) {
      setError("Failed to load STP summary.");
    } finally {
      setStateLoading(false);
    }
  };

  // ── Level 2: GET /api/approvals/stp/employee-summary?districtId=5 ────────
  const handleStateClick = async (row) => {
    setSelectedState(row);
    setSelectedEmp(null);
    setRequestStatus("");
    setStpData([]);
    setStpVisible(false);
    setCheckedIds([]);
    setEmpPage(1);
    setEmpLoading(true);
    setError("");

    try {
      const districtId = row.districtId ?? row.id;
      const res = await api.get(
        `/api/approvals/stp/employee-summary?districtId=${districtId}`
      );
      setEmpData(parseResponse(res.data));
    } catch (err) {
      setError("Failed to load employees.");
    } finally {
      setEmpLoading(false);
    }
  };

  // ── Level 3: Click employee → show status dropdown ────────────────────────
  const handleEmpClick = (emp) => {
    setSelectedEmp(emp);
    setRequestStatus("");
    setStpData([]);
    setStpVisible(false);
    setCheckedIds([]);
    setStpPage(1);
  };

  // ── Level 3: GET /api/approvals/stp/details?employeeId=12&requestStatus=PENDING ──
  const fetchSTPDetails = async (emp, status) => {
    setStpLoading(true);
    setCheckedIds([]);
    setStpPage(1);

    try {
      const empId = emp.employeeId ?? emp.id;
      const res = await api.get(
        `/api/approvals/stp/details?employeeId=${empId}&requestStatus=${status}`
      );
      setStpData(parseResponse(res.data));
      setStpVisible(true);
    } catch (err) {
      setError("Failed to load STP details.");
    } finally {
      setStpLoading(false);
    }
  };

  // ── Approve STP ───────────────────────────────────────────────────────────
  const handleApproveSTP = async () => {
    if (!checkedIds.length) return;
    setIsSubmitting(true);

    try {
      const res = await api.post("/api/approvals/stp/approve", checkedIds);
      if (res.status === 200) {
        setSuccessMsg(`${checkedIds.length} approved!`);
        setTimeout(() => setSuccessMsg(""), 3000);
        await fetchSTPDetails(selectedEmp, requestStatus);
      }
    } catch (err) {
      setError("Approve failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete STP ────────────────────────────────────────────────────────────
  const handleDeleteSTP = async () => {
    if (!checkedIds.length) return;
    setIsSubmitting(true);

    try {
      const res = await api.delete("/api/approvals/stp/delete", { data: checkedIds });
      if (res.status === 200) {
        setSuccessMsg(`${checkedIds.length} deleted!`);
        setTimeout(() => setSuccessMsg(""), 3000);
        await fetchSTPDetails(selectedEmp, requestStatus);
      }
    } catch (err) {
      setError("Delete failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Checkbox ──────────────────────────────────────────────────────────────
  const toggleCheck = (id) =>
    setCheckedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));

  const toggleAll = (ids) =>
    setCheckedIds((p) => (p.length === ids.length ? [] : ids));

  // ── Pagination helpers ────────────────────────────────────────────────────
  const paged = (data, page, size) => data.slice((page - 1) * size, page * size);

  const stateRows = paged(stateData, statePage, statePageSize);
  const empRows = paged(empData, empPage, empPageSize);
  const stpRows = paged(stpData, stpPage, stpPageSize);
  const allStpIds = stpRows.map(getRecordId).filter((id) => id !== null);

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

      {/* Level 1: State Summary Card */}
      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SlidersHorizontal size={17} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Employee STP Approval</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>Manage employee tour plans</p>
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>FILTER</span>
              <div
                style={{ width: 34, height: 18, borderRadius: 20, background: filterOpen ? "#2563eb" : "#d1d5db", position: "relative", cursor: "pointer", transition: "0.2s" }}
              >
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: filterOpen ? 18 : 2, transition: "0.2s" }} />
              </div>
            </div>
          </button>
        </div>

        {filterOpen && (
          <div className="ucr-body">
            <div className="ucr-table-container">
              <table className="ucr-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>State</th>
                    <th>Headquarter</th>
                    <th style={{ textAlign: "center" }}>Emp Count</th>
                  </tr>
                </thead>
                <tbody>
                  {stateLoading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: 40 }}>
                        <Loader2 style={{ animation: "ucr-spin 1s linear infinite", margin: "0 auto" }} />
                      </td>
                    </tr>
                  ) : stateRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                        No data found.
                      </td>
                    </tr>
                  ) : (
                    stateRows.map((row, i) => (
                      <tr
                        key={row.districtId ?? row.id ?? i}
                        style={{ background: (selectedState?.districtId ?? selectedState?.id) === (row.districtId ?? row.id) ? "#eff6ff" : "transparent" }}
                      >
                        <td>{(statePage - 1) * statePageSize + i + 1}</td>
                        <td>
                          <button
                            onClick={() => handleStateClick(row)}
                            style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}
                          >
                            {getVal(row, ["stateName", "state_name", "state"])}
                          </button>
                        </td>
                        <td>{getVal(row, ["headquarter", "headquarterName", "hqName", "districtName", "district_name"])}</td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>
                          {getVal(row, ["employeeCount", "employee_count", "empCount", "count", "totalPending", "total_pending"])}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <PaginationFooter
                data={stateData}
                page={statePage}
                pageSize={statePageSize}
                setPage={setStatePage}
                setPageSize={setStatePageSize}
              />
            </div>
          </div>
        )}
      </div>

      {/* Level 2: Employee List Card */}
      {selectedState && (
        <div className="ucr-card">
          <div className="ucr-header" style={{ background: "#f9fafb" }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "#4b5563" }}>
              EMPLOYEES: {getVal(selectedState, ["stateName", "state_name", "state"]).toUpperCase()}
            </h3>
          </div>
          <div className="ucr-body">
            <div className="ucr-table-container">
              <table className="ucr-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Name</th>
                    <th>Designation</th>
                    <th style={{ textAlign: "center" }}>Total Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {empLoading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: 40 }}>
                        <Loader2 style={{ animation: "ucr-spin 1s linear infinite" }} />
                      </td>
                    </tr>
                  ) : empRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                        No employees found.
                      </td>
                    </tr>
                  ) : (
                    empRows.map((row, i) => {
                      const empId = row.employeeId ?? row.id;
                      const selId = selectedEmp?.employeeId ?? selectedEmp?.id;
                      return (
                        <tr
                          key={empId ?? i}
                          style={{ background: selId === empId ? "#eff6ff" : "transparent" }}
                        >
                          <td>{(empPage - 1) * empPageSize + i + 1}</td>
                          <td>
                            <button
                              onClick={() => handleEmpClick(row)}
                              style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}
                            >
                              {getVal(row, ["employeeName", "name", "employee_name"])}
                            </button>
                          </td>
                          <td>{getVal(row, ["designationName", "designation", "designation_name"])}</td>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>
                            {getVal(row, ["pendingRouteCount", "pending_route_count", "totalSTPRequests", "totalStpRequests", "total_stp_requests"])}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <PaginationFooter
                data={empData}
                page={empPage}
                pageSize={empPageSize}
                setPage={setEmpPage}
                setPageSize={setEmpPageSize}
              />
            </div>
          </div>
        </div>
      )}

      {/* Level 3: STP Details Card */}
      {selectedEmp && (
        <div className="ucr-card">
          <div className="ucr-header">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
              STP FOR: {getVal(selectedEmp, ["employeeName", "name", "employee_name"]).toUpperCase()}
            </h3>
          </div>

          <div className="ucr-body">
            {/* Status dropdown */}
            <div style={{ maxWidth: 280, marginBottom: 20 }}>
              <FSelect
                label="SELECT STATUS *"
                value={requestStatus}
                onChange={(e) => setRequestStatus(e.target.value)}
                options={STATUS_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
              />
            </div>

            {(stpVisible || stpLoading) && (
              <div className="ucr-table-container">
                <table className="ucr-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          onChange={() => toggleAll(allStpIds)}
                          checked={allStpIds.length > 0 && allStpIds.every((id) => checkedIds.includes(id))}
                        />
                      </th>
                      <th>S.No.</th>
                      <th>From Area</th>
                      <th>To Area</th>
                      <th>Activity</th>
                      <th>Type</th>
                      <th>Dist.</th>
                      <th>Freq.</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stpLoading ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", padding: 40 }}>
                          <Loader2 style={{ animation: "ucr-spin 1s linear infinite" }} />
                        </td>
                      </tr>
                    ) : stpRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                          No STP records found.
                        </td>
                      </tr>
                    ) : (
                      stpRows.map((row, i) => {
                        const rowId = getRecordId(row);
                        const isChecked = rowId !== null && checkedIds.includes(rowId);
                        const approvedByMgr = getRequestApprovedValue(row);

                        return (
                          <tr
                            key={rowId ?? i}
                            onClick={() => rowId !== null && toggleCheck(rowId)}
                            style={{ cursor: "pointer", background: isChecked ? "#eff6ff" : "transparent" }}
                          >
                            <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => rowId !== null && toggleCheck(rowId)}
                              />
                            </td>
                            <td>{(stpPage - 1) * stpPageSize + i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{getVal(row, ["fromArea", "from_area", "fromAreaName", "from_area_name"])}</td>
                            <td style={{ fontWeight: 600 }}>{getVal(row, ["toArea", "to_area", "toAreaName", "to_area_name"])}</td>
                            <td>{getVal(row, ["frc", "activity", "activityName", "activity_type"])}</td>
                            <td>{getVal(row, ["areaType", "area_type", "type"])}</td>
                            <td>{getVal(row, ["distance", "distanceKm", "distance_km"])} km</td>
                            <td>{getVal(row, ["frequencyVisit", "frequency_visit", "freqVisit", "freq_visit"])}</td>
                            <td>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 10,
                                  background: approvedByMgr === "Yes" ? "#dcfce7" : "#f3f4f6",
                                  color: approvedByMgr === "Yes" ? "#16a34a" : "#6b7280",
                                }}
                              >
                                {approvedByMgr}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <PaginationFooter
                  data={stpData}
                  page={stpPage}
                  pageSize={stpPageSize}
                  setPage={setStpPage}
                  setPageSize={setStpPageSize}
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          {stpVisible && (
            <div className="ucr-footer">
              <button
  onClick={handleDeleteSTP}
  disabled={!checkedIds.length || isSubmitting}
  style={{
    padding: "8px 20px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    border: "1px solid #fecaca",
    background: "#fff",
    color: "#dc2626",
    cursor: "pointer",
    opacity: !checkedIds.length || isSubmitting ? 0.6 : 1,
    display: "flex",        // ← add this
    alignItems: "center",   // ← add this
    gap: 6,                 // ← add this
    minWidth: 90,           // ← add this
  }}
>
  <Trash2 size={14} />
  Delete
</button>
              <button
                onClick={handleApproveSTP}
                disabled={!checkedIds.length || isSubmitting}
                style={{ padding: "8px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", opacity: !checkedIds.length || isSubmitting ? 0.6 : 1 }}
              >
                {isSubmitting ? "Processing..." : "Approve STP"}
              </button>
              {checkedIds.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: 20, border: "1px solid #dbeafe" }}>
                  {checkedIds.length} selected
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FSelect — floating label dropdown
// ═══════════════════════════════════════════════════════════════════
function FSelect({ label, value, onChange, disabled, options = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = options.find((o) => String(o.id) === String(value));
  const active = open || Boolean(value);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => !disabled && setOpen(!open)}
        style={{ width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex", alignItems: "center", border: `1.5px solid ${active ? "#2563eb" : "#d1d5db"}`, cursor: "pointer", background: "#fff" }}
      >
        <span style={{ flex: 1, fontWeight: 600, color: value ? "#111827" : "transparent" }}>
          {selected?.label || " "}
        </span>
        <ChevronDown size={14} style={{ color: "#9ca3af" }} />
      </div>
      <label
        style={{ position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12, fontWeight: 600, color: active ? "#2563eb" : "#9ca3af", background: "#fff", padding: "0 4px", transition: "0.2s" }}
      >
        {label}
      </label>
      {open && (
        <div
          style={{ position: "absolute", top: "110%", left: 0, width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100 }}
        >
          {options.map((opt) => (
            <div
              key={opt.id}
              onClick={() => { onChange({ target: { value: opt.id } }); setOpen(false); }}
              style={{ padding: "10px 12px", fontSize: 13, cursor: "pointer", background: value === opt.id ? "#eff6ff" : "transparent", color: value === opt.id ? "#2563eb" : "#374151" }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PaginationFooter ─────────────────────────────────────────────────────────
function PaginationFooter({ data, page, pageSize, setPage, setPageSize }) {
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const from = data.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, data.length);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "12px 16px", borderTop: "1px solid #f3f4f6", background: "#f9fafb", fontSize: 11, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#6b7280" }}>Items per page:</span>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          style={{ border: "1px solid #d1d5db", borderRadius: 4 }}
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <span style={{ color: "#6b7280" }}>
        {from} – {to} of {data.length}
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        <NavBtn icon={<ChevronsLeft size={13} />} onClick={() => setPage(1)} disabled={page === 1} />
        <NavBtn icon={<ChevronLeft size={13} />} onClick={() => setPage(page - 1)} disabled={page === 1} />
        <NavBtn icon={<ChevronRight size={13} />} onClick={() => setPage(page + 1)} disabled={page === totalPages} />
        <NavBtn icon={<ChevronsRight size={13} />} onClick={() => setPage(totalPages)} disabled={page === totalPages} />
      </div>
    </div>
  );
}

// ─── NavBtn ───────────────────────────────────────────────────────────────────
function NavBtn({ icon, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1 }}
    >
      {icon}
    </button>
  );
}