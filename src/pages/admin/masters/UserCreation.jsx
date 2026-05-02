import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, Users, Save, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, Calendar, Eye, EyeOff, Check
} from "lucide-react";
import api from "../../../services/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

/* ─── Global responsive styles ───────────────────────────────────────────── */
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

  .ucr-gender-row{ display:flex; align-items:center; gap:20px; flex-wrap:wrap; margin-bottom:24px; }

  /* Calendar popup — smaller on mobile */
  .ucr-cal {
    position:absolute; top:calc(100% + 6px); left:0;
    width:260px; background:#fff; border-radius:14px;
    border:1.5px solid #e5e7eb;
    box-shadow:0 12px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06);
    z-index:9999; overflow:hidden;
  }
  @media(max-width:600px){
    .ucr-cal { width:220px; left:50%; transform:translateX(-50%); }
  }

  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

/* shared input height — slightly smaller */
const FH = 36;

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function UserCreation() {
  const [isLoading,    setIsLoading]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");

  const [states,       setStates]       = useState([]);
  const [districts,    setDistricts]    = useState([]);
  const [designations, setDesignations] = useState([]);
  const [managers,     setManagers]     = useState([]);

  const [formData, setFormData] = useState({
    name:"", mobile:"", email:"", dob:"", gender:"", religion:"",
    aadhar:"", pan:"", address:"", stateId:"", districtId:"", bankName:"",
    bankAccountNumber:"", ifscCode:"", designationId:"", reportingManagerId:"",
    dateOfJoining:"", dateOfReporting:"", dateOfConfirmation:"", userCode:"",
    password:"", confirmPassword:""
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const selectedDesignation = designations.find(d => d.id.toString() === formData.designationId);
  const isMrSelected = selectedDesignation &&
    (selectedDesignation.name === "MR" || selectedDesignation.designation_name === "MR");

  useEffect(() => { fetchInitialDropdownData(); }, []);

  useEffect(() => {
    if (formData.stateId) fetchDistrictsByState(formData.stateId);
    else setDistricts([]);
  }, [formData.stateId]);

  useEffect(() => {
    if (!isMrSelected) setFormData(prev => ({ ...prev, reportingManagerId: "" }));
  }, [isMrSelected]);

  const fetchInitialDropdownData = async () => {
    try {
      setIsLoading(true);
      const [statesRes, desigRes, managersRes] = await Promise.all([
        api.get('/api/masters/states/all'),
        api.get('/api/masters/designations'),
        api.get('/api/masters/employees')
      ]);
      if (statesRes.data?.success)   setStates(statesRes.data.data);
      if (desigRes.data?.success)    setDesignations(desigRes.data.data);
      if (managersRes.data?.success) setManagers(managersRes.data.data);
    } catch (err) {
      console.error("Failed to fetch dropdown data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistrictsByState = async (stateId) => {
    try {
      const response = await api.get(`/api/masters/districts/all?stateId=${stateId}`);
      if (response.data?.success) setDistricts(response.data.data);
    } catch (err) {
      console.error("Failed to fetch districts", err);
      setDistricts([]);
    }
  };

  const validateField = (name, val, currentData) => {
    let errMsg = "";
    if (val.length > 0) {
      if (name === "mobile"            && val.length < 10) errMsg = "Mobile must be exactly 10 digits.";
      if (name === "aadhar"            && val.length < 12) errMsg = "Aadhaar must be exactly 12 digits.";
      if (name === "pan"               && val.length < 10) errMsg = "PAN must be exactly 10 characters.";
      if (name === "bankAccountNumber" && val.length <  8) errMsg = "Bank Account must be at least 8 digits.";
      if (name === "ifscCode"          && val.length < 11) errMsg = "IFSC Code must be exactly 11 characters.";
      if (name === "confirmPassword"   && val !== currentData.password) errMsg = "Passwords do not match.";
      if (name === "password" && currentData.confirmPassword) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: val !== currentData.confirmPassword ? "Passwords do not match." : ""
        }));
      }
    }
    setFieldErrors(prev => ({ ...prev, [name]: errMsg }));
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === "mobile")            value = value.replace(/\D/g, '').slice(0, 10);
    if (name === "aadhar")            value = value.replace(/\D/g, '').slice(0, 12);
    if (name === "bankAccountNumber") value = value.replace(/\D/g, '').slice(0, 18);
    if (name === "pan")               value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    if (name === "ifscCode")          value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      validateField(name, value, updatedData);
      return updatedData;
    });
  };

  const handleStateChange = (e) => {
    setFormData(prev => ({ ...prev, stateId: e.target.value, districtId: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    if (formData.mobile.length < 10)                                         return setError("Mobile number must be exactly 10 digits.");
    if (formData.aadhar            && formData.aadhar.length < 12)           return setError("Aadhaar must be exactly 12 digits.");
    if (formData.pan               && formData.pan.length < 10)              return setError("PAN must be exactly 10 alphanumeric characters.");
    if (formData.bankAccountNumber && formData.bankAccountNumber.length < 8) return setError("Bank Account must be at least 8 digits.");
    if (formData.ifscCode          && formData.ifscCode.length < 11)         return setError("IFSC Code must be exactly 11 characters.");
    if (formData.password !== formData.confirmPassword)                       return setError("Passwords do not match!");
    setIsSubmitting(true);
    const payload = {
      name: formData.name, mobile: formData.mobile, email: formData.email,
      dob: formData.dob || null, gender: formData.gender, religion: formData.religion || null,
      aadhar: formData.aadhar || null, pan: formData.pan || null, address: formData.address || null,
      stateId:     formData.stateId     ? parseInt(formData.stateId)     : null,
      districtId:  formData.districtId  ? parseInt(formData.districtId)  : null,
      bankName: formData.bankName || null, bankAccountNumber: formData.bankAccountNumber || null,
      ifscCode: formData.ifscCode || null,
      designationId:      formData.designationId      ? parseInt(formData.designationId)      : null,
      reportingManagerId: formData.reportingManagerId ? parseInt(formData.reportingManagerId) : null,
      dateOfJoining:      formData.dateOfJoining      || null,
      dateOfReporting:    formData.dateOfReporting    || null,
      dateOfConfirmation: formData.dateOfConfirmation || null,
      userCode: formData.userCode || null,
      password: formData.password
    };
    try {
      const response = await api.post('/api/masters/employees', payload);
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        setSuccessMsg("Employee created successfully!");
        setFormData({
          name:"", mobile:"", email:"", dob:"", gender:"Male", religion:"",
          aadhar:"", pan:"", address:"", stateId:"", districtId:"", bankName:"",
          bankAccountNumber:"", ifscCode:"", designationId:"", reportingManagerId:"",
          dateOfJoining:"", dateOfReporting:"", dateOfConfirmation:"", userCode:"",
          password:"", confirmPassword:""
        });
        setFieldErrors({});
        window.scrollTo({ top:0, behavior:'smooth' });
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
      window.scrollTo({ top:0, behavior:'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>

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

      <div className="ucr-card">
        {/* Header */}
        <div className="ucr-header">
          <div style={{ width:36, height:36, borderRadius:10, background:"#eff6ff", border:"1px solid #dbeafe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Users size={17} style={{ color:"#2563eb" }}/>
          </div>
          <div>
            <h2 style={{ fontSize:15, fontWeight:700, color:"#111827", margin:0 }}>Employee Creation</h2>
            <p style={{ fontSize:11, color:"#6b7280", margin:0, marginTop:2 }}>Fill in the details to create a new employee</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ucr-body">

            {/* ── Job Information ── */}
            <SectionLabel text="Job Information"/>
            <div className="ucr-grid">
              <FSelect label="Select State *" name="stateId" value={formData.stateId} onChange={handleStateChange} required
                options={states.map(s => ({ id:s.id, label:s.state_name }))}/>
              <FSelect label="Select District *" name="districtId" value={formData.districtId} onChange={handleInputChange} required disabled={!formData.stateId}
                options={districts.map(d => ({ id:d.id, label:d.district_name }))}/>
              <FSelect label="Select Designation *" name="designationId" value={formData.designationId} onChange={handleInputChange} required
                options={designations.map(d => ({ id:d.id, label:d.name||d.designation_name }))}/>
              <FSelect label="Select Reporting Manager" name="reportingManagerId" value={formData.reportingManagerId} onChange={handleInputChange} disabled={!isMrSelected}
                options={[
                  { id:"null", label: !isMrSelected ? "Not Applicable (Top Level)" : "None" },
                  ...managers.map(m => ({ id:m.id, label:`${m.name} - ${m.designation?.name||m.designation?.designation_name||"Manager"}` }))
                ]}/>
              <FDatePicker label="Date of Joining *"    value={formData.dateOfJoining}      onChange={v => setFormData(p => ({ ...p, dateOfJoining:v }))}/>
              <FDatePicker label="Date of Reporting *"  value={formData.dateOfReporting}    onChange={v => setFormData(p => ({ ...p, dateOfReporting:v }))}/>
              <FDatePicker label="Date of Confirmation" value={formData.dateOfConfirmation} onChange={v => setFormData(p => ({ ...p, dateOfConfirmation:v }))}/>
              <FInput label="User Code" name="userCode" value={formData.userCode} onChange={handleInputChange}/>
            </div>

            <hr className="ucr-divider"/>

            {/* ── Personal Information ── */}
            <SectionLabel text="Personal Information"/>
            <div className="ucr-grid">
              <FInput label="Name *"               name="name"   value={formData.name}   onChange={handleInputChange} required/>
              <FInput label="Mobile (10 digits) *" name="mobile" type="text" value={formData.mobile} onChange={handleInputChange} required error={fieldErrors.mobile}/>
              <FInput label="Email"                name="email"  type="email" value={formData.email}  onChange={handleInputChange}/>
              <FDatePicker label="Date of Birth"   value={formData.dob} onChange={v => setFormData(p => ({ ...p, dob:v }))}/>
              <FSelect label="Select Religion" name="religion" value={formData.religion} onChange={handleInputChange}
                options={[
                  { id:"Hindu",     label:"Hindu"     },
                  { id:"Muslim",    label:"Muslim"    },
                  { id:"Christian", label:"Christian" },
                  { id:"Sikh",      label:"Sikh"      },
                  { id:"Other",     label:"Other"     },
                ]}/>
              <FInput label="Aadhaar (12 digits)"   name="aadhar"           type="text" value={formData.aadhar}            onChange={handleInputChange} error={fieldErrors.aadhar}/>
              <FInput label="PAN (10 chars)"         name="pan"                          value={formData.pan}               onChange={handleInputChange} error={fieldErrors.pan}/>
              <FInput label="Address"                name="address"                      value={formData.address}           onChange={handleInputChange}/>
              <FInput label="Bank Name"              name="bankName"                     value={formData.bankName}          onChange={handleInputChange}/>
              <FInput label="Bank Account Number"    name="bankAccountNumber" type="text" value={formData.bankAccountNumber} onChange={handleInputChange} error={fieldErrors.bankAccountNumber}/>
              <FInput label="IFSC Code (11 chars)"   name="ifscCode"                     value={formData.ifscCode}          onChange={handleInputChange} error={fieldErrors.ifscCode}/>
            </div>

            {/* Gender */}
            <div className="ucr-gender-row">
              <p style={{ fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.07em", margin:0 }}>Gender:</p>
              {["Male","Female"].map(g => (
                <label key={g} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", border: formData.gender===g ? "2px solid #2563eb" : "2px solid #d1d5db", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {formData.gender===g && <div style={{ width:7, height:7, borderRadius:"50%", background:"#2563eb" }}/>}
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color: formData.gender===g ? "#111827" : "#6b7280" }}>{g}</span>
                  <input type="radio" name="gender" value={g} checked={formData.gender===g} onChange={handleInputChange} style={{ display:"none" }}/>
                </label>
              ))}
            </div>

            <hr className="ucr-divider"/>

            {/* ── Login Information ── */}
            <SectionLabel text="Login Information"/>
            <div className="ucr-grid">
              <FInput label="Email (Username)" name="loginEmail" type="email" value={formData.email} disabled/>
              <FPasswordInput label="Password *"         name="password"        value={formData.password}        onChange={handleInputChange} required error={fieldErrors.password}/>
              <FPasswordInput label="Confirm Password *" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required error={fieldErrors.confirmPassword}/>
            </div>

          </div>

          {/* Footer */}
          <div className="ucr-footer">
            <button type="submit" disabled={isSubmitting} className="ucr-submit-btn"
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 24px", borderRadius:9,
                fontSize:13, fontWeight:700, border:"none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                background:"#2563eb", color:"#fff",
                boxShadow:"0 2px 8px rgba(37,99,235,0.25)",
                opacity: isSubmitting ? 0.6 : 1, transition:"all 0.15s",
              }}
            >
              {isSubmitting
                ? <Loader2 size={14} style={{ animation:"ucr-spin 1s linear infinite" }}/>
                : <Save size={14}/>}
              Save Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Section Label ──────────────────────────────────────────────────────── */
function SectionLabel({ text }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
      <span style={{ fontSize:13, fontWeight:700, color:"#111827", whiteSpace:"nowrap" }}>{text}</span>
      <div style={{ flex:1, height:1, background:"#e5e7eb" }}/>
    </div>
  );
}

/* ─── Text Input ─────────────────────────────────────────────────────────── */
function FInput({ label, name, type="text", value, onChange, required, disabled, error }) {
  const [focus, setFocus] = useState(false);
  const hasVal  = Boolean(value?.toString().trim());
  const active  = focus || hasVal;
  const filled  = hasVal && !disabled;
  // Blue border: when focused OR when field has value; red on error
  const borderColor = error ? "#ef4444" : (focus || filled) ? "#2563eb" : "#d1d5db";
  const boxShadow   = focus && !disabled
    ? (error ? "0 0 0 3px rgba(239,68,68,0.08)" : "0 0 0 3px rgba(37,99,235,0.08)")
    : "none";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
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
            border: `1.5px solid ${borderColor}`,
            boxShadow,
            transition:"all 0.15s",
          }}
        />
        <label style={{
          position:"absolute", left:10, pointerEvents:"none", zIndex:10,
          transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
          top: active ? -9 : 10,
          fontSize: active ? 10 : 12,
          // Blue label when focused OR filled; grey when empty
          color: error ? "#ef4444" : (focus || filled) ? "#2563eb" : "#9ca3af",
          background: active ? "#fff" : "transparent",
          padding: active ? "0 4px" : "0",
        }}>
          {label}
        </label>
      </div>
      {error && <p style={{ fontSize:11, color:"#ef4444", fontWeight:600, paddingLeft:4, margin:0 }}>{error}</p>}
    </div>
  );
}

/* ─── Password Input ─────────────────────────────────────────────────────── */
function FPasswordInput({ label, name, value, onChange, required, error }) {
  const [focus, setFocus] = useState(false);
  const [show,  setShow]  = useState(false);
  const hasVal  = Boolean(value?.toString().trim());
  const active  = focus || hasVal;
  const borderColor = error ? "#ef4444" : (focus || hasVal) ? "#2563eb" : "#d1d5db";
  const boxShadow   = focus
    ? (error ? "0 0 0 3px rgba(239,68,68,0.08)" : "0 0 0 3px rgba(37,99,235,0.08)")
    : "none";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <div style={{ position:"relative", width:"100%", height:FH }}>
        <input
          type={show ? "text" : "password"} id={name} name={name} value={value||""}
          onChange={onChange} required={required}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          placeholder=" "
          style={{
            width:"100%", height:"100%", borderRadius:8, padding:"0 38px 0 12px",
            fontSize:13, color:"#111827", outline:"none", boxSizing:"border-box",
            background:"#fff",
            border: `1.5px solid ${borderColor}`,
            boxShadow,
            transition:"all 0.15s",
          }}
        />
        <label style={{
          position:"absolute", left:10, pointerEvents:"none", zIndex:10,
          transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
          top: active ? -9 : 10,
          fontSize: active ? 10 : 12,
          color: error ? "#ef4444" : (focus || hasVal) ? "#2563eb" : "#9ca3af",
          background: active ? "#fff" : "transparent",
          padding: active ? "0 4px" : "0",
        }}>
          {label}
        </label>
        <button type="button" onClick={() => setShow(!show)} style={{
          position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
          background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center",
          color: error ? "#ef4444" : "#9ca3af", padding:0,
        }}>
          {show ? <EyeOff size={14}/> : <Eye size={14}/>}
        </button>
      </div>
      {error && <p style={{ fontSize:11, color:"#ef4444", fontWeight:600, paddingLeft:4, margin:0 }}>{error}</p>}
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
  // Blue border when open OR when a value is selected
  const borderColor = (open || filled) ? "#2563eb" : "#d1d5db";
  const boxShadow   = open && !disabled ? "0 0 0 3px rgba(37,99,235,0.08)" : "none";

  const handleSelect = (optId) => {
    onChange({ target: { name, value: String(optId) } });
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position:"relative", width:"100%", userSelect:"none", zIndex: open?100:1 }}>
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
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600, color: hasVal ? (disabled?"#9ca3af":"#111827") : "transparent" }}>
          {selected?.label||" "}
        </span>
        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color: open?"#2563eb":"#9ca3af" }}>
          <ChevronDown size={14} style={{ transform: open?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s" }}/>
        </div>
      </div>

      {/* Floating label — blue when open OR value selected */}
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
            {options.length===0 && <li style={{ padding:"10px 12px", fontSize:12, color:"#9ca3af", fontStyle:"italic" }}>No options</li>}
            {options.map(opt => (
              <li key={opt.id}
                onMouseDown={e => { e.preventDefault(); handleSelect(opt.id); }}
                style={{
                  padding:"8px 12px", fontSize:13, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:8,
                  background: String(value)===String(opt.id) ? "#eff6ff" : "transparent",
                  color:      String(value)===String(opt.id) ? "#2563eb" : "#374151",
                  fontWeight: String(value)===String(opt.id) ? 600 : 400,
                  transition:"background 0.1s",
                }}
                onMouseEnter={e => { if (String(value)!==String(opt.id)) e.currentTarget.style.background="#f9fafb"; }}
                onMouseLeave={e => { if (String(value)!==String(opt.id)) e.currentTarget.style.background="transparent"; }}
              >
                {String(value)===String(opt.id) && <Check size={12} style={{ color:"#2563eb", flexShrink:0 }}/>}
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Date Picker ────────────────────────────────────────────────────────── */
function FDatePicker({ label, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const today  = new Date();
  const parsed = (value && !isNaN(Date.parse(value))) ? new Date(value+"T00:00:00") : today;
  const [view, setView] = useState({ y: parsed.getFullYear(), m: parsed.getMonth() });
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const hasVal      = Boolean(value);
  const active      = open || hasVal;
  const filled      = hasVal && !disabled;
  // Blue border when open OR when value is set
  const borderColor = (open || filled) ? "#2563eb" : "#d1d5db";
  const boxShadow   = open && !disabled ? "0 0 0 3px rgba(37,99,235,0.08)" : "none";

  const prevMonth = () => setView(v => v.m===0  ? {y:v.y-1,m:11} : {y:v.y,m:v.m-1});
  const nextMonth = () => setView(v => v.m===11 ? {y:v.y+1,m:0}  : {y:v.y,m:v.m+1});

  const selectDay = (day) => {
    const ds = `${view.y}-${String(view.m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    onChange(ds);
    setOpen(false);
  };

  const firstDow    = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m+1, 0).getDate();
  const displayVal  = hasVal ? new Date(value+"T00:00:00").toLocaleDateString("en-GB") : "";
  const selStr      = d => `${view.y}-${String(view.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const todayStr    = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  return (
    <div ref={ref} style={{ position:"relative", width:"100%", userSelect:"none", zIndex: open?100:1 }}>
      {/* Trigger */}
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
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600, color: hasVal?"#111827":"transparent" }}>
          {displayVal||" "}
        </span>
        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color: open?"#2563eb":"#9ca3af" }}>
          <Calendar size={14}/>
        </div>
      </div>

      {/* Floating label — blue when open OR value set */}
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

      {/* Calendar popup — .ucr-cal handles responsive sizing via CSS */}
      {open && !disabled && (
        <div className="ucr-cal">
          {/* Month nav */}
          <div style={{ background:"#2563eb", padding:"10px 10px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); prevMonth(); }}
              style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", flexShrink:0 }}>
              <ChevronLeft size={13}/>
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <select value={view.m} onChange={e => setView({...view, m:Number(e.target.value)})}
                style={{ background:"rgba(255,255,255,0.15)", color:"#fff", border:"none", borderRadius:6, padding:"2px 4px", fontSize:11, fontWeight:700, cursor:"pointer", outline:"none" }}>
                {MONTHS.map((m,i) => <option key={i} value={i} style={{ color:"#000" }}>{m}</option>)}
              </select>
             <select 
  value={view.y} 
  onChange={e => setView({...view, y:Number(e.target.value)})}
  style={{ background:"rgba(255,255,255,0.15)", color:"#fff", border:"none", borderRadius:6, padding:"2px 4px", fontSize:11, fontWeight:700, cursor:"pointer", outline:"none" }}
>
  {/* Generates years from 1920 to 2050 */}
  {Array.from({ length: 131 }, (_, i) => 1920 + i).map(y => (
    <option key={y} value={y} style={{ color:"#000" }}>{y}</option>
  ))}
</select>
            </div>
            <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); nextMonth(); }}
              style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", flexShrink:0 }}>
              <ChevronRight size={13}/>
            </button>
          </div>

          {/* Day headers */}
          <div style={{ padding:"7px 8px 3px", background:"#f9fafb", borderBottom:"1px solid #f3f4f6" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, textAlign:"center" }}>
              {DAYS.map(d => <div key={d} style={{ fontSize:9, fontWeight:700, color:"#9ca3af", padding:"1px 0" }}>{d}</div>)}
            </div>
          </div>

          {/* Day grid */}
          <div style={{ padding:"5px 8px 8px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, textAlign:"center" }}>
              {Array.from({ length:firstDow }).map((_,i) => <div key={`e${i}`}/>)}
              {Array.from({ length:daysInMonth }).map((_,i) => {
                const d       = i+1;
                const ds      = selStr(d);
                const isSel   = value===ds;
                const isToday = ds===todayStr;
                return (
                  <button key={d}
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); selectDay(d); }}
                    style={{
                      width:"100%", aspectRatio:"1", borderRadius:"50%", border:"none",
                      fontSize:10, fontWeight: isSel||isToday ? 700 : 400,
                      cursor:"pointer", transition:"all 0.12s",
                      background: isSel ? "#2563eb" : isToday ? "#eff6ff" : "transparent",
                      color:      isSel ? "#fff"    : isToday ? "#2563eb" : "#374151",
                      boxShadow:  isSel ? "0 2px 6px rgba(37,99,235,0.35)" : "none",
                      outline:    isToday && !isSel ? "1.5px solid #bfdbfe" : "none",
                      padding:0,
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background="#eff6ff"; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isToday?"#eff6ff":"transparent"; }}
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