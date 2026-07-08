"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, CheckCircle2, XCircle, ShieldAlert, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface Floor {
  id: number;
  floor_number: string;
}

interface SeatEmployee {
  id: number;
  name: string;
  employee_code: string;
}

interface Seat {
  id: number;
  seat_number: string;
  floor_id: number;
  zone: string;
  seat_type?: string;
  status: string;
  employee?: SeatEmployee;
  floor?: Floor;
}

interface Employee {
  id: number;
  name: string;
  employee_code: string;
  seat_id?: number;
}

const STATUS_BADGE: Record<string, { cls: string; icon: React.ElementType }> = {
  Available: { cls: "bg-emerald-100 text-emerald-700", icon: XCircle },
  Occupied: { cls: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  Reserved: { cls: "bg-amber-100 text-amber-700", icon: ShieldAlert },
};

const PAGE_SIZE = 100;

export default function SeatsPage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterFloor, setFilterFloor] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [search, setSearch] = useState("");

  // Allocate modal
  const [allocateSeat, setAllocateSeat] = useState<Seat | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [saving, setSaving] = useState(false);
  const [empSearch, setEmpSearch] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchSeats = useCallback(async (currentPage = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: String(currentPage * PAGE_SIZE),
        limit: String(PAGE_SIZE),
      });
      if (filterStatus) params.set("status", filterStatus);
      if (filterFloor) params.set("floor_number", filterFloor);
      if (filterZone) params.set("zone", filterZone);

      const res = await fetch(`${API}/seats/?${params}`);
      const data = await res.json();
      // Filter by seat_number search client-side (quick UX)
      const filtered = search
        ? data.filter((s: Seat) => s.seat_number.toLowerCase().includes(search.toLowerCase()))
        : data;
      setSeats(filtered);
    } catch {
      setSeats([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterFloor, filterZone, search]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      fetchSeats(0);
    }, 400);
  }, [fetchSeats]);

  useEffect(() => {
    // Pre-fetch floors list
    fetch(`${API}/dashboard/floor-utilization`)
      .then((r) => r.json())
      .then((data) => setFloors(data.map((f: { floor_id: number; floor_number: string }) => ({ id: f.floor_id, floor_number: f.floor_number }))))
      .catch(() => {});
  }, []);

  const fetchEmployeesForModal = async (q: string) => {
    const params = new URLSearchParams({ search: q, limit: "20", seat_status: "Available" });
    const res = await fetch(`${API}/employees/?${params}`);
    const data = await res.json();
    // Only show employees without seats
    setEmployees(data.filter((e: Employee) => !e.seat_id));
  };

  const handleAllocate = async () => {
    if (!allocateSeat || !selectedEmpId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/seats/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: Number(selectedEmpId), seat_id: allocateSeat.id }),
      });
      if (!res.ok) {
        const e = await res.json();
        alert(e.detail || "Allocation failed");
      } else {
        setAllocateSeat(null);
        setSelectedEmpId("");
        fetchSeats(page);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async (seat: Seat) => {
    if (!confirm(`Release seat ${seat.seat_number}?`)) return;
    const res = await fetch(`${API}/seats/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seat_id: seat.id }),
    });
    if (!res.ok) {
      const e = await res.json();
      alert(e.detail || "Release failed");
    } else {
      fetchSeats(page);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seating Matrix</h1>
        <p className="text-gray-500 mt-1">Manage seat allocation and availability</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search seat number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Reserved">Reserved</option>
          </select>
          <select
            className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
          >
            <option value="">All Floors</option>
            {[1, 2, 3, 4, 5].map((f) => (
              <option key={f} value={String(f)}>Floor {f}</option>
            ))}
          </select>
          <select
            className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
          >
            <option value="">All Zones</option>
            {"ABCDEFGHIJ".split("").map((z) => (
              <option key={z} value={z}>Zone {z}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {["Seat #", "Floor", "Zone", "Type", "Status", "Employee", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" /></td></tr>
              ) : seats.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No seats found.</td></tr>
              ) : (
                seats.map((seat) => {
                  const badge = STATUS_BADGE[seat.status] || STATUS_BADGE["Available"];
                  const Icon = badge.icon;
                  return (
                    <tr key={seat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-gray-800 dark:text-gray-200">{seat.seat_number}</td>
                      <td className="px-4 py-3 text-gray-500">Floor {seat.floor?.floor_number || seat.floor_id}</td>
                      <td className="px-4 py-3 text-gray-500">{seat.zone || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{seat.seat_type || "Standard"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
                          <Icon className="h-3 w-3" /> {seat.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {seat.employee ? (
                          <span>{seat.employee.name} <span className="text-gray-400">({seat.employee.employee_code})</span></span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {seat.status === "Available" && (
                          <button
                            onClick={() => { setAllocateSeat(seat); setEmpSearch(""); fetchEmployeesForModal(""); }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                          >
                            Allocate
                          </button>
                        )}
                        {seat.status === "Occupied" && (
                          <button
                            onClick={() => handleRelease(seat)}
                            className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-600 text-xs font-medium hover:bg-rose-200 transition-colors"
                          >
                            Release
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <button
            disabled={page === 0}
            onClick={() => { const p = page - 1; setPage(p); fetchSeats(p); }}
            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-400">Page {page + 1}</span>
          <button
            disabled={seats.length < PAGE_SIZE}
            onClick={() => { const p = page + 1; setPage(p); fetchSeats(p); }}
            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Allocate Modal */}
      {allocateSeat && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold">Allocate Seat</h2>
                <p className="text-sm text-gray-400 mt-0.5">Seat: {allocateSeat.seat_number} — Floor {allocateSeat.floor?.floor_number} / Zone {allocateSeat.zone}</p>
              </div>
              <button onClick={() => setAllocateSeat(null)} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Search Employee (unallocated)</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type name to search..."
                  value={empSearch}
                  onChange={(e) => { setEmpSearch(e.target.value); fetchEmployeesForModal(e.target.value); }}
                />
              </div>
              {employees.length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmpId(String(emp.id))}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors border-b last:border-0 ${selectedEmpId === String(emp.id) ? "bg-indigo-50 text-indigo-700 font-medium" : ""}`}
                    >
                      {emp.name} <span className="text-gray-400">({emp.employee_code})</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setAllocateSeat(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleAllocate}
                  disabled={!selectedEmpId || saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Confirm Allocation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
