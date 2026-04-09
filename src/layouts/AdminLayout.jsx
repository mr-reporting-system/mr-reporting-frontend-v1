import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Menu, Bell, X, ChevronDown, LogOut, User,
  LayoutDashboard, LocateFixed, SlidersHorizontal, Database,
  CheckSquare, IndianRupee, Package, Target
} from "lucide-react";
// import api from "../services/api";

/* ─── Google Fonts + sidebar utilities ───────────────────────────────────── */
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');

    .mr-layout { font-family: 'Inter', sans-serif; }
    .mr-layout .brand-font { font-family: 'Manrope', sans-serif; }

    .sidebar-scroll::-webkit-scrollbar { width: 4px; }
    .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
    .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
    .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }

    .nav-active-glow {
      background: linear-gradient(90deg, rgba(37,99,235,0.22) 0%, rgba(37,99,235,0.07) 100%);
      border-left: 3px solid #3B82F6;
    }
  `}</style>
);

export default function AdminLayout() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [collapsed,    setCollapsed]    = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);

  // Level 1 dropdowns
  const [reportAnalysisOpen,  setReportAnalysisOpen]  = useState(false);
  const [masterCreationsOpen, setMasterCreationsOpen] = useState(false);
  const [approvalMasterOpen,  setApprovalMasterOpen]  = useState(false);
  const [expenseOpen,         setExpenseOpen]         = useState(false);
  const [stockOpen,           setStockOpen]           = useState(false);
  const [targetOpen,          setTargetOpen]          = useState(false);

  // Level 2 — Report Analysis
  const [dcrOpen,               setDcrOpen]               = useState(false);
  const [providerOpen,          setProviderOpen]          = useState(false);
  const [attendanceOpen,        setAttendanceOpen]        = useState(false);
  const [leaveOpen,             setLeaveOpen]             = useState(false);
  const [productReportOpen,     setProductReportOpen]     = useState(false);
  const [targetAchievementOpen, setTargetAchievementOpen] = useState(false);
  const [userDetailsOpen,       setUserDetailsOpen]       = useState(false);

  // Level 2 — Master Creations
  const [crmMasterOpen, setCrmMasterOpen] = useState(false);

  const [adminProfile, setAdminProfile] = useState({ name: "Loading...", initial: "" });
  const navigate     = useNavigate();
  const profileRef   = useRef(null); // ✅ for click-outside detection

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // const response = await api.get('/api/users/profile');
        // if (response.data.success) {
        //   const { name } = response.data.data;
        //   setAdminProfile({ name, initial: name.charAt(0).toUpperCase() });
        // }
        setAdminProfile({ name: "Admin", initial: "A" });
      } catch (err) { console.error(err); }
    };
    fetchProfile();
  }, []);

  // ✅ Close profile dropdown when clicking anywhere outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");

  // Optional cleanup of old keys
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("userRole");
  sessionStorage.removeItem("mr_token");
  sessionStorage.removeItem("mr_user");

  navigate("/login", { replace: true });
};

  return (
    <>
      <FontStyle />
      <div className="mr-layout min-h-screen flex bg-[#F3F4F6]">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════
            SIDEBAR  bg-[#242938]
        ══════════════════════════════════════════════════════════════ */}
        <aside className={`
          fixed lg:static z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          ${collapsed ? "lg:w-[76px]" : "lg:w-[285px]"}
          h-full lg:h-screen flex flex-col
          bg-[#242938] border-r border-white/[0.05]
          transition-all duration-300 ease-in-out select-none
        `}>

          {/* ── Brand bar — ✅ only "MR Reporting", no subtitle ── */}
          <div className={`
            flex items-center gap-3 flex-shrink-0
            h-[64px] px-4 border-b border-white/[0.07]
            ${collapsed ? "justify-center" : "justify-between"}
          `}>
            {!collapsed && (
              <div className="flex items-center gap-3 min-w-0">
                
                {/* ✅ Only brand name — subtitle removed */}
                <span className="brand-font text-white font-bold text-[17px] tracking-wide truncate">
                  MR Reporting
                </span>
              </div>
            )}

            {/* ✅ Collapsed: only gradient logo square — larger for clarity */}
            
            <div className="flex items-center gap-1">
              <button
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg
                  text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all"
                onClick={() => setCollapsed(!collapsed)}
              >
                <Menu size={18} />
              </button>
              <button
                className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg
                  text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Navigation ── */}
          <nav className="sidebar-scroll flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">

            {/* ✅ Larger font on all nav items — see component definitions below */}
            <SidebarLink to="/admin/dashboard"     icon={<LayoutDashboard size={19} />} label="Dashboard"    collapsed={collapsed} />
            <SidebarLink to="/admin/live-tracking" icon={<LocateFixed     size={19} />} label="Live Tracking" collapsed={collapsed} badge="live" />

            {!collapsed && <SectionDivider label="Reports Outcome" />}

            <DropdownMenu icon={<SlidersHorizontal size={19} />} label="Report Analysis"
              collapsed={collapsed} isOpen={reportAnalysisOpen} toggle={() => setReportAnalysisOpen(!reportAnalysisOpen)}>

              <NestedDropdown label="Daily Call Report" isOpen={dcrOpen} toggle={() => setDcrOpen(!dcrOpen)}>
                <SubLink to="/admin/reports/dcr-consolidate"      label="DCR Consolidate" />
                <SubLink to="/admin/reports/dump-dcr"             label="Dump DCR Report" />
                <SubLink to="/admin/reports/monthly-summary"      label="Monthly Summary Report" />
                <SubLink to="/admin/reports/doctor-call-yearly"   label="Doctor Call Yearly Progression" />
                <SubLink to="/admin/reports/daily-basic-dcr"      label="Daily Basic DCR Report" />
                <SubLink to="/admin/reports/dcr-status"           label="DCR Status Report" />
                <SubLink to="/admin/reports/employee-analysis"    label="Employee Analysis" />
                <SubLink to="/admin/reports/dcr-doctor-wise"      label="DCR Report Doctor Wise" />
                <SubLink to="/admin/reports/dcr-fy-wise"          label="DCR Report Financial Year Wise" />
              </NestedDropdown>

              <NestedDropdown label="Provider Reports" isOpen={providerOpen} toggle={() => setProviderOpen(!providerOpen)}>
                <SubLink to="/admin/reports/view-provider"            label="View Provider" />
                <SubLink to="/admin/reports/doctor-visit"             label="Doctor Visit" />
                <SubLink to="/admin/reports/chemist-visit"            label="Chemist/Stockist Visit Report" />
                <SubLink to="/admin/reports/missed-provider"          label="Missed Provider" />
                <SubLink to="/admin/reports/provider-analysis"        label="Provider Visit Analysis" />
                <SubLink to="/admin/reports/consolidated-pob"         label="Consolidated POB Report" />
                <SubLink to="/admin/reports/pob-manager-wise"         label="POB Report Manager Wise" />
                <SubLink to="/admin/reports/pob-employee-wise"        label="Employee Wise POB Report" />
                <SubLink to="/admin/reports/pob-product-wise"         label="ProductWise POB Report" />
                <SubLink to="/admin/reports/update-provider-status"   label="Update Provider Status" />
                <SubLink to="/admin/reports/speciality-doctor-report" label="Speciality Wise Doctor Report" />
                <SubLink to="/admin/reports/speciality-doctor-visit"  label="Speciality Wise Doctor Visit" />
              </NestedDropdown>

              <NestedDropdown label="Attendance Reports" isOpen={attendanceOpen} toggle={() => setAttendanceOpen(!attendanceOpen)}>
                <SubLink to="/admin/reports/holiday"              label="Holiday Report" />
                <SubLink to="/admin/reports/view-attendance"      label="View Attendance" />
                <SubLink to="/admin/reports/view-dcr-attendance"  label="View DCR Attendance" />
                <SubLink to="/admin/reports/view-day-plan"        label="View Day Plan Attendance" />
                <SubLink to="/admin/reports/employee-duration"    label="Employee Working Duration" />
              </NestedDropdown>

              <NestedDropdown label="Leave Reports" isOpen={leaveOpen} toggle={() => setLeaveOpen(!leaveOpen)}>
                <SubLink to="/admin/reports/leave-assign"    label="Leave Assign" />
                <SubLink to="/admin/reports/leave-overview"  label="Leave Overview" />
                <SubLink to="/admin/reports/date-wise-leave" label="Date Wise Leave Status" />
              </NestedDropdown>

              <SubLink to="/admin/reports/crm" label="CRM Reports" />

              <NestedDropdown label="Product Reports" isOpen={productReportOpen} toggle={() => setProductReportOpen(!productReportOpen)}>
                <SubLink to="/admin/reports/product-view"      label="Product View" />
                <SubLink to="/admin/reports/add-focus-product" label="Add Focus Product" />
              </NestedDropdown>

              <SubLink to="/admin/reports/sales" label="Sales Reports" />

              <NestedDropdown label="Target vs Achievements" isOpen={targetAchievementOpen} toggle={() => setTargetAchievementOpen(!targetAchievementOpen)}>
                <SubLink to="/admin/reports/stp-status"      label="STP Status Reports" />
                <SubLink to="/admin/reports/stp-details"     label="STP Details" />
                <SubLink to="/admin/reports/view-expense"    label="View Expense" />
                <SubLink to="/admin/reports/employee-salary" label="Employee Salary Slip" />
              </NestedDropdown>

              <NestedDropdown label="User Details" isOpen={userDetailsOpen} toggle={() => setUserDetailsOpen(!userDetailsOpen)}>
                <SubLink to="/admin/reports/user-information" label="User Information" />
                <SubLink to="/admin/reports/resign-reports"   label="Resign Reports" />
                <SubLink to="/admin/reports/user-master-data" label="Master Data" />
              </NestedDropdown>
            </DropdownMenu>

            {!collapsed && <SectionDivider label="Masters" />}

            <DropdownMenu icon={<Database size={19} />} label="Master Creations"
              collapsed={collapsed} isOpen={masterCreationsOpen} toggle={() => setMasterCreationsOpen(!masterCreationsOpen)}>
              <SubLink to="/admin/masters/designation"          label="1. Designation Creation" />
              <SubLink to="/admin/masters/users/directory"      label="2. User Directory" />
              <SubLink to="/admin/masters/users/create"         label="3. User Creation" />
              <SubLink to="/admin/masters/areas"                label="4. Area Creation" />
              <SubLink to="/admin/masters/doctors"              label="5. Doctor/Chemist Creation" />
              <SubLink to="/admin/masters/headquarter-mapping"  label="6. Headquarter Mapping" />
              <SubLink to="/admin/masters/change-headquarter"   label="7. Change Headquarter" />
              <SubLink to="/admin/masters/transfer"             label="8. Master Data Transfer" />
              <SubLink to="/admin/masters/hierarchy-management" label="9. Hierarchy Management" />
              <SubLink to="/admin/masters/stp"                  label="10. STP Creation" />
              <SubLink to="/admin/masters/product-creation"     label="11. Product Creation" />
              <SubLink to="/admin/masters/broadcast"            label="12. Broadcast Message" />
              <NestedDropdown label="13. CRM" isOpen={crmMasterOpen} toggle={() => setCrmMasterOpen(!crmMasterOpen)}>
                <SubLink to="/admin/masters/crm-submit" label="Submit CRM Data" />
              </NestedDropdown>
              <SubLink to="/admin/masters/lock-unlock" label="14. Lock / Unlock" />
            </DropdownMenu>

            <DropdownMenu icon={<CheckSquare size={19} />} label="Approval Master"
              collapsed={collapsed} isOpen={approvalMasterOpen} toggle={() => setApprovalMasterOpen(!approvalMasterOpen)}>
              <SubLink to="/admin/approvals/master-data"  label="1. Master Data" />
              <SubLink to="/admin/approvals/tour-program" label="2. Approve Tour Program" />
              <SubLink to="/admin/approvals/stp"          label="3. STP Approve" />
            </DropdownMenu>

            <DropdownMenu icon={<IndianRupee size={19} />} label="Expense"
              collapsed={collapsed} isOpen={expenseOpen} toggle={() => setExpenseOpen(!expenseOpen)}>
              <SubLink to="/admin/expenses/fare-rate-card"   label="1. Fare Rate Card" />
              <SubLink to="/admin/expense/statewise-da" label="2. StateWise DA" />
            </DropdownMenu>

            <DropdownMenu icon={<Package size={19} />} label="Stock-Sales & Statement"
              collapsed={collapsed} isOpen={stockOpen} toggle={() => setStockOpen(!stockOpen)}>
              <SubLink to="/admin/stock/submit-modify"  label="1. Submit & Modify" />
              <SubLink to="/admin/stock/view"           label="2. View" />
              <SubLink to="/admin/stock/user-stockist-mapping"        label="3. Stockist Mapping" />
              <SubLink to="/admin/stock/mapping-deletion-report" label="4. Stockist Mapping Deletion Report" />
            </DropdownMenu>

            <DropdownMenu icon={<Target size={19} />} label="Target"
              collapsed={collapsed} isOpen={targetOpen} toggle={() => setTargetOpen(!targetOpen)}>
              <SubLink to="/admin/target/submission" label="1. Submission" />
              <SubLink to="/admin/target/modify"     label="2. Modify" />
              <SubLink to="/admin/target/view"       label="3. View" />
            </DropdownMenu>
          </nav>

          {/* ── Bottom user chip ── */}
          {!collapsed && (
            <div className="flex-shrink-0 px-3 pb-4 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.05]
                hover:bg-white/[0.08] transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600
                  flex items-center justify-center text-white text-sm font-bold flex-shrink-0
                  shadow-md shadow-blue-900/30">
                  {adminProfile.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="brand-font text-white text-[14px] font-semibold truncate leading-tight">
                    {adminProfile.name}
                  </p>
                  <p className="text-[11px] text-slate-500 tracking-wide">Administrator</p>
                </div>
                <LogOut size={15} className="text-slate-600 group-hover:text-red-400 transition-colors flex-shrink-0"
                  onClick={handleLogout} />
              </div>
            </div>
          )}
        </aside>

        {/* ══════════════════════════════════════════════════════════════
            MAIN CONTENT
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col w-full h-screen overflow-hidden">

          {/* ── Top Bar — ✅ search removed ── */}
          <header className="
            flex-shrink-0 h-[64px]
            bg-white border-b border-gray-200/70
            flex items-center justify-between
            px-4 sm:px-7
            shadow-[0_1px_4px_0_rgba(0,0,0,0.05)]
          ">
            {/* Left — hamburger on mobile */}
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl
                  text-gray-500 hover:bg-gray-100 transition-all"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
            </div>

            {/* Right — ✅ no search, only bell + profile */}
            <div className="flex items-center gap-2">

              {/* Bell */}
              <button className="relative w-9 h-9 flex items-center justify-center rounded-xl
                text-gray-500 hover:bg-gray-100 transition-all">
                <Bell size={19} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white" />
              </button>

              <div className="w-px h-6 bg-gray-200 mx-1" />

              {/* ✅ Profile — closes on outside click via profileRef */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(prev => !prev)}
                  className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl
                    hover:bg-gray-100 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700
                    flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {adminProfile.initial}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="brand-font text-[14px] font-semibold text-gray-800 leading-tight">
                      {adminProfile.name}
                    </p>
                    <p className="text-[11px] text-gray-400">Administrator</p>
                  </div>
                  <ChevronDown
                    size={13}
                    className={`hidden sm:block text-gray-400 transition-transform duration-200
                      ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* ✅ Profile dropdown — closes on outside click */}
                {profileOpen && (
                  <div className="absolute top-[calc(100%+8px)] right-0 w-56 bg-white
                    rounded-2xl shadow-2xl border border-gray-100 py-2 z-50
                    animate-in fade-in zoom-in-95 duration-150">

                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700
                        flex items-center justify-center text-white font-bold text-sm">
                        {adminProfile.initial}
                      </div>
                      <div>
                        <p className="brand-font text-[14px] font-bold text-gray-800">{adminProfile.name}</p>
                        <p className="text-[11px] text-gray-500">Administrator</p>
                      </div>
                    </div>

                    {/* My Profile */}
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/admin/profile"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700
                        hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-blue-100
                        flex items-center justify-center transition-colors">
                        <User size={14} className="text-gray-500 group-hover:text-blue-600" />
                      </div>
                      My Profile
                    </button>

                    <div className="border-t border-gray-100 mx-2 my-1" />

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-600
                        hover:bg-red-50 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-50 group-hover:bg-red-100
                        flex items-center justify-center transition-colors">
                        <LogOut size={14} className="text-red-500" />
                      </div>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F3F4F6]">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR PRIMITIVES  — ✅ all font sizes increased
══════════════════════════════════════════════════════════════════════════ */

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-2.5 px-2 pt-5 pb-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#4B5563] whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

/* ✅ Collapsed mode: icon is centred in a larger 44px hit-target with tooltip */
function SidebarLink({ to, icon, label, collapsed, badge }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) => `
        group flex items-center justify-between
        ${collapsed ? "justify-center px-0 mx-auto w-11 h-11 rounded-xl" : "px-3 py-[10px] rounded-xl"}
        mb-0.5 transition-all duration-150 cursor-pointer
        ${isActive
          ? collapsed
            ? "bg-blue-600/20 text-blue-400"
            : "nav-active-glow text-white"
          : "text-[#9CA3AF] hover:text-white hover:bg-white/[0.07]"
        }
      `}
    >
      {/* ✅ Collapsed: icon is larger (20px) and centred cleanly */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? "w-5 h-5" : "w-[19px]"}`}>
          {icon}
        </div>
        {!collapsed && (
          <span className="text-[14px] font-medium leading-tight">{label}</span>
        )}
      </div>
      {!collapsed && badge && (
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30
          text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

function DropdownMenu({ icon, label, collapsed, isOpen, toggle, children }) {
  return (
    <div className="mb-0.5">
      <div
        onClick={toggle}
        title={collapsed ? label : undefined}
        className={`
          group flex items-center justify-between cursor-pointer
          ${collapsed ? "justify-center px-0 mx-auto w-11 h-11 rounded-xl" : "px-3 py-[10px] rounded-xl"}
          transition-all duration-150
          ${isOpen
            ? "text-white bg-white/[0.07]"
            : "text-[#9CA3AF] hover:text-white hover:bg-white/[0.07]"
          }
        `}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? "w-5 h-5" : "w-[19px]"}`}>
            {icon}
          </div>
          {!collapsed && (
            <span className="text-[14px] font-medium leading-tight">{label}</span>
          )}
        </div>
        {!collapsed && (
          <ChevronDown
            size={14}
            className={`text-[#4B5563] transition-transform duration-200
              ${isOpen ? "rotate-180 !text-slate-400" : ""}`}
          />
        )}
      </div>

      {isOpen && !collapsed && (
        <div className="ml-7 mt-0.5 mb-1 pl-3.5 border-l border-white/[0.07] space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

function NestedDropdown({ label, isOpen, toggle, children }) {
  return (
    <div className="mb-0.5">
      <div
        onClick={toggle}
        className={`
          flex items-center justify-between
          px-2.5 py-2 rounded-lg cursor-pointer
          transition-all duration-150 text-[13px] font-medium
          ${isOpen
            ? "text-slate-200 bg-white/[0.05]"
            : "text-[#6B7280] hover:text-slate-200 hover:bg-white/[0.04]"
          }
        `}
      >
        <span>{label}</span>
        <ChevronDown
          size={12}
          className={`text-[#4B5563] transition-transform duration-200
            ${isOpen ? "rotate-180 !text-slate-400" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="ml-3 mt-0.5 mb-1 pl-3 border-l border-white/[0.05] space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

function SubLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        block px-2.5 py-[7px] rounded-lg
        text-[13px] leading-snug
        transition-all duration-150 cursor-pointer
        ${isActive
          ? "text-blue-400 bg-blue-500/10 font-semibold"
          : "text-[#6B7280] hover:text-slate-200 hover:bg-white/[0.04]"
        }
      `}
    >
      {label}
    </NavLink>
  );
}
