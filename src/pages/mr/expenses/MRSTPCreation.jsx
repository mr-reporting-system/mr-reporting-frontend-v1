import React, { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Edit2, X, Save, FileSpreadsheet, MapPin, 
  ChevronDown, Check, Loader2, AlertCircle, CheckCircle2
} from "lucide-react";
import api from "../../../services/api";

// ─── Global responsive styles (from reference) ───────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; overflow-x: hidden; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; margin-bottom: 24px; min-width: 0; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:flex-start; border-radius:0 0 16px 16px; flex-wrap: wrap; gap: 12px; }

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

  /* New row style to force exactly ONE row on desktop and wrap gracefully on mobile */
  .stp-row-container {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: nowrap;
    margin-bottom: 16px;
  }

  @media(max-width:1024px){
    .stp-row-container { flex-wrap: wrap; }
    .stp-row-container > div { flex: 1 1 30%; }
  }
  @media(max-width:768px){
    .ucr-body  { padding:16px; }
    .ucr-header { padding: 16px; }
    .ucr-footer { justify-content: center; flex-direction: column; }
    .ucr-footer > button { width: 100%; justify-content: center; }
    
    .stp-row-container { flex-direction: column; align-items: stretch; border-bottom: 1px solid #f3f4f6; padding-bottom: 16px; margin-bottom: 16px; }
    .stp-row-container > div { width: 100% !important; flex: none; }
    .stp-row-container > .stp-index { display: none; } /* Hide number on mobile for cleaner look */
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const INPUT_CLASS = "h-[38px]";
const FH = 40;

export default function MRSTPCreation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // 1. State for Dropdowns
  const [areaOptions, setAreaOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);

  // 2. State for the dynamic form rows
  const [formRows, setFormRows] = useState([
    { id: Date.now(), fromArea: '', toArea: '', type: '', distance: '', freqVisit: '' }
  ]);

  // 3. State for the submitted data table
  const [tableData, setTableData] = useState([]);
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  // 4. State for the edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  // --- API Fetching (On Component Mount) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingTable(true);
      try {
        // Run fetches in parallel, catch errors individually to not break UI if one fails
        const [areaRes, typeRes, tableRes] = await Promise.all([
          api.get('/api/areas').catch(() => ({ data: { data: [] } })),
          api.get('/api/types').catch(() => ({ data: { data: [] } })),
          api.get('/api/stps').catch(() => ({ data: { data: [] } }))
        ]);
        
        // Normalize Data Arrays
        const areas = areaRes.data?.data || areaRes.data || [];
        const types = typeRes.data?.data || typeRes.data || [];
        const table = tableRes.data?.data || tableRes.data || [];

        setAreaOptions(Array.isArray(areas) ? areas.map(a => ({ id: a.id || a.name, label: a.name })) : []);
        setTypeOptions(Array.isArray(types) ? types.map(t => ({ id: t.id || t.name, label: t.name })) : []);
        setTableData(Array.isArray(table) ? table : []);
      } catch (error) {
        console.error("Error fetching data from backend", error);
      } finally {
        setIsLoadingTable(false);
      }
    };
    fetchInitialData();
  }, []);

  // --- Form Handlers ---
  const handleAddRow = () => {
    setFormRows([...formRows, { id: Date.now(), fromArea: '', toArea: '', type: '', distance: '', freqVisit: '' }]);
  };

  const handleRemoveRow = (id) => {
    if (formRows.length > 1) {
      setFormRows(formRows.filter(row => row.id !== id));
    }
  };

  const handleRowChange = (id, field, value) => {
    setFormRows(formRows.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // --- Submit to Backend ---
  const handleCreateSTP = async () => {
    setErrorMsg("");
    setMessage("");

    const validRows = formRows.filter(row => row.fromArea && row.toArea && row.type);
    
    if (validRows.length === 0) {
      setErrorMsg("Please fill in the required fields (From, To, Type) for at least one row.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = validRows.map(row => ({
        fromArea: row.fromArea,
        toArea: row.toArea,
        type: row.type,
        distance: Number(row.distance) || 0,
        freqVisit: Number(row.freqVisit) || 0
      }));

      // const response = await api.post('/api/stps/create', payload);
      // setTableData([...tableData, ...response.data?.data]);

      // TEMPORARY UI UPDATE (Since API is simulated)
      const newTableEntries = validRows.map((row, index) => ({
        id: Date.now() + index,
        fromArea: row.fromArea,
        toArea: row.toArea,
        type: row.type,
        distance: row.distance || '0',
        freqVisit: row.freqVisit || '0',
        managerApproved: 'Pending', 
        adminApproved: 'Pending'
      }));
      setTableData([...tableData, ...newTableEntries]);
      // -------------------------------------------------------------

      setMessage("STP created successfully!");
      setFormRows([{ id: Date.now(), fromArea: '', toArea: '', type: '', distance: '', freqVisit: '' }]);
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error creating STP", error);
      setErrorMsg(error.response?.data?.message || "Failed to create STP. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Modal Handlers ---
  const openEditModal = (item) => {
    setEditingRow({ ...item });
    setIsModalOpen(true);
  };

  const handleEditChange = (field, value) => {
    setEditingRow({ ...editingRow, [field]: value });
  };

  const handleModifySTP = async () => {
    setErrorMsg("");
    try {
      // await api.put(`/api/stps/${editingRow.id}`, editingRow);

      // TEMPORARY UI UPDATE
      setTableData(tableData.map(item => (item.id === editingRow.id ? editingRow : item)));
      setMessage("STP Modified Successfully!");
      setTimeout(() => setMessage(""), 3000);

      setIsModalOpen(false);
      setEditingRow(null);
    } catch (error) {
      console.error("Error updating STP", error);
      setErrorMsg("Failed to modify STP.");
    }
  };

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

      {/* --- CREATION FORM SECTION --- */}
      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MapPin size={17} style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>STP Creation Form</h2>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>Define standard tour programs</p>
            </div>
          </div>
        </div>

        <div className="ucr-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {formRows.map((row, index) => (
              <div key={row.id} className="stp-row-container">
                {/* Index Number */}
                <div className="stp-index" style={{ width: 24, paddingTop: 10, fontSize: 13, fontWeight: 700, color: "#6b7280", textAlign: "center", flexShrink: 0 }}>
                  {index + 1}.
                </div>
                
                {/* Fields */}
                <div style={{ flex: "1 1 0%", minWidth: 140 }}>
                  <SingleDropdown label="SELECT FROM AREA *" options={areaOptions} value={row.fromArea} onSelect={v => handleRowChange(row.id, 'fromArea', v)} />
                </div>
                <div style={{ flex: "1 1 0%", minWidth: 140 }}>
                  <SingleDropdown label="SELECT TO AREA *" options={areaOptions} value={row.toArea} onSelect={v => handleRowChange(row.id, 'toArea', v)} />
                </div>
                <div style={{ flex: "1 1 0%", minWidth: 140 }}>
                  <SingleDropdown label="SELECT TYPE *" options={typeOptions} value={row.type} onSelect={v => handleRowChange(row.id, 'type', v)} />
                </div>
                <div style={{ flex: "1 1 0%", minWidth: 110 }}>
                  <FloatingInput label="DISTANCE (KM)" type="number" value={row.distance} onChange={e => handleRowChange(row.id, 'distance', e.target.value)} />
                </div>
                <div style={{ flex: "1 1 0%", minWidth: 110 }}>
                  <FloatingInput label="FREQ. VISIT" type="number" value={row.freqVisit} onChange={e => handleRowChange(row.id, 'freqVisit', e.target.value)} />
                </div>
                
                {/* Delete Button exactly aligned */}
                <div style={{ width: FH, flexShrink: 0, marginTop: 1 }}>
                  <button 
                    onClick={() => handleRemoveRow(row.id)}
                    disabled={formRows.length === 1}
                    style={{ 
                      display: "flex", alignItems: "center", justifyContent: "center", 
                      height: FH, width: "100%", borderRadius: 8, 
                      background: formRows.length === 1 ? "#f3f4f6" : "#fef2f2", 
                      color: formRows.length === 1 ? "#9ca3af" : "#dc2626", 
                      border: formRows.length === 1 ? "1px solid #e5e7eb" : "1px solid #fecaca", 
                      cursor: formRows.length === 1 ? "not-allowed" : "pointer", 
                      transition: "0.2s" 
                    }}
                    title="Remove Row"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            <button 
              onClick={handleAddRow}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:700, background:"#eff6ff", color:"#2563eb", border:"1px dashed #93c5fd", cursor:"pointer", transition:"0.2s", width: "fit-content", marginTop: 4, marginLeft: 36 }}
              title="Add New Row"
            >
              <Plus size={14} /> Add Row
            </button>
          </div>
        </div>

        <div className="ucr-footer" style={{ borderTop: "1px solid #f3f4f6" }}>
          <button 
            onClick={handleCreateSTP}
            disabled={isSubmitting}
            style={{
              height: 40, padding: "0 32px", borderRadius: 8, background: "#2563eb", color: "#fff",
              fontSize: 13, fontWeight: 700, border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8
            }}
          >
            {isSubmitting ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Save size={16} />}
            Create STP
          </button>
        </div>
      </div>

      {/* --- DATA TABLE SECTION --- */}
      <div className="ucr-card">
        <div className="ucr-header" style={{ background: "#f9fafb" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Existing Standard Tour Programs</h2>
          <button
            title="Export"
            style={{
              height: 36, width: 36, borderRadius: 8, background: "#ecfdf5", border: "1px solid #a7f3d0",
              color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginLeft: "auto"
            }}
          >
            <FileSpreadsheet size={16} />
          </button>
        </div>

        <div className="ucr-body" style={{ padding: 0 }}>
          <div className="ucr-table-container" style={{ border: "none", borderRadius: "0 0 16px 16px" }}>
            <table className="ucr-table">
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: "center" }}>SN.</th>
                  <th>From Area</th>
                  <th>To Area</th>
                  <th>Type</th>
                  <th>Distance</th>
                  <th>Freq Visit</th>
                  <th style={{ textAlign: "center" }}>Manager Approved?</th>
                  <th style={{ textAlign: "center" }}>Admin Approved?</th>
                  <th style={{ textAlign: "center", width: 60 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTable ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 40 }}>
                      <Loader2 style={{ animation: "ucr-spin 1s linear infinite", margin: "0 auto", color: "#2563eb" }} size={24} />
                    </td>
                  </tr>
                ) : tableData.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontStyle: "italic" }}>
                      No data available. Please fetch from the server.
                    </td>
                  </tr>
                ) : (
                  tableData.map((item, index) => (
                    <tr key={item.id} style={{ transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ color: "#6b7280", textAlign: "center" }}>{index + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.fromArea}</td>
                      <td style={{ fontWeight: 600 }}>{item.toArea}</td>
                      <td style={{ fontWeight: 600 }}>{item.type}</td>
                      <td style={{ fontWeight: 600 }}>{item.distance}</td>
                      <td style={{ fontWeight: 600 }}>{item.freqVisit}</td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                          background: item.managerApproved === 'Yes' ? "#eff6ff" : "#f3f4f6",
                          color: item.managerApproved === 'Yes' ? "#1d4ed8" : "#4b5563"
                        }}>
                          {item.managerApproved || 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                          background: item.adminApproved === 'Yes' ? "#eff6ff" : "#f3f4f6",
                          color: item.adminApproved === 'Yes' ? "#1d4ed8" : "#4b5563"
                        }}>
                          {item.adminApproved || 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button 
                          onClick={() => openEditModal(item)}
                          style={{
                            width: 28, height: 28, borderRadius: "50%", background: "none", border: "none",
                            color: "#2563eb", display: "flex", alignItems: "center", justifyItems: "center", cursor: "pointer", margin: "0 auto"
                          }}
                          title="Modify STP"
                        >
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- EDIT MODAL SECTION --- */}
      {isModalOpen && editingRow && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000, background: "rgba(17, 24, 39, 0.4)",
          display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", padding: 16
        }}>
          <div className="ucr-card" style={{ 
            width: "100%", maxWidth: 800, margin: 0, overflow: "visible", 
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
          }}>
            <div className="ucr-header" style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, background: "#f9fafb", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Modify Standard Tour Program</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyItems: "center", padding: 4, borderRadius: 6 }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="ucr-body">
              <div className="ucr-grid-12" style={{ borderBottom: "none", paddingBottom: 0, marginBottom: 0 }}>
                <div className="col-span-4"><SingleDropdown label="SELECT FROM AREA *" options={areaOptions} value={editingRow.fromArea} onSelect={v => handleEditChange('fromArea', v)} /></div>
                <div className="col-span-4"><SingleDropdown label="SELECT TO AREA *" options={areaOptions} value={editingRow.toArea} onSelect={v => handleEditChange('toArea', v)} /></div>
                <div className="col-span-4"><SingleDropdown label="SELECT TYPE *" options={typeOptions} value={editingRow.type} onSelect={v => handleEditChange('type', v)} /></div>
                
                <div className="col-span-6"><FloatingInput label="DISTANCE (KM)" type="number" value={editingRow.distance} onChange={e => handleEditChange('distance', e.target.value)} /></div>
                <div className="col-span-6"><FloatingInput label="FREQ. VISIT" type="number" value={editingRow.freqVisit} onChange={e => handleEditChange('freqVisit', e.target.value)} /></div>
              </div>
            </div>

            <div className="ucr-footer" style={{ borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderTop: "1px solid #f3f4f6" }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{
                  height: 38, padding: "0 20px", borderRadius: 8, background: "#fff",
                  border: "1px solid #d1d5db", color: "#4b5563", fontWeight: 600, fontSize: 13, cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleModifySTP}
                style={{
                  height: 38, padding: "0 20px", borderRadius: 8, background: "#2563eb", color: "#fff",
                  fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8
                }}
              >
                <Save size={16} /> Modify STP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════

function FloatingInput({ label, type = "text", value, onChange, disabled }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(value?.toString().trim());
  const active = hasValue || isFocused;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13,
          border: `1.5px solid ${active && !disabled ? "#2563eb" : "#d1d5db"}`, outline: "none",
          fontWeight: 600, color: disabled ? "#6b7280" : "#111827",
          background: disabled ? "#f9fafb" : "#fff",
          transition: "border-color 0.2s"
        }}
      />
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"),
          background: disabled ? (active ? "#f9fafb" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
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

  const selectedOption = options.find((option) => String(option.id ?? option.value ?? option.name ?? option) === String(value));
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
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f9fafb" : "#fff",
          transition: "border-color 0.2s"
        }}
      >
        <span style={{ flex: 1, fontWeight: 600, color: (Boolean(value) && !disabled) ? "#111827" : disabled && Boolean(value) ? "#6b7280" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {selectedOption?.label || selectedOption?.name || selectedOption || " "}
        </span>
        <ChevronDown size={14} style={{ color: "#9ca3af", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s", flexShrink: 0 }} />
      </div>
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"), background: disabled ? (active ? "#f9fafb" : "transparent") : "#fff",
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
              options.map((opt, i) => {
                const optValue = opt.id ?? opt.value ?? opt.name ?? opt;
                const optLabel = opt.label ?? opt.name ?? opt;
                return (
                  <div
                    key={optValue || i}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(optValue);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: "10px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
                      background: String(value) === String(optValue) ? "#eff6ff" : "transparent",
                      color: String(value) === String(optValue) ? "#2563eb" : "#374151"
                    }}
                  >
                    {optLabel}
                  </div>
                );
              })
            )}
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