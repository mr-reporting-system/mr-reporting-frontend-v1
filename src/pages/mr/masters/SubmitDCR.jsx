import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Check, ChevronDown, ChevronRight, ChevronLeft,
  Plus, ArrowLeft, Save, FileText, CheckCircle2,
  Users, Calendar as CalendarIcon, Loader2, AlertCircle
} from "lucide-react";
import api from "../../../services/api";

// ─── Global responsive styles (from reference) ───────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; overflow-x: hidden; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; margin-bottom: 24px; min-width: 0; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:space-between; border-radius:0 0 16px 16px; flex-wrap: wrap; gap: 12px; }

  .ucr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; align-items: start; }
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
    .ucr-header { padding: 16px; } /* Removed column flex-direction to keep icon and text in one row */
    .ucr-footer { justify-content: center; flex-direction: column; }
    .ucr-footer > button { width: 100%; justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const INPUT_CLASS = "h-[38px]";
const FH = 40;

const STEPS = [
  "DCR Main", "Doctor", "Chemist / Stockist", "Meetings", "Misc Expenses", "Preview"
];

const EXACT_STATUS_OPTIONS = [
  { id: "Working",                  label: "Working" },
  { id: "Working & Half Day Leave", label: "Working & Half Day Leave" },
  { id: "Weekly Off",               label: "Weekly Off" },
  { id: "Leave",                    label: "Leave" },
  { id: "Admin Work",               label: "Admin Work" },
  { id: "Meeting",                  label: "Meeting" },
  { id: "Transit",                  label: "Transit" },
  { id: "Conference",               label: "Conference" },
  { id: "Holiday",                  label: "Holiday" },
  { id: "Other",                    label: "Other" },
  { id: "WFH",                      label: "WFH" },
  { id: "Travel & Working",         label: "Travel & Working" },
];

const EXACT_EXPENSE_TYPES = [
  { id: "Communication Allowance", label: "Communication Allowance" },
  { id: "Stationary",              label: "Stationary" },
  { id: "Photocopy",               label: "Photocopy" },
  { id: "Courier",                 label: "Courier" },
  { id: "Food Bill",               label: "Food Bill" },
  { id: "Train Fare",              label: "Train Fare" },
  { id: "Bus Fare",                label: "Bus Fare" },
  { id: "Area Wise Statement",     label: "Area Wise Statement" },
  { id: "Misc Exp",                label: "Misc Exp" },
  { id: "Metro City Allowance",    label: "Metro City Allowance" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function SubmitDCR() {
  const [currentStep,  setCurrentStep]  = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message,      setMessage]      = useState("");
  const [errorMsg,     setErrorMsg]     = useState("");

  const [masterData, setMasterData] = useState({
    employees: [], areas: [], doctors: [], chemists: [], stockists: [], allChemStock: []
  });

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [emp, area, doc, chemStock] = await Promise.all([
          api.get("/api/employees/managers").catch(() => ({ data: { data: [] } })),
          api.get("/api/areas").catch(() => ({ data: { data: [] } })),
          api.get("/api/doctors/mapped").catch(() => ({ data: { data: [] } })),
          api.get("/api/chemists-stockists").catch(() => ({ data: { data: [] } })),
        ]);
        
        const mapData = (res) =>
          (res?.data?.data || res?.data || []).map((item) => ({
            ...item, 
            id:    item.id || item.value || item._id,
            label: item.label || item.name || item.status_name || "Unknown",
          }));
          
        const mappedChemStock = mapData(chemStock);
        
        const filteredChemists = mappedChemStock.filter(c => {
          const t = String(c.type || c.chemistType || c.providerType || "").toLowerCase();
          return t === "chemist";
        });

        const filteredStockists = mappedChemStock.filter(c => {
          const t = String(c.type || c.chemistType || c.providerType || "").toLowerCase();
          return t === "stockist";
        });
        
        setMasterData({
          employees: mapData(emp), 
          areas:     mapData(area),
          doctors:   mapData(doc), 
          chemists: filteredChemists,
          stockists: filteredStockists,
          allChemStock: mappedChemStock
        });
      } catch (err) { console.error("Error fetching master data:", err); }
    };
    fetchMasterData();
  }, []);

  // ── form states ────────────────────────────────────────────────────────────
  const [dcrMain, setDcrMain] = useState({
    date: "", workingStatus: "", jointWorkWith: [],
    isDeviate: false, deviateReason: "", areas: [], remarks: "",
  });
  const [doctors,          setDoctors]          = useState([]);
  const [chemistTypeView,  setChemistTypeView]  = useState("Chemist");
  const [chemistsStockists,setChemistsStockists]= useState([]);
  const [meetings,         setMeetings]         = useState([]);
  const [expenses,         setExpenses]         = useState([]);

  const requiresExtraFields = ["Working","Working & Half Day Leave","WFH","Travel & Working"]
    .includes(dcrMain.workingStatus);

  // ── stepper ────────────────────────────────────────────────────────────────
  const handleNext = () => { if (currentStep < STEPS.length - 1) { setCurrentStep(p => p + 1); window.scrollTo({ top:0, behavior:"smooth" }); } };
  const handleBack = () => { if (currentStep > 0) { setCurrentStep(p => p - 1); window.scrollTo({ top:0, behavior:"smooth" }); } };

  const handleFinalSubmit = async () => {
    setErrorMsg("");
    
    if (!dcrMain.date || !dcrMain.workingStatus) {
      setErrorMsg("DCR Date and Working Status are required.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        dcrDate: dcrMain.date,
        workingStatus: dcrMain.workingStatus,
        jointWorkManagerId: dcrMain.jointWorkWith.length > 0 ? Number(dcrMain.jointWorkWith[0]) : null,
        remarks: dcrMain.remarks || "",
        isDeviate: dcrMain.isDeviate,
        deviateReason: dcrMain.isDeviate ? (dcrMain.deviateReason || "") : "",
        travelAreas: dcrMain.areas
          .filter(a => a.from && a.to)
          .map(a => ({
            fromAreaId: Number(a.from),
            toAreaId: Number(a.to)
        })),
        doctorCalls: doctors
          .filter(d => d.doctorId)
          .map(d => ({
            doctorId: Number(d.doctorId),
            jointWithManagerId: d.jointWorkWith.length > 0 ? Number(d.jointWorkWith[0]) : null,
            remarks: d.remarks || "",
            productListIds: [] 
        })),
        chemistStockistCalls: chemistsStockists
          .filter(cs => cs.targetId)
          .map(cs => {
            const originalItem = masterData.allChemStock.find(x => String(x.id) === String(cs.targetId));
            const rawType = String(originalItem?.type || originalItem?.chemistType || originalItem?.providerType || cs.type).toLowerCase();
            const finalType = rawType.includes("stockist") ? "STOCKIST" : "CHEMIST";

            return {
              chemistStockistId: Number(cs.targetId),
              type: finalType,
              jointWithManagerId: cs.jointWorkWith.length > 0 ? Number(cs.jointWorkWith[0]) : null,
              remarks: cs.remarks || ""
            };
        }),
        nextMeetings: meetings
          .filter(m => m.meetingWith)
          .map(m => ({
            meetingWithManagerId: Number(m.meetingWith),
            subject: m.subject || "",
            remarks: m.remarks || ""
        })),
        expenses: expenses
          .filter(e => e.expenseType && e.amount)
          .map(e => ({
            expenseType: e.expenseType,
            amount: Number(e.amount),
            remarks: e.remarks || ""
        }))
      };

      await api.post("/api/dcr", payload);

      // ✅ RESET ALL FORM DATA
      setDcrMain({
        date: "",
        workingStatus: "",
        jointWorkWith: [],
        isDeviate: false,
        deviateReason: "",
        areas: [],
        remarks: "",
      });

      setDoctors([]);
      setChemistsStockists([]);
      setMeetings([]);
      setExpenses([]);

      // ✅ RESET STEP
      setCurrentStep(0);

      // ✅ SHOW MESSAGE
      setMessage("DCR Submitted Successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) { 
      console.error("Submit error", err); 
      const backendError = err.response?.data?.message || err.response?.data?.error || "Failed to submit DCR. Please review your entries.";
      setErrorMsg(backendError);
    } finally { 
      setIsSubmitting(false); 
      window.scrollTo({ top:0, behavior:"smooth" });
    }
  };

  // ── list helpers ───────────────────────────────────────────────────────────
  const addArea     = ()           => setDcrMain(p => ({ ...p, areas: [...p.areas, { id: Date.now(), from:"", to:"" }] }));
  const removeArea  = (id)         => setDcrMain(p => ({ ...p, areas: p.areas.filter(a => a.id !== id) }));
  const updateArea  = (id, f, v)   => setDcrMain(p => ({ ...p, areas: p.areas.map(a => a.id===id ? {...a,[f]:v} : a) }));

  const addDoctor    = ()         => setDoctors(d => [...d, { id:Date.now(), doctorId:"", jointWorkWith:[], remarks:"" }]);
  const removeDoctor = (id)       => setDoctors(d => d.filter(x => x.id!==id));
  const updateDoctor = (id,f,v)   => setDoctors(d => d.map(x => x.id===id ? {...x,[f]:v} : x));

  const addCS     = ()         => setChemistsStockists(d => [...d, { id:Date.now(), type:chemistTypeView, targetId:"", jointWorkWith:[], remarks:"" }]);
  const removeCS  = (id)       => setChemistsStockists(d => d.filter(x => x.id!==id));
  const updateCS  = (id,f,v)   => setChemistsStockists(d => d.map(x => x.id===id ? {...x,[f]:v} : x));

  const addMeeting    = ()       => setMeetings(d => [...d, { id:Date.now(), meetingWith:"", subject:"", remarks:"" }]);
  const removeMeeting = (id)     => setMeetings(d => d.filter(x => x.id!==id));
  const updateMeeting = (id,f,v) => setMeetings(d => d.map(x => x.id===id ? {...x,[f]:v} : x));

  const addExpense    = ()       => setExpenses(d => [...d, { id:Date.now(), expenseType:"", amount:"", remarks:"" }]);
  const removeExpense = (id)     => setExpenses(d => d.filter(x => x.id!==id));
  const updateExpense = (id,f,v) => setExpenses(d => d.map(x => x.id===id ? {...x,[f]:v} : x));

  // ── stepper UI ─────────────────────────────────────────────────────────────
  const renderStepper = () => (
    <div style={{ borderBottom:"1px solid #f3f4f6", overflowX:"auto", background:"#fff" }}>
      <div style={{ display:"flex", alignItems:"center", padding:"16px 20px", minWidth:680, gap:0 }}>
        {STEPS.map((step, idx) => {
          const isActive    = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <React.Fragment key={idx}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                {/* Circle */}
                <div style={{
                  width:30, height:30, borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:700, transition:"all 0.3s",
                  background: isCompleted ? "#2563eb" : isActive ? "#2563eb" : "#f3f4f6",
                  color:       isCompleted ? "#fff"    : isActive ? "#fff"    : "#9ca3af",
                  boxShadow:   isActive ? "0 0 0 4px rgba(37,99,235,0.15)" : "none",
                }}>
                  {isCompleted ? <Check size={13}/> : idx + 1}
                </div>
                {/* Label */}
                <span style={{
                  fontSize:12, fontWeight:isActive||isCompleted ? 700 : 500,
                  color: isActive||isCompleted ? "#2563eb" : "#6b7280",
                  whiteSpace:"nowrap",
                }}>
                  {step}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div style={{
                  flex:1, height:2, minWidth:24, margin:"0 10px",
                  background: isCompleted ? "#2563eb" : "#e5e7eb",
                  transition:"background 0.3s",
                  borderRadius:2,
                }}/>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  // ── step renderers ─────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div className="ucr-grid-4">
        <FloatingDatePicker label="DATE *" value={dcrMain.date} onChange={v => setDcrMain({...dcrMain, date:v})} />
        <SingleDropdown label="WORKING STATUS *" options={EXACT_STATUS_OPTIONS} value={dcrMain.workingStatus} onSelect={v => setDcrMain({...dcrMain, workingStatus:v})} />
        {requiresExtraFields && (
          <MultiSelectDropdown label="JOINT WORK WITH" options={masterData.employees} selectedIds={dcrMain.jointWorkWith} onChange={v => setDcrMain({...dcrMain, jointWorkWith:v})} />
        )}
      </div>

      {requiresExtraFields && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, borderTop:"1px solid #f3f4f6", paddingTop:20 }}>
          {/* Deviate */}
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:14 }}>Deviate Info</p>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", width:"fit-content" }}>
              <div style={{
                width:18, height:18, borderRadius:4, border: dcrMain.isDeviate ? "none" : "2px solid #d1d5db",
                background: dcrMain.isDeviate ? "#2563eb" : "#fff",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              }}>
                {dcrMain.isDeviate && <Check size={12} style={{ color:"#fff", strokeWidth: 3 }}/>}
              </div>
              <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Deviate Reason</span>
              <input type="checkbox" style={{ display:"none" }} checked={dcrMain.isDeviate}
                onChange={e => setDcrMain({...dcrMain, isDeviate:e.target.checked, deviateReason: e.target.checked ? dcrMain.deviateReason : ""})} />
            </label>
            {dcrMain.isDeviate && (
              <div style={{ marginTop:16 }}>
                <FloatingInput label="REASON *" value={dcrMain.deviateReason} onChange={e => setDcrMain({...dcrMain, deviateReason:e.target.value})} />
              </div>
            )}
          </div>

          {/* Areas */}
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:"#111827", marginBottom:14 }}>Area Details</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {dcrMain.areas.map(area => (
                <div key={area.id} className="ucr-grid-12" style={{ marginBottom: 0, paddingBottom: 10, borderBottom: "none" }}>
                  <div className="col-span-5"><SingleDropdown label="FROM AREA" options={masterData.areas} value={area.from} onSelect={v => updateArea(area.id,"from",v)} /></div>
                  <div className="col-span-5"><SingleDropdown label="TO AREA" options={masterData.areas} value={area.to} onSelect={v => updateArea(area.id,"to",v)} /></div>
                  <div className="col-span-2">
                    <button onClick={() => removeArea(area.id)} style={{ display:"flex", alignItems:"center", justifyContent:"center", height: FH, width: "100%", borderRadius:8, fontSize:12, fontWeight:700, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", cursor:"pointer", transition:"0.2s" }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addArea} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:700, background:"#eff6ff", color:"#2563eb", border:"1px dashed #93c5fd", cursor:"pointer", transition:"0.2s", width: "fit-content", marginTop: 4 }}>
                <Plus size={14}/> Add Area
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ borderTop:"1px solid #f3f4f6", paddingTop:20 }}>
        <FloatingTextarea label="REMARKS" value={dcrMain.remarks} onChange={e => setDcrMain({...dcrMain, remarks:e.target.value})} />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <SLabel text="1. Doctor Visited Info" />
      {doctors.length === 0 && <p style={emptyStyle}>No doctors added yet.</p>}
      {doctors.map(doc => (
        <div key={doc.id} className="ucr-grid-12">
          <div className="col-span-3"><SingleDropdown label="SELECT DOCTOR *" options={masterData.doctors} value={doc.doctorId} onSelect={v => updateDoctor(doc.id,"doctorId",v)} /></div>
          <div className="col-span-3"><MultiSelectDropdown label="JOINT WORKWITH" options={masterData.employees} selectedIds={doc.jointWorkWith} onChange={v => updateDoctor(doc.id,"jointWorkWith",v)} /></div>
          <div className="col-span-4"><FloatingInput label="REMARKS" value={doc.remarks} onChange={e => updateDoctor(doc.id,"remarks",e.target.value)} /></div>
          <div className="col-span-2" style={{ display:"flex", alignItems:"center" }}>
            <button onClick={() => removeDoctor(doc.id)} style={{ display:"flex", alignItems:"center", justifyContent:"center", height: FH, width: "100%", borderRadius:8, fontSize:12, fontWeight:700, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", cursor:"pointer", transition:"0.2s" }}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <button onClick={addDoctor} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:700, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer", width: "fit-content", boxShadow:"0 2px 6px rgba(37,99,235,0.2)" }}>
        <Plus size={14}/> Add More Doctor
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <span style={{ fontSize:11, fontWeight:700, color:"#2563eb", textTransform:"uppercase", letterSpacing:"0.05em" }}>Choose Type:</span>
        {["Chemist","Stockist"].map(t => (
          <label key={t} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <div style={{
              width:16, height:16, borderRadius:"50%", border: chemistTypeView===t ? "2px solid #2563eb" : "2px solid #d1d5db",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              {chemistTypeView===t && <div style={{ width:8, height:8, borderRadius:"50%", background:"#2563eb" }}/>}
            </div>
            <span style={{ fontSize:13, fontWeight:700, color: chemistTypeView===t ? "#111827" : "#6b7280" }}>{t}</span>
            <input type="radio" style={{ display:"none" }} checked={chemistTypeView===t} onChange={() => {
              setChemistTypeView(t);
              setChemistsStockists([]); // reset old data
            }} />
          </label>
        ))}
      </div>
      <SLabel text={`Provide ${chemistTypeView} Info`} />
      {chemistsStockists.length === 0 && <p style={emptyStyle}>No entries added yet.</p>}
      {chemistsStockists.map(item => (
        <div key={item.id} className="ucr-grid-12">
          <div className="col-span-3"><SingleDropdown label={`SELECT ${item.type === "Chemist" ? "CHEMIST" : "STOCKIST"} *`} options={item.type==="Chemist" ? masterData.chemists : masterData.stockists} value={item.targetId} onSelect={v => updateCS(item.id,"targetId",v)} /></div>
          <div className="col-span-3"><MultiSelectDropdown label="JOINT WORKWITH" options={masterData.employees} selectedIds={item.jointWorkWith} onChange={v => updateCS(item.id,"jointWorkWith",v)} /></div>
          <div className="col-span-4"><FloatingInput label="REMARKS" value={item.remarks} onChange={e => updateCS(item.id,"remarks",e.target.value)} /></div>
          <div className="col-span-2" style={{ display:"flex", alignItems:"center" }}>
            <button onClick={() => removeCS(item.id)} style={{ display:"flex", alignItems:"center", justifyContent:"center", height: FH, width: "100%", borderRadius:8, fontSize:12, fontWeight:700, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", cursor:"pointer", transition:"0.2s" }}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <button onClick={addCS} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:700, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer", width: "fit-content", boxShadow:"0 2px 6px rgba(37,99,235,0.2)" }}>
        <Plus size={14}/> Add More {chemistTypeView}
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <SLabel text="Meeting Details" />
      {meetings.length === 0 && <p style={emptyStyle}>No meetings added yet.</p>}
      {meetings.map(item => (
        <div key={item.id} className="ucr-grid-12">
          <div className="col-span-3"><SingleDropdown label="MEETING WITH *" options={masterData.employees} value={item.meetingWith} onSelect={v => updateMeeting(item.id,"meetingWith",v)} /></div>
          <div className="col-span-3"><FloatingInput label="SUBJECT *" value={item.subject} onChange={e => updateMeeting(item.id,"subject",e.target.value)} /></div>
          <div className="col-span-4"><FloatingInput label="REMARKS" value={item.remarks} onChange={e => updateMeeting(item.id,"remarks",e.target.value)} /></div>
          <div className="col-span-2" style={{ display:"flex", alignItems:"center" }}>
            <button onClick={() => removeMeeting(item.id)} style={{ display:"flex", alignItems:"center", justifyContent:"center", height: FH, width: "100%", borderRadius:8, fontSize:12, fontWeight:700, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", cursor:"pointer", transition:"0.2s" }}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <button onClick={addMeeting} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:700, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer", width: "fit-content", boxShadow:"0 2px 6px rgba(37,99,235,0.2)" }}>
        <Plus size={14}/> Add More Meeting
      </button>
    </div>
  );

  const renderStep5 = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <SLabel text="Expense Declarations" />
      {expenses.length === 0 && <p style={emptyStyle}>No expenses added yet.</p>}
      {expenses.map(item => (
        <div key={item.id} className="ucr-grid-12">
          <div className="col-span-3"><SingleDropdown label="EXPENSE TYPE *" options={EXACT_EXPENSE_TYPES} value={item.expenseType} onSelect={v => updateExpense(item.id,"expenseType",v)} /></div>
          <div className="col-span-3"><FloatingInput label="AMOUNT *" type="number" value={item.amount} onChange={e => updateExpense(item.id,"amount",e.target.value)} /></div>
          <div className="col-span-4"><FloatingInput label="REMARKS" value={item.remarks} onChange={e => updateExpense(item.id,"remarks",e.target.value)} /></div>
          <div className="col-span-2" style={{ display:"flex", alignItems:"center" }}>
            <button onClick={() => removeExpense(item.id)} style={{ display:"flex", alignItems:"center", justifyContent:"center", height: FH, width: "100%", borderRadius:8, fontSize:12, fontWeight:700, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", cursor:"pointer", transition:"0.2s" }}>
              Remove
            </button>
          </div>
        </div>
      ))}
      <button onClick={addExpense} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:700, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer", width: "fit-content", boxShadow:"0 2px 6px rgba(37,99,235,0.2)" }}>
        <Plus size={14}/> Add More Expense
      </button>
    </div>
  );

  const renderStep6 = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* DCR Main */}
      <PreviewCard title="1. DCR Main Overview">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, padding:16, fontSize:13 }}>
          <PreviewField label="Date" value={dcrMain.date || "-"} />
          <PreviewField label="Status" value={dcrMain.workingStatus || "-"} />
          <PreviewField label="Remarks" value={dcrMain.remarks || "-"} span={2} />
        </div>
      </PreviewCard>

      <div className="ucr-grid-2" style={{ marginBottom: 0 }}>
        <PreviewCard title={`2. Doctors Visited (${doctors.length})`}>
          {doctors.length===0 ? <EmptyRow/> : doctors.map((d,i)=>(
            <div key={i} style={previewRow}>
              <span style={{ fontWeight:600, color:"#1d4ed8", fontSize:13 }}>
                {masterData.doctors.find(x=>String(x.id)===String(d.doctorId))?.label || d.doctorId}
              </span>
              <span style={{ color:"#6b7280", fontSize:12, fontStyle:"italic", marginLeft: "auto" }}>{d.remarks || "No remark"}</span>
            </div>
          ))}
        </PreviewCard>
        <PreviewCard title={`3. Chemists/Stockists (${chemistsStockists.length})`}>
          {chemistsStockists.length===0 ? <EmptyRow/> : chemistsStockists.map((c,i)=>(
            <div key={i} style={previewRow}>
              <span style={{ fontSize:9, background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe", padding:"2px 6px", borderRadius:4, fontWeight:700, textTransform:"uppercase", marginRight:6 }}>{c.type}</span>
              <span style={{ fontWeight:600, color:"#111827", fontSize:13 }}>
                {masterData.allChemStock.find(x=>String(x.id)===String(c.targetId))?.label || c.targetId}
              </span>
            </div>
          ))}
        </PreviewCard>
      </div>

      <div className="ucr-grid-2" style={{ marginBottom: 0 }}>
        <PreviewCard title={`4. Meetings (${meetings.length})`}>
          {meetings.length===0 ? <EmptyRow/> : meetings.map((m,i)=>(
            <div key={i} style={{...previewRow, justifyContent:"space-between"}}>
              <span style={{ fontWeight:600, color:"#111827", fontSize:13 }}>
                {masterData.employees.find(x=>String(x.id)===String(m.meetingWith))?.label || m.meetingWith}
              </span>
              <span style={{ color:"#6b7280", fontSize:12, fontStyle:"italic" }}>{m.subject}</span>
            </div>
          ))}
        </PreviewCard>
        <PreviewCard title="5. Expenses" badge={`₹${expenses.reduce((s,e)=>s+Number(e.amount||0),0)}`}>
          {expenses.length===0 ? <EmptyRow/> : expenses.map((e,i)=>(
            <div key={i} style={{...previewRow, justifyContent:"space-between"}}>
              <span style={{ fontWeight:600, color:"#111827", fontSize:13 }}>
                {EXACT_EXPENSE_TYPES.find(x=>String(x.id)===String(e.expenseType))?.label || e.expenseType}
              </span>
              <span style={{ fontFamily:"monospace", fontWeight:700, color:"#374151", background:"#f9fafb", border:"1px solid #e5e7eb", padding:"1px 8px", borderRadius:5, fontSize:13 }}>₹{e.amount}</span>
            </div>
          ))}
        </PreviewCard>
      </div>
    </div>
  );

  // ── main render ────────────────────────────────────────────────────────────
  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>
      
      {errorMsg && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"10px 16px", display:"flex", alignItems:"center", gap:10, color:"#dc2626", fontSize:13, fontWeight:600, marginBottom:16 }}>
          <AlertCircle size={18}/> {errorMsg}
        </div>
      )}

      {message && (
        <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:12, padding:"10px 16px", display:"flex", alignItems:"center", gap:10, color:"#1d4ed8", fontSize:13, fontWeight:600, marginBottom:16 }}>
          <CheckCircle2 size={18}/> {message}
        </div>
      )}

      <div className="ucr-card">
        {/* Header */}
        <div className="ucr-header">
          <div style={{ width:36, height:36, borderRadius:10, background:"#eff6ff", border:"1px solid #dbeafe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <FileText size={17} style={{ color:"#2563eb" }}/>
          </div>
          <div>
            <h2 style={{ fontSize:15, fontWeight:700, color:"#111827", margin:0 }}>Submit DCR</h2>
            <p style={{ fontSize:11, color:"#6b7280", margin:0, marginTop:2 }}>Daily Call Report entry wizard</p>
          </div>
        </div>

        {renderStepper()}

        {/* Body */}
        <div className="ucr-body" style={{ minHeight:350 }}>
          {currentStep === 0 && renderStep1()}
          {currentStep === 1 && renderStep2()}
          {currentStep === 2 && renderStep3()}
          {currentStep === 3 && renderStep4()}
          {currentStep === 4 && renderStep5()}
          {currentStep === 5 && renderStep6()}
        </div>

        {/* Footer */}
        <div className="ucr-footer">
          <button
            onClick={handleBack}
            disabled={currentStep===0 || isSubmitting}
            style={{
              display:"flex", alignItems:"center", gap:6, padding:"8px 20px", borderRadius:9, height: 40,
              fontSize:13, fontWeight:600, border:"1px solid #d1d5db", cursor: currentStep===0 ? "not-allowed" : "pointer",
              background: currentStep===0 ? "#f3f4f6" : "#fff",
              color: currentStep===0 ? "#9ca3af" : "#374151",
              transition:"all 0.15s",
            }}
          >
            <ArrowLeft size={14}/> Back
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button onClick={handleNext} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 24px", borderRadius:9, height: 40, fontSize:13, fontWeight:700, border:"none", cursor:"pointer", background:"#2563eb", color:"#fff", transition:"all 0.15s" }}>
              Next <ChevronRight size={14}/>
            </button>
          ) : (
            <button onClick={handleFinalSubmit} disabled={isSubmitting} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 24px", borderRadius:9, height: 40, fontSize:13, fontWeight:700, border:"none", cursor: isSubmitting ? "not-allowed" : "pointer", background:"#2563eb", color:"#fff", opacity: isSubmitting ? 0.6 : 1, transition:"all 0.15s" }}>
              {isSubmitting ? <Loader2 size={14} style={{ animation:"ucr-spin 1s linear infinite" }}/> : <Save size={14}/>}
              Final Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED STYLES / HELPERS
═══════════════════════════════════════════════════════════════════════════ */
const emptyStyle = { fontSize:13, color:"#9ca3af", fontStyle:"italic", marginTop: 0 };
const previewRow = { padding:"10px 16px", display:"flex", alignItems:"center", borderBottom:"1px solid #f9fafb", gap:6 };

function SLabel({ text }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
      <span style={{ fontSize:13, fontWeight:700, color:"#111827", whiteSpace:"nowrap", textTransform: "uppercase" }}>{text}</span>
      <div style={{ flex:1, height:1, background:"#e5e7eb" }}/>
    </div>
  );
}

function PreviewCard({ title, children, badge }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ background:"#f9fafb", padding:"10px 16px", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h3 style={{ fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.07em", margin:0 }}>{title}</h3>
        {badge && <span style={{ fontSize:12, fontWeight:700, color:"#2563eb", background:"#eff6ff", border:"1px solid #bfdbfe", padding:"2px 8px", borderRadius:6 }}>{badge}</span>}
      </div>
      <div style={{ maxHeight:200, overflowY:"auto" }}>{children}</div>
    </div>
  );
}

function PreviewField({ label, value, span = 1 }) {
  return (
    <div style={{ gridColumn:`span ${span}` }}>
      <p style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{value}</p>
    </div>
  );
}

function EmptyRow() {
  return <p style={{ padding:"14px 16px", fontSize:13, color:"#9ca3af", fontStyle:"italic", margin: 0 }}>None</p>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   INPUT COMPONENTS — ALL FIXED
═══════════════════════════════════════════════════════════════════════════ */

function FloatingInput({ label, type="text", value, onChange, disabled }) {
  const [focus, setFocus] = useState(false);
  const hasVal = Boolean(value?.toString().trim());
  const active = focus || hasVal;

  return (
    <div style={{ position:"relative", width:"100%", height:FH }}>
      <input
        type={type} value={value||""} onChange={onChange} disabled={disabled}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
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
            ) : options.map((opt, i) => {
              const optValue = opt.id ?? opt.value;
              return (
                <div key={i} onMouseDown={e => { e.preventDefault(); onSelect(optValue); setIsOpen(false); }}
                  style={{
                    padding: "10px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
                    background: String(value) === String(optValue) ? "#eff6ff" : "transparent",
                    color: String(value) === String(optValue) ? "#2563eb" : "#374151"
                  }}>
                  {opt.label}
                </div>
              );
            })}
          </div>
        </Portal>
      )}
    </div>
  );
}

function MultiSelectDropdown({ label, options, selectedIds, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);

  const toggleValue = (value) => {
    if (selectedIds.includes(value)) {
      onChange(selectedIds.filter((item) => String(item) !== String(value)));
      return;
    }
    onChange([...selectedIds, String(value)]);
  };

  const selectAll = () => onChange(options.map((option) => String(option.id || option.value)));
  const clearAll = () => onChange([]);

  const selectedLabel = options
    .filter((option) => selectedIds.includes(String(option.id || option.value)))
    .map((option) => option.label)
    .join(", ");

  const hasValue = selectedIds.length > 0;
  const active = isOpen || hasValue;

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
        <span style={{ flex: 1, fontWeight: 600, color: hasValue ? "#111827" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {selectedLabel || " "}
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
          <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectAll();
              }}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#2563eb", border: "none", cursor: "pointer" }}
            >
              Select All
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                clearAll();
              }}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#ef4444", border: "none", cursor: "pointer" }}
            >
              Clear All
            </button>
          </div>

          <div style={{ maxHeight: 250, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
              <p style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", margin: 0, textAlign: "center", fontStyle: "italic" }}>No options available.</p>
            ) : (
              options.map((option) => {
                const optId = String(option.id || option.value);
                const isSelected = selectedIds.includes(optId);
                return (
                  <button
                    key={optId}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleValue(optId);
                    }}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 13, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 10, background: isSelected ? "#eff6ff" : "transparent",
                      color: isSelected ? "#2563eb" : "#4b5563", border: "none", cursor: "pointer"
                    }}
                  >
                    <span
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        border: isSelected ? "2px solid #2563eb" : "2px solid #d1d5db", background: isSelected ? "#2563eb" : "#fff"
                      }}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 10 8" style={{ width: 10, height: 8 }} fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </Portal>
      )}
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

            <div style={{ padding:"10px 12px 4px", background:"#f9fafb", borderBottom:"1px solid #f3f4f6" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, textAlign:"center" }}>
                {DAYS.map(d => (
                  <div key={d} style={{ fontSize:10, fontWeight:700, color:"#9ca3af", padding:"2px 0" }}>{d}</div>
                ))}
              </div>
            </div>

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