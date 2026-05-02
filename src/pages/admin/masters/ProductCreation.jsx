import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, Check, AlertCircle, CheckCircle2,
  MapPin, Package, Tag, Hash, Layers,
  FlaskConical, DollarSign, ChevronDown
} from "lucide-react";
import api from "../../../services/api";

export default function ProductCreation() {
  const [isLoading,    setIsLoading]    = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");
  const [popup,        setPopup]        = useState({ isOpen: false, message: "" });

  const [states, setStates] = useState([]);

  const [formData, setFormData] = useState({
    selectedStateIds:   [],
    productName:        "",
    productCode:        "",
    productType:        "",
    productShortName:   "",
    productPackageSize: "",
    samplePackageSize:  "",
    ptw:                "",
    ptr:                "",
    mrp:                "",
    sampleRate:         "",
    includeVat:         "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => { fetchStates(); }, []);

  const fetchStates = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/masters/states");
      if (res.data?.success) setStates(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch states", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    let errMsg = "";
    if (value) {
      if (name === "mrp" && isNaN(Number(value))) errMsg = "MRP must be a number.";
      if (name === "ptw" && isNaN(Number(value))) errMsg = "PTW must be a number.";
      if (name === "ptr" && isNaN(Number(value))) errMsg = "PTR must be a number.";
    }
    setFieldErrors(prev => ({ ...prev, [name]: errMsg }));
  };

  const handleStateToggle = (id) => {
    setFormData(prev => ({
      ...prev,
      selectedStateIds: prev.selectedStateIds.includes(id)
        ? prev.selectedStateIds.filter(s => s !== id)
        : [...prev.selectedStateIds, id]
    }));
  };

  const handleSelectAllStates   = () => setFormData(prev => ({ ...prev, selectedStateIds: states.map(s => s.id) }));
  const handleDeselectAllStates = () => setFormData(prev => ({ ...prev, selectedStateIds: [] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");

    if (!formData.productName.trim()) return setError("Product Name is required.");
    if (!formData.mrp)                return setError("MRP is required.");
    if (!formData.ptr)                return setError("PTR is required.");
    if (!formData.ptw)                return setError("PTW is required.");
    if (Object.values(fieldErrors).some(v => v))
      return setError("Please fix the highlighted errors before submitting.");

    setIsSubmitting(true);

    const payload = {
      stateIds:           formData.selectedStateIds,
      productName:        formData.productName.trim(),
      productCode:        formData.productCode.trim()        || null,
      productType:        formData.productType.trim()        || null,
      productShortName:   formData.productShortName.trim()   || null,
      packageSize:        formData.productPackageSize.trim() || null,
      samplePackageSize:  formData.samplePackageSize.trim()  || null,
      ptw:                formData.ptw        ? parseFloat(formData.ptw)        : null,
      ptr:                formData.ptr        ? parseFloat(formData.ptr)        : null,
      mrp:                formData.mrp        ? parseFloat(formData.mrp)        : null,
      sampleRate:         formData.sampleRate ? parseFloat(formData.sampleRate) : null,
      includeVat:         formData.includeVat || null,
    };

    try {
      const res = await api.post("/api/masters/products", payload);
      if (res.data?.success || res.status === 200 || res.status === 201) {
        setPopup({ isOpen: true, message: "Product Created Successfully!" });
        setFormData({
          selectedStateIds: [], productName: "", productCode: "",
          productType: "", productShortName: "", productPackageSize: "",
          samplePackageSize: "", ptw: "", ptr: "", mrp: "", sampleRate: "", includeVat: "",
        });
        setFieldErrors({});
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create product.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.productName.trim() && formData.mrp && formData.ptr && formData.ptw;

  return (
    <div style={{ width: "100%", paddingBottom: 48, fontFamily: "Inter, sans-serif" }}>

      {/* ── Main Card ───────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        border: "1px solid #f3f4f6", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 24px", borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#eff6ff", border: "1px solid #dbeafe",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Package size={17} style={{ color: "#2563eb" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
              Product Creation Form
            </h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>
              Fill in product details and rate information.
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Alerts */}
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12,
              padding: "10px 16px", display: "flex", alignItems: "center",
              gap: 10, color: "#dc2626", fontSize: 13, fontWeight: 600,
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {successMsg && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12,
              padding: "10px 16px", display: "flex", alignItems: "center",
              gap: 10, color: "#16a34a", fontSize: 13, fontWeight: 600,
            }}>
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>

            {/* Select State */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 300px))", gap: 16 }}>
              <MultiStateSelect
                label="SELECT STATE *"
                states={states}
                selectedIds={formData.selectedStateIds}
                onToggle={handleStateToggle}
                onSelectAll={handleSelectAllStates}
                onDeselectAll={handleDeselectAllStates}
              />
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #f3f4f6" }} />

            {/* Product Information */}
            <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <SectionLabel text="Product Information" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                <FloatingInput label="PRODUCT NAME *"       name="productName"        value={formData.productName}        onChange={handleInputChange} required icon={Package} />
                <FloatingInput label="PRODUCT CODE"         name="productCode"        value={formData.productCode}        onChange={handleInputChange} icon={Hash} />
                <FloatingInput label="PRODUCT TYPE"         name="productType"        value={formData.productType}        onChange={handleInputChange} icon={Tag} />
                <FloatingInput label="PRODUCT SHORT NAME"   name="productShortName"   value={formData.productShortName}   onChange={handleInputChange} icon={Layers} />
                <FloatingInput label="PRODUCT PACKAGE SIZE" name="productPackageSize" value={formData.productPackageSize} onChange={handleInputChange} icon={FlaskConical} />
                <FloatingInput label="SAMPLE PACKAGE SIZE"  name="samplePackageSize"  value={formData.samplePackageSize}  onChange={handleInputChange} icon={FlaskConical} />
              </div>
            </section>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #f3f4f6" }} />

            {/* Product Rate Information */}
            <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <SectionLabel text="Product Rate Information" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                <FloatingInput label="PTW *"        name="ptw"        value={formData.ptw}        onChange={handleInputChange} type="number" icon={DollarSign} error={fieldErrors.ptw} required />
                <FloatingInput label="PTR *"        name="ptr"        value={formData.ptr}        onChange={handleInputChange} type="number" icon={DollarSign} error={fieldErrors.ptr} required />
                <FloatingInput label="MRP *"        name="mrp"        value={formData.mrp}        onChange={handleInputChange} type="number" icon={DollarSign} error={fieldErrors.mrp} required />
                <FloatingInput label="SAMPLE RATE"  name="sampleRate" value={formData.sampleRate} onChange={handleInputChange} type="number" icon={DollarSign} />
                <FloatingInput label="INCLUDE VAT"  name="includeVat" value={formData.includeVat} onChange={handleInputChange} icon={Tag} />
              </div>
            </section>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #f3f4f6" }} />

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "9px 28px", borderRadius: 9, border: "none",
                  fontSize: 13, fontWeight: 700, cursor: canSubmit && !isSubmitting ? "pointer" : "not-allowed",
                  background: canSubmit && !isSubmitting ? "#2563eb" : "#f3f4f6",
                  color: canSubmit && !isSubmitting ? "#fff" : "#9ca3af",
                  boxShadow: canSubmit && !isSubmitting ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: "all 0.15s",
                }}
              >
                {isSubmitting
                  ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                  : <Check size={15} />}
                Submit Product
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* ── Success Popup ────────────────────────────────────────────────── */}
      {popup.isOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            padding: "32px 28px", maxWidth: 320, width: "100%",
            margin: "0 16px", display: "flex", flexDirection: "column",
            alignItems: "center",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#eff6ff", border: "4px solid #dbeafe",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 20,
            }}>
              <Check size={30} style={{ color: "#2563eb" }} strokeWidth={3} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", textAlign: "center", marginBottom: 24 }}>
              {popup.message}
            </h3>
            <button
              onClick={() => setPopup({ isOpen: false, message: "" })}
              style={{
                background: "#2563eb", color: "#fff", width: "100%",
                padding: "10px 0", borderRadius: 9, border: "none",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                transition: "all 0.15s",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
    </div>
  );
}

// ─── FloatingInput ────────────────────────────────────────────────────────────
function FloatingInput({ label, name, type = "text", value, onChange, required, disabled, icon: Icon, error }) {
  const [focus, setFocus] = useState(false);
  const hasVal = Boolean(value?.toString().trim());
  const active = focus || hasVal;

  const borderColor = error
    ? focus ? "#ef4444" : "#f87171"
    : focus ? "#2563eb" : hasVal ? "#2563eb" : "#d1d5db";

  const boxShadow = error
    ? focus ? "0 0 0 3px rgba(239,68,68,0.08)" : "none"
    : focus ? "0 0 0 3px rgba(37,99,235,0.08)" : "none";

  const labelColor = error
    ? "#ef4444"
    : focus ? "#2563eb" : hasVal ? "#6b7280" : "#9ca3af";

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", width: "100%", height: 38 }}>
        <input
          type={type} id={name} name={name}
          value={value || ""} onChange={onChange}
          required={required} placeholder=" " disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: "100%", height: "100%", borderRadius: 8,
            padding: "0 36px 0 12px",
            fontSize: 13, color: "#111827", outline: "none",
            boxSizing: "border-box",
            background: disabled ? "#f9fafb" : "#fff",
            border: `1.5px solid ${borderColor}`,
            boxShadow,
            transition: "all 0.15s",
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
        {/* Floating label */}
        <label
          htmlFor={name}
          style={{
            position: "absolute", left: 10, pointerEvents: "none", zIndex: 10,
            transition: "all 0.15s", fontWeight: 600, letterSpacing: "0.03em",
            top: active ? -9 : 10,
            fontSize: active ? 10 : 13,
            color: active ? labelColor : "#9ca3af",
            background: active ? "#fff" : "transparent",
            padding: active ? "0 4px" : "0",
          }}
        >
          {label}
        </label>
        {/* Icon */}
        {Icon && (
          <div style={{
            position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)", pointerEvents: "none",
            color: error ? "#f87171" : hasVal ? "#2563eb" : "#9ca3af",
            display: "flex", alignItems: "center",
          }}>
            <Icon size={15} />
          </div>
        )}
      </div>
      {error && (
        <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontWeight: 600, paddingLeft: 4 }}>
          {label.replace(" *", "")} is required!!!
        </p>
      )}
    </div>
  );
}

