import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, Save, Trash2, FileSpreadsheet, Edit2,
  CheckCircle2, AlertCircle, MapPin, Check, X, ChevronDown
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
  .ucr-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 800px; }
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
    .ucr-header { padding: 16px; }
    .ucr-footer { justify-content: center; flex-direction: column; }
    .ucr-footer > button { width: 100%; justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const INPUT_CLASS = "h-[38px]";
const FH = 40;

// ─── Constants ─────────────────────────────────────────────────────────────
const AREA_TYPES = [
  { id: "HQ", label: "HQ (Headquarter)" },
  { id: "EX", label: "EX (Ex-station)" }
];

const EMPTY_FORM = { areaName: "", areaCode: "", areaType: "" };

// ─── Parse backend errors into human-readable messages ─────────────────────
const parseApiError = (error) => {
  const raw =
    error?.response?.data?.message ||
    error?.response?.data ||
    error?.message || "";
  const str = typeof raw === "string" ? raw : JSON.stringify(raw);

  if (str.includes("duplicate key") && str.includes("area_code"))
    return "Area Code already exists. Please use a different code or leave it blank.";
  if (str.includes("duplicate key") && str.includes("area_name"))
    return "Area Name already exists. Please use a different name.";
  if (str.includes("duplicate key"))
    return "A record with this data already exists. Please check your entries.";
  if (str.includes("not found") || str.includes("404"))
    return "Area not found. It may have already been deleted.";
  if (str.toLowerCase().includes("network") || error?.code === "ERR_NETWORK")
    return "Network error. Please check your connection and try again.";
  return str || "Operation failed. Please try again.";
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function MRAreaCreation() {
  const [areas, setAreas]           = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterMode, setFilterMode] = useState(true);
  const [message, setMessage]       = useState({ type: "", text: "" });
  const [editId, setEditId]         = useState(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  // ─── Flash message helper ─────────────────────────────────────────────────
  const showMessage = (type, text, ms = 4500) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), ms);
  };

  // ─── API: GET /api/mr/area-creation/areas ─────────────────────────────────
  useEffect(() => { fetchAreas(); }, []);

  const fetchAreas = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/mr/area-creation/areas");
      setAreas(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Fetch areas failed:", err);
      setAreas([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── API: POST / PUT
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const errors = {};
    if (!formData.areaName.trim()) errors.areaName = "Area Name is required!!!";
    if (!formData.areaType)        errors.areaType  = "Area Type is required!!!";
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    const payload = {
      areaName: formData.areaName.trim(),
      areaCode: formData.areaCode.trim(),
      areaType: formData.areaType
    };

    try {
      if (editId) {
        await api.put(`/api/mr/area-creation/areas/${editId}`, payload);
        showMessage("success", "Area updated successfully!");
      } else {
        await api.post("/api/mr/area-creation/areas", payload);
        showMessage("success", "Area created successfully!");
      }

      resetForm();
      fetchAreas();

    } catch (err) {
      console.error("Submit failed:", err);
      showMessage("error", parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── API: DELETE
  const handleDelete = async (id) => {
    try {
      if (!id) throw new Error("Invalid Area ID");

      const confirmDelete = window.confirm("Are you sure you want to delete this area?");
      if (!confirmDelete) return;

      await api.delete(`/api/mr/area-creation/areas/${id}`);

      showMessage("success", "Area deleted successfully.");
      fetchAreas();

    } catch (err) {
      console.error("Delete failed:", err);
      showMessage("error", parseApiError(err) || "Something went wrong while deleting.");
    }
  };

  // ─── Edit helpers ─────────────────────────────────────────────────────────
  const handleEditClick = (area) => {
    setEditId(area.id || area._id);
    setFormData({
      areaName: area.areaName || area.area_name || "",
      areaCode: area.areaCode || area.area_code || "",
      areaType: area.areaType || area.type        || ""
    });
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditId(null);
    setFormData(EMPTY_FORM);
    setFieldErrors({});
  };

  // ─── Field handlers ───────────────────────────────────────────────────────
  const validateField = (name, val) => {
    const msg =
      name === "areaName" && !val.trim() ? "Area Name is required!!!" :
      name === "areaType" && !val         ? "Area Type is required!!!"  : "";
    setFieldErrors(prev => ({ ...prev, [name]: msg }));
  };

  const handleInputChange = (eOrName, value) => {
    if (typeof eOrName === "object") {
      const { name, value: v } = eOrName.target;
      setFormData(prev => ({ ...prev, [name]: v }));
      validateField(name, v);
    } else {
      setFormData(prev => ({ ...prev, [eOrName]: value }));
      validateField(eOrName, value);
    }
  };

  const isFormValid = formData.areaName.trim() !== "" && formData.areaType !== "";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>

      {/* ── Flash notification ── */}
      {message.text && (
        <div style={{
          background: message.type === "error" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          borderRadius: 12, padding: "10px 16px",
          color: message.type === "error" ? "#dc2626" : "#16a34a",
          fontSize: 13, fontWeight: 600, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8
        }}>
          {message.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {message.text}
        </div>
      )}

      {/* ══ FORM CARD ══════════════════════════════════════════════════════════ */}
      <div className="ucr-card">
        <div className="ucr-header" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MapPin size={17} style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
                {editId ? "Edit Employee Area" : "Employee Area Creation"}
              </h2>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>
                Manage headquarters and ex-stations
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>FILTER</span>
            <button
              onClick={() => setFilterMode(p => !p)}
              style={{
                width: 34, height: 18, borderRadius: 20, background: filterMode ? "#2563eb" : "#d1d5db",
                position: "relative", cursor: "pointer", transition: "0.2s", border: "none"
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 2, left: filterMode ? 18 : 2, transition: "0.2s"
              }} />
            </button>
          </div>
        </div>

        <div className="ucr-body">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
            
            <div style={{ flex: "1 1 200px" }}>
              <FloatingInput
                label="AREA NAME *" name="areaName"
                value={formData.areaName} onChange={handleInputChange}
                error={fieldErrors.areaName}
              />
            </div>

            <div style={{ flex: "1 1 200px" }}>
              <FloatingInput
                label="AREA CODE" name="areaCode"
                value={formData.areaCode} onChange={handleInputChange}
              />
            </div>

            <div style={{ flex: "1 1 200px" }}>
              <FloatingSelect
                label="AREA TYPE *" name="areaType"
                options={AREA_TYPES} value={formData.areaType}
                onSelect={(val) => handleInputChange("areaType", val)}
                error={fieldErrors.areaType}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                style={{
                  height: FH, padding: "0 24px", borderRadius: 8, background: (!isFormValid || isSubmitting) ? "#f3f4f6" : "#2563eb",
                  color: (!isFormValid || isSubmitting) ? "#9ca3af" : "#fff",
                  fontSize: 13, fontWeight: 700, border: (!isFormValid || isSubmitting) ? "1px solid #e5e7eb" : "none",
                  cursor: (!isFormValid || isSubmitting) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "0.2s"
                }}
              >
                {isSubmitting ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : editId ? <Save size={16} /> : <Check size={16} />}
                {editId ? "Update Area" : "Create Area"}
              </button>

              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    height: 24, fontSize: 11, fontWeight: 700, color: "#6b7280", background: "none", border: "none",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                  }}
                >
                  <X size={13} /> Cancel Edit
                </button>
              )}
            </div>

          </form>
        </div>
      </div>

      {/* ══ TABLE CARD ═════════════════════════════════════════════════════════ */}
      <div className="ucr-card">
        <div className="ucr-header" style={{ justifyContent: "space-between", background: "#f9fafb" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Employee Area List</h2>
          <button
            title="Export"
            style={{
              height: 32, width: 32, borderRadius: 6, background: "#eff6ff", border: "1px solid #dbeafe",
              color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}
          >
            <FileSpreadsheet size={16} />
          </button>
        </div>

        <div className="ucr-body" style={{ padding: 0 }}>
          <div className="ucr-table-container" style={{ border: "none", borderRadius: "0 0 16px 16px", position: "relative" }}>
            
            {isLoading && (
              <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={28} style={{ color: "#2563eb", animation: "ucr-spin 1s linear infinite" }} />
              </div>
            )}

            <table className="ucr-table">
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: "center" }}>#</th>
                  <th>Area Name</th>
                  <th>Area Code</th>
                  <th style={{ textAlign: "center" }}>Type</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "center", width: 60 }}>Edit</th>
                  <th style={{ textAlign: "center", width: 60 }}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && areas.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                      No areas found. Create one above.
                    </td>
                  </tr>
                ) : areas.map((row, idx) => {
                  const id         = row.id || row._id;
                  const areaName   = row.areaName  || row.area_name  || "—";
                  const areaCode   = row.areaCode  || row.area_code  || "—";
                  const areaType   = row.areaType  || row.type       || "—";
                  const isActive   = String(row.status ?? row.isActive ?? true) === "true";

                  return (
                    <tr key={id}>
                      <td style={{ color: "#6b7280", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700 }}>{areaName}</td>
                      <td style={{ fontWeight: 600 }}>{areaCode}</td>

                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                          background: areaType === "HQ" ? "#eff6ff" : "#f5f3ff",
                          color: areaType === "HQ" ? "#1d4ed8" : "#7e22ce"
                        }}>
                          {areaType}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                          background: isActive ? "#ecfdf5" : "#fef2f2",
                          color: isActive ? "#047857" : "#b91c1c"
                        }}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleEditClick(row)}
                          title="Edit"
                          style={{
                            width: 28, height: 28, borderRadius: "50%", background: "none", border: "none",
                            color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", margin: "0 auto"
                          }}
                        >
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleDelete(id)}
                          title="Delete"
                          style={{
                            width: 28, height: 28, borderRadius: "50%", background: "none", border: "none",
                            color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", margin: "0 auto"
                          }}
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
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

function FloatingSelect({ label, name, value, onSelect, options = [], disabled, error }) {
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

function Portal({ top, left, width, onClose, children }) {
  const ref = useRef(null);
  
  useEffect(() => {
    const t = setTimeout(() => {
      const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
    }, 10);
    return () => clearTimeout(t);
  }, [onClose]);
  
  return (
    <div ref={ref} style={{ position: "fixed", top, left, width, zIndex: 9999 }} className="dropdown-portal bg-white border border-[#e5e7eb] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      {children}
    </div>
  );
}