import Link from 'next/link';
import { Home, Users, Briefcase, Map, BarChart2 } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 h-screen text-white flex flex-col pt-6">
      <div className="px-6 mb-8 text-2xl font-bold text-sky-400 tracking-wide">
        SeatFlow AI
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded hover:bg-slate-800 transition">
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link href="/employees" className="flex items-center space-x-3 px-4 py-3 rounded hover:bg-slate-800 transition">
          <Users className="w-5 h-5" />
          <span>Employees</span>
        </Link>
        <Link href="/projects" className="flex items-center space-x-3 px-4 py-3 rounded hover:bg-slate-800 transition">
          <Briefcase className="w-5 h-5" />
          <span>Projects</span>
        </Link>
        <Link href="/seats" className="flex items-center space-x-3 px-4 py-3 rounded hover:bg-slate-800 transition">
          <Map className="w-5 h-5" />
          <span>Workspace</span>
        </Link>
        <Link href="/analytics" className="flex items-center space-x-3 px-4 py-3 rounded hover:bg-slate-800 transition">
          <BarChart2 className="w-5 h-5" />
          <span>Analytics</span>
        </Link>
      </nav>
    </aside>
  );
}
