"use client";

import type { Filters, SeatStatus } from "@/types/visualizer";
import type { Project } from "@/types/visualizer";
import { cn } from "@/lib/visualizer-utils";
import { Filter } from "lucide-react";

interface FiltersProps {
  filters: Filters;
  projects: Project[];
  zones: string[];
  onChange: (filters: Filters) => void;
}

const ALL_STATUSES: SeatStatus[] = ["Available", "Occupied", "Reserved", "Maintenance"];

export function FiltersPanel({ filters, projects, zones, onChange }: FiltersProps) {
  const toggleStatus = (s: SeatStatus) => {
    const next = filters.statuses.includes(s)
      ? filters.statuses.filter((x) => x !== s)
      : [...filters.statuses, s];
    onChange({ ...filters, statuses: next.length === 0 ? ALL_STATUSES : next });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-4 min-w-52">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Filter className="w-4 h-4 text-indigo-500" />
        Filters
      </div>

      {/* Status */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</p>
        <div className="space-y-1.5">
          {ALL_STATUSES.map((s) => {
            const active = filters.statuses.includes(s);
            const colors: Record<SeatStatus, string> = {
              Available: "accent-emerald-500",
              Occupied: "accent-blue-500",
              Reserved: "accent-amber-500",
              Maintenance: "accent-gray-400",
            };
            return (
              <label key={s} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleStatus(s)}
                  className={cn("w-4 h-4 rounded", colors[s])}
                />
                <span className={cn(
                  "text-sm transition-colors",
                  active ? "text-gray-800 dark:text-gray-200" : "text-gray-400"
                )}>
                  {s}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Project */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Project</p>
        <select
          value={filters.projectId ?? ""}
          onChange={(e) => onChange({ ...filters, projectId: e.target.value ? Number(e.target.value) : null })}
          className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Zone */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Zone</p>
        <select
          value={filters.zone ?? ""}
          onChange={(e) => onChange({ ...filters, zone: e.target.value || null })}
          className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Zones</option>
          {zones.map((z) => (
            <option key={z} value={z}>Zone {z}</option>
          ))}
        </select>
      </div>

      {/* Reset */}
      <button
        onClick={() => onChange({ statuses: ALL_STATUSES, projectId: null, zone: null })}
        className="w-full text-xs text-indigo-500 hover:text-indigo-700 font-medium py-1 hover:bg-indigo-50 rounded-lg transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
}
