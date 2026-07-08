"use client";

import { Coffee, Users, ArrowUpDown, DoorOpen, AlertTriangle, Utensils } from "lucide-react";
import { cn } from "@/lib/visualizer-utils";

// Decorative office "rooms" shown at the top of the floor canvas
// These are visual-only elements to make the floor look like a real office

const ROOMS = [
  { id: "reception",   label: "Reception",    icon: Users,       color: "bg-sky-50 border-sky-200 text-sky-600 dark:bg-sky-950/30 dark:border-sky-800" },
  { id: "meeting-1",   label: "Meeting Rm A", icon: Users,       color: "bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-950/30 dark:border-violet-800" },
  { id: "meeting-2",   label: "Meeting Rm B", icon: Users,       color: "bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-950/30 dark:border-violet-800" },
  { id: "pantry",      label: "Pantry",       icon: Utensils,    color: "bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/30 dark:border-amber-800" },
  { id: "elevator",    label: "Elevator",     icon: ArrowUpDown, color: "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800/40 dark:border-gray-700" },
  { id: "restroom",    label: "Restrooms",    icon: DoorOpen,    color: "bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-950/30 dark:border-cyan-800" },
  { id: "exit",        label: "Emergency Exit", icon: AlertTriangle, color: "bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/30 dark:border-rose-800" },
  { id: "cafe",        label: "Café Corner",  icon: Coffee,      color: "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/30 dark:border-orange-800" },
];

export function OfficeAmbient() {
  return (
    <div className="w-full mb-4">
      {/* Walkway indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold px-2">
          ← Main Corridor →
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
      </div>

      {/* Room row */}
      <div className="flex flex-wrap gap-2">
        {ROOMS.map((room) => {
          const Icon = room.icon;
          return (
            <div
              key={room.id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium",
                "transition-colors cursor-default select-none",
                room.color,
              )}
            >
              <Icon className="w-3 h-3 flex-shrink-0" />
              {room.label}
            </div>
          );
        })}
      </div>

      {/* Secondary walkway */}
      <div className="flex items-center gap-2 mt-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-100 dark:via-gray-800 to-transparent" />
        <span className="text-[9px] text-gray-300 dark:text-gray-600 uppercase tracking-widest font-semibold px-2">
          Seating Area Below
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-100 dark:via-gray-800 to-transparent" />
      </div>
    </div>
  );
}
