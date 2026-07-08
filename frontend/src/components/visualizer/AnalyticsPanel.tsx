"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, CheckCircle2, XCircle, ShieldAlert, Wrench, Users } from "lucide-react";
import type { FloorUtilization, Seat } from "@/types/visualizer";
import { cn } from "@/lib/visualizer-utils";

interface AnalyticsPanelProps {
  seats: Seat[];
  floorUtil: FloorUtilization | null;
  loading: boolean;
}

const STAT_COLORS = {
  Occupied:    { bg: "bg-blue-50 dark:bg-blue-950/30",    icon: "text-blue-600",    bar: "bg-blue-500"    },
  Available:   { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-600", bar: "bg-emerald-500" },
  Reserved:    { bg: "bg-amber-50 dark:bg-amber-950/30",  icon: "text-amber-600",   bar: "bg-amber-500"   },
  Maintenance: { bg: "bg-gray-50 dark:bg-gray-800/30",    icon: "text-gray-500",    bar: "bg-gray-400"    },
};

export function AnalyticsPanel({ seats, floorUtil, loading }: AnalyticsPanelProps) {
  const total     = seats.length;
  const occupied  = seats.filter((s) => s.status === "Occupied").length;
  const available = seats.filter((s) => s.status === "Available").length;
  const reserved  = seats.filter((s) => s.status === "Reserved").length;
  const maint     = seats.filter((s) => s.status === "Maintenance").length;
  const utilPct   = total > 0 ? Math.round((occupied / total) * 100) : 0;

  // Zone distribution
  const zoneMap = new Map<string, number>();
  for (const s of seats) {
    if (s.status === "Occupied") {
      zoneMap.set(s.zone, (zoneMap.get(s.zone) ?? 0) + 1);
    }
  }
  const zones = Array.from(zoneMap.entries()).sort((a, b) => b[1] - a[1]);

  const STATS = [
    { label: "Occupied",    count: occupied,  icon: CheckCircle2, key: "Occupied"    as const },
    { label: "Available",   count: available, icon: XCircle,      key: "Available"   as const },
    { label: "Reserved",    count: reserved,  icon: ShieldAlert,  key: "Reserved"    as const },
    { label: "Maintenance", count: maint,     icon: Wrench,       key: "Maintenance" as const },
  ];

  return (
    <div className="flex flex-col gap-4 min-w-52 w-52">
      {/* Utilization Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Utilization</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
            <div className="h-2 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full" />
          </div>
        ) : (
          <>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-3xl font-black text-gray-900 dark:text-white">{utilPct}</span>
              <span className="text-lg font-bold text-gray-400 mb-0.5">%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${utilPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {occupied} of {total} seats occupied
            </p>
          </>
        )}
      </div>

      {/* Status Breakdown */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Breakdown</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {STATS.map(({ label, count, icon: Icon, key }) => {
              const cfg = STAT_COLORS[key];
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={label} className={cn("rounded-xl px-3 py-2", cfg.bg)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn("w-3 h-3", cfg.icon)} />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{count}</span>
                  </div>
                  <div className="h-1 bg-white/60 dark:bg-gray-700/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className={cn("h-full rounded-full", cfg.bar)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Zone Occupancy */}
      {zones.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-indigo-500" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Top Zones</p>
          </div>
          <div className="space-y-1.5">
            {zones.slice(0, 5).map(([zone, count]) => (
              <div key={zone} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">Zone {zone}</span>
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full"
                    style={{ width: `${Math.min(100, (count / (Math.max(...zones.map(([,c]) => c)))) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-5 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
