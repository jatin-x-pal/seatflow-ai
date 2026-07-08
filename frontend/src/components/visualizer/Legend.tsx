"use client";

import type { SeatStatus } from "@/types/visualizer";
import { STATUS_CONFIG, cn } from "@/lib/visualizer-utils";

interface LegendProps {
  activeStatuses: SeatStatus[];
  onToggle: (status: SeatStatus) => void;
}

const ALL_STATUSES: SeatStatus[] = ["Available", "Occupied", "Reserved", "Maintenance"];

export function Legend({ activeStatuses, onToggle }: LegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ALL_STATUSES.map((status) => {
        const cfg = STATUS_CONFIG[status];
        const active = activeStatuses.includes(status);
        return (
          <button
            key={status}
            onClick={() => onToggle(status)}
            title={`${active ? "Hide" : "Show"} ${cfg.label}`}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
              active
                ? cn(cfg.bg, cfg.text, cfg.border)
                : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700",
            )}
          >
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", active ? cfg.dot : "bg-gray-300")} />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
