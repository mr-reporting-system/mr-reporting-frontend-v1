import React, { useState, useEffect, useRef } from "react";
import {
  Loader2, MapPin, CheckCircle2, ArrowRightLeft,
  ChevronDown, AlertCircle, Search, Users, Check
} from "lucide-react";
import api from "../../../services/api";

const TRANSFER_TYPES = [
  { value: "Area",     label: "Area" },
  { value: "Doctor",   label: "Doctor" },
  { value: "Chemist",  label: "Chemist" },
  { value: "Stockist", label: "Stockist" },
];

export default function MasterDataTransfer() {
  const [transferType,    setTransferType]    = useState("Area");
  const [error,           setError]           = useState("");
  const [popup,           setPopup]           = useState({ isOpen: false, message: "" });

  const [isLoadingDetails,   setIsLoadingDetails]   = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isTransferring,     setIsTransferring]     = useState(false);

  const [states,        setStates]        = useState([]);
  const [fromEmployees, setFromEmployees] = useState([]);
  const [toEmployees,   setToEmployees]   = useState([]);

  const [selectedStateIds,   setSelectedStateIds]   = useState([]);
  const [fromEmployeeId,     setFromEmployeeId]     = useState("");
  const [toEmployeeId,       setToEmployeeId]       = useState("");

  const [fromAreas,           setFromAreas]           = useState([]);
  const [toAreas,             setToAreas]             = useState([]);
  const [providers,           setProviders]           = useState([]);
  const [selectedAreaIds,     setSelectedAreaIds]     = useState([]);
  const [selectedFromAreaId,  setSelectedFromAreaId]  = useState("");
  const [selectedProviderIds, setSelectedProviderIds] = useState([]);
  const [selectedToAreaId,    setSelectedToAreaId]    = useState("");
  const [detailsVisible,      setDetailsVisible]      = useState(false);

  useEffect(() => { fetchStates(); }, []);

  useEffect(() => {
    if (selectedStateIds.length > 0) {
      fetchEmployees(selectedStateIds.join(","));
    } else {
      setFromEmployees([]); setToEmployees([]);
      setFromEmployeeId(""); setToEmployeeId("");
    }
  }, [selectedStateIds]);

  useEffect(() => {
    if (selectedStateIds.length > 0 && fromEmployeeId) {
      setToEmployees(fromEmployees.filter(e => String(e.id) !== String(fromEmployeeId)));
    } else {
      setToEmployees([]);
    }
    setToEmployeeId("");
    resetTables();
  }, [fromEmployeeId]);

  const handleTypeChange = (val) => { setTransferType(val); resetTables(); setError(""); };

  const resetTables = () => {
    setFromAreas([]); setToAreas([]); setProviders([]);
    setSelectedAreaIds([]); setSelectedFromAreaId("");
    setSelectedProviderIds([]); setSelectedToAreaId("");
    setDetailsVisible(false);
  };

  const fetchStates = async () => {
    try {
      const res  = await api.get("/api/masters/states");
      const data = res.data?.data || res.data || [];
      setStates(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchEmployees = async (stateIdsString) => {
    try {
      const res  = await api.get(`/api/masters/employees/by-states?stateIds=${stateIdsString}`);
      const data = res.data?.data || res.data || [];
      setFromEmployees(Array.isArray(data) ? data : []);
    } catch { setFromEmployees([]); }
  };

  const handleViewDetails = async () => {
    if (selectedStateIds.length === 0 || !fromEmployeeId || !toEmployeeId) return;
    setError(""); setIsLoadingDetails(true); resetTables();
    try {
      const fromRes  = await api.get(`/api/masters/areas/filter?employeeId=${fromEmployeeId}`);
      const fromData = fromRes.data?.data || fromRes.data || [];
      setFromAreas(Array.isArray(fromData) ? fromData : []);
      if (transferType !== "Area") {
        const toRes  = await api.get(`/api/masters/areas/filter?employeeId=${toEmployeeId}`);
        const toData = toRes.data?.data || toRes.data || [];
        setToAreas(Array.isArray(toData) ? toData : []);
      }
      setDetailsVisible(true);
    } catch { setError("Failed to load areas for the selected employees."); }
    finally  { setIsLoadingDetails(false); }
  };

  const handleSourceAreaClick = async (areaId) => {
    if (transferType === "Area") return;
    setSelectedFromAreaId(areaId); setSelectedProviderIds([]); setIsLoadingProviders(true);
    try {
      const endpoint = transferType === "Doctor"
        ? `/api/masters/doctors/area/${areaId}`
        : `/api/masters/providers/area/${areaId}?type=${transferType}`;
      const res  = await api.get(endpoint);
      const data = res.data?.data || res.data || [];
      setProviders(Array.isArray(data) ? data : []);
    } catch { setProviders([]); setError(`Failed to load ${transferType}s.`); }
    finally  { setIsLoadingProviders(false); }
  };

  const executeTransfer = async () => {
    setError(""); setIsTransferring(true);
    try {
      let endpoint = "", payload = {};
      if (transferType === "Area") {
        endpoint = "/api/masters/areas/transfer";
        payload  = { areaIds: selectedAreaIds, newEmployeeId: parseInt(toEmployeeId) };
      } else if (transferType === "Doctor") {
        endpoint = "/api/masters/doctors/transfer";
        payload  = { providerIds: selectedProviderIds, newEmployeeId: parseInt(toEmployeeId), newAreaId: parseInt(selectedToAreaId) };
      } else {
        endpoint = "/api/masters/providers/transfer";
        payload  = { providerIds: selectedProviderIds, newEmployeeId: parseInt(toEmployeeId), newAreaId: parseInt(selectedToAreaId) };
      }
      const res = await api.put(endpoint, payload);
      if (res.data?.success || res.status === 200) {
        setPopup({ isOpen: true, message: `${transferType} Data Transferred Successfully!` });
        handleViewDetails();
      }
    } catch (err) { setError(err.response?.data?.message || "Transfer failed. Please try again."); }
    finally      { setIsTransferring(false); }
  };

  const toggleProviderRow  = (id) => setSelectedProviderIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAllProviders = (e)  => setSelectedProviderIds(e.target.checked ? providers.map(p => p.id) : []);
  const toggleAreaRow      = (id) => setSelectedAreaIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAllAreas     = (e)  => setSelectedAreaIds(e.target.checked ? fromAreas.map(a => a.id) : []);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-8 px-2 sm:px-0">

      {/* ── TOP CARD ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-5 sm:p-7 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ArrowRightLeft className="text-blue-500" size={20} />
            Master Data Transfer
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 text-sm rounded-md mb-5 border border-red-100 flex items-center gap-2">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div className="space-y-6">

          {/* Radio buttons */}
          <div className="flex flex-wrap items-center gap-5 p-3.5 bg-gray-50 rounded-lg border border-gray-200">
            {TRANSFER_TYPES.map(type => (
              <label key={type.value} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio" name="transferType" value={type.value}
                  checked={transferType === type.value}
                  onChange={() => handleTypeChange(type.value)}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-400 cursor-pointer"
                />
                <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                  transferType === type.value ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                }`}>
                  {type.label}
                </span>
              </label>
            ))}
          </div>

          {/* 3 inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <MultiSelectDropdown
              label="SELECT STATE *"
              options={states}
              selectedIds={selectedStateIds}
              onChange={(newIds) => {
                setSelectedStateIds(newIds);
                setFromEmployeeId(""); setToEmployeeId("");
                resetTables();
              }}
            />
            <CustomSelect
              label="FROM EMPLOYEE *"
              value={fromEmployeeId}
              disabled={selectedStateIds.length === 0}
              onChange={(e) => setFromEmployeeId(e.target.value)}
              icon={Users}
            >
              <option value=""></option>
              {fromEmployees.map(e => <option key={e.id} value={e.id}>{e.name || e.employee_name}</option>)}
            </CustomSelect>
            <CustomSelect
              label="TO EMPLOYEE *"
              value={toEmployeeId}
              disabled={!fromEmployeeId}
              onChange={(e) => setToEmployeeId(e.target.value)}
              icon={Users}
            >
              <option value=""></option>
              {toEmployees.map(e => <option key={e.id} value={e.id}>{e.name || e.employee_name}</option>)}
            </CustomSelect>
          </div>

          {/* View Details button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleViewDetails}
              disabled={selectedStateIds.length === 0 || !fromEmployeeId || !toEmployeeId || isLoadingDetails}
              className={`w-full sm:w-auto px-7 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2
                ${(selectedStateIds.length > 0 && fromEmployeeId && toEmployeeId)
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            >
              {isLoadingDetails ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTTOM CARD ───────────────────────────────────────────────────── */}
      {detailsVisible && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">

          {transferType === "Area" ? (
            <div>
              <div className="bg-blue-50 px-6 py-3.5 border-b border-blue-100 flex justify-between items-center">
                <h4 className="text-gray-700 font-bold text-xs uppercase tracking-wider">Select Areas to Transfer</h4>
                <span className="bg-blue-100 text-blue-600 px-2.5 py-1 rounded text-[11px] font-bold">{fromAreas.length} Total</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto p-6">
                <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="w-14 py-3.5 px-5 text-center">
                        <input type="checkbox" onChange={toggleAllAreas}
                          checked={fromAreas.length > 0 && selectedAreaIds.length === fromAreas.length}
                          className="w-4 h-4 rounded text-blue-500 focus:ring-blue-400 cursor-pointer" />
                      </th>
                      <th className="py-3.5 px-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Area Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fromAreas.length === 0 ? (
                      <tr><td colSpan="2" className="py-10 text-center text-gray-400 text-sm">No areas found for Source Employee.</td></tr>
                    ) : fromAreas.map(area => (
                      <tr key={area.id}
                        className={`transition-colors hover:bg-blue-50/40 cursor-pointer ${selectedAreaIds.includes(area.id) ? "bg-blue-50/60" : ""}`}
                        onClick={() => toggleAreaRow(area.id)}>
                        <td className="w-14 py-3.5 px-5 text-center">
                          <input type="checkbox" readOnly checked={selectedAreaIds.includes(area.id)}
                            className="w-4 h-4 rounded text-blue-500 cursor-pointer" />
                        </td>
                        <td className="py-3.5 px-5 text-gray-700 font-medium">{area.area_name || area.areaName || area.name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-bold uppercase">{selectedAreaIds.length} Area(s) selected</span>
                <button onClick={executeTransfer} disabled={selectedAreaIds.length === 0 || isTransferring}
                  className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all flex gap-2 items-center
                    ${selectedAreaIds.length > 0 ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                  {isTransferring ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />} Transfer Areas
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* 1. Source Areas */}
                <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden h-[380px]">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">1. Source Areas</span>
                    <span className="text-[11px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold">{fromAreas.length}</span>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    <ul className="divide-y divide-gray-100">
                      {fromAreas.length === 0 && <li className="p-5 text-center text-sm text-gray-400">No areas found.</li>}
                      {fromAreas.map(area => (
                        <li key={area.id} onClick={() => handleSourceAreaClick(area.id)}
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors border-l-4 ${
                            selectedFromAreaId === area.id
                              ? "bg-blue-50 border-blue-500 font-bold text-blue-700"
                              : "border-transparent hover:bg-gray-50 text-gray-700"
                          }`}>
                          {area.area_name || area.areaName || area.name || "—"}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 2. Providers */}
                <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden h-[380px]">
                  <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">2. Select {transferType}s</span>
                    {providers.length > 0 && (
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-blue-600 font-bold">
                        <input type="checkbox" onChange={toggleAllProviders}
                          checked={selectedProviderIds.length === providers.length}
                          className="w-3.5 h-3.5 rounded text-blue-500" />
                        All
                      </label>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1 relative">
                    {isLoadingProviders ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                        <Loader2 className="animate-spin text-blue-500" size={28} />
                      </div>
                    ) : !selectedFromAreaId ? (
                      <div className="p-8 text-center text-sm text-gray-400">Select a Source Area first.</div>
                    ) : providers.length === 0 ? (
                      <div className="p-8 text-center text-sm text-red-400 font-medium bg-red-50/30">No {transferType}s found.</div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {providers.map(p => (
                          <li key={p.id} onClick={() => toggleProviderRow(p.id)}
                            className={`flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-blue-50/40 transition-colors ${
                              selectedProviderIds.includes(p.id) ? "bg-blue-50/60" : ""
                            }`}>
                            <input type="checkbox" readOnly checked={selectedProviderIds.includes(p.id)}
                              className="w-4 h-4 rounded text-blue-500 flex-shrink-0" />
                            <span className="font-medium text-gray-700 truncate">
                              {p.doctor_name || p.doctorName || p.chemist_name || p.chemistName || p.stockist_name || p.stockistName || p.name || "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* 3. Destination Areas */}
                <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden h-[380px]">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">3. Destination Area</span>
                    <span className="text-[11px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold">{toAreas.length}</span>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    <ul className="divide-y divide-gray-100">
                      {toAreas.length === 0 && <li className="p-5 text-center text-sm text-gray-400">No areas for target employee.</li>}
                      {toAreas.map(area => (
                        <li key={area.id} onClick={() => setSelectedToAreaId(area.id)}
                          className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center justify-between border-l-4 ${
                            selectedToAreaId === area.id
                              ? "bg-green-50 border-green-500 font-bold text-green-700"
                              : "border-transparent hover:bg-gray-50 text-gray-700"
                          }`}>
                          {area.area_name || area.areaName || area.name || "—"}
                          {selectedToAreaId === area.id && <CheckCircle2 size={15} className="text-green-600 flex-shrink-0" />}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs text-gray-500 font-bold uppercase flex gap-5">
                  <span>Selected: <span className="text-blue-600">{selectedProviderIds.length} {transferType}(s)</span></span>
                  <span>Target Area: <span className={selectedToAreaId ? "text-green-600" : "text-red-500"}>{selectedToAreaId ? "Selected ✓" : "Pending"}</span></span>
                </div>
                <button onClick={executeTransfer}
                  disabled={selectedProviderIds.length === 0 || !selectedToAreaId || isTransferring}
                  className={`w-full sm:w-auto px-8 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2
                    ${(selectedProviderIds.length > 0 && selectedToAreaId)
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                  {isTransferring ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />}
                  Complete Transfer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Success Popup ─────────────────────────────────────────────────── */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl p-7 max-w-xs w-full mx-4 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 border-2 border-blue-100 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-blue-500" strokeWidth={3} />
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-6">{popup.message}</h3>
            <button onClick={() => setPopup({ isOpen: false, message: "" })}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-lg font-bold shadow-sm transition-all active:scale-95">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CustomSelect ─────────────────────────────────────────────────────────────
// Border + label: gray when empty, blue only after value is selected
function CustomSelect({ label, value, onChange, disabled, children, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return null;
    return { value: child.props.value, label: child.props.children };
  }).filter(Boolean);

  const selectedOption = options.find(opt => opt.value == value);
  const hasValue = Boolean(value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full group select-none">

      {/* ── Trigger ──
          - Empty + closed  → gray border, gray icon
          - Empty + open    → gray border (just opening, no value yet)
          - Has value       → blue border, blue icon
          - Has value + open → blue border (deeper), blue icon
      */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full rounded-lg border-2 px-4 py-3 text-sm flex items-center justify-between cursor-pointer transition-all
          ${disabled
            ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            : hasValue
              ? isOpen
                ? "border-blue-500 ring-2 ring-blue-100 bg-white"   // has value + open
                : "border-blue-400 bg-white text-gray-900 hover:border-blue-500" // has value + closed
              : isOpen
                ? "border-gray-400 ring-2 ring-gray-100 bg-white"   // no value + open
                : "border-gray-300 bg-white text-gray-900 hover:border-gray-400" // no value + closed
          }`}
      >
        <span className={`block truncate font-medium ${selectedOption?.value ? "text-gray-900" : "text-transparent"}`}>
          {selectedOption?.label || " "}
        </span>
        <div className={`flex items-center gap-1 flex-shrink-0 transition-colors duration-200
          ${disabled
            ? "text-gray-300"
            : hasValue
              ? isOpen ? "text-blue-500" : "text-blue-400"
              : isOpen ? "text-gray-500" : "text-gray-400"
          }`}>
          {Icon && <Icon size={16} strokeWidth={2} className="opacity-70" />}
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* ── Floating label ──
          - Empty (not open) → placeholder position, gray
          - Open (no value)  → stays as placeholder, gray
          - Has value        → floats up, turns blue
      */}
      <label className={`absolute left-3 px-1 transition-all duration-200 pointer-events-none z-20 font-semibold bg-white
        ${hasValue
          ? "-top-2.5 text-[11px] text-blue-500"           // ✅ blue only when value selected
          : isOpen
            ? "-top-2.5 text-[11px] text-gray-500"         // floats up while open but no value yet
            : "top-3 text-sm text-gray-400"                 // placeholder resting position
        } ${disabled ? "!text-gray-300" : ""}`}>
        {label}
      </label>

      {/* ── Dropdown list ── */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-[110] max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <ul className="py-1.5">
            {options.map((opt, idx) => opt.value !== "" && (
              <li key={idx} onClick={() => handleSelect(opt.value)}
                className={`px-4 py-3 text-sm cursor-pointer transition-colors font-medium ${
                  value == opt.value
                    ? "bg-blue-50 text-blue-600 font-semibold border-l-[3px] border-blue-500"
                    : "text-gray-700 hover:bg-blue-500 hover:text-white border-l-[3px] border-transparent"
                }`}>
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── MultiSelectDropdown ──────────────────────────────────────────────────────
// Border + label: gray when nothing selected, blue only after states are selected
function MultiSelectDropdown({ label, options, selectedIds, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectAll   = () => onChange(options.map(o => o.id));
  const handleDeselectAll = () => onChange([]);
  const toggleOption      = (id) => onChange(
    selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]
  );

  const displayValue = selectedIds.length > 0
    ? options.filter(o => selectedIds.includes(o.id)).map(o => o.state_name).join(", ")
    : "";

  const hasValue = selectedIds.length > 0;

  return (
    <div ref={dropdownRef} className="relative w-full group select-none">

      {/* ── Trigger ── */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-lg border-2 px-4 py-3 text-sm flex items-center justify-between cursor-pointer transition-all
          ${hasValue
            ? isOpen
              ? "border-blue-500 ring-2 ring-blue-100 bg-white"
              : "border-blue-400 bg-white text-gray-900 hover:border-blue-500"
            : isOpen
              ? "border-gray-400 ring-2 ring-gray-100 bg-white"
              : "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
          }`}
      >
        <span className={`block truncate font-medium ${displayValue ? "text-gray-900" : "text-transparent"}`}>
          {displayValue || " "}
        </span>
        <div className={`flex items-center gap-1 flex-shrink-0 transition-colors duration-200
          ${hasValue
            ? isOpen ? "text-blue-500" : "text-blue-400"
            : isOpen ? "text-gray-500" : "text-gray-400"
          }`}>
          <MapPin size={16} strokeWidth={2} className="opacity-70" />
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* ── Floating label ── */}
      <label className={`absolute left-3 px-1 transition-all duration-200 pointer-events-none z-20 font-semibold bg-white
        ${hasValue
          ? "-top-2.5 text-[11px] text-blue-500"     // ✅ blue only when states are selected
          : isOpen
            ? "-top-2.5 text-[11px] text-gray-500"   // floats while open, no selection yet
            : "top-3 text-sm text-gray-400"           // resting placeholder
        }`}>
        {label}
      </label>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="flex border-b border-gray-200">
            <button onClick={(e) => { e.stopPropagation(); handleSelectAll(); }}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors">
              Select All
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDeselectAll(); }}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
              Deselect All
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1.5">
            {options.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              return (
                <li key={opt.id}
                  onClick={(e) => { e.stopPropagation(); toggleOption(opt.id); }}
                  className="px-4 py-3 text-sm cursor-pointer hover:bg-blue-50 flex items-center gap-3 transition-colors">
                  <input type="checkbox" readOnly checked={isSelected}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 pointer-events-none flex-shrink-0" />
                  <span className={`font-medium ${isSelected ? "text-blue-600 font-semibold" : "text-gray-700"}`}>
                    {opt.state_name}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}