import { Suspense, createElement, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Services = lazy(() => import("../pages/Services"));
const About = lazy(() => import("../pages/About"));
const Contact = lazy(() => import("../pages/Contact"));

const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));

const DesignationCreation = lazy(() => import("../pages/admin/masters/DesignationCreation"));
const UserDirectory = lazy(() => import("../pages/admin/masters/UserDirectory"));
const UserCreation = lazy(() => import("../pages/admin/masters/UserCreation"));
const AreaCreation = lazy(() => import("../pages/admin/masters/AreaCreation"));
const DoctorChemistCreation = lazy(() => import("../pages/admin/masters/DoctorChemistCreation"));
const HeadquarterMapping = lazy(() => import("../pages/admin/masters/HeadquarterMapping"));
const ChangeHeadquarter = lazy(() => import("../pages/admin/masters/ChangeHeadquarter"));
const MasterDataTransfer = lazy(() => import("../pages/admin/masters/MasterDataTransfer"));
const HierarchyManagement = lazy(() => import("../pages/admin/masters/HierarchyManagement"));
const STPCreation = lazy(() => import("../pages/admin/masters/STPCreation"));
const ProductCreation = lazy(() => import("../pages/admin/masters/ProductCreation"));
const CRMDoctorMapping = lazy(() => import("../pages/admin/masters/CRMDoctorMapping"));

const MasterData = lazy(() => import("../pages/admin/approvals/MasterData"));
const ApproveTourProgram = lazy(() => import("../pages/admin/approvals/ApproveTourProgram"));
const STPApprove = lazy(() => import("../pages/admin/approvals/STPApprove"));

const FareRateCard = lazy(() => import("../pages/admin/expenses/FareRateCard"));
const StateWiseDA = lazy(() => import("../pages/admin/expenses/StateWiseDA"));

const SSSSubmitModify = lazy(() => import("../pages/admin/stock-statement/SSSSubmitModify"));
const SSSView = lazy(() => import("../pages/admin/stock-statement/SSSView"));
const UserStockistMapping = lazy(() => import("../pages/admin/stock-statement/UserStockistMapping"));
const StockistMappingDeletionReport = lazy(() => import("../pages/admin/stock-statement/StockistMappingDeletionReport"));

const TargetSubmission = lazy(() => import("../pages/admin/targets/TargetSubmission"));
const TargetModify = lazy(() => import("../pages/admin/targets/TargetModify"));
const TargetView = lazy(() => import("../pages/admin/targets/TargetView"));


function RouteLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-slate-500">
      Loading module...
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={withSuspense(Home)} />
      <Route path="/login" element={withSuspense(Login)} />
      <Route path="/services" element={withSuspense(Services)} />
      <Route path="/about" element={withSuspense(About)} />
      <Route path="/contact" element={withSuspense(Contact)} />

      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={withSuspense(AdminLayout)}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={withSuspense(AdminDashboard)} />

          <Route path="masters/designation" element={withSuspense(DesignationCreation)} />
          <Route path="masters/users" element={<Navigate to="directory" replace />} />
          <Route path="masters/users/directory" element={withSuspense(UserDirectory)} />
          <Route path="masters/users/create" element={withSuspense(UserCreation)} />
          <Route path="masters/areas" element={withSuspense(AreaCreation)} />
          <Route path="masters/doctors" element={withSuspense(DoctorChemistCreation)} />
          <Route
            path="masters/headquarter-mapping"
            element={withSuspense(HeadquarterMapping)}
          />
          <Route
            path="masters/change-headquarter"
            element={withSuspense(ChangeHeadquarter)}
          />
          <Route path="masters/transfer" element={withSuspense(MasterDataTransfer)} />
          <Route
            path="masters/hierarchy-management"
            element={withSuspense(HierarchyManagement)}
          />
          <Route path="masters/stp" element={withSuspense(STPCreation)} />
          <Route path="masters/product-creation" element={withSuspense(ProductCreation)} />
          <Route path="masters/crm-mapping" element={withSuspense(CRMDoctorMapping)} />

          <Route path="approvals/master-data" element={withSuspense(MasterData)} />
          <Route path="approvals/tour-program" element={withSuspense(ApproveTourProgram)} />
          <Route path="approvals/stp" element={withSuspense(STPApprove)} />

          <Route path="expenses/fare-rate-card" element={withSuspense(FareRateCard)} />
          <Route path="expense/statewise-da" element={<StateWiseDA />} />

          <Route path="stock/submit-modify" element={withSuspense(SSSSubmitModify)} />
          <Route path="stock/view" element={withSuspense(SSSView)} />
          <Route path="stock/user-stockist-mapping" element={withSuspense(UserStockistMapping)} />
          <Route path="stock/mapping-deletion-report" element={withSuspense(StockistMappingDeletionReport)} />

          {/* Target Routes */}
          <Route path="target/submission" element={withSuspense(TargetSubmission)} />
          <Route path="target/modify" element={withSuspense(TargetModify)} />
          <Route path="target/view" element={withSuspense(TargetView)} />

          
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
