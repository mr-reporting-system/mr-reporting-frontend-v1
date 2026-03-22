import React, { useState, useEffect } from "react";
import { 
  Loader2, MapPin, Map, User, Navigation, Hash, Layers, Save, 
  CheckCircle2, Edit2, Trash2, MapPinned
} from "lucide-react";
import api from "../../../services/api";

export default function AreaCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Dropdown & Table Data States
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);

  const [formData, setFormData] = useState({
    stateId: "",
    districtId: "",
    employeeId: "",
    areaName: "",
    areaCode: "",
    areaType: "" 
  });

  // 1. Initial Load: Fetch only States and existing Areas
  useEffect(() => {
    fetchInitialData();
  }, []);

  // 2. Fetch Districts when State changes
  useEffect(() => {
    if (formData.stateId) {
      fetchDistrictsByState(formData.stateId);
    } else {
      setDistricts([]);
      setEmployees([]); 
    }
  }, [formData.stateId]);

  // 3. Fetch Employees ONLY when both State AND District are selected
  useEffect(() => {
    if (formData.stateId && formData.districtId) {
      fetchFilteredEmployees(formData.stateId, formData.districtId);
    } else {
      setEmployees([]); 
    }
  }, [formData.stateId, formData.districtId]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [statesRes, areasRes] = await Promise.all([
        api.get('/api/masters/states'),
        api.get('/api/masters/areas')
      ]);
      
      if (statesRes.data?.success) setStates(statesRes.data.data);
      if (areasRes.data?.success) setAreas(areasRes.data.data);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistrictsByState = async (stateId) => {
    try {
      const response = await api.get(`/api/masters/districts?stateId=${stateId}`);
      if (response.data?.success) setDistricts(response.data.data);
    } catch (err) {
      console.error("Failed to fetch districts", err);
      setDistricts([]);
    }
  };

  const fetchFilteredEmployees = async (stateId, districtId) => {
    try {
      const response = await api.get(`/api/masters/employees/filter?stateId=${stateId}&districtId=${districtId}`);
      if (response.data?.success) {
        setEmployees(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch filtered employees", err);
      setEmployees([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === "areaCode" ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleStateChange = (e) => {
    setFormData(prev => ({ ...prev, stateId: e.target.value, districtId: "", employeeId: "" }));
  };

  const handleDistrictChange = (e) => {
    setFormData(prev => ({ ...prev, districtId: e.target.value, employeeId: "" }));
  };

  // 🚀 UPDATE PREPARATION: Populates the form and sets the editingId
  const handleEditClick = (item) => {
    setEditingId(item.id);
    setFormData({
      stateId: item.stateId || item.state?.id || item.state_id || "",
      districtId: item.districtId || item.district?.id || item.district_id || "",
      employeeId: item.employeeId || item.employee?.id || item.employee_id || "",
      areaName: item.areaName || item.area_name || "",
      areaCode: item.areaCode || item.area_code || "",
      areaType: item.areaType || item.area_type || item.type || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🚀 DELETE LOGIC: Hits the DELETE endpoint
  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this area?")) return;
    
    setError("");
    setSuccessMsg("");
    
    try {
      const response = await api.delete(`/api/masters/areas/${id}`);
      if (response.status === 200 || response.status === 204 || response.data?.success) {
        setSuccessMsg("Area deleted successfully!");
        fetchInitialData(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete area.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 🚀 CREATE / UPDATE LOGIC: Automatically switches to PUT if editingId exists
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);

    const payload = {
      stateId: parseInt(formData.stateId),
      districtId: parseInt(formData.districtId),
      employeeId: parseInt(formData.employeeId),
      areaName: formData.areaName,
      areaCode: formData.areaCode || null,
      areaType: formData.areaType
    };

    try {
      let response;
      if (editingId) {
        // Hits the PUT endpoint when updating
        response = await api.put(`/api/masters/areas/${editingId}`, payload);
      } else {
        // Hits the POST endpoint when creating
        response = await api.post('/api/masters/areas', payload);
      }
      
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        setSuccessMsg(editingId ? "Area updated successfully!" : "Area created successfully!");
        setFormData({ stateId: "", districtId: "", employeeId: "", areaName: "", areaCode: "", areaType: "" });
        setEditingId(null);
        fetchInitialData(); 
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save area.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAreas = areas.filter(item => {
    const sId = item.stateId || item.state_id || item.state?.id;
    const dId = item.districtId || item.district_id || item.district?.id;
    const eId = item.employeeId || item.employee_id || item.employee?.id;

    return sId?.toString() === formData.stateId?.toString() &&
           dId?.toString() === formData.districtId?.toString() &&
           eId?.toString() === formData.employeeId?.toString();
  });

  const selectedStateName = states.find(s => s.id?.toString() === formData.stateId)?.state_name || "N/A";
  const selectedDistrictName = districts.find(d => d.id?.toString() === formData.districtId)?.district_name || "N/A";
  const selectedEmployeeName = employees.find(e => e.id?.toString() === formData.employeeId)?.name || "N/A";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 🌟 TOP CARD: FORM */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MapPinned className="text-blue-600" size={24} />
            {editingId ? "Edit Employee Area" : "Employee Area Creation"}
          </h2>
          {editingId && (
            <button onClick={() => { setEditingId(null); setFormData({ stateId: "", districtId: "", employeeId: "", areaName: "", areaCode: "", areaType: "" }); }} className="text-sm text-gray-500 hover:text-red-500 underline transition-colors">
              Cancel Edit
            </button>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-4 border border-red-100">{error}</div>}
        {successMsg && <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-md mb-4 border border-blue-100 flex items-center gap-2"><CheckCircle2 size={18}/> {successMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FloatingSelect label="Select State *" name="stateId" value={formData.stateId} onChange={handleStateChange} required icon={MapPin}>
              <option value=""></option>
              {states.map(s => <option key={s.id} value={s.id}>{s.state_name}</option>)}
            </FloatingSelect>

            <FloatingSelect label="Select District *" name="districtId" value={formData.districtId} onChange={handleDistrictChange} required disabled={!formData.stateId} icon={Map}>
              <option value=""></option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.district_name}</option>)}
            </FloatingSelect>

            <FloatingSelect label="Select Employee *" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required disabled={!formData.districtId} icon={User}>
              <option value=""></option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </FloatingSelect>

            <FloatingInput label="Area Name *" name="areaName" value={formData.areaName} onChange={handleInputChange} required icon={Navigation} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
            <FloatingInput label="Area Code" name="areaCode" value={formData.areaCode} onChange={handleInputChange} icon={Hash} />

            <FloatingSelect label="Area Type *" name="areaType" value={formData.areaType} onChange={handleInputChange} required icon={Layers}>
              <option value=""></option>
              <option value="HQ">HQ (Headquarter)</option>
              <option value="EX">EX (Ex-Station)</option>
            </FloatingSelect>

            <div className="lg:col-span-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-md text-sm font-semibold transition-all hover:-translate-y-0.5 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (editingId ? <Edit2 size={16} /> : <Save size={16} />)}
                {editingId ? "Update Area" : "Create Area"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 🌟 BOTTOM CARD: TABLE */}
      {formData.stateId && formData.districtId && formData.employeeId && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-6">Employee Area List</h3>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-blue-600">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="text-sm font-medium text-gray-500">Loading areas...</p>
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4"><MapPinned className="text-gray-400" size={32} /></div>
              <h3 className="text-gray-800 font-semibold mb-1">No Areas Found</h3>
              <p className="text-sm text-gray-500 max-w-sm">There are no areas assigned to this employee yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm text-left min-w-[1000px]">
                <thead className="bg-blue-600 text-white uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4 border-r border-blue-500/50">State Name</th>
                    <th className="py-3 px-4 border-r border-blue-500/50">Headquarter Name</th>
                    <th className="py-3 px-4 border-r border-blue-500/50">Employee Name</th>
                    <th className="py-3 px-4 border-r border-blue-500/50">Area Name</th>
                    <th className="py-3 px-4 border-r border-blue-500/50 text-center">Type</th>
                    <th className="py-3 px-4 border-r border-blue-500/50 text-center">Status</th>
                    <th className="py-3 px-4 border-r border-blue-500/50 text-center">Total Doctor</th>
                    <th className="py-3 px-4 border-r border-blue-500/50 text-center">Total Chemist</th>
                    <th className="py-3 px-4 border-r border-blue-500/50 text-center">Total Stockist</th>
                    <th className="py-3 px-4 border-r border-blue-500/50 text-center">Edit</th>
                    <th className="py-3 px-4 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredAreas.map((item) => (
                    <tr key={item.id} className={`transition-colors duration-200 ${editingId === item.id ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}>
                      <td className="py-3 px-4 text-gray-700">{selectedStateName}</td>
                      <td className="py-3 px-4 text-gray-700">{selectedDistrictName}</td>
                      <td className="py-3 px-4 text-gray-700">{selectedEmployeeName}</td>
                      
                      <td className="py-3 px-4 text-gray-800 font-bold">{item.areaName || item.area_name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{item.areaType || item.area_type || item.type}</span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">{item.status?.toString() || 'true'}</td>
                      <td className="py-3 px-4 text-center text-gray-700 font-medium">{item.totalDoctor || item.total_doctor || 0}</td>
                      <td className="py-3 px-4 text-center text-gray-700 font-medium">{item.totalChemist || item.total_chemist || 0}</td>
                      <td className="py-3 px-4 text-center text-gray-700 font-medium">{item.totalStockist || item.total_stockist || 0}</td>
                      <td className="py-3 px-4 flex justify-center">
                        <button onClick={() => handleEditClick(item)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-all focus:outline-none"><Edit2 size={16} /></button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDeleteClick(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all focus:outline-none"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 🧱 REUSABLE FLOATING UI COMPONENTS

function FloatingInput({ label, name, type = "text", value, onChange, required, disabled, icon: Icon }) {
  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full">
        <input 
          type={type} id={name} name={name} value={value || ""} onChange={onChange} required={required} placeholder=" " disabled={disabled}
          className={`peer w-full rounded-md border border-blue-600 bg-transparent pl-3 pr-10 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:outline-none focus:ring-1 focus:border-blue-700 focus:ring-blue-700 ${disabled ? 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed' : ''}`}
        />
        <label 
          htmlFor={name}
          className={`pointer-events-none absolute left-2.5 top-2.5 origin-[0] -translate-y-[1.15rem] scale-75 transform bg-white px-1 text-[13px] font-semibold uppercase tracking-wide transition-all duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:font-normal peer-focus:-translate-y-[1.15rem] peer-focus:scale-75 peer-focus:font-semibold ${disabled ? 'text-gray-400' : 'text-blue-600 peer-focus:text-blue-600'}`}
        >
          {label}
        </label>
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Icon className={`h-[18px] w-[18px] ${disabled ? 'text-gray-400' : 'text-slate-700'}`} />
          </div>
        )}
      </div>
    </div>
  );
}

function FloatingSelect({ label, name, value, onChange, required, disabled, children, icon: Icon }) {
  return (
    <div className="relative w-full">
      <select 
        id={name} name={name} value={value || ""} onChange={onChange} required={required} disabled={disabled}
        className={`peer w-full rounded-md border ${disabled ? 'border-gray-300 bg-gray-50 cursor-not-allowed text-gray-400' : 'border-blue-600 bg-transparent text-gray-900'} pl-3 pr-10 py-2.5 text-sm transition-all duration-200 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 appearance-none`}
      >
        {children}
      </select>
      <label 
        htmlFor={name} 
        className={`pointer-events-none absolute left-2.5 origin-[0] transform bg-white px-1 text-[13px] uppercase tracking-wide transition-all duration-200
        ${value ? '-translate-y-[1.15rem] scale-75 top-2.5 font-semibold' : 'translate-y-0 scale-100 top-3 text-gray-500 font-normal'}
        peer-focus:-translate-y-[1.15rem] peer-focus:scale-75 peer-focus:top-2.5 peer-focus:font-semibold ${disabled ? '!text-gray-400' : 'text-blue-600 peer-focus:text-blue-600'}`}
      >
        {label}
      </label>
      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 ${disabled ? 'text-gray-300' : 'text-slate-700'}`}>
        {Icon ? <Icon className="h-[18px] w-[18px]" /> : null}
      </div>
    </div>
  );
}