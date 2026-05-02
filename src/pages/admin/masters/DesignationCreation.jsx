// import React, { useState, useEffect } from "react";
// import { Edit2, Loader2, Briefcase, PlusCircle, CheckCircle2 } from "lucide-react";
// import api from "../../../services/api";

// export default function DesignationCreation() {
//   const [designations, setDesignations] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState("");
//   const [successMsg, setSuccessMsg] = useState("");
//   const [editingId, setEditingId] = useState(null);

//   const [formData, setFormData] = useState({
//     name: "",
//     level: "",
//     fullForm: ""
//   });

//   useEffect(() => {
//     fetchDesignations();
//   }, []);

//   const fetchDesignations = async () => {
//     try {
//       setIsLoading(true);
//       const response = await api.get('/api/masters/designations');
//       if (response.data.success) {
//         setDesignations(response.data.data);
//       }
//     } catch (err) {
//       console.error("Failed to fetch designations", err);
//       setDesignations([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleEditClick = (item) => {
//     setEditingId(item.id);
//     setFormData({
//       // 🚀 FIXED: Now mapping exactly to the Java entity properties
//       name: item.name,
//       level: item.level.toString(),
//       fullForm: item.fullForm || ""
//     });
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccessMsg("");
//     setIsSubmitting(true);

//     // 🚀 FIXED: Payload exactly matches the Java backend expectations
//     const payload = {
//       name: formData.name,
//       level: parseInt(formData.level),
//       fullForm: formData.fullForm
//     };

//     try {
//       let response;
//       if (editingId) {
//         response = await api.put(`/api/masters/designations/${editingId}`, payload);
//       } else {
//         response = await api.post('/api/masters/designations', payload);
//       }

//       if (response.data.success) {
//         setFormData({ name: "", level: "", fullForm: "" });
//         setEditingId(null);
//         setSuccessMsg(editingId ? "Designation updated successfully!" : "Designation created successfully!");
//         fetchDesignations(); 
        
//         setTimeout(() => setSuccessMsg(""), 3000);
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to save designation.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="space-y-6 animate-in fade-in duration-500">
      
//       {/* 🌟 Top Card: Creation Form */}
//       <div className="bg-white p-5 sm:p-8 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden transition-all">
//         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>

//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
//               <Briefcase className="text-blue-600" size={24} />
//               {editingId ? "Edit Designation" : "Designation Creation & Edit"}
//             </h2>
//             <p className="text-sm text-gray-500 mt-1">
//               {editingId ? "Update the details for this role." : "Add new roles and hierarchy levels to the system."}
//             </p>
//           </div>
//           {editingId && (
//             <button 
//               onClick={() => { setEditingId(null); setFormData({ name: "", level: "", fullForm: "" }); }}
//               className="text-sm text-gray-500 hover:text-red-500 underline transition-colors"
//             >
//               Cancel Edit
//             </button>
//           )}
//         </div>

//         {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 border border-red-100 flex items-center gap-2">{error}</div>}
//         {successMsg && <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-lg text-sm mb-6 border border-blue-100 flex items-center gap-2"><CheckCircle2 size={18} />{successMsg}</div>}

//         {/* Form Container: Stacks on mobile, sits side-by-side on desktop */}
//         <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-5 sm:gap-6 pt-2">
          
//           <FloatingInput 
//             label="Designation Name" 
//             name="name" 
//             value={formData.name} 
//             onChange={handleInputChange} 
//             required 
//           />

//           <FloatingInput 
//             type="number"
//             label="Designation Level" 
//             name="level" 
//             value={formData.level} 
//             onChange={handleInputChange} 
//             required 
//           />

//           <FloatingInput 
//             label="Designation Full Form" 
//             name="fullForm" 
//             value={formData.fullForm} 
//             onChange={handleInputChange} 
//           />

//           {/* Submit Button */}
//           <button 
//             type="submit" 
//             disabled={isSubmitting}
//             className="group text-white px-6 py-2.5 rounded-md text-sm font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center gap-2 w-full sm:w-auto justify-center bg-blue-500 hover:bg-blue-600 shadow-blue-500/30"
//           >
//             {isSubmitting ? (
//               <Loader2 className="animate-spin" size={18} />
//             ) : editingId ? (
//               <Edit2 size={18} />
//             ) : (
//               <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" />
//             )}
//             {editingId ? "Update" : "Create"}
//           </button>
//         </form>
//       </div>

//       {/* 🌟 Bottom Card: Data Table */}
//       <div className="bg-white p-5 sm:p-8 rounded-xl shadow-sm border border-gray-100">
//         <h2 className="text-lg font-bold text-gray-800 mb-6">Existing Designations</h2>
        
