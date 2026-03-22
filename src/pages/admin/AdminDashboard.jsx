import React, { useState, useEffect } from "react";
import { 
  Users, Stethoscope, FileText, IndianRupee, 
  TrendingUp, AlertCircle, Loader2, Activity
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import api from "../../services/api";

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  
  // 📊 Dashboard States (Empty by default, waiting for data)
  const [stats, setStats] = useState({ totalMrs: 0, activeMrs: 0, dcrsToday: 0, totalSales: 0 });
  const [targetData, setTargetData] = useState([]);
  const [dcrStatusData, setDcrStatusData] = useState([]);
  const [visitTrendData, setVisitTrendData] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true); // Start the loading spinner
        
        // =====================================================================
        // 🛠️ STEP 1: UNCOMMENT THIS BLOCK WHEN SHUBHAM'S BACKEND IS READY
        // =====================================================================
        /*
        const response = await api.get('/api/admin/dashboard');
        
        if (response.data.success) {
          // Update all our state variables with the real data from the database
          setStats(response.data.data.stats);
          setTargetData(response.data.data.targetData);
          setDcrStatusData(response.data.data.dcrStatusData);
          setVisitTrendData(response.data.data.visitTrendData);
          setRecentAlerts(response.data.data.recentAlerts);
        }
        */

        // =====================================================================
        // 🛠️ STEP 2: DELETE EVERYTHING BELOW THIS LINE ONCE THE API IS CONNECTED
        // =====================================================================
        
        // Simulating a small network delay so you can see the loading spinner
        await new Promise(resolve => setTimeout(resolve, 800));

        setStats({ totalMrs: 145, activeMrs: 124, dcrsToday: 98, totalSales: 1250000 });
        
        setTargetData([
          { month: "Jan", target: 400000, achieved: 450000 },
          { month: "Feb", target: 450000, achieved: 420000 },
          { month: "Mar", target: 500000, achieved: 550000 },
        ]);

        setDcrStatusData([
          { name: "Submitted", value: 65, color: "#2DD4BF" },
          { name: "Pending", value: 20, color: "#FDE047" },
          { name: "Locked", value: 8, color: "#FCA5A5" },
          { name: "Leave", value: 5, color: "#9CA3AF" }
        ]);

        setVisitTrendData([
          { day: "Mon", visits: 310 }, { day: "Tue", visits: 420 },
          { day: "Wed", visits: 380 }, { day: "Thu", visits: 450 },
          { day: "Fri", visits: 390 }, { day: "Sat", visits: 150 },
        ]);

        setRecentAlerts([
          { id: 1, msg: "5 Tour Plans pending approval for North Zone", time: "2 hours ago" },
          { id: 2, msg: "Stock discrepancy reported by Swati", time: "5 hours ago" },
          { id: 3, msg: "Monthly Target data updated", time: "1 day ago" }
        ]);
        // =====================================================================
        // 🛠️ END OF TEMPORARY DATA
        // =====================================================================

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        // Stop the loading spinner whether the API call succeeds OR fails
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Show a spinner while we wait for the data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-[#FF5722]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#1F2937]">Dashboard Overview </h2>
        <p className="text-gray-500 text-sm mt-1">Real-time tracking of MR performance and DCR statuses.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active MRs" value={`${stats.activeMrs} / ${stats.totalMrs}`} subtitle="Available in field" icon={<Users size={24} />} color="text-blue-600 bg-blue-50" />
        <StatCard title="DCRs Today" value={stats.dcrsToday} subtitle="+12% from yesterday" icon={<FileText size={24} />} color="text-teal-600 bg-teal-50" />
        <StatCard title="Doctor Visits" value="1,840" subtitle="This week" icon={<Stethoscope size={24} />} color="text-purple-600 bg-purple-50" />
        <StatCard title="Monthly Sales" value={`₹${(stats.totalSales / 100000).toFixed(1)}L`} subtitle="85% of target" icon={<IndianRupee size={24} />} color="text-green-600 bg-green-50" />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Target vs Achievement (Bar Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1F2937] mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#FF5722]" />
            Target vs Achievement (Quarterly)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={targetData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(val) => `₹${val/1000}k`} dx={-10} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="target" name="Target" fill="#9CA3AF" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="achieved" name="Achieved" fill="#FF5722" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DCR Status Breakdown (Donut Chart) */}
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-[#1F2937] mb-2 flex items-center gap-2">
            <FileText size={18} className="text-[#2563EB]" />
            Today's DCR Status
          </h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dcrStatusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {dcrStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {dcrStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-600">{item.name}:</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Line Chart & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Doctor Visits Trend (Line Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1F2937] mb-6 flex items-center gap-2">
            <Activity size={18} className="text-[#2DD4BF]" />
            Doctor Visit Trends (Last 7 Days)
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                <Line type="monotone" dataKey="visits" name="Total Visits" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Widget */}
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            System Alerts
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-60 custom-scrollbar pr-2">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 bg-red-50 p-3 rounded-lg border border-red-100">
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">{alert.msg}</p>
                  <p className="text-xs text-red-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// 🧱 Reusable Stat Card Component
function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-[#1F2937]">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 text-xs font-medium text-gray-500 border-t border-gray-100 pt-3">
        {subtitle}
      </div>
    </div>
  );
}