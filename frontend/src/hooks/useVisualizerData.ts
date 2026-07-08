import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Seat, Employee, FloorUtilization, Project } from "@/types/visualizer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
  return res.json();
}

// ─── Seats ──────────────────────────────────────────────────────────────────
export function useSeats(floorId: number | null, params?: Record<string, string>) {
  return useQuery<Seat[]>({
    queryKey: ["seats", floorId, params],
    queryFn: () => {
      const p = new URLSearchParams({ limit: "1200" });
      if (floorId) p.set("floor_id", String(floorId));
      if (params) Object.entries(params).forEach(([k, v]) => v && p.set(k, v));
      return fetchJSON<Seat[]>(`${API}/seats/?${p}`);
    },
    enabled: floorId !== null,
    staleTime: 30_000,
  });
}

// ─── Floor Utilization ───────────────────────────────────────────────────────
export function useFloorUtilization() {
  return useQuery<FloorUtilization[]>({
    queryKey: ["floor-utilization"],
    queryFn: () => fetchJSON<FloorUtilization[]>(`${API}/dashboard/floor-utilization`),
    staleTime: 30_000,
  });
}

// ─── Projects ────────────────────────────────────────────────────────────────
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => fetchJSON<Project[]>(`${API}/projects/?limit=100`),
    staleTime: 60_000,
  });
}

// ─── Employee detail ─────────────────────────────────────────────────────────
export function useEmployee(id: number | null) {
  return useQuery<Employee>({
    queryKey: ["employee", id],
    queryFn: () => fetchJSON<Employee>(`${API}/employees/${id}`),
    enabled: id !== null,
  });
}

// ─── Allocate Seat ───────────────────────────────────────────────────────────
export function useAllocateSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { employee_id: number; seat_id: number }) =>
      fetch(`${API}/seats/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).detail);
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seats"] });
      qc.invalidateQueries({ queryKey: ["floor-utilization"] });
    },
  });
}

// ─── Release Seat ────────────────────────────────────────────────────────────
export function useReleaseSeat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seatId: number) =>
      fetch(`${API}/seats/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seat_id: seatId }),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).detail);
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seats"] });
      qc.invalidateQueries({ queryKey: ["floor-utilization"] });
    },
  });
}

// ─── Employee Search ─────────────────────────────────────────────────────────
export function useEmployeeSearch(query: string) {
  return useQuery<Employee[]>({
    queryKey: ["employee-search", query],
    queryFn: () =>
      fetchJSON<Employee[]>(`${API}/employees/?search=${encodeURIComponent(query)}&limit=20`),
    enabled: query.length >= 2,
    staleTime: 10_000,
  });
}
