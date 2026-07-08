import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SeatStatus, Seat, ZoneGroup, BayGroup } from "@/types/visualizer";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Status config ───────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<
  SeatStatus,
  { label: string; dot: string; bg: string; text: string; border: string; ring: string }
> = {
  Available: {
    label: "Available",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    ring: "ring-emerald-400",
  },
  Occupied: {
    label: "Occupied",
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    ring: "ring-blue-400",
  },
  Reserved: {
    label: "Reserved",
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    ring: "ring-amber-400",
  },
  Maintenance: {
    label: "Maintenance",
    dot: "bg-gray-400",
    bg: "bg-gray-50 dark:bg-gray-800/40",
    text: "text-gray-500 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
    ring: "ring-gray-400",
  },
};

// ─── Group seats into zones → bays ──────────────────────────────────────────
export function groupSeatsByZone(seats: Seat[]): ZoneGroup[] {
  const zoneMap = new Map<string, Map<string, Seat[]>>();

  for (const seat of seats) {
    const zone = seat.zone || "Z";
    // Derive bay from seat number pattern: F1-A-001 → bay "A", or split by chunks of 10
    const parts = seat.seat_number.split("-");
    const bayRaw = parts.length >= 3 ? parts[1] : Math.ceil(seats.indexOf(seat) / 10).toString();
    const bay = bayRaw || "1";

    if (!zoneMap.has(zone)) zoneMap.set(zone, new Map());
    const bayMap = zoneMap.get(zone)!;
    if (!bayMap.has(bay)) bayMap.set(bay, []);
    bayMap.get(bay)!.push(seat);
  }

  return Array.from(zoneMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([zone, bayMap]) => ({
      zone,
      bays: Array.from(bayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([bay, bSeats]) => ({
          bay,
          seats: bSeats.sort((a, b) => a.seat_number.localeCompare(b.seat_number)),
        })),
      seats: Array.from(bayMap.values()).flat(),
    }));
}

// ─── Initials ────────────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── Zone color ──────────────────────────────────────────────────────────────
const ZONE_PALETTE = [
  "from-indigo-500/10 to-indigo-500/5 border-indigo-200/50",
  "from-violet-500/10 to-violet-500/5 border-violet-200/50",
  "from-sky-500/10 to-sky-500/5 border-sky-200/50",
  "from-emerald-500/10 to-emerald-500/5 border-emerald-200/50",
  "from-amber-500/10 to-amber-500/5 border-amber-200/50",
  "from-rose-500/10 to-rose-500/5 border-rose-200/50",
  "from-cyan-500/10 to-cyan-500/5 border-cyan-200/50",
  "from-purple-500/10 to-purple-500/5 border-purple-200/50",
  "from-teal-500/10 to-teal-500/5 border-teal-200/50",
  "from-orange-500/10 to-orange-500/5 border-orange-200/50",
];

export function getZoneGradient(zoneIndex: number): string {
  return ZONE_PALETTE[zoneIndex % ZONE_PALETTE.length];
}
