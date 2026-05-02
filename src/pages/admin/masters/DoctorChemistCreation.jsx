import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, MapPin, Map, User, MapPinned, Save, CheckCircle2,
  Phone, Fingerprint, Hash, GraduationCap, Star, Tag, RotateCw, BookUser, Baby, CalendarDays, Clock,
  Store, Building2, UserCircle, CreditCard, Landmark, Trash2, PlusCircle, XCircle,
  Stethoscope, Beaker, Mail,
  ChevronDown, ChevronLeft, ChevronRight, Calendar, Check
} from "lucide-react";
import api from "../../../services/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

/* ─── Global responsive styles ───────────────────────────────────────────── */
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }

  .dc-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; }
  .dc-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; }
  .dc-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  .dc-body  { padding:24px; }
  .dc-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:flex-end; border-radius:0 0 16px 16px; }
  .dc-divider{ border:none; border-top:1px solid #f3f4f6; margin:0 0 20px; }

  /* 4 cols desktop */
  .dc-grid  { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:20px; }
  .dc-grid-3{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:20px; }
  .dc-grid-2{ display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-bottom:20px; }

  /* 2 cols tablet */
  @media(max-width:1024px){
    .dc-grid, .dc-grid-3 { grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:16px; }
    .dc-grid-2            { grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:16px; }
    .dc-body  { padding:18px; }
    .dc-footer{ padding:12px 18px; }
    .dc-header{ padding:14px 18px; }
  }

  /* 1 col mobile */
  @media(max-width:600px){
    .dc-grid, .dc-grid-3, .dc-grid-2 { grid-template-columns:1fr; gap:12px; margin-bottom:14px; }
    .dc-body  { padding:14px; }
    .dc-footer{ padding:12px 14px; }
    .dc-header{ padding:12px 14px; }
    .dc-submit-btn{ width:100%; justify-content:center; }
  }

  /* Calendar popup */
  .dc-cal {
    position:absolute; top:calc(100% + 6px); left:0;
    width:260px; background:#fff; border-radius:14px;
    border:1.5px solid #e5e7eb;
    box-shadow:0 12px 32px rgba(0,0,0,0.14),0 2px 8px rgba(0,0,0,0.06);
    z-index:9999; overflow:hidden;
  }
  @media(max-width:600px){
    .dc-cal { width:220px; left:50%; transform:translateX(-50%); }
  }

  .dc-section-title { font-size:14px; font-weight:700; color:#111827; display:flex; align-items:center; gap:8px; margin-bottom:16px; }
  .dc-additional-box { border-top:1px solid #f3f4f6; padding-top:16px; margin-top:4px; }
  .dc-conditional-box { border-left:3px solid #2563eb; padding-left:16px; margin-top:16px; }

  .dc-dynamic-row { display:flex; align-items:flex-start; gap:12px; background:#f9fafb; padding:14px; border-radius:10px; border:1px solid #f3f4f6; position:relative; margin-bottom:10px; }
  .dc-dynamic-row:hover .dc-remove-btn { opacity:1; }
  .dc-remove-btn { position:absolute; top:-10px; right:-10px; background:#fee2e2; border:none; border-radius:50%; padding:4px; cursor:pointer; color:#ef4444; opacity:0; transition:opacity 0.15s; display:flex; align-items:center; justify-content:center; }

  .dc-slot-row { display:flex; align-items:flex-start; gap:10px; background:#fff; padding:10px 12px; border-radius:8px; border:1px solid #f3f4f6; margin-bottom:8px; }
  .dc-slot-row:hover { border-color:#bfdbfe; }

  @keyframes dc-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const FH = 36;

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function DoctorChemistCreation() {
  const [isLoading,    setIsLoading]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");

  const [providerType, setProviderType] = useState("Doctor");
  const [showFamilyInfo, setShowFamilyInfo] = useState(false);
  const [showOtherInfo,  setShowOtherInfo]  = useState(false);

  const [states,    setStates]    = useState([]);
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [areas,     setAreas]     = useState([]);

  const emptyFormData = {
    stateId:"", districtId:"", employeeId:"", areaId:"",
    phone:"", aadhaar:"", address:"", email:"", gender:"", city:"",
    doctorCode:"", doctorName:"", mslNo:"", frequencyVisit:"",
    doctorCategory:"", doctorDegree:"", doctorSpecialization:"",
    licenceNo:"",
    childrenInfo:[], meetingTimeInfo:[],
    chemistCode:"", chemistName:"", chemistType:"",
    ownerName:"", ownerDob:"", ownerDoa:"", shopDoa:"",
    panCard:"", gstNumber:"", licenceNoChemist:"", chemistCategory:""
  };

  const [formData,     setFormData]     = useState(emptyFormData);
  const [fieldErrors,  setFieldErrors]  = useState({});

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    if (formData.stateId) fetchDistrictsByState(formData.stateId);
    else { setDistricts([]); setEmployees([]); setAreas([]); }
  }, [formData.stateId]);

  useEffect(() => {
    if (formData.stateId && formData.districtId) fetchFilteredEmployees(formData.stateId, formData.districtId);
    else { setEmployees([]); setAreas([]); }
  }, [formData.stateId, formData.districtId]);

  useEffect(() => {
    if (formData.employeeId) fetchAreasByEmployee(formData.employeeId);
    else setAreas([]);
  }, [formData.employeeId]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/masters/states');
      if (response.data?.success) setStates(response.data.data || []);
    } catch (err) { console.error("Failed to fetch initial data", err); }
    finally { setIsLoading(false); }
  };

  const fetchDistrictsByState = async (stateId) => {
    try {
      const response = await api.get(`/api/masters/districts?stateId=${stateId}`);
      if (response.data?.success) setDistricts(response.data.data || []);
    } catch (err) { setDistricts([]); }
  };

  const fetchFilteredEmployees = async (stateId, districtId) => {
    try {
      const response = await api.get(`/api/masters/employees/filter?stateId=${stateId}&districtId=${districtId}`);
      if (response.data?.success) setEmployees(response.data.data || []);
    } catch (err) { setEmployees([]); }
  };

  const fetchAreasByEmployee = async (employeeId) => {
    try {
      const response = await api.get(`/api/masters/areas/filter?employeeId=${employeeId}`);
      if (response.data?.success) setAreas(response.data.data || []);
    } catch (err) { setAreas([]); }
  };

  const handleTypeChange = (type) => {
    setProviderType(type);
    setFormData(prev => ({
      ...emptyFormData, providerType: type,
      stateId: prev.stateId, districtId: prev.districtId,
      employeeId: prev.employeeId, areaId: prev.areaId
    }));
    setFieldErrors({});
    setError("");
    setShowFamilyInfo(false);
    setShowOtherInfo(false);
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === "phone")     value = value.replace(/\D/g, '').slice(0, 10);
    if (name === "aadhaar")   value = value.replace(/\D/g, '').slice(0, 12);
    if (name === "panCard")   value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    if (name === "gstNumber") value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setFormData(prev => ({ ...prev, [name]: value }));
    let errMsg = "";
    if (value.length > 0) {
      if (name === "phone"   && value.length < 10) errMsg = "Must be 10 digits.";
      if (name === "aadhaar" && value.length < 12) errMsg = "Must be 12 digits.";
      if (name === "email"   && !/\S+@\S+\.\S+/.test(value)) errMsg = "Invalid format.";
      if (name === "panCard" && value.length < 10) errMsg = "Must be 10 chars.";
    }
    setFieldErrors(prev => ({ ...prev, [name]: errMsg }));
  };

  const handleGeographicChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let newData = { ...prev, [name]: value };
      if (name === "stateId")    newData = { ...newData, districtId:"", employeeId:"", areaId:"" };
      if (name === "districtId") newData = { ...newData, employeeId:"", areaId:"" };
      if (name === "employeeId") newData = { ...newData, areaId:"" };
      return newData;
    });
  };

  const addDynamicRow = (type) => {
    setFormData(prev => {
      if (type === 'child') return { ...prev, childrenInfo: [...(prev.childrenInfo||[]), { childName:"", childAge:"" }] };
      if (type === 'time')  return { ...prev, meetingTimeInfo: [...(prev.meetingTimeInfo||[]), { city:"", sessionType:"Monday", slots:[{ fromTime:"", toTime:"" }] }] };
      return prev;
    });
  };

  const removeDynamicRow = (type, index) => {
    setFormData(prev => {
      if (type === 'child') return { ...prev, childrenInfo:    (prev.childrenInfo    ||[]).filter((_,i) => i!==index) };
      if (type === 'time')  return { ...prev, meetingTimeInfo: (prev.meetingTimeInfo ||[]).filter((_,i) => i!==index) };
      return prev;
    });
  };

  const handleDynamicInputChange = (type, index, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const listName    = type==='child' ? 'childrenInfo' : 'meetingTimeInfo';
      const updatedList = [...(prev[listName]||[])];
      updatedList[index] = { ...updatedList[index], [name]: value };
      return { ...prev, [listName]: updatedList };
    });
  };

  const addDynamicSlot = (timeIndex) => {
    setFormData(prev => {
      const upd = [...(prev.meetingTimeInfo||[])];
      upd[timeIndex] = { ...upd[timeIndex], slots: [...(upd[timeIndex].slots||[]), { fromTime:"", toTime:"" }] };
      return { ...prev, meetingTimeInfo: upd };
    });
  };

  const removeDynamicSlot = (timeIndex, slotIndex) => {
    setFormData(prev => {
      const upd = [...(prev.meetingTimeInfo||[])];
      upd[timeIndex] = { ...upd[timeIndex], slots: (upd[timeIndex].slots||[]).filter((_,i) => i!==slotIndex) };
      return { ...prev, meetingTimeInfo: upd };
    });
  };

  const handleDynamicSlotInputChange = (timeIndex, slotIndex, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const upd      = [...(prev.meetingTimeInfo||[])];
      const updSlots = [...(upd[timeIndex].slots||[])];
      updSlots[slotIndex] = { ...updSlots[slotIndex], [name]: value };
      upd[timeIndex]      = { ...upd[timeIndex], slots: updSlots };
      return { ...prev, meetingTimeInfo: upd };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    const hasErrors = Object.values(fieldErrors).some(err => err !== "");
    if (hasErrors) { setError("Please fix highlighted errors before saving."); window.scrollTo({top:0,behavior:'smooth'}); return; }
    if (formData.phone   && formData.phone.length   < 10) return setError("Phone must be 10 digits.");
    if (formData.aadhaar && formData.aadhaar.length < 12) return setError("Aadhaar must be 12 digits.");
    setIsSubmitting(true);
    try {
      let response;
      if (providerType === "Doctor") {
        const doctorPayload = {
          doctorName: formData.doctorName, doctorCode: formData.doctorCode,
          mslNo: formData.mslNo, category: formData.doctorCategory||null,
          degree: formData.doctorDegree||null, specialization: formData.doctorSpecialization||null,
          phone: formData.phone||null, gender: formData.gender||null,
          address: formData.address||null,
          licenceNo: showOtherInfo ? (formData.licenceNo||null) : null,
          email:     showOtherInfo ? (formData.email||null)     : null,
          frequencyVisit: formData.frequencyVisit ? parseInt(formData.frequencyVisit) : null,
          aadhaarNo: formData.aadhaar||null,
          stateId: parseInt(formData.stateId), districtId: parseInt(formData.districtId),
          employeeId: parseInt(formData.employeeId), areaId: parseInt(formData.areaId),
          children: showFamilyInfo && formData.childrenInfo
            ? formData.childrenInfo.map(c => ({ childName:c.childName, childAge:c.childAge?parseInt(c.childAge):null }))
            : [],
          locations: showOtherInfo && formData.meetingTimeInfo
            ? formData.meetingTimeInfo.map(loc => ({ city:loc.city, sessionType:loc.sessionType, slots:loc.slots.map(s=>({fromTime:s.fromTime,toTime:s.toTime})) }))
            : []
        };
        response = await api.post('/api/masters/doctors', doctorPayload);
      } else {
        const providerPayload = {
          stateId: parseInt(formData.stateId), districtId: parseInt(formData.districtId),
          employeeId: parseInt(formData.employeeId), areaId: parseInt(formData.areaId),
          type: formData.chemistType||null, providerCode: formData.chemistCode,
          providerName: formData.chemistName, phone: formData.phone||null,
          address: formData.address||null, city: formData.city||null,
          category: formData.chemistCategory||null,
          gender:     showOtherInfo ? (formData.gender||null)             : null,
          aadhaarNo:  showOtherInfo ? (formData.aadhaar||null)            : null,
          ownerName:  showOtherInfo ? (formData.ownerName||null)          : null,
          ownerDob:   showOtherInfo ? (formData.ownerDob||null)           : null,
          ownerDoa:   showOtherInfo ? (formData.ownerDoa||null)           : null,
          shopDoa:    showOtherInfo ? (formData.shopDoa||null)            : null,
          email:      showOtherInfo ? (formData.email||null)              : null,
          panCard:    showOtherInfo ? (formData.panCard||null)            : null,
          gstNumber:  showOtherInfo ? (formData.gstNumber||null)          : null,
          licenceNo:  showOtherInfo ? (formData.licenceNoChemist||null)   : null
        };
        response = await api.post('/api/masters/providers', providerPayload);
      }
      if (response.status===200||response.status===201||response.data?.success) {
        setSuccessMsg(`${providerType} created successfully!`);
        setFormData(emptyFormData);
        setShowFamilyInfo(false); setShowOtherInfo(false);
        window.scrollTo({top:0,behavior:'smooth'});
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to save ${providerType}.`);
      window.scrollTo({top:0,behavior:'smooth'});
    } finally { setIsSubmitting(false); }
  };

  /* ── geo select helpers (wrap native onChange for FSelect) ── */
  const geoChange = (name) => (e) => handleGeographicChange({ target:{ name, value: e.target.value } });

  return (
    <div className="dc-wrap">
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

      <div className="dc-card">
        {/* Header */}
        <div className="dc-header">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#eff6ff", border:"1px solid #dbeafe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <BookUser size={17} style={{ color:"#2563eb" }}/>
            </div>
            <div>
              <h2 style={{ fontSize:15, fontWeight:700, color:"#111827", margin:0 }}>Add New Provider (Doctor / Chemist)</h2>
              <p style={{ fontSize:11, color:"#6b7280", margin:0, marginTop:2 }}>Select type and fill in the details</p>
            </div>
          </div>

          {/* Provider Type — radio button style */}
          <div style={{ display:"flex", alignItems:"center", gap:20, background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:10, padding:"8px 16px" }}>
            {[
              { key:"Doctor",  label:"Doctor" },
              { key:"Chemist", label:"Chemist / Stockist" },
            ].map(t => (
              <label key={t.key} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <div style={{
                  width:16, height:16, borderRadius:"50%", flexShrink:0,
                  border: providerType===t.key ? "2px solid #2563eb" : "2px solid #d1d5db",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"border-color 0.15s",
                }}>
                  {providerType===t.key && <div style={{ width:7, height:7, borderRadius:"50%", background:"#2563eb" }}/>}
                </div>
                <span style={{ fontSize:13, fontWeight: providerType===t.key ? 700 : 500, color: providerType===t.key ? "#111827" : "#6b7280", transition:"all 0.15s" }}>
                  {t.label}
                </span>
                <input type="radio" name="providerType" value={t.key} checked={providerType===t.key}
                  onChange={() => handleTypeChange(t.key)} style={{ display:"none" }}/>
              </label>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dc-body">

            {/* ── Geography ── */}
            <SectionLabel text="Geographic Selection"/>
            <div className="dc-grid">
              <FSelect label="Select State *" name="stateId" value={formData.stateId} onChange={geoChange("stateId")} required
                options={states.map(s => ({ id:s.id, label:s.state_name }))}/>
              <FSelect label="Select District *" name="districtId" value={formData.districtId} onChange={geoChange("districtId")} required disabled={!formData.stateId}
                options={districts.map(d => ({ id:d.id, label:d.district_name }))}/>
              <FSelect label="Select Employee *" name="employeeId" value={formData.employeeId} onChange={geoChange("employeeId")} required disabled={!formData.districtId}
                options={employees.map(e => ({ id:e.id, label:e.name }))}/>
              <FSelect label="Select Area *" name="areaId" value={formData.areaId} onChange={(e) => handleInputChange(e)} required disabled={!formData.employeeId}
                options={areas.map(a => ({ id:a.id, label:a.area_name||a.areaName }))}/>
            </div>

            <hr className="dc-divider"/>

            {/* ══ DOCTOR SECTION ══ */}
            {providerType === "Doctor" ? (
              <>
                <SectionLabel text="Main Doctor Information" icon={<Stethoscope size={15} style={{color:"#2563eb"}}/>}/>

                <div className="dc-grid">
                  <FInput label="Doctor Code"       name="doctorCode"       value={formData.doctorCode}       onChange={handleInputChange}/>
                  <FInput label="Doctor Name *"     name="doctorName"       value={formData.doctorName}       onChange={handleInputChange} required/>
                  <FInput label="Doctor MSL No. *"  name="mslNo"            value={formData.mslNo}            onChange={handleInputChange} required/>
                  <FInput label="Frequency Visit"   name="frequencyVisit"   value={formData.frequencyVisit}   onChange={handleInputChange} type="number"/>
                </div>

                <div className="dc-grid">
                  <FSelect label="Category" name="doctorCategory" value={formData.doctorCategory} onChange={(e)=>handleInputChange(e)}
                    options={["A","A+","B","B+","C","Core","SuperCore"].map(c=>({id:c,label:c}))}/>
                  <FSelect label="Degree *" name="doctorDegree" value={formData.doctorDegree} onChange={(e)=>handleInputChange(e)} required
                    options={["DM","MBBS","MCh","MD","MS"].map(d=>({id:d,label:d}))}/>
                  <FSelect label="Specialization *" name="doctorSpecialization" value={formData.doctorSpecialization} onChange={(e)=>handleInputChange(e)} required
                    options={["Cardiologist","Critical Care","Dental","Dermatologist(Plastic Surgery)","Diabetologist","Endocrinologist","Gastroenterologist"].map(s=>({id:s,label:s}))}/>
                  <FSelect label="Gender *" name="gender" value={formData.gender} onChange={(e)=>handleInputChange(e)} required
                    options={["Male","Female","Other"].map(g=>({id:g,label:g}))}/>
                </div>

                <div className="dc-grid-3">
                  <FInput label="Phone"   name="phone"   type="text" value={formData.phone}   onChange={handleInputChange} error={fieldErrors.phone}/>
                  <FInput label="Aadhaar" name="aadhaar" type="text" value={formData.aadhaar} onChange={handleInputChange} error={fieldErrors.aadhaar}/>
                  <FInput label="Address" name="address"             value={formData.address}  onChange={handleInputChange}/>
                </div>

                {/* Additional Info checkboxes */}
                <div className="dc-additional-box">
                  <p style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:12 }}>Additional Info</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {[{label:"Family Info", state:showFamilyInfo, set:setShowFamilyInfo},{label:"Other Info", state:showOtherInfo, set:setShowOtherInfo}].map(({label,state,set}) => (
                      <label key={label} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", width:"fit-content" }}>
                        <div style={{ width:16, height:16, borderRadius:4, border: state?"none":"1.5px solid #d1d5db", background: state?"#2563eb":"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {state && <Check size={10} style={{color:"#fff"}}/>}
                        </div>
                        <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{label}</span>
                        <input type="checkbox" checked={state} onChange={e=>set(e.target.checked)} style={{display:"none"}}/>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Family Info */}
                {showFamilyInfo && (
                  <div className="dc-conditional-box">
                    <DynamicListTable
                      title="Family Info" icon={Baby}
                      onAdd={() => addDynamicRow('child')}
                      list={formData.childrenInfo||[]}
                      onRemove={idx => removeDynamicRow('child',idx)}
                      renderInputs={(item,index) => (
                        <div className="dc-grid-2" style={{margin:0}}>
                          <FInput label="Child Name" name="childName" value={item.childName} onChange={e=>handleDynamicInputChange('child',index,e)}/>
                          <FInput label="Child Age"  name="childAge"  type="number" value={item.childAge} onChange={e=>handleDynamicInputChange('child',index,e)}/>
                        </div>
                      )}
                    />
                  </div>
                )}

                {/* Other Info */}
                {showOtherInfo && (
                  <div className="dc-conditional-box">
                    <p style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:14 }}>Other Info Doctor</p>
                    <div className="dc-grid-2">
                      <FInput label="Email"      name="email"      type="email" value={formData.email}      onChange={handleInputChange} error={fieldErrors.email}/>
                      <FInput label="Licence No" name="licenceNo"               value={formData.licenceNo}  onChange={handleInputChange}/>
                    </div>
                    <DynamicListTableTimeTemplate
                      title="Meeting Time Template" icon={CalendarDays}
                      onAdd={() => addDynamicRow('time')}
                      list={formData.meetingTimeInfo||[]}
                      onRemove={idx => removeDynamicRow('time',idx)}
                      renderMainInputs={(item,index) => (
                        <div className="dc-grid-2" style={{margin:0}}>
                          <FInput label="City" name="city" value={item.city} onChange={e=>handleDynamicInputChange('time',index,e)}/>
                          <FSelect label="Session Type (Day)" name="sessionType" value={item.sessionType} onChange={e=>handleDynamicInputChange('time',index,e)}
                            options={["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d=>({id:d,label:d}))}/>
                        </div>
                      )}
                      renderSlotInputs={(timeIndex,slotItem,slotIndex) => (
                        <>
                          <div style={{flex:1}}>
                            <FTimeInput label="From Time" name="fromTime" value={slotItem.fromTime} onChange={e=>handleDynamicSlotInputChange(timeIndex,slotIndex,e)}/>
                          </div>
                          <div style={{flex:1}}>
                            <FTimeInput label="To Time" name="toTime" value={slotItem.toTime} onChange={e=>handleDynamicSlotInputChange(timeIndex,slotIndex,e)}/>
                          </div>
                        </>
                      )}
                      onAddSlot={addDynamicSlot}
                      onRemoveSlot={removeDynamicSlot}
                    />
                  </div>
                )}
              </>

            ) : (
            /* ══ CHEMIST SECTION ══ */
              <>
                <SectionLabel text="Main Chemist Information" icon={<Beaker size={15} style={{color:"#2563eb"}}/>}/>

                <div className="dc-grid">
                  <FInput label="Chemist / Stockist Code"  name="chemistCode"     value={formData.chemistCode}     onChange={handleInputChange}/>
                  <FInput label="Chemist / Stockist Name *" name="chemistName"    value={formData.chemistName}     onChange={handleInputChange} required/>
                  <FSelect label="Type *" name="chemistType" value={formData.chemistType} onChange={e=>handleInputChange(e)} required
                    options={["Chemist","Stockist"].map(t=>({id:t,label:t}))}/>
                  <FSelect label="Category" name="chemistCategory" value={formData.chemistCategory} onChange={e=>handleInputChange(e)}
                    options={["A","A+","B","B+","C"].map(c=>({id:c,label:c}))}/>
                </div>

                <div className="dc-grid">
                  <FInput label="Phone"   name="phone"   type="text" value={formData.phone}   onChange={handleInputChange} error={fieldErrors.phone}/>
                  <FInput label="Address" name="address"             value={formData.address}  onChange={handleInputChange}/>
                  <FInput label="City"    name="city"                value={formData.city}     onChange={handleInputChange}/>
                </div>

                {/* Additional Info checkboxes */}
                <div className="dc-additional-box">
                  <p style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:12 }}>Additional Info</p>
                  <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", width:"fit-content" }}>
                    <div style={{ width:16, height:16, borderRadius:4, border: showOtherInfo?"none":"1.5px solid #d1d5db", background: showOtherInfo?"#2563eb":"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {showOtherInfo && <Check size={10} style={{color:"#fff"}}/>}
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Other Info</span>
                    <input type="checkbox" checked={showOtherInfo} onChange={e=>setShowOtherInfo(e.target.checked)} style={{display:"none"}}/>
                  </label>
                </div>

                {/* Chemist Other Info */}
                {showOtherInfo && (
                  <div className="dc-conditional-box">
                    <p style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:14 }}>Chemist Other Info</p>
                    <div className="dc-grid">
                      <FInput label="Owner Name" name="ownerName" value={formData.ownerName} onChange={handleInputChange}/>
                      <FDatePicker label="Owner DOB" value={formData.ownerDob} onChange={v=>setFormData(p=>({...p,ownerDob:v}))}/>
                      <FDatePicker label="Owner DOA" value={formData.ownerDoa} onChange={v=>setFormData(p=>({...p,ownerDoa:v}))}/>
                      <FDatePicker label="Shop DOA"  value={formData.shopDoa}  onChange={v=>setFormData(p=>({...p,shopDoa:v}))}/>
                    </div>
                    <div className="dc-grid">
                      <FInput label="Aadhaar"  name="aadhaar" type="text" value={formData.aadhaar}  onChange={handleInputChange} error={fieldErrors.aadhaar}/>
                      <FSelect label="Gender *" name="gender" value={formData.gender} onChange={e=>handleInputChange(e)} required
                        options={["Male","Female","Other"].map(g=>({id:g,label:g}))}/>
                      <FInput label="Email"    name="email"   type="email" value={formData.email}    onChange={handleInputChange} error={fieldErrors.email}/>
                      <FInput label="PAN Card" name="panCard"              value={formData.panCard}   onChange={handleInputChange} error={fieldErrors.panCard}/>
                    </div>
                    <div className="dc-grid">
                      <FInput label="GST Number" name="gstNumber"        value={formData.gstNumber}        onChange={handleInputChange}/>
                      <FInput label="Licence No" name="licenceNoChemist" value={formData.licenceNoChemist} onChange={handleInputChange}/>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          {/* Footer */}
          <div className="dc-footer">
            <button type="submit" disabled={isSubmitting} className="dc-submit-btn"
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 24px", borderRadius:9,
                fontSize:13, fontWeight:700, border:"none",
                cursor: isSubmitting?"not-allowed":"pointer",
                background:"#2563eb", color:"#fff",
                boxShadow:"0 2px 8px rgba(37,99,235,0.25)",
                opacity: isSubmitting?0.6:1, transition:"all 0.15s",
              }}
            >
              {isSubmitting ? <Loader2 size={14} style={{animation:"dc-spin 1s linear infinite"}}/> : <Save size={14}/>}
              Save {providerType}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Section Label ──────────────────────────────────────────────────────── */
function SectionLabel({ text, icon }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
      {icon}
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
  const borderColor = error ? "#ef4444" : (focus||filled) ? "#2563eb" : "#d1d5db";
  const boxShadow   = focus && !disabled ? (error?"0 0 0 3px rgba(239,68,68,0.08)":"0 0 0 3px rgba(37,99,235,0.08)") : "none";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <div style={{ position:"relative", width:"100%", height:FH }}>
        <input
          type={type} id={name} name={name} value={value||""} onChange={onChange}
          required={required} disabled={disabled}
          onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
          placeholder=" "
          style={{
            width:"100%", height:"100%", borderRadius:8, padding:"0 12px",
            fontSize:13, color:"#111827", outline:"none", boxSizing:"border-box",
            fontWeight: hasVal ? 600 : 400,
            background: disabled?"#f9fafb":"#fff",
            border:`1.5px solid ${disabled?"#d1d5db":borderColor}`,
            boxShadow: disabled?"none":boxShadow,
            transition:"all 0.15s",
          }}
        />
        <label style={{
          position:"absolute", left:10, pointerEvents:"none", zIndex:10,
          transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
          top: active ? -9 : 10,
          fontSize: active ? 10 : 12,
          color: error?"#ef4444":(focus||filled)?"#2563eb":"#9ca3af",
          background: active?"#fff":"transparent",
          padding: active?"0 4px":"0",
        }}>{label}</label>
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
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  const selected    = options.find(o => String(o.id)===String(value));
  const hasVal      = Boolean(value);
  const active      = open||hasVal;
  const filled      = hasVal&&!disabled;
  const borderColor = (open||filled) ? "#2563eb" : "#d1d5db";
  const boxShadow   = open&&!disabled ? "0 0 0 3px rgba(37,99,235,0.08)" : "none";

  const handleSelect = (optId) => {
    onChange({ target:{ name, value:String(optId) } });
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position:"relative", width:"100%", userSelect:"none", zIndex: open?100:1 }}>
      <div onClick={()=>{ if(!disabled) setOpen(!open); }}
        style={{
          width:"100%", height:FH, borderRadius:8, padding:"0 34px 0 12px",
          fontSize:13, display:"flex", alignItems:"center",
          cursor: disabled?"not-allowed":"pointer",
          background: disabled?"#f9fafb":"#fff",
          border:`1.5px solid ${disabled?"#d1d5db":borderColor}`,
          boxShadow: disabled?"none":boxShadow,
          transition:"all 0.15s", boxSizing:"border-box",
        }}
      >
        <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600, color: hasVal?(disabled?"#9ca3af":"#111827"):"transparent" }}>
          {selected?.label||" "}
        </span>
        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color: open?"#2563eb":"#9ca3af" }}>
          <ChevronDown size={14} style={{ transform: open?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s" }}/>
        </div>
      </div>

      <label style={{
        position:"absolute", left:10, pointerEvents:"none", zIndex:11,
        transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
        top: active?-9:10,
        fontSize: active?10:12,
        color: (open||filled)?"#2563eb":"#9ca3af",
        background: active?"#fff":"transparent",
        padding: active?"0 4px":"0",
      }}>{label}</label>

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
                onMouseDown={e=>{ e.preventDefault(); handleSelect(opt.id); }}
                style={{
                  padding:"8px 12px", fontSize:13, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:8,
                  background: String(value)===String(opt.id)?"#eff6ff":"transparent",
                  color:      String(value)===String(opt.id)?"#2563eb":"#374151",
                  fontWeight: String(value)===String(opt.id)?600:400,
                  transition:"background 0.1s",
                }}
                onMouseEnter={e=>{ if(String(value)!==String(opt.id)) e.currentTarget.style.background="#f9fafb"; }}
                onMouseLeave={e=>{ if(String(value)!==String(opt.id)) e.currentTarget.style.background="transparent"; }}
              >
                {String(value)===String(opt.id) && <Check size={12} style={{color:"#2563eb",flexShrink:0}}/>}
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Time Input (no floating label overlap) ─────────────────────────────── */
function FTimeInput({ label, name, value, onChange }) {
  const [focus, setFocus] = useState(false);
  const hasVal      = Boolean(value);
  const borderColor = (focus || hasVal) ? "#2563eb" : "#d1d5db";
  const boxShadow   = focus ? "0 0 0 3px rgba(37,99,235,0.08)" : "none";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {/* static label above */}
      <span style={{ fontSize:10, fontWeight:700, color: (focus||hasVal) ? "#2563eb" : "#9ca3af", letterSpacing:"0.04em", paddingLeft:2, transition:"color 0.15s" }}>
        {label}
      </span>
      <div style={{ position:"relative", width:"100%", height:FH }}>
        <input
          type="time" name={name} value={value||""}
          onChange={onChange}
          onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
          style={{
            width:"100%", height:"100%", borderRadius:8, padding:"0 36px 0 10px",
            fontSize:13, fontWeight: hasVal ? 600 : 400, color: hasVal?"#111827":"#9ca3af",
            outline:"none", boxSizing:"border-box", background:"#fff",
            border:`1.5px solid ${borderColor}`,
            boxShadow, transition:"all 0.15s",
            fontFamily:"Inter,sans-serif",
          }}
        />
        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color: (focus||hasVal)?"#2563eb":"#9ca3af", pointerEvents:"none" }}>
          <Clock size={13}/>
        </div>
      </div>
    </div>
  );
}

/* ─── Date Picker ────────────────────────────────────────────────────────── */
function FDatePicker({ label, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const today  = new Date();
  const parsed = (value && !isNaN(Date.parse(value))) ? new Date(value+"T00:00:00") : today;
  const [view, setView] = useState({ y:parsed.getFullYear(), m:parsed.getMonth() });
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  const hasVal      = Boolean(value);
  const active      = open||hasVal;
  const filled      = hasVal&&!disabled;
  const borderColor = (open||filled)&&!disabled ? "#2563eb" : "#d1d5db";
  const boxShadow   = open&&!disabled ? "0 0 0 3px rgba(37,99,235,0.08)" : "none";

  const prevMonth = () => setView(v => v.m===0  ? {y:v.y-1,m:11} : {y:v.y,m:v.m-1});
  const nextMonth = () => setView(v => v.m===11 ? {y:v.y+1,m:0}  : {y:v.y,m:v.m+1});
  const selectDay = (day) => { const ds=`${view.y}-${String(view.m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`; onChange(ds); setOpen(false); };

  const firstDow    = new Date(view.y,view.m,1).getDay();
  const daysInMonth = new Date(view.y,view.m+1,0).getDate();
  const displayVal  = hasVal ? new Date(value+"T00:00:00").toLocaleDateString("en-GB") : "";
  const selStr      = d => `${view.y}-${String(view.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const todayStr    = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  return (
    <div ref={ref} style={{ position:"relative", width:"100%", userSelect:"none", zIndex: open?100:1 }}>
      <div onClick={()=>{ if(!disabled) setOpen(!open); }}
        style={{
          width:"100%", height:FH, borderRadius:8, padding:"0 34px 0 12px",
          fontSize:13, display:"flex", alignItems:"center",
          cursor: disabled?"not-allowed":"pointer",
          background: disabled?"#f9fafb":"#fff",
          border:`1.5px solid ${disabled?"#d1d5db":borderColor}`,
          boxShadow: disabled?"none":boxShadow,
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

      <label style={{
        position:"absolute", left:10, pointerEvents:"none", zIndex:11,
        transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
        top: active?-9:10, fontSize: active?10:12,
        color: (open||filled)&&!disabled?"#2563eb":"#9ca3af",
        background: active?"#fff":"transparent",
        padding: active?"0 4px":"0",
      }}>{label}</label>

      {open && !disabled && (
        <div className="dc-cal">
          <div style={{ background:"#2563eb", padding:"10px 10px 8px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <button onMouseDown={e=>{e.preventDefault();e.stopPropagation();prevMonth();}}
              style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", flexShrink:0 }}>
              <ChevronLeft size={13}/>
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <select value={view.m} onChange={e=>setView({...view,m:Number(e.target.value)})}
                style={{ background:"rgba(255,255,255,0.15)", color:"#fff", border:"none", borderRadius:6, padding:"2px 4px", fontSize:11, fontWeight:700, cursor:"pointer", outline:"none" }}>
                {MONTHS.map((m,i)=><option key={i} value={i} style={{color:"#000"}}>{m}</option>)}
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
            <button onMouseDown={e=>{e.preventDefault();e.stopPropagation();nextMonth();}}
              style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", flexShrink:0 }}>
              <ChevronRight size={13}/>
            </button>
          </div>
          <div style={{ padding:"7px 8px 3px", background:"#f9fafb", borderBottom:"1px solid #f3f4f6" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, textAlign:"center" }}>
              {DAYS.map(d=><div key={d} style={{fontSize:9,fontWeight:700,color:"#9ca3af",padding:"1px 0"}}>{d}</div>)}
            </div>
          </div>
          <div style={{ padding:"5px 8px 8px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, textAlign:"center" }}>
              {Array.from({length:firstDow}).map((_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const d=i+1; const ds=selStr(d);
                const isSel=value===ds; const isToday=ds===todayStr;
                return (
                  <button key={d} onMouseDown={e=>{e.preventDefault();e.stopPropagation();selectDay(d);}}
                    style={{
                      width:"100%", aspectRatio:"1", borderRadius:"50%", border:"none",
                      fontSize:10, fontWeight:isSel||isToday?700:400,
                      cursor:"pointer", transition:"all 0.12s",
                      background: isSel?"#2563eb":isToday?"#eff6ff":"transparent",
                      color:      isSel?"#fff":isToday?"#2563eb":"#374151",
                      boxShadow:  isSel?"0 2px 6px rgba(37,99,235,0.35)":"none",
                      outline:    isToday&&!isSel?"1.5px solid #bfdbfe":"none", padding:0,
                    }}
                    onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background="#eff6ff"; }}
                    onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background=isToday?"#eff6ff":"transparent"; }}
                  >{d}</button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Dynamic List Table ─────────────────────────────────────────────────── */
function DynamicListTable({ title, icon:Icon, onAdd, list, onRemove, renderInputs }) {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingBottom:10, borderBottom:"1px solid #f3f4f6" }}>
        <p style={{ fontSize:13, fontWeight:700, color:"#111827", display:"flex", alignItems:"center", gap:6, margin:0 }}><Icon size={15}/> {title}</p>
        <button type="button" onClick={onAdd}
          style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:"#eff6ff", color:"#2563eb", transition:"all 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.background="#dbeafe"}
          onMouseLeave={e=>e.currentTarget.style.background="#eff6ff"}
        >
          <PlusCircle size={13}/> Add Row
        </button>
      </div>
      {(!list||list.length===0) ? (
        <div style={{ textAlign:"center", padding:"20px 16px", fontSize:12, color:"#9ca3af", background:"#f9fafb", borderRadius:10, border:"1px dashed #e5e7eb" }}>
          No entries added yet. Click 'Add Row' to begin.
        </div>
      ) : (
        <div>
          {list.map((item,index) => (
            <div key={index} className="dc-dynamic-row">
              <div style={{flex:1}}>{renderInputs(item,index)}</div>
              <button type="button" onClick={()=>onRemove(index)} className="dc-remove-btn">
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Dynamic Time Template ──────────────────────────────────────────────── */
function DynamicListTableTimeTemplate({ title, icon:Icon, onAdd, list, onRemove, renderMainInputs, renderSlotInputs, onAddSlot, onRemoveSlot }) {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingBottom:10, borderBottom:"1px solid #f3f4f6" }}>
        <p style={{ fontSize:13, fontWeight:700, color:"#111827", display:"flex", alignItems:"center", gap:6, margin:0 }}><Icon size={15}/> {title}</p>
        <button type="button" onClick={onAdd}
          style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background:"#eff6ff", color:"#2563eb", transition:"all 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.background="#dbeafe"}
          onMouseLeave={e=>e.currentTarget.style.background="#eff6ff"}
        >
          <PlusCircle size={13}/> Add City/Day Row
        </button>
      </div>

      {(!list||list.length===0) ? (
        <div style={{ textAlign:"center", padding:"20px 16px", fontSize:12, color:"#9ca3af", background:"#f9fafb", borderRadius:10, border:"1px dashed #e5e7eb" }}>
          No entries added yet. Click 'Add City/Day Row' to begin.
        </div>
      ) : (
        <div>
          {list.map((item,timeIndex) => (
            <div key={timeIndex} style={{ background:"#f9fafb", padding:14, borderRadius:10, border:"1px solid #f3f4f6", marginBottom:12, position:"relative" }}
              className="dc-dynamic-row" >
              <div style={{flex:1}}>
                {/* City & Day */}
                <div style={{marginBottom:12, paddingBottom:12, borderBottom:"1px solid #f3f4f6"}}>
                  {renderMainInputs(item,timeIndex)}
                </div>
                {/* Slots */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:"#374151", display:"flex", alignItems:"center", gap:5, margin:0 }}>
                    <Clock size={13} style={{color:"#6b7280"}}/> Time Slots
                  </p>
                  <button type="button" onClick={()=>onAddSlot(timeIndex)}
                    style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:600, background:"#f0fdf4", color:"#16a34a", transition:"all 0.15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#dcfce7"}
                    onMouseLeave={e=>e.currentTarget.style.background="#f0fdf4"}
                  >
                    <PlusCircle size={12}/> Add Slot
                  </button>
                </div>
                {(!item.slots||item.slots.length===0) ? (
                  <div style={{ textAlign:"center", padding:"10px", fontSize:11, color:"#9ca3af", border:"1px dashed #e5e7eb", borderRadius:8 }}>
                    Click 'Add Slot' to begin adding times.
                  </div>
                ) : (
                  item.slots.map((slotItem,slotIndex) => (
                    <div key={slotIndex} className="dc-slot-row">
                      {renderSlotInputs(timeIndex,slotItem,slotIndex)}
                      <button type="button" onClick={()=>onRemoveSlot(timeIndex,slotIndex)}
                        style={{ border:"none", background:"none", cursor:"pointer", color:"#fca5a5", padding:"4px", borderRadius:6, display:"flex", alignItems:"center", flexShrink:0, transition:"color 0.15s", marginTop:18 }}
                        onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                        onMouseLeave={e=>e.currentTarget.style.color="#fca5a5"}
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  ))
                )}
              </div>
              <button type="button" onClick={()=>onRemove(timeIndex)} className="dc-remove-btn">
                <XCircle size={16}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}