// components/Navbar.tsx
import Link from "next/link";
import { LayoutDashboard, Database, Calculator, Award } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-slate-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">
          SPK Software Project Management Terbaik
        </h1>
        <div className="flex gap-6 text-sm">
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-blue-400"
          >
            <LayoutDashboard size={18} /> Home
          </Link>
          <Link
            href="/criteria"
            className="flex items-center gap-2 hover:text-blue-400"
          >
            <Calculator size={18} /> Kriteria (AHP)
          </Link>
          <Link
            href="/alternative"
            className="flex items-center gap-2 hover:text-blue-400"
          >
            <Database size={18} /> Alternatif
          </Link>
          <Link
            href="/calculation"
            className="flex items-center gap-2 hover:text-blue-400"
          >
            <Award size={18} /> Hasil (SAW)
          </Link>
        </div>
      </div>
    </nav>
  );
}
