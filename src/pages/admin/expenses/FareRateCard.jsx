import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Edit2,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../../../services/api";

// ─── Global responsive styles (from reference) ───────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  .ucr-wrap  { width:100%; padding-bottom:48px; font-family:Inter,sans-serif; overflow-x: hidden; }
  .ucr-card  { background:#fff; border-radius:16px; box-shadow:0 1px 4px rgba(0,0,0,0.07); border:1px solid #f3f4f6; overflow:visible; margin-bottom: 24px; }
  .ucr-header{ padding:16px 20px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:12px; }
  .ucr-body  { padding:24px; }
  .ucr-footer{ padding:14px 24px; background:#f9fafb; border-top:1px solid #f3f4f6; display:flex; align-items:center; justify-content:flex-end; border-radius:0 0 16px 16px; flex-wrap: wrap; gap: 12px; }

  /* Responsive Table Scroll Logic */
  .ucr-table-container {
    border: 1px solid #f3f4f6;
    border-radius: 12px;
    overflow-x: auto;
    background: #fff;
    -webkit-overflow-scrolling: touch;
  }
  .ucr-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1200px; }
  .ucr-table thead { background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
  .ucr-table th { padding: 12px 16px; text-align: left; font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  .ucr-table td { padding: 12px 16px; color: #374151; border-bottom: 1px solid #f3f4f6; }

  .ucr-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:24px; }
  .ucr-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:24px; }

  /* Responsive Col Spans */
  .col-span-2 { grid-column: span 2; }
  .col-span-4 { grid-column: span 4; }

  @media(max-width:1024px){
    .ucr-grid, .ucr-grid-4 { grid-template-columns:repeat(2,1fr); gap:16px; }
    .col-span-4 { grid-column: span 2; }
  }
  @media(max-width:768px){
    .ucr-grid, .ucr-grid-4 { grid-template-columns:1fr; gap:16px; }
    .col-span-2, .col-span-4 { grid-column: span 1 !important; }
    .ucr-body  { padding:16px; }
    .ucr-header { padding: 16px; flex-direction: column; align-items: flex-start; }
    .ucr-header > div { width: 100%; }
    .modal-close-btn { align-self: flex-end; margin-top: -30px; }
    .ucr-footer { justify-content: center; }
  }
  @keyframes ucr-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

const FH = 40;

const ALLOWANCE_OPTIONS = [
  { value: "KM Wise", label: "KM Wise" },
  { value: "Lumsum", label: "Lumsum" },
];
const APPLICABLE_OPTIONS = [
  { value: "hq", label: "HQ" },
  { value: "ex", label: "EX" },
];

function createEmptyRule() {
  return {
    localId: `${Date.now()}-${Math.random()}`,
    fromDistance: "",
    toDistance: "",
    allowanceType: "",
    applicableTo: "",
    fare: "",
    frcCode: "",
    description: "",
  };
}

function normalizeDesignation(option) {
  return {
    id: String(option?.id ?? option?.designationId ?? option?.value ?? "").trim(),
    name: String(
      option?.name ??
        option?.designation_name ??
        option?.designationName ??
        option?.label ??
        "Unknown"
    ).trim(),
  };
}

function normalizeFrcRecord(item, index = 0) {
  const designationId =
    item?.designationId ??
    item?.designation?.id ??
    item?.designation_id ??
    item?.designationCode ??
    "";

  const designationName =
    item?.designationName ??
    item?.designation?.name ??
    item?.designation?.designation_name ??
    item?.designation_name ??
    item?.name ??
    "-";

  return {
    id: item?.id ?? item?.frcId ?? item?._id ?? `frc-${index}`,
    designationId: String(designationId ?? ""),
    designationName: String(designationName ?? "-").trim() || "-",
    fromDistance: item?.fromDistance ?? item?.from_distance ?? "",
    toDistance: item?.toDistance ?? item?.to_distance ?? "",
    allowanceType:
      item?.allowanceType ?? item?.allowance_to_be_get ?? item?.allowance ?? "",
    applicableTo: item?.applicableTo ?? item?.applicable_to ?? "",
    fare: item?.fare ?? item?.taPerKm ?? item?.ta_per_km ?? "",
    description: item?.description ?? "",
    frcCode: item?.frcCode ?? item?.frc_code ?? "",
  };
}

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || fallbackMessage;
}

export default function FareRateCard() {
  const [designations, setDesignations] = useState([]);
  const [selectedDesignationIds, setSelectedDesignationIds] = useState([]);
  const [rules, setRules] = useState([createEmptyRule()]);

  const [records, setRecords] = useState([]);
  const [showTable, setShowTable] = useState(false);

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const clearNotifications = () => {
    setError("");
    setSuccessMessage("");
  };

  const fetchDesignations = useCallback(async () => {
    try {
      const response = await api.get("/api/expense/frc/designations");
      const payload = response?.data?.data ?? response?.data ?? [];
      const normalized = Array.isArray(payload)
        ? payload
            .map(normalizeDesignation)
            .filter((item) => item.id && item.name)
        : [];
      setDesignations(normalized);
    } catch {
      try {
        const fallbackResponse = await api.get("/api/masters/designations");
        const fallbackPayload =
          fallbackResponse?.data?.data ?? fallbackResponse?.data ?? [];
        const normalizedFallback = Array.isArray(fallbackPayload)
          ? fallbackPayload
              .map(normalizeDesignation)
              .filter((item) => item.id && item.name)
          : [];
        setDesignations(normalizedFallback);
      } catch {
        setError("Failed to load designation list.");
      }
    }
  }, []);

  const fetchFrcRecords = useCallback(async ({ revealTable = false } = {}) => {
    setIsTableLoading(true);
    try {
      const response = await api.get("/api/expense/frc");
      const payload = response?.data?.data ?? response?.data ?? [];
      const normalized = Array.isArray(payload)
        ? payload.map((item, index) => normalizeFrcRecord(item, index))
        : [];
      setRecords(normalized);

      if (revealTable || normalized.length > 0) {
        setShowTable(true);
      }
    } catch (error) {
      setError(getErrorMessage(error, "Failed to load Fare Rate Card records."));
    } finally {
      setIsTableLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setIsLoadingInitial(true);
      clearNotifications();
      await Promise.all([fetchDesignations(), fetchFrcRecords()]);
      if (isMounted) {
        setIsLoadingInitial(false);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [fetchDesignations, fetchFrcRecords]);

  const selectedDesignationNames = useMemo(() => {
    const selected = new Set(selectedDesignationIds);
    return designations
      .filter((designation) => selected.has(designation.id))
      .map((designation) => designation.name);
  }, [designations, selectedDesignationIds]);

  const updateRule = useCallback((localId, key, value) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.localId === localId
          ? {
              ...rule,
              [key]: value,
            }
          : rule
      )
    );
  }, []);

  const addRule = () => {
    setRules((prev) => [...prev, createEmptyRule()]);
  };

  const removeRule = (localId) => {
    setRules((prev) => prev.filter((rule) => rule.localId !== localId));
  };

  const validateRules = () => {
    if (selectedDesignationIds.length === 0) {
      return "Please select at least one designation.";
    }

    if (rules.length === 0) {
      return "Please add at least one Fare Rate Designation card.";
    }

    for (let index = 0; index < rules.length; index += 1) {
      const rule = rules[index];
      const rowNo = index + 1;

      const isMissingRequiredField =
        !rule.fromDistance ||
        !rule.toDistance ||
        !rule.allowanceType ||
        !rule.applicableTo ||
        !rule.fare ||
        !rule.frcCode ||
        !rule.description;

      if (isMissingRequiredField) {
        return `Please fill all fields in Fare Rate Designation #${rowNo}.`;
      }

      const fromDistance = Number(rule.fromDistance);
      const toDistance = Number(rule.toDistance);
      const fare = Number(rule.fare);

      if (Number.isNaN(fromDistance) || Number.isNaN(toDistance) || Number.isNaN(fare)) {
        return `Distance and fare should be valid numbers in row #${rowNo}.`;
      }

      if (fromDistance < 0 || toDistance < 0 || fare < 0) {
        return `Negative values are not allowed in row #${rowNo}.`;
      }

      if (fromDistance > toDistance) {
        return `From distance must be less than or equal to To distance in row #${rowNo}.`;
      }
    }

    return "";
  };

  const handleCreateFrc = async () => {
    clearNotifications();
    const validationMessage = validateRules();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const rowsPayload = rules.map((rule) => ({
        fromDistance: Number(rule.fromDistance),
        toDistance: Number(rule.toDistance),
        allowanceType: rule.allowanceType,
        applicableTo: rule.applicableTo,
        fare: Number(rule.fare),
        frcCode: rule.frcCode.trim(),
        description: rule.description.trim(),
      }));

      const payload = {
        designationIds: selectedDesignationIds.map((id) => Number(id)),
        rows: rowsPayload,
      };

      await api.post("/api/expense/frc", payload);

      setSuccessMessage("Fare Rate Card created successfully.");
      setRules([createEmptyRule()]);
      setSelectedDesignationIds([]);
      setShowTable(true);
      await fetchFrcRecords({ revealTable: true });
    } catch (error) {
      setError(getErrorMessage(error, "Failed to create Fare Rate Card."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (record) => {
    setEditingRecord({ ...record });
    setIsEditModalOpen(true);
    clearNotifications();
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord?.id) {
      setError("Record id is missing. Cannot update this row.");
      return;
    }

    const requiredFieldsMissing =
      !editingRecord.fromDistance ||
      !editingRecord.toDistance ||
      !editingRecord.allowanceType ||
      !editingRecord.applicableTo ||
      !editingRecord.fare ||
      !editingRecord.frcCode ||
      !editingRecord.description;

    if (requiredFieldsMissing) {
      setError("Please fill all fields before updating.");
      return;
    }

    const fromDistance = Number(editingRecord.fromDistance);
    const toDistance = Number(editingRecord.toDistance);
    const fare = Number(editingRecord.fare);

    if (Number.isNaN(fromDistance) || Number.isNaN(toDistance) || Number.isNaN(fare)) {
      setError("Distance and fare should be valid numbers.");
      return;
    }

    if (fromDistance > toDistance) {
      setError("From distance must be less than or equal to To distance.");
      return;
    }

    setIsSubmitting(true);
    clearNotifications();

    try {
      const payload = {
        fromDistance,
        toDistance,
        allowanceType: editingRecord.allowanceType,
        applicableTo: editingRecord.applicableTo,
        fare,
        frcCode: editingRecord.frcCode.trim(),
        description: editingRecord.description.trim(),
      };

      await api.put(`/api/expense/frc/${editingRecord.id}`, payload);

      setSuccessMessage("Fare Rate Card updated successfully.");
      setIsEditModalOpen(false);
      setEditingRecord(null);
      await fetchFrcRecords({ revealTable: true });
    } catch (error) {
      setError(getErrorMessage(error, "Failed to update Fare Rate Card."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (record) => {
    if (!record?.id) {
      setError("Record id is missing. Cannot delete this row.");
      return;
    }

    const shouldDelete = window.confirm("Delete this Fare Rate Card record?");
    if (!shouldDelete) {
      return;
    }

    clearNotifications();
    setIsSubmitting(true);

    try {
      await api.delete(`/api/expense/frc/${record.id}`);
      setSuccessMessage("Fare Rate Card deleted successfully.");
      await fetchFrcRecords({ revealTable: true });
    } catch (error) {
      setError(getErrorMessage(error, "Failed to delete Fare Rate Card."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const token = searchQuery.trim().toLowerCase();
    if (!token) {
      return records;
    }

    return records.filter((record) => {
      return (
        record.designationId.toLowerCase().includes(token) ||
        record.designationName.toLowerCase().includes(token) ||
        String(record.fromDistance).toLowerCase().includes(token) ||
        String(record.toDistance).toLowerCase().includes(token) ||
        String(record.allowanceType).toLowerCase().includes(token) ||
        String(record.applicableTo).toLowerCase().includes(token) ||
        String(record.fare).toLowerCase().includes(token) ||
        String(record.frcCode).toLowerCase().includes(token) ||
        String(record.description).toLowerCase().includes(token)
      );
    });
  }, [records, searchQuery]);

  return (
    <div className="ucr-wrap">
      <style>{STYLES}</style>

      {/* Alerts */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 16px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {successMessage && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "10px 16px", color: "#16a34a", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      {/* Main Creation Card */}
      <div className="ucr-card">
        <div className="ucr-header">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase size={17} style={{ color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Fare Rate Card Designation</h2>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginTop: 2 }}>
              Create multiple fare slabs and map them to one or more designations
            </p>
          </div>
        </div>

        <div className="ucr-body">
          <div className="ucr-grid" style={{ marginBottom: 32 }}>
            <div style={{ position: "relative", zIndex: 50 }}>
              <MultiSelectDropdown
                label="SELECT DESIGNATION *"
                options={designations.map((designation) => ({
                  value: designation.id,
                  label: designation.name,
                }))}
                selectedValues={selectedDesignationIds}
                onChange={setSelectedDesignationIds}
                disabled={isLoadingInitial}
              />
            </div>
            <div className="col-span-2" style={{ display: "flex", alignItems: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", margin: 0 }}>
                Selected: {selectedDesignationNames.length > 0 ? selectedDesignationNames.join(", ") : "None"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {rules.map((rule, index) => (
              <div
                key={rule.localId}
                style={{
                  background: "#f9fafb",
                  border: "1px solid #f3f4f6",
                  borderRadius: 12,
                  padding: "24px 20px 20px 20px",
                  position: "relative",
                }}
              >
                <div style={{
                  position: "absolute", top: -10, left: 16, background: "#fff", border: "1px solid #f3f4f6",
                  padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "#2563eb", textTransform: "uppercase"
                }}>
                  Fare Rate Designation #{index + 1}
                </div>

                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRule(rule.localId)}
                    style={{
                      position: "absolute", right: 12, top: 12, width: 30, height: 30, borderRadius: 8,
                      border: "1px solid #fecaca", background: "#fff", color: "#dc2626", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    title="Delete this card"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                <div className="ucr-grid-4" style={{ marginBottom: 0, marginTop: rules.length > 1 ? 8 : 0 }}>
                  <FloatingInput
                    label="FROM DISTANCE (KM) *"
                    type="number"
                    value={rule.fromDistance}
                    onChange={(event) => updateRule(rule.localId, "fromDistance", event.target.value)}
                  />

                  <FloatingInput
                    label="TO DISTANCE (KM) *"
                    type="number"
                    value={rule.toDistance}
                    onChange={(event) => updateRule(rule.localId, "toDistance", event.target.value)}
                  />

                  <FloatingDropdown
                    label="ALLOWANCE TO BE GET *"
                    options={ALLOWANCE_OPTIONS}
                    value={rule.allowanceType}
                    onSelect={(value) => updateRule(rule.localId, "allowanceType", value)}
                  />

                  <FloatingDropdown
                    label="SELECT APPLICABLE TO *"
                    options={APPLICABLE_OPTIONS}
                    value={rule.applicableTo}
                    onSelect={(value) => updateRule(rule.localId, "applicableTo", value)}
                  />

                  <FloatingInput
                    label="ENTER TA PER KM *"
                    type="number"
                    value={rule.fare}
                    onChange={(event) => updateRule(rule.localId, "fare", event.target.value)}
                  />

                  <FloatingInput
                    label="ENTER FRC CODE *"
                    value={rule.frcCode}
                    onChange={(event) => updateRule(rule.localId, "frcCode", event.target.value)}
                  />

                  <div className="col-span-2">
                    <FloatingTextarea
                      label="ENTER DESCRIPTION *"
                      value={rule.description}
                      onChange={(event) => updateRule(rule.localId, "description", event.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ucr-footer" style={{ justifyContent: "flex-start" }}>
          <button
            type="button"
            onClick={addRule}
            style={{
              width: 40, height: 40, borderRadius: "50%", background: "#fff", border: "1px solid #dbeafe",
              color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}
            title="Add one more Fare Rate Designation"
          >
            <Plus size={20} />
          </button>

          <button
            type="button"
            onClick={handleCreateFrc}
            disabled={isSubmitting || isLoadingInitial}
            style={{
              height: 40, padding: "0 24px", borderRadius: 8, background: "#2563eb", color: "#fff",
              fontSize: 13, fontWeight: 700, border: "none", cursor: (isSubmitting || isLoadingInitial) ? "not-allowed" : "pointer",
              opacity: (isSubmitting || isLoadingInitial) ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8
            }}
          >
            {isSubmitting ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Save size={16} />}
            Create FRC
          </button>
        </div>
      </div>

      {/* Table Section */}
      {showTable && (
        <div className="ucr-card">
          <div className="ucr-header" style={{ justifyContent: "space-between", background: "#f9fafb" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: 0 }}>Fare Rate Card Entries</h3>
            <div style={{ position: "relative", width: 280, maxWidth: "100%" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search designation, code..."
                style={{
                  width: "100%", height: 36, borderRadius: 8, border: "1px solid #d1d5db",
                  padding: "0 32px 0 12px", fontSize: 13, outline: "none", color: "#111827"
                }}
              />
              <Search size={14} style={{ position: "absolute", right: 10, top: 11, color: "#9ca3af" }} />
            </div>
          </div>

          <div className="ucr-body" style={{ padding: 0 }}>
            <div className="ucr-table-container" style={{ border: "none", borderRadius: "0 0 16px 16px" }}>
              <table className="ucr-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Designation</th>
                    <th>Name</th>
                    <th>From Distance</th>
                    <th>To Distance</th>
                    <th>Allowance To Be Get</th>
                    <th>Applicable To</th>
                    <th>Fare</th>
                    <th>Description</th>
                    <th>FRC Code</th>
                    <th style={{ textAlign: "center" }}>Edit / Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {isTableLoading ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: 40 }}>
                        <Loader2 style={{ animation: "ucr-spin 1s linear infinite", margin: "0 auto", color: "#2563eb" }} size={24} />
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
                        No fare rate card data found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, index) => (
                      <tr key={record.id}>
                        <td style={{ color: "#6b7280" }}>{index + 1}</td>
                        <td style={{ fontWeight: 600 }}>{record.designationId || "-"}</td>
                        <td style={{ fontWeight: 600 }}>{record.designationName || "-"}</td>
                        <td>{record.fromDistance}</td>
                        <td>{record.toDistance}</td>
                        <td>{record.allowanceType}</td>
                        <td style={{ color: "#2563eb", fontWeight: 700, textTransform: "uppercase" }}>{record.applicableTo}</td>
                        <td style={{ fontWeight: 700 }}>{record.fare}</td>
                        <td style={{ maxWidth: 200, whiteSpace: "normal", wordBreak: "break-word" }}>{record.description || "-"}</td>
                        <td style={{ fontWeight: 600 }}>{record.frcCode}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(record)}
                              style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 4 }}
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(record)}
                              style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: 4 }}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Mobile Responsive) */}
      {isEditModalOpen && editingRecord && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000, background: "rgba(17, 24, 39, 0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div className="ucr-card" style={{ 
            width: "100%", maxWidth: 800, margin: 0, overflow: "visible", 
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            <div className="ucr-header" style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", border: "1px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Edit2 size={17} style={{ color: "#2563eb" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0, textTransform: "uppercase" }}>Edit Fare Rate Card</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingRecord(null);
                }}
                style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 6 }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="ucr-body" style={{ overflowY: "auto", flex: 1 }}>
              <div className="ucr-grid-4" style={{ marginBottom: 0 }}>
                <div className="col-span-2">
                  <FloatingInput
                    label="DESIGNATION NAME"
                    value={editingRecord.designationName}
                    onChange={(event) =>
                      setEditingRecord((prev) => ({ ...prev, designationName: event.target.value }))
                    }
                    disabled
                  />
                </div>

                <FloatingInput
                  label="FROM DISTANCE (KM) *"
                  type="number"
                  value={editingRecord.fromDistance}
                  onChange={(event) =>
                    setEditingRecord((prev) => ({ ...prev, fromDistance: event.target.value }))
                  }
                />

                <FloatingInput
                  label="TO DISTANCE (KM) *"
                  type="number"
                  value={editingRecord.toDistance}
                  onChange={(event) =>
                    setEditingRecord((prev) => ({ ...prev, toDistance: event.target.value }))
                  }
                />

                <FloatingDropdown
                  label="ALLOWANCE TO BE GET *"
                  options={ALLOWANCE_OPTIONS}
                  value={editingRecord.allowanceType}
                  onSelect={(value) =>
                    setEditingRecord((prev) => ({ ...prev, allowanceType: value }))
                  }
                />

                <FloatingDropdown
                  label="SELECT APPLICABLE TO *"
                  options={APPLICABLE_OPTIONS}
                  value={editingRecord.applicableTo}
                  onSelect={(value) =>
                    setEditingRecord((prev) => ({ ...prev, applicableTo: value }))
                  }
                />

                <FloatingInput
                  label="ENTER TA PER KM *"
                  type="number"
                  value={editingRecord.fare}
                  onChange={(event) =>
                    setEditingRecord((prev) => ({ ...prev, fare: event.target.value }))
                  }
                />

                <FloatingInput
                  label="ENTER FRC CODE *"
                  value={editingRecord.frcCode}
                  onChange={(event) =>
                    setEditingRecord((prev) => ({ ...prev, frcCode: event.target.value }))
                  }
                />

                <div className="col-span-4">
                  <FloatingTextarea
                    label="ENTER DESCRIPTION *"
                    value={editingRecord.description}
                    onChange={(event) =>
                      setEditingRecord((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="ucr-footer" style={{ borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingRecord(null);
                }}
                style={{
                  height: 38, padding: "0 20px", borderRadius: 8, background: "#fff",
                  border: "1px solid #d1d5db", color: "#4b5563", fontWeight: 600, fontSize: 13, cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRecord}
                disabled={isSubmitting}
                style={{
                  height: 38, padding: "0 20px", borderRadius: 8, background: "#2563eb", color: "#fff",
                  fontSize: 13, fontWeight: 700, border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8
                }}
              >
                {isSubmitting ? <Loader2 size={16} style={{ animation: "ucr-spin 1s linear infinite" }} /> : <Save size={16} />}
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// UI Components Restyled to match Reference FSelect (Mobile Fixed)
// ═══════════════════════════════════════════════════════════════════

function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== "" && value !== null && value !== undefined;
  const active = hasValue || isFocused;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13,
          border: `1.5px solid ${active && !disabled ? "#2563eb" : "#d1d5db"}`, outline: "none",
          fontWeight: 600, color: disabled ? "#6b7280" : "#111827",
          background: disabled ? "#f3f4f6" : "#fff",
          transition: "border-color 0.2s"
        }}
      />
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"),
          background: disabled ? (active ? "#f3f4f6" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}
      >
        {label}
      </label>
    </div>
  );
}

function FloatingTextarea({ label, value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== "" && value !== null && value !== undefined;
  const active = hasValue || isFocused;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <textarea
        value={value ?? ""}
        onChange={onChange}
        rows={2}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%", minHeight: 60, borderRadius: 8, padding: "12px", fontSize: 13,
          border: `1.5px solid ${active ? "#2563eb" : "#d1d5db"}`, outline: "none",
          fontWeight: 600, color: "#111827", background: "#fff",
          transition: "border-color 0.2s", resize: "vertical", fontFamily: "inherit"
        }}
      />
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: active ? "#2563eb" : "#9ca3af", background: "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}
      >
        {label}
      </label>
    </div>
  );
}

function FloatingDropdown({ label, options, value, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const selectedOption = options.find((option) => String(option.value) === String(value));
  const active = isOpen || Boolean(value);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex",
          alignItems: "center", border: `1.5px solid ${active ? "#2563eb" : "#d1d5db"}`, cursor: "pointer",
          background: "#fff", transition: "border-color 0.2s"
        }}
      >
        <span style={{ flex: 1, fontWeight: 600, color: value ? "#111827" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {selectedOption?.label || " "}
        </span>
        <ChevronDown size={14} style={{ color: "#9ca3af", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s", flexShrink: 0 }} />
      </div>
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: active ? "#2563eb" : "#9ca3af", background: "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}
      >
        {label}
      </label>

      {isOpen && (
        <div
          style={{
            position: "absolute", top: "110%", left: 0, width: "100%", background: "#fff",
            border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onSelect(opt.value); setIsOpen(false); }}
              style={{
                padding: "10px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600,
                background: String(value) === String(opt.value) ? "#eff6ff" : "transparent",
                color: String(value) === String(opt.value) ? "#2563eb" : "#374151"
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({ label, options, selectedValues, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleValue = (value) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
      return;
    }
    onChange([...selectedValues, value]);
  };

  const selectAll = () => onChange(options.map((option) => option.value));
  const clearAll = () => onChange([]);

  const selectedLabel = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label)
    .join(", ");

  const hasValue = selectedValues.length > 0;
  const active = isOpen || hasValue;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: "100%", height: FH, borderRadius: 8, padding: "0 12px", fontSize: 13, display: "flex",
          alignItems: "center", border: `1.5px solid ${active && !disabled ? "#2563eb" : "#d1d5db"}`,
          cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#f3f4f6" : "#fff",
          transition: "border-color 0.2s"
        }}
      >
        <span style={{ flex: 1, fontWeight: 600, color: hasValue ? "#111827" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: 8 }}>
          {selectedLabel || " "}
        </span>
        <ChevronDown size={14} style={{ color: "#9ca3af", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s", flexShrink: 0 }} />
      </div>
      <label
        style={{
          position: "absolute", left: 10, top: active ? -9 : 12, fontSize: active ? 10 : 12,
          fontWeight: 600, color: disabled ? "#9ca3af" : (active ? "#2563eb" : "#9ca3af"), background: disabled ? (active ? "#f3f4f6" : "transparent") : "#fff",
          padding: "0 4px", transition: "0.2s", pointerEvents: "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "calc(100% - 20px)"
        }}
      >
        {label}
      </label>

      {isOpen && !disabled && (
        <div
          style={{
            position: "absolute", top: "110%", left: 0, width: "100%", background: "#fff",
            border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden"
          }}
        >
          {/* Strictly retaining exact Select All / Clear All design translated to inline css */}
          <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
            <button
              type="button"
              onClick={selectAll}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#2563eb", border: "none", cursor: "pointer" }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, color: "#fff", background: "#ef4444", border: "none", cursor: "pointer" }}
            >
              Clear All
            </button>
          </div>

          <div style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0" }}>
            {options.length === 0 ? (
              <p style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", margin: 0 }}>No designation available.</p>
            ) : (
              options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 13, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 10, background: isSelected ? "#eff6ff" : "transparent",
                      color: isSelected ? "#2563eb" : "#4b5563", border: "none", cursor: "pointer"
                    }}
                  >
                    <span
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        border: isSelected ? "2px solid #2563eb" : "2px solid #d1d5db", background: isSelected ? "#2563eb" : "#fff"
                      }}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 10 8" style={{ width: 10, height: 8 }} fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}