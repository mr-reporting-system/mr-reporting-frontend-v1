// import React, { useState, useEffect, useRef } from "react";
// import { Loader2, ArrowLeft, Trash2, Check, ChevronDown, MapPin, PlusCircle, Search } from "lucide-react";
// import api from "../../../services/api";

// export default function HeadquarterMapping() {
//   const [isLoading, setIsLoading] = useState(false);
//   const [view, setView] = useState("mapping");
//   const [error, setError] = useState("");
//   const [popup, setPopup] = useState({ isOpen: false, message: "" });

//   const [states, setStates] = useState([]);
//   const [selectedState, setSelectedState] = useState("");

//   const [unmappedDistricts, setUnmappedDistricts] = useState([]);
//   const [mappedDistricts, setMappedDistricts] = useState([]);
//   const [checkedUnmapped, setCheckedUnmapped] = useState([]);
//   const [checkedMapped, setCheckedMapped] = useState([]);

//   const [newDistrictName, setNewDistrictName] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     fetchStates();
//   }, []);

//   const fetchStates = async () => {
//     try {
//       setIsLoading(true);
//       const response = await api.get('/api/masters/states');
//       if (response.data?.success) setStates(response.data.data || []);
//     } catch (err) {
//       console.error("Failed to fetch states", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleGetDistricts = async () => {
//     if (!selectedState) return;
//     setIsLoading(true);
//     setError("");
//     try {
//       const [allRes, mappedRes] = await Promise.all([
//         api.get(`/api/masters/districts/all?stateId=${selectedState}`),
//         api.get(`/api/masters/districts?stateId=${selectedState}`)
//       ]);
//       const allDistricts = allRes.data?.data || [];
//       const activeMapped = mappedRes.data?.data || [];
//       const mappedIds = activeMapped.map(d => d.id);
//       const availableUnmapped = allDistricts.filter(d => !mappedIds.includes(d.id));
//       setMappedDistricts(activeMapped);
//       setUnmappedDistricts(availableUnmapped);
//       setCheckedUnmapped([]);
//       setCheckedMapped([]);
//     } catch (err) {
//       setError("Failed to fetch district mapping data.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const moveDistricts = async (direction) => {
//     const isMapping = direction === "right";
//     const selectedIds = isMapping ? checkedUnmapped : checkedMapped;
//     if (selectedIds.length === 0) return;
//     setIsLoading(true);
//     setError("");
//     try {
//       const response = await api.put('/api/masters/districts/status', {
//         districtIds: selectedIds,
//         isActive: isMapping
//       });
//       if (response.status === 200 || response.data?.success) {
//         setPopup({ isOpen: true, message: isMapping ? "Districts Mapped Successfully" : "Removed Mapped Districts Successfully" });
//         await handleGetDistricts();
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to update district status.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCreateDistrict = async () => {
//     if (!selectedState || !newDistrictName) return;
//     setIsSubmitting(true);
//     setError("");
//     try {
//       const response = await api.post('/api/masters/districts', {
//         stateId: parseInt(selectedState),
//         districtName: newDistrictName
//       });
//       if (response.status === 200 || response.status === 201 || response.data?.success) {
//         setPopup({ isOpen: true, message: "District Created Successfully" });
//         setNewDistrictName("");
//         setView("mapping");
//         await handleGetDistricts();
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to create district.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDeleteDistrict = async (id, name) => {
//     if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
//     setIsLoading(true);
//     setError("");
//     try {
//       const response = await api.delete(`/api/masters/districts/${id}`);
//       if (response.status === 200 || response.status === 204 || response.data?.success) {
//         setPopup({ isOpen: true, message: "District Deleted Successfully" });
//         await handleGetDistricts();
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to delete district.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const toggleCheck = (id, listType) => {
//     if (listType === "unmapped") {
//       setCheckedUnmapped(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
//     } else {
//       setCheckedMapped(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
//     }
//   };

//   const toggleAll = (listType, e) => {
//     if (listType === "unmapped") {
//       setCheckedUnmapped(e.target.checked ? unmappedDistricts.map(d => d.id) : []);
//     } else {
//       setCheckedMapped(e.target.checked ? mappedDistricts.map(d => d.id) : []);
//     }
//   };

//   return (
//     <div className="space-y-4 animate-in fade-in duration-500 pb-12 relative px-2 sm:px-0">
//       <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4">
//           <h2 className="text-lg font-bold text-gray-800">
//             {view === "mapping" ? "District Mapping" : "Headquarter Creation"}
//           </h2>
//           {view === "creation" && (
//             <button onClick={() => setView("mapping")} className="w-full sm:w-auto bg-white border border-blue-400 text-blue-500 hover:bg-blue-50 px-4 py-1.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all">
//               <ArrowLeft size={14} /> Back
//             </button>
//           )}
//         </div>

//         {error && <div className="bg-red-50 text-red-600 px-4 py-2 text-sm rounded-md mb-4 border border-red-100">{error}</div>}

//         {view === "mapping" && (
//           <div className="space-y-6">
//             <div className="flex flex-col lg:flex-row items-end gap-4">
//               <div className="w-full lg:w-1/3">
//                 <CustomFloatingSelect label="SELECT STATE *" value={selectedState} onChange={(e) => setSelectedState(e.target.value)} icon={MapPin}>
//                   <option value=""></option>
//                   {states.map(s => <option key={s.id} value={s.id}>{s.state_name}</option>)}
//                 </CustomFloatingSelect>
//               </div>
//               <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
//                 <button onClick={handleGetDistricts} disabled={!selectedState || isLoading} className={`flex-1 sm:flex-none px-5 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${selectedState ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
//                   {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Get Districts
//                 </button>
//                 <button onClick={() => setView("creation")} className="flex-1 sm:flex-none bg-white border border-blue-400 text-blue-500 hover:bg-blue-50 px-5 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all">
//                   <PlusCircle size={14} /> Create New
//                 </button>
//               </div>
//             </div>

//             {(unmappedDistricts.length > 0 || mappedDistricts.length > 0) ? (
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
//                 <div className="space-y-2">
//                   <div className="flex justify-between items-center px-1"><h4 className="text-gray-700 font-bold text-xs uppercase">Available</h4><span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">{unmappedDistricts.length}</span></div>
//                   <div className="border border-gray-200 rounded-lg overflow-hidden h-[320px] bg-white">
//                     <div className="overflow-y-auto h-full scrollbar-thin">
//                       <table className="w-full text-xs text-left">
//                         <thead className="bg-gray-50 border-b sticky top-0 z-10">
//                           <tr>
//                             <th className="w-10 py-2 px-3 text-center"><input type="checkbox" onChange={(e) => toggleAll("unmapped", e)} checked={unmappedDistricts.length > 0 && checkedUnmapped.length === unmappedDistricts.length} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500" /></th>
//                             <th className="py-2 px-1 font-bold text-gray-600">District Name</th>
//                             <th className="w-10"></th>
//                           </tr>
//                         </thead>
//                         <tbody className="divide-y divide-gray-50">
//                           {unmappedDistricts.map(d => (
//                             <tr key={d.id} className={`${checkedUnmapped.includes(d.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
//                               <td className="py-2 px-3 text-center"><input type="checkbox" checked={checkedUnmapped.includes(d.id)} onChange={() => toggleCheck(d.id, "unmapped")} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500" /></td>
//                               <td className="py-2 px-1 text-gray-700 truncate">{d.districtName || d.district_name || d.name}</td>
//                               <td className="py-2 px-2 text-center"><button onClick={() => handleDeleteDistrict(d.id, d.districtName || d.district_name || d.name)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button></td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                   <button onClick={() => moveDistricts("right")} disabled={checkedUnmapped.length === 0} className={`w-full py-2 rounded-md text-sm font-bold transition-all ${checkedUnmapped.length > 0 ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>Map Selected ({checkedUnmapped.length})</button>
//                 </div>

//                 <div className="space-y-2">
//                   <div className="flex justify-between items-center px-1"><h4 className="text-gray-700 font-bold text-xs uppercase">Mapped</h4><span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded text-blue-500">{mappedDistricts.length}</span></div>
//                   <div className="border border-blue-100 rounded-lg overflow-hidden h-[320px] bg-white">
//                     <div className="overflow-y-auto h-full scrollbar-thin">
//                       <table className="w-full text-xs text-left">
//                         <thead className="bg-blue-50 border-b sticky top-0 z-10">
//                           <tr>
//                             <th className="w-10 py-2 px-3 text-center"><input type="checkbox" onChange={(e) => toggleAll("mapped", e)} checked={mappedDistricts.length > 0 && checkedMapped.length === mappedDistricts.length} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500" /></th>
//                             <th className="py-2 px-1 font-bold text-blue-600">District Name</th>
//                           </tr>
//                         </thead>
//                         <tbody className="divide-y divide-gray-50">
//                           {mappedDistricts.map(d => (
//                             <tr key={d.id} className={`${checkedMapped.includes(d.id) ? 'bg-red-50' : 'hover:bg-blue-50/30'}`}>
//                               <td className="py-2 px-3 text-center"><input type="checkbox" checked={checkedMapped.includes(d.id)} onChange={() => toggleCheck(d.id, "mapped")} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500" /></td>
//                               <td className="py-2 px-1 text-gray-700 truncate">{d.districtName || d.district_name || d.name}</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                   <button onClick={() => moveDistricts("left")} disabled={checkedMapped.length === 0} className={`w-full py-2 rounded-md text-sm font-bold transition-all ${checkedMapped.length > 0 ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>Unmap Selected ({checkedMapped.length})</button>
//                 </div>
//               </div>
//             ) : (
//               <div className="py-16 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center">
//                 <MapPin size={32} className="text-gray-300 mb-2" />
//                 <p className="text-gray-500 text-sm">Select state and click "Get Districts" to begin.</p>
//               </div>
//             )}
//           </div>
//         )}

//         {view === "creation" && (
//           <div className="max-w-3xl mx-auto space-y-6 py-4">
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
//               <CustomFloatingSelect label="SELECT STATE *" value={selectedState} onChange={(e) => setSelectedState(e.target.value)} icon={MapPin}>
//                 <option value=""></option>
//                 {states.map(s => <option key={s.id} value={s.id}>{s.state_name}</option>)}
//               </CustomFloatingSelect>
//               <div className="relative group">
//                 <input type="text" id="newDistrictName" value={newDistrictName} onChange={(e) => setNewDistrictName(e.target.value)} placeholder=" " className="peer w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-blue-500 focus:outline-none placeholder-transparent" />
//                 <label htmlFor="newDistrictName" className="absolute left-2.5 -top-2 px-1 bg-white text-[10px] font-bold text-gray-500 transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:-top-2 peer-focus:text-[10px] peer-focus:text-blue-500">DISTRICT NAME *</label>
//               </div>
//             </div>
//             <div className="flex justify-center sm:justify-end pt-4 border-t">
//               <button onClick={handleCreateDistrict} disabled={!selectedState || !newDistrictName || isSubmitting} className={`w-full sm:w-auto px-10 py-2 rounded-md text-sm font-bold transition-all flex justify-center items-center gap-2 ${selectedState && newDistrictName ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
//                 {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Create District
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {popup.isOpen && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//           <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full flex flex-col items-center">
//             <div className="w-16 h-16 border-4 border-blue-100 bg-blue-50 rounded-full flex items-center justify-center mb-4">
//               <Check size={32} className="text-blue-500" />
//             </div>
//             <h3 className="text-lg font-bold text-gray-800 text-center mb-6">{popup.message}</h3>
//             <button onClick={() => setPopup({ isOpen: false, message: "" })} className="bg-blue-500 text-white w-full py-2 rounded-lg font-bold">OK</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function CustomFloatingSelect({ label, value, onChange, disabled, children, icon: Icon }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef(null);
//   const options = React.Children.map(children, child => {
//     if (!React.isValidElement(child)) return null;
//     return { value: child.props.value, label: child.props.children };
//   }).filter(Boolean);
//   const selectedOption = options.find(opt => opt.value == value);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div ref={dropdownRef} className="relative w-full group select-none">
//       <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`w-full rounded-md border px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-all relative z-10 ${disabled ? 'border-gray-100 bg-gray-50 text-gray-400' : 'border-gray-300 bg-white text-gray-900 hover:border-blue-400'} ${isOpen ? 'border-blue-500 ring-2 ring-blue-50' : ''}`}>
//         <span className={`block truncate ${selectedOption?.value ? 'text-gray-900' : 'text-transparent'}`}>{selectedOption?.label || " "}</span>
//         <div className="flex items-center text-gray-400">
//           {Icon && <Icon size={14} className="mr-1.5 opacity-60" />}
//           <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
//         </div>
//       </div>
//       <label className={`absolute left-2.5 px-1 transition-all pointer-events-none z-20 ${value || isOpen ? '-top-2 text-[10px] font-bold text-blue-500 bg-white' : 'top-2.5 text-sm text-gray-500'}`}>
//         {label}
//       </label>
//       {isOpen && (
//         <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-md shadow-lg z-[110] max-h-52 overflow-y-auto">
//           <ul className="py-1">
//             {options.map((opt, idx) => opt.value !== "" && (
//               <li key={idx} onClick={() => { onChange({ target: { value: opt.value } }); setIsOpen(false); }} className={`px-3 py-2 text-sm cursor-pointer ${value == opt.value ? 'bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-500' : 'text-gray-700 hover:bg-blue-500 hover:text-white border-l-2 border-transparent'}`}>
//                 {opt.label}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from "react";
import { Loader2, ArrowLeft, Trash2, Check, ChevronDown, MapPin, PlusCircle, Search } from "lucide-react";
import api from "../../../services/api";

export default function HeadquarterMapping() {
  const [isLoading,      setIsLoading]      = useState(false);
  const [view,           setView]           = useState("mapping");
  const [error,          setError]          = useState("");
  const [popup,          setPopup]          = useState({ isOpen: false, message: "" });

  const [states,         setStates]         = useState([]);
  const [selectedState,  setSelectedState]  = useState("");

  const [unmappedDistricts, setUnmappedDistricts] = useState([]);
  const [mappedDistricts,   setMappedDistricts]   = useState([]);
  const [checkedUnmapped,   setCheckedUnmapped]   = useState([]);
  const [checkedMapped,     setCheckedMapped]     = useState([]);

  const [newDistrictName, setNewDistrictName] = useState("");
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  useEffect(() => { fetchStates(); }, []);

  const fetchStates = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/api/masters/states");
      if (response.data?.success) setStates(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch states", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetDistricts = async () => {
    if (!selectedState) return;
    setIsLoading(true); setError("");
    try {
      const [allRes, mappedRes] = await Promise.all([
        api.get(`/api/masters/districts/all?stateId=${selectedState}`),
        api.get(`/api/masters/districts?stateId=${selectedState}`)
      ]);
      const allDistricts = allRes.data?.data    || [];
      const activeMapped = mappedRes.data?.data || [];
      const mappedIds    = activeMapped.map(d => d.id);
      setMappedDistricts(activeMapped);
      setUnmappedDistricts(allDistricts.filter(d => !mappedIds.includes(d.id)));
      setCheckedUnmapped([]); setCheckedMapped([]);
    } catch (err) {
      setError("Failed to fetch district mapping data.");
    } finally {
      setIsLoading(false);
    }
  };

  const moveDistricts = async (direction) => {
    const isMapping   = direction === "right";
    const selectedIds = isMapping ? checkedUnmapped : checkedMapped;
    if (selectedIds.length === 0) return;
    setIsLoading(true); setError("");
    try {
      const response = await api.put("/api/masters/districts/status", {
        districtIds: selectedIds, isActive: isMapping
      });
      if (response.status === 200 || response.data?.success) {
        setPopup({ isOpen: true, message: isMapping ? "Districts Mapped Successfully" : "Removed Mapped Districts Successfully" });
        await handleGetDistricts();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update district status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDistrict = async () => {
    if (!selectedState || !newDistrictName) return;
    setIsSubmitting(true); setError("");
    try {
      const response = await api.post("/api/masters/districts", {
        stateId: parseInt(selectedState), districtName: newDistrictName
      });
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        setPopup({ isOpen: true, message: "District Created Successfully" });
        setNewDistrictName("");
        setView("mapping");
        await handleGetDistricts();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create district.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDistrict = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    setIsLoading(true); setError("");
    try {
      const response = await api.delete(`/api/masters/districts/${id}`);
      if (response.status === 200 || response.status === 204 || response.data?.success) {
        setPopup({ isOpen: true, message: "District Deleted Successfully" });
        await handleGetDistricts();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete district.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCheck = (id, listType) => {
    if (listType === "unmapped") {
      setCheckedUnmapped(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setCheckedMapped(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const toggleAll = (listType, e) => {
    if (listType === "unmapped") {
      setCheckedUnmapped(e.target.checked ? unmappedDistricts.map(d => d.id) : []);
    } else {
      setCheckedMapped(e.target.checked ? mappedDistricts.map(d => d.id) : []);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-12 relative px-2 sm:px-0">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {view === "mapping" ? "District Mapping" : "Headquarter Creation"}
          </h2>
          {view === "creation" && (
            <button
              onClick={() => setView("mapping")}
              className="w-full sm:w-auto bg-white border border-blue-400 text-blue-500 hover:bg-blue-50
                px-4 py-1.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 text-sm rounded-md mb-4 border border-red-100">
            {error}
          </div>
        )}

        {/* ── MAPPING VIEW ──────────────────────────────────────────────── */}
        {view === "mapping" && (
          <div className="space-y-6">

            <div className="flex flex-col lg:flex-row items-end gap-4">
              <div className="w-full lg:w-1/3">
                <CustomFloatingSelect
                  label="SELECT STATE *"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  icon={MapPin}
                >
                  <option value=""></option>
                  {states.map(s => <option key={s.id} value={s.id}>{s.state_name}</option>)}
                </CustomFloatingSelect>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button
                  onClick={handleGetDistricts}
                  disabled={!selectedState || isLoading}
                  className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2
                    ${selectedState
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Get Districts
                </button>
                <button
                  onClick={() => setView("creation")}
                  className="flex-1 sm:flex-none bg-white border-2 border-gray-300 text-gray-600
                    hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50
                    px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <PlusCircle size={14} /> Create New
                </button>
              </div>
            </div>

            {(unmappedDistricts.length > 0 || mappedDistricts.length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">

                {/* Left — Available */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-gray-700 font-bold text-xs uppercase">Available</h4>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">{unmappedDistricts.length}</span>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden h-[320px] bg-white">
                    <div className="overflow-y-auto h-full">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 border-b sticky top-0 z-10">
                          <tr>
                            <th className="w-10 py-2.5 px-3 text-center">
                              <input type="checkbox"
                                onChange={(e) => toggleAll("unmapped", e)}
                                checked={unmappedDistricts.length > 0 && checkedUnmapped.length === unmappedDistricts.length}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500" />
                            </th>
                            <th className="py-2.5 px-1 font-bold text-gray-600">District Name</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {unmappedDistricts.length === 0 ? (
                            <tr><td colSpan="3" className="py-8 text-center text-gray-400">No available districts.</td></tr>
                          ) : unmappedDistricts.map(d => (
                            <tr key={d.id} className={`${checkedUnmapped.includes(d.id) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                              <td className="py-2.5 px-3 text-center">
                                <input type="checkbox" checked={checkedUnmapped.includes(d.id)}
                                  onChange={() => toggleCheck(d.id, "unmapped")}
                                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500" />
                              </td>
                              <td className="py-2.5 px-1 text-gray-700 truncate">{d.districtName || d.district_name || d.name}</td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  onClick={() => handleDeleteDistrict(d.id, d.districtName || d.district_name || d.name)}
                                  className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <button
                    onClick={() => moveDistricts("right")}
                    disabled={checkedUnmapped.length === 0}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95
                      ${checkedUnmapped.length > 0
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                  >
                    Map Selected ({checkedUnmapped.length})
                  </button>
                </div>

                {/* Right — Mapped */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-gray-700 font-bold text-xs uppercase">Mapped</h4>
                    <span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded text-blue-500">{mappedDistricts.length}</span>
                  </div>
                  <div className="border border-blue-100 rounded-lg overflow-hidden h-[320px] bg-white">
                    <div className="overflow-y-auto h-full">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-blue-50 border-b sticky top-0 z-10">
                          <tr>
                            <th className="w-10 py-2.5 px-3 text-center">
                              <input type="checkbox"
                                onChange={(e) => toggleAll("mapped", e)}
                                checked={mappedDistricts.length > 0 && checkedMapped.length === mappedDistricts.length}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500" />
                            </th>
                            <th className="py-2.5 px-1 font-bold text-blue-600">District Name</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {mappedDistricts.length === 0 ? (
                            <tr><td colSpan="2" className="py-8 text-center text-gray-400">No mapped districts.</td></tr>
                          ) : mappedDistricts.map(d => (
                            <tr key={d.id} className={`${checkedMapped.includes(d.id) ? "bg-red-50" : "hover:bg-blue-50/30"}`}>
                              <td className="py-2.5 px-3 text-center">
                                <input type="checkbox" checked={checkedMapped.includes(d.id)}
                                  onChange={() => toggleCheck(d.id, "mapped")}
                                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500" />
                              </td>
                              <td className="py-2.5 px-1 text-gray-700 truncate">{d.districtName || d.district_name || d.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <button
                    onClick={() => moveDistricts("left")}
                    disabled={checkedMapped.length === 0}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95
                      ${checkedMapped.length > 0
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                  >
                    Unmap Selected ({checkedMapped.length})
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center">
                <MapPin size={32} className="text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Select state and click "Get Districts" to begin.</p>
              </div>
            )}
          </div>
        )}

        {/* ── CREATION VIEW ─────────────────────────────────────────────── */}
        {view === "creation" && (
          <div className="max-w-3xl mx-auto space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">

              <CustomFloatingSelect
                label="SELECT STATE *"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                icon={MapPin}
              >
                <option value=""></option>
                {states.map(s => <option key={s.id} value={s.id}>{s.state_name}</option>)}
              </CustomFloatingSelect>

              {/* ✅ District name — blue border + blue label when has value */}
              <FloatingTextInput
                label="DISTRICT NAME *"
                value={newDistrictName}
                onChange={(e) => setNewDistrictName(e.target.value)}
              />
            </div>

            <div className="flex justify-center sm:justify-end pt-4 border-t">
              <button
                onClick={handleCreateDistrict}
                disabled={!selectedState || !newDistrictName || isSubmitting}
                className={`w-full sm:w-auto px-10 py-2.5 rounded-lg text-sm font-bold transition-all flex justify-center items-center gap-2 active:scale-95
                  ${selectedState && newDistrictName
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Create District
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Popup */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 border-4 border-blue-100 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-blue-500" strokeWidth={3} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-6">{popup.message}</h3>
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

// ─── CustomFloatingSelect ─────────────────────────────────────────────────────
// Border + label rules:
//   empty  + closed → gray border,  gray label (placeholder)
//   empty  + open   → gray border + ring,  gray label (floated)
//   filled + closed → BLUE border,  BLUE label ✅
//   filled + open   → BLUE border + ring,  BLUE label ✅
function CustomFloatingSelect({ label, value, onChange, disabled, children, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return null;
    return { value: child.props.value, label: child.props.children };
  }).filter(Boolean);

  const selectedOption = options.find(opt => opt.value == value);
  const hasValue = Boolean(value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Blue border when filled (regardless of open/closed), gray when empty
  const triggerBorder = disabled
    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
    : hasValue
      ? isOpen
        ? "border-blue-500 ring-2 ring-blue-100 bg-white"  // filled + open
        : "border-blue-400 bg-white text-gray-900"          // filled + closed ✅ BLUE
      : isOpen
        ? "border-gray-400 ring-2 ring-gray-100 bg-white"  // empty + open
        : "border-gray-300 bg-white text-gray-900";         // empty + closed

  const iconColor = disabled
    ? "text-gray-300"
    : hasValue
      ? "text-blue-400"   // ✅ blue icon when filled
      : isOpen
        ? "text-gray-500"
        : "text-gray-400";

  return (
    <div ref={dropdownRef} className="relative w-full select-none">

      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full rounded-lg border-2 px-4 py-3 text-sm flex items-center justify-between
          cursor-pointer transition-all relative z-10 ${triggerBorder}`}
      >
        <span className={`block truncate font-medium ${selectedOption?.value ? "text-gray-900" : "text-transparent"}`}>
          {selectedOption?.label || " "}
        </span>
        <div className={`flex items-center gap-1 flex-shrink-0 transition-colors duration-200 ${iconColor}`}>
          {Icon && <Icon size={15} strokeWidth={2} className="opacity-70" />}
          <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* ✅ Floating label — blue when filled, gray when empty */}
      <label className={`absolute left-3 px-1 transition-all duration-200 pointer-events-none z-20
        font-semibold bg-white
        ${hasValue
          ? "-top-2.5 text-[11px] text-blue-500"       // ✅ filled → blue label
          : isOpen
            ? "-top-2.5 text-[11px] text-gray-500"     // empty + open → gray floated
            : "top-3 text-sm text-gray-400"             // resting placeholder
        } ${disabled ? "!text-gray-300" : ""}`}>
        {label}
      </label>

      {/* Dropdown list */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200
          rounded-lg shadow-xl z-[110] max-h-60 overflow-y-auto
          animate-in fade-in zoom-in-95 duration-100">
          <ul className="py-1.5">
            {options.map((opt, idx) => opt.value !== "" && (
              <li
                key={idx}
                onClick={() => { onChange({ target: { value: opt.value } }); setIsOpen(false); }}
                className={`px-4 py-3 text-sm cursor-pointer font-medium transition-colors
                  ${value == opt.value
                    ? "bg-blue-50 text-blue-600 font-semibold border-l-[3px] border-blue-500"
                    : "text-gray-700 hover:bg-blue-500 hover:text-white border-l-[3px] border-transparent"
                  }`}
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

// ─── FloatingTextInput ────────────────────────────────────────────────────────
// Blue border + blue label when field has value  |  gray when empty
function FloatingTextInput({ label, value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(value);

  // ✅ Blue border when filled, gray when empty
  const borderClass = hasValue
    ? isFocused
      ? "border-blue-500 ring-2 ring-blue-100"  // filled + focused
      : "border-blue-400"                         // filled + blurred ✅ BLUE
    : isFocused
      ? "border-gray-400 ring-2 ring-gray-100"   // empty + focused
      : "border-gray-300";                        // empty + blurred

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=" "
        className={`w-full rounded-lg border-2 bg-white px-4 py-3 text-sm text-gray-900
          transition-all focus:outline-none ${borderClass}`}
      />
      {/* ✅ Label — blue when filled, gray when empty/focused */}
      <label className={`absolute left-3 px-1 bg-white pointer-events-none z-10
        transition-all duration-200 font-semibold
        ${hasValue
          ? "-top-2.5 text-[11px] text-blue-500"       // ✅ filled → blue label
          : isFocused
            ? "-top-2.5 text-[11px] text-gray-500"     // empty + focused → gray floated
            : "top-3 text-sm text-gray-400"             // resting placeholder
        }`}>
        {label}
      </label>
    </div>
  );
}