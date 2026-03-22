import React, { useState, useEffect } from "react";
import { 
  Loader2, Users, Save, CheckCircle2,
  MapPin, Map, Briefcase, UserCheck, CalendarPlus, CalendarCheck, Stamp, IdCard,
  User, Phone, Mail, CalendarHeart, Globe, Fingerprint, CreditCard, MapPinned, 
  Building2, Landmark, Hash, ChevronDown, Calendar, Eye, EyeOff
} from "lucide-react";
import api from "../../../services/api";

export default function UserCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [managers, setManagers] = useState([]);

  const [formData, setFormData] = useState({
    name: "", mobile: "", email: "", dob: "", gender: "", religion: "",
    aadhar: "", pan: "", address: "", stateId: "", districtId: "", bankName: "",
    bankAccountNumber: "", ifscCode: "", designationId: "", reportingManagerId: "",
    dateOfJoining: "", dateOfReporting: "", dateOfConfirmation: "", userCode: "",
    password: "", confirmPassword: ""
  });

  // State to hold real-time inline errors
  const [fieldErrors, setFieldErrors] = useState({});

  // 🌟 UPDATED: Derived state to check if the currently selected designation is exactly "MR"
  const selectedDesignation = designations.find(d => d.id.toString() === formData.designationId);
  const isMrSelected = selectedDesignation && (selectedDesignation.name === "MR" || selectedDesignation.designation_name === "MR");

  useEffect(() => {
    fetchInitialDropdownData();
  }, []);

  useEffect(() => {
    if (formData.stateId) {
      fetchDistrictsByState(formData.stateId);
    } else {
      setDistricts([]); 
    }
  }, [formData.stateId]);

  // 🌟 UPDATED: If the user selects anything OTHER than MR, automatically clear the Reporting Manager field
  useEffect(() => {
    if (!isMrSelected) {
      setFormData(prev => ({ ...prev, reportingManagerId: "" }));
    }
  }, [isMrSelected]);

  const fetchInitialDropdownData = async () => {
    try {
      setIsLoading(true);
      const [statesRes, desigRes, managersRes] = await Promise.all([
        api.get('/api/masters/states/all'),
        api.get('/api/masters/designations'),
        api.get('/api/masters/employees') 
      ]);
      
      if (statesRes.data?.success) setStates(statesRes.data.data);
      if (desigRes.data?.success) setDesignations(desigRes.data.data);
      if (managersRes.data?.success) setManagers(managersRes.data.data);
    } catch (err) {
      console.error("Failed to fetch dropdown data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistrictsByState = async (stateId) => {
    try {
      const response = await api.get(`/api/masters/districts/all?stateId=${stateId}`);
      if (response.data?.success) setDistricts(response.data.data);
    } catch (err) {
      console.error("Failed to fetch districts", err);
      setDistricts([]);
    }
  };

  // Real-time validation logic
  const validateField = (name, val, currentData) => {
    let errMsg = "";
    if (val.length > 0) {
      if (name === "mobile" && val.length < 10) errMsg = "Mobile must be exactly 10 digits.";
      if (name === "aadhar" && val.length < 12) errMsg = "Aadhaar must be exactly 12 digits.";
      if (name === "pan" && val.length < 10) errMsg = "PAN must be exactly 10 characters.";
      if (name === "bankAccountNumber" && val.length < 8) errMsg = "Bank Account must be at least 8 digits.";
      if (name === "ifscCode" && val.length < 11) errMsg = "IFSC Code must be exactly 11 characters.";
      if (name === "confirmPassword" && val !== currentData.password) errMsg = "Passwords do not match.";
      
      // Edge case: update confirmPassword error dynamically if they go back and change the original password
      if (name === "password" && currentData.confirmPassword) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: val !== currentData.confirmPassword ? "Passwords do not match." : ""
        }));
      }
    }
    setFieldErrors(prev => ({ ...prev, [name]: errMsg }));
  };

  // Intercepting inputs for strict formatting
  const handleInputChange = (e) => {
    let { name, value } = e.target;

    if (name === "mobile") value = value.replace(/\D/g, '').slice(0, 10);
    if (name === "aadhar") value = value.replace(/\D/g, '').slice(0, 12);
    if (name === "bankAccountNumber") value = value.replace(/\D/g, '').slice(0, 18); // Max 18 digits
    if (name === "pan") value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    if (name === "ifscCode") value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);

    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      validateField(name, value, updatedData); // Run validation on every keystroke
      return updatedData;
    });
  };

  const handleStateChange = (e) => {
    setFormData(prev => ({ ...prev, stateId: e.target.value, districtId: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Final Validation Checks before submission
    if (formData.mobile.length < 10) return setError("Mobile number must be exactly 10 digits.");
    if (formData.aadhar && formData.aadhar.length < 12) return setError("Aadhaar must be exactly 12 digits.");
    if (formData.pan && formData.pan.length < 10) return setError("PAN must be exactly 10 alphanumeric characters.");
    if (formData.bankAccountNumber && formData.bankAccountNumber.length < 8) return setError("Bank Account must be at least 8 digits.");
    if (formData.ifscCode && formData.ifscCode.length < 11) return setError("IFSC Code must be exactly 11 characters.");
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match!");

    setIsSubmitting(true);

    const payload = {
      name: formData.name, mobile: formData.mobile, email: formData.email,
      dob: formData.dob || null, gender: formData.gender, religion: formData.religion || null,
      aadhar: formData.aadhar || null, pan: formData.pan || null, address: formData.address || null,
      stateId: formData.stateId ? parseInt(formData.stateId) : null,
      districtId: formData.districtId ? parseInt(formData.districtId) : null,
      bankName: formData.bankName || null, bankAccountNumber: formData.bankAccountNumber || null,
      ifscCode: formData.ifscCode || null, designationId: formData.designationId ? parseInt(formData.designationId) : null,
      reportingManagerId: formData.reportingManagerId ? parseInt(formData.reportingManagerId) : null,
      dateOfJoining: formData.dateOfJoining || null, dateOfReporting: formData.dateOfReporting || null,
      dateOfConfirmation: formData.dateOfConfirmation || null, userCode: formData.userCode || null,
      password: formData.password
    };

    try {
      const response = await api.post('/api/masters/employees', payload);
      
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        
        // 1. Show the success message
        setSuccessMsg("Employee created successfully!");
        
        // 2. Clear out the entire form by resetting the state
        setFormData({
          name: "", mobile: "", email: "", dob: "", gender: "Male", religion: "",
          aadhar: "", pan: "", address: "", stateId: "", districtId: "", bankName: "",
          bankAccountNumber: "", ifscCode: "", designationId: "", reportingManagerId: "",
          dateOfJoining: "", dateOfReporting: "", dateOfConfirmation: "", userCode: "",
          password: "", confirmPassword: ""
        });
        
        // 3. Clear any red inline errors
        setFieldErrors({});

        // 4. Scroll to top to see the green success message, then hide it after 4 seconds
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Employee Creation</h3>
        </div>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-4 border border-red-100">{error}</div>}
        {successMsg && <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-md mb-4 border border-blue-100 flex items-center gap-2"><CheckCircle2 size={18}/> {successMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-8 pt-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FloatingSelect label="Select State *" name="stateId" value={formData.stateId} onChange={handleStateChange} required icon={MapPin}>
              <option value=""></option>
              {states.map(s => <option key={s.id} value={s.id}>{s.state_name}</option>)}
            </FloatingSelect>

            <FloatingSelect label="Select District *" name="districtId" value={formData.districtId} onChange={handleInputChange} required disabled={!formData.stateId} icon={Map}>
              <option value=""></option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.district_name}</option>)}
            </FloatingSelect>

            <FloatingSelect label="Select Designation *" name="designationId" value={formData.designationId} onChange={handleInputChange} required icon={Briefcase}>
              <option value=""></option>
              {designations.map(d => <option key={d.id} value={d.id}>{d.name || d.designation_name}</option>)}
            </FloatingSelect>

            {/* 🌟 UPDATED: Reporting Manager Dropdown with disable logic and designation names */}
            <FloatingSelect 
              label="Select Reporting Manager" 
              name="reportingManagerId" 
              value={formData.reportingManagerId} 
              onChange={handleInputChange} 
              icon={UserCheck} 
              disabled={!isMrSelected} 
            >
              
              <option value="null">{!isMrSelected ? "Not Applicable (Top Level)" : "None"}</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} - {m.designation?.name || m.designation?.designation_name || "Manager"}
                </option>
              ))}
            </FloatingSelect>

            <FloatingDate label="Date of Joining *" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleInputChange} required icon={CalendarPlus} />
            <FloatingDate label="Date of Reporting *" name="dateOfReporting" value={formData.dateOfReporting} onChange={handleInputChange} required icon={CalendarCheck} />
            <FloatingDate label="Date of Confirmation" name="dateOfConfirmation" value={formData.dateOfConfirmation} onChange={handleInputChange} icon={Stamp} />
            
            <FloatingInput label="User Code" name="userCode" value={formData.userCode} onChange={handleInputChange} icon={IdCard} />
          </div>

          <hr className="border-gray-100" />

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FloatingInput label="Name *" name="name" value={formData.name} onChange={handleInputChange} required icon={User} />
              
              <FloatingInput label="Mobile (10 digits) *" name="mobile" type="text" value={formData.mobile} onChange={handleInputChange} required icon={Phone} error={fieldErrors.mobile} />
              
              <FloatingInput label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} icon={Mail} />
              <FloatingDate label="Date of Birth" name="dob" value={formData.dob} onChange={handleInputChange} icon={CalendarHeart} />
              
              <FloatingSelect label="Select Religion" name="religion" value={formData.religion} onChange={handleInputChange} icon={Globe}>
                <option value=""></option>
                <option value="Hindu">Hindu</option>
                <option value="Muslim">Muslim</option>
                <option value="Christian">Christian</option>
                <option value="Sikh">Sikh</option>
                <option value="Other">Other</option>
              </FloatingSelect>

              <FloatingInput label="Aadhaar (12 digits)" name="aadhar" type="text" value={formData.aadhar} onChange={handleInputChange} icon={Fingerprint} error={fieldErrors.aadhar} />
              <FloatingInput label="PAN (10 chars)" name="pan" value={formData.pan} onChange={handleInputChange} icon={CreditCard} error={fieldErrors.pan} />
              <FloatingInput label="Address" name="address" value={formData.address} onChange={handleInputChange} icon={MapPinned} />
              <FloatingInput label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} icon={Building2} />
              <FloatingInput label="Bank Account Number" name="bankAccountNumber" type="text" value={formData.bankAccountNumber} onChange={handleInputChange} icon={Landmark} error={fieldErrors.bankAccountNumber} />
              <FloatingInput label="IFSC Code (11 chars)" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} icon={Hash} error={fieldErrors.ifscCode} />
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-gray-600 block mb-2">Gender</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" name="gender" value="Male" checked={formData.gender === "Male"} onChange={handleInputChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" /> Male
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" name="gender" value="Female" checked={formData.gender === "Female"} onChange={handleInputChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" /> Female
                </label>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-6">Login Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FloatingInput label="Email (Username)" name="loginEmail" type="email" value={formData.email} disabled={true} icon={Mail} />
              
              <FloatingPassword label="Password *" name="password" value={formData.password} onChange={handleInputChange} required error={fieldErrors.password} />
              <FloatingPassword label="Confirm Password *" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required error={fieldErrors.confirmPassword} />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-md text-sm font-semibold transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 🧱 REUSABLE FLOATING UI COMPONENTS WITH INLINE ERRORS

function FloatingInput({ label, name, type = "text", value, onChange, required, disabled, icon: Icon, error }) {
  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full">
        <input 
          type={type} id={name} name={name} value={value || ""} onChange={onChange} required={required} placeholder=" " disabled={disabled}
          className={`peer w-full rounded-md border ${error ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-blue-600 focus:border-blue-700 focus:ring-blue-700'} bg-transparent pl-3 pr-10 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:outline-none focus:ring-1 ${disabled ? 'bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed' : ''}`}
        />
        <label 
          htmlFor={name}
          className={`pointer-events-none absolute left-2.5 top-2.5 origin-[0] -translate-y-5 scale-[0.85] transform bg-white px-1 text-xs font-semibold uppercase tracking-wide transition-all duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:font-normal peer-focus:-translate-y-5 peer-focus:scale-[0.85] peer-focus:font-semibold ${error ? 'text-red-500 peer-focus:text-red-600' : (disabled ? 'text-gray-400' : 'text-blue-600 peer-focus:text-blue-600')}`}
        >
          {label}
        </label>
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Icon className={`h-[18px] w-[18px] ${error ? 'text-red-500' : (disabled ? 'text-gray-400' : 'text-slate-700')}`} />
          </div>
        )}
      </div>
      {/* Inline Error Message */}
      {error && <p className="text-red-500 text-[11px] mt-1 font-medium pl-1">{error}</p>}
    </div>
  );
}

