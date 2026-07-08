"use client";

import { useState, useCallback } from "react";
import { Bell, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface SearchResult {
  id: number;
  name: string;
  type: string;
  subtitle?: string;
}

export function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const [empRes, projRes] = await Promise.all([
        fetch(`${API}/employees/?search=${encodeURIComponent(q)}&limit=5`),
        fetch(`${API}/projects/?search=${encodeURIComponent(q)}&limit=5`),
      ]);
      const employees = await empRes.json();
      const projects = await projRes.json();
      const combined: SearchResult[] = [
        ...employees.map((e: { id: number; name: string; employee_code: string; designation?: string }) => ({
          id: e.id, name: e.name, type: "Employee",
          subtitle: `${e.employee_code} · ${e.designation || "Employee"}`,
        })),
        ...projects.map((p: { id: number; name: string; status: string }) => ({
          id: p.id, name: p.name, type: "Project", subtitle: p.status,
        })),
      ];
      setResults(combined);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (r: SearchResult) => {
    setQuery("");
    setOpen(false);
    if (r.type === "Employee") router.push(`/employees`);
    else router.push(`/projects`);
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-30 w-full shadow-sm">
      {/* Search */}
      <div className="relative">
        <div className={`flex items-center bg-gray-100 hover:bg-gray-150 rounded-xl px-3 py-2 w-72 transition-all ${open ? "ring-2 ring-indigo-400" : ""}`}>
          <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search employees, projects…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); }}
            onFocus={() => query.length >= 2 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }}>
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden z-50">
            {results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}-${i}`}
                onMouseDown={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b last:border-0 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.subtitle}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  r.type === "Employee" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {r.type}
                </span>
              </button>
            ))}
          </div>
        )}
        {open && loading && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl border border-gray-100 shadow-xl px-4 py-3 text-sm text-gray-400">
            Searching…
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>
        <div className="flex items-center space-x-2.5 cursor-pointer hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full text-white flex items-center justify-center font-bold text-xs">
            AD
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-700 leading-none">Admin User</p>
            <p className="text-xs text-gray-400 mt-0.5">HR Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
