import React, { useState, useRef } from "react";
import { 
  User, Phone, Mail, Calendar, MapPin, 
  CreditCard, Eye, EyeOff, Upload,
  Loader2, CheckCircle2, AlertCircle, X, Edit3, XCircle
} from "lucide-react";

export default function AdminProfile() {
  // ─── UI State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("personal"); // 'personal' | 'password'
  const [isEditing, setIsEditing] = useState(false); // Controls view vs edit mode
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // ─── Profile Data State ─────────────────────────────
  const [profileImage, setProfileImage] = useState("https://ui-avatars.com/api/?name=Admin&background=eff6ff&color=2563eb&size=128");
  const fileInputRef = useRef(null);

  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    mobile: "",
    email: "",
    dob: "",
    address: "",
    gender: "",
    aadhaar: "",
    pan: ""
  });

  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // ─── Handlers with Strict Input Restrictions ─────────────────────────────────
  const handleInfoChange = (field, value) => {
    let formattedValue = value;

    // Apply strict formatting
    if (field === 'mobile') {
      formattedValue = value.replace(/\D/g, '').slice(0, 10); // Only digits, max 10
    } else if (field === 'aadhaar') {
      formattedValue = value.replace(/\D/g, '').slice(0, 12); // Only digits, max 12
    } else if (field === 'pan') {
      formattedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10); // Alphanumeric, uppercase, max 10
    }

    setPersonalInfo(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setMessage({ type: "", text: "" });
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // ─── Pre-Submission Validation ───
      if (activeTab === "personal") {
        if (personalInfo.mobile && personalInfo.mobile.length !== 10) {
          throw new Error("Mobile number must be exactly 10 digits.");
        }
        if (personalInfo.aadhaar && personalInfo.aadhaar.length !== 12) {
          throw new Error("Aadhaar number must be exactly 12 digits.");
        }
        if (personalInfo.pan) {
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
          if (!panRegex.test(personalInfo.pan)) {
            throw new Error("Invalid PAN format (e.g., ABCDE1234F).");
          }
        }
        if (personalInfo.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(personalInfo.email)) {
            throw new Error("Please enter a valid email address.");
          }
        }
      } else if (activeTab === "password") {
        if (!passwordInfo.currentPassword || !passwordInfo.newPassword) {
          throw new Error("Please fill out all password fields.");
        }
        if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
          throw new Error("New passwords do not match!");
        }
      }

      // ⚠️ Replace with your actual API call
      // await api.put("/api/admin/profile", activeTab === "personal" ? personalInfo : passwordInfo);
      
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (activeTab === "password") {
        setPasswordInfo({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setIsEditing(false); // Turn off edit mode upon successful save
      }

      setMessage({ type: "success", text: "Changes saved successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save changes." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    if (!forgotEmail) {
      alert("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    // ⚠️ Replace with your actual Forgot Password API call
    console.log("Sending reset link to:", forgotEmail);
    setIsForgotModalOpen(false);
    setForgotEmail("");
    setMessage({ type: "success", text: "Password reset instructions sent to your email!" });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-400 pb-12 font-sans">
      
      {/* Global Alerts */}
      {message.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-sm font-bold shadow-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ══ LEFT SIDEBAR: PROFILE CARD ══════════════════════════════════════ */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center h-full">
            
            {/* Profile Image */}
            <div className="relative mb-6 group mt-4">
              <div className="w-32 h-32 rounded-full p-1.5 border-2 border-slate-100 bg-white shadow-sm overflow-hidden relative">
                <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>

            {/* Name & Role */}
            <h2 className="text-2xl font-bold text-slate-800">{personalInfo.name || "Admin User"}</h2>
            <p className="text-sm font-medium text-slate-400 mt-1 mb-8">System Administrator</p>

            {/* Upload Button - Modernized */}
            {isEditing && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-blue-50/80 hover:bg-blue-100 text-blue-600 px-6 py-2.5 rounded-xl text-sm font-bold transition-all mt-auto mb-4 focus:outline-none animate-in zoom-in-95 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Select Image <Upload size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ══ RIGHT CONTENT: TABS & FORMS ═════════════════════════════════════ */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[450px]">
            
            {/* Tabs Header */}
            <div className="flex justify-between items-end border-b border-slate-200 px-6 pt-2">
              <div className="flex">
                <button 
                  onClick={() => { setActiveTab("personal"); setMessage({ type: "", text: "" }); }}
                  className={`py-4 px-6 text-sm font-bold border-b-[3px] transition-colors focus:outline-none ${
                    activeTab === "personal" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Personal Information
                </button>
                <button 
                  onClick={() => { setActiveTab("password"); setIsEditing(false); setMessage({ type: "", text: "" }); }}
                  className={`py-4 px-6 text-sm font-bold border-b-[3px] transition-colors focus:outline-none ${
                    activeTab === "password" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Change Password
                </button>
              </div>

              {/* Edit Toggle Buttons - Modernized */}
              {activeTab === "personal" && (
                <div className="pb-2">
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow px-4 py-1.5 rounded-lg transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none"
                    >
                      <Edit3 size={14} /> Edit Profile
                    </button>
                  ) : (
                    <button 
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-red-600 bg-white border border-slate-200 hover:border-red-300 shadow-sm hover:shadow px-4 py-1.5 rounded-lg transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none"
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Tab Content */}
            <div className="p-8 flex-1 flex flex-col">
              
              {/* ─ TAB 1: PERSONAL INFO ─ */}
              {activeTab === "personal" && (
                <div className="space-y-8 animate-in fade-in flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <MaterialInput label="NAME *" value={personalInfo.name} onChange={(v) => handleInfoChange("name", v)} icon={<User size={18} />} disabled={!isEditing} />
                    <MaterialInput label="MOBILE *" value={personalInfo.mobile} onChange={(v) => handleInfoChange("mobile", v)} icon={<Phone size={18} />} type="tel" disabled={!isEditing} />
                    
                    <div className={`space-y-2 relative pt-2 ${!isEditing ? 'opacity-80' : ''}`}>
                      <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider absolute top-0 left-0">Gender *</label>
                      <div className="flex items-center gap-6 pt-3 h-[32px]">
                        <label className={`flex items-center gap-2 group ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${personalInfo.gender === 'Male' ? 'border-blue-600' : 'border-slate-300'}`}>
                            {personalInfo.gender === 'Male' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                          </div>
                          <span className={`text-sm font-semibold ${personalInfo.gender === 'Male' ? 'text-slate-800' : 'text-slate-500'}`}>Male</span>
                          <input type="radio" name="gender" className="hidden" checked={personalInfo.gender === 'Male'} disabled={!isEditing} onChange={() => handleInfoChange("gender", "Male")} />
                        </label>
                        <label className={`flex items-center gap-2 group ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${personalInfo.gender === 'Female' ? 'border-blue-600' : 'border-slate-300'}`}>
                            {personalInfo.gender === 'Female' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                          </div>
                          <span className={`text-sm font-semibold ${personalInfo.gender === 'Female' ? 'text-slate-800' : 'text-slate-500'}`}>Female</span>
                          <input type="radio" name="gender" className="hidden" checked={personalInfo.gender === 'Female'} disabled={!isEditing} onChange={() => handleInfoChange("gender", "Female")} />
                        </label>
                      </div>
                      <div className={`absolute bottom-0 left-0 w-full h-[1px] ${isEditing ? 'bg-slate-300' : 'bg-slate-200'}`}></div>
                    </div>

                    <MaterialInput label="EMAIL *" value={personalInfo.email} onChange={(v) => handleInfoChange("email", v)} icon={<Mail size={18} />} type="email" disabled={!isEditing} />
                    
                    {/* Modern Calendar Input */}
                    <MaterialInput label="DATE OF BIRTH" value={personalInfo.dob} onChange={(v) => handleInfoChange("dob", v)} icon={<Calendar size={18} />} type="date" disabled={!isEditing} />
                    
                    <MaterialInput label="ADDRESS" value={personalInfo.address} onChange={(v) => handleInfoChange("address", v)} icon={<MapPin size={18} />} disabled={!isEditing} />
                    <MaterialInput label="AADHAAR NUMBER" value={personalInfo.aadhaar} onChange={(v) => handleInfoChange("aadhaar", v)} icon={<CreditCard size={18} />} disabled={!isEditing} />
                    <MaterialInput label="PAN NUMBER" value={personalInfo.pan} onChange={(v) => handleInfoChange("pan", v)} icon={<CreditCard size={18} />} disabled={!isEditing} />
                  </div>
                  
                  {/* Action Button - Modernized */}
                  {isEditing && (
                    <div className="mt-auto pt-10 flex justify-center pb-2 animate-in zoom-in-95">
                      <button 
                        onClick={handleSaveChanges}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-10 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center min-w-[160px] focus:outline-none"
                      >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Save changes"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ─ TAB 2: CHANGE PASSWORD (Always editable) ─ */}
              {activeTab === "password" && (
                <div className="space-y-8 animate-in fade-in flex-1 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
                    <PasswordInput label="CURRENT PASSWORD *" value={passwordInfo.currentPassword} onChange={(v) => handlePasswordChange("currentPassword", v)} />
                    <PasswordInput label="NEW PASSWORD *" value={passwordInfo.newPassword} onChange={(v) => handlePasswordChange("newPassword", v)} />
                    <PasswordInput label="CONFIRM PASSWORD *" value={passwordInfo.confirmPassword} onChange={(v) => handlePasswordChange("confirmPassword", v)} />
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Password Save Button - Modernized */}
                  <div className="mt-auto pt-10 flex justify-center pb-2">
                    <button 
                      onClick={handleSaveChanges}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-10 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center min-w-[160px] focus:outline-none"
                    >
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Update Password"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* ══ FORGOT PASSWORD MODAL ═══════════════════════════════════════════ */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Forgot Password</h3>
            <p className="text-sm text-slate-500 mb-8">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>
            
            <div className="mb-8">
              <MaterialInput 
                label="EMAIL ADDRESS *" 
                value={forgotEmail} 
                onChange={setForgotEmail} 
                icon={<Mail size={18} />} 
                type="email" 
                disabled={false}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsForgotModalOpen(false)} 
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button 
                onClick={handleForgotPasswordSubmit} 
                className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 focus:outline-none"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Custom Modern Material-Style Input Components
// ═══════════════════════════════════════════════════════════════════

function MaterialInput({ label, value, onChange, icon, type = "text", disabled = false }) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className={`relative pt-4 pb-1 group ${disabled ? 'opacity-80' : ''}`}>
      <label className={`absolute left-0 transition-all duration-200 pointer-events-none font-bold uppercase tracking-wider z-10
        ${isFocused || value ? 'top-0 text-[10px] text-blue-600' : 'top-4 text-xs text-slate-500 group-hover:text-slate-700'}
        ${disabled && !value ? 'top-4 text-xs text-slate-400' : ''}
      `}>
        {label}
      </label>
      
      <div className={`relative flex items-center mt-1 px-2 rounded-t-md transition-colors overflow-hidden
        ${!disabled ? 'bg-blue-50/50 hover:bg-blue-50' : 'bg-transparent'}
      `}>
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`w-full bg-transparent text-sm font-semibold focus:outline-none py-2 h-[32px] relative z-20
            ${disabled ? 'text-slate-500 cursor-not-allowed' : 'text-slate-800 cursor-text'}
            ${type === 'date' ? '[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer' : ''}
            ${type === 'date' && !value && !isFocused ? 'text-transparent' : ''}
          `}
        />
        
        {/* Render our custom sleek icon. 
            If it's a date field, the invisible native picker sits ON TOP of this icon, 
            so clicking the icon triggers the native calendar effortlessly! */}
        {icon && (
          <div className={`ml-2 pointer-events-none relative z-10 ${isFocused && !disabled ? 'text-blue-500' : disabled ? 'text-slate-300' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`}>
            {icon}
          </div>
        )}
      </div>
      
      {/* Bottom Border Highlight */}
      <div className={`absolute bottom-0 left-0 w-full h-[1px] transition-colors duration-300 
        ${disabled ? 'bg-slate-200' : isFocused ? 'bg-blue-600 h-[2px]' : 'bg-slate-300 group-hover:bg-slate-400'}
      `}></div>
    </div>
  );
}

function PasswordInput({ label, value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="relative pt-4 pb-1 group">
      <label className={`absolute left-0 transition-all duration-200 pointer-events-none font-bold uppercase tracking-wider z-10
        ${isFocused || value ? 'top-0 text-[10px] text-blue-600' : 'top-4 text-xs text-slate-500 group-hover:text-slate-700'}
      `}>
        {label}
      </label>
      <div className="flex items-center mt-1 px-2 bg-blue-50/50 hover:bg-blue-50 rounded-t-md transition-colors">
        <input 
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none py-2 h-[32px] tracking-wide"
        />
        <button 
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`focus:outline-none ml-2 transition-colors ${isFocused ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600 group-hover:text-blue-400'}`}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-[1px] transition-colors duration-300 ${isFocused ? 'bg-blue-600 h-[2px]' : 'bg-slate-300 group-hover:bg-slate-400'}`}></div>
    </div>
  );
}