function FloatingPassword({ label, name, value, onChange, required, error }) {
  const [show, setShow] = useState(false);
  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full">
        <input 
          type={show ? "text" : "password"} id={name} name={name} value={value || ""} onChange={onChange} required={required} placeholder=" "
          className={`peer w-full rounded-md border ${error ? 'border-red-500 focus:border-red-600 focus:ring-red-600' : 'border-blue-600 focus:border-blue-700 focus:ring-blue-700'} bg-transparent pl-3 pr-10 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:outline-none focus:ring-1`}
        />
        <label 
          htmlFor={name}
          className={`pointer-events-none absolute left-2.5 top-2.5 origin-[0] -translate-y-5 scale-[0.85] transform bg-white px-1 text-xs font-semibold uppercase tracking-wide transition-all duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:font-normal peer-focus:-translate-y-5 peer-focus:scale-[0.85] peer-focus:font-semibold ${error ? 'text-red-500 peer-focus:text-red-600' : 'text-blue-600 peer-focus:text-blue-600'}`}
        >
          {label}
        </label>
        <button 
          type="button" 
          onClick={() => setShow(!show)} 
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-blue-600 transition-colors"
        >
          {show ? <EyeOff size={18} className={error ? "text-red-500" : ""} /> : <Eye size={18} className={error ? "text-red-500" : ""} />}
        </button>
      </div>
      {error && <p className="text-red-500 text-[11px] mt-1 font-medium pl-1">{error}</p>}
    </div>
  );
}

