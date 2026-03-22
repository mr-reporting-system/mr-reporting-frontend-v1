import React, { useState, useEffect, useRef } from "react";
import { Loader2, Check, Briefcase, User, MapPin, Map, ChevronDown } from "lucide-react";
import api from "../../../services/api";

export default function ChangeHeadquarter() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Success Popup Modal State
  const [popup, setPopup] = useState({ isOpen: false, message: "" });

  // Dropdown Lists
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    designationId: "",
    employeeId: "",
    stateId: "",
    districtId: ""
  });

  // ─── 1. INITIAL DATA FETCH (Only Designations & States) ────────────
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [desigRes, statesRes] = await Promise.all([
        api.get('/api/masters/designations').catch(() => ({ data: { success: false }})),
        api.get('/api/masters/states').catch(() => ({ data: { success: false }}))
      ]);
      
      if (desigRes.data?.success) setDesignations(desigRes.data.data || []);
      if (statesRes.data?.success) setStates(statesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
      setError("Failed to load dropdown data.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 2. CASCADING FETCH: Designation -> Employees ───────────────────
  useEffect(() => {
    if (formData.designationId) {
      fetchEmployeesByDesignation(formData.designationId);
    } else {
      setEmployees([]);
      setFormData(prev => ({ ...prev, employeeId: "" }));
    }
  }, [formData.designationId]);

  const fetchEmployeesByDesignation = async (designationId) => {
    try {
      const response = await api.get(`/api/masters/employees/designation/${designationId}`);
      if (response.data?.success) setEmployees(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch employees", err);
      setEmployees([]);
    }
  };

  // ─── 3. CASCADING FETCH: State -> Districts ─────────────────────────
  useEffect(() => {
    if (formData.stateId) {
      fetchDistrictsByState(formData.stateId);
    } else {
      setDistricts([]);
      setFormData(prev => ({ ...prev, districtId: "" }));
    }
  }, [formData.stateId]);

  const fetchDistrictsByState = async (stateId) => {
    try {
      const response = await api.get(`/api/masters/districts?stateId=${stateId}`);
      if (response.data?.success) setDistricts(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch districts", err);
      setDistricts([]);
    }
  };

  // ─── 4. HANDLERS ────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.stateId || !formData.districtId) {
      setError("Please fill all required fields.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const payload = {
      employeeId: parseInt(formData.employeeId),
      stateId: parseInt(formData.stateId),
      districtId: parseInt(formData.districtId)
    };

    try {
      const response = await api.put('/api/masters/employees/change-hq', payload);
      
      if (response.status === 200 || response.data?.success) {
        setPopup({ isOpen: true, message: "Headquarter Changed Successfully" });
        setFormData({ designationId: "", employeeId: "", stateId: "", districtId: "" });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change headquarter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 relative">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Change Headquarter
          </h2>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main 4-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start pt-2">
            
            <CustomFloatingSelect label="SELECT DESIGNATION" name="designationId" value={formData.designationId} onChange={handleInputChange} icon={Briefcase}>
              <option value=""></option>
              {designations.map(d => <option key={d.id} value={d.id}>{d.designation_name || d.name}</option>)}
            </CustomFloatingSelect>

            <CustomFloatingSelect label="SELECT EMPLOYEE *" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required disabled={!formData.designationId} icon={User}>
              <option value=""></option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name || e.employee_name}</option>)}
            </CustomFloatingSelect>

            <CustomFloatingSelect label="SELECT STATE *" name="stateId" value={formData.stateId} onChange={handleInputChange} required icon={MapPin}>
              <option value=""></option>
              {states.map(s => <option key={s.id} value={s.id}>{s.state_name}</option>)}
            </CustomFloatingSelect>

            <CustomFloatingSelect label="SELECT DISTRICT *" name="districtId" value={formData.districtId} onChange={handleInputChange} required disabled={!formData.stateId} icon={Map}>
              <option value=""></option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.district_name || d.name}</option>)}
            </CustomFloatingSelect>

          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit"
              disabled={!formData.employeeId || !formData.stateId || !formData.districtId || isSubmitting}
              className={`px-8 py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 
                ${formData.employeeId && formData.stateId && formData.districtId 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "✓"} Change HQ
            </button>
          </div>
        </form>
      </div>

      {/* 🌟 SUCCESS POPUP MODAL 🌟 */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 border-4 border-blue-200 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Check size={40} className="text-blue-500" strokeWidth={3} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 text-center mb-8">
              {popup.message}
            </h3>
            
            <button 
              onClick={() => setPopup({ isOpen: false, message: "" })}
              className="bg-blue-500 hover:bg-blue-600 text-white w-full py-2.5 rounded-lg font-bold shadow-md shadow-blue-500/30 transition-all active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ✨ FULLY CUSTOM MODERN SELECT COMPONENT ✨ ─────────────
function CustomFloatingSelect({ label, name, value, onChange, required, disabled, children, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Extract options from the <option> children passed down from parent
  const options = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return null;
    return { value: child.props.value, label: child.props.children };
  }).filter(Boolean);

  const selectedOption = options.find(opt => opt.value === value);

  // Handle clicking outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Simulate a native event object to pass back to the parent onChange handler
  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full group select-none">
      
      {/* ⚠️ Hidden Native Select for required form validation ⚠️ */}
      <select name={name} value={value} required={required} className="absolute opacity-0 w-0 h-0 pointer-events-none" readOnly tabIndex={-1}>
        <option value={value}>{value}</option>
      </select>

      {/* Visible Input Trigger */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full rounded-md border-2 px-4 py-3 text-sm flex items-center justify-between cursor-pointer transition-colors relative z-10
          ${disabled 
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'border-gray-300 bg-white text-gray-900 hover:border-blue-400 focus:border-blue-600'
          }
          ${isOpen ? '!border-blue-600 ring-0' : ''}
        `}
      >
        <span className={`block truncate ${selectedOption?.value ? 'text-gray-900' : 'text-transparent'}`}>
          {selectedOption?.label || " "}
        </span>

        <div className={`flex items-center transition-colors duration-200 ${disabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-blue-500'} ${isOpen ? '!text-blue-600' : ''}`}>
          {Icon ? <Icon size={18} strokeWidth={2} /> : <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
        </div>
      </div>
      
      {/* Floating Label with Cutout */}
      <label 
        className={`absolute left-3 px-1 transition-all duration-200 pointer-events-none z-20
          ${value || isOpen ? '-top-2 text-[11px] font-bold text-blue-600 bg-white' : 'top-3.5 text-sm text-gray-500 bg-transparent'}
          ${disabled && '!text-gray-400 bg-transparent'}
        `}
      >
        {label}
      </label>

      {/* Modern Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[110%] left-0 w-full bg-white border border-gray-100 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <ul className="py-1">
            {options.map((opt, idx) => {
              // Skip rendering the empty placeholder value in the dropdown list
              if (opt.value === "" && !opt.label) return null;
              
              return (
                <li
                  key={idx}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150
                    ${value === opt.value 
                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600' 
                      : 'text-gray-700 hover:bg-blue-600 hover:text-white border-l-2 border-transparent'
                    }
                  `}
                >
                  {opt.label}
                </li>
              );
            })}
            
            {/* Show message if empty */}
            {options.filter(opt => opt.value !== "" || opt.label).length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-500 text-center italic">No options available</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}