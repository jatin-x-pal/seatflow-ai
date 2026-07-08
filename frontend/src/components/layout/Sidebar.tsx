"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Briefcase, Armchair,
  BarChart3, Sparkles, UserPlus, FolderPlus, Map,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Dashboard",        icon: LayoutDashboard },
  { href: "/employees",   label: "Employees",         icon: Users          },
  { href: "/projects",    label: "Projects",          icon: Briefcase      },
  { href: "/seats",       label: "Workspace",         icon: Armchair       },
  { href: "/visualizer",  label: "Floor Visualizer",  icon: Map            },
  { href: "/analytics",   label: "Analytics",         icon: BarChart3      },
];

const ACTION_ITEMS = [
  { href: "/employees/new", label: "Add Employee", icon: UserPlus },
  { href: "/projects/new", label: "Create Project", icon: FolderPlus },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-gray-950 h-screen text-white flex flex-col border-r border-gray-800 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Armchair className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">SeatFlow AI</span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-indigo-400" : ""}`} />
              {label}
            </Link>
          );
        })}

        {/* Actions section */}
        <div className="pt-5 pb-1.5 px-1">
          <p className="text-[10px] uppercase font-bold text-gray-600 tracking-widest">Quick Actions</p>
        </div>
        {ACTION_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 transition-colors"
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* AI Button */}
      <div className="p-3 border-t border-gray-800">
        <Link
          href="/ai"
          className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
            pathname === "/ai"
              ? "bg-indigo-600 text-white"
              : "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Ask SeatFlow AI
        </Link>
      </div>
    </aside>
  );
}
