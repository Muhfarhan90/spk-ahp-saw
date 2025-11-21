"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  Database,
  Award,
  Menu,
  X,
  Users,
} from "lucide-react";

const MENUS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Alternatif", href: "/alternative", icon: Database },
  { name: "Kriteria", href: "/criteria", icon: Calculator },
  { name: "Hasil", href: "/calculation", icon: Award },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* --- 1. SIDEBAR DESKTOP (Tetap ada di layar besar) --- */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col h-screen fixed left-0 top-0 shadow-xl z-50">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Award size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">SPK SYSTEM</h1>
            <p className="text-xs text-slate-400">Project Management</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {MENUS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Info Kelompok */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Kelompok 2
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Kelas SPK B</p>
            <div className="mt-2 pt-2 border-t border-slate-700">
              <p className="text-[10px] text-slate-500">© 2025 SPK System</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- 2. MOBILE HEADER (Hanya muncul di layar kecil) --- */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white z-50 shadow-md h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded">
            <Award size={20} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide">SPK SYSTEM</span>
            <p className="text-[10px] text-slate-400">Kelompok 2 - SPK B</p>
          </div>
        </div>

        {/* Tombol Hamburger */}
        <button
          onClick={toggleMenu}
          className="p-2 text-slate-300 hover:text-white"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* --- 3. MOBILE MENU DROPDOWN --- */}
      {/* Overlay Background */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Menu List */}
      <div
        className={`md:hidden fixed top-16 left-0 right-0 bg-slate-800 border-t border-slate-700 shadow-xl z-40 transition-all duration-300 ease-in-out origin-top ${
          isOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 h-0"
        }`}
      >
        <nav className="flex flex-col p-4 space-y-2">
          {MENUS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Mobile */}
        <div className="px-4 pb-4">
          <div className="bg-slate-700 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users size={14} className="text-blue-400" />
              <span className="text-xs font-bold text-slate-300">
                Kelompok 2
              </span>
            </div>
            <p className="text-xs text-slate-400">Kelas SPK B</p>
          </div>
        </div>
      </div>
    </>
  );
}
