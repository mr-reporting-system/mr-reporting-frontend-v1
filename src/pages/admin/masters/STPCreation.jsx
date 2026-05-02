import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check,
  Trash2,
  Edit2,
  MapPin,
  Save,
  Users,
  Filter,
} from "lucide-react";
import api from "../../../services/api";

// ─── Global responsive styles ─────────────────────────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; overflow-x: hidden; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; margin-bottom: 24px; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:flex-end; border-radius:0 0 16px 16px; flex-wrap: wrap; gap: 12px; }
  .ucr-divider{ border:none; border-top:1px solid #f3f4f6; margin:24px 0; }

  /* Responsive Table Scroll Logic */
  .ucr-table-container {
    border: 1px solid #f3f4f6;
    border-radius: 12px;
    overflow-x: auto;
    background: #fff;
    -webkit-overflow-scrolling: touch;
  }
  .ucr-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 800px; }
  .ucr-table thead { background: #f3f4f6; }
  .ucr-table th { padding: 13px 16px; text-align: left; font-weight: 700; color: #374151; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; border-bottom: 1px solid #e5e7eb; }
  .ucr-table tbody tr:nth-child(even) { background: #f9fafb; }
  .ucr-table tbody tr:nth-child(odd) { background: #ffffff; }
  .ucr-table tbody tr:hover { background: #f3f4f6; transition: background 0.15s; }
  .ucr-table td { padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6; white-space: nowrap; font-size: 13px; }

  /* Grid Layouts */
  .ucr-grid  { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:28px; }
  .filter-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; align-items:flex-end; }

  @media(max-width:1024px){
    .ucr-grid  { grid-template-columns:repeat(2,1fr); gap:16px; }
    .filter-grid { grid-template-columns:repeat(2,1fr); }
    .ucr-body  { padding:18px; }
  }
  @media(max-width:600px){
    .ucr-grid, .filter-grid { grid-template-columns:1fr; gap:12px; }
    .ucr-body  { padding:14px; }
    .ucr-header { padding: 12px 16px; }
    .ucr-footer { justify-content: center; }
    .ucr-submit-btn { width:100%; justify-content:center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

// ─── Field height ─────────────────────────────────────────────────────────────
const FH = 40;

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function STPCreation() {
  // ── UI State ──────────────────────────────────────────────────────────────
  const [error, setError] = useState("");
  const [popup, setPopup] = useState({ isOpen: false, message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterToggle, setFilterToggle] = useState(true);
  const [editingStpId, setEditingStpId] = useState(null);

  // ── Dropdown Data ─────────────────────────────────────────────────────────
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);

  // ── Selections ────────────────────────────────────────────────────────────
  const [selectedDesignationId, setSelectedDesignationId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  // ── Form State ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    fromArea: "",
    toArea: "",
    type: "",
    frc: "",
    distance: "",
    frequencyVisit: "",
  });

  // ── Table Data ────────────────────────────────────────────────────────────
  const [stpData, setStpData] = useState([]);
  const [selectedStpIds, setSelectedStpIds] = useState([]);

  // ── Initial Fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      const res = await api.get("/api/masters/designations");
      const data = res.data?.data || res.data || [];
      setDesignations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load designations");
    }
  };

  useEffect(() => {
    if (selectedDesignationId) {
      fetchEmployees(selectedDesignationId);
    } else {
      setEmployees([]);
      setSelectedEmployeeId("");
    }
  }, [selectedDesignationId]);

  const fetchEmployees = async (designationId) => {
    try {
      const res = await api.get(`/api/masters/employees/designation/${designationId}`);
      const data = res.data?.data || res.data || [];
      setEmployees(Array.isArray(data) ? data : []);
    } catch (e) {
      setEmployees([]);
    }
  };

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchAreasAndStpData(selectedEmployeeId);
    } else {
      setAreas([]);
      setStpData([]);
      setSelectedStpIds([]);
      setEditingStpId(null);
      setFormData({ fromArea: "", toArea: "", type: "", frc: "", distance: "", frequencyVisit: "" });
    }
  }, [selectedEmployeeId]);

  const fetchAreasAndStpData = async (empId) => {
    setIsLoading(true);
    try {
      const areaRes = await api.get(`/api/masters/areas/employee/${empId}`);
      const areaData = areaRes.data?.data || areaRes.data || [];
      setAreas(Array.isArray(areaData) ? areaData : []);

      const stpRes = await api.get(`/api/masters/stps/employee/${empId}`);
      const stpResData = stpRes.data?.data || stpRes.data || [];
      setStpData(Array.isArray(stpResData) ? stpResData : []);
    } catch (e) {
      console.error("Failed to load areas or STP data");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Form Handlers ─────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "fromArea" && value && !editingStpId) {
        const selectedAreaObj = areas.find(
          (a) => (a.area?.id || a.id).toString() === value.toString()
        );
        if (selectedAreaObj) {
          const targetObj = selectedAreaObj.area || selectedAreaObj;
          const areaType = targetObj.type || targetObj.area_type || targetObj.areaType;
          if (areaType) newData.type = areaType;
        }
      }
      return newData;
    });
  };

  const handleFrcChange = (e) => {
    const numbersOnly = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({
      ...prev,
      frc: numbersOnly ? `Days: ${numbersOnly}` : "",
    }));
  };

  const handleEditClick = (item) => {
    setEditingStpId(item.id);
    const fromAreaId = item.fromArea?.id || item.fromAreaId || "";
    const toAreaId = item.toArea?.id || item.toAreaId || "";
    const areaType = item.areaType || item.type || "";

    setFormData({
      fromArea: fromAreaId.toString(),
      toArea: toAreaId.toString(),
      type: areaType,
      frc: item.frc ? `Days: ${item.frc}` : "",
      distance: item.distance || "",
      frequencyVisit: item.frequencyVisit || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveStp = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        designationId: parseInt(selectedDesignationId),
        employeeId: parseInt(selectedEmployeeId),
        fromAreaId: parseInt(formData.fromArea),
        toAreaId: parseInt(formData.toArea),
        areaType: formData.type,
        frc: parseInt(String(formData.frc).replace(/\D/g, "")) || 0,
        distance: parseFloat(formData.distance),
        frequencyVisit: parseInt(formData.frequencyVisit),
      };

      let res;
      if (editingStpId) {
        res = await api.put(`/api/masters/stps/${editingStpId}`, payload);
      } else {
        res = await api.post("/api/masters/stps", payload);
      }

      if (res.data?.success || res.status === 200 || res.status === 201) {
        setPopup({
          isOpen: true,
          message: editingStpId ? "STP Updated Successfully!" : "STP Created Successfully!",
        });
        setFormData({ fromArea: "", toArea: "", type: "", frc: "", distance: "", frequencyVisit: "" });
        setEditingStpId(null);
        fetchAreasAndStpData(selectedEmployeeId);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save STP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStp = async () => {
    if (selectedStpIds.length === 0 || isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/api/masters/stps/delete", { stpIds: selectedStpIds });
      setPopup({ isOpen: true, message: "STP Deleted Successfully!" });
      setSelectedStpIds([]);
      fetchAreasAndStpData(selectedEmployeeId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete STP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Checkbox ──────────────────────────────────────────────────────────────
  const toggleStpRow = (id) =>
    setSelectedStpIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const toggleAllStpRows = (e) =>
    setSelectedStpIds(e.target.checked ? stpData.map((item) => item.id) : []);

  const isFormValid =
    formData.fromArea &&
    formData.toArea &&
    formData.type &&
    formData.distance &&
    formData.frequencyVisit &&
    selectedEmployeeId;

  const getAreaProps = (a) => {
    const id = a.area?.id || a.id;
    const name =
      a.area?.name ||
      a.area?.areaName ||
      a.area?.area_name ||
      a.name ||
      a.areaName ||
      a.area_name ||
      "Unknown Area";
    return { id, name };
  };

  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>

      {/* Alerts */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Header & Filters Card */}
      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Filter size={17} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>STP Creation</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>Manage Standard Tour Plans for employees</p>
          </div>
          <button
            onClick={() => setFilterToggle(!filterToggle)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>FILTER</span>
              <div style={{ width: 34, height: 18, borderRadius: 20, background: filterToggle ? "#2563eb" : "#d1d5db", position: "relative", cursor: "pointer", transition: "0.2s" }}>
                <div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: filterToggle ? 18 : 2, transition: "0.2s" }} />
              </div>
            </div>
          </button>
        </div>

        {filterToggle && (
          <div className="ucr-body">
            <div className="filter-grid">
              <FSelect
                label="Select Designation"
                value={selectedDesignationId}
                onChange={(e) => {
                  setSelectedDesignationId(e.target.value);
                  setSelectedEmployeeId("");
                }}
                options={designations.map((d) => ({ id: d.id, label: d.designation_name || d.name }))}
              />
              <FSelect
                label="Employee Name"
                value={selectedEmployeeId}
                disabled={!selectedDesignationId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                options={employees.map((e) => ({ id: e.id, label: e.name || e.employee_name }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Form Card */}
      <div
        className="ucr-card"
        style={{ opacity: selectedEmployeeId ? 1 : 0.6, pointerEvents: selectedEmployeeId ? "auto" : "none" }}
      >
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MapPin size={17} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
              {editingStpId ? "Edit STP Details" : "New STP Details"}
            </h2>
          </div>
          {editingStpId && (
            <button
              onClick={() => {
                setEditingStpId(null);
                setFormData({ fromArea: "", toArea: "", type: "", frc: "", distance: "", frequencyVisit: "" });
              }}
              style={{ background: "none", border: "none", color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              CANCEL EDIT
            </button>
          )}
        </div>

        <form onSubmit={handleSaveStp}>
          <div className="ucr-body">
            <div className="ucr-grid">
              <FSelect
                label="From Area"
                name="fromArea"
                value={formData.fromArea}
                onChange={handleInputChange}
                options={areas.map((a) => { const { id, name } = getAreaProps(a); return { id, label: name }; })}
              />
              <FSelect
                label="To Area"
                name="toArea"
                value={formData.toArea}
                onChange={handleInputChange}
                options={areas.map((a) => { const { id, name } = getAreaProps(a); return { id, label: name }; })}
              />
              <FSelect
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                options={[{ id: "HQ", label: "HQ" }, { id: "EX", label: "EX" }]}
              />
              <FInput label="FRC (e.g. 15)" name="frc" value={formData.frc} onChange={handleFrcChange} />
              <FInput label="Distance" name="distance" type="number" value={formData.distance} onChange={handleInputChange} />
              <FInput label="Frequency Visit" name="frequencyVisit" type="number" value={formData.frequencyVisit} onChange={handleInputChange} />
            </div>
          </div>

          <div className="ucr-footer">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="ucr-submit-btn"
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 24px", borderRadius: 9,
                fontSize: 13, fontWeight: 700, border: "none",
                cursor: !isFormValid || isSubmitting ? "not-allowed" : "pointer",
                background: "#2563eb", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                opacity: !isFormValid || isSubmitting ? 0.6 : 1, transition: "all 0.15s",
              }}
            >
              {isSubmitting
                ? <Loader2 size={14} style={{ animation: "ucr-spin 1s linear infinite" }} />
                : <Save size={14} />
              }
              {editingStpId ? "Update STP" : "Add STP"}
            </button>
          </div>
        </form>
      </div>

      {/* Table Card */}
      {selectedEmployeeId && (
        <div className="ucr-card">
          <div className="ucr-header" style={{ background: "#f9fafb" }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "#4b5563" }}>STP DATA</h3>
          </div>

          <div className="ucr-body">
            <div className="ucr-table-container">
              <table className="ucr-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        onChange={toggleAllStpRows}
                        checked={stpData.length > 0 && selectedStpIds.length === stpData.length}
                      />
                    </th>
                    <th>No.</th>
                    <th>From Area</th>
                    <th>To Area</th>
                    <th>Type</th>
                    <th>Distance</th>
                    <th>Frequency</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: 40 }}>
                        <Loader2 style={{ animation: "ucr-spin 1s linear infinite", color: "#2563eb" }} />
                      </td>
                    </tr>
                  ) : stpData.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                        No STP data found.
                      </td>
                    </tr>
                  ) : (
                    stpData.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{ background: selectedStpIds.includes(item.id) ? "#eff6ff" : undefined }}
                      >
                        <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedStpIds.includes(item.id)}
                            onChange={() => toggleStpRow(item.id)}
                          />
                        </td>
                        <td style={{ color: "#6b7280" }}>{index + 1}</td>
                        <td style={{ fontWeight: 600, color: "#111827" }}>
                          {item.fromArea?.name || item.fromArea?.areaName || item.fromAreaName || "—"}
                        </td>
                        <td style={{ fontWeight: 600, color: "#111827" }}>
                          {item.toArea?.name || item.toArea?.areaName || item.toAreaName || "—"}
                        </td>
                        <td>{item.areaType || item.type || "—"}</td>
                        <td>{item.distance}</td>
                        <td>{item.frequencyVisit}</td>
                        <td>
                          <button
                            onClick={() => handleEditClick(item)}
                            style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center" }}
                          >
                            <Edit2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delete footer */}
          <div className="ucr-footer" style={{ justifyContent: "flex-start" }}>
            <button
              onClick={handleDeleteStp}
              disabled={selectedStpIds.length === 0 || isSubmitting}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 20px",
                borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: "1px solid #fecaca", background: "#fff", color: "#dc2626",
                cursor: selectedStpIds.length === 0 ? "not-allowed" : "pointer",
                opacity: selectedStpIds.length === 0 ? 0.6 : 1, minWidth: 90,
              }}
            >
              {isSubmitting
                ? <Loader2 size={14} style={{ animation: "ucr-spin 1s linear infinite" }} />
                : <Trash2 size={14} />
              }
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {popup.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 320, width: "90%", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", border: "2px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 size={32} style={{ color: "#2563eb" }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>{popup.message}</h3>
            <button
              onClick={() => setPopup({ isOpen: false, message: "" })}
              style={{ background: "#2563eb", color: "#fff", border: "none", padding: "10px 0", width: "100%", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FInput — floating label text input
// ═══════════════════════════════════════════════════════════════════
function FInput({ label, name, type = "text", value, onChange, disabled }) {
  const [focus, setFocus] = useState(false);
  const active = focus || Boolean(value?.toString().trim());

  return (
    <div style={{ position: "relative", width: "100%", height: FH }}>
      <input
        type={type}
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%", height: "100%", borderRadius: 8, padding: "0 12px",
          fontSize: 13, color: "#111827", outline: "none",
          background: disabled ? "#f9fafb" : "#fff",
          border: `1.5px solid ${focus ? "#2563eb" : "#d1d5db"}`,
          transition: "all 0.15s",
        }}
      />
      <label
        style={{
          position: "absolute", left: 10, pointerEvents: "none", transition: "all 0.15s", fontWeight: 600,
          top: active ? -9 : 10, fontSize: active ? 10 : 12,
          color: focus ? "#2563eb" : "#9ca3af",
          background: active ? "#fff" : "transparent",
          padding: active ? "0 4px" : "0",
        }}
      >
        {label}
      </label>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FSelect — floating label dropdown
// ═══════════════════════════════════════════════════════════════════
function FSelect({ label, name, value, onChange, disabled, options = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = options.find((o) => String(o.id) === String(value));
  const active = open || Boolean(value);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => !disabled && setOpen(!open)}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 34px 0 12px",
          fontSize: 13, display: "flex", alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? "#f9fafb" : "#fff",
          border: `1.5px solid ${open ? "#2563eb" : "#d1d5db"}`,
          transition: "all 0.15s",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: value ? "#111827" : "transparent" }}>
          {selected?.label || " "}
        </span>
        <ChevronDown
          size={14}
          style={{ position: "absolute", right: 10, transform: open ? "rotate(180deg)" : "none", transition: "0.2s", color: "#9ca3af" }}
        />
      </div>
      <label
        style={{
          position: "absolute", left: 10, pointerEvents: "none", transition: "all 0.15s", fontWeight: 600,
          top: active ? -9 : 10, fontSize: active ? 10 : 12,
          color: open ? "#2563eb" : "#9ca3af",
          background: active ? "#fff" : "transparent",
          padding: active ? "0 4px" : "0",
        }}
      >
        {label}
      </label>
      {open && (
        <div
          style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, width: "100%", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, overflow: "hidden" }}
        >
          <ul style={{ maxHeight: 200, overflowY: "auto", margin: 0, padding: "4px 0", listStyle: "none" }}>
            {options.map((opt) => (
              <li
                key={opt.id}
                onClick={() => { onChange({ target: { name, value: opt.id } }); setOpen(false); }}
                style={{
                  padding: "8px 12px", fontSize: 13, cursor: "pointer",
                  background: String(value) === String(opt.id) ? "#eff6ff" : "transparent",
                  color: String(value) === String(opt.id) ? "#2563eb" : "#374151",
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}