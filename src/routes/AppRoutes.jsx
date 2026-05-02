import { Suspense, createElement, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// ─── Public Pages ────────────────────────────────────────────────────────────
const Home     = lazy(() => import("../pages/Home"));
const Login    = lazy(() => import("../pages/Login"));
const Services = lazy(() => import("../pages/Services"));
const About    = lazy(() => import("../pages/About"));
const Contact  = lazy(() => import("../pages/Contact"));

// ─── Admin Layout + Pages ────────────────────────────────────────────────────
const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminProfile   = lazy(() => import("../pages/admin/profile/AdminProfile"));

const DesignationCreation  = lazy(() => import("../pages/admin/masters/DesignationCreation"));
const UserDirectory        = lazy(() => import("../pages/admin/masters/UserDirectory"));
const UserCreation         = lazy(() => import("../pages/admin/masters/UserCreation"));
const AreaCreation         = lazy(() => import("../pages/admin/masters/AreaCreation"));
const DoctorChemistCreation = lazy(() => import("../pages/admin/masters/DoctorChemistCreation"));
const HeadquarterMapping   = lazy(() => import("../pages/admin/masters/HeadquarterMapping"));
const ChangeHeadquarter    = lazy(() => import("../pages/admin/masters/ChangeHeadquarter"));
const MasterDataTransfer   = lazy(() => import("../pages/admin/masters/MasterDataTransfer"));
const HierarchyManagement  = lazy(() => import("../pages/admin/masters/HierarchyManagement"));
const STPCreation          = lazy(() => import("../pages/admin/masters/STPCreation"));
const ProductCreation      = lazy(() => import("../pages/admin/masters/ProductCreation"));
const CRMDoctorMapping     = lazy(() => import("../pages/admin/masters/CRMDoctorMapping"));

const MasterData         = lazy(() => import("../pages/admin/approvals/MasterData"));
const ApproveTourProgram = lazy(() => import("../pages/admin/approvals/ApproveTourProgram"));
const STPApprove         = lazy(() => import("../pages/admin/approvals/STPApprove"));

const FareRateCard = lazy(() => import("../pages/admin/expenses/FareRateCard"));
const StateWiseDA  = lazy(() => import("../pages/admin/expenses/StateWiseDA"));

const SSSSubmitModify              = lazy(() => import("../pages/admin/stock-statement/SSSSubmitModify"));
const SSSView                      = lazy(() => import("../pages/admin/stock-statement/SSSView"));
const UserStockistMapping          = lazy(() => import("../pages/admin/stock-statement/UserStockistMapping"));
const StockistMappingDeletionReport = lazy(() => import("../pages/admin/stock-statement/StockistMappingDeletionReport"));

const TargetSubmission = lazy(() => import("../pages/admin/targets/TargetSubmission"));
const TargetModify     = lazy(() => import("../pages/admin/targets/TargetModify"));
const TargetView       = lazy(() => import("../pages/admin/targets/TargetView"));

const DCRConsolidate              = lazy(() => import("../pages/admin/reports/daily-call-reports/DCRConsolidate"));
const DumpDCRReport               = lazy(() => import("../pages/admin/reports/daily-call-reports/DumpDCRReport"));

const ViewProvider                = lazy(() => import("../pages/admin/reports/providers-reports/ViewProvider"));
const DoctorVisit                 = lazy(() => import("../pages/admin/reports/providers-reports/DoctorVisit"));
const ChemistStockistVisitReport  = lazy(() => import("../pages/admin/reports/providers-reports/ChemistStockistVisitReport"));
const MissedProvider              = lazy(() => import("../pages/admin/reports/providers-reports/MissedProvider"));
const ProviderVisitAnalysis       = lazy(() => import("../pages/admin/reports/providers-reports/ProviderVisitAnalysis"));
const POBReport                   = lazy(() => import("../pages/admin/reports/providers-reports/POBReport"));
const POBManagerWise = lazy(() => import("../pages/admin/reports/providers-reports/POBManagerWise"));
const POBEmployeeWise = lazy(() => import("../pages/admin/reports/providers-reports/POBEmployeeWise"));
const POBProductWise = lazy(() => import("../pages/admin/reports/providers-reports/POBProductWise"));
const UpdateProviderStatus = lazy(() => import("../pages/admin/reports/providers-reports/UpdateProviderStatus"));
const SpecialityDoctorReport = lazy(() => import("../pages/admin/reports/providers-reports/SpecialityDoctorReport"));

// ─── MR Layout + Pages ──────────────────────────────────────────────────────
const MRLayout   = lazy(() => import("../layouts/MRLayout"));
const MRDashboard = lazy(() => import("../pages/mr/MRDashboard"));

// // MR Reports
// const MRDcrConsolidate       = lazy(() => import("../pages/mr/reports/DcrConsolidateMR"));
// const MRViewDoctorChemist    = lazy(() => import("../pages/mr/reports/ViewDoctorChemist"));
// const MRDoctorVisit          = lazy(() => import("../pages/mr/reports/DoctorVisit"));
// const MRChemistStockistVisit = lazy(() => import("../pages/mr/reports/ChemistStockistVisit"));
// const MRMissedDoctorChemist  = lazy(() => import("../pages/mr/reports/MissedDoctorChemist"));
// const MRTourProgram          = lazy(() => import("../pages/mr/reports/TourProgram"));
// const MRViewExpenses         = lazy(() => import("../pages/mr/reports/ViewExpenses"));

// // MR Masters
const SubmitDCR = lazy(() => import("../pages/mr/masters/SubmitDCR")); // <-- KEEP THIS LINE
const MRDoctorChemistCreation = lazy(() => import("../pages/mr/masters/MRDoctorChemistCreation"));
const MRAreaCreation = lazy(() => import("../pages/mr/masters/MRAreaCreation"));
const MRSubmitTourProgram = lazy(() => import("../pages/mr/masters/MRSubmitTourProgram"));

// // MR Expense
const MRSTPCreation = lazy(() => import("../pages/mr/expenses/MRSTPCreation"));

// // MR Resources
// const MRHrPolicy = lazy(() => import("../pages/mr/HrPolicy"));
// const MRNote     = lazy(() => import("../pages/mr/Note"));

// ─── Loader ──────────────────────────────────────────────────────────────────
function RouteLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-500">
      Loading Module...
    </div>
  );
}

