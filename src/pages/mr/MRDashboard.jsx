import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Target, 
  Activity, 
  Users, 
  PhoneOff, 
  TrendingUp,
  Loader2,
  AlertCircle
} from "lucide-react";
// import api from "../../../services/api"; // Uncomment and adjust path when API is ready

export default function MRDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({
    tpApprovalStatus: "Pending",
    currentMonthOrder: { doctor: 0, chemist: 0, stockist: 0 },
    totalPob: 0,
    coverage: { doctors: 0, chemist: 0 },
    callAverage: { doctors: 0, chemist: 0 },
    untouchedProviders: { doctors: 0, chemist: 0 }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // ⚠️ Replace this with your actual backend API call:
        // const response = await api.get("/api/mr/dashboard-stats");
        // setMetrics(response.data.data);

        // Simulating a database fetch delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulated live data from database
        setMetrics({
          tpApprovalStatus: "Approved",
          currentMonthOrder: { doctor: 15000, chemist: 45000, stockist: 120000 },
          totalPob: 180000,
          coverage: { doctors: 85, chemist: 42 },
          callAverage: { doctors: 8.5, chemist: 4.2 },
          untouchedProviders: { doctors: 12, chemist: 5 }
        });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Unable to load dashboard statistics. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Syncing live data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <span className="font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">MR Dashboard</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Real-time overview of your field performance and targets.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* 1. TP Approval Status */}
        <DashboardCard 
          title="TP Approval Status" 
          icon={<CheckCircle size={20} className="text-emerald-500" />}
          progressColor="bg-emerald-500"
          progressValue={metrics.tpApprovalStatus === "Approved" ? 100 : 50}
        >
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-slate-500 font-medium">Current Status</span>
            <span className={`text-xl font-bold ${metrics.tpApprovalStatus === 'Approved' ? 'text-emerald-600' : 'text-amber-500'}`}>
              {metrics.tpApprovalStatus}
            </span>
          </div>
        </DashboardCard>

        {/* 2. Current Month Order Value */}
        <DashboardCard 
          title="Current Month Order Value" 
          icon={<Target size={20} className="text-blue-500" />}
          progressColor="bg-blue-500"
          progressValue={75}
        >
          <div className="space-y-3 mt-2">
            <StatRow label="Doctor POB" value={`₹ ${metrics.currentMonthOrder.doctor.toLocaleString()}`} />
            <StatRow label="Chemist POB" value={`₹ ${metrics.currentMonthOrder.chemist.toLocaleString()}`} />
            <StatRow label="Stockist POB" value={`₹ ${metrics.currentMonthOrder.stockist.toLocaleString()}`} />
          </div>
        </DashboardCard>

        {/* 3. Total POB */}
        <DashboardCard 
          title="Total POB" 
          icon={<TrendingUp size={20} className="text-indigo-500" />}
          progressColor="bg-indigo-500"
          progressValue={85}
        >
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-slate-500 font-medium">Total Accumulated</span>
            <span className="text-2xl font-bold text-indigo-600">
              ₹ {metrics.totalPob.toLocaleString()}
            </span>
          </div>
        </DashboardCard>

        {/* 4. Coverage */}
        <DashboardCard 
          title="Coverage" 
          icon={<Users size={20} className="text-amber-500" />}
          progressColor="bg-amber-500"
          progressValue={60}
        >
          <div className="space-y-3 mt-2">
            <StatRow label="Doctors Visited" value={metrics.coverage.doctors} />
            <StatRow label="Chemists Visited" value={metrics.coverage.chemist} />
          </div>
        </DashboardCard>

        {/* 5. Call Average */}
        <DashboardCard 
          title="Call Average" 
          icon={<Activity size={20} className="text-cyan-500" />}
          progressColor="bg-cyan-500"
          progressValue={70}
        >
          <div className="space-y-3 mt-2">
            <StatRow label="Doctor Call Avg." value={metrics.callAverage.doctors} />
            <StatRow label="Chemist Call Avg." value={metrics.callAverage.chemist} />
          </div>
        </DashboardCard>

        {/* 6. Untouched Providers */}
        <DashboardCard 
          title="Untouched Providers" 
          icon={<PhoneOff size={20} className="text-rose-500" />}
          progressColor="bg-rose-500"
          progressValue={30}
        >
          <div className="space-y-3 mt-2">
            <StatRow label="Doctors Pending" value={metrics.untouchedProviders.doctors} valueColor="text-rose-600" />
            <StatRow label="Chemists Pending" value={metrics.untouchedProviders.chemist} valueColor="text-rose-600" />
          </div>
        </DashboardCard>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Reusable UI Components
// ═══════════════════════════════════════════════════════════════════

function DashboardCard({ title, icon, children, progressColor, progressValue }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="font-bold text-slate-700">{title}</h3>
      </div>
      
      {/* Content */}
      <div className="mb-6">
        {children}
      </div>

      {/* Decorative Progress Line at the bottom */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-100">
        <div 
          className={`h-full ${progressColor} transition-all duration-1000 ease-out`} 
          style={{ width: `${progressValue}%` }}
        />
      </div>
    </div>
  );
}

function StatRow({ label, value, valueColor = "text-slate-800" }) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-slate-50 last:border-0 last:pb-0">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className={`text-sm font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}