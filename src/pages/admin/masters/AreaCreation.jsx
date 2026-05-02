import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, MapPin, Map, User, Navigation, Hash, Layers, Save,
  CheckCircle2, Edit2, Trash2, MapPinned, ChevronDown, Check
} from "lucide-react";
import api from "../../../services/api";

/* ─── Global responsive styles ───────────────────────────────────────────── */
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }

  .ac-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; }
  .ac-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; margin-bottom:20px; }
  .ac-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .ac-body  { padding:24px; }
  .ac-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:flex-end; border-radius:0 0 16px 16px; }

  /* 4 cols desktop */
  .ac-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:20px; }

  /* 2 cols tablet */
  @media(max-width:1024px){
    .ac-grid  { grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:16px; }
    .ac-body  { padding:18px; }
    .ac-footer{ padding:12px 18px; }
    .ac-header{ padding:14px 18px; }
  }

  /* 1 col mobile */
  @media(max-width:600px){
    .ac-grid  { grid-template-columns:1fr; gap:12px; margin-bottom:14px; }
    .ac-body  { padding:14px; }
    .ac-footer{ padding:12px 14px; }
    .ac-header{ padding:12px 14px; }
    .ac-submit-btn{ width:100%; justify-content:center; }
  }

  /* Table responsive */
  .ac-table-wrap { overflow-x:auto; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
  .ac-table      { width:100%; text-align:left; border-collapse:collapse; min-width:900px; font-size:13px; }
  .ac-table thead tr { background:#2563eb; }
  .ac-table thead th { padding:10px 14px; color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; border-right:1px solid rgba(255,255,255,0.15); white-space:nowrap; }
  .ac-table thead th:last-child { border-right:none; }
  .ac-table tbody tr { border-bottom:1px solid #f3f4f6; transition:background 0.15s; }
  .ac-table tbody tr:last-child { border-bottom:none; }
  .ac-table tbody tr:hover { background:#f0f7ff; }
  .ac-table tbody tr.ac-editing { background:#eff6ff; }
  .ac-table tbody td { padding:10px 14px; color:#374151; vertical-align:middle; }

  @keyframes ac-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

/* shared input height */
const FH = 36;

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function AreaCreation() {
  const [isLoading,    setIsLoading]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");
  const [editingId,    setEditingId]    = useState(null);

  const [states,    setStates]    = useState([]);
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [areas,     setAreas]     = useState([]);

  const [formData, setFormData] = useState({
    stateId: "", districtId: "", employeeId: "",
    areaName: "", areaCode: "", areaType: ""
  });

  // 1. Initial Load
  useEffect(() => { fetchInitialData(); }, []);

  // 2. Fetch Districts when State changes
  useEffect(() => {
    if (formData.stateId) fetchDistrictsByState(formData.stateId);
    else { setDistricts([]); setEmployees([]); }
  }, [formData.stateId]);

  // 3. Fetch Employees when both State AND District selected
  useEffect(() => {
    if (formData.stateId && formData.districtId) fetchFilteredEmployees(formData.stateId, formData.districtId);
    else setEmployees([]);
  }, [formData.stateId, formData.districtId]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [statesRes, areasRes] = await Promise.all([
        api.get('/api/masters/states'),
        api.get('/api/masters/areas')
      ]);
      if (statesRes.data?.success) setStates(statesRes.data.data);
      if (areasRes.data?.success)  setAreas(areasRes.data.data);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistrictsByState = async (stateId) => {
    try {
      const response = await api.get(`/api/masters/districts?stateId=${stateId}`);
      if (response.data?.success) setDistricts(response.data.data);
    } catch (err) {
      console.error("Failed to fetch districts", err);
      setDistricts([]);
    }
  };

  const fetchFilteredEmployees = async (stateId, districtId) => {
    try {
      const response = await api.get(`/api/masters/employees/filter?stateId=${stateId}&districtId=${districtId}`);
      if (response.data?.success) setEmployees(response.data.data);
    } catch (err) {
      console.error("Failed to fetch filtered employees", err);
      setEmployees([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === "areaCode" ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleStateChange = (e) => {
    setFormData(prev => ({ ...prev, stateId: e.target.value, districtId: "", employeeId: "" }));
  };

  const handleDistrictChange = (e) => {
    setFormData(prev => ({ ...prev, districtId: e.target.value, employeeId: "" }));
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setFormData({
      stateId:    item.stateId    || item.state?.id    || item.state_id    || "",
      districtId: item.districtId || item.district?.id || item.district_id || "",
      employeeId: item.employeeId || item.employee?.id || item.employee_id || "",
      areaName:   item.areaName   || item.area_name    || "",
      areaCode:   item.areaCode   || item.area_code    || "",
      areaType:   item.areaType   || item.area_type    || item.type        || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this area?")) return;
    setError(""); setSuccessMsg("");
    try {
      const response = await api.delete(`/api/masters/areas/${id}`);
      if (response.status === 200 || response.status === 204 || response.data?.success) {
        setSuccessMsg("Area deleted successfully!");
        fetchInitialData();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete area.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    setIsSubmitting(true);
    const payload = {
      stateId:    parseInt(formData.stateId),
      districtId: parseInt(formData.districtId),
      employeeId: parseInt(formData.employeeId),
      areaName:   formData.areaName,
      areaCode:   formData.areaCode || null,
      areaType:   formData.areaType
    };
    try {
      let response;
      if (editingId) {
        response = await api.put(`/api/masters/areas/${editingId}`, payload);
      } else {
        response = await api.post('/api/masters/areas', payload);
      }
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        setSuccessMsg(editingId ? "Area updated successfully!" : "Area created successfully!");
        setFormData({ stateId: "", districtId: "", employeeId: "", areaName: "", areaCode: "", areaType: "" });
        setEditingId(null);
        fetchInitialData();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save area.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAreas = areas.filter(item => {
    const sId = item.stateId    || item.state_id    || item.state?.id;
    const dId = item.districtId || item.district_id || item.district?.id;
    const eId = item.employeeId || item.employee_id || item.employee?.id;
    return sId?.toString() === formData.stateId?.toString() &&
           dId?.toString() === formData.districtId?.toString() &&
           eId?.toString() === formData.employeeId?.toString();
  });

  const selectedStateName    = states.find(s    => s.id?.toString() === formData.stateId)?.state_name       || "N/A";
  const selectedDistrictName = districts.find(d => d.id?.toString() === formData.districtId)?.district_name || "N/A";
  const selectedEmployeeName = employees.find(e => e.id?.toString() === formData.employeeId)?.name           || "N/A";

  return (
    <div className="ac-wrap">
      <style>{STYLES}</style>

      {/* ── Banners ── */}
      {successMsg && (
        <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:12, padding:"10px 16px", display:"flex", alignItems:"center", gap:10, color:"#1d4ed8", fontSize:13, fontWeight:600, marginBottom:16 }}>
          <CheckCircle2 size={18}/> {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"10px 16px", color:"#dc2626", fontSize:13, fontWeight:600, marginBottom:16 }}>
          {error}
        </div>
      )}

      {/* ── Form Card ── */}
      <div className="ac-card">
        {/* Header */}
        <div className="ac-header">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#eff6ff", border:"1px solid #dbeafe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <MapPinned size={17} style={{ color:"#2563eb" }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:"#111827", margin:0 }}>
                {editingId ? "Edit Employee Area" : "Employee Area Creation"}
              </h2>
              <p style={{ fontSize:11, color:"#6b7280", margin:0, marginTop:2 }}>
                {editingId ? "Update the area details below" : "Fill in the details to create a new area"}
              </p>
            </div>
          </div>
          {editingId && (
            <button
              onClick={() => { setEditingId(null); setFormData({ stateId:"", districtId:"", employeeId:"", areaName:"", areaCode:"", areaType:"" }); }}
              style={{ fontSize:12, fontWeight:600, color:"#6b7280", background:"none", border:"1px solid #e5e7eb", borderRadius:8, padding:"5px 12px", cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap" }}
              onMouseEnter={e => { e.currentTarget.style.color="#ef4444"; e.currentTarget.style.borderColor="#fca5a5"; }}
              onMouseLeave={e => { e.currentTarget.style.color="#6b7280"; e.currentTarget.style.borderColor="#e5e7eb"; }}
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="ac-body">

            {/* Row 1: State, District, Employee, Area Name */}
            <div className="ac-grid">
              <FSelect
                label="Select State *" name="stateId" value={formData.stateId}
                onChange={handleStateChange} required
                options={states.map(s => ({ id: s.id, label: s.state_name }))}
              />
              <FSelect
                label="Select District *" name="districtId" value={formData.districtId}
                onChange={handleDistrictChange} required disabled={!formData.stateId}
                options={districts.map(d => ({ id: d.id, label: d.district_name }))}
              />
              <FSelect
                label="Select Employee *" name="employeeId" value={formData.employeeId}
                onChange={handleInputChange} required disabled={!formData.districtId}
                options={employees.map(e => ({ id: e.id, label: e.name }))}
              />
              <FInput
                label="Area Name *" name="areaName" value={formData.areaName}
                onChange={handleInputChange} required
              />
            </div>

            {/* Row 2: Area Code, Area Type, Submit */}
            <div className="ac-grid">
              <FInput
                label="Area Code" name="areaCode" value={formData.areaCode}
                onChange={handleInputChange}
              />
              <FSelect
                label="Area Type *" name="areaType" value={formData.areaType}
                onChange={handleInputChange} required
                options={[
                  { id:"HQ", label:"HQ (Headquarter)" },
                  { id:"EX", label:"EX (Ex-Station)"  },
                ]}
              />
              {/* empty slot to keep alignment */}
              <div/>
              <div style={{ display:"flex", alignItems:"center" }}>
                <button type="submit" disabled={isSubmitting} className="ac-submit-btn"
                  style={{
                    display:"flex", alignItems:"center", gap:6,
                    padding:"8px 24px", borderRadius:9, width:"100%", justifyContent:"center",
                    fontSize:13, fontWeight:700, border:"none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    background:"#2563eb", color:"#fff",
                    boxShadow:"0 2px 8px rgba(37,99,235,0.25)",
                    opacity: isSubmitting ? 0.6 : 1, transition:"all 0.15s",
                  }}
                >
                  {isSubmitting
                    ? <Loader2 size={14} style={{ animation:"ac-spin 1s linear infinite" }}/>
                    : editingId ? <Edit2 size={14}/> : <Save size={14}/>}
                  {editingId ? "Update Area" : "Create Area"}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>

      {/* ── Table Card ── */}
      {formData.stateId && formData.districtId && formData.employeeId && (
        <div className="ac-card">
          {/* Table Header */}
          <div className="ac-header">
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"#eff6ff", border:"1px solid #dbeafe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <MapPinned size={17} style={{ color:"#2563eb" }}/>
              </div>
              <div>
                <h2 style={{ fontSize:15, fontWeight:700, color:"#111827", margin:0 }}>Employee Area List</h2>
                <p style={{ fontSize:11, color:"#6b7280", margin:0, marginTop:2 }}>Areas assigned to the selected employee</p>
              </div>
            </div>
            {filteredAreas.length > 0 && (
              <span style={{ fontSize:12, fontWeight:700, color:"#2563eb", background:"#eff6ff", border:"1px solid #bfdbfe", padding:"3px 10px", borderRadius:20 }}>
                {filteredAreas.length} area{filteredAreas.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="ac-body">
            {isLoading ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 0", color:"#2563eb" }}>
                <Loader2 size={36} style={{ animation:"ac-spin 1s linear infinite", marginBottom:12 }}/>
                <p style={{ fontSize:13, color:"#6b7280", margin:0 }}>Loading areas...</p>
              </div>
            ) : filteredAreas.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 16px", textAlign:"center", border:"2px dashed #e5e7eb", borderRadius:12, background:"#fafafa" }}>
                <div style={{ width:56, height:56, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.08)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                  <MapPinned size={26} style={{ color:"#9ca3af" }}/>
                </div>
                <p style={{ fontSize:14, fontWeight:600, color:"#374151", margin:0, marginBottom:4 }}>No Areas Found</p>
                <p style={{ fontSize:13, color:"#9ca3af", margin:0 }}>There are no areas assigned to this employee yet.</p>
              </div>
            ) : (
              <div className="ac-table-wrap">
                <table className="ac-table">
                  <thead>
                    <tr>
                      {["State Name","Headquarter Name","Employee Name","Area Name","Type","Status","Total Doctor","Total Chemist","Total Stockist","Edit","Delete"].map((h, i) => (
                        <th key={i} style={{ textAlign: i >= 4 ? "center" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAreas.map(item => (
                      <tr key={item.id} className={editingId === item.id ? "ac-editing" : ""}>
                        <td>{selectedStateName}</td>
                        <td>{selectedDistrictName}</td>
                        <td>{selectedEmployeeName}</td>
                        <td style={{ fontWeight:700, color:"#111827" }}>{item.areaName || item.area_name}</td>
                        <td style={{ textAlign:"center" }}>
                          <span style={{ background:"#f3f4f6", color:"#374151", padding:"2px 8px", borderRadius:5, fontSize:11, fontWeight:700 }}>
                            {item.areaType || item.area_type || item.type}
                          </span>
                        </td>
                        <td style={{ textAlign:"center", color:"#6b7280" }}>{item.status?.toString() || 'true'}</td>
                        <td style={{ textAlign:"center", fontWeight:600 }}>{item.totalDoctor    || item.total_doctor    || 0}</td>
                        <td style={{ textAlign:"center", fontWeight:600 }}>{item.totalChemist   || item.total_chemist   || 0}</td>
                        <td style={{ textAlign:"center", fontWeight:600 }}>{item.totalStockist  || item.total_stockist  || 0}</td>
                        <td style={{ textAlign:"center" }}>
                          <button onClick={() => handleEditClick(item)}
                            style={{ padding:"5px 7px", borderRadius:8, border:"none", background:"transparent", cursor:"pointer", color:"#2563eb", transition:"background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background="#eff6ff"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}
                          >
                            <Edit2 size={15}/>
                          </button>
                        </td>
                        <td style={{ textAlign:"center" }}>
                          <button onClick={() => handleDeleteClick(item.id)}
                            style={{ padding:"5px 7px", borderRadius:8, border:"none", background:"transparent", cursor:"pointer", color:"#ef4444", transition:"background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background="#fef2f2"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}
                          >
                            <Trash2 size={15}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Text Input ─────────────────────────────────────────────────────────── */
function FInput({ label, name, type="text", value, onChange, required, disabled }) {
  const [focus, setFocus] = useState(false);
  const hasVal  = Boolean(value?.toString().trim());
  const active  = focus || hasVal;
  const filled  = hasVal && !disabled;
  const borderColor = (focus || filled) ? "#2563eb" : "#d1d5db";
  const boxShadow   = focus && !disabled ? "0 0 0 3px rgba(37,99,235,0.08)" : "none";

  return (
    <div style={{ position:"relative", width:"100%", height:FH }}>
      <input
        type={type} id={name} name={name} value={value||""} onChange={onChange}
        required={required} disabled={disabled}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        placeholder=" "
        style={{
          width:"100%", height:"100%", borderRadius:8, padding:"0 12px",
          fontSize:13, color:"#111827", outline:"none", boxSizing:"border-box",
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
function FSelect({ label, name, value, onChange, required, disabled, options=[] }) {
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
    onChange({ target: { name, value: String(optId) } });
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
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600, color: hasVal ? (disabled ? "#9ca3af" : "#111827") : "transparent" }}>
          {selected?.label || " "}
        </span>
        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color: open ? "#2563eb" : "#9ca3af" }}>
          <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition:"transform 0.2s" }}/>
        </div>
      </div>

      {/* Floating label */}
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