"use client";

import {
  useState, useRef, useCallback, useMemo,
  useEffect, WheelEvent, MouseEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Layers, PanelLeftClose, PanelLeftOpen,
  Building2, AlertCircle, MapPin,
} from "lucide-react";

import { QueryProvider }      from "@/components/visualizer/QueryProvider";
import { FloorSelector }      from "@/components/visualizer/FloorSelector";
import { SearchBar }          from "@/components/visualizer/SearchBar";
import { Legend }             from "@/components/visualizer/Legend";
import { FiltersPanel }       from "@/components/visualizer/FiltersPanel";
import { ZoomControls }       from "@/components/visualizer/ZoomControls";
import { ZoneSection }        from "@/components/visualizer/ZoneSection";
import { OfficeAmbient }      from "@/components/visualizer/OfficeAmbient";
import { SeatDetailsDrawer }  from "@/components/visualizer/SeatDetailsDrawer";
import { AnalyticsPanel }     from "@/components/visualizer/AnalyticsPanel";

import {
  useSeats,
  useFloorUtilization,
  useProjects,
} from "@/hooks/useVisualizerData";
import { groupSeatsByZone }   from "@/lib/visualizer-utils";
import type { Seat, SeatStatus, Filters } from "@/types/visualizer";

const ALL_STATUSES: SeatStatus[] = ["Available", "Occupied", "Reserved", "Maintenance"];