function FloatingSelect({ label, name, value, onChange, required, disabled, children, icon: Icon }) {
  const DisplayIcon = Icon || ChevronDown;
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
        className={`pointer-events-none absolute left-2.5 origin-[0] transform bg-white px-1 text-xs uppercase tracking-wide transition-all duration-200
        ${value ? '-translate-y-5 scale-[0.85] top-2.5 text-blue-600 font-semibold' : 'translate-y-0 scale-100 top-3 text-gray-500 font-normal'}
        peer-focus:-translate-y-5 peer-focus:scale-[0.85] peer-focus:top-2.5 peer-focus:text-blue-600 peer-focus:font-semibold ${disabled ? '!text-gray-400' : ''}`}
      >
        {label}
      </label>
      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 ${disabled ? 'text-gray-300' : 'text-slate-700'}`}>
        <DisplayIcon className="h-[18px] w-[18px]" />
      </div>
    </div>
  );
}

function FloatingDate({ label, name, value, onChange, required, icon: Icon }) {
  const DisplayIcon = Icon || Calendar;
  return (
    <div className="relative w-full">
      <input 
        type={value ? "date" : "text"} 
        id={name} name={name} value={value || ""} onChange={onChange} required={required} placeholder=" "
        onFocus={(e) => e.target.type = 'date'}
        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
        onClick={(e) => e.target.showPicker && e.target.showPicker()} 
        onKeyDown={(e) => e.preventDefault()} 
        className="peer w-full rounded-md border border-blue-600 bg-transparent pl-3 pr-10 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
      />
      <label 
        htmlFor={name} 
        className="pointer-events-none absolute left-2.5 top-2.5 origin-[0] -translate-y-5 scale-[0.85] transform bg-white px-1 text-xs font-semibold uppercase tracking-wide text-blue-600 transition-all duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:font-normal peer-focus:-translate-y-5 peer-focus:scale-[0.85] peer-focus:text-blue-600 peer-focus:font-semibold"
      >
        {label}
      </label>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-700">
        <DisplayIcon className="h-[18px] w-[18px]" />
      </div>
    </div>
  );
}

// import React, { useState, useEffect, useRef } from "react";
// import {
//   Loader2, Users, Save, CheckCircle2,
//   MapPin, Map, Briefcase, UserCheck, CalendarPlus, CalendarCheck, Stamp, IdCard,
//   User, Phone, Mail, CalendarHeart, Globe, Fingerprint, CreditCard, MapPinned,
//   Building2, Landmark, Hash, ChevronDown, Calendar, Eye, EyeOff
// } from "lucide-react";
// import api from "../../../services/api";

// export default function UserCreation() {
//   const [isLoading,    setIsLoading]    = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error,        setError]        = useState("");
//   const [successMsg,   setSuccessMsg]   = useState("");

//   const [states,       setStates]       = useState([]);
//   const [districts,    setDistricts]    = useState([]);
//   const [designations, setDesignations] = useState([]);
//   const [managers,     setManagers]     = useState([]);

//   const [formData, setFormData] = useState({
//     name: "", mobile: "", email: "", dob: "", gender: "", religion: "",
//     aadhar: "", pan: "", address: "", stateId: "", districtId: "", bankName: "",
//     bankAccountNumber: "", ifscCode: "", designationId: "", reportingManagerId: "",
//     dateOfJoining: "", dateOfReporting: "", dateOfConfirmation: "", userCode: "",
//     password: "", confirmPassword: ""
//   });

//   const [fieldErrors, setFieldErrors] = useState({});

//   const selectedDesignation = designations.find(d => d.id.toString() === formData.designationId);
  
//   // ✅ NEW LOGIC: Check if the selected designation is "MR"
//   const isMrSelected = selectedDesignation && 
//     (selectedDesignation.name === "MR" || selectedDesignation.designation_name === "MR");

//   useEffect(() => { fetchInitialDropdownData(); }, []);

//   useEffect(() => {
//     if (formData.stateId) fetchDistrictsByState(formData.stateId);
//     else setDistricts([]);
//   }, [formData.stateId]);

//   // ✅ Automatically clear the reporting manager if the user is NOT an MR
//   useEffect(() => {
//     if (!isMrSelected) {
//       setFormData(prev => ({ ...prev, reportingManagerId: "" }));
//     }
//   }, [isMrSelected]);

//   const fetchInitialDropdownData = async () => {
//     try {
//       setIsLoading(true);
//       const [statesRes, desigRes, managersRes] = await Promise.all([
//         api.get("/api/masters/states/all"),
//         api.get("/api/masters/designations"),
//         api.get("/api/masters/employees")
//       ]);
//       if (statesRes.data?.success)   setStates(statesRes.data.data);
//       if (desigRes.data?.success)    setDesignations(desigRes.data.data);
//       if (managersRes.data?.success) setManagers(managersRes.data.data);
//     } catch (err) {
//       console.error("Failed to fetch dropdown data", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchDistrictsByState = async (stateId) => {
//     try {
//       const response = await api.get(`/api/masters/districts/all?stateId=${stateId}`);
//       if (response.data?.success) setDistricts(response.data.data);
//     } catch (err) {
//       console.error("Failed to fetch districts", err);
//       setDistricts([]);
//     }
//   };

//   const validateField = (name, val, currentData) => {
//     let errMsg = "";
//     if (val.length > 0) {
//       if (name === "mobile"            && val.length < 10) errMsg = "Mobile must be exactly 10 digits.";
//       if (name === "aadhar"            && val.length < 12) errMsg = "Aadhaar must be exactly 12 digits.";
//       if (name === "pan"               && val.length < 10) errMsg = "PAN must be exactly 10 characters.";
//       if (name === "bankAccountNumber" && val.length < 8)  errMsg = "Bank Account must be at least 8 digits.";
//       if (name === "ifscCode"          && val.length < 11) errMsg = "IFSC Code must be exactly 11 characters.";
//       if (name === "confirmPassword"   && val !== currentData.password) errMsg = "Passwords do not match.";
//       if (name === "password" && currentData.confirmPassword) {
//         setFieldErrors(prev => ({
//           ...prev,
//           confirmPassword: val !== currentData.confirmPassword ? "Passwords do not match." : ""
//         }));
//       }
//     }
//     setFieldErrors(prev => ({ ...prev, [name]: errMsg }));
//   };

//   const handleInputChange = (e) => {
//     let { name, value } = e.target;
//     if (name === "mobile")            value = value.replace(/\D/g, "").slice(0, 10);
//     if (name === "aadhar")            value = value.replace(/\D/g, "").slice(0, 12);
//     if (name === "bankAccountNumber") value = value.replace(/\D/g, "").slice(0, 18);
//     if (name === "pan")               value = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
//     if (name === "ifscCode")          value = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);

//     setFormData(prev => {
//       const updatedData = { ...prev, [name]: value };
//       validateField(name, value, updatedData);
//       return updatedData;
//     });
//   };

//   const handleStateChange = (e) => {
//     setFormData(prev => ({ ...prev, stateId: e.target.value, districtId: "" }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(""); setSuccessMsg("");

//     if (formData.mobile.length < 10)                                       return setError("Mobile number must be exactly 10 digits.");
//     if (formData.aadhar            && formData.aadhar.length < 12)         return setError("Aadhaar must be exactly 12 digits.");
//     if (formData.pan               && formData.pan.length < 10)            return setError("PAN must be exactly 10 alphanumeric characters.");
//     if (formData.bankAccountNumber && formData.bankAccountNumber.length < 8) return setError("Bank Account must be at least 8 digits.");
//     if (formData.ifscCode          && formData.ifscCode.length < 11)       return setError("IFSC Code must be exactly 11 characters.");
//     if (formData.password !== formData.confirmPassword)                    return setError("Passwords do not match!");

//     setIsSubmitting(true);

//     const payload = {
//       name: formData.name, mobile: formData.mobile, email: formData.email,
//       dob: formData.dob || null, gender: formData.gender, religion: formData.religion || null,
//       aadhar: formData.aadhar || null, pan: formData.pan || null, address: formData.address || null,
//       stateId:            formData.stateId            ? parseInt(formData.stateId)            : null,
//       districtId:         formData.districtId         ? parseInt(formData.districtId)         : null,
//       bankName:           formData.bankName           || null,
//       bankAccountNumber:  formData.bankAccountNumber  || null,
//       ifscCode:           formData.ifscCode           || null,
//       designationId:      formData.designationId      ? parseInt(formData.designationId)      : null,
//       reportingManagerId: formData.reportingManagerId ? parseInt(formData.reportingManagerId) : null,
//       dateOfJoining:      formData.dateOfJoining      || null,
//       dateOfReporting:    formData.dateOfReporting    || null,
//       dateOfConfirmation: formData.dateOfConfirmation || null,
//       userCode:           formData.userCode           || null,
//       password:           formData.password
//     };

//     try {
//       const response = await api.post("/api/masters/employees", payload);
//       if (response.status === 200 || response.status === 201 || response.data?.success) {
//         setSuccessMsg("Employee created successfully!");
//         setFormData({
//           name: "", mobile: "", email: "", dob: "", gender: "Male", religion: "",
//           aadhar: "", pan: "", address: "", stateId: "", districtId: "", bankName: "",
//           bankAccountNumber: "", ifscCode: "", designationId: "", reportingManagerId: "",
//           dateOfJoining: "", dateOfReporting: "", dateOfConfirmation: "", userCode: "",
//           password: "", confirmPassword: ""
//         });
//         setFieldErrors({});
//         window.scrollTo({ top: 0, behavior: "smooth" });
//         setTimeout(() => setSuccessMsg(""), 4000);
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to create user.");
//       window.scrollTo({ top: 0, behavior: "smooth" });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="space-y-6 animate-in fade-in duration-500 pb-12">
//       <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">

//         {/* ── Header ─────────────────────────────────────────────────────── */}
//         <div className="flex items-center gap-3 mb-8 border-b pb-5">
//           <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
//             <Users className="text-blue-500" size={19} />
//           </div>
//           <div>
//             <h2 className="text-lg font-bold text-gray-800">Employee Creation</h2>
//             <p className="text-xs text-gray-400 mt-0.5">Fill in the details below to register a new employee.</p>
//           </div>
//         </div>

//         {/* Alerts */}
//         {error && (
//           <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 border border-red-100 text-sm flex items-center gap-2">
//             {error}
//           </div>
//         )}
//         {successMsg && (
//           <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-lg mb-6 border border-blue-100 text-sm flex items-center gap-2">
//             <CheckCircle2 size={16} /> {successMsg}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-8">

//           {/* ── Section 1: Assignment ─────────────────────────────────────── */}
//           <SectionHeader label="Assignment" />
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

//             <FloatingSelect
//               label="Select State *" name="stateId" value={formData.stateId}
//               onChange={handleStateChange} required icon={MapPin}
//             >
//               <option value=""></option>
//               {states.map(s => <option key={s.id} value={s.id}>{s.state_name}</option>)}
//             </FloatingSelect>

//             <FloatingSelect
//               label="Select District *" name="districtId" value={formData.districtId}
//               onChange={handleInputChange} required
//               disabled={!formData.stateId}
//               icon={Map}
//             >
//               <option value=""></option>
//               {districts.map(d => <option key={d.id} value={d.id}>{d.district_name}</option>)}
//             </FloatingSelect>

//             <FloatingSelect
//               label="Select Designation *" name="designationId" value={formData.designationId}
//               onChange={handleInputChange} required icon={Briefcase}
//             >
//               <option value=""></option>
//               {designations.map(d => <option key={d.id} value={d.id}>{d.name || d.designation_name}</option>)}
//             </FloatingSelect>

//             {/* ✅ Disabled if not MR. Shows Designation alongside Manager's Name */}
//             <FloatingSelect
//               label="Select Reporting Manager" name="reportingManagerId" value={formData.reportingManagerId}
//               onChange={handleInputChange} icon={UserCheck}
//               disabled={!formData.designationId || !isMrSelected}
//             >
//               <option value="">{!isMrSelected ? "Not Applicable" : "None (Top Level)"}</option>
//               {managers.map(m => {
//                 const designationStr = m.designation_name || m.designation || "";
//                 const displayName = designationStr ? `${m.name} - ${designationStr}` : m.name;
//                 return (
//                   <option key={m.id} value={m.id}>{displayName}</option>
//                 );
//               })}
//             </FloatingSelect>

//             <FloatingDate label="Date of Joining *"     name="dateOfJoining"      value={formData.dateOfJoining}      onChange={handleInputChange} required icon={CalendarPlus} />
//             <FloatingDate label="Date of Reporting *"   name="dateOfReporting"    value={formData.dateOfReporting}    onChange={handleInputChange} required icon={CalendarCheck} />
//             <FloatingDate label="Date of Confirmation"  name="dateOfConfirmation" value={formData.dateOfConfirmation} onChange={handleInputChange} icon={Stamp} />
//             <FloatingInput label="User Code" name="userCode" value={formData.userCode} onChange={handleInputChange} icon={IdCard} />
//           </div>

//           <hr className="border-gray-100" />

//           {/* ── Section 2: Personal Information ──────────────────────────── */}
//           <SectionHeader label="Personal Information" />
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             <FloatingInput label="Name *"               name="name"              value={formData.name}              onChange={handleInputChange} required icon={User} />
//             <FloatingInput label="Mobile (10 digits) *" name="mobile"            value={formData.mobile}            onChange={handleInputChange} required icon={Phone}       error={fieldErrors.mobile} />
//             <FloatingInput label="Email"                name="email"             value={formData.email}             onChange={handleInputChange} type="email" icon={Mail} />
//             <FloatingDate  label="Date of Birth"        name="dob"               value={formData.dob}               onChange={handleInputChange} icon={CalendarHeart} />

//             <FloatingSelect label="Select Religion" name="religion" value={formData.religion} onChange={handleInputChange} icon={Globe}>
//               <option value=""></option>
//               <option value="Hindu">Hindu</option>
//               <option value="Muslim">Muslim</option>
//               <option value="Christian">Christian</option>
//               <option value="Sikh">Sikh</option>
//               <option value="Other">Other</option>
//             </FloatingSelect>

//             <FloatingInput label="Aadhaar (12 digits)"  name="aadhar"            value={formData.aadhar}            onChange={handleInputChange} icon={Fingerprint}  error={fieldErrors.aadhar} />
//             <FloatingInput label="PAN (10 chars)"       name="pan"               value={formData.pan}               onChange={handleInputChange} icon={CreditCard}   error={fieldErrors.pan} />
//             <FloatingInput label="Address"              name="address"           value={formData.address}           onChange={handleInputChange} icon={MapPinned} />
//             <FloatingInput label="Bank Name"            name="bankName"          value={formData.bankName}          onChange={handleInputChange} icon={Building2} />
//             <FloatingInput label="Bank Account Number"  name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleInputChange} icon={Landmark}     error={fieldErrors.bankAccountNumber} />
//             <FloatingInput label="IFSC Code (11 chars)" name="ifscCode"          value={formData.ifscCode}          onChange={handleInputChange} icon={Hash}         error={fieldErrors.ifscCode} />
//           </div>

//           {/* Gender */}
//           <div>
//             <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Gender</p>
//             <div className="flex items-center gap-6">
//               {["Male", "Female"].map(g => (
//                 <label key={g} className="flex items-center gap-2 cursor-pointer group">
//                   <div className="relative flex items-center justify-center w-[18px] h-[18px]">
//                     <input
//                       type="radio" name="gender" value={g}
//                       checked={formData.gender === g}
//                       onChange={handleInputChange}
//                       className="sr-only"
//                     />
//                     <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
//                       formData.gender === g
//                         ? "border-blue-500 bg-white"
//                         : "border-gray-300 bg-white group-hover:border-blue-300"
//                     }`}>
//                       {formData.gender === g && <div className="w-2 h-2 rounded-full bg-blue-500" />}
//                     </div>
//                   </div>
//                   <span className={`text-sm font-medium transition-colors ${
//                     formData.gender === g ? "text-gray-900" : "text-gray-500"
//                   }`}>{g}</span>
//                 </label>
//               ))}
//             </div>
//           </div>

