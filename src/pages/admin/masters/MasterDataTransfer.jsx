import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, MapPin, CheckCircle2, ArrowRightLeft,
  ChevronDown, AlertCircle, Search, Users, Check, Save
} from "lucide-react";
import api from "../../../services/api";

const TRANSFER_TYPES = [
  { value: "Area",   label: "Area" },
  { value: "Doctor", label: "Doctor" },
  { value: "Chemist",  label: "Chemist" },
  { value: "Stockist", label: "Stockist" },
];

/* ─── Global responsive styles from reference ────────────────────────────── */
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:flex-end; border-radius:0 0 16px 16px; }
  .ucr-divider{ border:none; border-top:1px solid #f3f4f6; margin:24px 0; }
  
  .ucr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:24px; }
  .ucr-gender-row{ display:flex; align-items:center; gap:20px; flex-wrap:wrap; margin:16px 0; padding: 12px; background: #f9fafb; border-radius: 12px; border: 1px solid #f3f4f6; }

  @media(max-width:1024px){
    .ucr-grid  { grid-template-columns:repeat(2,1fr); gap:16px; }
    .ucr-body  { padding:18px; }
  }
  @media(max-width:600px){
    .ucr-grid  { grid-template-columns:1fr; gap:12px; }
    .ucr-body  { padding:14px; }
    .ucr-submit-btn{ width:100%; justify-content:center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const FH = 36;

export default function MasterDataTransfer() {
  const [transferType, setTransferType] = useState("Area");
  const [error, setError] = useState("");
  const [popup, setPopup] = useState({ isOpen: false, message: "" });

  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const [states, setStates] = useState([]);
  const [fromEmployees, setFromEmployees] = useState([]);
  const [toEmployees, setToEmployees] = useState([]);

  const [selectedStateIds, setSelectedStateIds] = useState([]);
  const [fromEmployeeId, setFromEmployeeId] = useState("");
  const [toEmployeeId, setToEmployeeId] = useState("");

  const [fromAreas, setFromAreas] = useState([]);
  const [toAreas, setToAreas] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState([]);
  const [selectedFromAreaId, setSelectedFromAreaId] = useState("");
  const [selectedProviderIds, setSelectedProviderIds] = useState([]);
  const [selectedToAreaId, setSelectedToAreaId] = useState("");
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => { fetchStates(); }, []);

  useEffect(() => {
    if (selectedStateIds.length > 0) {
      fetchEmployees(selectedStateIds.join(","));
    } else {
      setFromEmployees([]); setToEmployees([]);
      setFromEmployeeId(""); setToEmployeeId("");
    }
  }, [selectedStateIds]);

  useEffect(() => {
    if (selectedStateIds.length > 0 && fromEmployeeId) {
      setToEmployees(fromEmployees.filter(e => String(e.id) !== String(fromEmployeeId)));
    } else {
      setToEmployees([]);
    }
    setToEmployeeId("");
    resetTables();
  }, [fromEmployeeId]);

  const handleTypeChange = (val) => { setTransferType(val); resetTables(); setError(""); };

  const resetTables = () => {
    setFromAreas([]); setToAreas([]); setProviders([]);
    setSelectedAreaIds([]); setSelectedFromAreaId("");
    setSelectedProviderIds([]); setSelectedToAreaId("");
    setDetailsVisible(false);
  };

  const fetchStates = async () => {
    try {
      const res = await api.get("/api/masters/states");
      const data = res.data?.data || res.data || [];
      setStates(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchEmployees = async (stateIdsString) => {
    try {
      const res = await api.get(`/api/masters/employees/by-states?stateIds=${stateIdsString}`);
      const data = res.data?.data || res.data || [];
      setFromEmployees(Array.isArray(data) ? data : []);
    } catch { setFromEmployees([]); }
  };

  const handleViewDetails = async () => {
    if (selectedStateIds.length === 0 || !fromEmployeeId || !toEmployeeId) return;
    setError(""); setIsLoadingDetails(true); resetTables();
    try {
      const fromRes = await api.get(`/api/masters/areas/filter?employeeId=${fromEmployeeId}`);
      const fromData = fromRes.data?.data || fromRes.data || [];
      setFromAreas(Array.isArray(fromData) ? fromData : []);
      if (transferType !== "Area") {
        const toRes = await api.get(`/api/masters/areas/filter?employeeId=${toEmployeeId}`);
        const toData = toRes.data?.data || toRes.data || [];
        setToAreas(Array.isArray(toData) ? toData : []);
      }
      setDetailsVisible(true);
    } catch { setError("Failed to load areas for the selected employees."); }
    finally { setIsLoadingDetails(false); }
  };

  const handleSourceAreaClick = async (areaId) => {
    if (transferType === "Area") return;
    setSelectedFromAreaId(areaId); setSelectedProviderIds([]); setIsLoadingProviders(true);
    try {
      const endpoint = transferType === "Doctor"
        ? `/api/masters/doctors/area/${areaId}`
        : `/api/masters/providers/area/${areaId}?type=${transferType}`;
      const res = await api.get(endpoint);
      const data = res.data?.data || res.data || [];
      setProviders(Array.isArray(data) ? data : []);
    } catch { setProviders([]); setError(`Failed to load ${transferType}s.`); }
    finally { setIsLoadingProviders(false); }
  };

  const executeTransfer = async () => {
    setError(""); setIsTransferring(true);
    try {
      let endpoint = "", payload = {};
      if (transferType === "Area") {
        endpoint = "/api/masters/areas/transfer";
        payload = { areaIds: selectedAreaIds, newEmployeeId: parseInt(toEmployeeId) };
      } else if (transferType === "Doctor") {
        endpoint = "/api/masters/doctors/transfer";
        payload = { providerIds: selectedProviderIds, newEmployeeId: parseInt(toEmployeeId), newAreaId: parseInt(selectedToAreaId) };
      } else {
        endpoint = "/api/masters/providers/transfer";
        payload = { providerIds: selectedProviderIds, newEmployeeId: parseInt(toEmployeeId), newAreaId: parseInt(selectedToAreaId) };
      }
      const res = await api.put(endpoint, payload);
      if (res.data?.success || res.status === 200) {
        setPopup({ isOpen: true, message: `${transferType} Data Transferred Successfully!` });
        handleViewDetails();
      }
    } catch (err) { setError(err.response?.data?.message || "Transfer failed. Please try again."); }
    finally { setIsTransferring(false); }
  };

  const toggleProviderRow = (id) => setSelectedProviderIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAllProviders = (e) => setSelectedProviderIds(e.target.checked ? providers.map(p => p.id) : []);
  const toggleAreaRow = (id) => setSelectedAreaIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAllAreas = (e) => setSelectedAreaIds(e.target.checked ? fromAreas.map(a => a.id) : []);

  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="ucr-card">
        {/* Header */}
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArrowRightLeft size={17} style={{ color: "#2563eb" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Master Data Transfer</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>Transfer Areas, Doctors, Chemists, or Stockists between employees</p>
          </div>
        </div>

        <div className="ucr-body">
          {/* Transfer Type Selection */}
          <div className="ucr-gender-row">
            <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0, marginRight: 8 }}>Transfer Type:</p>
            {TRANSFER_TYPES.map(type => (
              <label key={type.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: transferType === type.value ? "2px solid #2563eb" : "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {transferType === type.value && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb" }} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: transferType === type.value ? "#111827" : "#6b7280" }}>{type.label}</span>
                <input type="radio" name="transferType" value={type.value} checked={transferType === type.value} onChange={() => handleTypeChange(type.value)} style={{ display: "none" }} />
              </label>
            ))}
          </div>

          <div className="ucr-grid">
            <MultiSelectDropdown
              label="Select State *"
              options={states}
              selectedIds={selectedStateIds}
              onChange={(newIds) => {
                setSelectedStateIds(newIds);
                setFromEmployeeId(""); setToEmployeeId("");
                resetTables();
              }}
            />
            <FSelect
              label="From Employee *"
              name="fromEmployeeId"
              value={fromEmployeeId}
              disabled={selectedStateIds.length === 0}
              onChange={(e) => setFromEmployeeId(e.target.value)}
              options={fromEmployees.map(e => ({ id: e.id, label: e.name || e.employee_name }))}
            />
            <FSelect
              label="To Employee *"
              name="toEmployeeId"
              value={toEmployeeId}
              disabled={!fromEmployeeId}
              onChange={(e) => setToEmployeeId(e.target.value)}
              options={toEmployees.map(e => ({ id: e.id, label: e.name || e.employee_name }))}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleViewDetails}
              disabled={selectedStateIds.length === 0 || !fromEmployeeId || !toEmployeeId || isLoadingDetails}
              className="ucr-submit-btn"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 24px", borderRadius: 9,
                fontSize: 13, fontWeight: 700, border: "none",
                cursor: (selectedStateIds.length === 0 || !fromEmployeeId || !toEmployeeId || isLoadingDetails) ? "not-allowed" : "pointer",
                background: "#2563eb", color: "#fff",
                boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                opacity: (selectedStateIds.length === 0 || !fromEmployeeId || !toEmployeeId || isLoadingDetails) ? 0.6 : 1, transition: "all 0.15s",
              }}
            >
              {isLoadingDetails ? <Loader2 size={14} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Search size={14} />}
              View Details
            </button>
          </div>

          {detailsVisible && (
            <>
              <hr className="ucr-divider" />
              {transferType === "Area" ? (
                <div style={{ border: "1px solid #f3f4f6", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ background: "#f9fafb", padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4b5563" }}>SELECT AREAS TO TRANSFER</span>
                    <span style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{fromAreas.length} TOTAL</span>
                  </div>
                  <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead style={{ background: "#fff", position: "sticky", top: 0, zIndex: 5, boxShadow: "0 1px 0 #f3f4f6" }}>
                        <tr>
                          <th style={{ padding: "12px", width: 50, textAlign: "center" }}>
                            <input type="checkbox" onChange={toggleAllAreas} checked={fromAreas.length > 0 && selectedAreaIds.length === fromAreas.length} />
                          </th>
                          <th style={{ padding: "12px", textAlign: "left", fontWeight: 700, color: "#6b7280" }}>AREA NAME</th>
                        </tr>
                      </thead>
                      <tbody style={{ background: "#fff" }}>
                        {fromAreas.map(area => (
                          <tr key={area.id} onClick={() => toggleAreaRow(area.id)} style={{ borderTop: "1px solid #f3f4f6", cursor: "pointer", background: selectedAreaIds.includes(area.id) ? "#eff6ff" : "transparent" }}>
                            <td style={{ padding: "10px", textAlign: "center" }}>
                              <input type="checkbox" readOnly checked={selectedAreaIds.includes(area.id)} />
                            </td>
                            <td style={{ padding: "10px", color: "#374151", fontWeight: 500 }}>{area.area_name || area.areaName || area.name || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="ucr-footer">
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginRight: "auto" }}>{selectedAreaIds.length} SELECTED</span>
                    <button onClick={executeTransfer} disabled={selectedAreaIds.length === 0 || isTransferring}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "8px 24px", borderRadius: 9,
                        fontSize: 13, fontWeight: 700, border: "none", cursor: (selectedAreaIds.length === 0 || isTransferring) ? "not-allowed" : "pointer",
                        background: "#2563eb", color: "#fff", opacity: (selectedAreaIds.length === 0 || isTransferring) ? 0.6 : 1
                      }}>
                      {isTransferring ? <Loader2 size={14} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <ArrowRightLeft size={14} />} Transfer Areas
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ucr-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  {/* Source Areas */}
                  <div style={{ border: "1px solid #f3f4f6", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", height: 400 }}>
                    <div style={{ background: "#f9fafb", padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontSize: 11, fontWeight: 700, color: "#4b5563" }}>1. SOURCE AREAS</div>
                    <div style={{ flex: 1, overflowY: "auto" }}>
                      {fromAreas.map(area => (
                        <div key={area.id} onClick={() => handleSourceAreaClick(area.id)}
                          style={{
                            padding: "10px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f9fafb",
                            background: selectedFromAreaId === area.id ? "#eff6ff" : "transparent",
                            color: selectedFromAreaId === area.id ? "#2563eb" : "#4b5563",
                            fontWeight: selectedFromAreaId === area.id ? 700 : 400,
                            borderLeft: selectedFromAreaId === area.id ? "3px solid #2563eb" : "3px solid transparent"
                          }}>
                          {area.area_name || area.areaName || area.name || "—"}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Providers */}
                  <div style={{ border: "1px solid #f3f4f6", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", height: 400 }}>
                    <div style={{ background: "#eff6ff", padding: "10px 14px", borderBottom: "1px solid #dbeafe", fontSize: 11, fontWeight: 700, color: "#2563eb", display: "flex", justifyContent: "space-between" }}>
                      <span>2. SELECT {transferType.toUpperCase()}S</span>
                      {providers.length > 0 && <input type="checkbox" onChange={toggleAllProviders} checked={selectedProviderIds.length === providers.length} />}
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
                      {isLoadingProviders ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}><Loader2 className="animate-spin" /></div>
                      ) : providers.map(p => (
                        <div key={p.id} onClick={() => toggleProviderRow(p.id)}
                          style={{
                            padding: "10px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f9fafb", display: "flex", gap: 10,
                            background: selectedProviderIds.includes(p.id) ? "#f0fdf4" : "transparent"
                          }}>
                          <input type="checkbox" readOnly checked={selectedProviderIds.includes(p.id)} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.doctor_name || p.doctorName || p.chemist_name || p.chemistName || p.stockist_name || p.stockistName || p.name || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Destination */}
                  <div style={{ border: "1px solid #f3f4f6", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", height: 400 }}>
                    <div style={{ background: "#f9fafb", padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontSize: 11, fontWeight: 700, color: "#4b5563" }}>3. DESTINATION AREA</div>
                    <div style={{ flex: 1, overflowY: "auto" }}>
                      {toAreas.map(area => (
                        <div key={area.id} onClick={() => setSelectedToAreaId(area.id)}
                          style={{
                            padding: "10px 14px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: selectedToAreaId === area.id ? "#f0fdf4" : "transparent",
                            color: selectedToAreaId === area.id ? "#16a34a" : "#4b5563",
                            borderLeft: selectedToAreaId === area.id ? "3px solid #16a34a" : "3px solid transparent"
                          }}>
                          {area.area_name || area.areaName || area.name || "—"}
                          {selectedToAreaId === area.id && <Check size={14} />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {transferType !== "Area" && (
                <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={executeTransfer} disabled={selectedProviderIds.length === 0 || !selectedToAreaId || isTransferring}
                    className="ucr-submit-btn"
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 24px", borderRadius: 9,
                      fontSize: 13, fontWeight: 700, border: "none", background: "#2563eb", color: "#fff",
                      opacity: (selectedProviderIds.length === 0 || !selectedToAreaId || isTransferring) ? 0.6 : 1
                    }}>
                    {isTransferring ? <Loader2 size={14} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <ArrowRightLeft size={14} />} Complete Transfer
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Success Popup */}
      {popup.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 30, width: 300, textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 size={30} style={{ color: "#16a34a" }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 20 }}>{popup.message}</h3>
            <button onClick={() => setPopup({ isOpen: false, message: "" })} style={{ width: "100%", padding: "10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Reference Style Dropdowns ─────────────────────────────────────────── */
function FSelect({ label, name, value, onChange, disabled, options = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = options.find(o => String(o.id) === String(value));
  const hasVal = Boolean(value);
  const active = open || hasVal;
  const borderColor = (open || (hasVal && !disabled)) ? "#2563eb" : "#d1d5db";

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <div onClick={() => !disabled && setOpen(!open)}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 34px 0 12px", fontSize: 13, display: "flex", alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f9fafb" : "#fff",
          border: `1.5px solid ${disabled ? "#d1d5db" : borderColor}`, transition: "all 0.15s", boxSizing: "border-box",
        }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: hasVal ? (disabled ? "#9ca3af" : "#111827") : "transparent" }}>
          {selected?.label || " "}
        </span>
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: open ? "#2563eb" : "#9ca3af" }}>
          <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        </div>
      </div>
      <label style={{
        position: "absolute", left: 10, pointerEvents: "none", zIndex: 11, transition: "all 0.15s", fontWeight: 600, letterSpacing: "0.03em",
        top: active ? -9 : 10, fontSize: active ? 10 : 12, color: (open || (hasVal && !disabled)) ? "#2563eb" : "#9ca3af",
        background: active ? "#fff" : "transparent", padding: active ? "0 4px" : "0",
      }}>{label}</label>
      {open && !disabled && (
        <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, width: "100%", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
          <ul style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0", margin: 0, listStyle: "none" }}>
            {options.map(opt => (
              <li key={opt.id} onMouseDown={() => { onChange({ target: { name, value: String(opt.id) } }); setOpen(false); }}
                style={{
                  padding: "8px 12px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  background: String(value) === String(opt.id) ? "#eff6ff" : "transparent", color: String(value) === String(opt.id) ? "#2563eb" : "#374151", fontWeight: String(value) === String(opt.id) ? 600 : 400
                }}>{opt.label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({ label, options, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const hasVal = selectedIds.length > 0;
  const active = open || hasVal;
  const displayVal = hasVal ? options.filter(o => selectedIds.includes(o.id)).map(o => o.state_name).join(", ") : "";

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <div onClick={() => setOpen(!open)}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 34px 0 12px", fontSize: 13, display: "flex", alignItems: "center",
          cursor: "pointer", background: "#fff", border: `1.5px solid ${open || hasVal ? "#2563eb" : "#d1d5db"}`, transition: "all 0.15s", boxSizing: "border-box",
        }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: hasVal ? "#111827" : "transparent" }}>
          {displayVal}
        </span>
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: open ? "#2563eb" : "#9ca3af" }}>
          <MapPin size={14} />
        </div>
      </div>
      <label style={{
        position: "absolute", left: 10, pointerEvents: "none", zIndex: 11, transition: "all 0.15s", fontWeight: 600,
        top: active ? -9 : 10, fontSize: active ? 10 : 12, color: (open || hasVal) ? "#2563eb" : "#9ca3af",
        background: active ? "#fff" : "transparent", padding: active ? "0 4px" : "0",
      }}>{label}</label>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, width: "100%", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
            <button style={{ flex: 1, padding: "8px", fontSize: 11, fontWeight: 700, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }} onMouseDown={(e) => { e.preventDefault(); onChange(options.map(o => o.id)); }}>Select All</button>
            <button style={{ flex: 1, padding: "8px", fontSize: 11, fontWeight: 700, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }} onMouseDown={(e) => { e.preventDefault(); onChange([]); }}>Clear</button>
          </div>
          <ul style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0", margin: 0, listStyle: "none" }}>
            {options.map(opt => (
              <li key={opt.id} onMouseDown={(e) => { e.preventDefault(); onChange(selectedIds.includes(opt.id) ? selectedIds.filter(i => i !== opt.id) : [...selectedIds, opt.id]); }}
                style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={selectedIds.includes(opt.id)} readOnly />
                <span style={{ color: selectedIds.includes(opt.id) ? "#2563eb" : "#374151", fontWeight: selectedIds.includes(opt.id) ? 600 : 400 }}>{opt.state_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}