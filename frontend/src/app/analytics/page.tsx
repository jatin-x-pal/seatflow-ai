"use client";

import { useEffect, useState } from "react";
import {
  BarChart3, TrendingUp, Users, Armchair,
  CheckCircle2, XCircle, ShieldAlert, Clock,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface FloorUtil {
  floor_id: number;
  floor_number: string;
  total_seats: number;
  occupied: number;
  available: number;
  reserved: number;
  utilization_pct: number;
}

interface ProjectUtil {
  project_id: number;
  project_name: string;
  total_members: number;
  seated_members: number;
  unseated_members: number;
}

interface Summary {
  total_employees: number;
  total_seats: number;
  occupied_seats: number;
  available_seats: number;
  reserved_seats: number;
  new_joiners_pending_allocation: number;
  seat_utilization_pct: number;
}

const COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-sky-500",
  "bg-emerald-500", "bg-amber-500", "bg-rose-500",
  "bg-cyan-500", "bg-purple-500", "bg-teal-500", "bg-orange-500",
];

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [floors, setFloors] = useState<FloorUtil[]>([]);
  const [projects, setProjects] = useState<ProjectUtil[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/dashboard/summary`).then((r) => r.json()),
      fetch(`${API}/dashboard/floor-utilization`).then((r) => r.json()),
      fetch(`${API}/dashboard/project-utilization`).then((r) => r.json()),
    ])
      .then(([s, f, p]) => { setSummary(s); setFloors(f); setProjects(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const totalActive = (summary?.total_employees || 0) - (summary?.new_joiners_pending_allocation || 0);

  return (
    <div className="p-8 space-y-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-50">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-0.5">Deep-dive into workspace utilization and trends</p>
        </div>
      </div>

      {/* KPI Row */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Seat Utilization", value: `${summary.seat_utilization_pct}%`, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50" },
            { label: "Active Employees", value: totalActive.toLocaleString(), icon: Users, color: "text-emerald-600 bg-emerald-50" },
            { label: "Seats Occupied", value: summary.occupied_seats.toLocaleString(), icon: CheckCircle2, color: "text-blue-600 bg-blue-50" },
            { label: "Pending Allocation", value: summary.new_joiners_pending_allocation, icon: Clock, color: "text-amber-600 bg-amber-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`inline-flex p-2 rounded-xl ${color} mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Seat Status Breakdown */}
        {summary && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Seat Status Breakdown</h2>
            <div className="space-y-4">
              {[
                { label: "Occupied", count: summary.occupied_seats, total: summary.total_seats, icon: CheckCircle2, cls: "bg-blue-500" },
                { label: "Available", count: summary.available_seats, total: summary.total_seats, icon: XCircle, cls: "bg-emerald-500" },
                { label: "Reserved", count: summary.reserved_seats, total: summary.total_seats, icon: ShieldAlert, cls: "bg-amber-500" },
              ].map(({ label, count, total, cls }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span className="text-gray-500">{count.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${cls} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Donut summary */}
            <div className="mt-6 pt-4 border-t border-gray-50 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl font-bold text-gray-900">{summary.total_seats.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">{summary.occupied_seats.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Occupied</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-600">{summary.available_seats.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Free</div>
              </div>
            </div>
          </div>
        )}

        {/* Floor Utilization */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Floor-wise Breakdown</h2>
          <div className="space-y-5">
            {floors.map((f) => (
              <div key={f.floor_id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-gray-700">Floor {f.floor_number}</span>
                  <span className="text-gray-400 text-xs">{f.utilization_pct}% occupied</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${f.utilization_pct}%` }} />
                </div>
                <div className="flex gap-4 mt-1.5 text-xs text-gray-400">
                  <span className="text-blue-500 font-medium">{f.occupied} occ.</span>
                  <span className="text-emerald-500 font-medium">{f.available} free</span>
                  <span className="text-amber-500 font-medium">{f.reserved} reserved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Allocation Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Project Allocation Detail</h2>
          <span className="text-sm text-gray-400">{projects.length} projects</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Project", "Total Members", "Seated", "Unseated", "Coverage"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((p, idx) => {
                const pct = p.total_members > 0 ? Math.round((p.seated_members / p.total_members) * 100) : 0;
                return (
                  <tr key={p.project_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 flex items-center gap-2.5 mt-0.5">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${COLORS[idx % COLORS.length]}`} />
                      {p.project_name}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{p.total_members.toLocaleString()}</td>
                    <td className="px-5 py-3 text-emerald-600 font-medium">{p.seated_members.toLocaleString()}</td>
                    <td className="px-5 py-3 text-amber-500 font-medium">{p.unseated_members.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${COLORS[idx % COLORS.length]} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