//         {isLoading ? (
//           <div className="flex flex-col items-center justify-center py-16 text-blue-600">
//             <Loader2 className="animate-spin mb-4" size={40} />
//             <p className="text-sm font-medium text-gray-500">Loading designations...</p>
//           </div>
//         ) : designations.length === 0 ? (
          
//           /* Empty State Animation */
//           <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
//             <div className="bg-white p-4 rounded-full shadow-sm mb-4">
//               <Briefcase className="text-gray-400" size={32} />
//             </div>
//             <h3 className="text-gray-800 font-semibold mb-1">No Designations Found</h3>
//             <p className="text-sm text-gray-500 max-w-sm">
//               Your database is currently empty. Use the form above to create your first designation.
//             </p>
//           </div>

//         ) : (
//           <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-gray-200 shadow-sm">
//             <table className="w-full text-sm text-left min-w-[600px]">
//               <thead className="bg-blue-500 text-white">
//                 <tr>
//                   <th className="py-3 px-5 font-semibold tracking-wide">S.N.</th>
//                   <th className="py-3 px-5 font-semibold tracking-wide">Designation Name</th>
//                   <th className="py-3 px-5 font-semibold tracking-wide text-center">Level</th>
//                   <th className="py-3 px-5 font-semibold tracking-wide">Full Form</th>
//                   <th className="py-3 px-5 font-semibold tracking-wide text-center">Action</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100 bg-white">
//                 {designations.map((item, index) => (
//                   <tr 
//                     key={item.id} 
//                     className={`transition-colors duration-200 group ${editingId === item.id ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}
//                   >
//                     <td className="py-3 px-5 text-gray-500 font-medium">{index + 1}.</td>
//                     {/* 🚀 FIXED: Mapping exactly to item.name, item.level, item.fullForm */}
//                     <td className="py-3 px-5 text-gray-800 font-bold">{item.name}</td>
//                     <td className="py-3 px-5 text-center">
//                       <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">
//                         Lvl {item.level}
//                       </span>
//                     </td>
//                     <td className="py-3 px-5 text-gray-600">{item.fullForm || '-'}</td>
//                     <td className="py-3 px-5 flex justify-center">
//                       <button 
//                         onClick={() => handleEditClick(item)}
//                         className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-110 focus:outline-none"
//                         title="Edit Designation"
//                       >
//                         <Edit2 size={18} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // 🧱 Slimmer Floating Label Component
// function FloatingInput({ label, name, type = "text", value, onChange, required }) {
//   return (
//     <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
//       <input 
//         type={type} 
//         id={name}
//         name={name}
//         value={value}
//         onChange={onChange}
//         required={required}
//         placeholder=" " 
//         className="peer w-full rounded-md border border-blue-600 bg-transparent px-3 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
//       />
//       <label 
//         htmlFor={name}
//         className="pointer-events-none absolute left-2.5 top-2.5 origin-[0] -translate-y-5 scale-90 transform bg-white px-1 text-[13px] font-semibold uppercase tracking-wide text-blue-600 transition-all duration-200
//         peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:font-normal
//         peer-focus:-translate-y-5 peer-focus:scale-90 peer-focus:text-blue-600 peer-focus:font-semibold"
//       >
//         {label}
//       </label>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { Edit2, Loader2, Briefcase, PlusCircle, CheckCircle2 } from "lucide-react";
import api from "../../../services/api";