//           <hr className="border-gray-100" />

//           {/* ── Section 3: Login Information ─────────────────────────────── */}
//           <SectionHeader label="Login Information" />
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <FloatingInput label="Email (Username)" name="loginEmail" type="email" value={formData.email} disabled icon={Mail} />
//             <FloatingPassword label="Password *"         name="password"        value={formData.password}        onChange={handleInputChange} required error={fieldErrors.password} />
//             <FloatingPassword label="Confirm Password *" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required error={fieldErrors.confirmPassword} />
//           </div>

//           {/* Submit */}
//           <div className="pt-4 border-t border-gray-100">
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-3
//                 rounded-lg text-sm font-bold transition-all active:scale-95
//                 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20
//                 disabled:opacity-60 disabled:cursor-not-allowed"
//             >
//               {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
//               Save Employee
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // ─── Section Header ───────────────────────────────────────────────────────────
// function SectionHeader({ label }) {
//   return (
//     <div className="flex items-center gap-3 -mb-2">
//       <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{label}</h3>
//       <div className="flex-1 h-px bg-gray-100" />
//     </div>
//   );
// }

// // ─── FloatingInput ────────────────────────────────────────────────────────────
// function FloatingInput({ label, name, type = "text", value, onChange, required, disabled, icon: Icon, error }) {
//   const [isFocused, setIsFocused] = useState(false);
//   const hasValue = Boolean(value);

