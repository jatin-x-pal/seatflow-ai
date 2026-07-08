// ============================================================
// SeatFlow AI — Floor Visualizer Type Definitions
// ============================================================

export type SeatStatus = "Available" | "Occupied" | "Reserved" | "Maintenance";

export interface Building {
  id: number;
  name: string;
  address?: string;
}

export interface Floor {
  id: number;
  building_id?: number;
  floor_number: string;
  name?: string;
}

export interface SeatEmployee {
  id: number;
  name: string;
  employee_code: string;
  email?: string;
  designation?: string;
}

export interface Seat {
  id: number;
  seat_number: string;
  floor_id: number;
  zone: string;
  seat_type: string;
  status: SeatStatus;
  employee?: SeatEmployee;
  floor?: { id: number; floor_number: string };
}

export interface Employee {
  id: number;
  employee_code: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: { id: number; name: string };
  project?: { id: number; name: string };
  seat_id?: number;
  seat?: Seat;
  status: string;
  joining_date?: string;
  created_at?: string;
}

export interface Project {
  id: number;
  name: string;
  status: string;
}

export interface FloorUtilization {
  floor_id: number;
  floor_number: string;
  total_seats: number;
  occupied: number;
  available: number;
  reserved: number;
  utilization_pct: number;
}

export interface ZoneGroup {
  zone: string;
  seats: Seat[];
  bays: BayGroup[];
}

export interface BayGroup {
  bay: string;
  seats: Seat[];
}

export type ViewMode = "floor" | "list";

export interface Filters {
  statuses: SeatStatus[];
  projectId: number | null;
  zone: string | null;
}

export interface VisualizerState {
  selectedFloorId: number | null;
  selectedSeat: Seat | null;
  drawerOpen: boolean;
  zoom: number;
  search: string;
  filters: Filters;
  viewMode: ViewMode;
  highlightedSeatId: number | null;
}
