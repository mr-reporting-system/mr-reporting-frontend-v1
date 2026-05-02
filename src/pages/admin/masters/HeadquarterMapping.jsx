import React, { useState, useEffect, useRef } from "react";
import { Loader2, ArrowLeft, Trash2, Check, ChevronDown, MapPin, PlusCircle, Search } from "lucide-react";
import api from "../../../services/api";

/* ─── Global responsive styles ───────────────────────────────────────────── */
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }

  .hm-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; }
  .hm-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; }
  .hm-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  .hm-body  { padding:24px; }

  .hm-controls { display:flex; align-items:flex-end; gap:14px; margin-bottom:24px; flex-wrap:wrap; }
  .hm-controls-state { width:280px; flex-shrink:0; }
  .hm-controls-btns  { display:flex; gap:10px; flex-wrap:wrap; }

  .hm-panels { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .hm-create-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }

  @media(max-width:1024px){
    .hm-body           { padding:18px; }
    .hm-header         { padding:14px 18px; }
    .hm-controls-state { width:100%; }
    .hm-controls-btns  { width:100%; }
  }
  @media(max-width:700px){
    .hm-panels      { grid-template-columns:1fr; }
    .hm-create-grid { grid-template-columns:1fr; }
    .hm-body        { padding:14px; }
    .hm-header      { padding:12px 14px; }
    .hm-controls    { gap:10px; }
    .hm-controls-btns button { flex:1; justify-content:center; }
  }

  .hm-panel-box        { border:1.5px solid #e5e7eb; border-radius:12px; overflow:hidden; height:300px; background:#fff; }
  .hm-panel-box.mapped { border-color:#bfdbfe; }
  .hm-panel-scroll     { overflow-y:auto; height:100%; }

  .hm-table            { width:100%; border-collapse:collapse; font-size:12px; }
  .hm-table thead tr   { position:sticky; top:0; z-index:10; }
  .hm-table thead.avail-head  { background:#f9fafb; }
  .hm-table thead.mapped-head { background:#eff6ff; }
  .hm-table th         { padding:9px 12px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; border-bottom:1px solid #f3f4f6; }
  .hm-table th.th-avail  { color:#6b7280; }
  .hm-table th.th-mapped { color:#2563eb; }
  .hm-table td         { padding:9px 12px; color:#374151; border-bottom:1px solid #f9fafb; }
  .hm-table tbody tr:last-child td { border-bottom:none; }
  .hm-table tbody tr:hover         { background:#f9fafb; }
  .hm-table tbody tr.row-avail-sel  { background:#eff6ff !important; }
  .hm-table tbody tr.row-mapped-sel { background:#fef2f2 !important; }

  .hm-btn-primary { display:flex; align-items:center; gap:6px; padding:8px 18px; border-radius:9px; border:none; cursor:pointer; font-size:13px; font-weight:700; background:#2563eb; color:#fff; box-shadow:0 2px 8px rgba(37,99,235,0.2); transition:all 0.15s; white-space:nowrap; }
  .hm-btn-primary:hover:not(:disabled) { background:#1d4ed8; }
  .hm-btn-primary:disabled { opacity:0.55; cursor:not-allowed; }

  .hm-btn-outline { display:flex; align-items:center; gap:6px; padding:8px 18px; border-radius:9px; border:1.5px solid #d1d5db; cursor:pointer; font-size:13px; font-weight:700; background:#fff; color:#374151; transition:all 0.15s; white-space:nowrap; }
  .hm-btn-outline:hover { border-color:#2563eb; color:#2563eb; background:#eff6ff; }

  .hm-btn-map        { width:100%; padding:8px 0; border-radius:9px; border:none; cursor:pointer; font-size:13px; font-weight:700; transition:all 0.15s; }
  .hm-btn-map.do-map   { background:#2563eb; color:#fff; box-shadow:0 2px 8px rgba(37,99,235,0.2); }
  .hm-btn-map.do-unmap { background:#ef4444; color:#fff; box-shadow:0 2px 8px rgba(239,68,68,0.2); }
  .hm-btn-map.inactive { background:#f3f4f6; color:#9ca3af; cursor:not-allowed; }

  .hm-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px 16px; text-align:center; border:2px dashed #e5e7eb; border-radius:12px; background:#fafafa; }

  .hm-cb         { width:14px; height:14px; border-radius:4px; border:1.5px solid #d1d5db; background:#fff; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all 0.12s; }
  .hm-cb.on      { background:#2563eb; border-color:#2563eb; }

  @keyframes hm-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes hm-zoom { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
`;

const FH = 36;

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — all logic & API unchanged
═══════════════════════════════════════════════════════════════════════════ */
export default function HeadquarterMapping() {
  const [isLoading,      setIsLoading]      = useState(false);
  const [view,           setView]           = useState("mapping");
  const [error,          setError]          = useState("");
  const [popup,          setPopup]          = useState({ isOpen: false, message: "" });

  const [states,         setStates]         = useState([]);
  const [selectedState,  setSelectedState]  = useState("");

  const [unmappedDistricts, setUnmappedDistricts] = useState([]);
  const [mappedDistricts,   setMappedDistricts]   = useState([]);
  const [checkedUnmapped,   setCheckedUnmapped]   = useState([]);
  const [checkedMapped,     setCheckedMapped]     = useState([]);

  const [newDistrictName, setNewDistrictName] = useState("");
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  useEffect(() => { fetchStates(); }, []);

  const fetchStates = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/masters/states");
      if (response.data?.success) setStates(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch states", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetDistricts = async () => {
    if (!selectedState) return;
    setIsLoading(true); setError("");
    try {
      const [allRes, mappedRes] = await Promise.all([
        api.get(`/api/masters/districts/all?stateId=${selectedState}`),
        api.get(`/api/masters/districts?stateId=${selectedState}`)
      ]);
      const allDistricts = allRes.data?.data    || [];
      const activeMapped = mappedRes.data?.data || [];
      const mappedIds    = activeMapped.map(d => d.id);
      setMappedDistricts(activeMapped);
      setUnmappedDistricts(allDistricts.filter(d => !mappedIds.includes(d.id)));
      setCheckedUnmapped([]); setCheckedMapped([]);
    } catch (err) {
      setError("Failed to fetch district mapping data.");
    } finally {
      setIsLoading(false);
    }
  };

  const moveDistricts = async (direction) => {
    const isMapping   = direction === "right";
    const selectedIds = isMapping ? checkedUnmapped : checkedMapped;
    if (selectedIds.length === 0) return;
    setIsLoading(true); setError("");
    try {
      const response = await api.put("/api/masters/districts/status", {
        districtIds: selectedIds, isActive: isMapping
      });
      if (response.status === 200 || response.data?.success) {
        setPopup({ isOpen: true, message: isMapping ? "Districts Mapped Successfully" : "Removed Mapped Districts Successfully" });
        await handleGetDistricts();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update district status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDistrict = async () => {
    if (!selectedState || !newDistrictName) return;
    setIsSubmitting(true); setError("");
    try {
      const response = await api.post("/api/masters/districts", {
        stateId: parseInt(selectedState), districtName: newDistrictName
      });
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        setPopup({ isOpen: true, message: "District Created Successfully" });
        setNewDistrictName("");
        setView("mapping");
        await handleGetDistricts();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create district.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDistrict = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    setIsLoading(true); setError("");
    try {
      const response = await api.delete(`/api/masters/districts/${id}`);
      if (response.status === 200 || response.status === 204 || response.data?.success) {
        setPopup({ isOpen: true, message: "District Deleted Successfully" });
        await handleGetDistricts();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete district.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCheck = (id, listType) => {
    if (listType === "unmapped") {
      setCheckedUnmapped(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setCheckedMapped(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const toggleAll = (listType, e) => {
    if (listType === "unmapped") {
      setCheckedUnmapped(e.target.checked ? unmappedDistricts.map(d => d.id) : []);
    } else {
      setCheckedMapped(e.target.checked ? mappedDistricts.map(d => d.id) : []);
    }
  };

  const showPanels = unmappedDistricts.length > 0 || mappedDistricts.length > 0;

  return (
    <div className="hm-wrap">
      <style>{STYLES}</style>

      {error && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"10px 16px", color:"#dc2626", fontSize:13, fontWeight:600, marginBottom:16 }}>
          {error}
        </div>
      )}

      <div className="hm-card">

        {/* ── Header ── */}
        <div className="hm-header">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#eff6ff", border:"1px solid #dbeafe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <MapPin size={17} style={{ color:"#2563eb" }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:"#111827", margin:0 }}>
                {view === "mapping" ? "District Mapping" : "Headquarter Creation"}
              </h2>
              <p style={{ fontSize:11, color:"#6b7280", margin:0, marginTop:2 }}>
                {view === "mapping" ? "Map or unmap districts to a state" : "Create a new district entry"}
              </p>
            </div>
          </div>
          {view === "creation" && (
            <button className="hm-btn-outline" onClick={() => setView("mapping")} style={{ fontSize:12 }}>
              <ArrowLeft size={13}/> Back
            </button>
          )}
        </div>

        <div className="hm-body">

          {/* ══ MAPPING VIEW ══ */}
          {view === "mapping" && (
            <>
              {/* Controls */}
              <div className="hm-controls">
                <div className="hm-controls-state">
                  <FSelect
                    label="Select State *"
                    value={selectedState}
                    onChange={v => setSelectedState(v)}
                    options={states.map(s => ({ id: s.id, label: s.state_name }))}
                  />
                </div>
                <div className="hm-controls-btns">
                  <button className="hm-btn-primary" onClick={handleGetDistricts} disabled={!selectedState || isLoading}>
                    {isLoading
                      ? <Loader2 size={14} style={{ animation:"hm-spin 1s linear infinite" }}/>
                      : <Search size={14}/>}
                    Get Districts
                  </button>
                  <button className="hm-btn-outline" onClick={() => setView("creation")}>
                    <PlusCircle size={14}/> Create New
                  </button>
                </div>
              </div>

              {showPanels ? (
                <div className="hm-panels">

                  {/* Available */}
                  <div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em" }}>Available</span>
                      <span style={{ fontSize:11, background:"#f3f4f6", color:"#6b7280", padding:"2px 8px", borderRadius:20, fontWeight:600 }}>{unmappedDistricts.length}</span>
                    </div>
                    <div className="hm-panel-box">
                      <div className="hm-panel-scroll">
                        <table className="hm-table">
                          <thead className="avail-head">
                            <tr>
                              <th style={{ width:40, textAlign:"center" }}>
                                <input type="checkbox"
                                  onChange={(e) => toggleAll("unmapped", e)}
                                  checked={unmappedDistricts.length > 0 && checkedUnmapped.length === unmappedDistricts.length}
                                  style={{ width:14, height:14, accentColor:"#2563eb", cursor:"pointer" }}
                                />
                              </th>
                              <th className="th-avail">District Name</th>
                              <th style={{ width:36 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {unmappedDistricts.length === 0 ? (
                              <tr><td colSpan="3" style={{ textAlign:"center", padding:"24px 0", color:"#9ca3af", fontStyle:"italic" }}>No available districts.</td></tr>
                            ) : unmappedDistricts.map(d => (
                              <tr key={d.id} className={checkedUnmapped.includes(d.id) ? "row-avail-sel" : ""}>
                                <td style={{ textAlign:"center" }}>
                                  <input type="checkbox"
                                    checked={checkedUnmapped.includes(d.id)}
                                    onChange={() => toggleCheck(d.id, "unmapped")}
                                    style={{ width:14, height:14, accentColor:"#2563eb", cursor:"pointer" }}
                                  />
                                </td>
                                <td style={{ fontWeight: checkedUnmapped.includes(d.id) ? 600 : 400 }}>
                                  {d.districtName || d.district_name || d.name}
                                </td>
                                <td style={{ textAlign:"center" }}>
                                  <button
                                    onClick={() => handleDeleteDistrict(d.id, d.districtName || d.district_name || d.name)}
                                    style={{ border:"none", background:"none", cursor:"pointer", color:"#d1d5db", padding:"3px", borderRadius:5, display:"inline-flex", alignItems:"center", transition:"color 0.15s" }}
                                    onMouseEnter={e => e.currentTarget.style.color="#ef4444"}
                                    onMouseLeave={e => e.currentTarget.style.color="#d1d5db"}
                                  >
                                    <Trash2 size={14}/>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div style={{ marginTop:10 }}>
                      <button
                        className={`hm-btn-map ${checkedUnmapped.length > 0 ? "do-map" : "inactive"}`}
                        onClick={() => moveDistricts("right")}
                        disabled={checkedUnmapped.length === 0}
                      >
                        Map Selected ({checkedUnmapped.length})
                      </button>
                    </div>
                  </div>

                  {/* Mapped */}
                  <div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:"#2563eb", textTransform:"uppercase", letterSpacing:"0.06em" }}>Mapped</span>
                      <span style={{ fontSize:11, background:"#eff6ff", color:"#2563eb", padding:"2px 8px", borderRadius:20, fontWeight:600 }}>{mappedDistricts.length}</span>
                    </div>
                    <div className="hm-panel-box mapped">
                      <div className="hm-panel-scroll">
                        <table className="hm-table">
                          <thead className="mapped-head">
                            <tr>
                              <th style={{ width:40, textAlign:"center" }}>
                                <input type="checkbox"
                                  onChange={(e) => toggleAll("mapped", e)}
                                  checked={mappedDistricts.length > 0 && checkedMapped.length === mappedDistricts.length}
                                  style={{ width:14, height:14, accentColor:"#2563eb", cursor:"pointer" }}
                                />
                              </th>
                              <th className="th-mapped">District Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mappedDistricts.length === 0 ? (
                              <tr><td colSpan="2" style={{ textAlign:"center", padding:"24px 0", color:"#9ca3af", fontStyle:"italic" }}>No mapped districts.</td></tr>
                            ) : mappedDistricts.map(d => (
                              <tr key={d.id} className={checkedMapped.includes(d.id) ? "row-mapped-sel" : ""}>
                                <td style={{ textAlign:"center" }}>
                                  <input type="checkbox"
                                    checked={checkedMapped.includes(d.id)}
                                    onChange={() => toggleCheck(d.id, "mapped")}
                                    style={{ width:14, height:14, accentColor:"#2563eb", cursor:"pointer" }}
                                  />
                                </td>
                                <td style={{ fontWeight: checkedMapped.includes(d.id) ? 600 : 400 }}>
                                  {d.districtName || d.district_name || d.name}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div style={{ marginTop:10 }}>
                      <button
                        className={`hm-btn-map ${checkedMapped.length > 0 ? "do-unmap" : "inactive"}`}
                        onClick={() => moveDistricts("left")}
                        disabled={checkedMapped.length === 0}
                      >
                        Unmap Selected ({checkedMapped.length})
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="hm-empty">
                  <div style={{ width:52, height:52, borderRadius:"50%", background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                    <MapPin size={24} style={{ color:"#d1d5db" }}/>
                  </div>
                  <p style={{ fontSize:13, color:"#6b7280", margin:0 }}>Select a state and click "Get Districts" to begin.</p>
                </div>
              )}
            </>
          )}

          {/* ══ CREATION VIEW ══ */}
          {view === "creation" && (
            <div style={{ maxWidth:600, margin:"0 auto", paddingTop:8 }}>
              <div className="hm-create-grid">
                <FSelect
                  label="Select State *"
                  value={selectedState}
                  onChange={v => setSelectedState(v)}
                  options={states.map(s => ({ id: s.id, label: s.state_name }))}
                />
                <FInput
                  label="District Name *"
                  value={newDistrictName}
                  onChange={e => setNewDistrictName(e.target.value)}
                />
              </div>
              <div style={{ borderTop:"1px solid #f3f4f6", paddingTop:16, display:"flex", justifyContent:"flex-end" }}>
                <button
                  onClick={handleCreateDistrict}
                  disabled={!selectedState || !newDistrictName || isSubmitting}
                  className="hm-btn-primary"
                  style={{ padding:"8px 32px" }}
                >
                  {isSubmitting
                    ? <Loader2 size={14} style={{ animation:"hm-spin 1s linear infinite" }}/>
                    : <Check size={14}/>}
                  Create District
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Success Popup ── */}
      {popup.isOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.4)", backdropFilter:"blur(3px)", padding:16 }}>
          <div style={{ background:"#fff", borderRadius:16, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", padding:"32px 28px", maxWidth:320, width:"100%", display:"flex", flexDirection:"column", alignItems:"center", animation:"hm-zoom 0.2s ease" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"#eff6ff", border:"4px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
              <Check size={30} style={{ color:"#2563eb", strokeWidth:3 }}/>
            </div>
            <h3 style={{ fontSize:15, fontWeight:700, color:"#111827", textAlign:"center", margin:"0 0 20px" }}>{popup.message}</h3>
            <button
              onClick={() => setPopup({ isOpen: false, message: "" })}
              style={{ background:"#2563eb", color:"#fff", border:"none", borderRadius:10, padding:"10px 0", width:"100%", fontSize:14, fontWeight:700, cursor:"pointer", transition:"background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background="#1d4ed8"}
              onMouseLeave={e => e.currentTarget.style.background="#2563eb"}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Text Input ─────────────────────────────────────────────────────────── */
function FInput({ label, value, onChange, required, disabled }) {
  const [focus, setFocus] = useState(false);
  const hasVal      = Boolean(value?.toString().trim());
  const active      = focus || hasVal;
  const filled      = hasVal && !disabled;
  const borderColor = (focus || filled) ? "#2563eb" : "#d1d5db";
  const boxShadow   = focus && !disabled ? "0 0 0 3px rgba(37,99,235,0.08)" : "none";

  return (
    <div style={{ position:"relative", width:"100%", height:FH }}>
      <input
        type="text" value={value||""} onChange={onChange}
        required={required} disabled={disabled}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        placeholder=" "
        style={{
          width:"100%", height:"100%", borderRadius:8, padding:"0 12px",
          fontSize:13, color:"#111827", outline:"none", boxSizing:"border-box",
          fontWeight: hasVal ? 600 : 400,
          background: disabled ? "#f9fafb" : "#fff",
          border: `1.5px solid ${disabled ? "#d1d5db" : borderColor}`,
          boxShadow: disabled ? "none" : boxShadow,
          transition:"all 0.15s",
        }}
      />
      <label style={{
        position:"absolute", left:10, pointerEvents:"none", zIndex:10,
        transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
        top: active ? -9 : 10,
        fontSize: active ? 10 : 12,
        color: (focus || filled) ? "#2563eb" : "#9ca3af",
        background: active ? "#fff" : "transparent",
        padding: active ? "0 4px" : "0",
      }}>
        {label}
      </label>
    </div>
  );
}

/* ─── Select ─────────────────────────────────────────────────────────────── */
function FSelect({ label, value, onChange, disabled, options = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected    = options.find(o => String(o.id) === String(value));
  const hasVal      = Boolean(value);
  const active      = open || hasVal;
  const filled      = hasVal && !disabled;
  const borderColor = (open || filled) ? "#2563eb" : "#d1d5db";
  const boxShadow   = open && !disabled ? "0 0 0 3px rgba(37,99,235,0.08)" : "none";

  const handleSelect = (optId) => {
    onChange(String(optId));
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position:"relative", width:"100%", userSelect:"none", zIndex: open ? 100 : 1 }}>
      <div
        onClick={() => { if (!disabled) setOpen(!open); }}
        style={{
          width:"100%", height:FH, borderRadius:8, padding:"0 34px 0 12px",
          fontSize:13, display:"flex", alignItems:"center",
          cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? "#f9fafb" : "#fff",
          border: `1.5px solid ${disabled ? "#d1d5db" : borderColor}`,
          boxShadow: disabled ? "none" : boxShadow,
          transition:"all 0.15s", boxSizing:"border-box",
        }}
      >
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight: hasVal ? 600 : 400, color: hasVal ? (disabled ? "#9ca3af" : "#111827") : "transparent" }}>
          {selected?.label || " "}
        </span>
        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color: open ? "#2563eb" : "#9ca3af" }}>
          <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition:"transform 0.2s" }}/>
        </div>
      </div>

      <label style={{
        position:"absolute", left:10, pointerEvents:"none", zIndex:11,
        transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
        top: active ? -9 : 10,
        fontSize: active ? 10 : 12,
        color: (open || filled) ? "#2563eb" : "#9ca3af",
        background: active ? "#fff" : "transparent",
        padding: active ? "0 4px" : "0",
      }}>
        {label}
      </label>

      {open && !disabled && (
        <div style={{
          position:"absolute", top:"calc(100% + 5px)", left:0, width:"100%",
          background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:10,
          boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:200, overflow:"hidden",
        }}>
          <ul style={{ maxHeight:200, overflowY:"auto", padding:"4px 0", margin:0, listStyle:"none" }}>
            {options.length === 0 && (
              <li style={{ padding:"10px 12px", fontSize:12, color:"#9ca3af", fontStyle:"italic" }}>No options</li>
            )}
            {options.map(opt => (
              <li key={opt.id}
                onMouseDown={e => { e.preventDefault(); handleSelect(opt.id); }}
                style={{
                  padding:"8px 12px", fontSize:13, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:8,
                  background: String(value) === String(opt.id) ? "#eff6ff" : "transparent",
                  color:      String(value) === String(opt.id) ? "#2563eb" : "#374151",
                  fontWeight: String(value) === String(opt.id) ? 600 : 400,
                  transition:"background 0.1s",
                }}
                onMouseEnter={e => { if (String(value) !== String(opt.id)) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={e => { if (String(value) !== String(opt.id)) e.currentTarget.style.background = "transparent"; }}
              >
                {String(value) === String(opt.id) && <Check size={12} style={{ color:"#2563eb", flexShrink:0 }}/>}
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}