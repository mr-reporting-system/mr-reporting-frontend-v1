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
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        {/* <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-sky-400" /> */}

        <div className="p-6 sm:p-8 space-y-8">

          {/* Header */}
          <div className="border-b border-gray-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Product Creation Form</h2>
                <p className="text-xs text-gray-500 mt-0.5">Fill in product details and rate information.</p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-sm">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg border border-emerald-100 text-sm">
              <CheckCircle2 size={15} className="flex-shrink-0" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Select State */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="lg:col-span-1">
                <MultiStateSelect
                  label="SELECT STATE *"
                  states={states}
                  selectedIds={formData.selectedStateIds}
                  onToggle={handleStateToggle}
                  onSelectAll={handleSelectAllStates}
                  onDeselectAll={handleDeselectAllStates}
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Product Information */}
            <section className="space-y-5">
              <SectionLabel text="Product Information" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <FloatingInput label="PRODUCT NAME *"    name="productName"       value={formData.productName}       onChange={handleInputChange} required icon={Package} />
                <FloatingInput label="PRODUCT CODE"      name="productCode"       value={formData.productCode}       onChange={handleInputChange} icon={Hash} />
                <FloatingInput label="PRODUCT TYPE"      name="productType"       value={formData.productType}       onChange={handleInputChange} icon={Tag} />
                <FloatingInput label="PRODUCT SHORT NAME" name="productShortName" value={formData.productShortName}  onChange={handleInputChange} icon={Layers} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <FloatingInput label="PRODUCT PACKAGE SIZE" name="productPackageSize" value={formData.productPackageSize} onChange={handleInputChange} icon={FlaskConical} />
                <FloatingInput label="SAMPLE PACKAGE SIZE"  name="samplePackageSize"  value={formData.samplePackageSize}  onChange={handleInputChange} icon={FlaskConical} />
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Product Rate Information */}
            <section className="space-y-5">
              <SectionLabel text="Product Rate Information" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <FloatingInput label="PTW"   name="ptw"  value={formData.ptw}  onChange={handleInputChange} type="number" icon={DollarSign} error={fieldErrors.ptw} required />
                <FloatingInput label="PTR"   name="ptr"  value={formData.ptr}  onChange={handleInputChange} type="number" icon={DollarSign} error={fieldErrors.ptr} required />
                <FloatingInput label="MRP *" name="mrp"  value={formData.mrp}  onChange={handleInputChange} type="number" icon={DollarSign} error={fieldErrors.mrp} required />
                <FloatingInput label="SAMPLE RATE" name="sampleRate" value={formData.sampleRate} onChange={handleInputChange} type="number" icon={DollarSign} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <FloatingInput label="INCLUDE VAT" name="includeVat" value={formData.includeVat} onChange={handleInputChange} icon={Tag} />
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold
                  transition-all active:scale-95
                  ${canSubmit
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                {isSubmitting
                  ? <Loader2 size={16} className="animate-spin" />
                  : <span className="font-bold text-base leading-none">✓</span>}
                Submit Product
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Popup */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-7 max-w-xs w-full mx-4 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 border-4 border-blue-100 bg-blue-50 rounded-full flex items-center justify-center mb-5">
              <Check size={32} className="text-blue-500" strokeWidth={3} />
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-6">{popup.message}</h3>
            <button
              onClick={() => setPopup({ isOpen: false, message: "" })}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-lg font-bold transition-all active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{text}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ─── FloatingInput ────────────────────────────────────────────────────────────
function FloatingInput({ label, name, type = "text", value, onChange, required, disabled, icon: Icon, error }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(value?.toString().trim());

  const borderClass = error
    ? isFocused ? "border-red-500 ring-2 ring-red-100" : "border-red-400"
    : hasValue
      ? isFocused ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400"
      : isFocused ? "border-gray-400 ring-2 ring-gray-100" : "border-gray-300";

  const labelColor = error
    ? "text-red-500"
    : hasValue ? "text-blue-500" : isFocused ? "text-gray-500" : "text-gray-400";

  const labelPos = hasValue || isFocused ? "-top-2.5 text-[11px]" : "top-[11px] text-sm";

  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full">
        <input
          type={type} id={name} name={name}
          value={value || ""} onChange={onChange}
          required={required} placeholder=" " disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full rounded-lg border-2 bg-white pl-4 pr-10 py-[10px] text-sm text-gray-900
            transition-all focus:outline-none
            ${disabled ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed" : borderClass}`}
        />
        <label htmlFor={name}
          className={`absolute left-3 px-1 bg-white pointer-events-none z-10
            transition-all duration-200 font-semibold ${labelPos} ${labelColor}
            ${disabled ? "!text-gray-400" : ""}`}>
          {label}
        </label>
        {Icon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Icon className={`h-[16px] w-[16px] ${error ? "text-red-400" : hasValue ? "text-blue-400" : "text-gray-350"}`} />
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-[11px] mt-1 font-medium pl-1">{label} is required!!!</p>}
    </div>
  );
}

// ─── MultiStateSelect ─────────────────────────────────────────────────────────
// ✅ Shows actual state names joined by comma e.g. "Gujarat, Maharashtra"
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

  const hasValue = selectedIds.length > 0;

  // ✅ FIX: Always show actual names joined by ", " — never show "X States Selected"
  const displayText = hasValue
    ? states
        .filter(s => selectedIds.includes(s.id))
        .map(s => s.state_name)
        .join(", ")
    : "";

  const borderClass = hasValue
    ? isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400"
    : isOpen ? "border-gray-400 ring-2 ring-gray-100" : "border-gray-300";

  const labelColor = hasValue ? "text-blue-500" : isOpen ? "text-gray-500" : "text-gray-400";
  const labelPos   = hasValue || isOpen ? "-top-2.5 text-[11px]" : "top-[11px] text-sm";

  return (
    <div ref={ref} className="relative w-full select-none">

      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-lg border-2 bg-white pl-4 pr-10 py-[10px] text-sm
          flex items-center cursor-pointer transition-all ${borderClass}`}
      >
        {/* ✅ Truncate long name lists cleanly */}
        <span className={`block truncate font-medium flex-1 min-w-0 ${hasValue ? "text-gray-900" : "text-transparent"}`}>
          {displayText || " "}
        </span>
        <div className={`flex items-center gap-1 flex-shrink-0 ml-2 pointer-events-none
          ${hasValue ? "text-blue-400" : isOpen ? "text-gray-500" : "text-gray-400"}`}>
          <MapPin size={15} strokeWidth={2} className="opacity-70" />
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Floating label */}
      <label className={`absolute left-3 px-1 bg-white pointer-events-none z-10
        transition-all duration-200 font-semibold ${labelPos} ${labelColor}`}>
        {label}
      </label>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200
          rounded-lg shadow-xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-100">

          <div className="flex border-b border-gray-100">
            <button type="button" onClick={(e) => { e.stopPropagation(); onSelectAll(); }}
              className="flex-1 py-2 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors">
              Select All
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onDeselectAll(); }}
              className="flex-1 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
              Deselect All
            </button>
          </div>

          <ul className="max-h-56 overflow-y-auto py-1.5">
            {states.map(s => {
              const isSel = selectedIds.includes(s.id);
              return (
                <li key={s.id}
                  onClick={(e) => { e.stopPropagation(); onToggle(s.id); }}
                  className="px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 flex items-center gap-3 transition-colors">
                  <input type="checkbox" readOnly checked={isSel}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 pointer-events-none flex-shrink-0" />
                  <span className={`font-medium ${isSel ? "text-blue-600" : "text-gray-700"}`}>
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