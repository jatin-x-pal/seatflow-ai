"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import type { Seat, SeatStatus } from "@/types/visualizer";
import { STATUS_CONFIG, getInitials, cn } from "@/lib/visualizer-utils";

interface SeatCardProps {
  seat: Seat;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: (seat: Seat) => void;
  compact?: boolean;
}

export const SeatCard = memo(function SeatCard({
  seat,
  isSelected,
  isHighlighted,
  onClick,
  compact = false,
}: SeatCardProps) {
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS_CONFIG[seat.status as SeatStatus] || STATUS_CONFIG.Available;
  const initials = seat.employee ? getInitials(seat.employee.name) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 1.08 : isHighlighted ? 1.05 : 1,
      }}
      whileHover={{ scale: 1.07, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 340, damping: 22 }}
      onClick={() => onClick(seat)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(seat)}
      aria-label={`Seat ${seat.seat_number} — ${seat.status}${seat.employee ? ` — ${seat.employee.name}` : ""}`}
      className={cn(
        "relative cursor-pointer rounded-xl border transition-all duration-200 select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        compact ? "w-10 h-10" : "w-14 h-14",
        cfg.bg,
        cfg.border,
        cfg.ring,
        isSelected && "ring-2 ring-offset-1 ring-purple-500 border-purple-400 shadow-lg shadow-purple-200/50 dark:shadow-purple-900/30",
        isHighlighted && !isSelected && "ring-2 ring-offset-1 ring-yellow-400 border-yellow-400 shadow-md shadow-yellow-200/50",
        "hover:shadow-md",
      )}
    >
      {/* Status dot */}
      <span
        className={cn(
          "absolute top-1 right-1 rounded-full",
          compact ? "w-1.5 h-1.5" : "w-2 h-2",
          cfg.dot,
        )}
      />

      {/* Content */}
      <div className="flex flex-col items-center justify-center h-full gap-0.5 px-1">
        {initials ? (
          <>
            <span
              className={cn(
                "font-bold leading-none",
                compact ? "text-[8px]" : "text-[10px]",
                cfg.text,
              )}
            >
              {initials}
            </span>
            {!compact && (
              <span className="text-[7px] text-gray-400 truncate w-full text-center leading-none">
                {seat.seat_number.split("-").pop()}
              </span>
            )}
          </>
        ) : (
          <span
            className={cn(
              "font-semibold leading-none",
              compact ? "text-[8px]" : "text-[9px]",
              cfg.text,
            )}
          >
            {compact ? seat.seat_number.split("-").pop() : seat.seat_number.split("-").pop()}
          </span>
        )}
      </div>

      {/* Hover tooltip */}
      {hovered && !compact && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
        >
          <div className="bg-gray-900 text-white rounded-lg px-3 py-2 shadow-xl text-xs whitespace-nowrap min-w-max">
            <div className="font-semibold">{seat.seat_number}</div>
            {seat.employee && (
              <div className="text-gray-300">{seat.employee.name}</div>
            )}
            <div className={cn("mt-0.5 font-medium", cfg.text.replace("dark:", ""))}>{seat.status}</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});