function withSuspense(Component) {
  return (
    <Suspense fallback={<RouteLoader />}>
      {createElement(Component)}
    </Suspense>
  );
}

// ─── Routes ──────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>

      {/* ── Public ── */}
      <Route path="/"         element={withSuspense(Home)} />
      <Route path="/login"    element={withSuspense(Login)} />
      <Route path="/services" element={withSuspense(Services)} />
      <Route path="/about"    element={withSuspense(About)} />
      <Route path="/contact"  element={withSuspense(Contact)} />

      {/* ════════════════════════════════════════
          ADMIN  (role must be "ADMIN")
      ════════════════════════════════════════ */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={withSuspense(AdminLayout)}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={withSuspense(AdminDashboard)} />
          <Route path="profile"   element={withSuspense(AdminProfile)} />

          {/* Masters */}
          <Route path="masters/designation"         element={withSuspense(DesignationCreation)} />
          <Route path="masters/users"               element={<Navigate to="directory" replace />} />
          <Route path="masters/users/directory"     element={withSuspense(UserDirectory)} />
          <Route path="masters/users/create"        element={withSuspense(UserCreation)} />
          <Route path="masters/areas"               element={withSuspense(AreaCreation)} />
          <Route path="masters/doctors"             element={withSuspense(DoctorChemistCreation)} />
          <Route path="masters/headquarter-mapping" element={withSuspense(HeadquarterMapping)} />
          <Route path="masters/change-headquarter"  element={withSuspense(ChangeHeadquarter)} />
          <Route path="masters/transfer"            element={withSuspense(MasterDataTransfer)} />
          <Route path="masters/hierarchy-management" element={withSuspense(HierarchyManagement)} />
          <Route path="masters/stp"                 element={withSuspense(STPCreation)} />
          <Route path="masters/product-creation"    element={withSuspense(ProductCreation)} />
          <Route path="masters/crm-mapping"         element={withSuspense(CRMDoctorMapping)} />

          {/* Approvals */}
          <Route path="approvals/master-data"  element={withSuspense(MasterData)} />
          <Route path="approvals/tour-program" element={withSuspense(ApproveTourProgram)} />
          <Route path="approvals/stp"          element={withSuspense(STPApprove)} />

          {/* Expenses */}
          <Route path="expenses/fare-rate-card" element={withSuspense(FareRateCard)} />
          <Route path="expense/statewise-da"    element={<StateWiseDA />} />

          {/* Stock */}
          <Route path="stock/submit-modify"           element={withSuspense(SSSSubmitModify)} />
          <Route path="stock/view"                    element={withSuspense(SSSView)} />
          <Route path="stock/user-stockist-mapping"   element={withSuspense(UserStockistMapping)} />
          <Route path="stock/mapping-deletion-report" element={withSuspense(StockistMappingDeletionReport)} />

          {/* Targets */}
          <Route path="target/submission" element={withSuspense(TargetSubmission)} />
          <Route path="target/modify"     element={withSuspense(TargetModify)} />
          <Route path="target/view"       element={withSuspense(TargetView)} />

          {/* Reports */}
          <Route path="reports/dcr-consolidate" element={withSuspense(DCRConsolidate)} />
          <Route path="reports/dump-dcr"        element={withSuspense(DumpDCRReport)} />

          <Route path="reports/view-provider"      element={withSuspense(ViewProvider)} />
          <Route path="reports/doctor-visit"       element={withSuspense(DoctorVisit)} />
          <Route path="reports/chemist-visit"      element={withSuspense(ChemistStockistVisitReport)} />
          <Route path="reports/missed-provider"    element={withSuspense(MissedProvider)} />
          <Route path="reports/provider-analysis"  element={withSuspense(ProviderVisitAnalysis)} />
          <Route path="reports/consolidated-pob"   element={withSuspense(POBReport)} />
          <Route path="reports/pob-manager-wise" element={withSuspense(POBManagerWise)} />
          <Route path="reports/pob-employee-wise" element={withSuspense(POBEmployeeWise)} />
          <Route path="reports/pob-product-wise" element={withSuspense(POBProductWise)} />
          <Route path="reports/update-provider-status" element={withSuspense(UpdateProviderStatus)} />
          <Route path="reports/speciality-doctor-report" element={withSuspense(SpecialityDoctorReport)} />
        </Route>
      </Route>

      {/* ════════════════════════════════════════
          MR  (role must be "MR")
      ════════════════════════════════════════ */}
      <Route element={<ProtectedRoute allowedRoles={["MR"]} />}>
        <Route path="/mr" element={withSuspense(MRLayout)}>
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={withSuspense(MRDashboard)} />

          <Route path="master/submit-dcr" element={withSuspense(SubmitDCR)} />
          <Route path="master/provider-creation" element={withSuspense(MRDoctorChemistCreation)} />
          <Route path="master/area-creation" element={withSuspense(MRAreaCreation)} />
          <Route path="master/submit-tour-program" element={withSuspense(MRSubmitTourProgram)} />

          <Route path="expense/create-sfc" element={withSuspense(MRSTPCreation)} />

        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;