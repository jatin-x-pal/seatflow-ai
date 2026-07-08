"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, MapPin, Briefcase, Building2, Calendar,
  CheckCircle2, ShieldAlert, Wrench, Loader2, UserPlus, LogOut, Lock,
} from "lucide-react";
import type { Seat } from "@/types/visualizer";
import { useEmployee, useAllocateSeat, useReleaseSeat } from "@/hooks/useVisualizerData";
import { STATUS_CONFIG, getInitials, cn } from "@/lib/visualizer-utils";

interface SeatDetailsDrawerProps {
  seat: Seat | null;
  open: boolean;
  onClose: () => void;
}

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

export function SeatDetailsDrawer({ seat, open, onClose }: SeatDetailsDrawerProps) {
  const [allocatingEmpId, setAllocatingEmpId] = useState("");
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: employee, isLoading: empLoading } = useEmployee(
    seat?.employee?.id ?? null
  );
  const allocate = useAllocateSeat();
  const release = useReleaseSeat();

  useEffect(() => {
    if (open) setActionMsg(null);
  }, [open, seat]);

  if (!seat) return null;

  const cfg = STATUS_CONFIG[seat.status] || STATUS_CONFIG.Available;
  const gradIdx = seat.employee ? seat.employee.id % AVATAR_GRADIENTS.length : 0;

  const handleAllocate = async () => {
    const empId = parseInt(allocatingEmpId);
    if (!empId) return;
    try {
      await allocate.mutateAsync({ employee_id: empId, seat_id: seat.id });
      setActionMsg({ type: "success", text: "Seat allocated successfully." });
      setAllocatingEmpId("");
    } catch (e: unknown) {
      setActionMsg({ type: "error", text: (e as Error).message });
    }
  };

  const handleRelease = async () => {
    try {
      await release.mutateAsync(seat.id);
      setActionMsg({ type: "success", text: "Seat released successfully." });
    } catch (e: unknown) {
      setActionMsg({ type: "error", text: (e as Error).message });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-950 z-50 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl", cfg.bg, cfg.border, "border")}>
                    <MapPin className={cn("w-5 h-5", cfg.text)} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {seat.seat_number}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                      <span className={cn("text-xs font-semibold", cfg.text)}>{seat.status}</span>
                      {seat.zone && (
                        <>
                          <span className="text-gray-300 text-xs">·</span>
                          <span className="text-xs text-gray-500">Zone {seat.zone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Employee Section */}
              <div className="px-6 py-5">
                {seat.status === "Occupied" && seat.employee ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Assigned Employee</p>
                    {empLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                        <div className={cn(
                          "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0",
                          AVATAR_GRADIENTS[gradIdx]
                        )}>
                          {getInitials(seat.employee.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {employee?.name || seat.employee.name}
                          </p>
                          <p className="text-sm text-gray-400 truncate">{seat.employee.employee_code}</p>
                          {employee?.designation && (
                            <p className="text-xs text-indigo-500 mt-0.5">{employee.designation}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Employee Details */}
                    {employee && (
                      <div className="mt-4 space-y-3">
                        {[
                          { icon: User, label: "Employee ID", value: employee.employee_code },
                          { icon: Building2, label: "Department", value: employee.department?.name },
                          { icon: Briefcase, label: "Project", value: employee.project?.name },
                          { icon: Calendar, label: "Joined", value: employee.joining_date ? new Date(employee.joining_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : undefined },
                        ]
                          .filter((d) => d.value)
                          .map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">{label}</p>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{value}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-3", cfg.bg, "border", cfg.border)}>
                      {seat.status === "Available" && <CheckCircle2 className={cn("w-7 h-7", cfg.text)} />}
                      {seat.status === "Reserved" && <ShieldAlert className={cn("w-7 h-7", cfg.text)} />}
                      {seat.status === "Maintenance" && <Wrench className={cn("w-7 h-7", cfg.text)} />}
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {seat.status === "Available" ? "Seat is available" : `Seat is ${seat.status.toLowerCase()}`}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {seat.status === "Available"
                        ? "This seat can be allocated to an employee"
                        : seat.status === "Reserved"
                        ? "This seat has been reserved and cannot be allocated"
                        : "This seat is under maintenance"}
                    </p>
                  </div>
                )}
              </div>

              {/* Seat Metadata */}
              <div className="px-6 pb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Seat Details</p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 grid grid-cols-2 gap-3">
                  {[
                    { label: "Seat Number", value: seat.seat_number },
                    { label: "Zone", value: seat.zone || "—" },
                    { label: "Type", value: seat.seat_type || "Standard" },
                    { label: "Floor", value: `Floor ${seat.floor?.floor_number || "—"}` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allocate Input (for Available seats) */}
              {seat.status === "Available" && (
                <div className="px-6 pb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Allocate to Employee</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Employee ID"
                      value={allocatingEmpId}
                      onChange={(e) => setAllocatingEmpId(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleAllocate}
                      disabled={!allocatingEmpId || allocate.isPending}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      {allocate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Allocate
                    </button>
                  </div>
                </div>
              )}

              {/* Action message */}
              {actionMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mx-6 mb-5 px-4 py-3 rounded-xl text-sm font-medium",
                    actionMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  )}
                >
                  {actionMsg.text}
                </motion.div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex gap-3">
                {seat.status === "Occupied" && (
                  <button
                    onClick={handleRelease}
                    disabled={release.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {release.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    Release Seat
                  </button>
                )}
                {seat.status === "Reserved" && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-600 text-sm font-medium border border-amber-200">
                    <Lock className="w-4 h-4" />
                    Reserved — Cannot Allocate
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
