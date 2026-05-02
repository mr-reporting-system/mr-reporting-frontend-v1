import React, { useState, useEffect } from "react";
import {
  Loader2, CheckCircle2, Trash2, ChevronRight,
  ArrowLeft, AlertCircle, Check, X, ClipboardList,
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

  /* Summary inner grid (inside one card) */
  .ucr-summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; }
  .ucr-summary-col  { padding: 0; }
  .ucr-summary-divider { border-left: 1px solid #f3f4f6; }

  @media(max-width:900px){
    .ucr-summary-grid { grid-template-columns: 1fr; }
    .ucr-summary-divider { border-left: none; border-top: 1px solid #f3f4f6; }
  }
  @media(max-width:600px){
    .ucr-body  { padding:14px; }
    .ucr-header { padding: 12px 16px; }
    .ucr-footer { justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

// ─── Navigation levels ────────────────────────────────────────────────────────
const LEVEL = { MAIN: "main", USER_LIST: "userList", FINAL_LIST: "finalList" };

// ─── Entity config ────────────────────────────────────────────────────────────
const ENTITIES = [
  { category: "area",     label: "Area" },
  { category: "doctor",   label: "Doctor" },
  { category: "provider", label: "Chemist / Stockist" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function MasterData() {
  // ── Navigation ────────────────────────────────────────────────────────────
  const [level,        setLevel]        = useState(LEVEL.MAIN);
  const [reqType,      setReqType]      = useState(null);
  const [category,     setCategory]     = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [counts,    setCounts]    = useState({ additions: {}, deletions: {} });
  const [userList,  setUserList]  = useState([]);
  const [finalList, setFinalList] = useState([]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");
  const [checkedIds,   setCheckedIds]   = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Reject popup ──────────────────────────────────────────────────────────
  const [rejectPopup,  setRejectPopup]  = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => { fetchCounts(); }, []);

  const fetchCounts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/approvals/counts");
      if (res.data?.success) setCounts(res.data.data);
      else if (res.data?.additions) setCounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Level 1 → 2 ───────────────────────────────────────────────────────────
  const handleCountClick = async (type, cat) => {
    setReqType(type);
    setCategory(cat);
    setCheckedIds([]);
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await api.get(`/api/approvals/summary/${cat}/${type}`);
      const data = res.data?.data || res.data || [];
      setUserList(Array.isArray(data) ? data : []);
      setLevel(LEVEL.USER_LIST);
    } catch {
      setError("Failed to load user requests.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Level 2 → 3 ───────────────────────────────────────────────────────────
  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setCheckedIds([]);
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const employeeId = user.employeeId || user.id || user.employee_id;
      const res = await api.get(
        `/api/approvals/details/${category}/${reqType}/${employeeId}`
      );
      const data = res.data?.data || res.data || [];
      console.log("DEBUG THIRD TABLE DATA:", data[0]);
      setFinalList(Array.isArray(data) ? data : []);
      setLevel(LEVEL.FINAL_LIST);
    } catch {
      setError("Failed to load final list.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Back ──────────────────────────────────────────────────────────────────
  const goBack = () => {
    setError("");
    setSuccessMsg("");
    setCheckedIds([]);
    if (level === LEVEL.FINAL_LIST) {
      setLevel(LEVEL.USER_LIST);
      setSelectedUser(null);
    } else {
      setLevel(LEVEL.MAIN);
      setReqType(null);
      setCategory(null);
      fetchCounts();
    }
  };

  // ── Checkbox ──────────────────────────────────────────────────────────────
  const toggleCheck = (id)  => setCheckedIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);
  const toggleAll   = (ids) => setCheckedIds((p) => p.length === ids.length ? [] : ids);

  // ── Refresh final list ────────────────────────────────────────────────────
  const refreshFinal = async () => {
    const employeeId = selectedUser?.employeeId || selectedUser?.id || selectedUser?.employee_id;
    const res = await api.get(`/api/approvals/details/${category}/${reqType}/${employeeId}`);
    const data = res.data?.data || res.data || [];
    setFinalList(Array.isArray(data) ? data : []);
  };

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!checkedIds.length) return setError("Please select at least one record.");
    setIsSubmitting(true);
    setError("");

    try {
      const res = await api.post(
        `/api/approvals/approve/${category}/${reqType}`,
        checkedIds
      );
      if (res.data?.success || res.status === 200 || res.status === 201) {
        setSuccessMsg(`${checkedIds.length} record(s) approved successfully!`);
        setCheckedIds([]);
        await refreshFinal();
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Approve failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reject submit ─────────────────────────────────────────────────────────
  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await api.post(
        `/api/approvals/reject/${category}/${reqType}`,
        checkedIds
      );
      if (res.data?.success || res.status === 200 || res.status === 201) {
        setRejectPopup(false);
        setRejectReason("");
        setSuccessMsg(`${checkedIds.length} record(s) rejected.`);
        setCheckedIds([]);
        await refreshFinal();
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Reject failed.");
      setRejectPopup(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete (deletion flow) ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!checkedIds.length) return setError("Please select at least one record.");
    setIsSubmitting(true);
    setError("");

    try {
      const res = await api.post(
        `/api/approvals/approve/${category}/${reqType}`,
        checkedIds
      );
      if (res.data?.success || res.status === 200 || res.status === 201) {
        setSuccessMsg(`${checkedIds.length} record(s) deleted successfully!`);
        setCheckedIds([]);
        await refreshFinal();
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  const entityLabel = ENTITIES.find((e) => e.category === category)?.label || category;

  const crumbs = () => {
    const parts = ["Approval Master"];
    if (level !== LEVEL.MAIN) {
      parts.push(reqType === "addition" ? "Addition" : "Deletion");
      parts.push(`${entityLabel} Requests`);
    }
    if (level === LEVEL.FINAL_LIST) {
      parts.push(selectedUser?.employeeName || selectedUser?.userName || "");
    }
    return parts;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>

      {/* ── Page Card Header ──────────────────────────────────────────────── */}
      <div className="ucr-card">
        <div className="ucr-header">
          {level !== LEVEL.MAIN && (
            <button
              onClick={goBack}
              style={{
                width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb",
                background: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", flexShrink: 0, color: "#6b7280",
              }}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div
            style={{
              width: 36, height: 36, borderRadius: 10, background: "#eff6ff",
              border: "1px solid #dbeafe", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}
          >
            <ClipboardList size={18} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
              Approval Master
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
              {crumbs().map((c, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight size={12} style={{ color: "#d1d5db" }} />}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: i === crumbs().length - 1 ? 700 : 400,
                      color: i === crumbs().length - 1 ? "#2563eb" : "#9ca3af",
                    }}
                  >
                    {c}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12,
            padding: "10px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600,
            marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {successMsg && (
        <div
          style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12,
            padding: "10px 16px", color: "#16a34a", fontSize: 13, fontWeight: 600,
            marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Loader */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Loader2
              style={{ animation: "ucr-spin 1s linear infinite", color: "#2563eb" }}
              size={32}
            />
            <p style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500, margin: 0 }}>Loading…</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          LEVEL 1 — Both summary panels inside ONE card
      ══════════════════════════════════════════════════════════════ */}
      {!isLoading && level === LEVEL.MAIN && (
        <div className="ucr-card">
          <div className="ucr-summary-grid">
            {/* Addition Requests */}
            <div className="ucr-summary-col">
              <SummaryPanel
                title="Addition Requests"
                accentColor="blue"
                counts={counts.additions || {}}
                reqType="addition"
                entities={ENTITIES}
                onCountClick={handleCountClick}
              />
            </div>
            {/* Deletion Requests */}
            <div className="ucr-summary-col ucr-summary-divider">
              <SummaryPanel
                title="Deletion Requests"
                accentColor="red"
                counts={counts.deletions || {}}
                reqType="deletion"
                entities={ENTITIES}
                onCountClick={handleCountClick}
              />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          LEVEL 2 — User summary table
      ══════════════════════════════════════════════════════════════ */}
      {!isLoading && level === LEVEL.USER_LIST && (
        <div className="ucr-card">
          <div className="ucr-header" style={{ background: "#f9fafb" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: "#4b5563", margin: 0 }}>
                USER'S {entityLabel.toUpperCase()}{" "}
                <span style={{ color: reqType === "addition" ? "#2563eb" : "#dc2626" }}>
                  {reqType === "addition" ? "ADDITION" : "DELETION"}
                </span>{" "}
                REQUESTS
              </h3>
            </div>
            {userList.length > 0 && (
              <span
                style={{
                  fontSize: 11, fontWeight: 700, background: "#f3f4f6",
                  color: "#6b7280", padding: "3px 10px", borderRadius: 20,
                }}
              >
                {userList.length} user{userList.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="ucr-body">
            <div className="ucr-table-container">
              <table className="ucr-table">
                <thead>
                  <tr>
                    <th>SN.</th>
                    <th>State Name</th>
                    <th>Headquarter Name</th>
                    <th>User Name</th>
                    <th style={{ textAlign: "center" }}>Total Request</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.length === 0 ? (
                    <EmptyRow cols={5} />
                  ) : (
                    userList.map((row, i) => (
                      <tr key={row.employeeId || i}>
                        <td>{i + 1}</td>
                        <td>{row.stateName || "—"}</td>
                        <td>{row.districtName || "—"}</td>
                        <td>{row.employeeName || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => handleUserClick(row)}
                            style={{
                              background: "none", border: "none", color: "#2563eb",
                              fontWeight: 700, cursor: "pointer", display: "inline-flex",
                              alignItems: "center", gap: 4, fontSize: 13,
                            }}
                          >
                            {row.totalRequests || 0}
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          LEVEL 3 — Final details table + actions
      ══════════════════════════════════════════════════════════════ */}
      {!isLoading && level === LEVEL.FINAL_LIST && (
        <div className="ucr-card">
          <div className="ucr-header">
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: 0 }}>
                {entityLabel.toUpperCase()} REQUESTS
                <span style={{ marginLeft: 8, color: "#9ca3af", fontWeight: 400, fontSize: 12 }}>
                  — {selectedUser?.employeeName}
                </span>
              </h3>
            </div>
            {checkedIds.length > 0 && (
              <span
                style={{
                  fontSize: 11, fontWeight: 700, background: "#eff6ff",
                  color: "#2563eb", padding: "3px 10px", borderRadius: 20,
                  border: "1px solid #dbeafe",
                }}
              >
                {checkedIds.length} selected
              </span>
            )}
          </div>

          <div className="ucr-body">
            <div className="ucr-table-container">
              <FinalTable
                category={category}
                rows={finalList}
                checkedIds={checkedIds}
                onToggle={toggleCheck}
                onToggleAll={toggleAll}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="ucr-footer">
            {reqType === "addition" ? (
              <>
                <ActionBtn
                  onClick={handleApprove}
                  disabled={!checkedIds.length || isSubmitting}
                  color="blue"
                  icon={<Check size={14} />}
                  label="Approve"
                  loading={isSubmitting}
                />
                <ActionBtn
                  onClick={() => {
                    if (!checkedIds.length) return setError("Please select at least one record.");
                    setError("");
                    setRejectReason("");
                    setRejectPopup(true);
                  }}
                  disabled={!checkedIds.length || isSubmitting}
                  color="gray"
                  icon={<X size={14} />}
                  label="Reject"
                />
              </>
            ) : (
              <>
                <ActionBtn
                  onClick={handleDelete}
                  disabled={!checkedIds.length || isSubmitting}
                  color="red"
                  icon={<Trash2 size={14} />}
                  label="Delete"
                  loading={isSubmitting}
                />
                <ActionBtn
                  onClick={() => {
                    if (!checkedIds.length) return setError("Please select at least one record.");
                    setError("");
                    setRejectReason("");
                    setRejectPopup(true);
                  }}
                  disabled={!checkedIds.length || isSubmitting}
                  color="gray"
                  icon={<X size={14} />}
                  label="Reject"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          REJECT POPUP
      ══════════════════════════════════════════════════════════════ */}
      {rejectPopup && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420,
              margin: "0 16px", overflow: "hidden",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.12)",
            }}
          >
            {/* Popup header */}
            <div
              style={{
                padding: "24px 24px 16px", textAlign: "center",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: "50%", background: "#fef2f2",
                  border: "2px solid #fecaca", display: "flex", alignItems: "center",
                  justifyContent: "center", margin: "0 auto 12px",
                }}
              >
                <X size={20} style={{ color: "#dc2626" }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
                Rejection Message
              </h3>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                Provide a reason for rejecting {checkedIds.length} record(s).
              </p>
            </div>
            {/* Popup body */}
            <div style={{ padding: "20px 24px" }}>
              <textarea
                rows={5}
                placeholder="Type reason here…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: "100%", borderRadius: 8, border: "1.5px solid #d1d5db",
                  padding: "10px 12px", fontSize: 13, color: "#111827",
                  resize: "none", outline: "none", fontFamily: "Inter, sans-serif",
                }}
              />
            </div>
            {/* Popup footer */}
            <div
              style={{
                padding: "0 24px 24px", display: "flex", gap: 10, justifyContent: "center",
              }}
            >
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim() || isSubmitting}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 32px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: "none", background: "#2563eb", color: "#fff",
                  cursor: !rejectReason.trim() || isSubmitting ? "not-allowed" : "pointer",
                  opacity: !rejectReason.trim() || isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting && (
                  <Loader2
                    size={14}
                    style={{ animation: "ucr-spin 1s linear infinite" }}
                  />
                )}
                OK
              </button>
              <button
                onClick={() => { setRejectPopup(false); setRejectReason(""); }}
                style={{
                  padding: "8px 32px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: "1.5px solid #d1d5db", background: "#fff", color: "#374151",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SummaryPanel — no outer card; lives inside the shared ucr-card
// ═══════════════════════════════════════════════════════════════════
function SummaryPanel({ title, accentColor, counts, reqType, entities, onCountClick }) {
  const isBlue = accentColor === "blue";

  return (
    <div>
      {/* Panel header */}
      <div
        style={{
          padding: "14px 20px", borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h3>
        </div>
        <span
          style={{
            fontSize: 10, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.05em", padding: "3px 10px", borderRadius: 20,
            background: isBlue ? "#eff6ff" : "#fef2f2",
            color: isBlue ? "#2563eb" : "#dc2626",
          }}
        >
          {reqType}
        </span>
      </div>

      {/* Panel table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <colgroup>
          <col style={{ width: "60%" }} />
          <col style={{ width: "40%" }} />
        </colgroup>
        <thead>
          <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
            <th style={{ padding: "12px 20px", textAlign: "center", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Request For
            </th>
            <th style={{ padding: "12px 20px", textAlign: "center", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Count
            </th>
          </tr>
        </thead>
        <tbody>
          {entities.map((entity) => (
            <tr key={entity.category} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "14px 20px", textAlign: "center", color: "#374151", fontWeight: 500 }}>
                {entity.label}
              </td>
              <td style={{ padding: "14px 20px", textAlign: "center" }}>
                <button
                  onClick={() => onCountClick(reqType, entity.category)}
                  style={{
                    background: "none", border: "none", fontSize: 15, fontWeight: 700,
                    cursor: "pointer", color: isBlue ? "#2563eb" : "#dc2626",
                  }}
                >
                  {counts[entity.category] ?? 0}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Column definitions per category ─────────────────────────────────────────
const COLUMNS = {
  area: [
    { key: "stateName",    label: "State Name" },
    { key: "districtName", label: "Headquarter Name" },
    { key: "employeeName", label: "User Name" },
    { key: "areaName",     label: "Area Name" },
    { key: "areaCode",     label: "Area Code" },
    { key: "areaType",     label: "Type" },
  ],
  doctor: [
    { key: "stateName",    label: "State Name" },
    { key: "districtName", label: "Headquarter Name" },
    { key: "employeeName", label: "User Name" },
    { key: "areaName",     label: "Area Name" },
    { key: "doctorName",   label: "Doctor Name" },
    { key: "doctorCode",   label: "Doctor Code" },
    { key: "mslNo",        label: "MSL No." },
    { key: "phone",        label: "Mobile No." },
  ],
  provider: [
    { key: "stateName",    label: "State Name" },
    { key: "districtName", label: "Headquarter Name" },
    { key: "employeeName", label: "User Name" },
    { key: "areaName",     label: "Area Name" },
    { key: "providerName", label: "Provider Name" },
    { key: "providerCode", label: "Provider Code" },
    { key: "type",         label: "Provider Type" },
    { key: "phone",        label: "Mobile No." },
  ],
};

// ─── getValue — drills into nested objects from the API response ───────────────
const getValue = (row, key) => {
  switch (key) {
    case "stateName":
      return row.district?.state?.stateName
          || row.district?.state?.state_name
          || row.state?.stateName
          || row.state?.state_name
          || row.stateName
          || row.state_name
          || "—";
    case "districtName":
      return row.district?.districtName
          || row.district?.district_name
          || row.district?.name
          || row.districtName
          || row.district_name
          || row.hqName
          || "—";
    case "employeeName":
      return row.employee?.name
          || row.employee?.employeeName
          || row.employeeName
          || row.userName
          || row.user_name
          || "—";
    case "areaName":
      return row.area?.areaName
          || row.area?.area_name
          || row.area?.name
          || row.areaName
          || row.area_name
          || "—";
    case "areaCode":
      return row.areaCode || row.area_code || row.area?.areaCode || "—";
    case "areaType":
      return row.areaType || row.area_type || row.area?.areaType || row.type || "—";
    case "doctorName":
      return row.doctorName || row.doctor_name || row.doctor?.name || row.name || "—";
    case "doctorCode":
      return row.doctorCode || row.doctor_code || row.doctor?.doctorCode || "—";
    case "mslNo":
      return row.mslNo || row.msl_no || row.doctor?.mslNo || "—";
    case "providerName":
      return row.providerName || row.provider_name
          || row.chemistName  || row.chemist_name
          || row.name         || "—";
    case "providerCode":
      return row.providerCode || row.provider_code
          || row.chemistCode  || row.chemist_code || "—";
    case "phone":
      return row.phone || row.mobile || row.mobile_no || row.mobileNo || "—";
    case "type":
      return row.type || row.providerType || row.provider_type || "—";
    default:
      return row[key] ?? "—";
  }
};

// ═══════════════════════════════════════════════════════════════════
// FinalTable
// ═══════════════════════════════════════════════════════════════════
function FinalTable({ category, rows, checkedIds, onToggle, onToggleAll }) {
  const cols   = COLUMNS[category] || COLUMNS.area;
  const allIds = rows.map((r) => r.id);
  const allChk = allIds.length > 0 && checkedIds.length === allIds.length;
  const someChk = checkedIds.length > 0 && !allChk;

  return (
    <table className="ucr-table">
      <thead>
        <tr>
          <th style={{ width: 40, textAlign: "center" }}>
            <IndeterminateCheckbox
              checked={allChk}
              indeterminate={someChk}
              onChange={() => onToggleAll(allIds)}
            />
          </th>
          {cols.map((c) => (
            <th key={c.key}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <EmptyRow cols={cols.length + 1} />
        ) : (
          rows.map((row) => {
            const checked = checkedIds.includes(row.id);
            return (
              <tr
                key={row.id}
                onClick={() => onToggle(row.id)}
                style={{ cursor: "pointer", background: checked ? "#eff6ff" : "transparent" }}
              >
                <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(row.id)}
                    style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#2563eb" }}
                  />
                </td>
                {cols.map((c) => (
                  <td key={c.key}>{getValue(row, c.key)}</td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

// ═══════════════════════════════════════════════════════════════════
// IndeterminateCheckbox
// ═══════════════════════════════════════════════════════════════════
function IndeterminateCheckbox({ checked, indeterminate, onChange }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        width: 17, height: 17, borderRadius: 4,
        border: `2px solid ${checked || indeterminate ? "#2563eb" : "#d1d5db"}`,
        background: checked || indeterminate ? "#2563eb" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", margin: "0 auto", transition: "all 0.15s",
      }}
    >
      {indeterminate && !checked ? (
        <div style={{ width: 8, height: 2, borderRadius: 2, background: "#fff" }} />
      ) : checked ? (
        <svg viewBox="0 0 12 10" style={{ width: 10, height: 8, color: "#fff" }} fill="none">
          <path
            d="M1 5l3.5 3.5L11 1"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ActionBtn
// ═══════════════════════════════════════════════════════════════════
function ActionBtn({ onClick, disabled, color, icon, label, loading }) {
  const colorMap = {
    blue: { background: "#2563eb", color: "#fff", border: "none" },
    red:  { background: "#fff",    color: "#dc2626", border: "1px solid #fecaca" },
    gray: { background: "#374151", color: "#fff",    border: "none" },
  };
  const s = colorMap[color] || colorMap.gray;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700,
        background: disabled ? "#f3f4f6" : s.background,
        color: disabled ? "#9ca3af" : s.color,
        border: disabled ? "none" : s.border,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
        minWidth: 100,
      }}
    >
      {loading
        ? <Loader2 size={14} style={{ animation: "ucr-spin 1s linear infinite" }} />
        : icon}
      {label}
    </button>
  );
}

// ─── EmptyRow ─────────────────────────────────────────────────────────────────
function EmptyRow({ cols }) {
  return (
    <tr>
      <td
        colSpan={cols}
        style={{ padding: "48px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <ClipboardList size={28} style={{ color: "#d1d5db" }} />
          <p style={{ margin: 0, fontWeight: 500 }}>No records found.</p>
        </div>
      </td>
    </tr>
  );
}