//   const borderClass = error
//     ? isFocused ? "border-red-500 ring-2 ring-red-100" : "border-red-400"
//     : disabled
//       ? "border-gray-200 bg-gray-50 cursor-not-allowed"
//       : hasValue
//         ? isFocused ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400"
//         : isFocused ? "border-gray-400 ring-2 ring-gray-100" : "border-gray-300";

//   const labelClass = error
//     ? "-top-2.5 text-[11px] text-red-500"
//     : disabled
//       ? hasValue ? "-top-2.5 text-[11px] text-gray-400" : "top-3 text-sm text-gray-400"
//       : hasValue
//         ? "-top-2.5 text-[11px] text-blue-500"
//         : isFocused ? "-top-2.5 text-[11px] text-gray-500" : "top-3 text-sm text-gray-400";

//   return (
//     <div className="w-full flex flex-col">
//       <div className="relative w-full">
//         <input
//           type={type} id={name} name={name} value={value || ""}
//           onChange={onChange} required={required} placeholder=" " disabled={disabled}
//           onFocus={() => setIsFocused(true)}
//           onBlur={() => setIsFocused(false)}
//           className={`w-full rounded-lg border-2 bg-white pl-3 pr-10 py-3 text-sm
//             text-gray-900 transition-all focus:outline-none ${borderClass}
//             ${disabled ? "text-gray-400" : ""}`}
//         />
//         <label htmlFor={name}
//           className={`absolute left-3 px-1 bg-white pointer-events-none z-10
//             transition-all duration-200 font-semibold ${labelClass}`}>
//           {label}
//         </label>
//         {Icon && (
//           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
//             <Icon className={`h-[17px] w-[17px] ${
//               error ? "text-red-400" : disabled ? "text-gray-300" : hasValue ? "text-blue-400" : "text-gray-400"
//             }`} />
//           </div>
//         )}
//       </div>
//       {error && <p className="text-red-500 text-[11px] mt-1 font-medium pl-1">{error}</p>}
//     </div>
//   );
// }

