/**
 * Sidebar.tsx — Persistent navigation sidebar
 * 
 * ARCHITECTURAL NOTE:
 * Uses Next.js usePathname() for active-route highlighting.
 * On mobile, the sidebar collapses into a hamburger menu.
 * In future phases, sidebar items may be dynamically rendered
 * based on user roles fetched from Supabase Auth.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShieldAlert,
    Settings,
    Menu,
    X,
    Boxes,
    History,
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Global Dashboard', icon: LayoutDashboard },
    { href: '/crisis', label: 'Crisis Center', icon: ShieldAlert },
    { href: '/history', label: 'Crisis History', icon: History },
    { href: '/settings', label: 'Agent Config', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* ── Mobile hamburger button ─────────────────────────────── */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-14 left-4 z-50 p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="Open navigation"
            >
                <Menu size={20} />
            </button>

            {/* ── Mobile overlay ──────────────────────────────────────── */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/60"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Sidebar panel ───────────────────────────────────────── */}
            <aside
                className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800
          flex flex-col transition-transform duration-300
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                {/* Brand header */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Boxes size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white leading-tight">
                                Smart Supply Chain
                            </h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                Optimizer
                            </p>
                        </div>
                    </Link>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white"
                        aria-label="Close navigation"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation links */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }
                `}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 leading-relaxed">
                        <p>CrewAI Multi-Agent System</p>
                        <p className="mt-0.5">Powered by Google Gemini · Supabase</p>
                    </div>
                </div>
            </aside>
        </>
    );
}
