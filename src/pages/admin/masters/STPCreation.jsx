import React, { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, AlertCircle, ChevronDown, Check, Trash2, Edit2, MapPin } from "lucide-react";
import api from "../../../services/api";

export default function STPCreation() {
  // ── UI State ──
  const [error, setError] = useState("");
  const [popup, setPopup] = useState({ isOpen: false, message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterToggle, setFilterToggle] = useState(true);
  const [editingStpId, setEditingStpId] = useState(null);

  // ── Dropdown Data ──
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);

  // ── Selections ──
  const [selectedDesignationId, setSelectedDesignationId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  // ── Form State ──
  const [formData, setFormData] = useState({
    fromArea: "",
    toArea: "",
    type: "", 
    frc: "",
    distance: "",
    frequencyVisit: ""
  });

  // ── Table Data ──
  const [stpData, setStpData] = useState([]);
  const [selectedStpIds, setSelectedStpIds] = useState([]);

  // ── Initial Fetch ──
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

  // ── Fetch Employees when Designation Changes ──
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

  // ── Fetch Areas and STP Data when Employee Changes ──
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

  // ── Form Handlers ──
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === "fromArea" && value && !editingStpId) {
        const selectedAreaObj = areas.find(a => (a.area?.id || a.id).toString() === value.toString());
        if (selectedAreaObj) {
          const targetObj = selectedAreaObj.area || selectedAreaObj;
          const areaType = targetObj.type || targetObj.area_type || targetObj.areaType;
          if (areaType) {
            newData.type = areaType;
          }
        }
      }
      
      return newData;
    });
  };

  const handleFrcChange = (e) => {
    const numbersOnly = e.target.value.replace(/\D/g, "");
    setFormData(prev => ({
      ...prev,
      frc: numbersOnly ? `Days: ${numbersOnly}` : ""
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
      frequencyVisit: item.frequencyVisit || ""
    });
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveStp = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    if (isSubmitting) return;

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
        frequencyVisit: parseInt(formData.frequencyVisit)
      };

      let res;
      if (editingStpId) {
        res = await api.put(`/api/masters/stps/${editingStpId}`, payload);
      } else {
        res = await api.post("/api/masters/stps", payload);
      }

      if (res.data?.success || res.status === 200 || res.status === 201) {
        setPopup({ isOpen: true, message: editingStpId ? "STP Updated Successfully!" : "STP Created Successfully!" });
        setFormData({ fromArea: "", toArea: "", type: "", frc: "", distance: "", frequencyVisit: "" });
        setEditingStpId(null);
        fetchAreasAndStpData(selectedEmployeeId); 
      } else {
        setError(res.data?.message || "Failed to save STP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save STP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStp = async () => {
    if (selectedStpIds.length === 0) return;
    
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

  // ── Checkbox Handlers ──
  const toggleStpRow = (id) => setSelectedStpIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAllStpRows = (e) => setSelectedStpIds(e.target.checked ? stpData.map(item => item.id) : []);

  const isFormValid = formData.fromArea && formData.toArea && formData.type && formData.distance && formData.frequencyVisit && selectedEmployeeId;

  const getAreaProps = (a) => {
    const id = a.area?.id || a.id;
    const name = a.area?.name || a.area?.areaName || a.area?.area_name || a.name || a.areaName || a.area_name || "Unknown Area";
    return { id, name };
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-8 px-2 sm:px-0">
      
      {/* ── TOP HEADER & FILTERS ── */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-lg font-bold text-gray-800">STP Creation</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilterToggle(!filterToggle)}
              className={`w-10 h-5 rounded-full relative transition-colors ${filterToggle ? 'bg-blue-500/90' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${filterToggle ? 'left-5' : 'left-1'}`} />
            </button>
            <span className="text-sm font-semibold text-gray-600">Filter</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-3 py-2 text-sm rounded-md mb-4 border border-red-100 flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {filterToggle && (
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <CustomBlueSelect 
                label="SELECT DESIGNATION" 
                value={selectedDesignationId} 
                onChange={(e) => {
                  setSelectedDesignationId(e.target.value);
                  setSelectedEmployeeId("");
                }} 
              >
                <option value=""></option>
                {designations.map(d => <option key={d.id} value={d.id}>{d.designation_name || d.name}</option>)}
              </CustomBlueSelect>
            </div>

            <div className="w-full md:w-1/3">
              <CustomBlueSelect 
                label="EMPLOYEE NAME" 
                value={selectedEmployeeId} 
                disabled={!selectedDesignationId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)} 
              >
                <option value=""></option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name || e.employee_name}</option>)}
              </CustomBlueSelect>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE STP FORM ── */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all ${selectedEmployeeId ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">{editingStpId ? "Edit STP" : "Create STP"}</h3>
          {editingStpId && (
            <button 
              type="button"
              onClick={() => {
                setEditingStpId(null);
                setFormData({ fromArea: "", toArea: "", type: "", frc: "", distance: "", frequencyVisit: "" });
              }}
              className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>
        
        <form onSubmit={handleSaveStp} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CustomBlueSelect label="FROM AREA" name="fromArea" value={formData.fromArea} onChange={handleInputChange}>
              <option value=""></option>
              {areas.map(a => {
                const { id, name } = getAreaProps(a);
                return <option key={id} value={id}>{name}</option>;
              })}
            </CustomBlueSelect>

            <CustomBlueSelect label="TO AREA" name="toArea" value={formData.toArea} onChange={handleInputChange}>
              <option value=""></option>
              {areas.map(a => {
                const { id, name } = getAreaProps(a);
                return <option key={id} value={id}>{name}</option>;
              })}
            </CustomBlueSelect>

            <CustomBlueSelect label="TYPE" name="type" value={formData.type} onChange={handleInputChange}>
              <option value=""></option>
              <option value="HQ">HQ</option>
              <option value="EX">EX</option>
            </CustomBlueSelect>

            <FloatingInput label="FRC (e.g. 15)" name="frc" value={formData.frc} onChange={handleFrcChange} placeholder="Enter days..." />
            <FloatingInput label="DISTANCE" name="distance" type="number" value={formData.distance} onChange={handleInputChange} />
            <FloatingInput label="FREQUENCY VISIT" name="frequencyVisit" type="number" value={formData.frequencyVisit} onChange={handleInputChange} />
          </div>

          <div className="flex">
            <button 
              type="submit" 
              disabled={!isFormValid || isSubmitting}
              className={`px-8 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 
                ${isFormValid ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />} 
              {editingStpId ? "Update STP" : "Add STP"}
            </button>
          </div>
        </form>
      </div>

      {/* ── STP DATA TABLE ── */}
      {selectedEmployeeId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 border-b border-gray-100 text-white">
            <h3 className="font-bold text-sm tracking-wide text-black">STP Data</h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-blue-500 text-white border-t border-blue-600">
                <tr>
                  <th className="w-12 py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      onChange={toggleAllStpRows} 
                      checked={stpData.length > 0 && selectedStpIds.length === stpData.length} 
                      className="w-3.5 h-3.5 rounded text-blue-800 cursor-pointer border-white focus:ring-white" 
                    />
                  </th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase">No.</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase">From Area</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase">To Area</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase">Type</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase">Distance</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase">Frequency Visit</th>
                  <th className="py-3 px-4 font-semibold text-xs uppercase text-center">Edit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <tr><td colSpan="8" className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                ) : stpData.length === 0 ? (
                  <tr><td colSpan="8" className="py-12 text-center text-gray-400">No STP data found for this employee.</td></tr>
                ) : (
                  stpData.map((item, index) => (
                    <tr key={item.id} className={`transition-colors hover:bg-blue-50/30 ${selectedStpIds.includes(item.id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="py-3 px-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedStpIds.includes(item.id)} 
                          onChange={() => toggleStpRow(item.id)} 
                          className="w-3.5 h-3.5 rounded text-blue-500 cursor-pointer border-gray-300 focus:ring-blue-500" 
                        />
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{index + 1}</td>
                      <td className="py-3 px-4 text-gray-600 font-medium">{item.fromArea?.name || item.fromArea?.areaName || item.fromAreaName || "—"}</td>
                      <td className="py-3 px-4 text-gray-600 font-medium">{item.toArea?.name || item.toArea?.areaName || item.toAreaName || "—"}</td>
                      <td className="py-3 px-4 text-gray-800">{item.areaType || item.type || "—"}</td>
                      <td className="py-3 px-4 text-gray-600">{item.distance}</td>
                      <td className="py-3 px-4 text-gray-600">{item.frequencyVisit}</td>
                      <td className="py-3 px-4 flex justify-center">
                        <button 
                          onClick={() => handleEditClick(item)} 
                          className="text-blue-500 hover:text-blue-700 transition-colors" 
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button 
              onClick={handleDeleteStp}
              disabled={selectedStpIds.length === 0 || isSubmitting}
              className={`px-6 py-2.5 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 
                ${(selectedStpIds.length > 0) ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
              Delete STP
            </button>
          </div>
        </div>
      )}

      {/* 🌟 SUCCESS POPUP 🌟 */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-xs w-full mx-4 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 border-2 border-blue-100 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-blue-500/80" strokeWidth={3} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-6">{popup.message}</h3>
            <button onClick={() => setPopup({ isOpen: false, message: "" })} className="bg-blue-500/90 hover:bg-blue-600/90 text-white w-full py-2.5 rounded-lg font-bold shadow-sm transition-all active:scale-95">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable Components ───

function FloatingInput({ label, name, type = "text", value, onChange, disabled, placeholder }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(value);

  const borderClass = disabled
    ? "border-gray-200 bg-gray-50 cursor-not-allowed"
    : hasValue || isFocused
      ? "border-blue-500 ring-1 ring-blue-100"
      : "border-gray-300";

  const labelClass = disabled
    ? hasValue ? "-top-2.5 text-[11px] text-gray-400" : "top-2.5 text-sm text-gray-400"
    : hasValue || isFocused
      ? "-top-2.5 text-[11px] text-blue-600"
      : "top-2.5 text-sm text-gray-500";

  return (
    <div className="relative w-full">
      <input
        type={type} id={name} name={name} value={value || ""} onChange={onChange} disabled={disabled}
        placeholder={isFocused ? placeholder : " "}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full rounded-md border px-3 py-2.5 text-sm text-gray-900 transition-all focus:outline-none ${borderClass} ${disabled ? "text-gray-400" : ""}`}
      />
      <label htmlFor={name} className={`absolute left-2.5 px-1 bg-white pointer-events-none z-10 transition-all duration-200 font-semibold ${labelClass}`}>
        {label}
      </label>
    </div>
  );
}

function CustomBlueSelect({ label, name, value, onChange, disabled, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const options = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return null;
    return { value: child.props.value, label: child.props.children };
  }).filter(Boolean);
  const selectedOption = options.find(opt => opt.value == value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full group select-none">
      <select name={name} value={value || ""} onChange={(e) => onChange(e)} className="hidden" readOnly>
        <option value={value}>{value}</option>
      </select>

      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full rounded-md border px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-all relative z-10
          ${disabled ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : 'border-gray-300 bg-white hover:border-blue-400/60'}
          ${isOpen || value ? 'border-blue-500/80 ring-1 ring-blue-50' : ''}`}
      >
        <span className={`block truncate ${selectedOption?.value ? 'text-gray-900' : 'text-transparent'}`}>
          {selectedOption?.label || " "}
        </span>
        <ChevronDown size={16} className={`${disabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-blue-400/80'} ${isOpen ? '!text-blue-500/80 rotate-180' : ''} transition-transform`} />
      </div>
      <label className={`absolute left-2.5 px-1 transition-all duration-200 pointer-events-none z-20
          ${value || isOpen ? '-top-2 text-[10px] font-bold text-blue-600 bg-white' : 'top-3 text-sm text-gray-500 bg-transparent'}
          ${disabled && '!text-gray-300'}`}>
        {label}
      </label>
      {isOpen && !disabled && (
        <div className="absolute top-[105%] left-0 w-full bg-white border border-gray-100 rounded-md shadow-lg z-[110] max-h-52 overflow-y-auto">
          <ul className="py-1">
            {options.map((opt, idx) => opt.value !== "" && (
              <li key={idx} onClick={() => { onChange({ target: { name, value: opt.value } }); setIsOpen(false); }} className={`px-3 py-2.5 text-xs cursor-pointer transition-colors ${value == opt.value ? 'bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-500/80' : 'text-gray-600 hover:bg-blue-500 hover:text-white'}`}>
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}