// // ─── FloatingPassword ─────────────────────────────────────────────────────────
// function FloatingPassword({ label, name, value, onChange, required, error }) {
//   const [show,       setShow]       = useState(false);
//   const [isFocused, setIsFocused] = useState(false);
//   const hasValue = Boolean(value);

//   const borderClass = error
//     ? isFocused ? "border-red-500 ring-2 ring-red-100" : "border-red-400"
//     : hasValue
//       ? isFocused ? "border-blue-500 ring-2 ring-blue-100" : "border-blue-400"
//       : isFocused ? "border-gray-400 ring-2 ring-gray-100" : "border-gray-300";

//   const labelClass = error
//     ? "-top-2.5 text-[11px] text-red-500"
//     : hasValue
//       ? "-top-2.5 text-[11px] text-blue-500"
//       : isFocused ? "-top-2.5 text-[11px] text-gray-500" : "top-3 text-sm text-gray-400";

//   return (
//     <div className="w-full flex flex-col">
//       <div className="relative w-full">
//         <input
//           type={show ? "text" : "password"} id={name} name={name}
//           value={value || ""} onChange={onChange} required={required} placeholder=" "
//           onFocus={() => setIsFocused(true)}
//           onBlur={() => setIsFocused(false)}
//           className={`w-full rounded-lg border-2 bg-white pl-3 pr-10 py-3 text-sm
//             text-gray-900 transition-all focus:outline-none ${borderClass}`}
//         />
//         <label htmlFor={name}
//           className={`absolute left-3 px-1 bg-white pointer-events-none z-10
//             transition-all duration-200 font-semibold ${labelClass}`}>
//           {label}
//         </label>
//         <button
//           type="button" onClick={() => setShow(!show)}
//           className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-500 transition-colors"
//         >
//           {show
//             ? <EyeOff size={17} className={error ? "text-red-400" : ""} />
//             : <Eye    size={17} className={error ? "text-red-400" : ""} />}
//         </button>
//       </div>
//       {error && <p className="text-red-500 text-[11px] mt-1 font-medium pl-1">{error}</p>}
//     </div>
//   );
// }

