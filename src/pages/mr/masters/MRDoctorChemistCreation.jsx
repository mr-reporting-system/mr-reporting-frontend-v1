import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Check, Calendar as CalendarIcon, ChevronDown, ChevronRight, ChevronLeft,
  Plus, X, Save, FileText, CheckCircle2, Clock, Users, Trash2, Loader2, AlertCircle
} from "lucide-react";
import api from "../../../services/api";

// ─── Global responsive styles (from reference) ───────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; overflow-x: hidden; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; margin-bottom: 24px; min-width: 0; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:center; border-radius:0 0 16px 16px; flex-wrap: wrap; gap: 12px; }

  .ucr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; align-items: start; margin-bottom:24px; }
  .ucr-grid-12 { display:grid; grid-template-columns:repeat(12,1fr); gap:16px; align-items: start; margin-bottom: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 16px; }

  .col-span-2 { grid-column: span 2; }
  .col-span-3 { grid-column: span 3; }
  .col-span-4 { grid-column: span 4; }
  .col-span-5 { grid-column: span 5; }
  .col-span-6 { grid-column: span 6; }
  .col-span-12 { grid-column: span 12; }

  @media(max-width:1024px){
    .ucr-grid, .ucr-grid-4, .ucr-grid-2 { grid-template-columns:repeat(2,1fr); gap:16px; }
    .ucr-grid-12 { grid-template-columns:repeat(2,1fr); }
    .col-span-4, .col-span-3, .col-span-5, .col-span-2, .col-span-6 { grid-column: span 1; }
  }
  @media(max-width:768px){
    .ucr-grid, .ucr-grid-4, .ucr-grid-2, .ucr-grid-12 { grid-template-columns:1fr; gap:16px; }
    .col-span-4, .col-span-3, .col-span-5, .col-span-2, .col-span-6 { grid-column: span 1 !important; }
    .ucr-body  { padding:16px; }
    .ucr-header { padding: 16px; } /* Removed flex-col to keep icon + text + toggles inline */
    .ucr-footer { justify-content: center; flex-direction: column; }
    .ucr-footer > button { width: 100%; justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const INPUT_CLASS = "h-[38px]";
const FH = 40;

// ─── EXACT HARDCODED DROPDOWN VALUES ─────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { id: "A", label: "A" }, { id: "A+", label: "A+" }, { id: "B", label: "B" },
  { id: "B+", label: "B+" }, { id: "C", label: "C" }, { id: "Core", label: "Core" },
  { id: "SuperCore", label: "SuperCore" }
];

const DEGREE_OPTIONS = [
  { id: "DM", label: "DM" }, { id: "MBBS", label: "MBBS" },
  { id: "MD", label: "MD" }, { id: "MS", label: "MS" }
];

const SPECIALIZATION_OPTIONS = [
  { id: "Cardiologist", label: "Cardiologist" }, { id: "Critical Care", label: "Critical Care" },
  { id: "Dental", label: "Dental" }, { id: "Dermatologist(Plastic Surgery)", label: "Dermatologist(Plastic Surgery)" },
  { id: "Diabetologist", label: "Diabetologist" }, { id: "Endocrinologist", label: "Endocrinologist" },
  { id: "Gastroenterologist", label: "Gastroenterologist" }, { id: "Gastrologist", label: "Gastrologist" },
  { id: "Gen Surgery", label: "Gen Surgery" }, { id: "Gynaecologist", label: "Gynaecologist" },
  { id: "Hepatologist", label: "Hepatologist" }, { id: "Medical Oncology", label: "Medical Oncology" },
  { id: "Nephrologist", label: "Nephrologist" }, { id: "Neurologist", label: "Neurologist" },
  { id: "OBG&GYN", label: "OBG&GYN" }, { id: "Oncologist", label: "Oncologist" },
  { id: "Ortho", label: "Ortho" }, { id: "Physician", label: "Physician" },
  { id: "Pulmonologist", label: "Pulmonologist" }, { id: "Radiotherapy", label: "Radiotherapy" },
  { id: "Urologist", label: "Urologist" }
];

const CHEMIST_TYPES = [
  { id: "Chemist", label: "Chemist" }, { id: "Stockist", label: "Stockist" }
];

const WEEKDAY_OPTIONS = [
  { id: "Monday", label: "Monday" }, { id: "Tuesday", label: "Tuesday" },
  { id: "Wednesday", label: "Wednesday" }, { id: "Thursday", label: "Thursday" },
  { id: "Friday", label: "Friday" }, { id: "Saturday", label: "Saturday" }, { id: "Sunday", label: "Sunday" }
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function MRDoctorChemistCreation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [providerType, setProviderType] = useState("Doctor"); // 'Doctor' or 'Chemist'

  // ─── MASTER DATA FROM API ───────────────────────────────────────────────────
  const [masterData, setMasterData] = useState({ areas: [], focusProducts: [] });

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [areaRes, prodRes] = await Promise.all([
          api.get('/api/mr/provider-creation/areas').catch(() => ({ data: { data: [] } })),
          api.get('/api/mr/provider-creation/products').catch(() => ({ data: { data: [] } }))
        ]);

        const mapData = (res) => (res?.data?.data || res?.data || []).map(item => ({
          id: String(item.id || item.value || item._id), 
          label: item.label || item.name || "Unknown"
        }));

        setMasterData({
          areas: mapData(areaRes),
          focusProducts: mapData(prodRes)
        });
      } catch (error) { console.error("Error fetching master data:", error); }
    };
    fetchMasterData();
  }, []);

  // ─── DOCTOR STATE ───────────────────────────────────────────────────────────
  const [doctor, setDoctor] = useState({
    area: "", code: "", name: "", mslNo: "", frequencyVisit: "", phone: "",
    category: "", degree: "", specialization: "", address: "", aadhaar: "",
    hasFamilyInfo: false,
    familyInfo: { children: [] },
    hasOtherInfo: false,
    otherInfo: { email: "", licenceNo: "", meetings: [] }
  });

  // ─── CHEMIST/STOCKIST STATE ─────────────────────────────────────────────────
  const [chemist, setChemist] = useState({
    area: "", type: "Chemist", code: "", name: "", phone: "", aadhaar: "",
    hasOtherInfo: false,
    otherInfo: { ownerName: "", ownerDob: "", ownerDoa: "", shopDoa: "", address: "", city: "", email: "", panCard: "", gstNumber: "", licenceNo: "", category: "" }
  });

  // ─── DYNAMIC ROW HANDLERS (DOCTOR) ──────────────────────────────────────────
  
  // Children
  const addChild = () => {
    setDoctor(prev => ({ ...prev, familyInfo: { children: [...prev.familyInfo.children, { id: Date.now(), name: "", age: "" }] } }));
  };
  const removeChild = (id) => {
    setDoctor(prev => ({ ...prev, familyInfo: { children: prev.familyInfo.children.filter(c => c.id !== id) } }));
  };
  const updateChild = (id, field, value) => {
    setDoctor(prev => ({ ...prev, familyInfo: { children: prev.familyInfo.children.map(c => c.id === id ? { ...c, [field]: value } : c) } }));
  };

  // Meetings & Nested Time Slots
  const addMeeting = () => {
    setDoctor(prev => ({
      ...prev, otherInfo: { ...prev.otherInfo, meetings: [...prev.otherInfo.meetings, { id: Date.now(), city: "", sessionType: "", timeSlots: [] }] }
    }));
  };
  const removeMeeting = (id) => {
    setDoctor(prev => ({ ...prev, otherInfo: { ...prev.otherInfo, meetings: prev.otherInfo.meetings.filter(m => m.id !== id) } }));
  };
  const updateMeeting = (id, field, value) => {
    setDoctor(prev => ({ ...prev, otherInfo: { ...prev.otherInfo, meetings: prev.otherInfo.meetings.map(m => m.id === id ? { ...m, [field]: value } : m) } }));
  };

  const addTimeSlot = (meetingId) => {
    setDoctor(prev => ({
      ...prev, otherInfo: { ...prev.otherInfo, meetings: prev.otherInfo.meetings.map(m => m.id === meetingId ? { ...m, timeSlots: [...m.timeSlots, { id: Date.now(), fromTime: "", toTime: "" }] } : m) }
    }));
  };
  const removeTimeSlot = (meetingId, slotId) => {
    setDoctor(prev => ({
      ...prev, otherInfo: { ...prev.otherInfo, meetings: prev.otherInfo.meetings.map(m => m.id === meetingId ? { ...m, timeSlots: m.timeSlots.filter(s => s.id !== slotId) } : m) }
    }));
  };
  const updateTimeSlot = (meetingId, slotId, field, value) => {
    setDoctor(prev => ({
      ...prev, otherInfo: { ...prev.otherInfo, meetings: prev.otherInfo.meetings.map(m => m.id === meetingId ? { ...m, timeSlots: m.timeSlots.map(s => s.id === slotId ? { ...s, [field]: value } : s) } : m) }
    }));
  };

  // ─── SUBMISSION ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setErrorMsg("");
    setIsSubmitting(true);
    
    try {
      if (providerType === "Doctor") {

        // ✅ VALIDATION
        if (!doctor.area || !doctor.name || !doctor.mslNo || !doctor.category || !doctor.degree || !doctor.specialization) {
          setErrorMsg("Please fill all required fields (*)");
          setIsSubmitting(false);
          return;
        }

        // ✅ CORRECT PAYLOAD
        const payload = {
          areaId: Number(doctor.area),
          doctorCode: doctor.code,
          doctorName: doctor.name,
          mslNo: doctor.mslNo,
          frequencyVisit: doctor.frequencyVisit,
          phone: doctor.phone,
          category: doctor.category,
          degree: doctor.degree,
          specialization: doctor.specialization,
          address: doctor.address,
          aadhaar: doctor.aadhaar,

          familyInfo: doctor.hasFamilyInfo ? doctor.familyInfo : null,
          otherInfo: doctor.hasOtherInfo ? doctor.otherInfo : null
        };

        console.log("🚀 Doctor Payload:", payload); // DEBUG

        await api.post('/api/mr/provider-creation/doctors', payload);
      } else {
        const payload = {
          areaId: Number(chemist.area),
          type: chemist.type?.toUpperCase(),// CHEMIST / STOCKIST
          providerCode: chemist.code,
          providerName: chemist.name,   // 🔥 IMPORTANT FIX
          phone: chemist.phone,
          aadhaarNo: chemist.aadhaar,

          otherInfo: chemist.hasOtherInfo ? chemist.otherInfo : null
        };

        console.log("🚀 Provider Payload:", payload);

        await api.post('/api/mr/provider-creation/providers', payload);
      }
      
      setMessage(`${providerType} Created Successfully!`);
      
      // Reset forms
      if (providerType === "Doctor") {
        setDoctor({
          area: "", code: "", name: "", mslNo: "", frequencyVisit: "", phone: "",
          category: "", degree: "", specialization: "", address: "", aadhaar: "",
          hasFamilyInfo: false, familyInfo: { children: [] },
          hasOtherInfo: false, otherInfo: { email: "", licenceNo: "", meetings: [] }
        });
      } else {
        setChemist({
          area: "", type: "Chemist", code: "", name: "", phone: "", aadhaar: "",
          hasOtherInfo: false,
          otherInfo: { ownerName: "", ownerDob: "", ownerDoa: "", shopDoa: "", address: "", city: "", email: "", panCard: "", gstNumber: "", licenceNo: "", category: "" }
        });
      }
      
      setTimeout(() => { setMessage(""); }, 3000);
    } catch (error) {
      console.error(error);
      const backendError = error.response?.data?.message || error.response?.data?.error || `Failed to create ${providerType}.`;
      setErrorMsg(backendError);
    } finally {
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ─── RENDER DOCTOR FORM ────────────────────────────────────────────────────
  const renderDoctorForm = () => (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="ucr-grid-4">
        <SingleDropdown label="SELECT AREA *" options={masterData.areas} value={doctor.area} onSelect={v => setDoctor({...doctor, area: v})} />
        <FloatingInput label="DOCTOR CODE" value={doctor.code} onChange={e => setDoctor({...doctor, code: e.target.value})} />
        <FloatingInput label="DOCTOR NAME *" value={doctor.name} onChange={e => setDoctor({...doctor, name: e.target.value})} />
        <FloatingInput label="DOCTOR MSL NO. *" value={doctor.mslNo} onChange={e => setDoctor({...doctor, mslNo: e.target.value})} />
        <FloatingInput label="FREQUENCY VISIT" value={doctor.frequencyVisit} onChange={e => setDoctor({...doctor, frequencyVisit: e.target.value})} />
        <FloatingInput label="PHONE" value={doctor.phone} onChange={e => setDoctor({...doctor, phone: e.target.value})} />
        <SingleDropdown label="CATEGORY *" options={CATEGORY_OPTIONS} value={doctor.category} onSelect={v => setDoctor({...doctor, category: v})} />
        <SingleDropdown label="DEGREE *" options={DEGREE_OPTIONS} value={doctor.degree} onSelect={v => setDoctor({...doctor, degree: v})} />
        <SingleDropdown label="SPECIALIZATION *" options={SPECIALIZATION_OPTIONS} value={doctor.specialization} onSelect={v => setDoctor({...doctor, specialization: v})} />
        <div className="col-span-2"><FloatingInput label="ADDRESS" value={doctor.address} onChange={e => setDoctor({...doctor, address: e.target.value})} /></div>
        <FloatingInput label="AADHAAR" value={doctor.aadhaar} onChange={e => setDoctor({...doctor, aadhaar: e.target.value})} />
      </div>

      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 20, marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 20, textTransform: "uppercase" }}>Additional Info</h3>
        
        {/* Family Info */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", width: "max-content", marginBottom: 16 }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4, border: doctor.hasFamilyInfo ? "none" : "2px solid #d1d5db",
              background: doctor.hasFamilyInfo ? "#2563eb" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              {doctor.hasFamilyInfo && <Check size={12} style={{ color: "#fff", strokeWidth: 3 }} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Family Info</span>
            <input type="checkbox" style={{ display: "none" }} checked={doctor.hasFamilyInfo} onChange={e => setDoctor({...doctor, hasFamilyInfo: e.target.checked})} />
          </label>

          {doctor.hasFamilyInfo && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              {doctor.familyInfo.children.length === 0 && <p style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", marginBottom: 12 }}>No children added.</p>}
              {doctor.familyInfo.children.map((child, idx) => (
                <div key={child.id} className="ucr-grid-12" style={{ alignItems: "center" }}>
                  <div className="col-span-5"><FloatingInput label="Child Name" value={child.name} onChange={e => updateChild(child.id, 'name', e.target.value)} /></div>
                  <div className="col-span-5"><FloatingInput label="Age" value={child.age} onChange={e => updateChild(child.id, 'age', e.target.value)} /></div>
                  <div className="col-span-2">
                    <button onClick={() => removeChild(child.id)} style={{ display:"flex", alignItems:"center", justifyContent:"center", height: FH, width: "100%", borderRadius:8, fontSize:12, fontWeight:700, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", cursor:"pointer", transition:"0.2s" }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addChild} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:700, background:"#eff6ff", color:"#2563eb", border:"1px dashed #93c5fd", cursor:"pointer", transition:"0.2s", width: "fit-content" }}>
                <Plus size={14} /> Add Child
              </button>
            </div>
          )}
        </div>

        {/* Other Info */}
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", width: "max-content", marginBottom: 16 }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4, border: doctor.hasOtherInfo ? "none" : "2px solid #d1d5db",
              background: doctor.hasOtherInfo ? "#2563eb" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              {doctor.hasOtherInfo && <Check size={12} style={{ color: "#fff", strokeWidth: 3 }} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Other Info</span>
            <input type="checkbox" style={{ display: "none" }} checked={doctor.hasOtherInfo} onChange={e => setDoctor({...doctor, hasOtherInfo: e.target.checked})} />
          </label>

          {doctor.hasOtherInfo && (
            <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
              <div className="ucr-grid-4">
                <FloatingInput label="EMAIL" value={doctor.otherInfo.email} onChange={e => setDoctor({...doctor, otherInfo: {...doctor.otherInfo, email: e.target.value}})} />
                <FloatingInput label="LICENCE NO." value={doctor.otherInfo.licenceNo} onChange={e => setDoctor({...doctor, otherInfo: {...doctor.otherInfo, licenceNo: e.target.value}})} />
              </div>
              
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", marginBottom: 16, textTransform: "uppercase" }}>Meeting Time Templates</h4>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {doctor.otherInfo.meetings.map((meet, idx) => (
                    <div key={meet.id} style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 12, padding: "20px 16px", position: "relative" }}>
                      
                      <div className="ucr-grid-12" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 12 }}>
                        <div className="col-span-5"><FloatingInput label="CITY" value={meet.city} onChange={e => updateMeeting(meet.id, 'city', e.target.value)} /></div>
                        <div className="col-span-5"><SingleDropdown label="SESSION TYPE (WEEKDAY)" options={WEEKDAY_OPTIONS} value={meet.sessionType} onSelect={v => updateMeeting(meet.id, 'sessionType', v)} /></div>
                        <div className="col-span-2">
                          <button onClick={() => removeMeeting(meet.id)} style={{ display:"flex", alignItems:"center", justifyContent:"center", height: FH, width: "100%", borderRadius:8, fontSize:12, fontWeight:700, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", cursor:"pointer", transition:"0.2s" }}>
                            Remove Meeting
                          </button>
                        </div>
                      </div>

                      {/* Time Slots inside Meeting */}
                      <div style={{ paddingLeft: 16, borderLeft: "2px solid #e5e7eb", marginLeft: 8 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Time Slots:</p>
                        {meet.timeSlots.length === 0 && <p style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", marginBottom: 12 }}>No slots added.</p>}
                        
                        {meet.timeSlots.map(slot => (
                          <div key={slot.id} className="ucr-grid-12" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 8, alignItems: "center" }}>
                            <div className="col-span-5"><FloatingTimePicker label="From Time" value={slot.fromTime} onChange={v => updateTimeSlot(meet.id, slot.id, 'fromTime', v)} /></div>
                            <div className="col-span-5"><FloatingTimePicker label="To Time" value={slot.toTime} onChange={v => updateTimeSlot(meet.id, slot.id, 'toTime', v)} /></div>
                            <div className="col-span-2">
                              <button onClick={() => removeTimeSlot(meet.id, slot.id)} style={{ width: 34, height: 34, borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none" }}>
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <button onClick={() => addTimeSlot(meet.id)} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"6px 12px", borderRadius:6, fontSize:11, fontWeight:700, background:"#eff6ff", color:"#2563eb", border:"none", cursor:"pointer", transition:"0.2s", width: "fit-content", marginTop: 8 }}>
                          <Plus size={13} /> Add Slot
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button onClick={addMeeting} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:700, background:"#10b981", color:"#fff", border:"none", cursor:"pointer", transition:"0.2s", width: "fit-content", boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)" }}>
                    <Plus size={14} /> Add Meeting
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ─── RENDER CHEMIST FORM ───────────────────────────────────────────────────
  const renderChemistForm = () => (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <div className="ucr-grid-4">
        <SingleDropdown label="SELECT AREA *" options={masterData.areas} value={chemist.area} onSelect={v => setChemist({...chemist, area: v})} />
        <SingleDropdown label="TYPE *" options={CHEMIST_TYPES} value={chemist.type} onSelect={v => setChemist({...chemist, type: v})} />
        <FloatingInput label="CHEMIST / STOCKIST CODE" value={chemist.code} onChange={e => setChemist({...chemist, code: e.target.value})} />
        <FloatingInput label="CHEMIST / STOCKIST NAME *" value={chemist.name} onChange={e => setChemist({...chemist, name: e.target.value})} />
        <FloatingInput label="PHONE" value={chemist.phone} onChange={e => setChemist({...chemist, phone: e.target.value})} />
        <FloatingInput label="AADHAAR" value={chemist.aadhaar} onChange={e => setChemist({...chemist, aadhaar: e.target.value})} />
      </div>

      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 20, marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 20, textTransform: "uppercase" }}>Additional Info</h3>
        
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", width: "max-content", marginBottom: 16 }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4, border: chemist.hasOtherInfo ? "none" : "2px solid #d1d5db",
              background: chemist.hasOtherInfo ? "#2563eb" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              {chemist.hasOtherInfo && <Check size={12} style={{ color: "#fff", strokeWidth: 3 }} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Other Info</span>
            <input type="checkbox" style={{ display: "none" }} checked={chemist.hasOtherInfo} onChange={e => setChemist({...chemist, hasOtherInfo: e.target.checked})} />
          </label>

          {chemist.hasOtherInfo && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <div className="ucr-grid-4">
                <FloatingInput label="OWNER NAME" value={chemist.otherInfo.ownerName} onChange={e => setChemist({...chemist, otherInfo: {...chemist.otherInfo, ownerName: e.target.value}})} />
                <FloatingDatePicker label="OWNER DOB" value={chemist.otherInfo.ownerDob} onChange={v => setChemist({...chemist, otherInfo: {...chemist.otherInfo, ownerDob: v}})} />
                <FloatingDatePicker label="OWNER DOA" value={chemist.otherInfo.ownerDoa} onChange={v => setChemist({...chemist, otherInfo: {...chemist.otherInfo, ownerDoa: v}})} />
                <FloatingDatePicker label="SHOP DOA" value={chemist.otherInfo.shopDoa} onChange={v => setChemist({...chemist, otherInfo: {...chemist.otherInfo, shopDoa: v}})} />
                
                <div className="col-span-2"><FloatingInput label="ADDRESS" value={chemist.otherInfo.address} onChange={e => setChemist({...chemist, otherInfo: {...chemist.otherInfo, address: e.target.value}})} /></div>
                <FloatingInput label="CITY" value={chemist.otherInfo.city} onChange={e => setChemist({...chemist, otherInfo: {...chemist.otherInfo, city: e.target.value}})} />
                <FloatingInput label="EMAIL" value={chemist.otherInfo.email} onChange={e => setChemist({...chemist, otherInfo: {...chemist.otherInfo, email: e.target.value}})} />
                
                <FloatingInput label="PAN CARD" value={chemist.otherInfo.panCard} onChange={e => setChemist({...chemist, otherInfo: {...chemist.otherInfo, panCard: e.target.value}})} />
                <FloatingInput label="GST NUMBER" value={chemist.otherInfo.gstNumber} onChange={e => setChemist({...chemist, otherInfo: {...chemist.otherInfo, gstNumber: e.target.value}})} />
                <FloatingInput label="LICENCE NO." value={chemist.otherInfo.licenceNo} onChange={e => setChemist({...chemist, otherInfo: {...chemist.otherInfo, licenceNo: e.target.value}})} />
                <SingleDropdown label="CATEGORY" options={CATEGORY_OPTIONS} value={chemist.otherInfo.category} onSelect={v => setChemist({...chemist, otherInfo: {...chemist.otherInfo, category: v}})} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>

      {/* Alerts */}
      {errorMsg && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}
      {message && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "10px 16px", color: "#16a34a", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      <div className="ucr-card">
        {/* Header */}
        <div className="ucr-header" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={17} style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Provider Creation Form</h2>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>Register a new Doctor, Chemist or Stockist</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%", border: providerType === "Doctor" ? "5px solid #2563eb" : "2px solid #d1d5db",
                background: "#fff", transition: "0.2s"
              }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: providerType === "Doctor" ? "#111827" : "#6b7280" }}>* Doctor</span>
              <input type="radio" style={{ display: "none" }} checked={providerType === 'Doctor'} onChange={() => { setProviderType('Doctor'); setMessage(''); setErrorMsg(''); }} />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{
                width: 16, height: 16, borderRadius: "50%", border: providerType === "Chemist" ? "5px solid #2563eb" : "2px solid #d1d5db",
                background: "#fff", transition: "0.2s"
              }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: providerType === "Chemist" ? "#111827" : "#6b7280" }}>* Chemist / Stockist</span>
              <input type="radio" style={{ display: "none" }} checked={providerType === 'Chemist'} onChange={() => { setProviderType('Chemist'); setMessage(''); setErrorMsg(''); }} />
            </label>
          </div>
        </div>

        {/* Body */}
        <div className="ucr-body">
          {providerType === 'Doctor' ? renderDoctorForm() : renderChemistForm()}
        </div>

        {/* Footer */}
        <div className="ucr-footer" style={{ borderTop: "1px solid #f3f4f6" }}>
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            style={{
              height: 40, padding: "0 32px", borderRadius: 8, background: "#2563eb", color: "#fff",
              fontSize: 13, fontWeight: 700, border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8
            }}
          >
            {isSubmitting ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Save size={16} />}
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Custom UI Components - STRICT FIDELITY TO SUBMITDCR STYLING
// ═══════════════════════════════════════════════════════════════════

function FloatingInput({ label, type = "text", value, onChange, disabled }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasVal = Boolean(value?.toString().trim());
  const active = isFocused || hasVal;

  return (
    <div style={{ position:"relative", width:"100%", height:FH }}>
      <input
        type={type} value={value||""} onChange={onChange} disabled={disabled}
        onFocus={()=>setIsFocused(true)} onBlur={()=>setIsFocused(false)}
        style={{
          width:"100%", height:"100%", borderRadius:8, padding:"0 12px",
          fontSize:13, color:"#111827", outline:"none", boxSizing:"border-box", fontWeight: 600,
          background: disabled ? "#f9fafb" : "#fff",
          border: active && !disabled ? "1.5px solid #2563eb" : "1.5px solid #d1d5db",
          transition:"all 0.15s",
        }}
      />
      <label style={{
        position:"absolute", left:10, pointerEvents:"none", zIndex:10,
        transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
        top: active ? -9 : 12,
        fontSize: active ? 10 : 12,
        color: disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"),
        background: disabled ? (active ? "#f9fafb" : "transparent") : "#fff",
        padding: active ? "0 4px" : "0",
      }}>
        {label}
      </label>
    </div>
  );
}

function FloatingTextarea({ label, value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== "" && value !== null && value !== undefined;
  const active = hasValue || isFocused;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <textarea
        value={value ?? ""}
        onChange={onChange}
        rows={2}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%", minHeight: 60, borderRadius: 8, padding: "12px", fontSize: 13,
          border: `1.5px solid ${active ? "#2563eb" : "#d1d5db"}`, outline: "none",
          fontWeight: 600, color: "#111827", background: "#fff",
          transition: "border-color 0.2s", resize: "vertical", fontFamily: "inherit"
        }}
      />
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: active ? "#2563eb" : "#9ca3af", background: "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none"
        }}
      >
        {label}
      </label>
    </div>
  );
}

function SingleDropdown({ label, options, value, onSelect, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const selectedOption = options.find((option) => String(option.id ?? option.value) === String(value));
  const active = isOpen || Boolean(value);

  const openMenu = () => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = (e) => { if (e.target?.closest && e.target.closest('.dropdown-portal')) return; setIsOpen(false); };
    const handleResize = () => setIsOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("scroll", handleScroll, true); window.removeEventListener("resize", handleResize); };
  }, [isOpen]);

  return (
    <div className="relative w-full select-none mt-1">
      <div
        ref={ref}
        onClick={openMenu}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex",
          alignItems: "center", border: `1.5px solid ${active && !disabled ? "#2563eb" : "#d1d5db"}`,
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f3f4f6" : "#fff",
          transition: "border-color 0.2s"
        }}
      >
        <span style={{ flex: 1, fontWeight: 600, color: (Boolean(value) && !disabled) ? "#111827" : disabled && Boolean(value) ? "#6b7280" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {selectedOption?.label || " "}
        </span>
        <ChevronDown size={14} style={{ color: "#9ca3af", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s", flexShrink: 0 }} />
      </div>
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"), background: disabled ? (active ? "#f3f4f6" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}
      >
        {label}
      </label>

      {isOpen && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setIsOpen(false)}>
          <div style={{ maxHeight: 250, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
               <p style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", margin: 0, textAlign: "center", fontStyle: "italic" }}>No options available</p>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.id ?? opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(opt.id ?? opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: "10px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
                    background: String(value) === String(opt.id ?? opt.value) ? "#eff6ff" : "transparent",
                    color: String(value) === String(opt.id ?? opt.value) ? "#2563eb" : "#374151"
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}

function FloatingTimePicker({ label, value, onChange, disabled }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(value?.toString().trim());

  // Time inputs always show native placeholders (--:--), so always float the label
  const labelColor = isFocused ? "text-blue-600" : "text-gray-500";
  const borderClass = isFocused ? "border-blue-600" : "border-gray-300 hover:border-gray-400";

  return (
    <div style={{ position: "relative", width: "100%", height: FH }}>
      <input 
        type="time" 
        value={value || ""} 
        onChange={e => onChange(e.target.value)} 
        disabled={disabled} 
        onFocus={() => setIsFocused(true)} 
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%", height: "100%", borderRadius: 8, border: "none", background: "transparent",
          padding: "0 12px", fontSize: 13, color: "#111827", transition: "all 0.15s", outline: "none",
          fontWeight: hasValue ? 600 : 500,
          border: `1.5px solid ${isFocused ? "#2563eb" : "#d1d5db"}`
        }}
      />
      {/* Label is ALWAYS floated so it never overlaps the native --:-- placeholder */}
      <label style={{
        position: "absolute", left: 10, pointerEvents: "none", zIndex: 10,
        transition: "all 0.15s", fontWeight: 600, letterSpacing: "0.03em",
        top: -9, fontSize: 10, color: labelColor, background: "#fff", padding: "0 4px"
      }}>
        {label}
      </label>
    </div>
  );
}

function FloatingDatePicker({ label, value, onChange, disabled }) {
  const [open,  setOpen]  = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const today  = new Date();
  const parsed = (value && !isNaN(Date.parse(value))) ? new Date(value + "T00:00:00") : today;
  const [view, setView]   = useState({ y: parsed.getFullYear(), m: parsed.getMonth() });
  const ref = useRef(null);

  const hasVal = Boolean(value);
  const active = open || hasVal;

  const openMenu = () => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: 270 // fixed calendar width
      });
    }
    setOpen(true);
  };

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
    <div className="relative w-full select-none mt-1">
      <div
        ref={ref}
        onClick={openMenu}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex",
          alignItems: "center", border: `1.5px solid ${active && !disabled ? "#2563eb" : "#d1d5db"}`,
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f3f4f6" : "#fff",
          transition: "border-color 0.2s"
        }}
      >
        <span style={{ flex: 1, fontWeight: 600, color: hasVal ? "#111827" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {displayVal || " "}
        </span>
        <CalendarIcon size={15} style={{ color: open ? "#2563eb" : "#9ca3af", flexShrink: 0 }} />
      </div>
      
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"), background: disabled ? (active ? "#f3f4f6" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}
      >
        {label}
      </label>

      {open && !disabled && (
        <Portal top={pos.top} left={pos.left} width={pos.width} onClose={() => setOpen(false)}>
          <div style={{ background: "#fff", overflow: "hidden" }}>
            {/* Month nav */}
            <div style={{ background:"#2563eb", padding:"14px 14px 10px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <button
                onMouseDown={e=>{ e.preventDefault(); e.stopPropagation(); prevMonth(); }}
                style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#fff", flexShrink:0 }}
              >
                <ChevronLeft size={14}/>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <select
                  value={view.m}
                  onChange={(e) => setView({ ...view, m: Number(e.target.value) })}
                  style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 6, padding: "2px 6px", fontSize: 13, fontWeight: 700, cursor: "pointer", outline: "none" }}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i} style={{ color: "#000" }}>{m}</option>
                  ))}
                </select>
                <select
                  value={view.y}
                  onChange={(e) => setView({ ...view, y: Number(e.target.value) })}
                  style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 6, padding: "2px 6px", fontSize: 13, fontWeight: 700, cursor: "pointer", outline: "none" }}
                >
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i).map((y) => (
                    <option key={y} value={y} style={{ color: "#000" }}>{y}</option>
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
                {Array.from({ length: firstDow }).map((_,i) => <div key={`e${i}`}/>)}

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
        </Portal>
      )}
    </div>
  );
}

function Portal({ top, left, width, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const handleMouseDown = (e) => {
        if (ref.current && !ref.current.contains(e.target)) {
          onClose();
        }
      };
      document.addEventListener("mousedown", handleMouseDown);
      return () => document.removeEventListener("mousedown", handleMouseDown);
    }, 10);

    return () => clearTimeout(timer);
  }, [onClose]);

  useEffect(() => {
    const handleScroll = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      onClose();
    };
    
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", onClose);
    
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top, left, width, zIndex: 99999 }}
      className="dropdown-portal bg-white border border-[#e5e7eb] rounded-lg shadow-xl overflow-hidden"
    >
      {children}
    </div>
  );
}