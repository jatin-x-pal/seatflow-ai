"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, UserPlus, Pencil, Trash2, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface Employee {
  id: number;
  employee_code: string;
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  department_id?: number;
  project_id?: number;
  seat_id?: number;
  joining_date?: string;
  status: string;
}

interface Project {
  id: number;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  PendingAllocation: "bg-amber-100 text-amber-700",
  Inactive: "bg-gray-100 text-gray-600",
};

const SEAT_STATUS_OPTIONS = ["", "Available", "Occupied", "Reserved"];
const PAGE_SIZE = 50;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterFloor, setFilterFloor] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterSeatStatus, setFilterSeatStatus] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchEmployees = useCallback(async (currentPage = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: String(currentPage * PAGE_SIZE),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (filterProject) params.set("project_name", filterProject);
      if (filterFloor) params.set("floor_number", filterFloor);
      if (filterZone) params.set("zone", filterZone);
      if (filterSeatStatus) params.set("seat_status", filterSeatStatus);
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`${API}/employees/?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEmployees(data);
      // Approximate total for pagination (exact count would need a separate endpoint)
      if (data.length === PAGE_SIZE) setTotal((currentPage + 2) * PAGE_SIZE);
      else setTotal(currentPage * PAGE_SIZE + data.length);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterProject, filterFloor, filterZone, filterSeatStatus, filterStatus]);

  useEffect(() => {
    fetch(`${API}/projects/?limit=100`)
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      fetchEmployees(0);
    }, 400);
  }, [fetchEmployees]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this employee?")) return;
    await fetch(`${API}/employees/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchEmployees(page);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const payload: Record<string, string | number | null> = {
      name: form.get("name") as string,
      email: form.get("email") as string,
      phone: (form.get("phone") as string) || null,
      designation: (form.get("designation") as string) || null,
      employee_code: form.get("employee_code") as string,
      status: (form.get("status") as string) || "Active",
      project_id: form.get("project_id") ? Number(form.get("project_id")) : null,
    };

    try {
      const url = editEmp ? `${API}/employees/${editEmp.id}` : `${API}/employees/`;
      const method = editEmp ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Failed to save employee");
      } else {
        setShowModal(false);
        setEditEmp(null);
        fetchEmployees(page);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Directory</h1>
          <p className="text-gray-500 mt-1">Search, manage, and allocate employees</p>
        </div>
        <button
          onClick={() => { setEditEmp(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <UserPlus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <input
            className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Project name..."
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          />
          <input
            className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Floor (1–5)..."
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
          />
          <input
            className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Zone (A–J)..."
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
          />
          <select
            className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterSeatStatus}
            onChange={(e) => setFilterSeatStatus(e.target.value)}
          >
            <option value="">Seat Status (All)</option>
            {SEAT_STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
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
                {["Code", "Name", "Email", "Designation", "Project", "Seat", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">No employees found.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{emp.employee_code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.email}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.designation || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {projects.find((p) => p.id === emp.project_id)?.name || (emp.project_id ? `P#${emp.project_id}` : "—")}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {emp.seat_id ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Seat #{emp.seat_id}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Unallocated</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[emp.status] || "bg-gray-100 text-gray-600"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditEmp(emp); setShowModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-400">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of ~{total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => { const p = page - 1; setPage(p); fetchEmployees(p); }}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={employees.length < PAGE_SIZE}
              onClick={() => { const p = page + 1; setPage(p); fetchEmployees(p); }}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">{editEmp ? "Edit Employee" : "Add Employee"}</h2>
              <button onClick={() => { setShowModal(false); setEditEmp(null); }} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Employee Code *</label>
                  <input name="employee_code" defaultValue={editEmp?.employee_code} required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
                  <select name="status" defaultValue={editEmp?.status || "Active"}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Active">Active</option>
                    <option value="PendingAllocation">PendingAllocation</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Full Name *</label>
                <input name="name" defaultValue={editEmp?.name} required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Email *</label>
                <input name="email" type="email" defaultValue={editEmp?.email} required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
                  <input name="phone" defaultValue={editEmp?.phone}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Designation</label>
                  <input name="designation" defaultValue={editEmp?.designation}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Project</label>
                <select name="project_id" defaultValue={editEmp?.project_id || ""}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Unassigned</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditEmp(null); }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editEmp ? "Save Changes" : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