// // ─── FloatingSelect ───────────────────────────────────────────────────────────
// function FloatingSelect({ label, name, value, onChange, required, disabled, children, icon: Icon }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   const options = React.Children.map(children, child => {
//     if (!React.isValidElement(child)) return null;
//     return { value: child.props.value, label: child.props.children };
//   }).filter(Boolean);

//   const selectedOption = options.find(opt => opt.value == value);
//   const hasValue = Boolean(value);

//   useEffect(() => {
//     const handler = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   const handleSelect = (optVal) => {
//     if (disabled) return;
//     onChange({ target: { name, value: optVal } });
//     setIsOpen(false);
//   };

//   const triggerBorder = disabled
//     ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
//     : hasValue
//       ? isOpen ? "border-blue-500 ring-2 ring-blue-100 bg-white" : "border-blue-400 bg-white text-gray-900"
//       : isOpen ? "border-gray-400 ring-2 ring-gray-100 bg-white" : "border-gray-300 bg-white text-gray-900";

//   const iconColor = disabled ? "text-gray-300"
//     : hasValue ? (isOpen ? "text-blue-500" : "text-blue-400")
//     : (isOpen ? "text-gray-500" : "text-gray-400");

//   return (
//     <div ref={dropdownRef} className="relative w-full select-none">
//       <select name={name} value={value || ""} required={required}
//         className="absolute opacity-0 w-0 h-0 pointer-events-none" readOnly tabIndex={-1}>
//         <option value={value}>{value}</option>
//       </select>

