"use client";

import { useEffect, useState, useCallback } from "react";
import { Briefcase, Users, ChevronRight, Loader2, X, Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface Project {
  id: number;
  name: string;
  client?: string;
  manager?: string;
  technology?: string;
  status: string;
  created_at: string;
}

interface Employee {
  id: number;
  employee_code: string;
  name: string;
  email: string;
  designation?: string;
  seat_id?: number;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-gray-100 text-gray-600",
  Completed: "bg-blue-100 text-blue-700",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Employee[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API}/projects/?limit=100`)
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openProject = useCallback(async (project: Project) => {
    setSelectedProject(project);
    setMembersLoading(true);
    setMembers([]);
    try {
      const res = await fetch(`${API}/projects/${project.id}/employees?limit=200`);
      const data = await res.json();
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.client || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <p className="text-gray-500 mt-1">View projects and their assigned employees</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((project) => (
            <button
              key={project.id}
              onClick={() => openProject(project)}
              className="text-left bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                  <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status] || "bg-gray-100 text-gray-600"}`}>
                  {project.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{project.name}</h3>
              {project.client && <p className="text-xs text-gray-400 mt-0.5">Client: {project.client}</p>}
              {project.technology && <p className="text-xs text-gray-400 mt-0.5">Tech: {project.technology}</p>}
              {project.manager && <p className="text-xs text-gray-400 mt-0.5">Manager: {project.manager}</p>}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="h-3.5 w-3.5" /> View members
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Members Side Panel */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedProject.name}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">{members.length} members</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {membersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No employees assigned to this project.</p>
              ) : (
                <div className="space-y-2">
                  {members.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-100 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.employee_code} · {emp.designation || "Employee"}</p>
                      </div>
                      <div className="text-right">
                        {emp.seat_id ? (
                          <span className="text-xs text-emerald-600 font-medium">Seat #{emp.seat_id}</span>
                        ) : (
                          <span className="text-xs text-amber-500">Unallocated</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
