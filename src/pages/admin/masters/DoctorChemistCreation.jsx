import React, { useState, useEffect } from "react";
import { 
  Loader2, MapPin, Map, User, MapPinned, Save, CheckCircle2, 
  Phone, Fingerprint, Hash, GraduationCap, Star, Tag, RotateCw, BookUser, Baby, CalendarDays, Clock,
  Store, Building2, UserCircle, CreditCard, Landmark, Trash2, PlusCircle, XCircle,
  Stethoscope, Beaker, Mail   
} from "lucide-react";
import api from "../../../services/api";

export default function DoctorChemistCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [providerType, setProviderType] = useState("Doctor");

  const [showFamilyInfo, setShowFamilyInfo] = useState(false);
  const [showOtherInfo, setShowOtherInfo] = useState(false);

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);

  const emptyFormData = {
    stateId: "", districtId: "", employeeId: "", areaId: "",
    phone: "", aadhaar: "", address: "", email: "", gender: "", city: "",
    doctorCode: "", doctorName: "", mslNo: "", frequencyVisit: "",
    doctorCategory: "", doctorDegree: "", doctorSpecialization: "",
    licenceNo: "",
    childrenInfo: [], // Will map to "children" for backend
    meetingTimeInfo: [], // Will map to "locations" for backend
    chemistCode: "", chemistName: "", chemistType: "",
    ownerName: "", ownerDob: "", ownerDoa: "", shopDoa: "", 
    panCard: "", gstNumber: "", licenceNoChemist: "", chemistCategory: ""
  };

  const [formData, setFormData] = useState(emptyFormData);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.stateId) fetchDistrictsByState(formData.stateId);
    else { setDistricts([]); setEmployees([]); setAreas([]); }
  }, [formData.stateId]);

  useEffect(() => {
    if (formData.stateId && formData.districtId) fetchFilteredEmployees(formData.stateId, formData.districtId);
    else { setEmployees([]); setAreas([]); }
  }, [formData.stateId, formData.districtId]);

  useEffect(() => {
    if (formData.employeeId) fetchAreasByEmployee(formData.employeeId);
    else setAreas([]);
  }, [formData.employeeId]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/masters/states');
      if (response.data?.success) setStates(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistrictsByState = async (stateId) => {
    try {
      const response = await api.get(`/api/masters/districts?stateId=${stateId}`);
      if (response.data?.success) setDistricts(response.data.data || []);
    } catch (err) { setDistricts([]); }
  };

  const fetchFilteredEmployees = async (stateId, districtId) => {
    try {
      const response = await api.get(`/api/masters/employees/filter?stateId=${stateId}&districtId=${districtId}`);
      if (response.data?.success) setEmployees(response.data.data || []);
    } catch (err) { setEmployees([]); }
  };

  const fetchAreasByEmployee = async (employeeId) => {
    try {
      const response = await api.get(`/api/masters/areas/filter?employeeId=${employeeId}`);
      if (response.data?.success) setAreas(response.data.data || []);
    } catch (err) { setAreas([]); }
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setProviderType(type);
    setFormData(prev => ({
      ...emptyFormData,
      providerType: type,
      stateId: prev.stateId, districtId: prev.districtId,
      employeeId: prev.employeeId, areaId: prev.areaId
    }));
    setFieldErrors({});
    setError("");
    setShowFamilyInfo(false);
    setShowOtherInfo(false);
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    
    if (name === "phone") value = value.replace(/\D/g, '').slice(0, 10);
    if (name === "aadhaar") value = value.replace(/\D/g, '').slice(0, 12);
    if (name === "panCard") value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    if (name === "gstNumber") value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    
    setFormData(prev => ({ ...prev, [name]: value }));

    let errMsg = "";
    if (value.length > 0) {
      if (name === "phone" && value.length < 10) errMsg = "Must be 10 digits.";
      if (name === "aadhaar" && value.length < 12) errMsg = "Must be 12 digits.";
      if (name === "email" && !/\S+@\S+\.\S+/.test(value)) errMsg = "Invalid format.";
      if (name === "panCard" && value.length < 10) errMsg = "Must be 10 chars.";
    }
    setFieldErrors(prev => ({ ...prev, [name]: errMsg }));
  };

  const handleGeographicChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let newData = { ...prev, [name]: value };
      if (name === "stateId") newData = { ...newData, districtId: "", employeeId: "", areaId: "" };
      if (name === "districtId") newData = { ...newData, employeeId: "", areaId: "" };
      if (name === "employeeId") newData = { ...newData, areaId: "" };
      return newData;
    });
  };

  // ─── Dynamic Row Handlers (UPDATED TO MATCH BACKEND JSON KEYS) ────────────

  const addDynamicRow = (type) => {
    setFormData(prev => {
      // ✅ Now using childName and childAge
      if (type === 'child') return { ...prev, childrenInfo: [...(prev.childrenInfo || []), { childName: "", childAge: "" }] };
      // ✅ Now using sessionType, fromTime, toTime
      if (type === 'time') return { ...prev, meetingTimeInfo: [...(prev.meetingTimeInfo || []), { city: "", sessionType: "Monday", slots: [{ fromTime: "", toTime: "" }] }] };
      return prev;
    });
  };

  const removeDynamicRow = (type, index) => {
    setFormData(prev => {
      if (type === 'child') return { ...prev, childrenInfo: (prev.childrenInfo || []).filter((_, i) => i !== index) };
      if (type === 'time') return { ...prev, meetingTimeInfo: (prev.meetingTimeInfo || []).filter((_, i) => i !== index) };
      return prev;
    });
  };

  const handleDynamicInputChange = (type, index, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const listName = type === 'child' ? 'childrenInfo' : 'meetingTimeInfo';
      const updatedList = [...(prev[listName] || [])];
      updatedList[index] = { ...updatedList[index], [name]: value };
      return { ...prev, [listName]: updatedList };
    });
  };

  const addDynamicSlot = (timeIndex) => {
    setFormData(prev => {
      const updatedTimeInfo = [...(prev.meetingTimeInfo || [])];
      updatedTimeInfo[timeIndex] = {
        ...updatedTimeInfo[timeIndex],
        slots: [...(updatedTimeInfo[timeIndex].slots || []), { fromTime: "", toTime: "" }]
      };
      return { ...prev, meetingTimeInfo: updatedTimeInfo };
    });
  };

  const removeDynamicSlot = (timeIndex, slotIndex) => {
    setFormData(prev => {
      const updatedTimeInfo = [...(prev.meetingTimeInfo || [])];
      updatedTimeInfo[timeIndex] = {
        ...updatedTimeInfo[timeIndex],
        slots: (updatedTimeInfo[timeIndex].slots || []).filter((_, i) => i !== slotIndex)
      };
      return { ...prev, meetingTimeInfo: updatedTimeInfo };
    });
  };

  const handleDynamicSlotInputChange = (timeIndex, slotIndex, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedTimeInfo = [...(prev.meetingTimeInfo || [])];
      const updatedSlots = [...(updatedTimeInfo[timeIndex].slots || [])];
      updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], [name]: value };
      updatedTimeInfo[timeIndex] = { ...updatedTimeInfo[timeIndex], slots: updatedSlots };
      return { ...prev, meetingTimeInfo: updatedTimeInfo };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const hasErrors = Object.values(fieldErrors).some(err => err !== "");
    if (hasErrors) {
      setError("Please fix highlighted errors before saving.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (formData.phone && formData.phone.length < 10) return setError("Phone must be 10 digits.");
    if (formData.aadhaar && formData.aadhaar.length < 12) return setError("Aadhaar must be 12 digits.");

    setIsSubmitting(true);

    try {
      let response;

      if (providerType === "Doctor") {
        // 🚀 FULLY MAPPED TO EXACT BACKEND JSON STRUCTURE
        const doctorPayload = {
          doctorName: formData.doctorName,
          doctorCode: formData.doctorCode,
          mslNo: formData.mslNo,
          category: formData.doctorCategory || null,
          degree: formData.doctorDegree || null,
          specialization: formData.doctorSpecialization || null,
          phone: formData.phone || null,
          gender: formData.gender || null,
          address: formData.address || null,
          licenceNo: showOtherInfo ? (formData.licenceNo || null) : null,
          email: showOtherInfo ? (formData.email || null) : null,
          frequencyVisit: formData.frequencyVisit ? parseInt(formData.frequencyVisit) : null,
          aadhaarNo: formData.aadhaar || null,
          stateId: parseInt(formData.stateId),
          districtId: parseInt(formData.districtId),
          employeeId: parseInt(formData.employeeId),
          areaId: parseInt(formData.areaId),
          
          // MAP CHILDREN EXACTLY
          children: showFamilyInfo && formData.childrenInfo ? formData.childrenInfo.map(child => ({
            childName: child.childName,
            childAge: child.childAge ? parseInt(child.childAge) : null
          })) : [],
          
          // MAP LOCATIONS EXACTLY
          locations: showOtherInfo && formData.meetingTimeInfo ? formData.meetingTimeInfo.map(loc => ({
            city: loc.city,
            sessionType: loc.sessionType,
            slots: loc.slots.map(slot => ({
              fromTime: slot.fromTime,
              toTime: slot.toTime
            }))
          })) : []
        };
        
        response = await api.post('/api/masters/doctors', doctorPayload);

      } else {
        const providerPayload = {
          stateId: parseInt(formData.stateId),
          districtId: parseInt(formData.districtId),
          employeeId: parseInt(formData.employeeId),
          areaId: parseInt(formData.areaId),
          type: formData.chemistType || null, 
          providerCode: formData.chemistCode,
          providerName: formData.chemistName,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          category: formData.chemistCategory || null,
          
          gender: showOtherInfo ? (formData.gender || null) : null,
          aadhaarNo: showOtherInfo ? (formData.aadhaar || null) : null,
          ownerName: showOtherInfo ? (formData.ownerName || null) : null,
          ownerDob: showOtherInfo ? (formData.ownerDob || null) : null,
          ownerDoa: showOtherInfo ? (formData.ownerDoa || null) : null, // ✅ Kept for Chemist
          shopDoa: showOtherInfo ? (formData.shopDoa || null) : null,
          email: showOtherInfo ? (formData.email || null) : null,
          panCard: showOtherInfo ? (formData.panCard || null) : null,
          gstNumber: showOtherInfo ? (formData.gstNumber || null) : null,
          licenceNo: showOtherInfo ? (formData.licenceNoChemist || null) : null
        };
        response = await api.post('/api/masters/providers', providerPayload);
      }
      
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        setSuccessMsg(`${providerType} created successfully!`);
        setFormData(emptyFormData);
        setShowFamilyInfo(false);
        setShowOtherInfo(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to save ${providerType}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 border-b pb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookUser className="text-blue-600" size={24} />
            Add New Provider (Doctor/Chemist)
          </h2>
          
          <div className="flex items-center gap-6 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200 shadow-inner">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input type="radio" name="providerType" value="Doctor" checked={providerType === "Doctor"} onChange={handleTypeChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
              Doctor
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
              <input type="radio" name="providerType" value="Chemist" checked={providerType === "Chemist"} onChange={handleTypeChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
              Chemist / Stockist
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-6 border border-red-100">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-md mb-6 border border-blue-100 flex items-center gap-2">
            <CheckCircle2 size={18}/> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* ── Geography ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FloatingSelect label="Select State *" name="stateId" value={formData.stateId} onChange={handleGeographicChange} required icon={MapPin}>
              <option value=""></option>
              {states?.map(s => <option key={s.id} value={s.id}>{s.state_name}</option>)}
            </FloatingSelect>

            <FloatingSelect label="Select District *" name="districtId" value={formData.districtId} onChange={handleGeographicChange} required disabled={!formData.stateId} icon={Map}>
              <option value=""></option>
              {districts?.map(d => <option key={d.id} value={d.id}>{d.district_name}</option>)}
            </FloatingSelect>

            <FloatingSelect label="Select Employee *" name="employeeId" value={formData.employeeId} onChange={handleGeographicChange} required disabled={!formData.districtId} icon={User}>
              <option value=""></option>
              {employees?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </FloatingSelect>

            <FloatingSelect label="Select Area *" name="areaId" value={formData.areaId} onChange={handleInputChange} required disabled={!formData.employeeId} icon={MapPinned}>
              <option value=""></option>
              {areas?.map(a => <option key={a.id} value={a.id}>{a.area_name || a.areaName}</option>)}
            </FloatingSelect>
          </div>

          <hr className="border-gray-50" />

          {/* ── DOCTOR SECTION ────────────────────────────────────── */}
          {providerType === "Doctor" ? (
            <>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Stethoscope size={20} className="text-blue-600"/> Main Doctor Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FloatingInput label="Doctor Code" name="doctorCode" value={formData.doctorCode} onChange={handleInputChange} icon={Hash} />
                <FloatingInput label="Doctor Name *" name="doctorName" value={formData.doctorName} onChange={handleInputChange} required icon={User} />
                <FloatingInput label="Doctor MSL No. *" name="mslNo" value={formData.mslNo} onChange={handleInputChange} required icon={Hash} />
                <FloatingInput label="Frequency Visit" name="frequencyVisit" type="number" value={formData.frequencyVisit} onChange={handleInputChange} icon={RotateCw} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FloatingSelect label="Category" name="doctorCategory" value={formData.doctorCategory} onChange={handleInputChange} icon={Tag}>
                  <option value=""></option>
                  {["A", "A+", "B", "B+", "C", "Core", "SuperCore"].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </FloatingSelect>
                
                <FloatingSelect label="Degree *" name="doctorDegree" value={formData.doctorDegree} onChange={handleInputChange} required icon={GraduationCap}>
                  <option value=""></option>
                  {["DM", "MBBS", "MCh", "MD", "MS"].map(deg => (
                    <option key={deg} value={deg}>{deg}</option>
                  ))}
                </FloatingSelect>
                
                <FloatingSelect label="Specialization *" name="doctorSpecialization" value={formData.doctorSpecialization} onChange={handleInputChange} required icon={Star}>
                  <option value=""></option>
                  {[
                    "Cardiologist", "Critical Care", "Dental",
                    "Dermatologist(Plastic Surgery)", "Diabetologist",
                    "Endocrinologist", "Gastroenterologist"
                  ].map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </FloatingSelect>

                <FloatingSelect label="Gender *" name="gender" value={formData.gender} onChange={handleInputChange} required icon={UserCircle}>
                  <option value=""></option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </FloatingSelect>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FloatingInput label="Phone" name="phone" type="text" value={formData.phone} onChange={handleInputChange} icon={Phone} error={fieldErrors.phone}/>
                <FloatingInput label="Aadhaar" name="aadhaar" type="text" value={formData.aadhaar} onChange={handleInputChange} icon={Fingerprint} error={fieldErrors.aadhaar}/>
                <FloatingInput label="Address" name="address" value={formData.address} onChange={handleInputChange} icon={MapPin}/>
              </div>

              {/* ADDITIONAL INFO CHECKBOXES (Doctor) */}
              <div className="mt-8 pt-4 border-t border-gray-100">
                <h4 className="text-md font-bold text-gray-700 mb-4">Additional Info</h4>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 font-medium w-max">
                    <input type="checkbox" checked={showFamilyInfo} onChange={(e) => setShowFamilyInfo(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    Family Info
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 font-medium w-max">
                    <input type="checkbox" checked={showOtherInfo} onChange={(e) => setShowOtherInfo(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    Other Info
                  </label>
                </div>
              </div>
              
              {/* CONDITIONALLY RENDERED SECTIONS (Doctor) */}
              {showFamilyInfo && (
                <div className="mt-6 border-l-4 border-blue-500 pl-4">
                  <DynamicListTable
                    title="Family Info"
                    icon={Baby}
                    onAdd={() => addDynamicRow('child')}
                    list={formData.childrenInfo || []}
                    onRemove={(idx) => removeDynamicRow('child', idx)}
                    renderInputs={(item, index) => (
                      <>
                        {/* ✅ Input names map to new childName and childAge keys */}
                        <FloatingInput label="Child Name" name="childName" value={item.childName} onChange={(e) => handleDynamicInputChange('child', index, e)} />
                        <FloatingInput label="Child Age" name="childAge" type="number" value={item.childAge} onChange={(e) => handleDynamicInputChange('child', index, e)} />
                      </>
                    )}
                  />
                </div>
              )}

              {showOtherInfo && (
                <div className="mt-6 border-l-4 border-blue-500 pl-4 space-y-8">
                  <div>
                    <h4 className="font-bold text-gray-700 mb-4">Other Info Doctor</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FloatingInput label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} icon={Mail} error={fieldErrors.email}/>
                      <FloatingInput label="Licence No" name="licenceNo" value={formData.licenceNo} onChange={handleInputChange} icon={Landmark}/>
                    </div>
                  </div>

                  <DynamicListTableTimeTemplate
                    title="Meeting Time Template"
                    icon={CalendarDays}
                    onAdd={() => addDynamicRow('time')}
                    list={formData.meetingTimeInfo || []}
                    onRemove={(idx) => removeDynamicRow('time', idx)}
                    renderMainInputs={(item, index) => (
                      <>
                        {/* ✅ Input names map to new city and sessionType keys */}
                        <FloatingInput label="City" name="city" value={item.city} onChange={(e) => handleDynamicInputChange('time', index, e)} icon={Building2} />
                        <FloatingSelect label="Session Type (Day)" name="sessionType" value={item.sessionType} onChange={(e) => handleDynamicInputChange('time', index, e)} icon={CalendarDays}>
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </FloatingSelect>
                      </>
                    )}
                    renderSlotInputs={(timeIndex, slotItem, slotIndex) => (
                      <>
                        {/* ✅ Input names map to new fromTime and toTime keys */}
                        <FloatingInput label="From Time" name="fromTime" type="time" value={slotItem.fromTime} onChange={(e) => handleDynamicSlotInputChange(timeIndex, slotIndex, e)} icon={Clock} />
                        <FloatingInput label="To Time" name="toTime" type="time" value={slotItem.toTime} onChange={(e) => handleDynamicSlotInputChange(timeIndex, slotIndex, e)} icon={Clock} />
                      </>
                    )}
                    onAddSlot={addDynamicSlot}
                    onRemoveSlot={removeDynamicSlot}
                  />
                </div>
              )}
            </>

          ) : (
          /* ── CHEMIST SECTION ──────────────────────────────────── */
            <>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Beaker size={20} className="text-blue-600"/> Main Chemist Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FloatingInput label="Chemist / Stockist Code" name="chemistCode" value={formData.chemistCode} onChange={handleInputChange} icon={Hash} />
                <FloatingInput label="Chemist / Stockist Name *" name="chemistName" value={formData.chemistName} onChange={handleInputChange} required icon={Store} />
                <FloatingSelect label="Type *" name="chemistType" value={formData.chemistType} onChange={handleInputChange} required icon={Tag}>
                  <option value=""></option>
                  {["Chemist", "Stockist"].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </FloatingSelect>
                <FloatingSelect label="Category" name="chemistCategory" value={formData.chemistCategory} onChange={handleInputChange} icon={Tag}>
                  <option value=""></option>
                  {["A", "A+", "B", "B+", "C"].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </FloatingSelect>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FloatingInput label="Phone" name="phone" type="text" value={formData.phone} onChange={handleInputChange} icon={Phone} error={fieldErrors.phone}/>
                <FloatingInput label="Address" name="address" value={formData.address} onChange={handleInputChange} icon={MapPin}/>
                <FloatingInput label="City" name="city" value={formData.city} onChange={handleInputChange} icon={Building2}/>
              </div>

              {/* ADDITIONAL INFO CHECKBOXES (Chemist) */}
              <div className="mt-8 pt-4 border-t border-gray-100">
                <h4 className="text-md font-bold text-gray-700 mb-4">Additional Info</h4>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 font-medium w-max">
                    <input type="checkbox" checked={showOtherInfo} onChange={(e) => setShowOtherInfo(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    Other Info
                  </label>
                </div>
              </div>

              {/* CONDITIONALLY RENDERED SECTIONS (Chemist) */}
              {showOtherInfo && (
                <div className="mt-6 border-l-4 border-blue-500 pl-4">
                  <h4 className="font-bold text-gray-700 mb-4">Chemist Other Info</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <FloatingInput label="Owner Name" name="ownerName" value={formData.ownerName} onChange={handleInputChange} icon={UserCircle}/>
                    <FloatingDate label="Owner DOB" name="ownerDob" value={formData.ownerDob} onChange={handleInputChange} icon={CalendarDays}/>
                    <FloatingDate label="Owner DOA" name="ownerDoa" value={formData.ownerDoa} onChange={handleInputChange} icon={CalendarDays}/>
                    <FloatingDate label="Shop DOA" name="shopDoa" value={formData.shopDoa} onChange={handleInputChange} icon={Store}/>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <FloatingInput label="Aadhaar" name="aadhaar" type="text" value={formData.aadhaar} onChange={handleInputChange} icon={Fingerprint} error={fieldErrors.aadhaar}/>
                    <FloatingSelect label="Gender *" name="gender" value={formData.gender} onChange={handleInputChange} required icon={UserCircle}>
                      <option value=""></option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </FloatingSelect>
                    <FloatingInput label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} icon={Mail} error={fieldErrors.email}/>
                    <FloatingInput label="PAN Card" name="panCard" value={formData.panCard} onChange={handleInputChange} icon={CreditCard} error={fieldErrors.panCard}/>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FloatingInput label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} icon={Tag}/>
                    <FloatingInput label="Licence No" name="licenceNoChemist" value={formData.licenceNoChemist} onChange={handleInputChange} icon={Landmark}/>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Submit Button */}
          <div className="pt-8 border-t flex justify-center sm:justify-start">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-md text-sm font-semibold transition-all hover:-translate-y-0.5 flex items-center gap-2 shadow-lg shadow-blue-500/30"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save {providerType}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reusable Floating UI Components ─────────────────────────────────────────

function FloatingInput({ label, name, type = "text", value, onChange, required, disabled, icon: Icon, error, placeholder }) {
  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full">
        <input
          type={type}
          id={name}
          name={name}
          value={value || ""}
          onChange={onChange}
          required={required}
          placeholder={placeholder || " "}
          disabled={disabled}
          className={`peer w-full rounded-md border ${
            error
              ? 'border-red-500 focus:border-red-600 focus:ring-red-600'
              : 'border-blue-600 focus:border-blue-700 focus:ring-blue-700'
          } bg-transparent pl-3 pr-10 py-2.5 text-sm text-gray-900 transition-all focus:outline-none focus:ring-1 ${
            disabled ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' : ''
          }`}
        />
        <label
          htmlFor={name}
          className={`pointer-events-none absolute left-2.5 top-2.5 origin-[0] -translate-y-[1.15rem] scale-75 transform bg-white px-1 text-[13px] font-semibold uppercase tracking-wide transition-all duration-200
            peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:font-normal
            peer-focus:-translate-y-[1.15rem] peer-focus:scale-75 peer-focus:font-semibold
            ${error ? 'text-red-500 peer-focus:text-red-600' : (disabled ? 'text-gray-400' : 'text-blue-600 peer-focus:text-blue-600')}`}
        >
          {label}
        </label>
        {Icon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Icon className={`h-[18px] w-[18px] ${error ? 'text-red-500' : (disabled ? 'text-gray-400' : 'text-slate-600')}`} />
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-[11px] mt-1 font-medium pl-1">{error}</p>}
    </div>
  );
}

function FloatingSelect({ label, name, value, onChange, required, disabled, children, icon: Icon }) {
  return (
    <div className="relative w-full">
      <select
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`peer w-full rounded-md border ${
          disabled
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed text-gray-400'
            : 'border-blue-600 bg-transparent text-gray-900'
        } pl-3 pr-10 py-2.5 text-sm transition-all focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 appearance-none`}
      >
        {children}
      </select>
      <label
        htmlFor={name}
        className={`pointer-events-none absolute left-2.5 origin-[0] transform bg-white px-1 text-[13px] uppercase tracking-wide transition-all
          ${value ? '-translate-y-[1.15rem] scale-75 top-2.5 font-semibold' : 'translate-y-0 scale-100 top-3 text-gray-500 font-normal'}
          peer-focus:-translate-y-[1.15rem] peer-focus:scale-75 peer-focus:top-2.5 peer-focus:font-semibold
          ${disabled ? '!text-gray-400' : 'text-blue-600 peer-focus:text-blue-600'}`}
      >
        {label}
      </label>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <Icon className={`h-[18px] w-[18px] ${disabled ? 'text-gray-400' : 'text-slate-600'}`} />
      </div>
    </div>
  );
}

function FloatingDate({ label, name, value, onChange, icon: Icon, required }) {
  return (
    <div className="relative w-full">
      <input
        type={value ? "date" : "text"}
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        placeholder=" "
        onFocus={(e) => e.target.type = 'date'}
        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
        onClick={(e) => e.target.showPicker && e.target.showPicker()}
        onKeyDown={(e) => e.preventDefault()}
        className="peer w-full rounded-md border border-blue-600 bg-transparent pl-3 pr-10 py-2.5 text-sm text-gray-900 transition-all focus:outline-none focus:ring-1 focus:border-blue-700 focus:ring-blue-700 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
      />
      <label
        htmlFor={name}
        className="pointer-events-none absolute left-2.5 top-2.5 origin-[0] -translate-y-[1.15rem] scale-75 transform bg-white px-1 text-[13px] font-semibold uppercase tracking-wide text-blue-600 transition-all
          peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:font-normal
          peer-focus:-translate-y-[1.15rem] peer-focus:scale-75 peer-focus:font-semibold"
      >
        {label}
      </label>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <Icon className="h-[18px] w-[18px] text-slate-600" />
      </div>
    </div>
  );
}

// Family Info dynamic list
function DynamicListTable({ title, icon: Icon, onAdd, list, onRemove, renderInputs }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 border-b pb-3">
        <h4 className="font-bold text-gray-700 flex items-center gap-2"><Icon size={18}/> {title}</h4>
        <button
          type="button"
          onClick={onAdd}
          className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 font-semibold bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
        >
          <PlusCircle size={15}/> Add Row
        </button>
      </div>
      {(!list || list.length === 0) ? (
        <div className="text-center py-6 text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No entries added yet. Click 'Add Row' to begin.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 relative group animate-in slide-in-from-top-1 duration-200"
            >
              <div className="grid grid-cols-2 gap-4 flex-grow">
                {renderInputs(item, index)}
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute -top-2.5 -right-2.5 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Meeting Time Template dynamic list (supports nested time slots)
function DynamicListTableTimeTemplate({ title, icon: Icon, onAdd, list, onRemove, renderMainInputs, renderSlotInputs, onAddSlot, onRemoveSlot }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 border-b pb-3">
        <h4 className="font-bold text-gray-800 flex items-center gap-2"><Icon size={18}/> {title}</h4>
        <button
          type="button"
          onClick={onAdd}
          className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 font-semibold bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
        >
          <PlusCircle size={15}/> Add City/Day Row
        </button>
      </div>

      {(!list || list.length === 0) ? (
        <div className="text-center py-8 text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200 shadow-inner">
          No entries added yet. Click 'Add City/Day Row' to begin.
        </div>
      ) : (
        <div className="space-y-5">
          {list.map((item, timeIndex) => (
            <div
              key={timeIndex}
              className="bg-gray-50 p-5 rounded-lg border border-gray-100 relative group animate-in slide-in-from-top-1 duration-200 shadow-inner"
            >
              {/* Remove row button */}
              <button
                type="button"
                onClick={() => onRemove(timeIndex)}
                className="absolute -top-3 -right-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 rounded-full bg-white"
              >
                <XCircle size={22} />
              </button>
              
              {/* City & Day */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 border-b pb-5 border-gray-100">
                {renderMainInputs(item, timeIndex)}
              </div>

              {/* Time Slots */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <Clock size={16} className="text-gray-500" /> Time Slots
                  </h5>
                  <button
                    type="button"
                    onClick={() => onAddSlot(timeIndex)}
                    className="text-teal-600 hover:text-teal-800 text-[11px] flex items-center gap-1 font-semibold bg-teal-50 px-2.5 py-1 rounded-full transition-colors"
                  >
                    <PlusCircle size={14}/> Add Slot
                  </button>
                </div>

                {(!item.slots || item.slots.length === 0) ? (
                  <div className="text-center py-4 text-[11px] text-gray-400 border border-dashed border-gray-200 rounded">
                    Click 'Add Slot' to begin adding times.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {item.slots.map((slotItem, slotIndex) => (
                      <div
                        key={slotIndex}
                        className="flex items-center gap-3 bg-white p-3 rounded-md border border-gray-100 relative hover:border-teal-100 transition-colors"
                      >
                        <div className="grid grid-cols-2 gap-3 flex-grow">
                          {renderSlotInputs(timeIndex, slotItem, slotIndex)}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveSlot(timeIndex, slotIndex)}
                          className="text-red-300 hover:text-red-500 focus:outline-none rounded-full p-1 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}