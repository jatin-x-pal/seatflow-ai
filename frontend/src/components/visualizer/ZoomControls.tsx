"use client";

import { ZoomIn, ZoomOut, RotateCcw, Layers } from "lucide-react";
import { cn } from "@/lib/visualizer-utils";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  compact: boolean;
  onToggleCompact: () => void;
}

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  compact,
  onToggleCompact,
}: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
      <ControlBtn onClick={onZoomOut} disabled={zoom <= 0.5} title="Zoom out">
        <ZoomOut className="w-3.5 h-3.5" />
      </ControlBtn>

      <button
        onClick={onReset}
        title="Reset zoom"
        className="px-2 py-1.5 text-xs font-mono font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-w-[3rem]"
      >
        {Math.round(zoom * 100)}%
      </button>

      <ControlBtn onClick={onZoomIn} disabled={zoom >= 2} title="Zoom in">
        <ZoomIn className="w-3.5 h-3.5" />
      </ControlBtn>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

      <ControlBtn onClick={onReset} title="Reset view">
        <RotateCcw className="w-3.5 h-3.5" />
      </ControlBtn>

      <ControlBtn
        onClick={onToggleCompact}
        title={compact ? "Expanded view" : "Compact view"}
        active={compact}
      >
        <Layers className="w-3.5 h-3.5" />
      </ControlBtn>
    </div>
  );
}

function ControlBtn({
  children,
  onClick,
  disabled,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        active
          ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
          : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
        "disabled:opacity-30 disabled:cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}
