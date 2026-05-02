import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, Save, CheckCircle2,
  ChevronDown, Check, MapPin, Users, Briefcase, Map
} from "lucide-react";
import api from "../../../services/api";

/* ─── Global responsive styles from reference ────────────────────────────── */
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }

  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:flex-end; border-radius:0 0 16px 16px; }
  .ucr-divider{ border:none; border-top:1px solid #f3f4f6; margin:0 0 24px; }

  /* 4 cols desktop */
  .ucr-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:28px; }

  /* 2 cols tablet */
  @media(max-width:1024px){
    .ucr-grid  { grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:20px; }
    .ucr-body  { padding:18px; }
    .ucr-footer{ padding:12px 18px; }
    .ucr-header{ padding:14px 18px; }
  }

  /* 1 col mobile */
  @media(max-width:600px){
    .ucr-grid  { grid-template-columns:1fr; gap:12px; margin-bottom:16px; }
    .ucr-body  { padding:14px; }
    .ucr-footer{ padding:12px 14px; }
    .ucr-header{ padding:12px 14px; }
    .ucr-submit-btn{ width:100%; justify-content:center; }
  }

  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const FH = 36;

export default function ChangeHeadquarter() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Dropdown Lists
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    designationId: "",
    employeeId: "",
    stateId: "",
    districtId: ""
  });

  // ─── 1. INITIAL DATA FETCH ──────────────────────────────────────────
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [desigRes, statesRes] = await Promise.all([
        api.get('/api/masters/designations').catch(() => ({ data: { success: false }})),
        api.get('/api/masters/states').catch(() => ({ data: { success: false }}))
      ]);
      
      if (desigRes.data?.success) setDesignations(desigRes.data.data || []);
      if (statesRes.data?.success) setStates(statesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
      setError("Failed to load dropdown data.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 2. CASCADING FETCH: Designation -> Employees ───────────────────
  useEffect(() => {
    if (formData.designationId) {
      fetchEmployeesByDesignation(formData.designationId);
    } else {
      setEmployees([]);
      setFormData(prev => ({ ...prev, employeeId: "" }));
    }
  }, [formData.designationId]);

  const fetchEmployeesByDesignation = async (designationId) => {
    try {
      const response = await api.get(`/api/masters/employees/designation/${designationId}`);
      if (response.data?.success) setEmployees(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch employees", err);
      setEmployees([]);
    }
  };

  // ─── 3. CASCADING FETCH: State -> Districts ─────────────────────────
  useEffect(() => {
    if (formData.stateId) {
      fetchDistrictsByState(formData.stateId);
    } else {
      setDistricts([]);
      setFormData(prev => ({ ...prev, districtId: "" }));
    }
  }, [formData.stateId]);

  const fetchDistrictsByState = async (stateId) => {
    try {
      const response = await api.get(`/api/masters/districts?stateId=${stateId}`);
      if (response.data?.success) setDistricts(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch districts", err);
      setDistricts([]);
    }
  };

  // ─── 4. HANDLERS ────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    
    if (!formData.employeeId || !formData.stateId || !formData.districtId) {
      setError("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      employeeId: parseInt(formData.employeeId),
      stateId: parseInt(formData.stateId),
      districtId: parseInt(formData.districtId)
    };

    try {
      const response = await api.put('/api/masters/employees/change-hq', payload);
      if (response.status === 200 || response.data?.success) {
        setSuccessMsg("Headquarter Changed Successfully");
        setFormData({ designationId: "", employeeId: "", stateId: "", districtId: "" });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change headquarter.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>

      {successMsg && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, color: "#1d4ed8", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MapPin size={17} style={{ color: "#2563eb" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Change Headquarter</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>Update the primary work location for an employee</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ucr-body">
            <SectionLabel text="Relocation Details" />
            <div className="ucr-grid">
              <FSelect
                label="Select Designation"
                name="designationId"
                value={formData.designationId}
                onChange={handleInputChange}
                options={designations.map(d => ({ id: d.id, label: d.designation_name || d.name }))}
              />
              <FSelect
                label="Select Employee *"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                required
                disabled={!formData.designationId}
                options={employees.map(e => ({ id: e.id, label: e.name || e.employee_name }))}
              />
              <FSelect
                label="Select State *"
                name="stateId"
                value={formData.stateId}
                onChange={handleInputChange}
                required
                options={states.map(s => ({ id: s.id, label: s.state_name }))}
              />
              <FSelect
                label="Select District *"
                name="districtId"
                value={formData.districtId}
                onChange={handleInputChange}
                required
                disabled={!formData.stateId}
                options={districts.map(d => ({ id: d.id, label: d.district_name || d.name }))}
              />
            </div>
          </div>

          <div className="ucr-footer">
            <button
              type="submit"
              disabled={!formData.employeeId || !formData.stateId || !formData.districtId || isSubmitting}
              className="ucr-submit-btn"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 24px", borderRadius: 9,
                fontSize: 13, fontWeight: 700, border: "none",
                cursor: (isSubmitting || !formData.employeeId) ? "not-allowed" : "pointer",
                background: "#2563eb", color: "#fff",
                boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                opacity: (isSubmitting || !formData.employeeId) ? 0.6 : 1, transition: "all 0.15s",
              }}
            >
              {isSubmitting
                ? <Loader2 size={14} style={{ animation: "ucr-spin 1s linear infinite" }} />
                : <Save size={14} />}
              Update HQ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Shared Components from Reference ───────────────────────────────────── */
function SectionLabel({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
    </div>
  );
}

function FSelect({ label, name, value, onChange, required, disabled, options = [] }) {
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
  const filled = hasVal && !disabled;
  const borderColor = (open || filled) ? "#2563eb" : "#d1d5db";
  const boxShadow = open && !disabled ? "0 0 0 3px rgba(37,99,235,0.08)" : "none";

  const handleSelect = (optId) => {
    onChange({ target: { name, value: String(optId) } });
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", userSelect: "none", zIndex: open ? 100 : 1 }}>
      <div
        onClick={() => { if (!disabled) setOpen(!open); }}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 34px 0 12px",
          fontSize: 13, display: "flex", alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? "#f9fafb" : "#fff",
          border: `1.5px solid ${disabled ? "#d1d5db" : borderColor}`,
          boxShadow: disabled ? "none" : boxShadow,
          transition: "all 0.15s", boxSizing: "border-box",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: hasVal ? (disabled ? "#9ca3af" : "#111827") : "transparent" }}>
          {selected?.label || " "}
        </span>
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: open ? "#2563eb" : "#9ca3af" }}>
          <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
        </div>
      </div>

      <label style={{
        position: "absolute", left: 10, pointerEvents: "none", zIndex: 11,
        transition: "all 0.15s", fontWeight: 600, letterSpacing: "0.03em",
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
          position: "absolute", top: "calc(100% + 5px)", left: 0, width: "100%",
          background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden",
        }}>
          <ul style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0", margin: 0, listStyle: "none" }}>
            {options.length === 0 && <li style={{ padding: "10px 12px", fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No options</li>}
            {options.map(opt => (
              <li key={opt.id}
                onMouseDown={e => { e.preventDefault(); handleSelect(opt.id); }}
                style={{
                  padding: "8px 12px", fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  background: String(value) === String(opt.id) ? "#eff6ff" : "transparent",
                  color: String(value) === String(opt.id) ? "#2563eb" : "#374151",
                  fontWeight: String(value) === String(opt.id) ? 600 : 400,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (String(value) !== String(opt.id)) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={e => { if (String(value) !== String(opt.id)) e.currentTarget.style.background = "transparent"; }}
              >
                {String(value) === String(opt.id) && <Check size={12} style={{ color: "#2563eb", flexShrink: 0 }} />}
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}