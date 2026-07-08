"use client";

import type { FloorUtilization } from "@/types/visualizer";
import { cn } from "@/lib/visualizer-utils";
import { Building2, ChevronDown } from "lucide-react";

interface FloorSelectorProps {
  floors: FloorUtilization[];
  selectedFloorId: number | null;
  onSelect: (floorId: number) => void;
  loading: boolean;
}

export function FloorSelector({ floors, selectedFloorId, onSelect, loading }: FloorSelectorProps) {
  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-20 h-9 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {floors.map((floor) => {
        const selected = selectedFloorId === floor.floor_id;
        const utilPct = floor.utilization_pct;
        const urgency =
          utilPct >= 95 ? "text-rose-600" :
          utilPct >= 80 ? "text-amber-600" :
          "text-emerald-600";

        return (
          <button
            key={floor.floor_id}
            onClick={() => onSelect(floor.floor_id)}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all",
              selected
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200/50 dark:shadow-indigo-900/30"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:text-indigo-600"
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Floor {floor.floor_number}</span>
            {!selected && (
              <span className={cn("text-[10px] font-bold", urgency)}>
                {utilPct}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
