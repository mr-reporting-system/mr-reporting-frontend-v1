import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Check, Calendar as CalendarIcon, ChevronDown, ChevronRight, ChevronLeft,
  Save, FileText, CheckCircle2, Loader2, AlertCircle, FileSpreadsheet
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

  .ucr-table-container {
    border: 1px solid #f3f4f6;
    border-radius: 12px;
    overflow-x: auto;
    background: #fff;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }
  .ucr-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1000px; }
  .ucr-table thead { background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
  .ucr-table th { padding: 12px 16px; text-align: left; font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  .ucr-table td { padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }

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
    .ucr-header { padding: 16px; flex-direction: column; align-items: flex-start; }
    .ucr-header > div { width: 100%; }
    .ucr-header > button { align-self: flex-end; margin-top: -30px; }
    .ucr-footer { justify-content: center; flex-direction: column; }
    .ucr-footer > button { width: 100%; justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const INPUT_CLASS = "h-[38px]";
const FH = 40;

// ─── DROPDOWN CONSTANTS ──────────────────────────────────────────────────
const ACTIVITY_OPTIONS = [
  { id: "Working", label: "Working" },
  { id: "Working & Half Day Leave", label: "Working & Half Day Leave" },
  { id: "Leave", label: "Leave" },
  { id: "Meeting", label: "Meeting" },
  { id: "Transit", label: "Transit" },
  { id: "Conference", label: "Conference" },
  { id: "Holiday", label: "Holiday" },
  { id: "Other", label: "Other" },
  { id: "Travel & Working", label: "Travel & Working" }
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function MRSubmitTourProgram() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    date: "",
    activity: "",
    remarks: ""
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [tourData, setTourData] = useState([]); // Real-time table data
  const [managerName, setManagerName] = useState("Loading...");
  
  // Metadata for the table section
  const [tpMetadata, setTpMetadata] = useState({
    submissionDate: "—",
    approvalDate: "—",
    approvedBy: "—"
  });

  // Fetch the assigned manager and initial Tour Program details on mount
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Manager
      try {
        const res = await api.get("/api/employees/managers");
        const managers = res.data?.data || res.data || [];
        const mName = managers.length > 0 ? managers[0].name : "Not Assigned";
        setManagerName(mName);
        setTpMetadata(prev => ({ ...prev, approvedBy: mName }));
      } catch (err) {
        console.error("Failed to fetch manager", err);
        setManagerName("Not Assigned");
        setTpMetadata(prev => ({ ...prev, approvedBy: "Not Assigned" }));
      }

      // 2. Fetch Month Details (GET)
      try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        const res = await api.get(`/api/mr/tour-program/month-detail?month=${month}&year=${year}`);
        const data = res.data?.data || res.data || [];
        
        if (Array.isArray(data)) {
          const mappedData = data.map((item, idx) => ({
            id: item.id || item._id || idx,
            date: item.date ? new Date(item.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : (item.dates?.[0] || "—"),
            submittedActivity: item.activityType || item.submittedActivity || "—",
            approvedActivity: item.approvedActivity || item.status || "Pending",
            submittedDoctor: item.submittedDoctor || "—",
            approvedDoctor: item.approvedDoctor || "—",
            submittedChemist: item.submittedChemist || "—",
            approvedChemist: item.approvedChemist || "—",
            submittedRemark: item.remarks || item.submittedRemark || "—",
            approvedRemark: item.approvedRemark || "—"
          }));
          setTourData(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch tour program details", err);
      }
    };
    
    fetchData();
  }, []);

  // ─── FORM HANDLERS ─────────────────────────────────────────────────────────

  const validateField = (name, val) => {
    let errMsg = "";
    if (name === "date" && !val) errMsg = "Date is required";
    if (name === "activity" && !val) errMsg = "Activity is required";
    
    setFieldErrors(prev => ({ ...prev, [name]: errMsg }));
  };

  const handleInputChange = (eOrName, value) => {
    let name, val;
    if (typeof eOrName === "object" && eOrName.target) {
      name = eOrName.target.name;
      val = eOrName.target.value;
    } else {
      name = eOrName;
      val = value;
    }

    setFormData(prev => ({ ...prev, [name]: val }));
    validateField(name, val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Final Validation Check
    let errors = {};
    if (!formData.date) errors.date = "Date is required";
    if (!formData.activity) errors.activity = "Activity is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("Please fill all required fields (*)");
      return;
    }

    setIsSubmitting(true);

    try {
      // 🚀 NEW POST API INTEGRATION
      const payload = {
        dates: [formData.date], // API expects an array of dates
        activityType: formData.activity,
        remarks: formData.remarks || ""
      };

      await api.post('/api/mr/tour-program/submit', payload);

      // Fetch the updated table data after submission
      try {
        const submittedDate = new Date(formData.date);
        const month = submittedDate.getMonth() + 1;
        const year = submittedDate.getFullYear();
        
        const res = await api.get(`/api/mr/tour-program/month-detail?month=${month}&year=${year}`);
        const data = res.data?.data || res.data || [];
        
        if (Array.isArray(data)) {
          const mappedData = data.map((item, idx) => ({
            id: item.id || item._id || idx,
            date: item.date ? new Date(item.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : (item.dates?.[0] ? new Date(item.dates[0]).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : "—"),
            submittedActivity: item.activityType || item.submittedActivity || "—",
            approvedActivity: item.approvedActivity || item.status || "Pending",
            submittedDoctor: item.submittedDoctor || "—",
            approvedDoctor: item.approvedDoctor || "—",
            submittedChemist: item.submittedChemist || "—",
            approvedChemist: item.approvedChemist || "—",
            submittedRemark: item.remarks || item.submittedRemark || "—",
            approvedRemark: item.approvedRemark || "—"
          }));
          setTourData(mappedData);
        }
      } catch (err) {
        console.error("Failed to refresh table data after submit", err);
        // Fallback: Optimistic UI update if GET fails
        const formattedDate = new Date(formData.date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
        const newEntry = {
          id: Date.now(),
          date: formattedDate,
          submittedActivity: formData.activity,
          approvedActivity: "Pending",
          submittedDoctor: "—",
          approvedDoctor: "—",
          submittedChemist: "—",
          approvedChemist: "—",
          submittedRemark: formData.remarks || "—",
          approvedRemark: "—"
        };
        setTourData(prev => [...prev, newEntry]);
      }

      // Set Metadata dates based on submission
      const todayFormatted = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      setTpMetadata(prev => ({
        ...prev,
        submissionDate: todayFormatted,
        approvalDate: "Pending"
      }));

      setMessage("Tour Program Submitted Successfully!");
      
      // Reset Form Fields
      setFormData({
        date: "",
        activity: "",
        remarks: ""
      });
      setFieldErrors({});

      setTimeout(() => { setMessage(""); }, 3000);
    } catch (error) {
      console.error("Submission failed", error);
      setErrorMsg(error.response?.data?.message || "Failed to submit Tour Program. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.date && formData.activity;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>
      
      {/* Notifications */}
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

      {/* ─── TOP SECTION: SUBMISSION FORM ─── */}
      <div className="ucr-card">
        
        {/* Header */}
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CalendarIcon size={17} style={{ color: "#2563eb" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Tour Program Submission</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>Plan and submit your daily activities</p>
          </div>
        </div>

        <div className="ucr-body">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
            
            <div className="ucr-grid-2" style={{ marginBottom: 0 }}>
              <FloatingDatePicker 
                label="DATE *" 
                value={formData.date} 
                onChange={v => handleInputChange("date", v)} 
                error={fieldErrors.date}
              />
              
              <FloatingSelect 
                label="ACTIVITY *" 
                name="activity" 
                options={ACTIVITY_OPTIONS} 
                value={formData.activity} 
                onSelect={(v) => handleInputChange("activity", v)} 
                error={fieldErrors.activity}
              />
            </div>

            <div style={{ width: "100%" }}>
              <FloatingInput 
                label="REMARKS" 
                name="remarks" 
                value={formData.remarks} 
                onChange={handleInputChange} 
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <button 
                type="submit" 
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 32px", height: FH, borderRadius: 8,
                  fontSize: 13, fontWeight: 700, border: "none", cursor: (!isFormValid || isSubmitting) ? "not-allowed" : "pointer",
                  background: (!isFormValid || isSubmitting) ? "#f3f4f6" : "#2563eb",
                  color: (!isFormValid || isSubmitting) ? "#9ca3af" : "#fff",
                  transition: "all 0.15s"
                }}
              >
                {isSubmitting ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Save size={16} />}
                Submit TP
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* ─── BOTTOM SECTION: TABLE DETAILS ─── */}
      <div className="ucr-card">
        
        {/* Table Header Area */}
        <div className="ucr-header" style={{ flexDirection: "column", alignItems: "flex-start", background: "#f9fafb" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <FileSpreadsheet size={16} style={{ color: "#2563eb" }} />
            Tour Program Details
          </h2>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", background: "#fff", padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", marginTop: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", margin: 0 }}>Submission Date : <span style={{ fontWeight: 700, color: "#111827" }}>{tpMetadata.submissionDate}</span></p>
            <div style={{ width: 1, height: 16, background: "#d1d5db" }} className="hide-on-mobile"></div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", margin: 0 }}>Approval Date : <span style={{ fontWeight: 700, color: "#111827" }}>{tpMetadata.approvalDate}</span></p>
            <div style={{ width: 1, height: 16, background: "#d1d5db" }} className="hide-on-mobile"></div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", margin: 0 }}>Approved By : <span style={{ fontWeight: 700, color: "#2563eb" }}>{tpMetadata.approvedBy}</span></p>
          </div>
        </div>

        {/* Table Content */}
        <div className="ucr-body" style={{ padding: 0 }}>
          <div className="ucr-table-container" style={{ border: "none", borderRadius: "0 0 16px 16px" }}>
            <table className="ucr-table" style={{ minWidth: 1400 }}>
              <thead>
                <tr>
                  <th style={{ borderRight: "1px solid #f3f4f6" }}>Date</th>
                  <th style={{ borderRight: "1px solid #f3f4f6" }}>Submitted Activity</th>
                  <th style={{ borderRight: "1px solid #f3f4f6" }}>Approved Activity</th>
                  <th style={{ textAlign: "center", borderRight: "1px solid #f3f4f6" }}>Submitted Doctor</th>
                  <th style={{ textAlign: "center", borderRight: "1px solid #f3f4f6" }}>Approved Doctor</th>
                  <th style={{ textAlign: "center", borderRight: "1px solid #f3f4f6" }}>Submitted Chemist</th>
                  <th style={{ textAlign: "center", borderRight: "1px solid #f3f4f6" }}>Approved Chemist</th>
                  <th style={{ borderRight: "1px solid #f3f4f6" }}>Submitted Remark</th>
                  <th>Approved Remark</th>
                </tr>
              </thead>
              <tbody>
                {tourData.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                      No tour programs submitted yet. Fill the form above to add an entry.
                    </td>
                  </tr>
                ) : (
                  tourData.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 700, color: "#111827", borderRight: "1px solid #f3f4f6" }}>{row.date}</td>
                      <td style={{ fontWeight: 700, color: "#2563eb", borderRight: "1px solid #f3f4f6" }}>{row.submittedActivity}</td>
                      <td style={{ fontWeight: 600, color: "#6b7280", borderRight: "1px solid #f3f4f6" }}>{row.approvedActivity}</td>
                      <td style={{ textAlign: "center", color: "#9ca3af", borderRight: "1px solid #f3f4f6" }}>{row.submittedDoctor}</td>
                      <td style={{ textAlign: "center", color: "#9ca3af", borderRight: "1px solid #f3f4f6" }}>{row.approvedDoctor}</td>
                      <td style={{ textAlign: "center", color: "#9ca3af", borderRight: "1px solid #f3f4f6" }}>{row.submittedChemist}</td>
                      <td style={{ textAlign: "center", color: "#9ca3af", borderRight: "1px solid #f3f4f6" }}>{row.approvedChemist}</td>
                      <td style={{ color: "#4b5563", borderRight: "1px solid #f3f4f6" }}>{row.submittedRemark}</td>
                      <td style={{ color: "#9ca3af" }}>{row.approvedRemark}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CUSTOM UI COMPONENTS - STRICT FIDELITY TO SUBMITDCR STYLING
// ═══════════════════════════════════════════════════════════════════

function FloatingInput({ label, name, type = "text", value, onChange, disabled, error }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasVal = Boolean(value?.toString().trim());
  const active = isFocused || hasVal;

  return (
    <div style={{ position:"relative", width:"100%", height:FH }}>
      <input
        type={type} id={name} name={name} value={value||""} onChange={onChange} disabled={disabled}
        onFocus={()=>setIsFocused(true)} onBlur={()=>setIsFocused(false)}
        style={{
          width:"100%", height:"100%", borderRadius:8, padding:"0 12px",
          fontSize:13, color:"#111827", outline:"none", boxSizing:"border-box", fontWeight: 600,
          background: disabled ? "#f9fafb" : "#fff",
          border: error ? "1.5px solid #ef4444" : active && !disabled ? "1.5px solid #2563eb" : "1.5px solid #d1d5db",
          transition:"all 0.15s",
        }}
      />
      <label style={{
        position:"absolute", left:10, pointerEvents:"none", zIndex:10,
        transition:"all 0.15s", fontWeight:600, letterSpacing:"0.03em",
        top: active ? -9 : 12,
        fontSize: active ? 10 : 12,
        color: error ? "#ef4444" : disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"),
        background: disabled ? (active ? "#f9fafb" : "transparent") : "#fff",
        padding: active ? "0 4px" : "0",
      }}>
        {label}
      </label>
      {error && <span style={{ position: "absolute", bottom: -18, left: 4, fontSize: 10, color: "#ef4444", fontWeight: 700 }}>{error}</span>}
    </div>
  );
}

function FloatingSelect({ label, name, value, onSelect, disabled, options = [], error }) {
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
    <div className="relative w-full select-none mt-1" style={{ marginBottom: error ? 18 : 0 }}>
      <div
        ref={ref}
        onClick={openMenu}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex",
          alignItems: "center", border: error ? "1.5px solid #ef4444" : `1.5px solid ${active && !disabled ? "#2563eb" : "#d1d5db"}`,
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
          fontWeight: 600, color: error ? "#ef4444" : disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"), background: disabled ? (active ? "#f3f4f6" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}
      >
        {label}
      </label>

      {error && <span style={{ position: "absolute", bottom: -18, left: 4, fontSize: 10, color: "#ef4444", fontWeight: 700 }}>{error}</span>}

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

function FloatingDatePicker({ label, value, onChange, disabled, error }) {
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
    <div className="relative w-full select-none mt-1" style={{ marginBottom: error ? 18 : 0 }}>
      <div
        ref={ref}
        onClick={openMenu}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex",
          alignItems: "center", border: error ? "1.5px solid #ef4444" : `1.5px solid ${active && !disabled ? "#2563eb" : "#d1d5db"}`,
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
          fontWeight: 600, color: error ? "#ef4444" : disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"), background: disabled ? (active ? "#f3f4f6" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}
      >
        {label}
      </label>

      {error && <span style={{ position: "absolute", bottom: -18, left: 4, fontSize: 10, color: "#ef4444", fontWeight: 700 }}>{error}</span>}

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