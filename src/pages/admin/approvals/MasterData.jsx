import React, { useState, useEffect } from "react";
import {
  Loader2, CheckCircle2, Trash2, ChevronRight,
  ArrowLeft, AlertCircle, Check, X, ClipboardList
} from "lucide-react";
import api from "../../../services/api";

// ─── Navigation levels ────────────────────────────────────────────────────────
const LEVEL = { MAIN: "main", USER_LIST: "userList", FINAL_LIST: "finalList" };

// ─── Entity config ────────────────────────────────────────────────────────────
const ENTITIES = [
  { category: "area",     label: "Area" },
  { category: "doctor",   label: "Doctor" },
  { category: "provider", label: "Chemist / Stockist" },
];

export default function MasterData() {
  // ── Navigation ───────────────────────────────────────────────────────────
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

  // Reject popup
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
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  // ── Level 1 → 2 ───────────────────────────────────────────────────────────
  const handleCountClick = async (type, cat) => {
    setReqType(type); setCategory(cat);
    setCheckedIds([]); setError(""); setSuccessMsg("");
    setIsLoading(true);
    try {
      const res = await api.get(`/api/approvals/summary/${cat}/${type}`);
      const data = res.data?.data || res.data || [];
      setUserList(Array.isArray(data) ? data : []);
      setLevel(LEVEL.USER_LIST);
    } catch { setError("Failed to load user requests."); }
    finally { setIsLoading(false); }
  };

  // ── Level 2 → 3 ───────────────────────────────────────────────────────────
  const handleUserClick = async (user) => {
    setSelectedUser(user); setCheckedIds([]); setError(""); setSuccessMsg("");
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
    } catch { setError("Failed to load final list."); }
    finally { setIsLoading(false); }
  };

  // ── Back ──────────────────────────────────────────────────────────────────
  const goBack = () => {
    setError(""); setSuccessMsg(""); setCheckedIds([]);
    if (level === LEVEL.FINAL_LIST) {
      setLevel(LEVEL.USER_LIST); setSelectedUser(null);
    } else {
      setLevel(LEVEL.MAIN); setReqType(null); setCategory(null);
      fetchCounts();
    }
  };

  const toggleCheck = (id)  => setCheckedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const toggleAll   = (ids) => setCheckedIds(p => p.length === ids.length ? [] : ids);

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
    setIsSubmitting(true); setError("");
    try {
      const res = await api.post(
        `/api/approvals/approve/${category}/${reqType}`,
        checkedIds
      );
      if (res.data?.success || res.status === 200 || res.status === 201) {
        setSuccessMsg(`${checkedIds.length} record(s) approved successfully!`);
        setCheckedIds([]); await refreshFinal();
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (err) { setError(err.response?.data?.message || "Approve failed."); }
    finally { setIsSubmitting(false); }
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
        setRejectPopup(false); setRejectReason("");
        setSuccessMsg(`${checkedIds.length} record(s) rejected.`);
        setCheckedIds([]); await refreshFinal();
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (err) { setError(err.response?.data?.message || "Reject failed."); setRejectPopup(false); }
    finally { setIsSubmitting(false); }
  };

  // ── Delete (deletion flow) ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!checkedIds.length) return setError("Please select at least one record.");
    setIsSubmitting(true); setError("");
    try {
      const res = await api.post(
        `/api/approvals/approve/${category}/${reqType}`,
        checkedIds
      );
      if (res.data?.success || res.status === 200 || res.status === 201) {
        setSuccessMsg(`${checkedIds.length} record(s) deleted successfully!`);
        setCheckedIds([]); await refreshFinal();
        setTimeout(() => setSuccessMsg(""), 3500);
      }
    } catch (err) { setError(err.response?.data?.message || "Delete failed."); }
    finally { setIsSubmitting(false); }
  };

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  const entityLabel = ENTITIES.find(e => e.category === category)?.label || category;
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
    <div className="space-y-5 animate-in fade-in duration-400 pb-12">

      {/* ── Page Card Header ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-sky-400" />
        <div className="px-6 sm:px-8 py-5 flex items-center gap-3">
          {level !== LEVEL.MAIN && (
            <button onClick={goBack}
              className="flex items-center justify-center w-8 h-8 rounded-lg
                border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300
                transition-all flex-shrink-0">
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <ClipboardList size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Approval Master</h2>
              <div className="flex items-center gap-1 mt-0.5">
                {crumbs().map((c, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
                    <span className={`text-xs ${i === crumbs().length - 1 ? "text-blue-500 font-semibold" : "text-gray-400"}`}>
                      {c}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-sm">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg border border-emerald-100 text-sm">
          <CheckCircle2 size={15} className="flex-shrink-0" /> {successMsg}
        </div>
      )}

      {/* Loader */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="text-sm text-gray-400 font-medium">Loading…</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          LEVEL 1 — Two summary cards
      ══════════════════════════════════════════════════════════════ */}
      {!isLoading && level === LEVEL.MAIN && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SummaryCard
            title="Addition Requests"
            accentColor="blue"
            counts={counts.additions || {}}
            reqType="addition"
            entities={ENTITIES}
            onCountClick={handleCountClick}
          />
          <SummaryCard
            title="Deletion Requests"
            accentColor="red"
            counts={counts.deletions || {}}
            reqType="deletion"
            entities={ENTITIES}
            onCountClick={handleCountClick}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          LEVEL 2 — User summary table
      ══════════════════════════════════════════════════════════════ */}
      {!isLoading && level === LEVEL.USER_LIST && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 sm:px-8 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">
              User's {entityLabel}{" "}
              <span className={reqType === "addition" ? "text-blue-600" : "text-red-500"}>
                {reqType === "addition" ? "Addition" : "Deletion"}
              </span>{" "}
              Requests
            </h3>
            {userList.length > 0 && (
              <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                {userList.length} user{userList.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[640px]">
              <thead className="bg-blue-600 text-white text-xs uppercase tracking-wider">
                <tr>
                  <Th>SN.</Th>
                  <Th>State Name</Th>
                  <Th>Headquarter Name</Th>
                  <Th>User Name</Th>
                  <Th center>Total Request</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {userList.length === 0
                  ? <EmptyRow cols={5} />
                  : userList.map((row, i) => (
                    <tr key={row.employeeId || i}
                      className={`transition-colors hover:bg-blue-50/30 ${i % 2 !== 0 ? "bg-gray-50/40" : ""}`}>
                      <Td>{i + 1}</Td>
                      <Td>{row.stateName || "—"}</Td>
                      <Td>{row.districtName || "—"}</Td>
                      <Td>{row.employeeName || "—"}</Td>
                      <Td center>
                        <button
                          onClick={() => handleUserClick(row)}
                          className="inline-flex items-center gap-1 font-bold text-blue-600
                            hover:text-blue-800 transition-colors group">
                          <span className="group-hover:underline">
                            {row.totalRequests || 0}
                          </span>
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </Td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          LEVEL 3 — Final details table + actions
      ══════════════════════════════════════════════════════════════ */}
      {!isLoading && level === LEVEL.FINAL_LIST && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 sm:px-8 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">
                {entityLabel} Requests
                <span className="ml-2 text-gray-400 font-normal">
                  — {selectedUser?.employeeName}
                </span>
              </h3>
              {checkedIds.length > 0 && (
                <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">
                  {checkedIds.length} selected
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
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
          <div className="flex items-center gap-3 flex-wrap pt-1">
            {reqType === "addition" ? (
              <>
                <ActionBtn
                  onClick={handleApprove}
                  disabled={!checkedIds.length || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                  icon={<Check size={15} />}
                  label="Approve"
                  loading={isSubmitting}
                />
                <ActionBtn
                  onClick={() => {
                    if (!checkedIds.length) return setError("Please select at least one record.");
                    setError(""); setRejectReason(""); setRejectPopup(true);
                  }}
                  disabled={!checkedIds.length || isSubmitting}
                  className="bg-gray-700 hover:bg-gray-800 text-white shadow-sm"
                  icon={<X size={15} />}
                  label="Reject"
                />
              </>
            ) : (
              <>
                <ActionBtn
                  onClick={handleDelete}
                  disabled={!checkedIds.length || isSubmitting}
                  className="bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-200"
                  icon={<Trash2 size={15} />}
                  label="Delete"
                  loading={isSubmitting}
                />
                <ActionBtn
                  onClick={() => {
                    if (!checkedIds.length) return setError("Please select at least one record.");
                    setError(""); setRejectReason(""); setRejectPopup(true);
                  }}
                  disabled={!checkedIds.length || isSubmitting}
                  className="bg-gray-700 hover:bg-gray-800 text-white shadow-sm"
                  icon={<X size={15} />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40
          backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden
            animate-in zoom-in-95 duration-150">
            <div className="px-6 pt-6 pb-3 text-center border-b border-gray-100">
              <div className="w-11 h-11 rounded-full bg-red-50 border-2 border-red-100
                flex items-center justify-center mx-auto mb-3">
                <X size={20} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Rejection Message</h3>
              <p className="text-xs text-gray-500 mt-1">
                Provide a reason for rejecting {checkedIds.length} record(s).
              </p>
            </div>
            <div className="px-6 py-5">
              <textarea
                rows={5}
                placeholder="Type reason here…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-300 focus:border-blue-500
                  focus:ring-2 focus:ring-blue-100 px-4 py-3 text-sm text-gray-800
                  placeholder-gray-400 resize-none focus:outline-none transition-all"
              />
            </div>
            <div className="flex items-center justify-center gap-3 px-6 pb-6">
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim() || isSubmitting}
                className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-blue-600
                  hover:bg-blue-700 text-white text-sm font-bold transition-all active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                OK
              </button>
              <button
                onClick={() => { setRejectPopup(false); setRejectReason(""); }}
                className="px-8 py-2.5 rounded-lg border-2 border-gray-300 text-gray-600
                  hover:border-gray-400 text-sm font-bold transition-all active:scale-95"
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

// ─── SummaryCard ──────────────────────────────────────────────────────────────
function SummaryCard({ title, accentColor, counts, reqType, entities, onCountClick }) {
  const headerCls = accentColor === "blue" ? "bg-blue-600 text-white" : "bg-red-500 text-white";
  const countCls  = accentColor === "blue" ? "text-blue-600 hover:text-blue-800" : "text-red-500 hover:text-red-700";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full
          ${accentColor === "blue" ? "bg-blue-50 text-blue-500" : "bg-red-50 text-red-500"}`}>
          {reqType}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className={headerCls}>
            <tr>
              <th className="py-3 px-5 font-semibold text-center text-xs uppercase tracking-wider">Request For</th>
              <th className="py-3 px-5 font-semibold text-center text-xs uppercase tracking-wider">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entities.map((entity, i) => (
              <tr key={entity.category}
                className={`transition-colors hover:bg-gray-50/60 ${i % 2 !== 0 ? "bg-gray-50/40" : "bg-white"}`}>
                <td className="py-3.5 px-5 text-gray-600 text-center font-medium">{entity.label}</td>
                <td className="py-3.5 px-5 text-center">
                  <button
                    onClick={() => onCountClick(reqType, entity.category)}
                    className={`text-[15px] font-bold transition-colors hover:underline ${countCls}`}
                  >
                    {counts[entity.category] ?? 0}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

// ─── ✅ FIX: getValue drills into nested objects from the API response ─────────
// Debug showed: { areaCode, areaName, areaType, district: { districtName, state: { stateName } }, employee: { name } }
// So stateName lives at:  row.district?.state?.stateName
//    districtName lives at: row.district?.districtName
//    employeeName lives at: row.employee?.name
//    areaName lives at:     row.area?.areaName  OR  row.areaName (flat)
const getValue = (row, key) => {
  switch (key) {
    // ── STATE NAME ──
    // Try nested paths: district.state.stateName → district.stateName → flat stateName
    case "stateName":
      return row.district?.state?.stateName
          || row.district?.state?.state_name
          || row.state?.stateName
          || row.state?.state_name
          || row.stateName
          || row.state_name
          || "—";

    // ── HEADQUARTER / DISTRICT NAME ──
    // Try nested: district.districtName → flat districtName
    case "districtName":
      return row.district?.districtName
          || row.district?.district_name
          || row.district?.name
          || row.districtName
          || row.district_name
          || row.hqName
          || "—";

    // ── EMPLOYEE / USER NAME ──
    case "employeeName":
      return row.employee?.name
          || row.employee?.employeeName
          || row.employeeName
          || row.userName
          || row.user_name
          || "—";

    // ── AREA NAME ──
    case "areaName":
      return row.area?.areaName
          || row.area?.area_name
          || row.area?.name
          || row.areaName
          || row.area_name
          || "—";

    // ── AREA CODE (flat on root) ──
    case "areaCode":
      return row.areaCode || row.area_code || row.area?.areaCode || "—";

    // ── AREA TYPE (flat on root) ──
    case "areaType":
      return row.areaType || row.area_type || row.area?.areaType || row.type || "—";

    // ── DOCTOR NAME ──
    case "doctorName":
      return row.doctorName || row.doctor_name || row.doctor?.name || row.name || "—";

    // ── DOCTOR CODE ──
    case "doctorCode":
      return row.doctorCode || row.doctor_code || row.doctor?.doctorCode || "—";

    // ── MSL NO ──
    case "mslNo":
      return row.mslNo || row.msl_no || row.doctor?.mslNo || "—";

    // ── PROVIDER NAME ──
    case "providerName":
      return row.providerName || row.provider_name
          || row.chemistName  || row.chemist_name
          || row.name         || "—";

    // ── PROVIDER CODE ──
    case "providerCode":
      return row.providerCode || row.provider_code
          || row.chemistCode  || row.chemist_code || "—";

    // ── PHONE / MOBILE ──
    case "phone":
      return row.phone || row.mobile || row.mobile_no || row.mobileNo || "—";

    // ── TYPE ──
    case "type":
      return row.type || row.providerType || row.provider_type || "—";

    // ── FALLBACK: return whatever the key is on the root object ──
    default:
      return row[key] ?? "—";
  }
};

// ─── FinalTable ───────────────────────────────────────────────────────────────
function FinalTable({ category, rows, checkedIds, onToggle, onToggleAll }) {
  const cols    = COLUMNS[category] || COLUMNS.area;
  const allIds  = rows.map(r => r.id);
  const allChk  = allIds.length > 0 && checkedIds.length === allIds.length;
  const someChk = checkedIds.length > 0 && !allChk;

  return (
    <table className="w-full text-sm text-left" style={{ minWidth: 920 }}>
      <thead className="bg-blue-600 text-white text-xs uppercase tracking-wider">
        <tr>
          <th className="py-3.5 px-5 w-14 text-center">
            <IndeterminateCheckbox
              checked={allChk} indeterminate={someChk}
              onChange={() => onToggleAll(allIds)} light
            />
          </th>
          {cols.map(c => (
            <th key={c.key} className="py-3.5 px-5 font-semibold whitespace-nowrap text-center">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.length === 0
          ? <EmptyRow cols={cols.length + 1} />
          : rows.map((row, i) => {
            const checked = checkedIds.includes(row.id);
            return (
              <tr key={row.id} onClick={() => onToggle(row.id)}
                className={`cursor-pointer transition-colors ${
                  checked
                    ? "bg-blue-50/70"
                    : i % 2 !== 0
                      ? "bg-gray-50/40 hover:bg-blue-50/30"
                      : "bg-white hover:bg-blue-50/20"
                }`}>
                <td className="py-3.5 px-5 text-center" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={checked} onChange={() => onToggle(row.id)}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                </td>
                {cols.map(c => (
                  <td key={c.key} className="py-3.5 px-5 text-gray-600 text-center whitespace-nowrap">
                    {getValue(row, c.key)}
                  </td>
                ))}
              </tr>
            );
          })
        }
      </tbody>
    </table>
  );
}

// ─── IndeterminateCheckbox ────────────────────────────────────────────────────
function IndeterminateCheckbox({ checked, indeterminate, onChange, light }) {
  return (
    <div onClick={e => { e.stopPropagation(); onChange(); }}
      className={`w-[17px] h-[17px] rounded border-2 flex items-center justify-center
        cursor-pointer transition-all mx-auto
        ${checked || indeterminate
          ? light ? "border-white bg-white" : "border-blue-500 bg-blue-500"
          : light ? "border-white/60 bg-transparent hover:border-white" : "border-gray-300 bg-white hover:border-blue-400"
        }`}>
      {indeterminate && !checked
        ? <div className={`w-2 h-0.5 rounded-full ${light ? "bg-blue-500" : "bg-white"}`} />
        : checked
          ? <svg viewBox="0 0 12 10" className={`w-2.5 h-2 ${light ? "text-blue-500" : "text-white"}`} fill="none">
              <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          : null
      }
    </div>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
function ActionBtn({ onClick, disabled, className, icon, label, loading }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-2 px-7 py-2.5 rounded-lg text-sm font-bold
        transition-all active:scale-95
        ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" : className}`}>
      {loading ? <Loader2 size={15} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

// ─── Table helpers ────────────────────────────────────────────────────────────
function Th({ children, center }) {
  return (
    <th className={`py-3.5 px-5 font-semibold whitespace-nowrap text-xs uppercase tracking-wider
      ${center ? "text-center" : "text-left"}`}>
      {children}
    </th>
  );
}

function Td({ children, center }) {
  return (
    <td className={`py-3.5 px-5 text-gray-600 whitespace-nowrap ${center ? "text-center" : ""}`}>
      {children}
    </td>
  );
}

function EmptyRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} className="py-14 text-center text-gray-400 text-sm bg-gray-50/30">
        <ClipboardList size={28} className="mx-auto mb-2 text-gray-300" />
        <p className="font-medium">No records found.</p>
      </td>
    </tr>
  );
}