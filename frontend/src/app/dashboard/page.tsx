"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Armchair, CheckCircle2, XCircle, ShieldAlert, Clock, Briefcase, BarChart2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface Summary {
  total_employees: number;
  total_seats: number;
  occupied_seats: number;
  available_seats: number;
  reserved_seats: number;
  new_joiners_pending_allocation: number;
  total_projects: number;
  seat_utilization_pct: number;
}

interface ProjectUtil {
  project_id: number;
  project_name: string;
  total_members: number;
  seated_members: number;
  unseated_members: number;
}

interface FloorUtil {
  floor_id: number;
  floor_number: string;
  total_seats: number;
  occupied: number;
  available: number;
  reserved: number;
  utilization_pct: number;
}

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
    <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
    {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
  </div>
);

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [projects, setProjects] = useState<ProjectUtil[]>([]);
  const [floors, setFloors] = useState<FloorUtil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [s, p, f] = await Promise.all([
        fetch(`${API}/dashboard/summary`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`${API}/dashboard/project-utilization`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`${API}/dashboard/floor-utilization`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      setSummary(s);
      setProjects(p);
      setFloors(f);
    } catch {
      setError("Could not connect to the API. Make sure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8">
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 p-6 text-red-600">
          {error || "Failed to load dashboard data."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Real-time workspace analytics</p>
        </div>
        <button
          onClick={fetchAll}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Metric Cards — 6 required metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Total Employees" value={summary.total_employees.toLocaleString()} icon={Users} color="bg-indigo-500" />
        <MetricCard title="Total Seats" value={summary.total_seats.toLocaleString()} icon={Armchair} color="bg-blue-500" />
        <MetricCard
          title="Occupied Seats"
          value={summary.occupied_seats.toLocaleString()}
          subtitle={`${summary.seat_utilization_pct}% utilization`}
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
        <MetricCard title="Available Seats" value={summary.available_seats.toLocaleString()} icon={XCircle} color="bg-green-400" />
        <MetricCard title="Reserved Seats" value={summary.reserved_seats.toLocaleString()} icon={ShieldAlert} color="bg-amber-500" />
        <MetricCard
          title="Pending Allocation"
          value={summary.new_joiners_pending_allocation.toLocaleString()}
          subtitle="New joiners"
          icon={Clock}
          color="bg-rose-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Utilization */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Briefcase className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Project-wise Seat Allocation</h2>
          </div>
          <div className="space-y-3">
            {projects.map((p) => {
              const pct = p.total_members > 0 ? Math.round((p.seated_members / p.total_members) * 100) : 0;
              return (
                <div key={p.project_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[160px]">{p.project_name}</span>
                    <span className="text-gray-500 text-xs">
                      {p.seated_members}/{p.total_members} seated
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floor Utilization */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Floor-wise Occupancy</h2>
          </div>
          <div className="space-y-4">
            {floors.map((f) => (
              <div key={f.floor_id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Floor {f.floor_number}</span>
                  <span className="text-gray-500 text-xs">{f.utilization_pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${f.utilization_pct}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-1 text-xs text-gray-400">
                  <span className="text-emerald-600">{f.occupied} occupied</span>
                  <span className="text-green-500">{f.available} free</span>
                  <span className="text-amber-500">{f.reserved} reserved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
