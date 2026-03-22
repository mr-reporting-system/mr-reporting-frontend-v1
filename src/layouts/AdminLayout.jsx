import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Menu, Search, Bell, X, ChevronDown, ChevronUp, LogOut, User, // <-- Added User here
  Bot, LayoutDashboard, LocateFixed, SlidersHorizontal, Database, 
  CheckSquare, IndianRupee, Package, Target
} from "lucide-react";
// import api from "../services/api"; 

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  // 📂 LEVEL 1: Main Dropdown States
  const [reportAnalysisOpen, setReportAnalysisOpen] = useState(false);
  const [masterCreationsOpen, setMasterCreationsOpen] = useState(false);
  const [approvalMasterOpen, setApprovalMasterOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);

  // 📂 LEVEL 2: Nested Dropdown States (Inside Report Analysis)
  const [dcrOpen, setDcrOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [productReportOpen, setProductReportOpen] = useState(false);
  const [targetAchievementOpen, setTargetAchievementOpen] = useState(false);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  // 📂 LEVEL 2: Nested Dropdown States (Inside Master Creations)
  const [crmMasterOpen, setCrmMasterOpen] = useState(false);

  // 👤 Dynamic user state
  const [adminProfile, setAdminProfile] = useState({ name: "Loading...", initial: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // ⚙️ Backend Contract: Subham's endpoint to get the logged-in user profile
        // const response = await api.get('/api/users/profile');
        // if (response.data.success) {
        //   const { name } = response.data.data;
        //   setAdminProfile({ name: name, initial: name.charAt(0).toUpperCase() });
        // }
        setAdminProfile({ name: "Admin", initial: "A" });
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-[#F3F4F6]">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* 🧭 Sidebar */}
      <aside className={`fixed lg:static z-50 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 ${collapsed ? "lg:w-20" : "lg:w-72"} bg-[#242938] h-full lg:h-screen p-5 border-r border-[#374151] transition-all duration-300 flex flex-col`}>
        
        {/* Brand Logo */}
        <div className={`flex items-center mb-8 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <h2 className="text-[20px] font-semibold text-[#ffffff]">MR REPORTING</h2>
          )}
          
          <button className="hidden lg:block" onClick={() => setCollapsed(!collapsed)}>
            <Menu size={18} className="text-gray-400 hover:text-white" />
          </button>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 text-sm overflow-y-auto pr-2 scrollbar-thin scrollbar-track-[#242938] scrollbar-thumb-[#374151] hover:scrollbar-thumb-[#4B5563]">
          
          <SidebarLink to="/admin/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" collapsed={collapsed} />
          <SidebarLink to="/admin/live-tracking" icon={<LocateFixed size={18} />} label="Live Tracking" collapsed={collapsed} badge="new" />

          {/* ================= REPORTS OUTCOME ================= */}
          {!collapsed && <div className="px-4 mt-8 mb-2 pt-4 text-xs font-bold text-[#2DD4BF] tracking-wider">REPORTS OUTCOME</div>}
          
          <DropdownMenu icon={<SlidersHorizontal size={18} />} label="Report Analysis" collapsed={collapsed} isOpen={reportAnalysisOpen} toggle={() => setReportAnalysisOpen(!reportAnalysisOpen)}>
            
            {/* 1. Daily Call Report (Nested) */}
            <NestedDropdown label="Daily Call Report" isOpen={dcrOpen} toggle={() => setDcrOpen(!dcrOpen)}>
              <SubLink to="/admin/reports/dcr-consolidate" label="DCR Consolidate" />
              <SubLink to="/admin/reports/dump-dcr" label="Dump DCR Report" />
              <SubLink to="/admin/reports/monthly-summary" label="Monthly Summary Report" />
              <SubLink to="/admin/reports/doctor-call-yearly" label="Doctor Call Yearly Progression" />
              <SubLink to="/admin/reports/daily-basic-dcr" label="Daily Basic DCR Report" />
              <SubLink to="/admin/reports/dcr-status" label="DCR Status Report" />
              <SubLink to="/admin/reports/employee-analysis" label="Employee Analysis" />
              <SubLink to="/admin/reports/dcr-doctor-wise" label="DCR Report Doctor Wise" />
              <SubLink to="/admin/reports/dcr-fy-wise" label="DCR Report Financial Year Wise" />
            </NestedDropdown>

            {/* 2. Provider Reports (Nested) */}
            <NestedDropdown label="Provider Reports" isOpen={providerOpen} toggle={() => setProviderOpen(!providerOpen)}>
              <SubLink to="/admin/reports/view-provider" label="View Provider" />
              <SubLink to="/admin/reports/doctor-visit" label="Doctor Visit" />
              <SubLink to="/admin/reports/chemist-visit" label="Chemist/Stockist Visit Report" />
              <SubLink to="/admin/reports/missed-provider" label="Missed Provider" />
              <SubLink to="/admin/reports/provider-analysis" label="Provider Visit Analysis" />
              <SubLink to="/admin/reports/consolidated-pob" label="Consolidated POB Report" />
              <SubLink to="/admin/reports/pob-manager-wise" label="POB Report Manager Wise" />
              <SubLink to="/admin/reports/pob-employee-wise" label="Employee Wise POB Report" />
              <SubLink to="/admin/reports/pob-product-wise" label="ProductWise POB Report" />
              <SubLink to="/admin/reports/update-provider-status" label="Update Provider Status" />
              <SubLink to="/admin/reports/speciality-doctor-report" label="Speciality Wise Doctor Report" />
              <SubLink to="/admin/reports/speciality-doctor-visit" label="Speciality Wise Doctor Visit" />
            </NestedDropdown>

            {/* 3. Attendance Reports (Nested) */}
            <NestedDropdown label="Attendance Reports" isOpen={attendanceOpen} toggle={() => setAttendanceOpen(!attendanceOpen)}>
              <SubLink to="/admin/reports/holiday" label="Holiday Report" />
              <SubLink to="/admin/reports/view-attendance" label="View Attendance" />
              <SubLink to="/admin/reports/view-dcr-attendance" label="View DCR Attendance" />
              <SubLink to="/admin/reports/view-day-plan" label="View Day Plan Attendance" />
              <SubLink to="/admin/reports/employee-duration" label="Employee Working Duration" />
            </NestedDropdown>

            {/* 4. Leave Reports (Nested) */}
            <NestedDropdown label="Leave Reports" isOpen={leaveOpen} toggle={() => setLeaveOpen(!leaveOpen)}>
              <SubLink to="/admin/reports/leave-assign" label="Leave Assign" />
              <SubLink to="/admin/reports/leave-overview" label="Leave Overview" />
              <SubLink to="/admin/reports/date-wise-leave" label="Date Wise Leave Status" />
            </NestedDropdown>

            {/* 5. CRM Reports (Direct Link) */}
            <SubLink to="/admin/reports/crm" label="CRM Reports" />

            {/* 6. Product Reports (Nested) */}
            <NestedDropdown label="Product Reports" isOpen={productReportOpen} toggle={() => setProductReportOpen(!productReportOpen)}>
              <SubLink to="/admin/reports/product-view" label="Product View" />
              <SubLink to="/admin/reports/add-focus-product" label="Add Focus Product" />
            </NestedDropdown>

            {/* 7. Sales Reports (Direct Link) */}
            <SubLink to="/admin/reports/sales" label="Sales Reports" />

            {/* 8. Target vs Achievements (Nested) */}
            <NestedDropdown label="Target vs Achievements" isOpen={targetAchievementOpen} toggle={() => setTargetAchievementOpen(!targetAchievementOpen)}>
              <SubLink to="/admin/reports/stp-status" label="STP Status Reports" />
              <SubLink to="/admin/reports/stp-details" label="STP Details" />
              <SubLink to="/admin/reports/view-expense" label="View Expense" />
              <SubLink to="/admin/reports/employee-salary" label="Employee Salary Slip" />
            </NestedDropdown>

            {/* 9. User Details (Nested) */}
            <NestedDropdown label="User Details" isOpen={userDetailsOpen} toggle={() => setUserDetailsOpen(!userDetailsOpen)}>
              <SubLink to="/admin/reports/user-information" label="User Information" />
              <SubLink to="/admin/reports/resign-reports" label="Resign Reports" />
              <SubLink to="/admin/reports/user-master-data" label="Master Data" />
            </NestedDropdown>

          </DropdownMenu>

          {/* ================= MASTERS ================= */}
          {!collapsed && <div className="px-4 mt-8 mb-2 pt-4 text-xs font-bold text-[#2DD4BF] tracking-wider">MASTERS</div>}
          
          {/* Master Creations */}
          <DropdownMenu icon={<Database size={18} />} label="Master Creations" collapsed={collapsed} isOpen={masterCreationsOpen} toggle={() => setMasterCreationsOpen(!masterCreationsOpen)}>
            <SubLink to="/admin/masters/designation" label="1. Designation Creation" />
            <SubLink to="/admin/masters/users" label="2. User Creation" />
            <SubLink to="/admin/masters/areas" label="3. Area Creation" />
            <SubLink to="/admin/masters/doctors" label="4. Doctor/Chemist Creation" />
            <SubLink to="/admin/masters/headquarter-mapping" label="5. Headquarter Mapping" />
            <SubLink to="/admin/masters/change-headquarter" label="6. Change Headquarter" />
            <SubLink to="/admin/masters/transfer" label="7. Master Data Transfer" />
            <SubLink to="/admin/masters/hierarchy-management" label="8. Hierarchy Management" />
            
            <SubLink to="/admin/masters/stp" label="9. STP Creation" />
            <SubLink to="/admin/masters/product-creation" label="10. Product Creation" />
            <SubLink to="/admin/masters/broadcast" label="11. Broadcast Message" />
           
              <SubLink to="/admin/masters/crm-mapping" label="12. Submit CRM Data" />
            
          </DropdownMenu>

          {/* Approval Master */}
          <DropdownMenu icon={<CheckSquare size={18} />} label="Approval Master" collapsed={collapsed} isOpen={approvalMasterOpen} toggle={() => setApprovalMasterOpen(!approvalMasterOpen)}>
            <SubLink to="/admin/approvals/master-data" label="1. Master Data" />
            <SubLink to="/admin/approvals/tour-program" label="2. Approve Tour Program" />
            <SubLink to="/admin/approvals/stp" label="3. STP Approve" />
          </DropdownMenu>

          {/* Expense */}
          <DropdownMenu icon={<IndianRupee size={18} />} label="Expense" collapsed={collapsed} isOpen={expenseOpen} toggle={() => setExpenseOpen(!expenseOpen)}>
            <SubLink to="/admin/expense/fare-rate" label="1. Fare Rate Card" />
            <SubLink to="/admin/expense/statewise-da" label="2. StateWise DA" />
          </DropdownMenu>

          {/* Stock & Statement */}
          <DropdownMenu icon={<Package size={18} />} label="Stock & Statement" collapsed={collapsed} isOpen={stockOpen} toggle={() => setStockOpen(!stockOpen)}>
            <SubLink to="/admin/stock/submit-modify" label="1. Submit & Modify" />
            <SubLink to="/admin/stock/view" label="2. View" />
            <SubLink to="/admin/stock/mapping" label="3. Stockiest Mapping" />
            <SubLink to="/admin/stock/mapping-report" label="4. Stockiest Mapping Report" />
          </DropdownMenu>

          {/* Target */}
          <DropdownMenu icon={<Target size={18} />} label="Target" collapsed={collapsed} isOpen={targetOpen} toggle={() => setTargetOpen(!targetOpen)}>
            <SubLink to="/admin/target/submission" label="1. Submission" />
            <SubLink to="/admin/target/modify" label="2. Modify" />
            <SubLink to="/admin/target/view" label="3. View" />
          </DropdownMenu>

        </nav>
      </aside>

      {/* 🪟 Main Content Area */}
      <div className="flex-1 flex flex-col w-full h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-white h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm border-b border-[#E5E7EB] shrink-0">
          
          {/* Left Side: Mobile Menu Button (Search Bar Removed) */}
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} className="text-gray-700" />
            </button>
          </div>

          {/* Right Side: Notifications & Profile Dropdown */}
          <div className="flex items-center gap-4 relative">
            <Bell className="text-gray-600 cursor-pointer hover:text-[#2563EB]" />
            
            <div onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 cursor-pointer relative">
              <div className="w-8 h-8 bg-[#2563EB] text-white rounded-full flex items-center justify-center text-sm">
                {adminProfile.initial}
              </div>
              
              
              {/* Enhanced Profile Dropdown */}
              {profileOpen && (
                <div className="absolute top-10 right-0 w-48 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-2 z-50">
                  
                  {/* Dropdown Header with Name */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-bold text-[#1F2937]">{adminProfile.name}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  
                  {/* My Profile Link */}
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/admin/profile"); 
                    }} 
                    className="w-full flex items-center gap-2 px-4 py-2 mt-1 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] transition-colors"
                  >
                    <User size={16} />
                    My Profile
                  </button>

                  {/* Logout Button */}
                  <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>
        {/* Dynamic Page Content Injected Here */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F3F4F6]">
          <Outlet />
        </div>

      </div>
    </div>
  );
}

// 🧱 Reusable Navigation Components
function SidebarLink({ to, icon, label, collapsed, badge }) {
  return (
    <NavLink to={to} className={({ isActive }) => `flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${isActive ? "bg-[#374151] text-white" : "text-[#ffffff] hover:bg-[#374151] hover:text-white"}`}>
      <div className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-3"}`}>
        <div className="flex items-center justify-center w-5">{icon}</div>
        {!collapsed && <span>{label}</span>}
      </div>
      {!collapsed && badge && (
        <span className="bg-[#FF4B72] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

function DropdownMenu({ icon, label, collapsed, isOpen, toggle, children }) {
  return (
    <div className="mb-1">
      <div onClick={toggle} className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 text-[#fbfbfb] hover:bg-[#374151] hover:text-white">
        <div className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-3"}`}>
          <div className="flex items-center justify-center w-5">{icon}</div>
          {!collapsed && <span>{label}</span>}
        </div>
        {!collapsed && (isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} className="rotate-90" />)}
      </div>
      {isOpen && !collapsed && <div className="ml-9 mt-1 space-y-1">{children}</div>}
    </div>
  );
}

// 🚀 NEW: Component for 3rd-level nested menus
function NestedDropdown({ label, isOpen, toggle, children }) {
  return (
    <div className="mb-1">
      <div onClick={toggle} className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors text-xs text-[#ffffff] hover:bg-[#374151] hover:text-white">
        <span>{label}</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} className="rotate-90" />}
      </div>
      {isOpen && (
        <div className="ml-3 mt-1 space-y-1 border-l border-[#4B5563] pl-2">
          {children}
        </div>
      )}
    </div>
  );
}

function SubLink({ to, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `block px-3 py-2 rounded-md cursor-pointer text-[13px] transition-colors ${isActive ? "text-white bg-[#374151]" : "text-[#ffffff] hover:text-white hover:bg-[#374151]"}`}>
      {label}
    </NavLink>
  );
}