export default function DesignationCreation() {
  const [designations, setDesignations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    level: "",
    fullForm: ""
  });

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/masters/designations');
      if (response.data.success) {
        setDesignations(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch designations", err);
      setDesignations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      level: item.level.toString(),
      fullForm: item.fullForm || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      level: parseInt(formData.level),
      fullForm: formData.fullForm
    };

    try {
      let response;
      if (editingId) {
        response = await api.put(`/api/masters/designations/${editingId}`, payload);
      } else {
        response = await api.post('/api/masters/designations', payload);
      }

      if (response.data.success) {
        setFormData({ name: "", level: "", fullForm: "" });
        setEditingId(null);
        setSuccessMsg(editingId ? "Designation updated successfully!" : "Designation created successfully!");
        fetchDesignations();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save designation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: "100%", paddingBottom: 48, fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Form Card ── */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Briefcase size={17} style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
                {editingId ? "Edit Designation" : "Designation Creation & Edit"}
              </h2>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>
                {editingId ? "Update the details for this role." : "Add new roles and hierarchy levels to the system."}
              </p>
            </div>
          </div>
          {editingId && (
            <button
              onClick={() => { setEditingId(null); setFormData({ name: "", level: "", fullForm: "" }); }}
              style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontWeight: 500 }}
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, color: "#1d4ed8", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}
          >
            <div style={{ flex: "1 1 200px", minWidth: 200 }}>
              <FInput
                label="Designation Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div style={{ flex: "1 1 160px", minWidth: 160 }}>
              <FInput
                label="Designation Level"
                name="level"
                type="number"
                value={formData.level}
                onChange={handleInputChange}
                required
              />
            </div>
            <div style={{ flex: "1 1 200px", minWidth: 200 }}>
              <FInput
                label="Designation Full Form"
                name="fullForm"
                value={formData.fullForm}
                onChange={handleInputChange}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 22px", borderRadius: 9, border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 700, color: "#fff",
                background: "#2563eb",
                boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                opacity: isSubmitting ? 0.7 : 1,
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              {isSubmitting ? (
                <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
              ) : editingId ? (
                <Edit2 size={15} />
              ) : (
                <PlusCircle size={15} />
              )}
              {editingId ? "Update" : "Create"}
            </button>
          </form>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Existing Designations</h2>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", color: "#2563eb" }}>
              <Loader2 size={36} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, margin: 0 }}>Loading designations...</p>
            </div>
          ) : designations.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 16px", textAlign: "center", border: "2px dashed #e5e7eb", borderRadius: 14, background: "#f9fafb" }}>
              <div style={{ background: "#fff", padding: 16, borderRadius: "50%", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 14 }}>
                <Briefcase size={28} style={{ color: "#9ca3af" }} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>No Designations Found</h3>
              <p style={{ fontSize: 12, color: "#6b7280", maxWidth: 320, margin: 0 }}>
                Your database is currently empty. Use the form above to create your first designation.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 600 }}>
                <thead>
                  <tr style={{ background: "#2563eb" }}>
                    {["S.N.", "Designation Name", "Level", "Full Form", "Action"].map((h, i) => (
                      <th key={i} style={{
                        padding: "12px 20px", color: "#fff", fontWeight: 700,
                        fontSize: 12, letterSpacing: "0.05em", textAlign: i === 2 || i === 4 ? "center" : "left",
                        whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {designations.map((item, index) => (
                    <tr
                      key={item.id}
                      style={{
                        background: editingId === item.id ? "#eff6ff" : index % 2 === 0 ? "#fff" : "#fafafa",
                        borderBottom: "1px solid #f3f4f6",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => { if (editingId !== item.id) e.currentTarget.style.background = "#f0f7ff"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = editingId === item.id ? "#eff6ff" : index % 2 === 0 ? "#fff" : "#fafafa"; }}
                    >
                      <td style={{ padding: "12px 20px", color: "#6b7280", fontWeight: 500 }}>{index + 1}.</td>
                      <td style={{ padding: "12px 20px", color: "#111827", fontWeight: 700 }}>{item.name}</td>
                      <td style={{ padding: "12px 20px", textAlign: "center" }}>
                        <span style={{ background: "#f3f4f6", color: "#374151", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          Lvl {item.level}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", color: "#6b7280" }}>{item.fullForm || "—"}</td>
                      <td style={{ padding: "12px 20px", textAlign: "center" }}>
                        <button
                          onClick={() => handleEditClick(item)}
                          title="Edit Designation"
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            padding: "6px", borderRadius: 8, color: "#9ca3af",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#2563eb"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9ca3af"; }}
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

/* ── Floating Label Input ── */
function FInput({ label, name, type = "text", value, onChange, required, disabled }) {
  const [focus, setFocus] = useState(false);
  const hasVal = Boolean(value?.toString().trim());
  const active = focus || hasVal;

  return (
    <div style={{ position: "relative", width: "100%", height: 38 }}>
      <input
        type={type}
        name={name}
        id={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder=" "
        style={{
          width: "100%", height: "100%", borderRadius: 8, padding: "0 12px",
          fontSize: 13, color: "#111827", outline: "none", boxSizing: "border-box",
          background: disabled ? "#f9fafb" : "#fff",
          border: focus ? "1.5px solid #2563eb" : "1.5px solid #d1d5db",
          boxShadow: focus ? "0 0 0 3px rgba(37,99,235,0.08)" : "none",
          transition: "all 0.15s",
        }}
      />
      <label
        htmlFor={name}
        style={{
          position: "absolute", left: 10, pointerEvents: "none", zIndex: 10,
          transition: "all 0.15s", fontWeight: 600, letterSpacing: "0.03em",
          top: active ? -9 : 10,
          fontSize: active ? 10 : 13,
          color: focus ? "#2563eb" : active ? "#6b7280" : "#9ca3af",
          background: active ? "#fff" : "transparent",
          padding: active ? "0 4px" : "0",
        }}
      >
        {label}
      </label>
    </div>
  );
}