import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from '../components/ProtectedRoute';

// Public Pages
import Home from "../pages/Home";
import Login from "../pages/Login";
import Services from "../pages/Services";
import About from "../pages/About";
import Contact from "../pages/Contact";

// Admin Layout & Pages
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard"; 
import DesignationCreation from "../pages/admin/masters/DesignationCreation";
import UserCreation from '../pages/admin/masters/UserCreation';
import AreaCreation from "../pages/admin/masters/AreaCreation";
import DoctorChemistCreation from "../pages/admin/masters/DoctorChemistCreation";
import HeadquarterMapping from "../pages/admin/masters/HeadquarterMapping";
import ChangeHeadquarter from "../pages/admin/masters/ChangeHeadquarter";
import MasterDataTransfer from "../pages/admin/masters/MasterDataTransfer";
import HierarchyManagement from '../pages/admin/masters/HierarchyManagement';
import STPCreation from '../pages/admin/masters/STPCreation';
import ProductCreation from "../pages/admin/masters/ProductCreation";
import CRMDoctorMapping from "../pages/admin/masters/CRMDoctorMapping";

import MasterData from "../pages/admin/approvals/MasterData";
import ApproveTourProgram from "../pages/admin/approvals/ApproveTourProgram";
import STPApprove from "../pages/admin/approvals/STPApprove";


function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/services" element={<Services />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Private Routes */}
      <Route element={<ProtectedRoute />}>
        {/* 🛣️ Admin Section (Protected/Layout Routes) */}
        <Route path="/admin" element={<AdminLayout />}>

          {/* 🧭 Default route redirects /admin to /admin/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* The Dashboard loads inside the Layout's <Outlet /> */}
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="masters/designation" element={<DesignationCreation />} />
          <Route path="masters/users" element={<UserCreation />} />
          <Route path="masters/areas" element={<AreaCreation />} />
          <Route path="masters/doctors" element={<DoctorChemistCreation />} />
          <Route path="masters/headquarter-mapping" element={<HeadquarterMapping />} />
          <Route path="masters/change-headquarter" element={<ChangeHeadquarter />} />
          <Route path="masters/transfer" element={<MasterDataTransfer />} />  {/* ✅ NEW */}
          <Route path="masters/hierarchy-management" element={<HierarchyManagement />} />
          <Route path="masters/stp" element={<STPCreation />} />
          <Route path="masters/product-creation" element={<ProductCreation />} />
          <Route path="masters/crm-mapping" element={<CRMDoctorMapping />} />

          <Route path="approvals/master-data" element={<MasterData />} />
          <Route path="approvals/tour-program" element={<ApproveTourProgram />} />
          <Route path="approvals/stp" element={<STPApprove />} />

          {/* Placeholders for the rest of your blueprint */}
          <Route path="master-data" element={<div className="p-4">Master Data Coming Soon</div>} />
          <Route path="reports" element={<div className="p-4">Reports & Analytics Coming Soon</div>} />
          <Route path="settings" element={<div className="p-4">Settings & Profile Coming Soon</div>} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;