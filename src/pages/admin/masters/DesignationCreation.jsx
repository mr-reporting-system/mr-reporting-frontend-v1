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
      // 🚀 FIXED: Now mapping exactly to the Java entity properties
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

    // 🚀 FIXED: Payload exactly matches the Java backend expectations
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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 🌟 Top Card: Creation Form */}
      <div className="bg-white p-5 sm:p-8 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Briefcase className="text-blue-600" size={24} />
              {editingId ? "Edit Designation" : "Designation Creation & Edit"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editingId ? "Update the details for this role." : "Add new roles and hierarchy levels to the system."}
            </p>
          </div>
          {editingId && (
            <button 
              onClick={() => { setEditingId(null); setFormData({ name: "", level: "", fullForm: "" }); }}
              className="text-sm text-gray-500 hover:text-red-500 underline transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 border border-red-100 flex items-center gap-2">{error}</div>}
        {successMsg && <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-lg text-sm mb-6 border border-blue-100 flex items-center gap-2"><CheckCircle2 size={18} />{successMsg}</div>}

        {/* Form Container: Stacks on mobile, sits side-by-side on desktop */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-5 sm:gap-6 pt-2">
          
          <FloatingInput 
            label="Designation Name" 
            name="name" 
            value={formData.name} 
            onChange={handleInputChange} 
            required 
          />

          <FloatingInput 
            type="number"
            label="Designation Level" 
            name="level" 
            value={formData.level} 
            onChange={handleInputChange} 
            required 
          />

          <FloatingInput 
            label="Designation Full Form" 
            name="fullForm" 
            value={formData.fullForm} 
            onChange={handleInputChange} 
          />

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="group text-white px-6 py-2.5 rounded-md text-sm font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center gap-2 w-full sm:w-auto justify-center bg-blue-500 hover:bg-blue-600 shadow-blue-500/30"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : editingId ? (
              <Edit2 size={18} />
            ) : (
              <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            )}
            {editingId ? "Update" : "Create"}
          </button>
        </form>
      </div>

      {/* 🌟 Bottom Card: Data Table */}
      <div className="bg-white p-5 sm:p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Existing Designations</h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-blue-600">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="text-sm font-medium text-gray-500">Loading designations...</p>
          </div>
        ) : designations.length === 0 ? (
          
          /* Empty State Animation */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <Briefcase className="text-gray-400" size={32} />
            </div>
            <h3 className="text-gray-800 font-semibold mb-1">No Designations Found</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Your database is currently empty. Use the form above to create your first designation.
            </p>
          </div>

        ) : (
          <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-5 font-semibold tracking-wide">S.N.</th>
                  <th className="py-3 px-5 font-semibold tracking-wide">Designation Name</th>
                  <th className="py-3 px-5 font-semibold tracking-wide text-center">Level</th>
                  <th className="py-3 px-5 font-semibold tracking-wide">Full Form</th>
                  <th className="py-3 px-5 font-semibold tracking-wide text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {designations.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`transition-colors duration-200 group ${editingId === item.id ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}
                  >
                    <td className="py-3 px-5 text-gray-500 font-medium">{index + 1}.</td>
                    {/* 🚀 FIXED: Mapping exactly to item.name, item.level, item.fullForm */}
                    <td className="py-3 px-5 text-gray-800 font-bold">{item.name}</td>
                    <td className="py-3 px-5 text-center">
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">
                        Lvl {item.level}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-gray-600">{item.fullForm || '-'}</td>
                    <td className="py-3 px-5 flex justify-center">
                      <button 
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-110 focus:outline-none"
                        title="Edit Designation"
                      >
                        <Edit2 size={18} />
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
  );
}

// 🧱 Slimmer Floating Label Component
function FloatingInput({ label, name, type = "text", value, onChange, required }) {
  return (
    <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
      <input 
        type={type} 
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder=" " 
        className="peer w-full rounded-md border border-blue-600 bg-transparent px-3 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
      />
      <label 
        htmlFor={name}
        className="pointer-events-none absolute left-2.5 top-2.5 origin-[0] -translate-y-5 scale-90 transform bg-white px-1 text-[13px] font-semibold uppercase tracking-wide text-blue-600 transition-all duration-200
        peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:font-normal
        peer-focus:-translate-y-5 peer-focus:scale-90 peer-focus:text-blue-600 peer-focus:font-semibold"
      >
        {label}
      </label>
    </div>
  );
}