// ─── MultiStateSelect ─────────────────────────────────────────────────────────
function MultiStateSelect({ label, states, selectedIds, onToggle, onSelectAll, onDeselectAll }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasValue    = selectedIds.length > 0;
  const active      = isOpen || hasValue;
  const displayText = hasValue
    ? states.filter(s => selectedIds.includes(s.id)).map(s => s.state_name).join(", ")
    : "";

  const borderColor = isOpen ? "#2563eb" : hasValue ? "#2563eb" : "#d1d5db";
  const boxShadow   = isOpen ? "0 0 0 3px rgba(37,99,235,0.08)" : "none";

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", userSelect: "none", zIndex: isOpen ? 100 : 1 }}>

      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%", height: 38, borderRadius: 8,
          padding: "0 36px 0 12px",
          fontSize: 13, display: "flex", alignItems: "center",
          cursor: "pointer", background: "#fff",
          border: `1.5px solid ${borderColor}`,
          boxShadow,
          transition: "all 0.15s", boxSizing: "border-box",
        }}
      >
        <span style={{
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontWeight: 600, color: hasValue ? "#111827" : "transparent",
        }}>
          {displayText || " "}
        </span>
        <div style={{
          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
          display: "flex", alignItems: "center", gap: 2, pointerEvents: "none",
          color: isOpen ? "#2563eb" : "#9ca3af",
        }}>
          <MapPin size={13} style={{ opacity: 0.7 }} />
          <ChevronDown
            size={14}
            style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          />
        </div>
      </div>

      {/* Floating label */}
      <label style={{
        position: "absolute", left: 10, pointerEvents: "none", zIndex: 11,
        transition: "all 0.15s", fontWeight: 600, letterSpacing: "0.03em",
        top: active ? -9 : 10,
        fontSize: active ? 10 : 13,
        color: isOpen ? "#2563eb" : hasValue ? "#6b7280" : "#9ca3af",
        background: active ? "#fff" : "transparent",
        padding: active ? "0 4px" : "0",
      }}>
        {label}
      </label>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 5px)", left: 0, width: "100%",
          background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden",
        }}>
          {/* Select/Deselect All */}
          <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); onSelectAll(); }}
              style={{
                flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700,
                color: "#fff", background: "#2563eb", border: "none",
                cursor: "pointer", transition: "background 0.15s",
              }}
            >
              Select All
            </button>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); onDeselectAll(); }}
              style={{
                flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700,
                color: "#fff", background: "#ef4444", border: "none",
                cursor: "pointer", transition: "background 0.15s",
              }}
            >
              Deselect All
            </button>
          </div>

          {/* List */}
          <ul style={{ maxHeight: 220, overflowY: "auto", padding: "4px 0", margin: 0, listStyle: "none" }}>
            {states.map(s => {
              const isSel = selectedIds.includes(s.id);
              return (
                <li
                  key={s.id}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onToggle(s.id); }}
                  style={{
                    padding: "9px 12px", fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                    background: isSel ? "#eff6ff" : "transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Custom checkbox */}
                  <div style={{
                    width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                    border: isSel ? "none" : "1.5px solid #d1d5db",
                    background: isSel ? "#2563eb" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {isSel && <Check size={9} style={{ color: "#fff" }} />}
                  </div>
                  <span style={{ fontWeight: isSel ? 600 : 400, color: isSel ? "#2563eb" : "#374151" }}>
                    {s.state_name}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}