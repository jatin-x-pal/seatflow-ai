"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Seat } from "@/types/visualizer";
import { useEmployeeSearch } from "@/hooks/useVisualizerData";
import { cn } from "@/lib/visualizer-utils";

interface SearchBarProps {
  seats: Seat[];
  onHighlight: (seatId: number | null) => void;
  onSelect: (seat: Seat) => void;
}

export function SearchBar({ seats, onHighlight, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQ(query), 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const { data: employees, isLoading } = useEmployeeSearch(debouncedQ);

  // Seat number match
  const seatMatches = debouncedQ.length >= 2
    ? seats.filter((s) => s.seat_number.toLowerCase().includes(debouncedQ.toLowerCase())).slice(0, 5)
    : [];

  const hasResults = (employees && employees.length > 0) || seatMatches.length > 0;

  const handleSelectEmployee = useCallback((empId: number) => {
    const seat = seats.find((s) => s.employee?.id === empId);
    if (seat) {
      onHighlight(seat.id);
      onSelect(seat);
    }
    setQuery("");
    setOpen(false);
  }, [seats, onHighlight, onSelect]);

  const handleSelectSeat = useCallback((seat: Seat) => {
    onHighlight(seat.id);
    onSelect(seat);
    setQuery("");
    setOpen(false);
  }, [onHighlight, onSelect]);

  const handleClear = () => {
    setQuery("");
    onHighlight(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className={cn(
        "flex items-center gap-2 bg-white dark:bg-gray-900 border rounded-xl px-3 py-2 w-64 transition-all",
        open ? "border-indigo-400 ring-1 ring-indigo-400/30" : "border-gray-200 dark:border-gray-700",
      )}>
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search name, ID, seat…"
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
        />
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 flex-shrink-0" />}
        {query && !isLoading && (
          <button onClick={handleClear}>
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-2xl z-50 overflow-hidden"
          >
            {seatMatches.length > 0 && (
              <div>
                <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 dark:border-gray-800">
                  Seats
                </div>
                {seatMatches.map((seat) => (
                  <button
                    key={seat.id}
                    onMouseDown={() => handleSelectSeat(seat)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{seat.seat_number}</p>
                      {seat.employee && <p className="text-xs text-gray-400">{seat.employee.name}</p>}
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      seat.status === "Available" ? "bg-emerald-100 text-emerald-700" :
                      seat.status === "Occupied" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {seat.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {employees && employees.length > 0 && (
              <div>
                <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 dark:border-gray-800">
                  Employees
                </div>
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onMouseDown={() => handleSelectEmployee(emp.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {emp.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{emp.name}</p>
                      <p className="text-xs text-gray-400 truncate">{emp.employee_code}</p>
                    </div>
                    {emp.seat_id ? (
                      <span className="ml-auto text-xs text-indigo-500 font-medium flex-shrink-0">Has seat</span>
                    ) : (
                      <span className="ml-auto text-xs text-amber-500 font-medium flex-shrink-0">No seat</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
