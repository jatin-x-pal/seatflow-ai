"use client";

import { memo } from "react";
import type { BayGroup, Seat } from "@/types/visualizer";
import { SeatCard } from "./SeatCard";
import { cn } from "@/lib/visualizer-utils";

interface BayGridProps {
  bay: BayGroup;
  selectedSeatId: number | null;
  highlightedSeatId: number | null;
  onSeatClick: (seat: Seat) => void;
  compact: boolean;
}

export const BayGrid = memo(function BayGrid({
  bay,
  selectedSeatId,
  highlightedSeatId,
  onSeatClick,
  compact,
}: BayGridProps) {
  // Render seats in a 2-column grid to mimic a real desk layout
  return (
    <div className="bg-white/50 dark:bg-gray-900/40 rounded-xl border border-white/60 dark:border-gray-700/50 p-2.5 shadow-sm">
      {/* Bay label */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="px-1.5 py-0.5 rounded-md bg-gray-200/70 dark:bg-gray-700/70 text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Bay {bay.bay}
        </span>
      </div>

      {/* Seats grid — 2 columns max for realistic desk layout */}
      <div
        className={cn(
          "grid gap-1.5",
          compact ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {bay.seats.map((seat) => (
          <SeatCard
            key={seat.id}
            seat={seat}
            isSelected={selectedSeatId === seat.id}
            isHighlighted={highlightedSeatId === seat.id}
            onClick={onSeatClick}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
});