// ─── Inner visualizer (runs inside QueryProvider) ─────────────────────────
function FloorVisualizerInner() {
  // ── Global state
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat]       = useState<Seat | null>(null);
  const [drawerOpen, setDrawerOpen]           = useState(false);
  const [highlightedSeatId, setHL]            = useState<number | null>(null);
  const [leftPanelOpen, setLeftPanelOpen]     = useState(true);
  const [rightPanelOpen, setRightPanelOpen]   = useState(true);
  const [compact, setCompact]                 = useState(false);
  const [filters, setFilters]                 = useState<Filters>({
    statuses: ALL_STATUSES,
    projectId: null,
    zone: null,
  });

  // ── Zoom / pan
  const [zoom, setZoom]     = useState(1);
  const [pan, setPan]       = useState({ x: 0, y: 0 });
  const isPanning           = useRef(false);
  const lastPan             = useRef({ x: 0, y: 0 });
  const canvasRef           = useRef<HTMLDivElement>(null);

  // ── Data
  const { data: floorUtils = [], isLoading: floorLoading } = useFloorUtilization();
  const { data: projects    = [] }                         = useProjects();
  const { data: seats = [], isLoading: seatsLoading, refetch, dataUpdatedAt } = useSeats(
    selectedFloorId,
    { ...(filters.zone ? { zone: filters.zone } : {}) }
  );

  // Auto-select first floor
  useEffect(() => {
    if (floorUtils.length > 0 && selectedFloorId === null) {
      setSelectedFloorId(floorUtils[0].floor_id);
    }
  }, [floorUtils, selectedFloorId]);

  // Clear highlights after 4s
  useEffect(() => {
    if (highlightedSeatId === null) return;
    const t = setTimeout(() => setHL(null), 4000);
    return () => clearTimeout(t);
  }, [highlightedSeatId]);

  // ── Derived data
  const filteredSeats = useMemo(() => {
    return seats.filter((s) => {
      if (!filters.statuses.includes(s.status as SeatStatus)) return false;
      if (filters.zone && s.zone !== filters.zone) return false;
      if (filters.projectId) {
        const empProjId = (s.employee as unknown as { project_id?: number } | undefined)?.project_id;
        if (empProjId !== filters.projectId) return false;
      }
      return true;
    });
  }, [seats, filters]);

  const zones = useMemo(() => groupSeatsByZone(filteredSeats), [filteredSeats]);
  const allZones = useMemo(() => [...new Set(seats.map((s) => s.zone).filter(Boolean))].sort(), [seats]);
  const currentFloorUtil = floorUtils.find((f) => f.floor_id === selectedFloorId) ?? null;

  // ── Interactions
  const handleSeatClick = useCallback((seat: Seat) => {
    setSelectedSeat(seat);
    setDrawerOpen(true);
  }, []);

  const handleZoomIn  = () => setZoom((z) => Math.min(z + 0.15, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.5));
  const handleReset   = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Wheel zoom
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => Math.max(0.5, Math.min(2, z + delta)));
  }, []);

  // Drag pan
  const onMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("[role='button']")) return;
    isPanning.current = true;
    lastPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!isPanning.current) return;
    setPan({ x: e.clientX - lastPan.current.x, y: e.clientY - lastPan.current.y });
  };
  const onMouseUp = () => { isPanning.current = false; };

  const selectedFloorUtil = floorUtils.find((f) => f.floor_id === selectedFloorId);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-gray-950 overflow-hidden">

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 shadow-sm">
        {/* Row 1: Title + actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle filters"
            >
              {leftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-600">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">Floor Visualizer</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedFloorUtil
                    ? `Floor ${selectedFloorUtil.floor_number} · ${selectedFloorUtil.total_seats} seats`
                    : "Select a floor"}
                </p>
              </div>
            </div>
            {seatsLoading && (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <SearchBar
              seats={seats}
              onHighlight={setHL}
              onSelect={(seat) => { setHL(seat.id); handleSeatClick(seat); }}
            />
            <button
              onClick={() => refetch()}
              title="Refresh"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRightPanelOpen((v) => !v)}
              title="Toggle analytics"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Floor selector + Legend + Zoom */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <FloorSelector
            floors={floorUtils}
            selectedFloorId={selectedFloorId}
            onSelect={(id) => { setSelectedFloorId(id); setPan({ x: 0, y: 0 }); }}
            loading={floorLoading}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <Legend
              activeStatuses={filters.statuses}
              onToggle={(s) => {
                const next = filters.statuses.includes(s)
                  ? filters.statuses.filter((x) => x !== s)
                  : [...filters.statuses, s];
                setFilters({ ...filters, statuses: next.length === 0 ? ALL_STATUSES : next });
              }}
            />
            <ZoomControls
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleReset}
              compact={compact}
              onToggleCompact={() => setCompact((v) => !v)}
            />
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel — Filters */}
        <AnimatePresence initial={false}>
          {leftPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 216, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="border-r border-gray-100 dark:border-gray-800 overflow-hidden flex-shrink-0"
            >
              <div className="p-3 h-full overflow-y-auto w-[216px]">
                <FiltersPanel
                  filters={filters}
                  projects={projects}
                  zones={allZones}
                  onChange={setFilters}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Centre — Floor canvas */}
        <div
          className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* Skeleton loader */}
          {seatsLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Loading floor data…</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!seatsLoading && zones.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No seats match your filters</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting the status or zone filters</p>
              </div>
            </div>
          )}

          {/* Zoomable / pannable canvas */}
          <div
            ref={canvasRef}
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: "top left",
              transition: isPanning.current ? "none" : "transform 0.15s ease",
            }}
            className="p-5 min-w-max"
          >
            {/* Office ambient elements */}
            <OfficeAmbient />

            {/* Last updated */}
            {dataUpdatedAt > 0 && (
              <p className="text-[10px] text-gray-400 mb-3 font-mono">
                Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
              </p>
            )}

            {/* Zone grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {zones.map((zone, idx) => (
                <ZoneSection
                  key={zone.zone}
                  zone={zone}
                  zoneIndex={idx}
                  selectedSeatId={selectedSeat?.id ?? null}
                  highlightedSeatId={highlightedSeatId}
                  onSeatClick={handleSeatClick}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — Analytics */}
        <AnimatePresence initial={false}>
          {rightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 224, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="border-l border-gray-100 dark:border-gray-800 overflow-hidden flex-shrink-0"
            >
              <div className="p-3 h-full overflow-y-auto w-[224px]">
                <AnalyticsPanel
                  seats={filteredSeats}
                  floorUtil={currentFloorUtil}
                  loading={seatsLoading}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Seat Detail Drawer */}
      <SeatDetailsDrawer
        seat={selectedSeat}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedSeat(null); }}
      />
    </div>
  );
}

// ─── Page export (wraps with QueryProvider) ────────────────────────────────
export default function FloorVisualizerPage() {
  return (
    <QueryProvider>
      <div className="h-full">
        <FloorVisualizerInner />
      </div>
    </QueryProvider>
  );
}
