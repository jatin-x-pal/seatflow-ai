"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { ZoneGroup, Seat } from "@/types/visualizer";
import { BayGrid } from "./BayGrid";
import { getZoneGradient, cn } from "@/lib/visualizer-utils";

interface ZoneSectionProps {
  zone: ZoneGroup;
  zoneIndex: number;
  selectedSeatId: number | null;
  highlightedSeatId: number | null;
  onSeatClick: (seat: Seat) => void;
  compact: boolean;
}

export const ZoneSection = memo(function ZoneSection({
  zone,
  zoneIndex,
  selectedSeatId,
  highlightedSeatId,
  onSeatClick,
  compact,
}: ZoneSectionProps) {
  const gradient = getZoneGradient(zoneIndex);
  const occupied = zone.seats.filter((s) => s.status === "Occupied").length;
  const available = zone.seats.filter((s) => s.status === "Available").length;
  const utilPct = zone.seats.length > 0 ? Math.round((occupied / zone.seats.length) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: zoneIndex * 0.04 }}
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-4",
        gradient,
      )}
    >
      {/* Zone Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/70 dark:bg-gray-900/70 flex items-center justify-center shadow-sm">
            <span className="text-sm font-black text-gray-700 dark:text-gray-200">{zone.zone}</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Zone {zone.zone}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {zone.seats.length} seats · {zone.bays.length} bays
            </p>
          </div>
        </div>

        {/* Zone utilization mini-bar */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{utilPct}%</span>
            <p className="text-[10px] text-gray-400">{available} free</p>
          </div>
          <div className="w-16 h-1.5 bg-white/60 dark:bg-gray-700/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${utilPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bays */}
      <div className="flex flex-wrap gap-3">
        {zone.bays.map((bay) => (
          <BayGrid
            key={bay.bay}
            bay={bay}
            selectedSeatId={selectedSeatId}
            highlightedSeatId={highlightedSeatId}
            onSeatClick={onSeatClick}
            compact={compact}
          />
        ))}
      </div>
    </motion.div>
  );
});