//       <div
//         onClick={() => !disabled && setIsOpen(!isOpen)}
//         className={`w-full rounded-lg border-2 px-4 py-3 text-sm flex items-center justify-between
//           cursor-pointer transition-all relative z-10 ${triggerBorder}`}
//       >
//         <span className={`block truncate font-medium ${selectedOption?.value ? "text-gray-900" : "text-transparent"}`}>
//           {selectedOption?.label || " "}
//         </span>
//         <div className={`flex items-center gap-1 flex-shrink-0 transition-colors duration-200 ${iconColor}`}>
//           {Icon && <Icon size={16} strokeWidth={2} className="opacity-70" />}
//           <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
//         </div>
//       </div>

//       <label className={`absolute left-3 px-1 transition-all duration-200 pointer-events-none z-20 font-semibold bg-white
//         ${hasValue
//           ? "-top-2.5 text-[11px] text-blue-500"
//           : isOpen
//             ? "-top-2.5 text-[11px] text-gray-500"
//             : "top-3 text-sm text-gray-400"
//         } ${disabled ? "!text-gray-300" : ""}`}>
//         {label}
//       </label>

//       {isOpen && (
//         <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200
//           rounded-lg shadow-xl z-[110] max-h-60 overflow-y-auto
//           animate-in fade-in zoom-in-95 duration-100">
//           <ul className="py-1.5">
//             {options.map((opt, idx) => (
//               <li key={idx} onClick={() => handleSelect(opt.value)}
//                 className={`px-4 py-3 text-sm cursor-pointer font-medium transition-colors
//                   ${value == opt.value
//                     ? "bg-blue-50 text-blue-600 font-semibold border-l-[3px] border-blue-500"
//                     : "text-gray-700 hover:bg-blue-500 hover:text-white border-l-[3px] border-transparent"
//                   }`}>
//                 {opt.label}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── FloatingDate ─────────────────────────────────────────────────────────────
// function FloatingDate({ label, name, value, onChange, required, icon: Icon }) {
//   const DisplayIcon = Icon || Calendar;
//   const hasValue = Boolean(value);

//   return (
//     <div className="relative w-full">
//       <input
//         type={value ? "date" : "text"}
//         id={name} name={name} value={value || ""} onChange={onChange}
//         required={required} placeholder=" "
//         onFocus={(e) => (e.target.type = "date")}
//         onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
//         onClick={(e) => e.target.showPicker && e.target.showPicker()}
//         onKeyDown={(e) => e.preventDefault()}
//         className={`peer w-full rounded-lg border-2 bg-white pl-3 pr-10 py-3 text-sm
//           text-gray-900 transition-all focus:outline-none cursor-pointer
//           [&::-webkit-calendar-picker-indicator]:hidden
//           ${hasValue
//             ? "border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//             : "border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
//           }`}
//       />
//       <label htmlFor={name}
//         className={`absolute left-3 px-1 bg-white pointer-events-none z-10
//           transition-all duration-200 font-semibold
//           ${hasValue
//             ? "-top-2.5 text-[11px] text-blue-500"
//             : "top-3 text-sm text-gray-400 peer-focus:-top-2.5 peer-focus:text-[11px] peer-focus:text-gray-500 peer-focus:font-semibold"
//           }`}>
//         {label}
//       </label>
//       <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
//         <DisplayIcon className={`h-[17px] w-[17px] ${hasValue ? "text-blue-400" : "text-gray-400"}`} />
//       </div>
//     </div>
//   );
// }

